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
    namespace: "ErrorPage.RedirectError",
  });

  return constructMetadata({
    page: "Redirect Error",
    title: t("title"),
    description: t("description"),
    locale: locale as Locale,
    path: `/redirect-error`,
    canonicalUrl: "/redirect-error",
  });
}

export default async function RedirectErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  const t = await getTranslations("ErrorPage.RedirectError");
  const info = t.raw(code || "unknown");

  const { title, description } = info as any;

  return (
    <Card className="flex flex-col items-center justify-center m-24">
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">{title}</h1>
        <p className="mb-6">{description}</p>
        <I18nLink
          href="/"
          title={t("goToHome")}
          className="px-4 py-2 highlight-bg text-white rounded-md"
        >
          {t("goToHome")}
        </I18nLink>
        <I18nLink
          href="/login"
          title={t("goToLogin")}
          className="ml-4 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          {t("goToLogin")}
        </I18nLink>
      </div>
    </Card>
  );
}
