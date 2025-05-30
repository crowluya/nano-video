"use client";

import { unsubscribeFromNewsletter } from "@/actions/newsletter";
import { Link as I18nLink } from "@/i18n/routing";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Loader2,
  Mail,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";

interface UnsubscribeFormProps {
  token: string;
  email: string;
  locale: string;
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
      <div className="space-y-6">
        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-4 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-3 flex-shrink-0" />
            <p className="text-green-800 dark:text-green-300 font-medium">
              {t("unsubscribe.success")}
            </p>
          </div>
        </div>

        <div className="bg-muted/50 border border-border p-4 rounded-lg">
          <div className="flex items-center space-x-2 text-sm">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{email}</span>
          </div>
        </div>

        <p className="text-muted-foreground">
          {t("unsubscribe.regretMessage")}
        </p>

        <div className="pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            {t("unsubscribe.contactPrefixSuccess")}
            <Link
              href={`mailto:${adminEmail}`}
              title={adminEmail}
              className="text-primary hover:text-primary/80 ml-1 hover:underline transition-colors"
              target="_blank"
            >
              {adminEmail}
            </Link>
          </p>
        </div>

        <div className="pt-2">
          <I18nLink
            href="/"
            title={t("unsubscribe.backToHome")}
            className="inline-flex items-center justify-center w-full px-4 py-3 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("unsubscribe.backToHome")}
          </I18nLink>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-4 rounded-lg">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mr-3 mt-0.5 flex-shrink-0" />
            <p className="text-red-800 dark:text-red-300 font-medium">
              {errorMessage}
            </p>
          </div>
        </div>

        <p className="text-muted-foreground">{t("unsubscribe.errorMessage")}</p>

        <div className="flex space-x-3">
          <I18nLink
            href="/"
            className="flex-1 px-4 py-3 bg-muted hover:bg-muted/80 text-foreground font-medium rounded-lg transition-colors text-center border border-border"
          >
            {t("unsubscribe.backToHome")}
          </I18nLink>
        </div>

        <div className="pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            {t("unsubscribe.contactPrefix")}
            <Link
              href={`mailto:${adminEmail}`}
              title={adminEmail}
              className="text-primary hover:text-primary/80 ml-1 hover:underline transition-colors"
              target="_blank"
            >
              {adminEmail}
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-4 rounded-lg">
        <div className="flex items-start">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-amber-800 dark:text-amber-300 font-medium mb-2">
              {t("unsubscribe.confirmTitle")}
            </h3>
            <p className="text-amber-700 dark:text-amber-400 text-sm">
              {t("unsubscribe.confirmMessage")}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-muted/50 border border-border p-4 rounded-lg">
        <div className="flex items-center space-x-2 text-sm">
          <Mail className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">{email}</span>
        </div>
      </div>

      <div className="flex space-x-3">
        <button
          onClick={handleUnsubscribe}
          disabled={status === "loading"}
          className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 disabled:from-red-400 disabled:to-rose-400 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
        >
          {status === "loading" ? (
            <div className="flex items-center justify-center">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              {t("unsubscribe.processing")}
            </div>
          ) : (
            t("unsubscribe.confirmButton")
          )}
        </button>

        <I18nLink
          href="/"
          className="flex-1 px-4 py-3 bg-muted hover:bg-muted/80 text-foreground font-medium rounded-lg transition-colors text-center border border-border"
        >
          {t("unsubscribe.cancelButton")}
        </I18nLink>
      </div>

      <div className="pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          {t("unsubscribe.finalWarning")}
        </p>
      </div>
    </div>
  );
}
