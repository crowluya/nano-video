"use server";

import { actionResponse } from "@/lib/action-response";
import { deleteFile as deleteR2Util, ListedObject, listR2Objects } from "@/lib/cloudflare/r2";
import { isAdmin } from "@/lib/supabase/isAdmin";
import { z } from "zod";

export type R2File = ListedObject;

export interface ListR2FilesData {
  success: boolean;
  data?: {
    files: R2File[];
    nextContinuationToken?: string;
  };
  error?: string;
}

export interface DeleteR2FileData {
  success: boolean;
  error?: string;
}

const listSchema = z.object({
  categoryPrefix: z.string(),
  filterPrefix: z.string().optional(),
  continuationToken: z.string().optional(),
  pageSize: z.number().int().positive().max(100).default(20),
});

const deleteSchema = z.object({
  key: z.string().min(1, "File key cannot be empty"),
});

export async function listR2Files(
  input: z.infer<typeof listSchema>
): Promise<ListR2FilesData> {
  const validationResult = listSchema.safeParse(input);
  if (!validationResult.success) {
    const formattedErrors = validationResult.error.flatten().fieldErrors;
    return actionResponse.badRequest(`Invalid input: ${JSON.stringify(formattedErrors)}`);
  }

  if (!(await isAdmin())) {
    return actionResponse.forbidden("Admin privileges required.");
  }

  const { categoryPrefix, filterPrefix, continuationToken, pageSize } = validationResult.data;

  const searchPrefix = filterPrefix ? `${categoryPrefix}${filterPrefix}` : categoryPrefix;

  try {
    const result = await listR2Objects({
      prefix: searchPrefix,
      continuationToken: continuationToken,
      pageSize: pageSize,
    });

    if (result.error) {
      return actionResponse.error(result.error);
    }

    return actionResponse.success({
      files: result.objects,
      nextContinuationToken: result.nextContinuationToken,
    });
  } catch (error: any) {
    console.error("Failed to list files using generic R2 lister:", error);
    return actionResponse.error(`Failed to list files: ${error.message || 'Unknown error'}`);
  }
}

export async function deleteR2File(input: z.infer<typeof deleteSchema>): Promise<DeleteR2FileData> {
  const validationResult = deleteSchema.safeParse(input);
  if (!validationResult.success) {
    const formattedErrors = validationResult.error.flatten().fieldErrors;
    return actionResponse.badRequest(`Invalid input: ${JSON.stringify(formattedErrors)}`);
  }

  const { key } = validationResult.data;

  if (!(await isAdmin())) {
    return actionResponse.forbidden("Admin privileges required.");
  }

  try {
    await deleteR2Util(key);
    return actionResponse.success();
  } catch (error: any) {
    console.error(`Failed to delete R2 file (${key}):`, error);
    return actionResponse.error(error.message || 'Failed to delete file from R2.');
  }
} 