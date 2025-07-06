import { constructMetadata } from "@/lib/metadata";
import { isAdmin } from "@/lib/supabase/isAdmin";
import { Database } from "@/lib/supabase/types";
import { PricingPlan } from "@/types/pricing";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { PricePlanForm } from "../../PricePlanForm";

async function getPricingPlanById(id: string): Promise<PricingPlan | null> {
  try {
    const supabase = await createAdminClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: plan, error } = await supabase
      .from("pricing_plans")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        console.error(`Pricing plan with ID ${id} not found.`);
        return null;
      }
      console.error(`Error fetching pricing plan ${id}:`, error);
      throw new Error(`Failed to fetch pricing plan: ${error.message}`);
    }

    return plan as PricingPlan;
  } catch (error) {
    console.error(`Unexpected error fetching plan ${id}:`, error);
    throw error;
  }
}

type Params = Promise<{ locale: string; id: string }>;

type MetadataProps = {
  params: Params;
};

export async function generateMetadata({
  params,
}: MetadataProps): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({
    locale,
    namespace: "Prices.EditPlan",
  });

  const plan = await getPricingPlanById(id);

  if (!plan) {
    notFound();
  }

  return constructMetadata({
    page: "PricesEdit",
    title: t("title"),
    description: t("description", {
      title: plan.card_title,
      environment: plan.environment,
    }),
    locale: locale as Locale,
    path: `/dashboard/prices/${id}/edit`,
  });
}

export default async function EditPricePlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const t = await getTranslations("Prices.EditPlan");

  const isAdminUser = await isAdmin();
  if (!isAdminUser) {
    console.error(`not admin user`);
    redirect("/403");
  }

  const plan = await getPricingPlanById(id);

  if (!plan) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("description", {
            title: plan.card_title,
            environment: plan.environment,
          })}
        </p>
      </div>
      <PricePlanForm initialData={plan} planId={plan.id} />
    </div>
  );
}
