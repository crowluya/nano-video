import { syncSubscriptionData } from '@/actions/stripe';
import { apiResponse } from '@/lib/api-response';
import { getSession } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { orders as ordersSchema, subscriptions as subscriptionsSchema } from '@/lib/db/schema';
import { stripe } from '@/lib/stripe';
import { and, eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import Stripe from 'stripe';

export async function GET(req: NextRequest) {
  const session = await getSession();
  const user = session?.user;
  if (!user) return apiResponse.unauthorized();

  const sessionId = req.nextUrl.searchParams.get('session_id');
  if (!sessionId) {
    return apiResponse.badRequest('Missing session_id parameter');
  }

  if (!stripe) {
    return apiResponse.serverError('Stripe is not initialized. Please check your environment variables.');
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'payment_intent', 'subscription']
    });

    if (session.metadata?.userId !== user.id) {
      console.warn(`User ID mismatch! Auth User: ${user.id}, Session Meta User: ${session.metadata?.userId}, Session: ${sessionId}`);
      return apiResponse.forbidden('User ID mismatch.');
    }
    if (session.status !== 'complete') {
      return apiResponse.badRequest(`Checkout session status is not complete (${session.status})`);
    }

    try {
      if (session.mode === 'subscription' && session.subscription) {
        const subId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
        const custId = typeof session.customer === 'string' ? session.customer : (session.customer as Stripe.Customer)?.id;

        if (!subId || !custId) {
          console.error(`[Verify API] Missing subscription or customer ID for session ${sessionId}`);
          return apiResponse.serverError('Could not verify subscription details.');
        }

        try {
          await syncSubscriptionData(subId, custId, session.metadata || undefined);
        } catch (syncError) {
          console.error(`[Verify API] Error during fallback sync for session ${sessionId}:`, syncError);
        }

        let activeSubscription, subCheckError = null;
        try {
          const results = await db
            .select({
              id: subscriptionsSchema.id,
              planId: subscriptionsSchema.planId,
              status: subscriptionsSchema.status,
              metadata: subscriptionsSchema.metadata,
            })
            .from(subscriptionsSchema)
            .where(
              and(
                eq(subscriptionsSchema.stripeSubscriptionId, subId),
                eq(subscriptionsSchema.userId, user.id),
              )
            )
            .limit(1);
          activeSubscription = results[0];
        } catch (e) {
          subCheckError = e;
        }

        if (subCheckError) {
          console.error(`[Verify API] DB error checking subscription ${subId}:`, subCheckError);
          return apiResponse.serverError('Failed to verify subscription status in database.');
        }

        if (!activeSubscription) {
          console.warn(`[Verify API] Subscription ${subId} not found or not active/trialing in DB for user ${user.id}. Status might be pending webhook processing.`);
          return apiResponse.success({
            message: 'Payment successful! Subscription activation may take a moment. Please refresh shortly.',
          });
        } else {
          if (activeSubscription.status === 'active' || activeSubscription.status === 'trialing') {
            return apiResponse.success({
              subscriptionId: activeSubscription.id,
              planName: (activeSubscription.metadata as any)?.planName,
              planId: activeSubscription.planId,
              status: activeSubscription.status,
              message: 'Subscription verified and active.',
            });
          }
          if (activeSubscription.status === 'canceled') {
            return apiResponse.serverError('Subscription was canceled. Maybe your charge was refunded. Please contact support.');
          }
        }
      } else if (session.mode === 'payment') {
        if (session.payment_status !== 'paid') {
          return apiResponse.badRequest(`Payment status is not paid (${session.payment_status})`);
        }

        const piId = session.payment_intent ? typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent.id : session.id;

        let existingOrder, orderCheckError = null;
        try {
          const results = await db
            .select({
              id: ordersSchema.id,
              metadata: ordersSchema.metadata,
              status: ordersSchema.status,
            })
            .from(ordersSchema)
            .where(
              and(
                eq(ordersSchema.provider, 'stripe'),
                eq(ordersSchema.providerOrderId, piId),
                eq(ordersSchema.userId, user.id),
                eq(ordersSchema.orderType, 'one_time_purchase'),
              )
            )
            .limit(1);
          existingOrder = results[0];
        } catch (e) {
          orderCheckError = e;
        }

        if (orderCheckError) {
          console.error(`[Verify API] DB error checking order for PI ${piId}:`, orderCheckError);
          return apiResponse.serverError('Failed to verify payment status in database.');
        }

        if (!existingOrder) {
          console.warn(`[Verify API] Order for PI ${piId} not found via webhook. Consider adding creation logic here as fallback.`);
          return apiResponse.success({
            message: 'Payment successful! Order confirmation may take a moment. Please refresh shortly.',
          });
        } else {

          if (existingOrder.status === 'succeeded') {
            const message = 'Payment verified and order confirmed.';
            return apiResponse.success({
              orderId: existingOrder.id,
              planName: (existingOrder.metadata as any)?.planName,
              planId: (existingOrder.metadata as any)?.planId,
              message: message
            });
          }

          if (existingOrder.status === 'refunded') {
            return apiResponse.serverError('Payment was refunded. Maybe your charge was refunded. Please contact support.');
          }
        }
      }
    } catch (syncError) {
      console.error(`[Verify API] Error during fallback sync for session ${sessionId}:`, syncError);
      return apiResponse.badRequest('Invalid session type for verification.');
    }

  } catch (error: any) {
    console.error(`Error retrieving/verifying checkout session ${sessionId}:`, error);
    const clientMessage = error?.message?.includes('No such checkout.session') ? 'Invalid session ID.' : 'Failed to verify payment.';
    return apiResponse.serverError(clientMessage);
  }
} 