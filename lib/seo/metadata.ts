import { Locale } from "@/i18n/routing";
import { constructMetadata } from "@/lib/metadata";

interface SeoMetadataConfig {
  metaTitle: string;
  metaDescription: string;
  href: string;
}

export async function buildSeoMetadata(
  page: SeoMetadataConfig,
  locale: Locale
) {
  return constructMetadata({
    title: page.metaTitle,
    description: page.metaDescription,
    locale,
    path: page.href,
  });
}
