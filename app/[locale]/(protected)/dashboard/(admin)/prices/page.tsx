import { getAdminPricingPlans } from "@/actions/prices/admin";
import { Button } from "@/components/ui/button";
import { Link as I18nLink, Locale } from "@/i18n/routing";
import { constructMetadata } from "@/lib/metadata";
import { PricingPlan } from "@/types/pricing";
import { PlusCircle } from "lucide-react";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PricesDataTable } from "./PricesDataTable";

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
  const t = await getTranslations("Prices");

  let plans: PricingPlan[] = [];
  if (result.success) {
    plans = result.data || [];
  } else {
    console.error("Failed to fetch admin pricing plans:", result.error);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <Button asChild className="highlight-bg text-white">
          <I18nLink
            href="/dashboard/prices/new"
            title={t("createNewPlan")}
            prefetch={false}
          >
            <PlusCircle className="mr-2 h-4 w-4" /> {t("createNewPlan")}
          </I18nLink>
        </Button>
      </div>
      <PricesDataTable data={plans} />
    </div>
  );
}
