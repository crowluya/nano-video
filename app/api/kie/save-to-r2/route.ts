/**
 * Save Kie.ai Generated Content to R2 API Route
 *
 * POST /api/kie/save-to-r2
 * - Downloads content from kie.ai temporary storage
 * - Uploads to Cloudflare R2 for permanent storage
 * - Returns the permanent R2 URL
 */

import { apiResponse } from "@/lib/api-response";
import { getSession } from "@/lib/auth/server";
import { serverUploadFile } from "@/lib/cloudflare/r2";
import { generateR2Key } from "@/lib/cloudflare/r2-utils";
import { z } from "zod";

// File size limits (in bytes)
const MAX_FILE_SIZE = {
  image: 10 * 1024 * 1024,  // 10MB
  video: 100 * 1024 * 1024, // 100MB
  audio: 20 * 1024 * 1024,  // 20MB
};

const inputSchema = z.object({
  sourceUrl: z.string().url("Invalid source URL"),
  type: z.enum(["image", "video", "audio"]),
  fileName: z.string().optional(),
  path: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session?.user) {
      return apiResponse.unauthorized("Authentication required");
    }

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

    // Validate content type
    const contentType = response.headers.get("content-type") || getDefaultContentType(type);
    if (!isValidContentType(contentType, type)) {
      return apiResponse.badRequest(`Invalid content type: ${contentType} for type: ${type}`);
    }

    // Check content length before downloading
    const contentLength = response.headers.get("content-length");
    if (contentLength) {
      const fileSize = parseInt(contentLength, 10);
      const maxSize = MAX_FILE_SIZE[type];
      if (fileSize > maxSize) {
        return apiResponse.badRequest(
          `File size (${(fileSize / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${(maxSize / 1024 / 1024).toFixed(0)}MB) for ${type}`
        );
      }
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Verify actual file size after download
    if (buffer.length > MAX_FILE_SIZE[type]) {
      return apiResponse.badRequest(
        `File size (${(buffer.length / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${(MAX_FILE_SIZE[type] / 1024 / 1024).toFixed(0)}MB) for ${type}`
      );
    }

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

function isValidContentType(contentType: string, type: "image" | "video" | "audio"): boolean {
  const validTypes: Record<string, string[]> = {
    image: ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"],
    video: ["video/mp4", "video/webm", "video/quicktime"],
    audio: ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg"],
  };

  return validTypes[type]?.some(valid => contentType.toLowerCase().includes(valid)) || false;
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

