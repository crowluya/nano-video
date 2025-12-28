/**
 * Video Generation API Route - Unified endpoint for Sora 2 and Sora 2 Pro
 */

import { createActivityLog } from "@/actions/usage/activity-logs";
import { getKieVideoModel } from "@/config/models";
import { apiResponse } from "@/lib/api-response";
import { getSession } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { taskCreditMappings } from "@/lib/db/schema";
import { getKieClient } from "@/lib/kie";
import { calculateVideoCredits, checkKieCredits, deductKieCredits, refundKieCredits } from "@/lib/kie/credits";
import { z } from 'zod';

const inputSchema = z.object({
  images: z.array(z.string().startsWith('data:image/')).optional(),
  prompt: z.string().min(1, "Prompt cannot be empty"),
  modelId: z.string(),
  provider: z.string(),
  // Veo 3.1 parameters
  generationType: z.enum(["TEXT_2_VIDEO", "FIRST_AND_LAST_FRAMES_2_VIDEO", "REFERENCE_2_VIDEO"]).optional(),
  aspectRatio: z.enum(["16:9", "9:16", "Auto", "1:1"]).optional(),
  // Sora 2 parameters
  aspect_ratio: z.enum(["portrait", "landscape"]).optional(),
  n_frames: z.enum(["10", "15"]).optional(),
  size: z.enum(["Standard", "High"]).optional(), // Standard = 720p, High = 1080p
  remove_watermark: z.boolean().optional(),
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
      aspect_ratio,
      n_frames,
      size,
      remove_watermark,
    } = validationResult.data;

    requestedModelId = modelId;

    // Validate provider is kie
    if (provider !== "kie") {
      return apiResponse.badRequest("Only kie.ai provider is supported for video generation");
    }

    // Validate model exists
    const modelConfig = getKieVideoModel(modelId);
    if (!modelConfig) {
      return apiResponse.badRequest(`Unknown video model: ${modelId}`);
    }

    // Calculate credits required
    const creditsRequired = calculateVideoCredits(modelId, size, n_frames);

    // Check credits before proceeding
    const creditCheck = await checkKieCredits('video', modelId, {
      size,
      duration: n_frames,
    });
    if (!creditCheck.hasCredits) {
      return apiResponse.badRequest(
        `Insufficient credits. Required: ${creditCheck.required}, Available: ${creditCheck.available}`
      );
    }

    // Deduct credits before generation
    creditResult = await deductKieCredits('video', modelId, `Video generation: ${prompt.slice(0, 50)}...`, {
      size,
      duration: n_frames,
    });
    if (!creditResult.success) {
      return apiResponse.badRequest(creditResult.error || 'Insufficient credits');
    }

    const creditLogId = creditResult.logId;
    let taskId: string | undefined;

    // Record activity log
    await createActivityLog({
      action: 'video_generation_started',
      resourceType: 'video',
      metadata: {
        modelId,
        prompt: prompt.slice(0, 100),
        creditsUsed: creditResult.creditsDeducted,
      },
    });

    const client = getKieClient();
    let videoUrls: string[] = [];
    let imageUrl: string | undefined;
    let uploadedImageUrls: string[] = [];

    // Upload images if provided
    if (images && images.length > 0) {
      for (const imageBase64DataUri of images) {
        const uploadResult = await client.uploadFileBase64({
          base64Data: imageBase64DataUri.split(',')[1],
          uploadPath: "ai-demo/video-generation",
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

      // For single image, use first URL
      if (uploadedImageUrls.length === 1) {
        imageUrl = uploadedImageUrls[0];
      }
    }

    // Generate video based on model
    if (modelId.startsWith("sora-2")) {
      // Sora 2 - Text to Video or Image to Video
      const soraModel = imageUrl
        ? (modelId.includes("pro") ? "sora-2-pro-image-to-video" : "sora-2-image-to-video")
        : (modelId.includes("pro") ? "sora-2-pro-text-to-video" : "sora-2-text-to-video");

      taskId = await client.generateSora2Video({
        model: soraModel as "sora-2-text-to-video" | "sora-2-image-to-video" | "sora-2-pro-text-to-video" | "sora-2-pro-image-to-video",
        input: {
          prompt,
          image_urls: imageUrl ? [imageUrl] : undefined,
          aspect_ratio: aspect_ratio || "landscape",
          n_frames: n_frames || "10",
          size: size,
          remove_watermark: remove_watermark ?? true,
        },
      });

      // Store taskId -> creditLogId mapping for failure refund
      if (taskId && creditLogId) {
        const session = await getSession();
        const userId = session?.user?.id;
        if (userId) {
          await db.insert(taskCreditMappings).values({
            taskId,
            creditLogId,
            userId,
          }).catch(err => {
            console.error('Failed to store task-credit mapping:', err);
            // Non-critical, continue
          });
        }
      }

      // Return taskId for async tracking
      return apiResponse.success({
        taskId,
        modelId,
        creditsUsed: creditsRequired,
        remainingCredits: creditResult.remainingCredits,
      });
    } else if (modelId.startsWith("veo-3")) {
      const effectiveGenerationType = generationType || (
        uploadedImageUrls.length >= 2
          ? "FIRST_AND_LAST_FRAMES_2_VIDEO"
          : uploadedImageUrls.length >= 1
            ? "REFERENCE_2_VIDEO"
            : "TEXT_2_VIDEO"
      );

      if (effectiveGenerationType === "FIRST_AND_LAST_FRAMES_2_VIDEO") {
        if (uploadedImageUrls.length !== 2) {
          return apiResponse.badRequest("Veo Start/End requires exactly 2 images (start and end frames)");
        }
      }

      if (effectiveGenerationType === "REFERENCE_2_VIDEO") {
        if (uploadedImageUrls.length < 1 || uploadedImageUrls.length > 4) {
          return apiResponse.badRequest("Veo Reference requires 1-4 images");
        }
      }

      taskId = await client.generateVeo3Video({
        prompt,
        model: "veo3_fast",
        generationType: effectiveGenerationType,
        aspectRatio: (aspectRatio as any) || "16:9",
        imageUrls: uploadedImageUrls.length > 0 ? uploadedImageUrls : undefined,
      });

      if (taskId && creditLogId) {
        const session = await getSession();
        const userId = session?.user?.id;
        if (userId) {
          await db.insert(taskCreditMappings).values({
            taskId,
            creditLogId,
            userId,
          }).catch(err => {
            console.error('Failed to store task-credit mapping:', err);
          });
        }
      }

      return apiResponse.success({
        taskId,
        modelId,
        creditsUsed: creditsRequired,
        remainingCredits: creditResult.remainingCredits,
      });
    } else {
      return apiResponse.badRequest(
        `Unsupported video model: ${modelId}. Only Sora 2 / Sora 2 Pro and Veo 3.1 are supported.`
      );
    }
  } catch (error: any) {
    console.error("Video generation failed:", error);
    const errorMessage = error?.message || "Failed to generate video";

    // Refund credits if deduction was successful
    if (creditResult?.success && creditResult.logId) {
      try {
        const refundResult = await refundKieCredits(
          creditResult.creditsDeducted || 0,
          `Refund for failed video generation: ${errorMessage.slice(0, 50)}`,
          creditResult.logId
        );
        if (refundResult.success) {
          console.log(`Credits refunded: ${refundResult.creditsRefunded}`);
        }
      } catch (refundError) {
        console.error('Failed to refund credits:', refundError);
        // Log but don't fail the request
      }
    }

    // Record activity log for failure
    await createActivityLog({
      action: 'video_generation_failed',
      resourceType: 'video',
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

