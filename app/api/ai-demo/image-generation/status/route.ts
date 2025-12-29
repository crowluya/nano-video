/**
 * Image Generation Status API Route
 * Polling endpoint for checking image generation status
 */

import { getKieImageModel } from "@/config/models";
import { apiResponse } from "@/lib/api-response";
import { getSession } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { taskCreditMappings } from "@/lib/db/schema";
import { getKieClient } from "@/lib/kie";
import { refundKieCredits } from "@/lib/kie/credits";
import { eq } from "drizzle-orm";
import { z } from 'zod';

const statusSchema = z.object({
  taskId: z.string(),
  modelId: z.string(),
});

export async function POST(req: Request) {
  try {
    const rawBody = await req.json();

    const validationResult = statusSchema.safeParse(rawBody);
    if (!validationResult.success) {
      return apiResponse.badRequest(`Invalid input: ${validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
    }

    const { taskId, modelId } = validationResult.data;

    // Validate model exists
    const modelConfig = getKieImageModel(modelId);
    if (!modelConfig) {
      return apiResponse.badRequest(`Unknown image model: ${modelId}`);
    }

    const client = getKieClient();
    let imageUrls: string[] = [];
    let status = "processing";

    // Check status based on model
    if (modelId === "google/nano-banana" || modelId === "google/nano-banana-edit" || modelId === "nano-banana-pro") {
      // Nano Banana / Nano Banana Pro
      const nanoStatus = await client.getNanoBananaStatus(taskId);

      if (nanoStatus.state === 'success') {
        status = "completed";
        if (nanoStatus.resultJson) {
          const result = JSON.parse(nanoStatus.resultJson);
          imageUrls = result.resultUrls || result.result_urls || [];
        }
      } else if (nanoStatus.state === 'fail' || nanoStatus.state === 'failed') {
        status = "failed";
      }
    } else if (modelId === "midjourney") {
      // Midjourney
      const mjStatus = await client.getMidjourneyStatus(taskId);

      if (mjStatus.successFlag === 1 || mjStatus.state === 'success') {
        status = "completed";
        if (mjStatus.resultInfoJson?.resultUrls) {
          imageUrls = mjStatus.resultInfoJson.resultUrls.map(item => item.resultUrl);
        } else {
          imageUrls = mjStatus.resultUrls || [];
        }
      } else if (mjStatus.successFlag === 2 || mjStatus.successFlag === 3 || mjStatus.state === 'fail' || mjStatus.state === 'failed') {
        status = "failed";
      }
    } else {
      return apiResponse.badRequest(`Unsupported image model: ${modelId}`);
    }

    // If completed, return the image URL
    if (status === "completed" && imageUrls.length > 0) {
      return apiResponse.success({
        status,
        imageUrl: imageUrls[0],
        imageUrls,
      });
    }

    // If failed, attempt refund
    if (status === "failed") {
      // Get credit mapping for refund
      const session = await getSession();
      if (session?.user) {
        const mapping = await db.select()
          .from(taskCreditMappings)
          .where(eq(taskCreditMappings.taskId, taskId))
          .limit(1);

        if (mapping.length > 0 && !mapping[0].refunded) {
          try {
            await refundKieCredits(
              modelConfig.creditsPerGeneration || 10,
              `Refund for failed image generation: ${modelId}`,
              mapping[0].creditLogId
            );
            // Mark as refunded
            await db.update(taskCreditMappings)
              .set({ refunded: true })
              .where(eq(taskCreditMappings.id, mapping[0].id));
          } catch (err) {
            console.error('Failed to refund credits:', err);
          }
        }
      }

      return apiResponse.success({
        status: "failed",
        error: "Image generation failed",
      });
    }

    // Still processing
    return apiResponse.success({
      status: "processing",
    });
  } catch (error: any) {
    console.error("Image status check failed:", error);
    const errorMessage = error?.message || "Failed to check status";
    return apiResponse.serverError(errorMessage);
  }
}
