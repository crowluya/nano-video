/**
 * Video Generation API Route - Unified endpoint for Sora 2 and Sora 2 Pro
 */

import { createActivityLog } from "@/actions/usage/activity-logs";
import { getKieVideoModel } from "@/config/models";
import { apiResponse } from "@/lib/api-response";
import { getSession } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { taskCreditMappings } from "@/lib/db/schema";
import { getKieClient, KieUpstreamError } from "@/lib/kie";
import { calculateVideoCredits, checkKieCredits, deductKieCredits, refundKieCredits } from "@/lib/kie/credits";
import { z } from 'zod';

type FailureReason =
  | 'invalid_input'
  | 'insufficient_credits'
  | 'upload_failed'
  | 'upstream_failed'
  | 'timeout'
  | 'unknown';

function classifyFailureReason(error: unknown): {
  reason: FailureReason;
  errorMessageInternal?: string;
  errorCodeInternal?: string | number | null;
  httpStatus?: number | null;
  rawBody?: string;
} {
  if (error instanceof KieUpstreamError) {
    const msg = error.upstreamMessage || error.message;
    if (error.isTimeout || msg.toLowerCase().includes('timeout')) {
      return {
        reason: 'timeout',
        errorMessageInternal: msg,
        errorCodeInternal: error.upstreamCode ?? null,
        httpStatus: error.httpStatus ?? null,
        rawBody: error.rawBody,
      };
    }
    return {
      reason: 'upstream_failed',
      errorMessageInternal: msg,
      errorCodeInternal: error.upstreamCode ?? null,
      httpStatus: error.httpStatus ?? null,
      rawBody: error.rawBody,
    };
  }

  const msg = (error instanceof Error ? error.message : '').toLowerCase();
  if (msg.includes('insufficient credits')) {
    return { reason: 'insufficient_credits', errorMessageInternal: error instanceof Error ? error.message : undefined, errorCodeInternal: null, httpStatus: null };
  }
  if (msg.includes('upload') || msg.includes('image') && msg.includes('upload')) {
    return { reason: 'upload_failed', errorMessageInternal: error instanceof Error ? error.message : undefined, errorCodeInternal: null, httpStatus: null };
  }
  if (msg.includes('invalid') || msg.includes('require') || msg.includes('parameter')) {
    return { reason: 'invalid_input', errorMessageInternal: error instanceof Error ? error.message : undefined, errorCodeInternal: null, httpStatus: null };
  }
  return { reason: 'unknown', errorMessageInternal: error instanceof Error ? error.message : undefined, errorCodeInternal: null, httpStatus: null };
}

const inputSchema = z.object({
  images: z.array(z.string().startsWith('data:image/')).optional(),
  prompt: z.string().min(1, "Prompt cannot be empty"),
  modelId: z.string(),
  provider: z.string(),
  // Veo 3.1 parameters
  generationType: z.enum(["TEXT_2_VIDEO", "IMAGE_2_VIDEO", "FIRST_AND_LAST_FRAMES_2_VIDEO", "REFERENCE_2_VIDEO"]).optional(),
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
  let taskId: string | undefined;

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
      return apiResponse.badRequest("Unsupported provider");
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
          uploadPath: "generation/video",
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
      // Determine generation type based on images and explicit parameter
      let effectiveGenerationType = generationType;

      if (!effectiveGenerationType) {
        // Auto-detect based on number of images
        if (uploadedImageUrls.length === 0) {
          effectiveGenerationType = "TEXT_2_VIDEO";
        } else if (uploadedImageUrls.length === 1) {
          effectiveGenerationType = "IMAGE_2_VIDEO";
        } else if (uploadedImageUrls.length === 2) {
          effectiveGenerationType = "FIRST_AND_LAST_FRAMES_2_VIDEO";
        } else if (uploadedImageUrls.length >= 3) {
          effectiveGenerationType = "REFERENCE_2_VIDEO";
        } else {
          effectiveGenerationType = "TEXT_2_VIDEO";
        }
      }

      // Validate image count for each mode
      if (effectiveGenerationType === "IMAGE_2_VIDEO") {
        if (uploadedImageUrls.length !== 1) {
          return apiResponse.badRequest("IMAGE_2_VIDEO mode requires exactly 1 image");
        }
      }

      if (effectiveGenerationType === "FIRST_AND_LAST_FRAMES_2_VIDEO") {
        if (uploadedImageUrls.length !== 2) {
          return apiResponse.badRequest("FIRST_AND_LAST_FRAMES_2_VIDEO mode requires exactly 2 images (start and end frames)");
        }
      }

      if (effectiveGenerationType === "REFERENCE_2_VIDEO") {
        if (uploadedImageUrls.length < 1 || uploadedImageUrls.length > 4) {
          return apiResponse.badRequest("REFERENCE_2_VIDEO mode requires 1-4 reference images");
        }
        // Reference mode only supports 16:9
        if (aspectRatio && aspectRatio !== "16:9") {
          return apiResponse.badRequest("REFERENCE_2_VIDEO mode only supports 16:9 aspect ratio");
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
        `Unsupported video model: ${modelId}`
      );
    }
  } catch (error: any) {
    console.error("Video generation failed:", error);
    const errorMessage = error?.message || "Failed to generate video";
    const clientErrorMessage = "Failed to generate video";
    const classified = classifyFailureReason(error);

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
        taskId,
        reason: classified.reason,
        error: errorMessage,
        errorMessageInternal: classified.errorMessageInternal?.slice(0, 300),
        errorCodeInternal: classified.errorCodeInternal ?? null,
        httpStatus: classified.httpStatus ?? null,
        rawBody: classified.rawBody,
        creditsRefunded: creditResult?.success || false,
      },
    }).catch(err => console.error('Failed to log activity:', err));

    return apiResponse.serverError(clientErrorMessage);
  }
}

