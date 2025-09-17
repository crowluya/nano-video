import { getPricingPlanById } from "@/actions/prices/admin";
import { pricingPlans as pricingPlansSchema } from "@/lib/db/schema";
import { constructMetadata } from "@/lib/metadata";
import { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { PricePlanForm } from "../PricePlanForm";

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
    namespace: "Prices.CreatePlan",
  });

  return constructMetadata({
    page: "PricesNew",
    title: t("title"),
    description: t("description"),
    locale: locale as Locale,
    path: `/dashboard/prices/new`,
  });
}

export default async function NewPricePlanPage({
  searchParams,
}: {
  searchParams: Promise<{ duplicatePlanId?: string }>;
}) {
  const t = await getTranslations("Prices.CreatePlan");
  let initialDataForForm: PricingPlan | null = null;

  const { duplicatePlanId } = await searchParams;

  if (duplicatePlanId) {
    const planResult = await getPricingPlanById(duplicatePlanId);
    if (planResult.success && planResult.data) {
      const originalPlan = planResult.data;
      initialDataForForm = {
        ...originalPlan,
        id: "",
        cardTitle: `${originalPlan.cardTitle} (Copy)`,
        cardDescription: originalPlan.cardDescription,
        stripePriceId: "",
        stripeProductId: "",
        paymentType: "",
        recurringInterval: "",
        price: null,
        currency: "",
        displayPrice: originalPlan.displayPrice,
        originalPrice: originalPlan.originalPrice,
        priceSuffix: originalPlan.priceSuffix,
        isHighlighted: originalPlan.isHighlighted,
        highlightText: originalPlan.highlightText,
        buttonText: originalPlan.buttonText,
        buttonLink: originalPlan.buttonLink,
      };
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>
      <PricePlanForm initialData={initialDataForForm} />
    </div>
  );
}
