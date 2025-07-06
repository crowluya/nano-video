export const maxDuration = 30;

import { DEFAULT_LOCALE } from '@/i18n/routing';
import { apiResponse } from '@/lib/api-response';
import stripe from '@/lib/stripe/stripe';
import { isAdmin } from '@/lib/supabase/isAdmin';
import { getTranslations } from 'next-intl/server';
import { headers } from 'next/headers';
import { NextRequest } from 'next/server';

interface VerifyPricePayload {
  priceId: string;
  environment: 'test' | 'live';
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) {
    return apiResponse.forbidden('Admin privileges required.');
  }

  const { get } = await headers();
  const locale = get("Accept-Language");

  const t = await getTranslations({ locale: locale || DEFAULT_LOCALE, namespace: 'Prices.API' });

  let payload: VerifyPricePayload;
  try {
    payload = await request.json();
  } catch (e) {
    return apiResponse.badRequest(t("invalidJsonBody"));
  }

  if (!payload || typeof payload.priceId !== 'string' ||
    !payload.environment || (payload.environment !== 'test' && payload.environment !== 'live')) {
    return apiResponse.badRequest(t("invalidPayload"));
  }

  const { priceId, environment } = payload;

  if (!stripe) {
    return apiResponse.serverError('Stripe is not initialized. Please check your environment variables.');
  }

  try {
    const price = await stripe.prices.retrieve(priceId);

    const expectedLiveMode = environment === 'live';
    if (price.livemode !== expectedLiveMode) {
      return apiResponse.badRequest(t("priceIdEnvironmentMismatch", { priceId, belongsToEnvironment: price.livemode ? 'live' : 'test', requestEnvironment: environment }));
    }


    const responseData = {
      priceId: price.id,
      productId: price.product,
      paymentType: price.type, // one_time, recurring
      recurring: price.recurring ? {
        interval: price.recurring.interval || null,
        interval_count: price.recurring.interval_count || null,
        trial_period_days: price.recurring.trial_period_days || null,
        usage_type: price.recurring.usage_type || null,
      } : null,
      price: price.unit_amount,
      currency: price.currency, // eg: usd, cny
      livemode: price.livemode
    };

    return apiResponse.success(responseData);

  } catch (error: any) {
    console.error(`Stripe API error verifying price ${priceId} in ${environment} mode:`, error);
    if (error.type === 'StripeInvalidRequestError' && error.code === 'resource_missing') {
      const errorMessage = t("priceNotFound", { priceId, environment });
      return apiResponse.notFound(errorMessage);
    } else if (error.type === 'StripeAuthenticationError') {
      const errorMessage = t("stripeAuthenticationFailed", { environment });
      return apiResponse.serverError(errorMessage);
    }
    return apiResponse.serverError(t("stripeApiError", { code: error.code, type: error.type, message: error.message }));
  }
} 