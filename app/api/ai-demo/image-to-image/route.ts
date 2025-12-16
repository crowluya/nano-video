/**
 * Image to Image API Route - Using Kie.ai
 */

import { apiResponse } from "@/lib/api-response";
import { getKieClient } from "@/lib/kie";
import { getKieImageModel } from "@/config/models";
import { z } from 'zod';

const inputSchema = z.object({
  image: z.string().startsWith('data:image/'),
  prompt: z.string().min(1, "Prompt cannot be empty"),
  seed: z.number().int().optional(),
  modelId: z.string(),
  provider: z.string(),
});

export async function POST(req: Request) {
  try {
    const rawBody = await req.json();

    const validationResult = inputSchema.safeParse(rawBody);
    if (!validationResult.success) {
      return apiResponse.badRequest(`Invalid input: ${validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
    }

    const { image: imageBase64DataUri, prompt, seed, modelId, provider } = validationResult.data;

    // Validate provider is kie
    if (provider !== "kie") {
      return apiResponse.badRequest("Only kie.ai provider is supported for image-to-image");
    }

    // Validate model exists
    const modelConfig = getKieImageModel(modelId);
    if (!modelConfig) {
      return apiResponse.badRequest(`Unknown image model: ${modelId}`);
    }

    if (!modelConfig.features.includes("image-to-image")) {
      return apiResponse.badRequest(`Model ${modelId} does not support image-to-image`);
    }

    const client = getKieClient();
    
    // Upload image first
    const uploadResult = await client.uploadFileBase64({
      base64Data: imageBase64DataUri.split(',')[1],
      fileName: "input-image.png",
    });

    if (!uploadResult.success || !uploadResult.data?.fileUrl) {
      return apiResponse.serverError("Failed to upload image");
    }

    const imageUrl = uploadResult.data.fileUrl;
    let taskId: string;

    // Generate image based on model
    if (modelId === "google/nano-banana-edit" || modelId === "nano-banana-pro") {
      taskId = await client.generateNanoBananaImage({
        prompt,
        filesUrl: [imageUrl],
        aspectRatio: "auto",
        outputFormat: "png",
      });
    } else if (modelId === "midjourney") {
      taskId = await client.generateMidjourneyImage({
        prompt,
        taskType: "mj_img2img",
        imageUrl,
        version: "7",
        speed: "fast",
        aspectRatio: "1:1",
      });
    } else if (modelId === "flux-kontext-pro" || modelId === "flux-kontext-max") {
      taskId = await client.generateFluxKontextImage({
        prompt,
        model: modelId === "flux-kontext-max" ? "flux-kontext-max" : "flux-kontext-pro",
        imageUrl,
        aspectRatio: "1:1",
        outputFormat: "png",
      });
    } else if (modelId === "gpt4o-image") {
      taskId = await client.generate4oImage({
        prompt,
        filesUrl: [imageUrl],
        size: "1:1",
        nVariants: 1,
      });
    } else {
      return apiResponse.badRequest(`Unsupported image model: ${modelId}`);
    }

    // Poll for result
    const result = await client.pollTaskStatus({
      taskId,
      type: "image",
      modelId,
      maxAttempts: 60,
      intervalMs: 2000,
    });

    if (!result.success || !result.data?.outputUrl) {
      return apiResponse.serverError(result.error || "Failed to transform image");
    }

    return apiResponse.success({ imageUrl: result.data.outputUrl });

  } catch (error: any) {
    console.error("Image-to-Image generation failed:", error);
    const errorMessage = error?.message || "Failed to transform image";
    if (errorMessage.includes("API key") || errorMessage.includes("authentication")) {
      return apiResponse.serverError(`Server configuration error: ${errorMessage}`);
    }
    return apiResponse.serverError(errorMessage);
  }
}
