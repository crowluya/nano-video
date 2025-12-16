/**
 * Image to Image API Route - Using Kie.ai
 */

import { getKieImageModel } from "@/config/models";
import { apiResponse } from "@/lib/api-response";
import { getKieClient } from "@/lib/kie";
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

    if (!(modelConfig.features as readonly string[]).includes("image-to-image")) {
      return apiResponse.badRequest(`Model ${modelId} does not support image-to-image`);
    }

    const client = getKieClient();
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/50c3a73e-ed9b-489d-9c57-b43ba19279a7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/ai-demo/image-to-image/route.ts:44',message:'Starting image upload',data:{modelId,hasBase64Data:!!imageBase64DataUri,base64Length:imageBase64DataUri?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    // Upload image first
    let uploadResult: { fileUrl: string; downloadUrl: string } | null = null;
    try {
      uploadResult = await client.uploadFileBase64({
        base64Data: imageBase64DataUri.split(',')[1],
        uploadPath: "ai-demo/image-to-image",
        fileName: `input-image-${Date.now()}.png`,
      });
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/50c3a73e-ed9b-489d-9c57-b43ba19279a7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/ai-demo/image-to-image/route.ts:54',message:'Upload success',data:{hasFileUrl:!!uploadResult?.fileUrl,fileUrl:uploadResult?.fileUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
    } catch (uploadError: any) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/50c3a73e-ed9b-489d-9c57-b43ba19279a7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/ai-demo/image-to-image/route.ts:58',message:'Upload error',data:{errorMessage:uploadError?.message,errorStack:uploadError?.stack,errorName:uploadError?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      return apiResponse.serverError(`Failed to upload image: ${uploadError?.message || 'Unknown error'}`);
    }

    if (!uploadResult?.fileUrl) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/50c3a73e-ed9b-489d-9c57-b43ba19279a7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/ai-demo/image-to-image/route.ts:63',message:'Upload result missing fileUrl',data:{uploadResult},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      return apiResponse.serverError("Failed to upload image: No file URL returned");
    }

    const imageUrl = uploadResult.fileUrl;
    let imageUrls: string[];

    // Generate image based on model and wait for completion
    if (modelId === "google/nano-banana-edit" || modelId === "nano-banana-pro") {
      // Nano Banana models require model field in request
      const taskId = await client.generateNanoBananaImage({
        model: modelId === "nano-banana-pro" ? "nano-banana-pro" : "google/nano-banana-edit",
        input: {
          prompt,
          image_input: [imageUrl],
          aspect_ratio: "auto",
          output_format: "png",
        },
      });
      imageUrls = await client.waitForNanoBananaCompletion(taskId);
    } else if (modelId === "midjourney") {
      const taskId = await client.generateMidjourneyImage({
        taskType: "mj_img2img",
        prompt,
        fileUrls: imageUrl ? [imageUrl] : undefined,
        version: "7",
        speed: "fast",
        aspectRatio: "1:1",
      });
      imageUrls = await client.waitForMidjourneyCompletion(taskId);
    } else if (modelId === "flux-kontext-pro" || modelId === "flux-kontext-max") {
      const taskId = await client.generateFluxKontextImage({
        prompt,
        model: modelId === "flux-kontext-max" ? "flux-kontext-max" : "flux-kontext-pro",
        inputImage: imageUrl,
        aspectRatio: "1:1",
        outputFormat: "png",
      });
      imageUrls = await client.waitForFluxKontextCompletion(taskId);
    } else if (modelId === "gpt4o-image") {
      const taskId = await client.generate4oImage({
        prompt,
        filesUrl: [imageUrl],
        size: "1:1",
        nVariants: 1,
      });
      imageUrls = await client.waitFor4oImageCompletion(taskId);
    } else {
      return apiResponse.badRequest(`Unsupported image model: ${modelId}`);
    }

    if (!imageUrls || imageUrls.length === 0) {
      return apiResponse.serverError("Failed to transform image: No image URL returned");
    }

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
