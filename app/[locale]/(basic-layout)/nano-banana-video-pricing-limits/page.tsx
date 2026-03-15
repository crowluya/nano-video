import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import { Locale } from "@/i18n/routing";
import { buildSeoMetadata } from "@/lib/seo/metadata";
import { getLocalizedSeoLandingPage } from "@/lib/seo/internal-links-localized";
import { Metadata } from "next";

type Params = Promise<{ locale: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildSeoMetadata(
    getLocalizedSeoLandingPage(locale as Locale, "videoPricingLimits"),
    locale as Locale
  );
}

export default async function NanoBananaVideoPricingLimitsPage({
  params,
}: {
  params: Params;
}) {
  const { locale } = await params;

  return (
    <SeoLandingPage
      page={getLocalizedSeoLandingPage(locale as Locale, "videoPricingLimits")}
      locale={locale}
    />
  );
}
