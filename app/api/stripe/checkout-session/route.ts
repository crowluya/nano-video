import { apiResponse } from '@/lib/api-response';
import { getOrCreateStripeCustomer } from '@/lib/stripe/actions';
import stripe from '@/lib/stripe/stripe';
import { createClient } from '@/lib/supabase/server';
import { getURL } from '@/lib/utils';
import type { Stripe } from 'stripe';

type RequestData = {
  priceId: string;
  couponCode?: string;
};

export async function POST(req: Request) {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error('User not authenticated.');
    return apiResponse.unauthorized()
  }
  const userId = user.id;

  let requestData: RequestData;
  try {
    requestData = await req.json();
  } catch (error) {
    console.error('Invalid request body:', error);
    return apiResponse.badRequest()
  }

  const { priceId, couponCode } = requestData;

  if (!priceId) {
    return apiResponse.badRequest('Missing priceId')
  }

  try {
    const customerId = await getOrCreateStripeCustomer(userId);

    const { data: plan, error: planError } = await supabase
      .from('pricing_plans')
      .select('id, card_title, payment_type, trial_period_days, benefits_jsonb, stripe_product_id')
      .eq('stripe_price_id', priceId)
      .single();

    if (planError || !plan) {
      console.error(`Plan not found for priceId ${priceId}:`, planError);
      return apiResponse.notFound('Plan not found');
    }

    const isSubscription = plan.payment_type === 'recurring';
    const mode = isSubscription ? 'subscription' : 'payment';

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: mode,
      allow_promotion_codes: true,
      success_url: getURL('payment/success?session_id={CHECKOUT_SESSION_ID}'),
      cancel_url: getURL('#pricing'),
      metadata: {
        userId: userId,
        planId: plan.id,
        planName: plan.card_title,
        priceId: priceId,
      },
    };

    if (isSubscription) {
      sessionParams.subscription_data = {
        trial_period_days: plan.trial_period_days ?? undefined,
        metadata: {
          userId: userId,
          planId: plan.id,
          planName: plan.card_title,
          priceId: priceId,
        },
      };
      if (couponCode) { sessionParams.discounts = [{ coupon: couponCode }]; }
    } else {
      sessionParams.payment_intent_data = {
        metadata: {
          userId: userId,
          planId: plan.id,
          planName: plan.card_title,
          priceId: priceId,
        },
      };
      if (couponCode) { sessionParams.discounts = [{ coupon: couponCode }]; }
    }

    if (!stripe) {
      return apiResponse.serverError('Stripe is not initialized. Please check your environment variables.');
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    if (!session.url && !session.id) {
      console.error('Stripe session creation failed: No URL or ID returned.');
      return apiResponse.serverError('Error creating checkout session');
    }
    return apiResponse.success({ sessionId: session.id, url: session.url });

  } catch (error) {
    console.error('Error creating Stripe Checkout Session:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return apiResponse.serverError(errorMessage)
  }
} 