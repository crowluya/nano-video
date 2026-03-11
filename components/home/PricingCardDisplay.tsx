import PricingCTA from "@/components/home/PricingCTA";
import { pricingPlans as pricingPlansSchema } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { PricingPlanFeature, PricingPlanTranslation } from "@/types/pricing";
import { Check, X, Coins } from "lucide-react";
import {
  isOneTimePaymentType,
  isRecurringPaymentType,
  isYearlyInterval,
} from "@/lib/payments/provider-utils";

type PricingPlan = typeof pricingPlansSchema.$inferSelect;

interface PricingBenefits {
  monthlyCredits?: number;
  oneTimeCredits?: number;
  savePercent?: number;
}

interface PricingCardDisplayProps {
  id?: string;
  plan: PricingPlan;
  localizedPlan: PricingPlanTranslation;
}

export function PricingCardDisplay({
  id,
  plan,
  localizedPlan,
}: PricingCardDisplayProps) {
  const cardTitle =
    localizedPlan?.cardTitle || plan.cardTitle || "Unnamed Plan";
  const cardDescription =
    localizedPlan?.cardDescription || plan.cardDescription || "";
  const displayPrice = localizedPlan?.displayPrice || plan.displayPrice || "";
  const originalPrice = localizedPlan?.originalPrice || plan.originalPrice;
  const priceSuffix =
    localizedPlan?.priceSuffix?.replace(/^\/+/, "") ||
    plan.priceSuffix?.replace(/^\/+/, "");
  const features = localizedPlan?.features || plan.features || [];
  const highlightText = localizedPlan?.highlightText;

  // Extract credits from benefitsJsonb
  let benefits: PricingBenefits = {};
  if (plan.benefitsJsonb) {
    if (typeof plan.benefitsJsonb === "string") {
      try {
        benefits = JSON.parse(plan.benefitsJsonb) as PricingBenefits;
      } catch (e) {
        console.error("Failed to parse benefitsJsonb as string:", e);
        benefits = {};
      }
    } else {
      benefits = plan.benefitsJsonb as PricingBenefits;
    }
  }
  const monthlyCredits = benefits.monthlyCredits || 0;
  const oneTimeCredits = benefits.oneTimeCredits || 0;
  const savePercent = plan.annualSavePercent ?? benefits.savePercent ?? 0;

  // Check if this is a yearly plan
  const isYearly = isYearlyInterval(plan.recurringInterval);

  const yearlyPrice = parseFloat(plan.price || "0") || 0;
  const monthlyPrice = isYearly ? yearlyPrice / 12 : yearlyPrice;
  const yearlyDisplayPrice = displayPrice || `$${yearlyPrice.toFixed(2)}`;

  // Determine credit display text
  const getCreditsDisplay = () => {
    if (isOneTimePaymentType(plan.paymentType) && oneTimeCredits > 0) {
      return `${oneTimeCredits.toLocaleString()} credits`;
    }
    if (
      isRecurringPaymentType(plan.paymentType) &&
      monthlyCredits > 0
    ) {
      return `${monthlyCredits.toLocaleString()} credits/month`;
    }
    return null;
  };

  const creditsDisplay = getCreditsDisplay();
  

  return (
    <div
      id={id}
      className={cn(
        "border rounded-xl shadow-xs border-t-4",
        "border-gray-300 dark:border-gray-600",
        "hover:border-primary dark:hover:border-primary hover:scale-105 hover:shadow-xl transition-all duration-300",
        plan.isHighlighted
          ? "border-primary dark:border-primary relative z-10 px-8 py-12 -my-4"
          : "p-8"
      )}
    >
      {plan.isHighlighted && highlightText && (
        <div
          className={cn(
            "absolute -top-px right-0 highlight-bg text-xs px-3 py-1 rounded-bl-lg rounded-tr-lg font-medium"
          )}
        >
          {highlightText}
        </div>
      )}
      <h3 className="text-2xl font-semibold mb-2">{cardTitle}</h3>
      {cardDescription && (
        <p className="text-muted-foreground mb-6 h-12">{cardDescription}</p>
      )}

      <PricingCTA plan={plan} localizedPlan={localizedPlan} />

      {/* Price display - different for yearly vs monthly */}
      {isYearly ? (
        // Yearly plan display: show monthly price prominently
        <div className="mb-4">
          <div className="text-4xl font-bold mb-1">
            ${monthlyPrice.toFixed(2)}
            <span className="text-lg font-normal text-muted-foreground">/month</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            <span>
              Billed annually
              {savePercent > 0 ? ` (save ${savePercent}%)` : ""}
            </span>
            {originalPrice ? (
              <span className="line-through text-gray-400">
                {originalPrice}
              </span>
            ) : null}
            <span className="font-medium text-foreground">
              {yearlyDisplayPrice} / year
            </span>
          </div>
        </div>
      ) : (
        // Monthly plan display: original format
        <div className="text-4xl mb-4">
          {originalPrice ? (
            <span className="text-sm line-through decoration-2 text-muted-foreground mr-1">
              {originalPrice}
            </span>
          ) : null}

          {displayPrice}

          {priceSuffix ? (
            <span className="text-sm text-muted-foreground">/{priceSuffix}</span>
          ) : null}
        </div>
      )}

      {creditsDisplay && (
        <div className="flex items-center gap-2 mb-6 text-lg font-medium text-primary">
          <Coins className="w-5 h-5" />
          <span>{creditsDisplay}</span>
        </div>
      )}
      <ul className="space-y-3 mb-6">
        {(features as PricingPlanFeature[])?.map(
          (
            feature: { description: string; included: boolean; bold?: boolean },
            index: number
          ) => (
            <li key={index} className="flex items-start">
              {feature.included ? (
                <Check className="text-green-500 h-5 w-5 mt-1 mr-3 shrink-0" />
              ) : (
                <X className="text-red-500 h-5 w-5 mt-1 mr-3 shrink-0 opacity-50" />
              )}
              <span
                className={cn(
                  feature.included ? "" : "opacity-50",
                  feature.bold ? "font-bold" : ""
                )}
              >
                {feature.description}
              </span>
            </li>
          )
        )}
      </ul>
    </div>
  );
}

