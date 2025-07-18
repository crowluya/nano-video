import { Button } from "@/components/ui/button";
import { Link as I18nLink, Locale, routing } from "@/i18n/routing";
import { constructMetadata } from "@/lib/metadata";
import { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";

type Params = Promise<{ locale: string }>;

type MetadataProps = {
  params: Params;
};

export async function generateMetadata({
  params,
}: MetadataProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ErrorPage.403" });

  return constructMetadata({
    page: "403",
    title: t("title"),
    description: t("description"),
    locale: locale as Locale,
    path: `/403`,
    canonicalUrl: "/403",
  });
}

export default function ForbiddenPage() {
  const t = useTranslations("ErrorPage.403");
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <h1 className="text-4xl font-bold">{t("title")}</h1>
      <p className="text-muted-foreground">{t("description")}</p>
      <Button
        asChild
        className="highlight-bg text-white px-8 py-3 rounded-lg font-medium text-center hover:opacity-90 shadow-lg"
      >
        <I18nLink href={t("button.href")} title={t("button.name")}>
          {t("button.name")}
        </I18nLink>
      </Button>
    </div>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
