"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/routing";
import { PricingPlan } from "@/types/pricing";
import { Loader2, MousePointerClick } from "lucide-react";
import { useLocale } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

type Params = {
  plan: PricingPlan;
  localizedPlan: any;
  defaultCtaStyle: string;
  highlightedCtaStyle: string;
};

export default function PricingCTA({
  plan,
  localizedPlan,
  defaultCtaStyle,
  highlightedCtaStyle,
}: Params) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const locale = useLocale();

  const handleCheckout = async () => {
    const stripePriceId = plan.stripe_price_id ?? null;
    if (!stripePriceId) {
      toast.error("Price ID is missing for this plan.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/stripe/checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": (locale || "en") as string,
        },
        body: JSON.stringify({
          priceId: stripePriceId,
          // couponCode: couponCode || '', // you can add coupon code here if you want to
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login");
          toast.error("You must be logged in to purchase a plan.");
          return;
        }
        throw new Error(
          result.error || "HTTP error! status: " + response.status
        );
      }

      if (!result.success) {
        throw new Error(result.error || "Failed to create checkout session.");
      }

      const data = result.data;

      if (data.url) {
        router.push(data.url);
        setIsLoading(false);
      } else {
        throw new Error("Checkout URL not received.");
      }
    } catch (error) {
      console.error("Checkout Error:", error);
      toast.error(
        error instanceof Error ? error.message : "An unexpected error occurred."
      );
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Button
        asChild={!!plan.button_link}
        disabled={isLoading}
        className={`w-full flex items-center justify-center gap-2 text-white py-5 mb-6 font-medium ${
          plan.is_highlighted ? highlightedCtaStyle : defaultCtaStyle
        }`}
        {...(!plan.button_link && {
          onClick: () => handleCheckout(),
        })}
      >
        {plan.button_link ? (
          <a
            href={plan.button_link}
            rel="noopener noreferrer nofollow"
            target="_blank"
          >
            {localizedPlan.button_text || plan.button_text}
            {plan.is_highlighted && <MousePointerClick className="w-5 h-5" />}
          </a>
        ) : (
          <>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              localizedPlan.button_text || plan.button_text
            )}
            {plan.is_highlighted && !isLoading && (
              <MousePointerClick className="w-5 h-5 ml-2" />
            )}
          </>
        )}
      </Button>
    </div>
  );
}
