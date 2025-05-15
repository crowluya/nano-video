'use server';

import { actionResponse, ActionResult } from '@/lib/action-response';
import { getErrorMessage } from '@/lib/error-utils';
import { isAdmin } from '@/lib/supabase/isAdmin';
import { createClient } from "@/lib/supabase/server";
import { Database } from "@/lib/supabase/types";
import { PricingPlan } from "@/types/pricing";
import {
  createClient as createAdminClient,
} from "@supabase/supabase-js";
import 'server-only';

export async function getAdminPricingPlans(): Promise<ActionResult<PricingPlan[]>> {
  if (!(await isAdmin())) {
    return actionResponse.forbidden("Admin privileges required.");
  }

  const supabaseAdmin = createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { data: plans, error } = await supabaseAdmin
      .from("pricing_plans")
      .select("*")
      .order("environment", { ascending: true })
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error fetching pricing plans for admin page:", error);
      return actionResponse.error(`Failed to fetch pricing plans: ${error.message}`);
    }

    return actionResponse.success((plans as unknown as PricingPlan[]) || []);
  } catch (error) {
    console.error("Unexpected error in getAdminPricingPlans:", error);
    return actionResponse.error(getErrorMessage(error));
  }
}

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


