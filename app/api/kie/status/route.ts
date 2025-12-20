/**
 * Kie.ai Task Status API Route
 * 
 * GET /api/kie/status?taskId=xxx&type=image|video|music
 * - Checks the status of a generation task
 * - Returns current status and result URLs if completed
 */

import { apiResponse } from "@/lib/api-response";
import { getKieClient } from "@/lib/kie";
import { refundKieCredits } from "@/lib/kie/credits";
import { db } from "@/lib/db";
import { taskCreditMappings, creditLogs as creditLogsSchema } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createActivityLog } from "@/actions/usage/activity-logs";
import { z } from "zod";

const querySchema = z.object({
  taskId: z.string().min(1, "Task ID is required"),
  type: z.enum(["image", "video", "music"]),
  modelId: z.string().optional(),
});

export async function GET(req: Request) {
  try {
    const apiKey = process.env.KIE_API_KEY;
    if (!apiKey) {
      return apiResponse.serverError("Server configuration error: Missing KIE_API_KEY");
    }

    const url = new URL(req.url);
    const rawParams = {
      taskId: url.searchParams.get("taskId"),
      type: url.searchParams.get("type"),
      modelId: url.searchParams.get("modelId"),
    };

    const validationResult = querySchema.safeParse(rawParams);

    if (!validationResult.success) {
      return apiResponse.badRequest(
        `Invalid input: ${validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
      );
    }

    const { taskId, type, modelId } = validationResult.data;
    const client = getKieClient();

    let status: "pending" | "processing" | "success" | "failed" = "pending";
    let resultUrls: string[] = [];
    let rawStatus: unknown = null;

    if (type === "image") {
      // Determine which image status endpoint to use based on modelId
      if (modelId === "gpt4o-image") {
        const imageStatus = await client.get4oImageStatus(taskId);
        rawStatus = imageStatus;
        
        if (imageStatus.successFlag === 1) {
          status = "success";
          resultUrls = imageStatus.response?.resultUrls || [];
        } else if (imageStatus.successFlag === 2 || imageStatus.successFlag === 3) {
          status = "failed";
        } else {
          status = "processing";
        }
      } else if (modelId === "flux-kontext-pro" || modelId === "flux-kontext-max") {
        const fluxStatus = await client.getFluxKontextStatus(taskId);
        rawStatus = fluxStatus;
        
        if (fluxStatus.successFlag === 1) {
          status = "success";
          // Extract URL from response.resultImageUrl (actual API format)
          if (fluxStatus.response?.resultImageUrl) {
            resultUrls = [fluxStatus.response.resultImageUrl];
          } else if (fluxStatus.resultUrls && fluxStatus.resultUrls.length > 0) {
            resultUrls = fluxStatus.resultUrls;
          } else if (fluxStatus.resultUrl) {
            resultUrls = [fluxStatus.resultUrl];
          }
        } else if (fluxStatus.successFlag === 2 || fluxStatus.successFlag === 3) {
          status = "failed";
        } else {
          status = "processing";
        }
      } else if (modelId === "midjourney") {
        const mjStatus = await client.getMidjourneyStatus(taskId);
        rawStatus = mjStatus;
        
        if (mjStatus.successFlag === 1 || mjStatus.state === "success") {
          status = "success";
          resultUrls = mjStatus.resultUrls || [];
        } else if (mjStatus.successFlag === 2 || mjStatus.successFlag === 3 || mjStatus.state === "fail") {
          status = "failed";
        } else {
          status = "processing";
        }
      } else {
        // Nano Banana and others use generic job endpoint
        const jobStatus = await client.getNanoBananaStatus(taskId);
        rawStatus = jobStatus;
        
        if (jobStatus.state === "success") {
          status = "success";
          if (jobStatus.resultJson) {
            try {
              const result = JSON.parse(jobStatus.resultJson);
              resultUrls = result.resultUrls || result.result_urls || [];
            } catch {
              // Ignore parse error
            }
          }
        } else if (jobStatus.state === "fail" || jobStatus.state === "failed") {
          status = "failed";
        } else {
          status = "processing";
        }
      }
    } else if (type === "video") {
      // Determine which video status endpoint to use based on modelId
      if (modelId === "veo3" || modelId === "veo3_fast") {
        const veoStatus = await client.getVeo3Status(taskId);
        rawStatus = veoStatus;
        
        if (veoStatus.successFlag === 1) {
          status = "success";
          // Priority 1: Extract from response.resultUrls (actual API format)
          if (veoStatus.response?.resultUrls && veoStatus.response.resultUrls.length > 0) {
            resultUrls = veoStatus.response.resultUrls;
          } 
          // Priority 2: Parse legacy resultUrls JSON string
          else if (veoStatus.resultUrls) {
            try {
              const urls = JSON.parse(veoStatus.resultUrls);
              resultUrls = Array.isArray(urls) ? urls : [urls];
            } catch {
              resultUrls = [veoStatus.resultUrls];
            }
          } 
          // Priority 3: Use videoUrl if exists
          else if (veoStatus.videoUrl) {
            resultUrls = [veoStatus.videoUrl];
          }
        } else if (veoStatus.successFlag === 2 || veoStatus.successFlag === 3) {
          status = "failed";
        } else {
          status = "processing";
        }
      } else if (modelId === "runway-gen3") {
        const runwayStatus = await client.getRunwayStatus(taskId);
        rawStatus = runwayStatus;
        
        if (runwayStatus.state === "success") {
          status = "success";
          if (runwayStatus.videoInfo?.videoUrl) {
            resultUrls = [runwayStatus.videoInfo.videoUrl];
          }
        } else if (runwayStatus.state === "fail") {
          status = "failed";
        } else {
          status = "processing";
        }
      } else {
        // Sora 2, Wan use generic job endpoint
        const jobStatus = await client.getSora2Status(taskId);
        rawStatus = jobStatus;
        
        if (jobStatus.state === "success") {
          status = "success";
          if (jobStatus.resultJson) {
            try {
              const result = JSON.parse(jobStatus.resultJson);
              resultUrls = result.resultUrls || result.result_urls || [];
            } catch {
              // Ignore parse error
            }
          }
        } else if (jobStatus.state === "fail" || jobStatus.state === "failed") {
          status = "failed";
        } else {
          status = "processing";
        }
      }

      // If task failed, check if we need to refund credits
      if (status === "failed" && type === "video") {
        try {
          // Find the credit log mapping for this task
          const mapping = await db.select()
            .from(taskCreditMappings)
            .where(and(
              eq(taskCreditMappings.taskId, taskId),
              eq(taskCreditMappings.refunded, false)
            ))
            .limit(1);

          if (mapping.length > 0 && mapping[0].creditLogId) {
            const creditLogId = mapping[0].creditLogId;
            
            // Get the original credit log to find the amount
            const creditLog = await db.select()
              .from(creditLogsSchema)
              .where(eq(creditLogsSchema.id, creditLogId))
              .limit(1);

            if (creditLog.length > 0) {
              const amountToRefund = Math.abs(creditLog[0].amount);
              
              // Refund credits
              const refundResult = await refundKieCredits(
                amountToRefund,
                `Refund for failed video generation task: ${taskId}`,
                creditLogId
              );

              if (refundResult.success) {
                // Mark as refunded
                await db.update(taskCreditMappings)
                  .set({ refunded: true })
                  .where(eq(taskCreditMappings.id, mapping[0].id));

                // Log activity
                await createActivityLog({
                  action: 'video_generation_failed_refunded',
                  resourceType: 'video',
                  resourceId: taskId,
                  metadata: {
                    taskId,
                    creditsRefunded: amountToRefund,
                  },
                }).catch(err => console.error('Failed to log activity:', err));

                console.log(`Credits refunded for failed task ${taskId}: ${amountToRefund}`);
              }
            }
          }
        } catch (refundError) {
          console.error(`Failed to refund credits for task ${taskId}:`, refundError);
          // Don't fail the status check, just log the error
        }
      }
    } else if (type === "music") {
      const sunoStatus = await client.getSunoStatus(taskId);
      rawStatus = sunoStatus;
      
      if (sunoStatus.status === "SUCCESS") {
        status = "success";
        // Extract audio URLs from suno data
        if (sunoStatus.response?.sunoData) {
          resultUrls = sunoStatus.response.sunoData.map(track => track.audio_url);
        }
      } else if (sunoStatus.status === "FAILED") {
        status = "failed";
      } else {
        status = "processing";
      }
    }

    // Check if credits were refunded for failed tasks
    let creditsRefunded = false;
    if (status === "failed" && type === "video") {
      const mapping = await db.select()
        .from(taskCreditMappings)
        .where(eq(taskCreditMappings.taskId, taskId))
        .limit(1)
        .catch(() => []);
      
      creditsRefunded = mapping.length > 0 ? mapping[0].refunded : false;
    }

    return apiResponse.success({
      taskId,
      type,
      status,
      resultUrls,
      isComplete: status === "success" || status === "failed",
      creditsRefunded,
      raw: rawStatus,
    });

  } catch (error: unknown) {
    console.error("Status check failed:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to check status";
    return apiResponse.serverError(errorMessage);
  }
}

