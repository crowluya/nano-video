/**
 * Text to Image API Route - Using Kie.ai
 */

import { apiResponse } from "@/lib/api-response";
import { getKieClient } from "@/lib/kie";
import { getKieImageModel } from "@/config/models";
import { z } from 'zod';

const inputSchema = z.object({
  prompt: z.string().min(1, "Prompt cannot be empty"),
  modelId: z.string().min(1, "Model ID cannot be empty"),
  provider: z.string().min(1, "Provider cannot be empty"),
});

export async function POST(req: Request) {
  try {
    const rawBody = await req.json();

    const validationResult = inputSchema.safeParse(rawBody);
    if (!validationResult.success) {
      return apiResponse.badRequest(`Invalid input: ${validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
    }

    const { prompt, modelId, provider } = validationResult.data;

    // Validate provider is kie
    if (provider !== "kie") {
      return apiResponse.badRequest("Only kie.ai provider is supported for text-to-image");
    }

    // Validate model exists
    const modelConfig = getKieImageModel(modelId);
    if (!modelConfig) {
      return apiResponse.badRequest(`Unknown image model: ${modelId}`);
    }

    if (!modelConfig.features.includes("text-to-image")) {
      return apiResponse.badRequest(`Model ${modelId} does not support text-to-image`);
    }

    const client = getKieClient();
    let imageUrls: string[];

    // Generate image based on model and wait for completion
    if (modelId === "google/nano-banana" || modelId === "nano-banana-pro" || modelId === "google/nano-banana-edit") {
      // Nano Banana models require model field in request
      const taskId = await client.generateNanoBananaImage({
        model: modelId as "google/nano-banana" | "google/nano-banana-edit" | "nano-banana-pro",
        input: {
          prompt,
          aspect_ratio: "auto",
          output_format: "png",
        },
      });
      imageUrls = await client.waitForNanoBananaCompletion(taskId);
    } else if (modelId === "midjourney") {
      const taskId = await client.generateMidjourneyImage({
        taskType: "mj_txt2img",
        prompt,
        version: "7",
        speed: "fast",
        aspectRatio: "1:1",
      });
      imageUrls = await client.waitForMidjourneyCompletion(taskId);
    } else if (modelId === "flux-kontext-pro" || modelId === "flux-kontext-max") {
      const taskId = await client.generateFluxKontextImage({
        prompt,
        model: modelId === "flux-kontext-max" ? "flux-kontext-max" : "flux-kontext-pro",
        aspectRatio: "1:1",
        outputFormat: "png",
      });
      imageUrls = await client.waitForFluxKontextCompletion(taskId);
    } else if (modelId === "gpt4o-image") {
      const taskId = await client.generate4oImage({
        prompt,
        size: "1:1",
        nVariants: 1,
      });
      imageUrls = await client.waitFor4oImageCompletion(taskId);
    } else if (modelId === "z-image") {
      const taskId = await client.generateZImage({
        prompt,
        aspect_ratio: "1:1",
      });
      imageUrls = await client.waitForZImageCompletion(taskId);
    } else {
      return apiResponse.badRequest(`Unsupported image model: ${modelId}`);
    }

    if (!imageUrls || imageUrls.length === 0) {
      return apiResponse.serverError("Failed to generate image: No image URL returned");
    }

    return apiResponse.success({ imageUrl: imageUrls[0] });

  } catch (error: any) {
    console.error("Text-to-Image generation failed:", error);
    const errorMessage = error?.message || "Failed to generate image";
    if (errorMessage.includes("API key") || errorMessage.includes("authentication")) {
      return apiResponse.serverError(`Server configuration error: ${errorMessage}`);
    }
    return apiResponse.serverError(errorMessage);
  }
}
