/**
 * Kie.ai Music Generation API Route (Suno)
 * 
 * POST /api/kie/music
 * - action: "generate" - Creates a music generation task
 * - action: "extend" - Extends existing music
 * - action: "lyrics" - Generates lyrics only
 */

import { apiResponse } from "@/lib/api-response";
import { getKieClient } from "@/lib/kie";
import { deductKieCredits } from "@/lib/kie/credits";
import { getKieMusicModel } from "@/config/models";
import { z } from "zod";

const generateSchema = z.object({
  action: z.literal("generate"),
  modelId: z.string().min(1, "Model ID is required"),
  prompt: z.string().min(1, "Prompt is required"),
  customMode: z.boolean().optional(),
  instrumental: z.boolean().optional(),
  style: z.string().optional(),
  title: z.string().optional(),
});

const extendSchema = z.object({
  action: z.literal("extend"),
  modelId: z.string().optional(),
  audioId: z.string().min(1, "Audio ID is required"),
  prompt: z.string().min(1, "Prompt is required"),
  continueAt: z.number().optional(),
  style: z.string().optional(),
  title: z.string().optional(),
});

const lyricsSchema = z.object({
  action: z.literal("lyrics"),
  prompt: z.string().min(1, "Prompt is required"),
});

const inputSchema = z.discriminatedUnion("action", [
  generateSchema,
  extendSchema,
  lyricsSchema,
]);

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

    const data = validationResult.data;
    const client = getKieClient();

    if (data.action === "lyrics") {
      // Generate lyrics only
      const result = await client.generateSunoLyrics({
        prompt: data.prompt,
      });

      return apiResponse.success({
        lyrics: result.lyrics,
        title: result.title,
      });
    }

    if (data.action === "extend") {
      // Extend existing music
      const taskId = await client.extendSunoMusic({
        audioId: data.audioId,
        prompt: data.prompt,
        continueAt: data.continueAt,
        model: data.modelId as "V3_5" | "V4" | "V4_5" | "V4_5_Plus" | "V5" | undefined,
        style: data.style,
        title: data.title,
      });

      return apiResponse.success({
        taskId,
        action: "extend",
      });
    }

    // Generate new music
    const modelConfig = getKieMusicModel(data.modelId);
    if (!modelConfig) {
      return apiResponse.badRequest(`Unknown music model: ${data.modelId}`);
    }

    // Deduct credits before generation
    const creditResult = await deductKieCredits('music', data.modelId, `Music generation: ${data.prompt.slice(0, 50)}...`);
    if (!creditResult.success) {
      return apiResponse.badRequest(creditResult.error || 'Insufficient credits');
    }

    const taskId = await client.generateSunoMusic({
      prompt: data.prompt,
      model: data.modelId as "V3_5" | "V4" | "V4_5" | "V4_5_Plus" | "V5",
      customMode: data.customMode,
      instrumental: data.instrumental,
      style: data.style,
      title: data.title,
    });

    return apiResponse.success({
      taskId,
      modelId: data.modelId,
      creditsUsed: modelConfig.creditsPerGeneration,
    });

  } catch (error: unknown) {
    console.error("Music generation failed:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate music";
    
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

