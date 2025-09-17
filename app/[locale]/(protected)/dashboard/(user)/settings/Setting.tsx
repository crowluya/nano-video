"use client";

import { updateUserSettingsAction } from "@/actions/users/settings";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth/auth-client";
import { user as userSchema } from "@/lib/db/schema";
import {
  AVATAR_ACCEPT_ATTRIBUTE,
  AVATAR_ALLOWED_EXTENSIONS,
  AVATAR_ALLOWED_FILE_TYPES,
  AVATAR_MAX_FILE_SIZE,
  FULL_NAME_MAX_LENGTH,
  isValidFullName,
} from "@/lib/validations";
import { Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type User = typeof userSchema.$inferSelect;

export default function Settings({ user }: { user: User }) {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [fullNameError, setFullNameError] = useState<string>("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const t = useTranslations("Settings");
  const locale = useLocale();

  useEffect(() => {
    setFullName(user?.name || "");
  }, [user]);

  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFullName(value);

    if (value.length > FULL_NAME_MAX_LENGTH) {
      setFullNameError(
        t("toast.fullNameLengthError", {
          maxLength: FULL_NAME_MAX_LENGTH,
        })
      );
    } else if (value && !isValidFullName(value)) {
      setFullNameError(t("toast.fullNameInvalidCharactersError"));
    } else {
      setFullNameError("");
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!AVATAR_ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error(t("toast.errorInvalidFileType"), {
        description: t("toast.errorInvalidFileTypeDescription", {
          allowedTypes: AVATAR_ALLOWED_EXTENSIONS.join(", ").toUpperCase(),
        }),
      });
      e.target.value = "";
      return;
    }

    if (file.size > AVATAR_MAX_FILE_SIZE) {
      toast.error(t("toast.errorFileSizeExceeded"), {
        description: t("toast.errorFileSizeExceededDescription", {
          maxSizeInMB: AVATAR_MAX_FILE_SIZE / 1024 / 1024,
        }),
      });
      e.target.value = "";
      return;
    }

    setAvatarFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (fullNameError || !fullName.trim()) {
      toast.error(t("toast.errorInvalidFullName"), {
        description: fullNameError || t("toast.errorFullNameRequired"),
      });
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("fullName", fullName.trim());
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      const result = await updateUserSettingsAction({
        formData,
        locale: locale || undefined,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      toast.success(t("toast.updateSuccessTitle"), {
        description: t("toast.updateSuccessDescription"),
      });

      await authClient.getSession({
        query: {
          disableCookieCache: true,
        },
      });
      router.refresh();

      setAvatarFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        // setPreviewUrl(null);
      }
      const fileInput = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }
    } catch (error) {
      toast.error(t("toast.updateErrorTitle"), {
        description:
          error instanceof Error
            ? error.message
            : t("toast.updateErrorDescription"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    };
  }, [previewUrl]);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">{t("title")}</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label>{t("form.emailLabel")}</Label>
          <Input defaultValue={user.email} disabled className="bg-muted" />
        </div>

        <div className="space-y-2">
          <Label>{t("form.fullNameLabel")}</Label>
          <Input
            value={fullName}
            onChange={handleFullNameChange}
            placeholder={t("form.fullNamePlaceholder")}
            maxLength={FULL_NAME_MAX_LENGTH}
          />
          {fullNameError && (
            <p className="text-sm text-red-500 mt-1">{fullNameError}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>{t("form.avatarLabel")}</Label>
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20">
              <AvatarImage
                src={previewUrl || user.image || undefined}
                alt={user.name || "User avatar"}
              />
              <AvatarFallback>{user.email[0] || ""}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <Input
                type="file"
                accept={AVATAR_ACCEPT_ATTRIBUTE}
                onChange={handleAvatarChange}
                className="max-w-[300px] hover:cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">
                {t("form.avatarHint", {
                  maxSizeInMB: AVATAR_MAX_FILE_SIZE / 1024 / 1024,
                  allowedTypes:
                    AVATAR_ALLOWED_EXTENSIONS.join(", ").toUpperCase(),
                })}
              </p>
            </div>
          </div>
        </div>

        <Button type="submit" disabled={isLoading || !!fullNameError}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />{" "}
              {t("form.updatingButton")}
            </>
          ) : (
            t("form.updateButton")
          )}
        </Button>
      </form>
    </div>
  );
}
