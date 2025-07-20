"use client";

import { UserBenefits } from "@/actions/usage/benefits";
import { BenefitsContext } from "@/components/providers/BenefitsProvider";
import dayjs from "dayjs";
import { Calendar, Coins } from "lucide-react";
import { use, useContext } from "react";

export default function CurrentUserBenefitsDisplay() {
  const benefitsPromise = useContext(BenefitsContext);

  if (!benefitsPromise) {
    console.error("BenefitsContext not found!");
    return null;
  }

  const benefits: UserBenefits | null = use(benefitsPromise);

  if (!benefits) {
    return null;
  }

  // --- TODO: [custom] Render based on the resolved benefits ---
  if (
    benefits.totalAvailableCredits > 0 ||
    benefits.subscriptionStatus === "trialing" ||
    benefits.subscriptionStatus === "active"
  ) {
    return (
      <div className="flex flex-col gap-2 text-sm">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <span>
            Renewal: {dayjs(benefits.currentPeriodEnd).format("YYYY-MM-DD")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-primary" />
          <span>Credits: {benefits.totalAvailableCredits}</span>
        </div>
      </div>
    );
  }
  // --- End: [custom] Render based on the resolved benefits ---

  return null;
}
