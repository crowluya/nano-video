/**
 * Save Kie.ai Generated Content to R2 API Route
 * 
 * POST /api/kie/save-to-r2
 * - Downloads content from kie.ai temporary storage
 * - Uploads to Cloudflare R2 for permanent storage
 * - Returns the permanent R2 URL
 */

import { apiResponse } from "@/lib/api-response";
import { serverUploadFile } from "@/lib/cloudflare/r2";
import { generateR2Key } from "@/lib/cloudflare/r2-utils";
import { z } from "zod";

const inputSchema = z.object({
  sourceUrl: z.string().url("Invalid source URL"),
  type: z.enum(["image", "video", "audio"]),
  fileName: z.string().optional(),
  path: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    // Check R2 configuration
    if (!process.env.R2_BUCKET_NAME || !process.env.R2_PUBLIC_URL) {
      return apiResponse.serverError("Server configuration error: R2 is not configured");
    }

    const rawBody = await req.json();
    const validationResult = inputSchema.safeParse(rawBody);

    if (!validationResult.success) {
      return apiResponse.badRequest(
        `Invalid input: ${validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
      );
    }

    const { sourceUrl, type, fileName, path } = validationResult.data;

    // Fetch the file from kie.ai
    const response = await fetch(sourceUrl);
    if (!response.ok) {
      return apiResponse.badRequest(`Failed to fetch file from source: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type") || getDefaultContentType(type);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Determine file extension
    let extension = getExtensionFromContentType(contentType);
    if (!extension) {
      extension = getDefaultExtension(type);
    }

    // Generate R2 key
    const finalFileName = fileName || `${type}-${Date.now()}`;
    const r2Key = generateR2Key({
      fileName: finalFileName.includes(".") ? finalFileName : `${finalFileName}.${extension}`,
      path: path || `nano-banana/${type}s`,
    });

    // Upload to R2
    const result = await serverUploadFile({
      data: buffer,
      contentType,
      key: r2Key,
    });

    return apiResponse.success({
      url: result.url,
      key: result.key,
      contentType,
      size: buffer.length,
      type,
    });

  } catch (error: unknown) {
    console.error("Save to R2 failed:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to save file to R2";
    return apiResponse.serverError(errorMessage);
  }
}

function getDefaultContentType(type: "image" | "video" | "audio"): string {
  switch (type) {
    case "image":
      return "image/png";
    case "video":
      return "video/mp4";
    case "audio":
      return "audio/mpeg";
    default:
      return "application/octet-stream";
  }
}

function getExtensionFromContentType(contentType: string): string | null {
  const mapping: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/quicktime": "mov",
    "audio/mpeg": "mp3",
    "audio/mp3": "mp3",
    "audio/wav": "wav",
    "audio/ogg": "ogg",
  };
  
  return mapping[contentType.toLowerCase()] || null;
}

function getDefaultExtension(type: "image" | "video" | "audio"): string {
  switch (type) {
    case "image":
      return "png";
    case "video":
      return "mp4";
    case "audio":
      return "mp3";
    default:
      return "bin";
  }
}

