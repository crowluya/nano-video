import { getAdminPricingPlans } from "@/actions/prices/admin";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Locale } from "@/i18n/routing";
import { pricingPlans as pricingPlansSchema } from "@/lib/db/schema";
import { constructMetadata } from "@/lib/metadata";
import { Info } from "lucide-react";
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
      <Alert className="border-primary/50 bg-primary/20 dark:bg-primary/20 mb-0 text-primary">
        <Info className="h-4 w-4" />
        <AlertTitle className="text-primary">Environment Isolation</AlertTitle>
        <AlertDescription className="text-primary">
          <ul className="list-inside list-disc text-sm">
            <li>
              <strong>Test</strong> pricing plans only show in the
              test/development environments
            </li>
            <li>
              <strong>Live</strong> pricing plans only show in the production
              environment
            </li>
          </ul>
        </AlertDescription>
      </Alert>
      <PricesDataTable data={plans} />
    </div>
  );
}
