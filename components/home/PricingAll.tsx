/**
 * Tips:
 * This component is equivalent to Pricing.tsx on nexty v1.x
 * Use this component if you need to display all active pricing cards at once
 * If you want to display different pricing cards based on different payment types (monthly, annual, one_time), use Pricing.tsx
 *
 * 提示：
 * 该组件等同于 nexty v1.x 中的 Pricing.tsx 组件
 * 如果你希望一次性展示所有定价卡片，请使用这个组件
 * 如果你希望根据不同的支付类型（monthly, annual, one_time）来展示不同的定价卡片，请使用 Pricing.tsx
 */
import { getPublicPricingPlans } from "@/actions/prices/public";
import { PricingCardDisplay } from "@/components/home/PricingCardDisplay";
import FeatureBadge from "@/components/shared/FeatureBadge";
import { DEFAULT_LOCALE } from "@/i18n/routing";
import { pricingPlans as pricingPlansSchema } from "@/lib/db/schema";
import { PricingPlanLangJsonb } from "@/types/pricing";
import { getLocale, getTranslations } from "next-intl/server";

type PricingPlan = typeof pricingPlansSchema.$inferSelect;

export default async function PricingAll() {
  const t = await getTranslations("Landing.Pricing");

  const locale = await getLocale();

  let allPlans: PricingPlan[] = [];
  const result = await getPublicPricingPlans();

  if (result.success) {
    allPlans = result.data || [];
  } else {
    console.error("Failed to fetch public pricing plans:", result.error);
  }

  return (
    <section id="pricing" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <FeatureBadge
            label={t("badge.label")}
            text={t("badge.text")}
            className="mb-8"
          />
          <h2 className="text-center z-10 text-lg md:text-5xl font-sans font-semibold mb-4">
            <span className="title-gradient">{t("title")}</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            {t("description")}
          </p>
        </div>

        <div
          className={`grid grid-cols-1 gap-8 items-start md:grid-cols-${
            allPlans.length > 0 ? allPlans.length : 1
          }`}
        >
          {allPlans.map((plan) => {
            const localizedPlan =
              (plan.langJsonb as PricingPlanLangJsonb)?.[locale] ||
              (plan.langJsonb as PricingPlanLangJsonb)?.[DEFAULT_LOCALE];

            if (!localizedPlan) {
              console.warn(
                `Missing localization for locale '${locale}' or fallback 'en' for plan ID ${plan.id}`
              );
              return null;
            }

            return (
              <PricingCardDisplay
                key={plan.id}
                plan={plan}
                localizedPlan={localizedPlan}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
