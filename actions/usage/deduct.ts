'use server';

import { actionResponse, ActionResult } from '@/lib/action-response';
import { getUserBenefits as fetchUserBenefitsInternal, UserBenefits } from './benefits';

import { createClient } from '@/lib/supabase/server';
import { Database } from '@/lib/supabase/types';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export interface DeductCreditsData {
  message: string;
  updatedBenefits: UserBenefits | null;
}

/**
 * Unified action for deducting credits from a user's account.
 * @param amountToDeduct - The amount of credits to deduct (must be a positive number).
 * @param notes - A description for this deduction, which will be recorded in `credit_logs` (e.g., "AI summary generation").
 * @returns An `ActionResult` containing the operation result and the updated user benefits.
 */
export async function deductCredits(
  amountToDeduct: number,
  notes: string,
): Promise<ActionResult<DeductCreditsData | null>> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return actionResponse.unauthorized();
  }

  if (amountToDeduct <= 0) {
    return actionResponse.badRequest('Amount to deduct must be positive.');
  }

  if (!notes) {
    return actionResponse.badRequest('Deduction notes are required.');
  }

  const supabaseAdmin = createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { data: rpcSuccess, error: rpcError } = await supabaseAdmin.rpc('deduct_credits_and_log', {
      p_user_id: user.id,
      p_deduct_amount: amountToDeduct,
      p_notes: notes,
    });

    if (rpcError) {
      console.error(`Error calling deduct_credits_and_log RPC:`, rpcError);
      return actionResponse.error(`Failed to deduct credits: ${rpcError.message}`);
    }

    // return 'false' means insufficient credits
    if (rpcSuccess === false) {
      return actionResponse.badRequest('Insufficient credits.');
    }

    const updatedBenefits = await fetchUserBenefitsInternal(user.id);

    return actionResponse.success({
      message: 'Credits deducted successfully.',
      updatedBenefits,
    });

  } catch (e: any) {
    console.error(`Unexpected error in deductCredits:`, e);
    return actionResponse.error(e.message || 'An unexpected server error occurred.');
  }
}

export async function getClientUserBenefits(): Promise<ActionResult<UserBenefits | null>> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return actionResponse.unauthorized();
  }
  try {
    const benefits = await fetchUserBenefitsInternal(user.id);
    if (benefits) {
      return actionResponse.success(benefits);
    }
    return actionResponse.notFound('User benefits not found.');
  } catch (error: any) {
    console.error('Error fetching user benefits for client:', error);
    return actionResponse.error(error.message || 'Failed to fetch user benefits.');
  }
}
