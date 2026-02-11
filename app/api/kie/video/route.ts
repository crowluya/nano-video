/**
 * Kie.ai Video Generation API Route
 * 
 * Supports: Sora 2, Sora 2 Pro
 * 
 * POST /api/kie/video
 * - Creates a video generation task
 * - Returns taskId for polling status
 */

import { createActivityLog } from "@/actions/usage/activity-logs";
import { getKieVideoModel } from "@/config/models";
import { apiResponse } from "@/lib/api-response";
import { getSession } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { taskCreditMappings } from "@/lib/db/schema";
import { getKieClient } from "@/lib/kie";
import { calculateVideoCredits, deductKieCredits, refundKieCredits } from "@/lib/kie/credits";
import { z } from "zod";

const inputSchema = z.object({
  modelId: z.string().min(1, "Model ID is required"),
  prompt: z.string().min(1, "Prompt is required"),
  // For image-to-video
  imageUrl: z.string().url().optional(),
  imageUrls: z.array(z.string().url()).optional(),
  // Sora 2 specific
  aspectRatio: z.enum(["portrait", "landscape"]).optional(),
  nFrames: z.enum(["10", "15"]).optional(),
  size: z.enum(["Standard", "High"]).optional(), // Standard = 720p, High = 1080p
  removeWatermark: z.boolean().optional(),
});

export async function POST(req: Request) {
  let creditResult: { success: boolean; logId?: string; creditsDeducted?: number; remainingCredits?: number; error?: string } | undefined;

  try {
    const apiKey = process.env.KIE_API_KEY;
    if (!apiKey) {
      return apiResponse.serverError("Server configuration error: Missing KIE_API_KEY");
    }

    const rawBody = await req.json();
    const validationResult = inputSchema.safeParse(rawBody);

    if (!validationResult.success) {
      return apiResponse.badRequest(
        `Invalid input: ${validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
      );
    }

    const { modelId, prompt, ...options } = validationResult.data;

    // Validate model exists
    const modelConfig = getKieVideoModel(modelId);
    if (!modelConfig) {
      return apiResponse.badRequest(`Unknown video model: ${modelId}`);
    }

    // Calculate and deduct credits before generation
    const creditsRequired = calculateVideoCredits(modelId, options.size, options.nFrames);
    creditResult = await deductKieCredits('video', modelId, `Video generation: ${prompt.slice(0, 50)}...`, {
      size: options.size,
      duration: options.nFrames,
    });
    if (!creditResult.success) {
      return apiResponse.badRequest(creditResult.error || 'Insufficient credits');
    }

    // Record activity log
    await createActivityLog({
      action: 'video_generation_started',
      resourceType: 'video',
      metadata: {
        modelId,
        prompt: prompt.slice(0, 100),
        creditsUsed: creditResult.creditsDeducted,
      },
    }).catch(err => console.error('Failed to log activity:', err));

    const client = getKieClient();
    let taskId: string;

    // Route to appropriate generation method based on model
    if (modelId.startsWith("sora-2")) {
      // Sora 2 models
      const hasImage = options.imageUrl || (options.imageUrls && options.imageUrls.length > 0);

      taskId = await client.generateSora2Video({
        model: modelId as "sora-2-text-to-video" | "sora-2-image-to-video" | "sora-2-pro-text-to-video" | "sora-2-pro-image-to-video",
        input: {
          prompt,
          image_urls: hasImage ? (options.imageUrls || (options.imageUrl ? [options.imageUrl] : undefined)) : undefined,
          aspect_ratio: options.aspectRatio as "portrait" | "landscape" | undefined,
          n_frames: options.nFrames,
          size: options.size,
          remove_watermark: options.removeWatermark,
        },
      });
    } else {
      return apiResponse.badRequest(`Unsupported video model: ${modelId}`);
    }

    // Store taskId -> creditLogId mapping for failure refund
    if (taskId && creditResult.logId) {
      const session = await getSession();
      const userId = session?.user?.id;
      if (userId) {
        await db.insert(taskCreditMappings).values({
          taskId,
          creditLogId: creditResult.logId,
          userId,
        }).catch(err => {
          console.error('Failed to store task-credit mapping:', err);
          // Non-critical, continue
        });
      }
    }

    return apiResponse.success({
      taskId,
      modelId,
      creditsUsed: creditsRequired,
      remainingCredits: creditResult.remainingCredits,
    });

  } catch (error: unknown) {
    console.error("Video generation failed:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate video";
    const clientErrorMessage = "Failed to generate video";

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
        error: errorMessage,
        creditsRefunded: creditResult?.success || false,
      },
    }).catch(err => console.error('Failed to log activity:', err));

    if (errorMessage.includes("API key") || errorMessage.includes("authentication") || errorMessage.includes("401")) {
      return apiResponse.unauthorized(clientErrorMessage);
    }

    if (errorMessage.includes("Insufficient credits")) {
      return apiResponse.badRequest("Insufficient credits for this operation");
    }

    return apiResponse.serverError(clientErrorMessage);
  }
}

