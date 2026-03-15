import { GuidePage } from "@/components/seo/GuidePage";
import { Locale } from "@/i18n/routing";
import { buildSeoMetadata } from "@/lib/seo/metadata";
import { getLocalizedGuidePage } from "@/lib/seo/internal-links-localized";
import { Metadata } from "next";

type Params = Promise<{ locale: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildSeoMetadata(
    getLocalizedGuidePage(locale as Locale, "guideSettingsLimits"),
    locale as Locale
  );
}

export default async function NanoBananaVideoSettingsAndLimitsPage({
  params,
}: {
  params: Params;
}) {
  const { locale } = await params;

  return (
    <GuidePage
      page={getLocalizedGuidePage(locale as Locale, "guideSettingsLimits")}
      locale={locale}
    />
  );
}
