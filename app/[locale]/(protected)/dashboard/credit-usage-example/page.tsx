"use client";

import {
  DeductCreditsData,
  deductCreditsPrioritizingSubscription,
  deductOneTimeCredits,
  deductSubscriptionCredits,
  getClientUserBenefits,
} from "@/actions/usage/deduct";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ActionResult } from "@/lib/action-response";
import { UserBenefits } from "@/lib/stripe/actions";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const CREDITS_TO_DEDUCT = 10;

export default function CreditUsageExamplePage() {
  const [benefits, setBenefits] = useState<UserBenefits | null>(null);
  const [isLoadingBenefits, setIsLoadingBenefits] = useState(true);
  const [isDeducting, setIsDeducting] = useState<string | false>(false);
  const locale = useLocale();

  const fetchBenefitsAndSetState = useCallback(async () => {
    setIsLoadingBenefits(true);
    try {
      const result = await getClientUserBenefits();
      if (result.success && result.data) {
        setBenefits(result.data);
      } else if (!result.success) {
        throw new Error(
          result.error || "Failed to fetch user benefits or user not found."
        );
      } else {
        throw new Error(
          "Fetched user benefits successfully but no data was returned."
        );
      }
    } catch (error) {
      console.error("Error fetching benefits:", error);
      toast.error(
        error instanceof Error ? error.message : "Could not load user benefits."
      );
      setBenefits(null);
    } finally {
      setIsLoadingBenefits(false);
    }
  }, []);

  useEffect(() => {
    fetchBenefitsAndSetState();
  }, [fetchBenefitsAndSetState]);

  const handleDeduction = async (
    deductionType: "oneTime" | "subscription" | "prioritySub"
  ) => {
    if (!benefits) {
      toast.error("User benefits not loaded yet.");
      return;
    }
    setIsDeducting(deductionType);

    let result: ActionResult<DeductCreditsData | null>;

    try {
      switch (deductionType) {
        case "oneTime":
          result = await deductOneTimeCredits(CREDITS_TO_DEDUCT, locale);
          break;
        case "subscription":
          result = await deductSubscriptionCredits(CREDITS_TO_DEDUCT, locale);
          break;
        case "prioritySub":
          result = await deductCreditsPrioritizingSubscription(
            CREDITS_TO_DEDUCT,
            locale
          );
          break;
        default:
          toast.error("Invalid deduction type");
          setIsDeducting(false);
          return;
      }

      if (!result.success) {
        toast.error(result.error || "An unexpected action error occurred.");
      } else if (result.data?.rpcResult?.success) {
        toast.success(
          result.data.rpcResult.message ||
            `Successfully deducted ${CREDITS_TO_DEDUCT} credits.`
        );
      } else if (result.data?.rpcResult) {
        toast.warning(
          result.data.rpcResult.message || "Could not deduct credits."
        );
      }

      if (result.success && result.data?.updatedBenefits) {
        setBenefits(result.data.updatedBenefits);
      } else if (
        result.success &&
        !result.data?.updatedBenefits &&
        result.data?.rpcResult?.success
      ) {
        await fetchBenefitsAndSetState();
      } else if (!result.success) {
        await fetchBenefitsAndSetState();
      }
    } catch (error) {
      console.error(`Error during ${deductionType} deduction call:`, error);
      toast.error(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred during deduction call."
      );
      await fetchBenefitsAndSetState();
    } finally {
      setIsDeducting(false);
    }
  };

  if (process.env.NODE_ENV === "production") {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold">
          This page is only available in development mode.
        </h1>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Credit Usage Example</CardTitle>
          <CardDescription>
            This page demonstrates different ways to deduct credits for using a
            feature. Each button simulates using a feature that costs{" "}
            {CREDITS_TO_DEDUCT} credits. (Only development mode)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingBenefits ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : benefits ? (
            <div>
              <p>
                <strong>Total Available Credits:</strong>{" "}
                {benefits.totalAvailableCredits}
              </p>
              <p>
                <strong>One-Time Credits:</strong>{" "}
                {benefits.oneTimeCreditsBalance}
              </p>
              <p>
                <strong>Subscription Credits:</strong>{" "}
                {benefits.subscriptionCreditsBalance}
              </p>
            </div>
          ) : (
            <p className="text-destructive">
              Could not load user credit information. Please try refreshing.
            </p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-4">
          <Button
            onClick={() => handleDeduction("oneTime")}
            disabled={!!isDeducting || isLoadingBenefits || !benefits}
            className="w-full sm:w-auto"
          >
            {isDeducting === "oneTime"
              ? "Deducting..."
              : `Deduct ${CREDITS_TO_DEDUCT} (One-Time Only)`}
          </Button>
          <Button
            onClick={() => handleDeduction("subscription")}
            disabled={!!isDeducting || isLoadingBenefits || !benefits}
            className="w-full sm:w-auto"
          >
            {isDeducting === "subscription"
              ? "Deducting..."
              : `Deduct ${CREDITS_TO_DEDUCT} (Subscription Only)`}
          </Button>
          <Button
            onClick={() => handleDeduction("prioritySub")}
            disabled={!!isDeducting || isLoadingBenefits || !benefits}
            className="w-full sm:w-auto"
          >
            {isDeducting === "prioritySub"
              ? "Deducting..."
              : `Deduct ${CREDITS_TO_DEDUCT} (Prioritize Subscription)`}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>⚠️ Notes</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>
            1. <strong>Credit Deduction Logic:</strong>
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              &quot;One-Time Only&quot;: Deducts only from one-time credits.
              Fails if insufficient.
            </li>
            <li>
              &quot;Subscription Only&quot;: Deducts only from subscription
              credits. Fails if insufficient.
            </li>
            <li>
              &quot;Prioritize Subscription&quot;: Deducts from subscription
              credits first, then one-time credits if needed.
            </li>
          </ul>
          <p>
            2. Ensure the Supabase RPC functions (from{" "}
            <code className="bg-gray-200 dark:bg-gray-800">
              data/5、usage(deduct_rpc_demo).sql
            </code>
            ) are applied to your database with{" "}
            <strong>SECURITY DEFINER</strong>.
          </p>
          <p>
            3. After adding/modifying RPC functions, regenerate Supabase types
            to avoid linter errors in{" "}
            <code className="bg-gray-200 dark:bg-gray-800">
              actions/usage/deduct.ts
            </code>
            :{" "}
            <code className="bg-gray-200 dark:bg-gray-800">
              supabase gen types typescript --project-id YOUR_PROJECT_ID
              --schema public {" > "} lib/supabase/types.ts
            </code>
            .
          </p>
          <p>
            4. This page demonstrates deducting credits after feature use. For
            this demo,{" "}
            <code className="bg-gray-200 dark:bg-gray-800">
              actions/usage/deduct.ts
            </code>{" "}
            is called client-side. In a real application, credit deduction
            should occur server-side after the feature completes, not be
            initiated by the frontend.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
