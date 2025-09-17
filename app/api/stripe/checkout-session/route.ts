import { apiResponse } from '@/lib/api-response';
import { getSession } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { pricingPlans as pricingPlansSchema } from '@/lib/db/schema';
import { getErrorMessage } from '@/lib/error-utils';
import { getOrCreateStripeCustomer } from '@/lib/stripe/actions';
import stripe from '@/lib/stripe/stripe';
import { getURL } from '@/lib/utils';
import { eq } from 'drizzle-orm';
import type { Stripe } from 'stripe';

type RequestData = {
  priceId: string;
  couponCode?: string;
  referral?: string;
};

export async function POST(req: Request) {
  const session = await getSession();
  const user = session?.user;
  if (!user) {
    console.error('User not authenticated.');
    return apiResponse.unauthorized();
  }
  const userId = user.id;

  let requestData: RequestData;
  try {
    requestData = await req.json();
  } catch (error) {
    console.error('Invalid request body:', error);
    return apiResponse.badRequest()
  }

  const { priceId, couponCode, referral } = requestData;

  if (!priceId) {
    return apiResponse.badRequest('Missing priceId')
  }

  try {
    const customerId = await getOrCreateStripeCustomer(userId);

    const results = await db
      .select({
        id: pricingPlansSchema.id,
        cardTitle: pricingPlansSchema.cardTitle,
        paymentType: pricingPlansSchema.paymentType,
        trialPeriodDays: pricingPlansSchema.trialPeriodDays,
        benefitsJsonb: pricingPlansSchema.benefitsJsonb,
        stripeProductId: pricingPlansSchema.stripeProductId,
      })
      .from(pricingPlansSchema)
      .where(eq(pricingPlansSchema.stripePriceId, priceId))
      .limit(1);

    const plan = results[0];

    if (!plan) {
      console.error(`Plan not found for priceId ${priceId}`);
      return apiResponse.notFound('Plan not found');
    }

    const isSubscription = plan.paymentType === 'recurring';
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
      success_url: getURL('payment/success?session_id={CHECKOUT_SESSION_ID}'),
      cancel_url: getURL(process.env.NEXT_PUBLIC_PRICING_PATH!),
      // payment_method_types: ["wechat_pay", "alipay", "card"],
      // payment_method_options: {
      //   wechat_pay: {
      //     client: "web",
      //   },
      //   alipay: {},
      // },
      metadata: {
        userId: userId,
        planId: plan.id,
        planName: plan.cardTitle,
        priceId: priceId,
        ...(referral && { tolt_referral: referral }),
      },
    };

    if (couponCode) {
      sessionParams.discounts = [{ coupon: couponCode }];
    } else {
      sessionParams.allow_promotion_codes = true;
    }

    if (isSubscription) {
      sessionParams.subscription_data = {
        trial_period_days: plan.trialPeriodDays ?? undefined,
        metadata: {
          userId: userId,
          planId: plan.id,
          planName: plan.cardTitle,
          priceId: priceId,
        },
      };
    } else {
      sessionParams.payment_intent_data = {
        metadata: {
          userId: userId,
          planId: plan.id,
          planName: plan.cardTitle,
          priceId: priceId,
        },
      };
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
    const errorMessage = getErrorMessage(error);
    return apiResponse.serverError(errorMessage)
  }
} 