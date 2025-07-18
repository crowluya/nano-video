import { Card } from "@/components/ui/card";
import { Link as I18nLink, Locale } from "@/i18n/routing";
import { constructMetadata } from "@/lib/metadata";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

type Params = Promise<{ locale: string }>;

type MetadataProps = {
  params: Params;
};

export async function generateMetadata({
  params,
}: MetadataProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "ErrorPage.StripeError",
  });

  return constructMetadata({
    page: "Stripe Error",
    title: t("title"),
    description: t("description"),
    locale: locale as Locale,
    path: `/stripe-error`,
    canonicalUrl: "/stripe-error",
  });
}

export default async function StripeErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;
  ("An unknown error occurred with your payment information.");

  const t = await getTranslations("ErrorPage.StripeError");

  return (
    <Card className="flex flex-col items-center justify-center m-24">
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">{t("title")}</h1>
        <p className="mb-6">{message}</p>
        <I18nLink
          href="/"
          title={t("goToHome")}
          className="px-4 py-2 highlight-bg text-white rounded-md"
        >
          {t("goToHome")}
        </I18nLink>
        <I18nLink
          href="/dashboard"
          title={t("goToDashboard")}
          className="ml-4 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          {t("goToDashboard")}
        </I18nLink>
      </div>
    </Card>
  );
}
