/**
 * Kie.ai Video Generation API Route
 * 
 * Supports: Sora 2, Veo 3.1, Runway, Wan
 * 
 * POST /api/kie/video
 * - Creates a video generation task
 * - Returns taskId for polling status
 */

import { apiResponse } from "@/lib/api-response";
import { getKieClient } from "@/lib/kie";
import { deductKieCredits } from "@/lib/kie/credits";
import { getKieVideoModel } from "@/config/models";
import { z } from "zod";

const inputSchema = z.object({
  modelId: z.string().min(1, "Model ID is required"),
  prompt: z.string().min(1, "Prompt is required"),
  // Common options
  aspectRatio: z.string().optional(),
  duration: z.string().optional(),
  // For image-to-video
  imageUrl: z.string().url().optional(),
  imageUrls: z.array(z.string().url()).optional(),
  // Veo 3.1 specific
  generationType: z.enum(["TEXT_2_VIDEO", "FIRST_AND_LAST_FRAMES_2_VIDEO", "REFERENCE_2_VIDEO"]).optional(),
  enableTranslation: z.boolean().optional(),
  seeds: z.number().min(10000).max(99999).optional(),
  // Sora 2 specific
  nFrames: z.enum(["10", "15"]).optional(),
  removeWatermark: z.boolean().optional(),
  // Runway specific
  quality: z.enum(["720p", "1080p"]).optional(),
  // Wan specific
  resolution: z.enum(["480p", "580p", "720p", "1080p"]).optional(),
});

export async function POST(req: Request) {
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

    // Deduct credits before generation
    const creditResult = await deductKieCredits('video', modelId, `Video generation: ${prompt.slice(0, 50)}...`);
    if (!creditResult.success) {
      return apiResponse.badRequest(creditResult.error || 'Insufficient credits');
    }

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
          remove_watermark: options.removeWatermark,
        },
      });
    } else if (modelId === "veo3" || modelId === "veo3_fast") {
      // Veo 3.1 models
      const hasImages = options.imageUrls && options.imageUrls.length > 0;
      const hasSingleImage = options.imageUrl && !hasImages;
      
      // Determine generation type
      let generationType = options.generationType || "TEXT_2_VIDEO";
      if (!options.generationType && (hasImages || hasSingleImage)) {
        generationType = "FIRST_AND_LAST_FRAMES_2_VIDEO";
      }

      taskId = await client.generateVeo3Video({
        prompt,
        model: modelId as "veo3" | "veo3_fast",
        generationType: generationType as "TEXT_2_VIDEO" | "FIRST_AND_LAST_FRAMES_2_VIDEO" | "REFERENCE_2_VIDEO",
        aspectRatio: options.aspectRatio as "16:9" | "9:16" | "Auto" | undefined,
        imageUrls: hasImages ? options.imageUrls : (hasSingleImage ? [options.imageUrl!] : undefined),
        enableTranslation: options.enableTranslation,
        seeds: options.seeds,
      });
    } else if (modelId === "runway-gen3") {
      // Runway Gen-3
      taskId = await client.generateRunwayVideo({
        prompt,
        duration: options.duration ? (parseInt(options.duration) as 5 | 10) : undefined,
        quality: options.quality,
        aspectRatio: options.aspectRatio as "16:9" | "9:16" | "1:1" | "4:3" | "3:4" | undefined,
        imageUrl: options.imageUrl,
      });
    } else if (modelId.startsWith("wan/")) {
      // Wan models
      const isWan25 = modelId.includes("2-5");
      
      if (isWan25) {
        taskId = await client.generateWanVideo({
          model: modelId as "wan/2-5-image-to-video" | "wan/2-5-text-to-video",
          input: {
            prompt,
            image_url: options.imageUrl,
            duration: options.duration as "5" | "10" | undefined,
            resolution: options.resolution as "720p" | "1080p" | undefined,
          },
        });
      } else {
        // Wan 2.2
        taskId = await client.generateWanVideo({
          model: modelId as "wan/2-2-a14b-image-to-video-turbo" | "wan/2-2-a14b-text-to-video-turbo",
          input: {
            prompt,
            image_url: options.imageUrl,
            resolution: options.resolution as "480p" | "580p" | "720p" | undefined,
            aspect_ratio: options.aspectRatio as "auto" | "16:9" | "9:16" | "1:1" | undefined,
          },
        });
      }
    } else {
      return apiResponse.badRequest(`Unsupported video model: ${modelId}`);
    }

    return apiResponse.success({
      taskId,
      modelId,
      creditsUsed: modelConfig.creditsPerGeneration,
    });

  } catch (error: unknown) {
    console.error("Video generation failed:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate video";
    
    if (errorMessage.includes("API key") || errorMessage.includes("authentication") || errorMessage.includes("401")) {
      return apiResponse.unauthorized("Authentication error with Kie.ai API");
    }
    
    return apiResponse.serverError(errorMessage);
  }
}

