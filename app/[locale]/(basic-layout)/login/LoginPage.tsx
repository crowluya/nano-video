"use client";

import LoginForm from "@/components/auth/LoginForm";
import { useRouter } from "@/i18n/routing";
import { authClient } from "@/lib/auth/auth-client";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Suspense, useEffect } from "react";

export default function LoginPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const t = useTranslations("Login");

  useEffect(() => {
    if (session?.user) {
      router.replace("/");
    }
  }, [router, session?.user]);

  if (session?.user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-4 h-4 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center flex-1 py-12">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>

        <Suspense fallback={<Loader2 className="w-4 h-4 animate-spin" />}>
          <LoginForm className="w-[300px]" />
        </Suspense>
      </div>
    </div>
  );
}
