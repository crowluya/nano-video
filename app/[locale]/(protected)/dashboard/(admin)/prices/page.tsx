import { getAdminPricingPlans } from "@/actions/prices/admin";
import { Locale } from "@/i18n/routing";
import { pricingPlans as pricingPlansSchema } from "@/lib/db/schema";
import { constructMetadata } from "@/lib/metadata";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PricesDataTable } from "./PricesDataTable";

type PricingPlan = typeof pricingPlansSchema.$inferSelect;

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
    namespace: "Prices",
  });

  return constructMetadata({
    page: "Prices",
    title: t("title"),
    description: t("description"),
    locale: locale as Locale,
    path: `/dashboard/prices`,
  });
}

export default async function AdminPricesPage() {
  const result = await getAdminPricingPlans();

  let plans: PricingPlan[] = [];
  if (result.success) {
    plans = result.data || [];
  } else {
    console.error("Failed to fetch admin pricing plans:", result.error);
  }

  return (
    <div className="space-y-6">
      <PricesDataTable data={plans} />
    </div>
  );
}
