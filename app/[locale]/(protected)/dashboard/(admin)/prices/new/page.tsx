import { getPricingPlanById } from "@/actions/prices/admin";
import { constructMetadata } from "@/lib/metadata";
import { PricingPlan } from "@/types/pricing";
import { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { PricePlanForm } from "../PricePlanForm";

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
        card_title: `${originalPlan.card_title} (Copy)`,
        card_description: originalPlan.card_description,
        stripe_price_id: "",
        stripe_product_id: "",
        payment_type: "",
        recurring_interval: "",
        price: null,
        currency: "",
        display_price: originalPlan.display_price,
        original_price: originalPlan.original_price,
        price_suffix: originalPlan.price_suffix,
        is_highlighted: originalPlan.is_highlighted,
        highlight_text: originalPlan.highlight_text,
        button_text: originalPlan.button_text,
        button_link: originalPlan.button_link,
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
