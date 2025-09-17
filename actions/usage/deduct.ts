'use server';

import { actionResponse, ActionResult } from '@/lib/action-response';
import { getSession } from '@/lib/auth/server';
import { db } from '@/lib/db';
import {
  creditLogs as creditLogsSchema,
  usage as usageSchema,
} from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getUserBenefits, UserBenefits } from './benefits';

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
  const session = await getSession()
  const user = session?.user;
  if (!user) return actionResponse.unauthorized();

  if (amountToDeduct <= 0) {
    return actionResponse.badRequest('Amount to deduct must be positive.');
  }

  if (!notes) {
    return actionResponse.badRequest('Deduction notes are required.');
  }

  try {
    await db.transaction(async (tx) => {
      // Lock the user's usage row for the duration of the transaction
      const usageResults = await tx.select({
        oneTimeCreditsBalance: usageSchema.oneTimeCreditsBalance,
        subscriptionCreditsBalance: usageSchema.subscriptionCreditsBalance,
      })
        .from(usageSchema)
        .where(eq(usageSchema.userId, user.id))
        .for('update');

      const usage = usageResults[0];

      if (!usage) {
        throw new Error('INSUFFICIENT_CREDITS');
      }

      const totalCredits = usage.oneTimeCreditsBalance + usage.subscriptionCreditsBalance;
      if (totalCredits < amountToDeduct) {
        throw new Error('INSUFFICIENT_CREDITS');
      }

      const deductedFromSub = Math.min(usage.subscriptionCreditsBalance, amountToDeduct);
      const deductedFromOneTime = amountToDeduct - deductedFromSub;

      const newSubBalance = usage.subscriptionCreditsBalance - deductedFromSub;
      const newOneTimeBalance = usage.oneTimeCreditsBalance - deductedFromOneTime;

      await tx.update(usageSchema)
        .set({
          subscriptionCreditsBalance: newSubBalance,
          oneTimeCreditsBalance: newOneTimeBalance,
        })
        .where(eq(usageSchema.userId, user.id));

      await tx.insert(creditLogsSchema)
        .values({
          userId: user.id,
          amount: -amountToDeduct,
          oneTimeBalanceAfter: newOneTimeBalance,
          subscriptionBalanceAfter: newSubBalance,
          type: 'feature_usage',
          notes: notes,
        });
    });

    const updatedBenefits = await getUserBenefits(user.id);

    return actionResponse.success({
      message: 'Credits deducted successfully.',
      updatedBenefits,
    });

  } catch (e: any) {
    if (e.message === 'INSUFFICIENT_CREDITS') {
      return actionResponse.badRequest('Insufficient credits.');
    }
    console.error(`Unexpected error in deductCredits:`, e);
    return actionResponse.error(e.message || 'An unexpected server error occurred.');
  }
}

export async function getClientUserBenefits(): Promise<ActionResult<UserBenefits | null>> {
  const session = await getSession()
  const user = session?.user;
  if (!user) return actionResponse.unauthorized();
  try {
    const benefits = await getUserBenefits(user.id);
    if (benefits) {
      return actionResponse.success(benefits);
    }
    return actionResponse.notFound('User benefits not found.');
  } catch (error: any) {
    console.error('Error fetching user benefits for client:', error);
    return actionResponse.error(error.message || 'Failed to fetch user benefits.');
  }
}
