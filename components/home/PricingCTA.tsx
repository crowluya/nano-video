"use client";

import { Button } from "@/components/ui/button";
import { DEFAULT_LOCALE, useRouter } from "@/i18n/routing";
import { pricingPlans as pricingPlansSchema } from "@/lib/db/schema";
import { Loader2, MousePointerClick } from "lucide-react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

type PricingPlan = typeof pricingPlansSchema.$inferSelect;

type Params = {
  plan: PricingPlan;
  localizedPlan: any;
};

export default function PricingCTA({ plan, localizedPlan }: Params) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const locale = useLocale();

  const handleCheckout = async (applyCoupon = true) => {
    const stripePriceId = plan.stripePriceId ?? null;
    if (!stripePriceId) {
      toast.error("Price ID is missing for this plan.");
      return;
    }

    const couponCode = plan.stripeCouponId;

    setIsLoading(true);
    try {
      const toltReferral = (window as any).tolt_referral;

      const requestBody: {
        priceId: string;
        couponCode?: string;
        referral?: string;
      } = {
        priceId: stripePriceId,
      };

      if (applyCoupon && couponCode) {
        requestBody.couponCode = couponCode;
      }

      if (toltReferral) {
        requestBody.referral = toltReferral;
      }

      const response = await fetch("/api/stripe/checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": (locale || DEFAULT_LOCALE) as string,
        },
        body: JSON.stringify(requestBody),
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
        asChild={!!plan.buttonLink}
        disabled={isLoading}
        className={`w-full flex items-center justify-center gap-2 py-5 font-medium ${
          plan.isHighlighted
            ? "highlight-button"
            : "bg-gray-900 text-white dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100"
        } ${
          plan.stripeCouponId && plan.enableManualInputCoupon ? "mb-2" : "mb-6"
        }`}
        {...(!plan.buttonLink && {
          onClick: () => handleCheckout(),
        })}
      >
        {plan.buttonLink ? (
          <Link
            href={plan.buttonLink}
            title={localizedPlan.buttonText || plan.buttonText}
            rel="noopener noreferrer nofollow"
            target="_blank"
            prefetch={false}
          >
            {localizedPlan.buttonText || plan.buttonText}
            {plan.isHighlighted && <MousePointerClick className="w-5 h-5" />}
          </Link>
        ) : (
          <>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              localizedPlan.buttonText || plan.buttonText
            )}
            {plan.isHighlighted && !isLoading && (
              <MousePointerClick className="w-5 h-5 ml-2" />
            )}
          </>
        )}
      </Button>
      {plan.stripeCouponId && plan.enableManualInputCoupon && (
        <div className="text-center mb-2">
          <button
            onClick={() => handleCheckout(false)}
            disabled={isLoading}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 underline underline-offset-2"
          >
            I have a different coupon code
          </button>
        </div>
      )}
    </div>
  );
}
