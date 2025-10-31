import PricingCTA from "@/components/home/PricingCTA";
import { pricingPlans as pricingPlansSchema } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { PricingPlanFeature, PricingPlanTranslation } from "@/types/pricing";
import { Check, X } from "lucide-react";

type PricingPlan = typeof pricingPlansSchema.$inferSelect;

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

      <div className="text-4xl mb-6">
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
