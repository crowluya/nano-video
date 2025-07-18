import AIDemo from "@/components/ai-demo";
import { Locale } from "@/i18n/routing";
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
  const t = await getTranslations({
    locale,
    namespace: "AIDemo",
  });

  return constructMetadata({
    page: "AIDemo",
    title: t("title"),
    description: t("metaDescription"),
    locale: locale as Locale,
    path: `/ai-demo`,
  });
}

export default function DemoPage() {
  const t = useTranslations("AIDemo");

  return (
    <div className="container max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 highlight-text">
          {t("title")}
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          {t("description")}
        </p>
      </div>

      <AIDemo />
    </div>
  );
}
