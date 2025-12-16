/**
 * Image/Text to Video API Route - Using Kie.ai
 */

import { apiResponse } from "@/lib/api-response";
import { getKieClient } from "@/lib/kie";
import { getKieVideoModel } from "@/config/models";
import { z } from 'zod';

const inputSchema = z.object({
  image: z.string().startsWith('data:image/').optional(),
  prompt: z.string().min(1, "Prompt cannot be empty"),
  duration: z.union([z.literal(5), z.literal(10)]).optional(),
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

    const { image: imageBase64DataUri, prompt, duration, modelId, provider } = validationResult.data;

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
    let videoUrls: string[];
    let imageUrl: string | undefined;

    // Upload image if provided
    if (imageBase64DataUri) {
      const uploadResult = await client.uploadFileBase64({
        base64Data: imageBase64DataUri.split(',')[1],
        fileName: "input-image.png",
      });

      if (!uploadResult.success || !uploadResult.data?.fileUrl) {
        return apiResponse.serverError("Failed to upload image");
      }

      imageUrl = uploadResult.data.fileUrl;
    }

    // Generate video based on model and wait for completion
    if (modelId.startsWith("sora-2")) {
      // Sora 2 - Text to Video or Image to Video
      const taskId = await client.generateSora2Video({
        prompt,
        imageUrl,
        aspectRatio: "landscape",
        duration: duration?.toString() || "10",
      });
      videoUrls = await client.waitForSora2Completion(taskId);
    } else if (modelId.startsWith("veo3")) {
      // Veo 3.1 - Text to Video, Image to Video, or First/Last Frame
      const generationType = imageUrl 
        ? "FIRST_AND_LAST_FRAMES_2_VIDEO" 
        : "TEXT_2_VIDEO";
      
      const taskId = await client.generateVeo3Video({
        prompt,
        imageUrl,
        model: modelId === "veo3_fast" ? "veo3_fast" : "veo3",
        generationType: generationType as "TEXT_2_VIDEO" | "FIRST_AND_LAST_FRAMES_2_VIDEO" | "REFERENCE_2_VIDEO",
        aspectRatio: "16:9",
      });
      videoUrls = await client.waitForVeo3Completion(taskId);
    } else {
      return apiResponse.badRequest(`Unsupported video model: ${modelId}. Only Sora 2 and Veo 3.1 are supported.`);
    }

    if (!videoUrls || videoUrls.length === 0) {
      return apiResponse.serverError("Failed to generate video: No video URL returned");
    }

    return apiResponse.success({ videoUrl: videoUrls[0] });

  } catch (error: any) {
    console.error("Video generation failed:", error);
    const errorMessage = error?.message || "Failed to generate video";
    if (errorMessage.includes("API key") || errorMessage.includes("authentication")) {
      return apiResponse.serverError(`Server configuration error: ${errorMessage}`);
    }
    return apiResponse.serverError(errorMessage);
  }
}
