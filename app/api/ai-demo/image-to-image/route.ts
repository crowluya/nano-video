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
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/50c3a73e-ed9b-489d-9c57-b43ba19279a7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/ai-demo/image-to-image/route.ts:44',message:'Starting image upload',data:{modelId,hasBase64Data:!!imageBase64DataUri,base64Length:imageBase64DataUri?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    // Upload image first
    let uploadResult: FileUploadResponse | null = null;
    try {
      uploadResult = await client.uploadFileBase64({
        base64Data: imageBase64DataUri.split(',')[1],
        uploadPath: "ai-demo/image-to-image",
        fileName: `input-image-${Date.now()}.png`,
      });
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/50c3a73e-ed9b-489d-9c57-b43ba19279a7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/ai-demo/image-to-image/route.ts:54',message:'Upload success',data:{hasDownloadUrl:!!uploadResult?.downloadUrl,downloadUrl:uploadResult?.downloadUrl,hasFileUrl:!!uploadResult?.fileUrl,fileUrl:uploadResult?.fileUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
    } catch (uploadError: any) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/50c3a73e-ed9b-489d-9c57-b43ba19279a7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/ai-demo/image-to-image/route.ts:58',message:'Upload error',data:{errorMessage:uploadError?.message,errorStack:uploadError?.stack,errorName:uploadError?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      return apiResponse.serverError(`Failed to upload image: ${uploadError?.message || 'Unknown error'}`);
    }

    // Use downloadUrl as the primary image URL, fallback to fileUrl for backward compatibility
    const imageUrl = uploadResult?.downloadUrl || uploadResult?.fileUrl;
    if (!imageUrl) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/50c3a73e-ed9b-489d-9c57-b43ba19279a7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/ai-demo/image-to-image/route.ts:68',message:'Upload result missing image URL',data:{uploadResult},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      return apiResponse.serverError("Failed to upload image: No image URL returned (neither downloadUrl nor fileUrl)");
    }
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/50c3a73e-ed9b-489d-9c57-b43ba19279a7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/ai-demo/image-to-image/route.ts:75',message:'Starting image generation',data:{modelId,imageUrl,hasImageUrl:!!imageUrl,wait},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    
    let taskId: string;
    let imageUrls: string[] | undefined;

    // Generate image based on model
    if (modelId === "google/nano-banana-edit" || modelId === "nano-banana-pro") {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/50c3a73e-ed9b-489d-9c57-b43ba19279a7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/ai-demo/image-to-image/route.ts:79',message:'Nano Banana generation start',data:{modelId,prompt,imageUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
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
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/50c3a73e-ed9b-489d-9c57-b43ba19279a7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/ai-demo/image-to-image/route.ts:99',message:'Nano Banana taskId received',data:{taskId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      
      if (wait) {
        // Increase polling time for Nano Banana Pro (may take longer)
        const pollingOptions = modelId === "nano-banana-pro" 
          ? { 
              maxAttempts: 120, 
              intervalMs: 5000, // 10 minutes for Pro
              onProgress: (attempt: number, status: any) => {
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/50c3a73e-ed9b-489d-9c57-b43ba19279a7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/ai-demo/image-to-image/route.ts:107',message:'Nano Banana polling progress',data:{attempt,taskId,state:status?.state,successFlag:status?.successFlag,hasResultJson:!!status?.resultJson},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
                // #endregion
              }
            }
          : undefined;
        imageUrls = await client.waitForNanoBananaCompletion(taskId, pollingOptions);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/50c3a73e-ed9b-489d-9c57-b43ba19279a7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/ai-demo/image-to-image/route.ts:118',message:'Nano Banana completion',data:{imageUrlsCount:imageUrls?.length,imageUrls},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
      }
    } else if (modelId === "midjourney") {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/50c3a73e-ed9b-489d-9c57-b43ba19279a7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/ai-demo/image-to-image/route.ts:92',message:'Midjourney generation start',data:{modelId,prompt,imageUrl,fileUrls:[imageUrl]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
      taskId = await client.generateMidjourneyImage({
        taskType: "mj_img2img",
        prompt,
        fileUrls: imageUrl ? [imageUrl] : undefined,
        version: "7",
        speed: "fast",
        aspectRatio: "1:1",
      });
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/50c3a73e-ed9b-489d-9c57-b43ba19279a7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/ai-demo/image-to-image/route.ts:130',message:'Midjourney taskId received',data:{taskId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
      
      if (wait) {
        imageUrls = await client.waitForMidjourneyCompletion(taskId);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/50c3a73e-ed9b-489d-9c57-b43ba19279a7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/ai-demo/image-to-image/route.ts:139',message:'Midjourney completion',data:{imageUrlsCount:imageUrls?.length,imageUrls},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
      }
    } else if (modelId === "flux-kontext-pro" || modelId === "flux-kontext-max") {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/50c3a73e-ed9b-489d-9c57-b43ba19279a7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/ai-demo/image-to-image/route.ts:102',message:'Flux Kontext generation start',data:{modelId,prompt,inputImage:imageUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
      // #endregion
      taskId = await client.generateFluxKontextImage({
        prompt,
        model: modelId === "flux-kontext-max" ? "flux-kontext-max" : "flux-kontext-pro",
        inputImage: imageUrl,
        aspectRatio: "1:1",
        outputFormat: "png",
      });
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/50c3a73e-ed9b-489d-9c57-b43ba19279a7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/ai-demo/image-to-image/route.ts:149',message:'Flux Kontext taskId received',data:{taskId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
      // #endregion
      
      if (wait) {
        imageUrls = await client.waitForFluxKontextCompletion(taskId);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/50c3a73e-ed9b-489d-9c57-b43ba19279a7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/ai-demo/image-to-image/route.ts:159',message:'Flux Kontext completion',data:{imageUrlsCount:imageUrls?.length,imageUrls},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
        // #endregion
      }
    } else if (modelId === "gpt4o-image") {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/50c3a73e-ed9b-489d-9c57-b43ba19279a7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/ai-demo/image-to-image/route.ts:111',message:'GPT4o Image generation start',data:{modelId,prompt,filesUrl:[imageUrl]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
      // #endregion
      taskId = await client.generate4oImage({
        prompt,
        filesUrl: [imageUrl],
        size: "1:1",
        nVariants: 1,
      });
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/50c3a73e-ed9b-489d-9c57-b43ba19279a7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/ai-demo/image-to-image/route.ts:167',message:'GPT4o Image taskId received',data:{taskId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
      // #endregion
      
      if (wait) {
        imageUrls = await client.waitFor4oImageCompletion(taskId);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/50c3a73e-ed9b-489d-9c57-b43ba19279a7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/ai-demo/image-to-image/route.ts:178',message:'GPT4o Image completion',data:{imageUrlsCount:imageUrls?.length,imageUrls},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
        // #endregion
      }
    } else {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/50c3a73e-ed9b-489d-9c57-b43ba19279a7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/ai-demo/image-to-image/route.ts:119',message:'Unsupported model',data:{modelId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
      // #endregion
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

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/50c3a73e-ed9b-489d-9c57-b43ba19279a7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/ai-demo/image-to-image/route.ts:194',message:'Checking result URLs',data:{hasImageUrls:!!imageUrls,imageUrlsCount:imageUrls?.length,imageUrls},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
    // #endregion

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/50c3a73e-ed9b-489d-9c57-b43ba19279a7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/ai-demo/image-to-image/route.ts:188',message:'Success returning result',data:{imageUrl:imageUrls[0]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
    // #endregion
    
    return apiResponse.success({ imageUrl: imageUrls[0] });

  } catch (error: any) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/50c3a73e-ed9b-489d-9c57-b43ba19279a7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/ai-demo/image-to-image/route.ts:128',message:'Top level error caught',data:{errorName:error?.name,errorMessage:error?.message,errorStack:error?.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'K'})}).catch(()=>{});
    // #endregion
    console.error("Image-to-Image generation failed:", error);
    const errorMessage = error?.message || "Failed to transform image";
    if (errorMessage.includes("API key") || errorMessage.includes("authentication")) {
      return apiResponse.serverError(`Server configuration error: ${errorMessage}`);
    }
    return apiResponse.serverError(errorMessage);
  }
}
