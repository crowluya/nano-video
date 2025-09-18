"use client";

import { GoogleIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEFAULT_LOCALE } from "@/i18n/routing";
import { authClient } from "@/lib/auth/auth-client";
import { Turnstile } from "@marsidev/react-turnstile";
import { Github, Loader2 } from "lucide-react";
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

  const lastMethod = authClient.getLastUsedLoginMethod();

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGithubLoading, setIsGithubLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string>("");
  const [showTurnstile, setShowTurnstile] = useState(false);

  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const callback = new URL(
      next || locale === DEFAULT_LOCALE ? "" : `/${locale}`,
      window.location.origin
    );

    try {
      await authClient.signIn.magicLink({
        email: "weijunext@gmail.com",
        name: "my-name",
        callbackURL: callback.toString(),
        errorCallbackURL: "/redirect-error",
        fetchOptions: {
          headers: {
            "x-captcha-response": captchaToken || "",
          },
        },
      });
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

  const signInSocial = async (provider: string) => {
    const callback = new URL(
      next || locale === DEFAULT_LOCALE ? "" : `/${locale}`,
      window.location.origin
    );

    await authClient.signIn.social(
      {
        provider: provider,
        callbackURL: callback.toString(),
        errorCallbackURL: `/redirect-error`,
      },
      {
        onRequest: () => {
          if (provider === "google") {
            setIsGoogleLoading(true);
          } else if (provider === "github") {
            setIsGithubLoading(true);
          }
        },
        onResponse: (ctx) => {
          console.log("onResponse", ctx.response);
        },
        onSuccess: (ctx) => {
          console.log("onSuccess", ctx.data);
          // setIsGoogleLoading(false);
          // setIsGithubLoading(false);
        },
        onError: (ctx) => {
          console.error("social login error", ctx.error.message);
          setIsGoogleLoading(false);
          setIsGithubLoading(false);
          toast.error(`${provider} login failed`, {
            description: ctx.error.message,
          });
        },
      }
    );
  };

  return (
    <div className={`grid gap-6 ${className}`}>
      <div className="grid gap-4">
        <Button
          variant="outline"
          onClick={() => signInSocial("google")}
          disabled={isGoogleLoading || isGithubLoading}
        >
          {isGoogleLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <GoogleIcon className="mr-2 h-4 w-4" />
          )}
          {t("signInMethods.signInWithGoogle")}
          {lastMethod === "google" && (
            <Badge className="ml-2 text-xs">Last used</Badge>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={() => signInSocial("github")}
          disabled={isGoogleLoading || isGithubLoading}
        >
          {isGithubLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Github className="mr-2 h-4 w-4" />
          )}
          {t("signInMethods.signInWithGithub")}
          {lastMethod === "github" && (
            <Badge className="ml-2 text-xs">Last used</Badge>
          )}
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
          <div className="grid gap-1 text-center">
            <Input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              onMouseEnter={() => setShowTurnstile(true)}
            />

            {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && showTurnstile && (
              <Turnstile
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                onSuccess={(token) => {
                  setCaptchaToken(token);
                }}
                onError={() => setCaptchaToken("")}
                onExpire={() => setCaptchaToken("")}
              />
            )}
          </div>
          <Button disabled={isLoading || !captchaToken}>
            {isLoading && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
            {t("signInMethods.signInWithEmail")}
          </Button>
        </div>
      </form>
    </div>
  );
}
