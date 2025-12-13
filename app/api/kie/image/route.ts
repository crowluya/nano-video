/**
 * Kie.ai Image Generation API Route
 * 
 * Supports: Nano Banana, Midjourney, Flux Kontext, GPT-4o Image
 * 
 * POST /api/kie/image
 * - Creates an image generation task
 * - Returns taskId for polling status
 */

import { apiResponse } from "@/lib/api-response";
import { getKieClient } from "@/lib/kie";
import { deductKieCredits } from "@/lib/kie/credits";
import { getKieImageModel } from "@/config/models";
import { z } from "zod";

const inputSchema = z.object({
  modelId: z.string().min(1, "Model ID is required"),
  prompt: z.string().min(1, "Prompt is required"),
  // Optional parameters based on model
  aspectRatio: z.string().optional(),
  size: z.string().optional(),
  outputFormat: z.enum(["png", "jpg", "jpeg"]).optional(),
  resolution: z.enum(["1K", "2K", "4K"]).optional(),
  // For image-to-image / editing
  inputImageUrl: z.string().url().optional(),
  inputImageUrls: z.array(z.string().url()).optional(),
  // Midjourney specific
  taskType: z.enum(["mj_txt2img", "mj_img2img", "mj_video", "mj_style_reference", "mj_omni_reference"]).optional(),
  version: z.enum(["7", "6.1", "6", "5.2", "niji6"]).optional(),
  speed: z.enum(["relaxed", "fast", "turbo"]).optional(),
  // GPT-4o specific
  nVariants: z.union([z.literal(1), z.literal(2), z.literal(4)]).optional(),
  maskUrl: z.string().url().optional(),
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
    const modelConfig = getKieImageModel(modelId);
    if (!modelConfig) {
      return apiResponse.badRequest(`Unknown image model: ${modelId}`);
    }

    // Deduct credits before generation
    const creditResult = await deductKieCredits('image', modelId, `Image generation: ${prompt.slice(0, 50)}...`);
    if (!creditResult.success) {
      return apiResponse.badRequest(creditResult.error || 'Insufficient credits');
    }

    const client = getKieClient();
    let taskId: string;

    // Route to appropriate generation method based on model
    if (modelId === "google/nano-banana" || modelId === "google/nano-banana-edit" || modelId === "nano-banana-pro") {
      // Nano Banana models
      taskId = await client.generateNanoBananaImage({
        model: modelId as "google/nano-banana" | "google/nano-banana-edit" | "nano-banana-pro",
        input: {
          prompt,
          aspect_ratio: options.aspectRatio as "1:1" | "16:9" | "9:16" | "4:3" | "3:4" | "21:9" | "auto" | undefined,
          output_format: options.outputFormat === "jpeg" ? "jpg" : options.outputFormat as "png" | "jpg" | undefined,
          resolution: options.resolution,
          image_urls: options.inputImageUrls || (options.inputImageUrl ? [options.inputImageUrl] : undefined),
        },
      });
    } else if (modelId === "midjourney") {
      // Midjourney
      taskId = await client.generateMidjourneyImage({
        taskType: options.taskType || "mj_txt2img",
        prompt,
        aspectRatio: options.aspectRatio,
        version: options.version,
        speed: options.speed,
        fileUrls: options.inputImageUrls || (options.inputImageUrl ? [options.inputImageUrl] : undefined),
      });
    } else if (modelId === "flux-kontext-pro" || modelId === "flux-kontext-max") {
      // Flux Kontext
      taskId = await client.generateFluxKontextImage({
        prompt,
        model: modelId as "flux-kontext-pro" | "flux-kontext-max",
        aspectRatio: options.aspectRatio as "21:9" | "16:9" | "4:3" | "1:1" | "3:4" | "9:16" | "16:21" | undefined,
        inputImage: options.inputImageUrl,
        outputFormat: options.outputFormat === "jpg" ? "jpeg" : options.outputFormat as "jpeg" | "png" | undefined,
      });
    } else if (modelId === "gpt4o-image") {
      // GPT-4o Image
      taskId = await client.generate4oImage({
        prompt,
        size: options.size as "1:1" | "3:2" | "2:3" | undefined,
        nVariants: options.nVariants,
        filesUrl: options.inputImageUrls || (options.inputImageUrl ? [options.inputImageUrl] : undefined),
        maskUrl: options.maskUrl,
      });
    } else {
      return apiResponse.badRequest(`Unsupported image model: ${modelId}`);
    }

    return apiResponse.success({
      taskId,
      modelId,
      creditsUsed: modelConfig.creditsPerGeneration,
    });

  } catch (error: unknown) {
    console.error("Image generation failed:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate image";
    
    // Note: Credits are already deducted, so we don't refund on error
    // This is intentional - credits are consumed when task is created
    
    if (errorMessage.includes("API key") || errorMessage.includes("authentication") || errorMessage.includes("401")) {
      return apiResponse.unauthorized("Authentication error with Kie.ai API");
    }
    
    if (errorMessage.includes("Insufficient credits")) {
      return apiResponse.badRequest("Insufficient credits for this operation");
    }
    
    return apiResponse.serverError(errorMessage);
  }
}

