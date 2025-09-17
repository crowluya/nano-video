'use server';

import { actionResponse, ActionResult } from '@/lib/action-response';
import { db } from '@/lib/db';
import { pricingPlans as pricingPlansSchema } from '@/lib/db/schema';
import { getErrorMessage } from '@/lib/error-utils';
import { and, asc, eq } from 'drizzle-orm';
import 'server-only';

type PricingPlan = typeof pricingPlansSchema.$inferSelect

/**
 * Public List
 */
export async function getPublicPricingPlans(): Promise<
  ActionResult<PricingPlan[]>
> {
  const environment = process.env.NODE_ENV === 'production' ? 'live' : 'test'

  try {
    const plans = await db
      .select()
      .from(pricingPlansSchema)
      .where(
        and(
          eq(pricingPlansSchema.environment, environment),
          eq(pricingPlansSchema.isActive, true)
        )
      )
      .orderBy(asc(pricingPlansSchema.displayOrder))

    return actionResponse.success((plans as unknown as PricingPlan[]) || [])
  } catch (error) {
    console.error('Unexpected error in getPublicPricingPlans:', error)
    return actionResponse.error(getErrorMessage(error))
  }
}