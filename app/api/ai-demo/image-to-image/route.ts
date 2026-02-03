/**
 * Image to Image API Route - Using Kie.ai
 */

import { getKieImageModel } from "@/config/models";
import { apiResponse } from "@/lib/api-response";
import { getKieClient } from "@/lib/kie";
import { FileUploadResponse } from "@/lib/kie/types";
import { z } from 'zod';

const inputSchema = z.object({
  image: z.string().startsWith('data:image/'),
  prompt: z.string().min(1, "Prompt cannot be empty"),
  seed: z.number().int().optional(),
  modelId: z.string(),
  provider: z.string(),
  wait: z.boolean().optional().default(true), // If false, return taskId only
});

export async function POST(req: Request) {
  try {
    const rawBody = await req.json();

    const validationResult = inputSchema.safeParse(rawBody);
    if (!validationResult.success) {
      return apiResponse.badRequest(`Invalid input: ${validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
    }

    const { image: imageBase64DataUri, prompt, seed, modelId, provider, wait } = validationResult.data;

    // Validate provider is kie
    if (provider !== "kie") {
      return apiResponse.badRequest("Only kie.ai provider is supported for image-to-image");
    }

    // Validate model exists
    const modelConfig = getKieImageModel(modelId);
    if (!modelConfig) {
      return apiResponse.badRequest(`Unknown image model: ${modelId}`);
    }

    if (!(modelConfig.features as readonly string[]).includes("image-to-image")) {
      return apiResponse.badRequest(`Model ${modelId} does not support image-to-image`);
    }

    const client = getKieClient();
    
    
    // Upload image first
    let uploadResult: FileUploadResponse | null = null;
    try {
      uploadResult = await client.uploadFileBase64({
        base64Data: imageBase64DataUri.split(',')[1],
        uploadPath: "ai-demo/image-to-image",
        fileName: `input-image-${Date.now()}.png`,
      });
    } catch (uploadError: any) {
      return apiResponse.serverError(`Failed to upload image: ${uploadError?.message || 'Unknown error'}`);
    }

    // Use downloadUrl as the primary image URL, fallback to fileUrl for backward compatibility
    const imageUrl = uploadResult?.downloadUrl || uploadResult?.fileUrl;
    if (!imageUrl) {
      return apiResponse.serverError("Failed to upload image: No image URL returned (neither downloadUrl nor fileUrl)");
    }
    
    let taskId: string;
    let imageUrls: string[] | undefined;

    // Generate image based on model
    if (modelId === "google/nano-banana-edit" || modelId === "nano-banana-pro") {
      // Nano Banana models require model field in request
      // For Edit/Pro models, use image_urls (not image_input) for image-to-image
      taskId = await client.generateNanoBananaImage({
        model: modelId === "nano-banana-pro" ? "nano-banana-pro" : "google/nano-banana-edit",
        input: {
          prompt,
          image_urls: [imageUrl],
          aspect_ratio: "auto",
          output_format: "png",
        },
      });
      
      if (wait) {
        // Increase polling time for Nano Banana Pro (may take longer)
        const pollingOptions = modelId === "nano-banana-pro" 
          ? { 
              maxAttempts: 120, 
              intervalMs: 5000, // 10 minutes for Pro
              onProgress: (attempt: number, status: any) => {
              }
            }
          : undefined;
        imageUrls = await client.waitForNanoBananaCompletion(taskId, pollingOptions);
      }
    } else if (modelId === "midjourney") {
      taskId = await client.generateMidjourneyImage({
        taskType: "mj_img2img",
        prompt,
        fileUrls: imageUrl ? [imageUrl] : undefined,
        version: "7",
        speed: "fast",
        aspectRatio: "1:1",
      });
      
      if (wait) {
        imageUrls = await client.waitForMidjourneyCompletion(taskId);
      }
    } else if (modelId === "flux-kontext-pro" || modelId === "flux-kontext-max") {
      taskId = await client.generateFluxKontextImage({
        prompt,
        model: modelId === "flux-kontext-max" ? "flux-kontext-max" : "flux-kontext-pro",
        inputImage: imageUrl,
        aspectRatio: "1:1",
        outputFormat: "png",
      });
      
      if (wait) {
        imageUrls = await client.waitForFluxKontextCompletion(taskId);
      }
    } else if (modelId === "gpt4o-image") {
      taskId = await client.generate4oImage({
        prompt,
        filesUrl: [imageUrl],
        size: "1:1",
        nVariants: 1,
      });
      
      if (wait) {
        imageUrls = await client.waitFor4oImageCompletion(taskId);
      }
    } else {
      return apiResponse.badRequest(`Unsupported image model: ${modelId}`);
    }

    // If wait=false, return taskId only
    if (!wait) {
      return apiResponse.success({ taskId, modelId });
    }

    // If wait=true, imageUrls should be set by now
    if (!imageUrls || imageUrls.length === 0) {
      return apiResponse.serverError("Failed to transform image: No image URL returned");
    }
    
    // TypeScript: imageUrls is definitely assigned here when wait=true
    const finalImageUrls: string[] = imageUrls;


    
    return apiResponse.success({ imageUrl: imageUrls[0] });

  } catch (error: any) {
    console.error("Image-to-Image generation failed:", error);
    const errorMessage = error?.message || "Failed to transform image";
    if (errorMessage.includes("API key") || errorMessage.includes("authentication")) {
      return apiResponse.serverError(`Server configuration error: ${errorMessage}`);
    }
    return apiResponse.serverError(errorMessage);
  }
}

