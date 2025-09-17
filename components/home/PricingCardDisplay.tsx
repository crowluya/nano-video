import PricingCTA from "@/components/home/PricingCTA";
import { pricingPlans as pricingPlansSchema } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { PricingPlanFeature, PricingPlanTranslation } from "@/types/pricing";
import { Check, X } from "lucide-react";

type PricingPlan = typeof pricingPlansSchema.$inferSelect;

const defaultBorderStyle = "border-gray-300 dark:border-gray-600";
const highlightedBorderStyle =
  "border-indigo-500 dark:border-indigo-500 hover:border-indigo-500 dark:hover:border-indigo-500";
const highlightedBgStyle = "bg-indigo-500";

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
      className={`card rounded-xl p-8 shadow-sm border-t-4 ${
        plan.isHighlighted ? highlightedBorderStyle : defaultBorderStyle
      } ${
        plan.isHighlighted ? "shadow-lg transform scale-105 relative z-10" : ""
      }`}
    >
      {plan.isHighlighted && highlightText && (
        <div
          className={cn(
            "absolute top-[-1px] right-0 text-white text-xs px-3 py-1 rounded-bl-lg rounded-tr-lg font-medium",
            highlightedBgStyle
          )}
        >
          {highlightText}
        </div>
      )}
      <h3 className="text-2xl font-semibold mb-2">{cardTitle}</h3>
      {cardDescription && (
        <p className="text-muted-foreground mb-6 h-[3rem]">{cardDescription}</p>
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
                <Check className="text-green-500 h-5 w-5 mt-1 mr-3 flex-shrink-0" />
              ) : (
                <X className="text-red-500 h-5 w-5 mt-1 mr-3 flex-shrink-0 opacity-50" />
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
