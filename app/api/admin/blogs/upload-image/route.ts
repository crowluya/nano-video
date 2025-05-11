/**
 * 1、Due to the default 1MB body size limit for Server Actions, we recommend implementing file uploads via Route Handlers.
 * 2、The file upload process typically goes from local to server, and then from server to R2. For the server-to-R2 leg of this journey, the Edge runtime offers better performance.
 */

export const runtime = "edge";

import { BLOGS_IMAGE_PATH } from '@/config/common';
import { DEFAULT_LOCALE } from '@/i18n/routing';
import { apiResponse } from '@/lib/api-response';
import { uploadFile } from '@/lib/cloudflare/r2';
import { isAdmin } from '@/lib/supabase/isAdmin';
import { getTranslations } from 'next-intl/server';
import { headers } from 'next/headers';

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return apiResponse.forbidden("Admin privileges required.");
  }

  const { get } = await headers();
  const locale = get("Accept-Language");

  const t = await getTranslations({ locale: locale || DEFAULT_LOCALE, namespace: 'Dashboard.Admin.Blogs.Form.upload' });

  try {
    const formData = await request.formData();
    const file = formData.get("image") as File | null;
    const prefix = formData.get("prefix") as string | null;

    if (!file) {
      return apiResponse.badRequest(t("uploadErrorDesc"));
    }

    if (!prefix) {
      return apiResponse.badRequest(t("noPrefix"));
    }

    if (!file.type.startsWith("image/")) {
      return apiResponse.badRequest(t("invalidFileType"));
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return apiResponse.badRequest(t("fileSizeExceeded", { maxSizeInMB: maxSize / 1024 / 1024 }));
    }

    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileExtension = file.type.split("/")[1];

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadFile({
      data: fileBuffer,
      fileName: `${prefix}-${timestamp}-${randomString}.${fileExtension}`,
      contentType: file.type,
      path: BLOGS_IMAGE_PATH,
    });

    return apiResponse.success({ url: result.url, key: result.key });
  } catch (error) {
    console.error("API Upload failed:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to upload image.";
    return apiResponse.error(errorMessage);
  }
}