'use server';

import { actionResponse, ActionResult } from '@/lib/action-response';
import { getErrorMessage } from '@/lib/error-utils';
import { createClient } from "@/lib/supabase/server";
import { PricingPlan } from "@/types/pricing";
import 'server-only';

/**
 * Public List
 */
export async function getPublicPricingPlans(): Promise<ActionResult<PricingPlan[]>> {
  const supabase = await createClient();
  const environment = process.env.NODE_ENV === 'production' ? 'live' : 'test';

  try {
    const { data: plans, error } = await supabase
      .from("pricing_plans")
      .select("*")
      .eq("environment", environment)
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error fetching public pricing plans:", error);
      return actionResponse.error(`Failed to fetch pricing plans: ${error.message}`);
    }

    return actionResponse.success((plans as unknown as PricingPlan[]) || []);
  } catch (error) {
    console.error("Unexpected error in getPublicPricingPlans:", error);
    return actionResponse.error(getErrorMessage(error));
  }
}