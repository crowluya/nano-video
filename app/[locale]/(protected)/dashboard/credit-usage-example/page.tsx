"use client";

import { UserBenefits } from "@/actions/usage/benefits";
import { deductCredits, getClientUserBenefits } from "@/actions/usage/deduct";
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
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const CREDITS_TO_DEDUCT = 10;

export default function CreditUsageExamplePage() {
  const [benefits, setBenefits] = useState<UserBenefits | null>(null);
  const [isLoadingBenefits, setIsLoadingBenefits] = useState(true);
  const [isDeducting, setIsDeducting] = useState(false);

  const fetchBenefitsAndSetState = useCallback(async () => {
    setIsLoadingBenefits(true);
    try {
      const result = await getClientUserBenefits();

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch user benefits.");
      }

      setBenefits(result.data || null);
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

  const handleDeduction = async () => {
    if (!benefits) {
      toast.error("User benefits not loaded yet.");
      return;
    }
    setIsDeducting(true);

    try {
      const result = await deductCredits(
        CREDITS_TO_DEDUCT,
        `Used feature from example page`
      );

      if (!result.success) {
        toast.error(result.error || "Could not deduct credits.");
        await fetchBenefitsAndSetState();
        return;
      }

      if (result.success && result.data) {
        toast.success(result.data.message || `Successfully deducted credits.`);
        setBenefits(result.data.updatedBenefits);
      }
    } catch (error) {
      console.error(`Error during deduction call:`, error);
      toast.error(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred during deduction."
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
            This page demonstrates how to deduct credits for using a feature.
            The button simulates using a feature that costs {CREDITS_TO_DEDUCT}{" "}
            credits. (Only for development)
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
        <CardFooter>
          <Button
            onClick={handleDeduction}
            disabled={isDeducting || isLoadingBenefits || !benefits}
            className="w-full sm:w-auto"
          >
            {isDeducting
              ? "Deducting..."
              : `Use Feature & Deduct ${CREDITS_TO_DEDUCT} Credits`}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>⚠️ Notes</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>
            1. <strong>Unified Credit Deduction Logic:</strong>
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              The system now uses a single, unified method for deduction:{" "}
              <code className="bg-gray-200 dark:bg-gray-800">
                deductCredits(amount, notes)
              </code>
              .
            </li>
            <li>
              This method automatically prioritizes deducting from subscription
              credits first, then from one-time credits.
            </li>
            <li>
              Every deduction is now recorded in the new{" "}
              <code className="bg-gray-200 dark:bg-gray-800">credit_logs</code>{" "}
              table.
            </li>
          </ul>
          <p>
            2. Ensure the new Supabase RPC functions (from{" "}
            <code className="bg-gray-200 dark:bg-gray-800">
              data/8、credit_logs.sql
            </code>
            ) are applied to your database.
          </p>
          <p>
            3. In a real application, credit deduction should happen on the
            server-side *after* a feature&apos;s successful execution, typically
            within the API route that provides the feature.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
