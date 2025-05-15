"use client";

import { GoogleIcon } from "@/components/icons";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "@/i18n/routing";
import { Github, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { user, signInWithGoogle, signInWithGithub, signInWithEmail } =
    useAuth();

  const t = useTranslations("Login");

  useEffect(() => {
    if (user) {
      router.replace("/");
    }
  }, [user, router]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await signInWithEmail(email);
      if (error) throw error;
      toast.success(t("Toast.Email.successTitle"), {
        description: t("Toast.Email.successDescription"),
      });
    } catch (error) {
      toast.error(t("Toast.Email.errorTitle"), {
        description: t("Toast.Email.errorDescription"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
    } catch (error) {
      toast.error(t("Toast.Google.errorTitle"), {
        description: t("Toast.Google.errorDescription"),
      });
    }
  };

  const handleGithubLogin = async () => {
    try {
      const { error } = await signInWithGithub();
      if (error) throw error;
    } catch (error) {
      toast.error(t("Toast.Github.errorTitle"), {
        description: t("Toast.Github.errorDescription"),
      });
    }
  };

  if (user) {
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

        <div className="grid gap-6">
          <div className="grid gap-4 w-[300px]">
            <Button variant="outline" onClick={handleGoogleLogin}>
              <GoogleIcon className="mr-2 h-4 w-4" />
              {t("signInMethods.signInWithGoogle")}
            </Button>
            <Button variant="outline" onClick={handleGithubLogin}>
              <Github className="mr-2 h-4 w-4" />
              {t("signInMethods.signInWithGithub")}
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {t("signInMethods.or")}
              </span>
            </div>
          </div>

          <form onSubmit={handleEmailLogin}>
            <div className="grid gap-2">
              <div className="grid gap-1">
                <Input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <Button disabled={isLoading}>
                {t("signInMethods.signInWithEmail")}
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
