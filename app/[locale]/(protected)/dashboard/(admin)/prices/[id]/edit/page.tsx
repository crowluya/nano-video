import { isAdmin } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { pricingPlans as pricingPlansSchema } from "@/lib/db/schema";
import { constructMetadata } from "@/lib/metadata";
import { eq } from "drizzle-orm";
import { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { PricePlanForm } from "../../PricePlanForm";

type PricingPlan = typeof pricingPlansSchema.$inferSelect;

async function getPricingPlanById(id: string): Promise<PricingPlan | null> {
  try {
    const results = await db
      .select()
      .from(pricingPlansSchema)
      .where(eq(pricingPlansSchema.id, id))
      .limit(1);

    const plan = results[0];

    if (!plan) {
      console.error(`Pricing plan with ID ${id} not found.`);
      return null;
    }

    return plan as any;
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
      title: plan.cardTitle,
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
            title: plan.cardTitle,
            environment: plan.environment,
          })}
        </p>
      </div>
      <PricePlanForm initialData={plan} planId={plan.id} />
    </div>
  );
}
