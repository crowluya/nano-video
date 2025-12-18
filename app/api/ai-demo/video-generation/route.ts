/**
 * Video Generation API Route - Unified endpoint for Sora 2 and Veo 3.1
 */

import { apiResponse } from "@/lib/api-response";
import { getKieClient } from "@/lib/kie";
import { getKieVideoModel } from "@/config/models";
import { z } from 'zod';

const inputSchema = z.object({
  images: z.array(z.string().startsWith('data:image/')).optional(),
  prompt: z.string().min(1, "Prompt cannot be empty"),
  modelId: z.string(),
  provider: z.string(),
  // Sora 2 parameters
  aspect_ratio: z.enum(["portrait", "landscape"]).optional(),
  n_frames: z.enum(["10", "15"]).optional(),
  remove_watermark: z.boolean().optional(),
  // Veo 3.1 parameters
  generationType: z.enum(["TEXT_2_VIDEO", "FIRST_AND_LAST_FRAMES_2_VIDEO", "REFERENCE_2_VIDEO"]).optional(),
  aspectRatio: z.enum(["16:9", "9:16", "Auto"]).optional(),
  seeds: z.number().optional(),
  enableTranslation: z.boolean().optional(),
});

export async function POST(req: Request) {
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
      aspect_ratio,
      n_frames,
      remove_watermark,
      generationType,
      aspectRatio,
      seeds,
      enableTranslation,
    } = validationResult.data;

    // Validate provider is kie
    if (provider !== "kie") {
      return apiResponse.badRequest("Only kie.ai provider is supported for video generation");
    }

    // Validate model exists
    const modelConfig = getKieVideoModel(modelId);
    if (!modelConfig) {
      return apiResponse.badRequest(`Unknown video model: ${modelId}`);
    }

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
      
      const taskId = await client.generateSora2Video({
        model: soraModel as "sora-2-text-to-video" | "sora-2-image-to-video" | "sora-2-pro-text-to-video" | "sora-2-pro-image-to-video",
        input: {
          prompt,
          image_urls: imageUrl ? [imageUrl] : undefined,
          aspect_ratio: aspect_ratio || "landscape",
          n_frames: n_frames || "10",
          remove_watermark: remove_watermark ?? true,
        },
      });
      
      // Return taskId for async tracking
      return apiResponse.success({ taskId, modelId });
    } else if (modelId.startsWith("veo3")) {
      // Veo 3.1 - Text to Video, Image to Video, or Reference to Video
      const effectiveGenerationType = generationType || 
        (uploadedImageUrls.length >= 2 ? "REFERENCE_2_VIDEO" :
         uploadedImageUrls.length === 1 ? "FIRST_AND_LAST_FRAMES_2_VIDEO" :
         "TEXT_2_VIDEO");
      
      const taskId = await client.generateVeo3Video({
        prompt,
        imageUrls: uploadedImageUrls.length > 0 ? uploadedImageUrls : undefined,
        model: modelId === "veo3_fast" ? "veo3_fast" : "veo3",
        generationType: effectiveGenerationType as "TEXT_2_VIDEO" | "FIRST_AND_LAST_FRAMES_2_VIDEO" | "REFERENCE_2_VIDEO",
        aspectRatio: aspectRatio || "16:9",
        seeds: seeds,
        enableTranslation: enableTranslation ?? true,
      });
      
      // Return taskId for async tracking
      return apiResponse.success({ taskId, modelId });
    } else {
      return apiResponse.badRequest(`Unsupported video model: ${modelId}. Only Sora 2 and Veo 3.1 are supported.`);
    }
  } catch (error: any) {
    console.error("Video generation failed:", error);
    const errorMessage = error?.message || "Failed to generate video";
    if (errorMessage.includes("API key") || errorMessage.includes("authentication")) {
      return apiResponse.serverError(`Server configuration error: ${errorMessage}`);
    }
    return apiResponse.serverError(errorMessage);
  }
}

