/**
 * Image Generation API Route
 * Supports Nano Banana, Nano Banana Pro, and Midjourney
 */

import { createActivityLog } from "@/actions/usage/activity-logs";
import { getKieImageModel } from "@/config/models";
import { apiResponse } from "@/lib/api-response";
import { getSession } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { taskCreditMappings, usage as usageSchema } from "@/lib/db/schema";
import { getKieClient } from "@/lib/kie";
import type { MidjourneyTaskType, NanoBananaModel } from "@/lib/kie/types";
import { deductKieCredits, refundKieCredits } from "@/lib/kie/credits";
import { eq } from "drizzle-orm";
import { z } from 'zod';

const inputSchema = z.object({
  images: z.array(z.string().startsWith('data:image/')).optional(),
  prompt: z.string().min(1, "Prompt cannot be empty"),
  modelId: z.string(),
  provider: z.string(),
  generationType: z.enum(["text-to-image", "image-to-image"]),
  aspectRatio: z.enum(["1:1", "16:9", "9:16"]).optional(),
  resolution: z.enum(["1K", "2K", "4K"]).optional(),
  speed: z.enum(["relaxed", "fast", "turbo"]).optional(),
});

export async function POST(req: Request) {
  let creditResult: { success: boolean; logId?: string; creditsDeducted?: number; remainingCredits?: number; error?: string } | undefined;
  let requestedModelId: string | undefined;

  try {
    const rawBody = await req.json();

    const validationResult = inputSchema.safeParse(rawBody);
    if (!validationResult.success) {
      return apiResponse.badRequest(`Invalid input: ${validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
    }

    const {
      images,
      prompt,
      modelId,
      provider,
      generationType,
      aspectRatio,
      resolution,
      speed,
    } = validationResult.data;

    requestedModelId = modelId;

    // Validate provider is kie
    if (provider !== "kie") {
      return apiResponse.badRequest("Only kie.ai provider is supported for image generation");
    }

    // Validate model exists
    const modelConfig = getKieImageModel(modelId);
    if (!modelConfig) {
      return apiResponse.badRequest(`Unknown image model: ${modelId}`);
    }

    // Calculate credits required
    let creditsRequired = 15; // Nano Banana default

    // Nano Banana Pro: 1K/2K = 30, 4K = 60
    if (modelId === "nano-banana-pro") {
      creditsRequired = resolution === "4K" ? 60 : 30;
    }

    // Midjourney: 80 credits
    if (modelId === "midjourney") {
      creditsRequired = 80;
    }

    // Check credits before proceeding
    const session = await getSession();
    if (!session?.user) {
      return apiResponse.unauthorized("Authentication required");
    }

    const user = session.user;

    // Check if user has enough credits
    const usageResults = await db.select({
      oneTimeCreditsBalance: usageSchema.oneTimeCreditsBalance,
      subscriptionCreditsBalance: usageSchema.subscriptionCreditsBalance,
    })
      .from(usageSchema)
      .where(eq(usageSchema.userId, user.id));

    const usage = usageResults[0];
    const totalCredits = (usage?.oneTimeCreditsBalance || 0) + (usage?.subscriptionCreditsBalance || 0);

    if (totalCredits < creditsRequired) {
      return apiResponse.badRequest(`Insufficient credits. Required: ${creditsRequired}, Available: ${totalCredits}`);
    }

    // Deduct credits before generation
    creditResult = await deductKieCredits('image', modelId, `Image generation: ${prompt.slice(0, 50)}...`);
    if (!creditResult.success) {
      return apiResponse.badRequest(creditResult.error || 'Insufficient credits');
    }

    const creditLogId = creditResult.logId;
    let taskId: string | undefined;

    // Record activity log
    await createActivityLog({
      action: 'image_generation_started',
      resourceType: 'image',
      metadata: {
        modelId,
        prompt: prompt.slice(0, 100),
        creditsUsed: creditResult.creditsDeducted,
      },
    });

    const client = getKieClient();
    let uploadedImageUrls: string[] = [];

    // Upload images if provided (for image-to-image)
    if (images && images.length > 0) {
      for (const imageBase64DataUri of images) {
        const uploadResult = await client.uploadFileBase64({
          base64Data: imageBase64DataUri.split(',')[1],
          uploadPath: "ai-demo/image-generation",
          fileName: `input-image-${Date.now()}-${Math.random().toString(36).substring(7)}.png`,
        });

        const uploadedImageUrl = uploadResult?.downloadUrl || uploadResult?.fileUrl;
        if (uploadedImageUrl) {
          uploadedImageUrls.push(uploadedImageUrl);
        }
      }

      if (uploadedImageUrls.length === 0) {
        return apiResponse.serverError("Failed to upload images: No image URLs returned");
      }
    }

    // Generate image based on model
    if (modelId === "google/nano-banana" || modelId === "google/nano-banana-edit" || modelId === "nano-banana-pro") {
      // Nano Banana / Nano Banana Pro
      const nanoModel: NanoBananaModel = modelId === "nano-banana-pro" ? "nano-banana-pro" : modelId === "google/nano-banana-edit" ? "google/nano-banana-edit" : "google/nano-banana";

      const nanoInput: any = {
        prompt,
        aspect_ratio: aspectRatio || "1:1",
      };

      // Add resolution for Pro
      if (modelId === "nano-banana-pro" && resolution) {
        nanoInput.resolution = resolution;
      }

      // Add image URLs for image-to-image
      if (uploadedImageUrls.length > 0) {
        nanoInput.image_urls = uploadedImageUrls;
      }

      taskId = await client.generateNanoBananaImage({
        model: nanoModel,
        input: nanoInput,
      });
    } else if (modelId === "midjourney") {
      // Midjourney
      const mjAspectRatio = aspectRatio === "16:9" ? "16:9" : aspectRatio === "9:16" ? "9:16" : "1:1";
      const taskType: MidjourneyTaskType = generationType === "image-to-image" && uploadedImageUrls.length > 0 ? "mj_img2img" : "mj_txt2img";

      const mjRequest: any = {
        taskType,
        prompt,
        aspectRatio: mjAspectRatio,
        speed: speed || "fast",
      };

      // Add fileUrls for image-to-image
      if (uploadedImageUrls.length > 0) {
        mjRequest.fileUrls = uploadedImageUrls;
      }

      taskId = await client.generateMidjourneyImage(mjRequest);
    } else {
      return apiResponse.badRequest(
        `Unsupported image model: ${modelId}. Only Nano Banana, Nano Banana Pro, and Midjourney are supported.`
      );
    }

    // Store taskId -> creditLogId mapping for failure refund
    if (taskId && creditLogId) {
      await db.insert(taskCreditMappings).values({
        taskId,
        creditLogId,
        userId: user.id,
      }).catch(err => {
        console.error('Failed to store task-credit mapping:', err);
      });
    }

    return apiResponse.success({
      taskId,
      modelId,
      creditsUsed: creditsRequired,
      remainingCredits: creditResult.remainingCredits,
    });
  } catch (error: any) {
    console.error("Image generation failed:", error);
    const errorMessage = error?.message || "Failed to generate image";

    // Refund credits if deduction was successful
    if (creditResult?.success && creditResult.logId) {
      try {
        const refundResult = await refundKieCredits(
          creditResult.creditsDeducted || 0,
          `Refund for failed image generation: ${errorMessage.slice(0, 50)}`,
          creditResult.logId
        );
        if (refundResult.success) {
          console.log(`Credits refunded: ${refundResult.creditsRefunded}`);
        }
      } catch (refundError) {
        console.error('Failed to refund credits:', refundError);
      }
    }

    // Record activity log for failure
    await createActivityLog({
      action: 'image_generation_failed',
      resourceType: 'image',
      metadata: {
        modelId: requestedModelId,
        error: errorMessage,
        creditsRefunded: creditResult?.success || false,
      },
    }).catch(err => console.error('Failed to log activity:', err));

    if (errorMessage.includes("API key") || errorMessage.includes("authentication")) {
      return apiResponse.serverError(`Server configuration error: ${errorMessage}`);
    }
    return apiResponse.serverError(errorMessage);
  }
}
