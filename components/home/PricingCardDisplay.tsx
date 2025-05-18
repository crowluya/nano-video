import PricingCTA from "@/components/home/PricingCTA";
import { PricingPlan, PricingPlanTranslation } from "@/types/pricing";
import { Check, X } from "lucide-react";

const defaultBorderStyle = "border-gray-300 dark:border-gray-600";
const highlightedBorderStyle = "border-indigo-600 dark:border-indigo-400";
const defaultCtaStyle = "bg-gray-800 hover:bg-gray-700";
const highlightedCtaStyle = "gradient-bg hover:opacity-90";

interface PricingCardDisplayProps {
  plan: PricingPlan;
  localizedPlan: PricingPlanTranslation;
}

export function PricingCardDisplay({
  plan,
  localizedPlan,
}: PricingCardDisplayProps) {
  const cardTitle =
    localizedPlan?.card_title || plan.card_title || "Unnamed Plan";
  const cardDescription =
    localizedPlan?.card_description || plan.card_description || "";
  const displayPrice = localizedPlan?.display_price || plan.display_price || "";
  const originalPrice = localizedPlan?.original_price || plan.original_price;
  const priceSuffix =
    localizedPlan?.price_suffix?.replace(/^\/+/, "") ||
    plan.price_suffix?.replace(/^\/+/, "");
  const features = localizedPlan?.features || plan.features || [];
  const highlightText = localizedPlan?.highlight_text;

  return (
    <div
      className={`card rounded-xl p-8 shadow-sm border-t-4 ${
        plan.is_highlighted ? highlightedBorderStyle : defaultBorderStyle
      } ${
        plan.is_highlighted ? "shadow-lg transform scale-105 relative z-10" : ""
      }`}
    >
      {plan.is_highlighted && highlightText && (
        <div className="absolute top-0 right-0 bg-indigo-600 text-white text-xs px-3 py-1 rounded-bl-lg rounded-tr-lg font-medium">
          {highlightText}
        </div>
      )}
      <h3 className="text-2xl font-bold mb-2">{cardTitle}</h3>
      <p className="text-muted-foreground mb-6 h-[3rem]">{cardDescription}</p>

      <PricingCTA
        plan={plan}
        localizedPlan={localizedPlan}
        defaultCtaStyle={defaultCtaStyle}
        highlightedCtaStyle={highlightedCtaStyle}
      />

      <div className="text-4xl font-bold mb-6">
        {originalPrice ? (
          <span className="text-xl line-through decoration-2 font-normal text-muted-foreground mr-2">
            {originalPrice}
          </span>
        ) : null}

        {displayPrice}

        {priceSuffix ? (
          <span className="text-lg font-normal text-muted-foreground">
            /{priceSuffix}
          </span>
        ) : null}
      </div>
      <ul className="space-y-3 mb-6">
        {features?.map(
          (
            feature: { description: string; included: boolean },
            index: number
          ) => (
            <li key={index} className="flex items-start">
              {feature.included ? (
                <Check className="text-green-500 h-5 w-5 mt-1 mr-3 flex-shrink-0" />
              ) : (
                <X className="text-red-500 h-5 w-5 mt-1 mr-3 flex-shrink-0 opacity-50" />
              )}
              <span className={feature.included ? "" : "opacity-50"}>
                {feature.description}
              </span>
            </li>
          )
        )}
      </ul>
    </div>
  );
}
