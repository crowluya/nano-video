'use server'

import { DEFAULT_LOCALE } from '@/i18n/routing'
import { actionResponse, ActionResult } from '@/lib/action-response'
import { isAdmin } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { pricingPlans as pricingPlansSchema } from '@/lib/db/schema'
import { getErrorMessage } from '@/lib/error-utils'
import { asc, eq } from 'drizzle-orm'
import { getTranslations } from 'next-intl/server'
import 'server-only'

type PricingPlan = typeof pricingPlansSchema.$inferSelect

/**
 * Admin List
 */
export async function getAdminPricingPlans(): Promise<
  ActionResult<PricingPlan[]>
> {
  if (!(await isAdmin())) {
    return actionResponse.forbidden('Admin privileges required.')
  }

  try {
    const plans = await db
      .select()
      .from(pricingPlansSchema)
      .orderBy(asc(pricingPlansSchema.environment), asc(pricingPlansSchema.displayOrder))

    return actionResponse.success((plans as unknown as PricingPlan[]) || [])
  } catch (error) {
    console.error('Unexpected error in getAdminPricingPlans:', error)
    return actionResponse.error(getErrorMessage(error))
  }
}

/**
 * Admin Get By ID
 */
export async function getPricingPlanById(
  planId: string
): Promise<ActionResult<PricingPlan | null>> {
  if (!planId) {
    return actionResponse.badRequest('Plan ID is required.')
  }
  if (!(await isAdmin())) {
    return actionResponse.forbidden('Admin privileges required.')
  }

  try {
    const result = await db
      .select()
      .from(pricingPlansSchema)
      .where(eq(pricingPlansSchema.id, planId))
      .limit(1)

    const plan = result[0]

    if (!plan) {
      return actionResponse.notFound(`Pricing plan with ID ${planId} not found.`)
    }

    return actionResponse.success((plan as unknown as PricingPlan) || null)
  } catch (error) {
    console.error(
      `Unexpected error in getPricingPlanById for ID ${planId}:`,
      error
    )
    return actionResponse.error(getErrorMessage(error))
  }
}

/**
 * Admin Create
 */
interface CreatePricingPlanParams {
  planData: Partial<Omit<PricingPlan, 'id' | 'createdAt' | 'updatedAt'>>
  locale?: string
}

export async function createPricingPlanAction({
  planData,
  locale = DEFAULT_LOCALE,
}: CreatePricingPlanParams) {
  if (!(await isAdmin())) {
    return actionResponse.forbidden('Admin privileges required.')
  }

  const t = await getTranslations({
    locale,
    namespace: 'Prices.API',
  })

  if (!planData.environment || !planData.cardTitle) {
    return actionResponse.badRequest(t('missingRequiredFields'))
  }

  if (planData.langJsonb && typeof planData.langJsonb !== 'object') {
    try {
      if (typeof planData.langJsonb === 'string') {
        planData.langJsonb = JSON.parse(planData.langJsonb as string)
      } else {
        return actionResponse.badRequest(t('invalidLangJsonbFormat'))
      }
    } catch (e) {
      return actionResponse.badRequest(t('invalidJsonFormatInLangJsonbString'))
    }
  }

  if (planData.benefitsJsonb && typeof planData.benefitsJsonb !== 'object') {
    try {
      if (typeof planData.benefitsJsonb === 'string') {
        planData.benefitsJsonb = JSON.parse(planData.benefitsJsonb as string)
      } else {
        return actionResponse.badRequest(t('invalidBenefitsJsonFormat'))
      }
    } catch (e) {
      return actionResponse.badRequest(t('invalidJsonFormatInBenefitsString'))
    }
  }

  try {
    const [newPlan] = await db
      .insert(pricingPlansSchema)
      .values({
        environment: planData.environment,
        cardTitle: planData.cardTitle,
        cardDescription: planData.cardDescription,
        stripePriceId: planData.stripePriceId,
        stripeProductId: planData.stripeProductId,
        stripeCouponId: planData.stripeCouponId,
        enableManualInputCoupon:
          planData.enableManualInputCoupon ?? false,
        paymentType: planData.paymentType,
        recurringInterval: planData.recurringInterval,
        price: planData.price?.toString(),
        currency: planData.currency,
        displayPrice: planData.displayPrice,
        originalPrice: planData.originalPrice,
        priceSuffix: planData.priceSuffix,
        isHighlighted: planData.isHighlighted ?? false,
        highlightText: planData.highlightText,
        buttonText: planData.buttonText,
        buttonLink: planData.buttonLink,
        displayOrder: planData.displayOrder ?? 0,
        isActive: planData.isActive ?? true,
        features: (planData.features || []),
        langJsonb: (planData.langJsonb || {}),
        benefitsJsonb: (planData.benefitsJsonb || {}),
      })
      .returning()

    return actionResponse.success(newPlan)
  } catch (err) {
    console.error('Unexpected error creating pricing plan:', err)
    const errorMessage = getErrorMessage(err)
    if (errorMessage.includes('duplicate key value violates unique constraint')) {
      return actionResponse.conflict(
        t('createPlanConflict', { message: errorMessage })
      )
    }
    return actionResponse.error(errorMessage || t('createPlanServerError'))
  }
}

/**
 * Admin Update
 */
interface UpdatePricingPlanParams {
  id: string
  planData: Partial<PricingPlan>
  locale?: string
}
export async function updatePricingPlanAction({
  id,
  planData,
  locale = DEFAULT_LOCALE,
}: UpdatePricingPlanParams) {
  if (!(await isAdmin())) {
    return actionResponse.forbidden('Admin privileges required.')
  }

  const t = await getTranslations({
    locale,
    namespace: 'Prices.API',
  })

  if (!id) {
    return actionResponse.badRequest(t('missingPlanId'))
  }

  if (planData.langJsonb && typeof planData.langJsonb === 'string') {
    try {
      planData.langJsonb = JSON.parse(planData.langJsonb as string)
    } catch (e) {
      return actionResponse.badRequest(t('invalidJsonFormatInLangJsonbString'))
    }
  } else if (
    planData.langJsonb &&
    typeof planData.langJsonb !== 'object' &&
    planData.langJsonb !== null
  ) {
    return actionResponse.badRequest(t('invalidLangJsonbFormat'))
  }

  if (planData.benefitsJsonb && typeof planData.benefitsJsonb === 'string') {
    try {
      planData.benefitsJsonb = JSON.parse(planData.benefitsJsonb as string)
    } catch (e) {
      return actionResponse.badRequest(t('invalidJsonFormatInBenefitsString'))
    }
  } else if (
    planData.benefitsJsonb &&
    typeof planData.benefitsJsonb !== 'object' &&
    planData.benefitsJsonb !== null
  ) {
    return actionResponse.badRequest(t('invalidBenefitsJsonFormat'))
  }

  try {
    delete planData.id
    delete planData.createdAt
    delete planData.updatedAt

    const dataToUpdate: { [key: string]: any } = { ...planData }

    if (dataToUpdate.price) {
      dataToUpdate.price = dataToUpdate.price.toString()
    }

    if (planData.features !== undefined) {
      dataToUpdate.features = (planData.features || [])
    }
    if (planData.langJsonb !== undefined) {
      dataToUpdate.langJsonb = (planData.langJsonb || {})
    }
    if (planData.benefitsJsonb !== undefined) {
      dataToUpdate.benefitsJsonb =
        (planData.benefitsJsonb || {})
    }

    const [updatedPlan] = await db
      .update(pricingPlansSchema)
      .set(dataToUpdate)
      .where(eq(pricingPlansSchema.id, id))
      .returning()

    if (!updatedPlan) {
      return actionResponse.notFound(t('updatePlanNotFound', { id }))
    }


    return actionResponse.success(updatedPlan)
  } catch (err) {
    console.error(`Unexpected error updating pricing plan ${id}:`, err)
    return actionResponse.error(
      getErrorMessage(err) || t('updatePlanServerError')
    )
  }
}

/**
 * Admin Delete
 */
interface DeletePricingPlanParams {
  id: string
  locale?: string
}

export async function deletePricingPlanAction({
  id,
  locale = DEFAULT_LOCALE,
}: DeletePricingPlanParams) {
  if (!(await isAdmin())) {
    return actionResponse.forbidden('Admin privileges required.')
  }

  const t = await getTranslations({
    locale,
    namespace: 'Prices.API',
  })

  if (!id) {
    return actionResponse.badRequest(t('missingPlanId'))
  }

  try {
    const result = await db
      .delete(pricingPlansSchema)
      .where(eq(pricingPlansSchema.id, id))
      .returning({ id: pricingPlansSchema.id })

    if (result.length === 0) {
      return actionResponse.notFound(t('deletePlanNotFound', { id }))
    }


    return actionResponse.success({ message: t('deletePlanSuccess', { id }) })
  } catch (err) {
    console.error(`Unexpected error deleting pricing plan ${id}:`, err)
    return actionResponse.error(
      getErrorMessage(err) || t('deletePlanServerError')
    )
  }
}

