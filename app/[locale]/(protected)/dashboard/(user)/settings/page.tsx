import { constructMetadata } from "@/lib/metadata";
import { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import Settings from "./Setting";

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
    namespace: "Settings",
  });

  return constructMetadata({
    page: "Settings",
    title: t("title"),
    description: t("description"),
    locale: locale as Locale,
    path: `/dashboard/settings`,
  });
}

export default function SettingsPage() {
  return <Settings />;
}
