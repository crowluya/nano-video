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
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/50c3a73e-ed9b-489d-9c57-b43ba19279a7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/ai-demo/image-to-video/route.ts:45',message:'Starting image upload',data:{modelId,hasBase64Data:!!imageBase64DataUri,base64Length:imageBase64DataUri?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      const uploadResult = await client.uploadFileBase64({
        base64Data: imageBase64DataUri.split(',')[1],
        uploadPath: "ai-demo/image-to-video",
        fileName: `input-image-${Date.now()}.png`,
      });

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/50c3a73e-ed9b-489d-9c57-b43ba19279a7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/ai-demo/image-to-video/route.ts:52',message:'Upload result',data:{hasDownloadUrl:!!uploadResult?.downloadUrl,downloadUrl:uploadResult?.downloadUrl,hasFileUrl:!!uploadResult?.fileUrl,fileUrl:uploadResult?.fileUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      // Use downloadUrl as the primary image URL, fallback to fileUrl for backward compatibility
      const uploadedImageUrl = uploadResult?.downloadUrl || uploadResult?.fileUrl;
      if (!uploadedImageUrl) {
        return apiResponse.serverError("Failed to upload image: No image URL returned (neither downloadUrl nor fileUrl)");
      }

      imageUrl = uploadedImageUrl;
    }

    // Generate video based on model and wait for completion
    if (modelId.startsWith("sora-2")) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/50c3a73e-ed9b-489d-9c57-b43ba19279a7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/ai-demo/image-to-video/route.ts:62',message:'Sora 2 generation start',data:{modelId,hasImageUrl:!!imageUrl,imageUrl,prompt,duration},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      
      // Sora 2 - Text to Video or Image to Video
      // Determine model based on whether image is provided
      const soraModel = imageUrl 
        ? (modelId.includes("pro") ? "sora-2-pro-image-to-video" : "sora-2-image-to-video")
        : (modelId.includes("pro") ? "sora-2-pro-text-to-video" : "sora-2-text-to-video");
      
      const taskId = await client.generateSora2Video({
        model: soraModel as "sora-2-text-to-video" | "sora-2-image-to-video" | "sora-2-pro-text-to-video" | "sora-2-pro-image-to-video",
        input: {
          prompt,
          image_urls: imageUrl ? [imageUrl] : undefined,
          aspect_ratio: "landscape",
          n_frames: duration?.toString() === "5" ? "10" : "15", // 5 seconds = 10 frames, 10 seconds = 15 frames
        },
      });
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/50c3a73e-ed9b-489d-9c57-b43ba19279a7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/ai-demo/image-to-video/route.ts:78',message:'Sora 2 taskId received',data:{taskId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      
      videoUrls = await client.waitForSora2Completion(taskId);
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/50c3a73e-ed9b-489d-9c57-b43ba19279a7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/ai-demo/image-to-video/route.ts:78',message:'Sora 2 completion',data:{videoUrlsCount:videoUrls?.length,videoUrls},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
    } else if (modelId.startsWith("veo3")) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/50c3a73e-ed9b-489d-9c57-b43ba19279a7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/ai-demo/image-to-video/route.ts:79',message:'Veo 3 generation start',data:{modelId,hasImageUrl:!!imageUrl,imageUrl,prompt,generationType:imageUrl?'FIRST_AND_LAST_FRAMES_2_VIDEO':'TEXT_2_VIDEO'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      // Veo 3.1 - Text to Video, Image to Video, or First/Last Frame
      const generationType = imageUrl 
        ? "FIRST_AND_LAST_FRAMES_2_VIDEO" 
        : "TEXT_2_VIDEO";
      
      const taskId = await client.generateVeo3Video({
        prompt,
        imageUrls: imageUrl ? [imageUrl] : undefined,
        model: modelId === "veo3_fast" ? "veo3_fast" : "veo3",
        generationType: generationType as "TEXT_2_VIDEO" | "FIRST_AND_LAST_FRAMES_2_VIDEO" | "REFERENCE_2_VIDEO",
        aspectRatio: "16:9",
      });
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/50c3a73e-ed9b-489d-9c57-b43ba19279a7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/ai-demo/image-to-video/route.ts:92',message:'Veo 3 taskId received',data:{taskId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      videoUrls = await client.waitForVeo3Completion(taskId);
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/50c3a73e-ed9b-489d-9c57-b43ba19279a7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/ai-demo/image-to-video/route.ts:92',message:'Veo 3 completion',data:{videoUrlsCount:videoUrls?.length,videoUrls},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
    } else {
      return apiResponse.badRequest(`Unsupported video model: ${modelId}. Only Sora 2 and Veo 3.1 are supported.`);
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/50c3a73e-ed9b-489d-9c57-b43ba19279a7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/ai-demo/image-to-video/route.ts:97',message:'Checking video URLs',data:{hasVideoUrls:!!videoUrls,videoUrlsCount:videoUrls?.length,videoUrls},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    
    if (!videoUrls || videoUrls.length === 0) {
      return apiResponse.serverError("Failed to generate video: No video URL returned");
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/50c3a73e-ed9b-489d-9c57-b43ba19279a7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/ai-demo/image-to-video/route.ts:101',message:'Success returning result',data:{videoUrl:videoUrls[0]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    
    return apiResponse.success({ videoUrl: videoUrls[0] });

  } catch (error: any) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/50c3a73e-ed9b-489d-9c57-b43ba19279a7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/ai-demo/image-to-video/route.ts:103',message:'Top level error caught',data:{errorName:error?.name,errorMessage:error?.message,errorStack:error?.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    console.error("Video generation failed:", error);
    const errorMessage = error?.message || "Failed to generate video";
    if (errorMessage.includes("API key") || errorMessage.includes("authentication")) {
      return apiResponse.serverError(`Server configuration error: ${errorMessage}`);
    }
    return apiResponse.serverError(errorMessage);
  }
}
