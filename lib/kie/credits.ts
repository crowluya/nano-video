/**
 * Kie.ai Credit Deduction Helper
 * 
 * Server-side helper for deducting credits when using kie.ai features.
 */

import { getSession } from '@/lib/auth/server';
import { db } from '@/lib/db';
import {
  creditLogs as creditLogsSchema,
  usage as usageSchema,
} from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getKieImageModel, getKieVideoModel, getKieMusicModel } from '@/config/models';

export interface CreditDeductionResult {
  success: boolean;
  error?: string;
  creditsDeducted?: number;
  remainingCredits?: number;
}

/**
 * Deducts credits for a kie.ai operation
 */
export async function deductKieCredits(
  type: 'image' | 'video' | 'music',
  modelId: string,
  notes: string
): Promise<CreditDeductionResult> {
  const session = await getSession();
  const user = session?.user;

  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  // Get credits required for this model
  let creditsRequired = 0;
  
  if (type === 'image') {
    const model = getKieImageModel(modelId);
    creditsRequired = model?.creditsPerGeneration || 10;
  } else if (type === 'video') {
    const model = getKieVideoModel(modelId);
    creditsRequired = model?.creditsPerGeneration || 80;
  } else if (type === 'music') {
    const model = getKieMusicModel(modelId);
    creditsRequired = model?.creditsPerGeneration || 20;
  }

  try {
    let remainingCredits = 0;

    await db.transaction(async (tx) => {
      // Lock the user's usage row
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
      if (totalCredits < creditsRequired) {
        throw new Error('INSUFFICIENT_CREDITS');
      }

      // Deduct from subscription credits first, then one-time
      const deductedFromSub = Math.min(usage.subscriptionCreditsBalance, creditsRequired);
      const deductedFromOneTime = creditsRequired - deductedFromSub;

      const newSubBalance = usage.subscriptionCreditsBalance - deductedFromSub;
      const newOneTimeBalance = usage.oneTimeCreditsBalance - deductedFromOneTime;

      remainingCredits = newSubBalance + newOneTimeBalance;

      await tx.update(usageSchema)
        .set({
          subscriptionCreditsBalance: newSubBalance,
          oneTimeCreditsBalance: newOneTimeBalance,
        })
        .where(eq(usageSchema.userId, user.id));

      await tx.insert(creditLogsSchema)
        .values({
          userId: user.id,
          amount: -creditsRequired,
          oneTimeBalanceAfter: newOneTimeBalance,
          subscriptionBalanceAfter: newSubBalance,
          type: 'feature_usage',
          notes: `[${type}] ${notes}`,
        });
    });

    return {
      success: true,
      creditsDeducted: creditsRequired,
      remainingCredits,
    };

  } catch (e: unknown) {
    const error = e instanceof Error ? e : new Error(String(e));
    if (error.message === 'INSUFFICIENT_CREDITS') {
      return { success: false, error: 'Insufficient credits' };
    }
    console.error('Error deducting credits:', error);
    return { success: false, error: error.message || 'Failed to deduct credits' };
  }
}

/**
 * Check if user has enough credits for an operation
 */
export async function checkKieCredits(
  type: 'image' | 'video' | 'music',
  modelId: string
): Promise<{ hasCredits: boolean; required: number; available: number }> {
  const session = await getSession();
  const user = session?.user;

  if (!user) {
    return { hasCredits: false, required: 0, available: 0 };
  }

  // Get credits required for this model
  let creditsRequired = 0;
  
  if (type === 'image') {
    const model = getKieImageModel(modelId);
    creditsRequired = model?.creditsPerGeneration || 10;
  } else if (type === 'video') {
    const model = getKieVideoModel(modelId);
    creditsRequired = model?.creditsPerGeneration || 80;
  } else if (type === 'music') {
    const model = getKieMusicModel(modelId);
    creditsRequired = model?.creditsPerGeneration || 20;
  }

  try {
    const usageResults = await db.select({
      oneTimeCreditsBalance: usageSchema.oneTimeCreditsBalance,
      subscriptionCreditsBalance: usageSchema.subscriptionCreditsBalance,
    })
      .from(usageSchema)
      .where(eq(usageSchema.userId, user.id));

    const usage = usageResults[0];
    const available = usage
      ? usage.oneTimeCreditsBalance + usage.subscriptionCreditsBalance
      : 0;

    return {
      hasCredits: available >= creditsRequired,
      required: creditsRequired,
      available,
    };
  } catch (e) {
    console.error('Error checking credits:', e);
    return { hasCredits: false, required: creditsRequired, available: 0 };
  }
}

