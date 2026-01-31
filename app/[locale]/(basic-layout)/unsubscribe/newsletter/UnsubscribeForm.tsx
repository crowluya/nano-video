"use client";

import { unsubscribeFromNewsletter } from "@/actions/newsletter";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/i18n/routing";
import { Link as I18nLink } from "@/i18n/routing";
import { ArrowLeft, CheckCircle, Loader2, Mail, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";

interface UnsubscribeFormProps {
  token: string;
  email: string;
  locale: Locale;
  adminEmail: string;
}

export default function UnsubscribeForm({
  token,
  email,
  locale,
  adminEmail,
}: UnsubscribeFormProps) {
  const t = useTranslations("Footer.Newsletter");
  const [status, setStatus] = useState<
    "pending" | "loading" | "success" | "error"
  >("pending");
  const [errorMessage, setErrorMessage] = useState("");

  const handleUnsubscribe = async () => {
    setStatus("loading");

    try {
      const result = await unsubscribeFromNewsletter(token, locale);
      if (result.success) {
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMessage(result.error || t("unsubscribe.errorGeneric"));
      }
    } catch (error) {
      console.error("Failed to unsubscribe:", error);
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : t("unsubscribe.errorGeneric")
      );
    }
  };

  if (status === "success") {
    return (
      <div className="space-y-6 text-center animate-in fade-in zoom-in duration-300">
        <div className="bg-green-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-foreground">
            {t("unsubscribe.success")}
          </h3>
          <p className="text-muted-foreground">
            {t("unsubscribe.regretMessage")}
          </p>
        </div>

        <div className="bg-muted p-4 rounded-lg flex items-center justify-center gap-2">
          <Mail className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium text-foreground">{email}</span>
        </div>

        <div className="pt-4">
          <Button asChild className="w-full" size="lg">
            <I18nLink href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("unsubscribe.backToHome")}
            </I18nLink>
          </Button>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="space-y-6 text-center animate-in fade-in zoom-in duration-300">
        <div className="bg-destructive/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
          <XCircle className="w-8 h-8 text-destructive" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-destructive">
            {t("unsubscribe.errorGeneric")}
          </h3>
          <p className="text-muted-foreground">{errorMessage}</p>
        </div>

        <div className="pt-4 space-y-3">
          <Button asChild variant="outline" className="w-full">
            <I18nLink href="/">{t("unsubscribe.backToHome")}</I18nLink>
          </Button>

          <div className="text-sm text-muted-foreground pt-2">
            {t("unsubscribe.contactPrefix")}
            <Link
              href={`mailto:${adminEmail}`}
              className="text-primary hover:underline ml-1"
            >
              {adminEmail}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-muted/50 border border-border p-4 rounded-lg">
        <div className="flex items-center justify-center space-x-2 text-sm">
          <Mail className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">{email}</span>
        </div>
      </div>

      <div className="grid gap-3">
        <Button
          onClick={handleUnsubscribe}
          disabled={status === "loading"}
          variant="destructive"
          size="lg"
          className="w-full"
        >
          {status === "loading" ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              {t("unsubscribe.processing")}
            </>
          ) : (
            t("unsubscribe.confirmButton")
          )}
        </Button>

        <Button
          asChild
          variant="ghost"
          className="w-full"
          disabled={status === "loading"}
        >
          <I18nLink href="/">{t("unsubscribe.cancelButton")}</I18nLink>
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center px-4">
        {t("unsubscribe.finalWarning")}
      </p>
    </div>
  );
}
