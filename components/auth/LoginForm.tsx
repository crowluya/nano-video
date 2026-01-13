"use client";

import { GoogleIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { DEFAULT_LOCALE } from "@/i18n/routing";
import { authClient } from "@/lib/auth/auth-client";
import { Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface LoginFormProps {
  className?: string;
}

export default function LoginForm({ className = "" }: LoginFormProps) {
  const t = useTranslations("Login");
  const locale = useLocale();

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  const signInWithGoogle = async () => {
    const callback = new URL(
      next || locale === DEFAULT_LOCALE ? "" : `/${locale}`,
      window.location.origin
    );

    await authClient.signIn.social(
      {
        provider: "google",
        callbackURL: callback.toString(),
        errorCallbackURL: `/redirect-error`,
      },
      {
        onRequest: () => {
          setIsGoogleLoading(true);
        },
        onError: (ctx) => {
          console.error("Google login error", ctx.error.message);
          setIsGoogleLoading(false);
          toast.error(t("Toast.Google.errorTitle"), {
            description: t("Toast.Google.errorDescription"),
          });
        },
      }
    );
  };

  return (
    <div className={`grid gap-6 ${className}`}>
      <Button
        variant="outline"
        size="lg"
        onClick={signInWithGoogle}
        disabled={isGoogleLoading}
        className="w-full"
      >
        {isGoogleLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <GoogleIcon className="mr-2 h-4 w-4" />
        )}
        {t("signInMethods.signInWithGoogle")}
      </Button>
    </div>
  );
}
