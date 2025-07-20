'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface UserBenefits {
  activePlanId: string | null;
  subscriptionStatus: string | null; // e.g., 'active', 'trialing', 'past_due', 'canceled', null
  currentPeriodEnd: string | null;
  nextCreditDate: string | null;
  totalAvailableCredits: number;
  subscriptionCreditsBalance: number;
  oneTimeCreditsBalance: number;
  // Add other plan-specific benefits if needed, fetched via planId
}

interface UsageData {
  subscription_credits_balance: number | null;
  one_time_credits_balance: number | null;
  balance_jsonb: any;
}

interface SubscriptionData {
  plan_id: string;
  status: string;
  current_period_end: string | null;
}

const defaultUserBenefits: UserBenefits = {
  activePlanId: null,
  subscriptionStatus: null,
  currentPeriodEnd: null,
  nextCreditDate: null,
  totalAvailableCredits: 0,
  subscriptionCreditsBalance: 0,
  oneTimeCreditsBalance: 0,
};

function createUserBenefitsFromData(
  usageData: UsageData | null,
  subscription: SubscriptionData | null,
  currentYearlyDetails: any | null = null
): UserBenefits {
  const subCredits = (usageData?.subscription_credits_balance ?? 0) as number;
  const oneTimeCredits = (usageData?.one_time_credits_balance ?? 0) as number;
  const totalCredits = subCredits + oneTimeCredits;

  const currentPeriodEnd = subscription?.current_period_end ?? null;
  const nextCreditDate = currentYearlyDetails?.next_credit_date ?? null;

  let finalStatus = subscription?.status ?? null;
  if (finalStatus && subscription?.current_period_end && new Date(subscription.current_period_end) < new Date()) {
    finalStatus = 'inactive_period_ended';
  }

  return {
    activePlanId: (finalStatus === 'active' || finalStatus === 'trialing') ? subscription?.plan_id ?? null : null,
    subscriptionStatus: finalStatus,
    currentPeriodEnd,
    nextCreditDate,
    totalAvailableCredits: totalCredits,
    subscriptionCreditsBalance: subCredits,
    oneTimeCreditsBalance: oneTimeCredits,
  };
}

async function fetchSubscriptionData(supabase: any, userId: string): Promise<SubscriptionData | null> {
  try {
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('plan_id, status, current_period_end, cancel_at_period_end')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subscriptionError) {
      console.error(`Error fetching subscription data for user ${userId}:`, subscriptionError);
      return null;
    }

    return subscription;
  } catch (error) {
    console.error(`Unexpected error in fetchSubscriptionData for user ${userId}:`, error);
    return null;
  }
}

/**
 * Retrieves the user's current benefits including plan, status, and credit balances.
 *
 * @param userId The UUID of the user.
 * @returns A promise resolving to the UserBenefits object.
 */
export async function getUserBenefits(userId: string): Promise<UserBenefits> {
  if (!userId) {
    return defaultUserBenefits;
  }

  const supabase = await createClient();

  try {
    const { data: usageData, error: usageError } = await supabase
      .from('usage')
      .select('subscription_credits_balance, one_time_credits_balance, balance_jsonb')
      .eq('user_id', userId)
      .maybeSingle();

    if (usageError) {
      console.error(`Error fetching usage data for user ${userId}:`, usageError);
      // return defaultUserBenefits;
    }

    let finalUsageData: UsageData | null = usageData;

    // ------------------------------------------
    // User with no usage data, it means he/she is a new user
    // Reference: handleWelcomeCredits on https://github.com/WeNextDev/nexty-flux-kontext/blob/main/actions/usage/benefits.ts
    // ------------------------------------------
    // if (!usageData) {
    //   console.log(`New user(${userId}) with no usage data - may grant benefits if needed.`);
    //   finalUsageData = someFunctionToGrantBenefits(userId);
    // }

    // ------------------------------------------
    // Handle user subscription data (subscriptions table) and benefits data (usage table)
    // ------------------------------------------
    if (finalUsageData) {
      let currentBalanceJsonb = finalUsageData.balance_jsonb as any;
      let currentYearlyDetails = currentBalanceJsonb?.yearly_allocation_details;

      // Start of Yearly Subscription Catch-up Logic
      while (
        currentYearlyDetails &&
        currentYearlyDetails.remaining_months &&
        currentYearlyDetails.remaining_months > 0 &&
        currentYearlyDetails.next_credit_date &&
        new Date() >= new Date(currentYearlyDetails.next_credit_date)
      ) {
        const creditsToAllocate = currentYearlyDetails.monthly_credits;
        const yearMonthToAllocate = new Date(currentYearlyDetails.next_credit_date).toISOString().slice(0, 7);

        console.log(`Attempting to allocate credits for user ${userId}, month ${yearMonthToAllocate}, remaining: ${currentYearlyDetails.remaining_months}`);

        const { error: rpcError } = await supabaseAdmin.rpc('allocate_specific_monthly_credit_for_year_plan', {
          p_user_id: userId,
          p_monthly_credits: creditsToAllocate,
          p_current_yyyy_mm: yearMonthToAllocate
        });

        if (rpcError) {
          console.error(`Catch-up: Error calling allocate_specific_monthly_credit_for_year_plan for user ${userId}, month ${yearMonthToAllocate}:`, rpcError);
          break;
        } else {
          console.log(`Catch-up: Successfully allocated or skipped for user ${userId}, month ${yearMonthToAllocate}. Re-fetching usage data.`);
          const { data: updatedUsageData, error: refetchError } = await supabase
            .from('usage')
            .select('subscription_credits_balance, one_time_credits_balance, balance_jsonb')
            .eq('user_id', userId)
            .maybeSingle();

          if (refetchError) {
            console.error(`Catch-up: Error re-fetching usage data for user ${userId} after allocation:`, refetchError);
            break;
          }
          if (!updatedUsageData) {
            console.warn(`Catch-up: Usage data disappeared for user ${userId} after allocation. Stopping.`);
            finalUsageData = null;
            break;
          }

          finalUsageData = updatedUsageData;
          currentBalanceJsonb = finalUsageData.balance_jsonb as any;
          currentYearlyDetails = currentBalanceJsonb?.yearly_allocation_details;

          if (!currentYearlyDetails) {
            console.log(`Catch-up: yearly_allocation_details no longer present for user ${userId} after allocation. Stopping loop.`);
            break;
          }
        }
      }
      // End of Yearly Subscription Catch-up Logic

      const subscription = await fetchSubscriptionData(supabase, userId);

      return createUserBenefitsFromData(finalUsageData, subscription, currentYearlyDetails);
    } else {
      const subscription = await fetchSubscriptionData(supabase, userId);

      return createUserBenefitsFromData(null, subscription);
    }
  } catch (error) {
    console.error(`Unexpected error in getUserBenefits for user ${userId}:`, error);
    return defaultUserBenefits;
  }
}
