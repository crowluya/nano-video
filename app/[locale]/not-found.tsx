"use client";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export default function NotFound() {
  const t = useTranslations("NotFound");

  return (
    <div className="min-h-screen w-full flex items-center justify-center">
      <div className="text-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="text-6xl sm:text-8xl font-bold mb-4">404</div>

          <h1 className="text-2xl sm:text-3xl font-bold mb-4">{t("title")}</h1>

          <p className="text-gray-600 dark:text-gray-400 mb-8 text-base sm:text-lg">
            {t("description")}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <Button className="w-full sm:w-auto">{t("backToHome")}</Button>
            </Link>

            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => window.history.back()}
            >
              {t("goBack")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
