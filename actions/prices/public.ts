'use server';

import { actionResponse, ActionResult } from '@/lib/action-response';
import { db, isDatabaseEnabled } from '@/lib/db';
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
  if (!isDatabaseEnabled) {
    return actionResponse.success([])
  }

  const environment = process.env.NODE_ENV === 'production' ? 'live' : 'test'

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/50c3a73e-ed9b-489d-9c57-b43ba19279a7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions/prices/public.ts:22',message:'getPublicPricingPlans called',data:{environment,NODE_ENV:process.env.NODE_ENV},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

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

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/50c3a73e-ed9b-489d-9c57-b43ba19279a7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions/prices/public.ts:36',message:'Plans fetched from database',data:{count:plans.length,plans:plans.map(p=>({id:p.id,title:p.cardTitle,price:p.price,paymentType:p.paymentType,interval:p.recurringInterval,benefits:p.benefitsJsonb}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    return actionResponse.success((plans as unknown as PricingPlan[]) || [])
  } catch (error) {
    console.error('Unexpected error in getPublicPricingPlans:', error)
    return actionResponse.error(getErrorMessage(error))
  }
}