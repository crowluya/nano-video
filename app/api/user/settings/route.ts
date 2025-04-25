import { apiResponse } from "@/lib/api-response";
import { deleteFile, uploadFile } from "@/lib/cloudflare/r2";
import { createClient } from "@/lib/supabase/server";
import { AVATAR_ALLOWED_FILE_TYPES, AVATAR_MAX_FILE_SIZE, isValidFullName } from "@/lib/validations";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";

const MAX_FILE_SIZE = AVATAR_MAX_FILE_SIZE;
const ALLOWED_FILE_TYPES = AVATAR_ALLOWED_FILE_TYPES;

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return apiResponse.unauthorized();
    }

    const { get } = await headers();
    const locale = get("Accept-Language");

    const t = await getTranslations({ locale: locale || "en", namespace: 'Dashboard.User.Settings' });

    const formData = await request.formData();
    const fullName = formData.get("fullName") as string;
    const avatar = formData.get("avatar") as File | null;
    const inviteCode = formData.get("inviteCode") as string;
    const billingAddress = formData.get("billingAddress") as string;

    if (!isValidFullName(fullName)) {
      return apiResponse.badRequest(t("toast.errorInvalidFullName"));
    }

    let avatarUrl: string = '';

    if (avatar) {
      if (!ALLOWED_FILE_TYPES.includes(avatar.type)) {
        return apiResponse.badRequest(t("toast.errorInvalidFileType"));
      }

      if (avatar.size > MAX_FILE_SIZE) {
        return apiResponse.badRequest(t("toast.errorFileSizeExceeded", {
          maxSizeInMB: MAX_FILE_SIZE / 1024 / 1024,
        }));
      }

      try {
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        const fileExtension = avatar.type.split("/")[1];

        const buffer = Buffer.from(await avatar.arrayBuffer());
        const { url } = await uploadFile({
          data: buffer,
          contentType: avatar.type,
          path: `avatars/${authUser.id}/`,
          fileName: `avatar-${timestamp}-${randomString}.${fileExtension}`,
        });

        if (authUser.user_metadata?.avatar_url) {
          try {
            const oldAvatarUrl = authUser.user_metadata.avatar_url;
            const oldPath = new URL(oldAvatarUrl).pathname.split('/').slice(-3).join('/');

            if (oldPath.startsWith(`avatars/${authUser.id}/`)) {
              await deleteFile(oldPath);
            }
          } catch (error) {
            console.error("Failed to delete old avatar:", error);
            return apiResponse.serverError(t("toast.errorDeleteOldAvatar"));
          }
        }

        avatarUrl = url;
      } catch (error) {
        console.error("Avatar upload error:", error);
        return apiResponse.serverError(t("toast.errorUploadAvatar"));
      }
    }

    const { error: updateAuthError } = await supabase.auth.updateUser({
      data: {
        full_name: fullName.trim(),
        ...(avatarUrl && { avatar_url: avatarUrl }),
      },
    });

    if (updateAuthError) {
      return apiResponse.serverError(t("toast.errorUpdateAuthUser"));
    }

    const { error: updateUserError } = await supabase.rpc(
      'update_my_profile',
      {
        new_full_name: fullName?.trim() || '',
        new_avatar_url: avatarUrl || '',
        new_invite_code: inviteCode || '',
      }
    );

    if (updateUserError) {
      return apiResponse.serverError(t("toast.errorUpdateUserProfile"));
    }

    return apiResponse.success({ message: t("toast.updateSuccessDescription") });
  } catch (error) {
    console.error("Settings update error:", error);
    return apiResponse.serverError(
      error instanceof Error ? error.message : "Failed to update settings"
    );
  }
} 