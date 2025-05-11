"use server";

import { BLOGS_IMAGE_PAGE_SIZE, BLOGS_IMAGE_PATH } from "@/config/common";
import { actionResponse } from "@/lib/action-response";
import { deleteFile, listR2Objects, type ListedObject } from "@/lib/cloudflare/r2";

export async function deleteImageAction(key: string) {
  try {
    deleteFile(key);
  } catch (error: any) {
    console.error(`Failed to delete R2 file (${key}):`, error);
    return actionResponse.error(error.message || 'Failed to delete file from R2.');
  }
}

interface ListBlogImagesParams {
  continuationToken?: string;
  filterPrefix?: string;
  pageSize?: number;
}
interface ListImagesResponse {
  success: boolean;
  data?: {
    files?: ListedObject[];
    nextContinuationToken?: string;
  };
  error?: string;
}

export async function listBlogImagesAction(
  params?: ListBlogImagesParams
): Promise<ListImagesResponse> {
  try {
    const filterPrefix = params?.filterPrefix || "";
    const searchPrefix = filterPrefix ? `${BLOGS_IMAGE_PATH}${filterPrefix}` : BLOGS_IMAGE_PATH;
    const result = await listR2Objects({
      prefix: searchPrefix,
      continuationToken: params?.continuationToken,
      pageSize: params?.pageSize || BLOGS_IMAGE_PAGE_SIZE,
    });

    if (result.error) {
      return actionResponse.error(result.error);
    }

    return actionResponse.success({ files: result.objects, nextContinuationToken: result.nextContinuationToken });
  } catch (error) {
    console.error("List images action failed:", error);
    return actionResponse.error(error instanceof Error ? error.message : "Failed to list images.");
  }
}