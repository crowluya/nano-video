/**
 * Kie.ai File Upload API Route
 * 
 * POST /api/kie/upload
 * - Uploads a file to kie.ai temporary storage
 * - Files are kept for 3 days
 * - Returns a URL that can be used for generation tasks
 */

import { apiResponse } from "@/lib/api-response";
import { getKieClient } from "@/lib/kie";
import { z } from "zod";

const urlUploadSchema = z.object({
  type: z.literal("url"),
  fileUrl: z.string().url("Invalid file URL"),
  uploadPath: z.string().optional(),
  fileName: z.string().optional(),
});

const base64UploadSchema = z.object({
  type: z.literal("base64"),
  base64Data: z.string().min(1, "Base64 data is required"),
  uploadPath: z.string().optional(),
  fileName: z.string().optional(),
});

const inputSchema = z.discriminatedUnion("type", [
  urlUploadSchema,
  base64UploadSchema,
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
    let result;

    if (data.type === "url") {
      result = await client.uploadFileFromUrl({
        fileUrl: data.fileUrl,
        uploadPath: data.uploadPath,
        fileName: data.fileName,
      });
    } else {
      result = await client.uploadFileBase64({
        base64Data: data.base64Data,
        uploadPath: data.uploadPath,
        fileName: data.fileName,
      });
    }

    return apiResponse.success({
      fileUrl: result.fileUrl,
      downloadUrl: result.downloadUrl,
      expiresIn: "3 days",
    });

  } catch (error: unknown) {
    console.error("File upload failed:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to upload file";
    
    if (errorMessage.includes("API key") || errorMessage.includes("authentication") || errorMessage.includes("401")) {
      return apiResponse.unauthorized("Authentication error with Kie.ai API");
    }
    
    return apiResponse.serverError(errorMessage);
  }
}

