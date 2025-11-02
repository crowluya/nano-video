import {
  sendCreditUpgradeFailedEmail,
  sendFraudRefundUserEmail,
  sendFraudWarningAdminEmail,
  sendInvoicePaymentFailedEmail,
  syncSubscriptionData,
} from '@/actions/stripe';
import { db } from '@/lib/db';
import {
  orders as ordersSchema,
  pricingPlans as pricingPlansSchema,
} from '@/lib/db/schema';
import { stripe } from '@/lib/stripe';
import { and, eq, inArray, InferInsertModel } from 'drizzle-orm';
import Stripe from 'stripe';
import {
  revokeOneTimeCredits,
  revokeRemainingSubscriptionCreditsOnEnd,
  revokeSubscriptionCredits,
} from './credit-revokes';
import {
  upgradeOneTimeCredits,
  upgradeSubscriptionCredits,
} from './credit-upgrades';

/**
 * Handles the `checkout.session.completed` event from Stripe.
 *
 * - For one-time payments, it creates an order record and grants credits.
 * - For subscriptions, it triggers the initial subscription sync.
 *
 * @param session The Stripe Checkout Session object.
 */
export async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const planId = session.metadata?.planId;
  const priceId = session.metadata?.priceId;

  if (!userId || !planId || !priceId) {
    console.error('Critical metadata (userId, planId, priceId) missing in checkout session:', session.id, session.metadata);
    return;
  }

  if (session.mode === 'payment') {
    let paymentIntentId = session.payment_intent as string;

    if (!paymentIntentId) {
      console.error('Payment Intent ID missing from completed checkout session (mode=payment):', session.id);
      // return;
      paymentIntentId = session.id;
    }

    /**
     * Idempotency Check
     * 幂等性检查
     * 冪等性チェック
     */
    const existingOrderResults = await db
      .select({ id: ordersSchema.id })
      .from(ordersSchema)
      .where(and(
        eq(ordersSchema.provider, 'stripe'),
        eq(ordersSchema.providerOrderId, paymentIntentId)
      ))
      .limit(1);

    if (existingOrderResults.length > 0) {
      return;
    }

    const orderData: InferInsertModel<typeof ordersSchema> = {
      userId: userId,
      provider: 'stripe',
      providerOrderId: paymentIntentId,
      stripePaymentIntentId: paymentIntentId,
      status: 'succeeded',
      orderType: 'one_time_purchase',
      planId: planId,
      priceId: priceId,
      amountSubtotal: session.amount_subtotal ? (session.amount_subtotal / 100).toString() : null,
      amountDiscount: session.total_details?.amount_discount ? (session.total_details.amount_discount / 100).toString() : '0',
      amountTax: session.total_details?.amount_tax ? (session.total_details.amount_tax / 100).toString() : '0',
      amountTotal: session.amount_total ? (session.amount_total / 100).toString() : '0',
      currency: session.currency || process.env.NEXT_PUBLIC_DEFAULT_CURRENCY || 'usd',
      metadata: {
        stripeCheckoutSessionId: session.id,
        ...session.metadata
      }
    };

    const insertedOrderResults = await db
      .insert(ordersSchema)
      .values(orderData)
      .returning({ id: ordersSchema.id });

    const insertedOrder = insertedOrderResults[0];

    if (!insertedOrder) {
      console.error('Error inserting one-time purchase order');
      throw new Error('Could not insert order');
    }

    // --- [custom] Upgrade the user's benefits ---
    const orderId = insertedOrder.id;
    try {
      await upgradeOneTimeCredits(userId, planId, orderId);
    } catch (error) {
      console.error(`CRITICAL: Failed to upgrade one-time credits for user ${userId}, order ${orderId}:`, error);
      await sendCreditUpgradeFailedEmail({ userId, orderId, planId, error });
      throw error;
    }
    // --- End: [custom] Upgrade the user's benefits ---
  }
}

/**
 * Handles the `invoice.paid` event from Stripe.
 *
 * - Primarily for subscription renewals/payments.
 * - Creates an order record for the invoice.
 * - Grants/Resets subscription credits in the usage table.
 *
 * @param invoice The Stripe Invoice object.
 */
export async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const subscriptionId = typeof invoice.parent?.subscription_details?.subscription === 'string' ? invoice.parent?.subscription_details?.subscription : null;
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : null;
  const invoiceId = invoice.id;

  if (invoice.status !== 'paid' || !subscriptionId || !customerId || !invoiceId || !invoice.billing_reason?.startsWith('subscription')) {
    console.warn(`Invoice ${invoiceId ?? 'N/A'} is not a paid subscription invoice or missing essential IDs. Status: ${invoice.status}, Subscription: ${subscriptionId}, Customer: ${customerId}, Billing Reason: ${invoice.billing_reason}. Skipping.`);
    return;
  }

  /**
   * Idempotency Check
   * 幂等性检查
   * 冪等性チェック
   */
  const existingOrderResults = await db
    .select({ id: ordersSchema.id })
    .from(ordersSchema)
    .where(and(
      eq(ordersSchema.provider, 'stripe'),
      eq(ordersSchema.providerOrderId, invoiceId)
    ))
    .limit(1);

  if (existingOrderResults.length > 0) {
    // order exists, but we still want to sync subscription and potentially grant credits
  } else {

    if (!stripe) {
      console.error('Stripe is not initialized. Please check your environment variables.');
      return;
    }

    let userId: string | null = null;
    let planId: string | null = null;
    let priceId: string | null = null;
    let productId: string | null = null;
    let subscription: Stripe.Subscription | null = null;

    try {
      subscription = await stripe.subscriptions.retrieve(subscriptionId);
      userId = subscription.metadata?.userId;
      // planId = subscription.metadata?.planId;
      if (subscription.items.data.length > 0) {
        priceId = subscription.items.data[0].price.id;
        productId = typeof subscription.items.data[0].price.product === 'string'
          ? subscription.items.data[0].price.product
          : (subscription.items.data[0].price.product as Stripe.Product)?.id;

        if (priceId) {
          const planDataResults = await db
            .select({ id: pricingPlansSchema.id })
            .from(pricingPlansSchema)
            .where(eq(pricingPlansSchema.stripePriceId, priceId))
            .limit(1);
          planId = planDataResults[0]?.id ?? null;
        }
      }

      // fallback
      if (!planId) {
        planId = subscription.metadata?.planId ?? null;
      }

      if (!userId && customerId) {
        const customer = await stripe.customers.retrieve(customerId);
        if (customer && !customer.deleted) {
          userId = customer.metadata?.userId ?? null;
        }
      }
    } catch (subError) {
      console.error(`Error fetching subscription ${subscriptionId} or related data during invoice.paid handling:`, subError);
      if (!userId) {
        throw new Error(`Failed to retrieve subscription ${subscriptionId} and cannot determine userId for invoice ${invoiceId}.`);
      }
      console.warn(`Could not fully populate order details for invoice ${invoiceId} due to error: ${subError instanceof Error ? subError.message : subError}`);
    }

    if (!userId) {
      console.error(`FATAL: User ID could not be determined for invoice ${invoiceId}. Cannot create order.`);
      throw new Error(`User ID determination failed for invoice ${invoiceId}.`);
    }
    if (!planId) {
      console.warn(`Could not determine planId for subscription ${subscriptionId} from invoice ${invoiceId}. Order created, but credit grant may fail.`);
    }

    const invoiceData = await stripe!.invoices.retrieve(invoice.id as string, { expand: ['payments'] });
    const paymentIntentId = invoiceData.payments?.data[0]?.payment.payment_intent as string | null;

    const orderType = invoice.billing_reason === 'subscription_create' ? 'subscription_initial' : 'subscription_renewal';
    const orderData: InferInsertModel<typeof ordersSchema> = {
      userId: userId,
      provider: 'stripe',
      providerOrderId: invoiceId,
      stripePaymentIntentId: paymentIntentId,
      stripeInvoiceId: invoiceId,
      subscriptionId: subscriptionId,
      status: 'succeeded',
      orderType: orderType,
      planId: planId,
      priceId: priceId,
      productId: productId,
      amountSubtotal: (invoice.subtotal / 100).toString(),
      amountDiscount: ((invoice.total_discount_amounts?.reduce((sum, disc) => sum + disc.amount, 0) ?? 0) / 100).toString(),
      amountTax: ((invoice.total_taxes?.reduce((sum, tax) => sum + tax.amount, 0) ?? 0) / 100).toString(),
      amountTotal: (invoice.amount_paid / 100).toString(),
      currency: invoice.currency,
      metadata: {
        stripeInvoiceId: invoice.id,
        stripeSubscriptionId: subscriptionId,
        stripeCustomerId: customerId,
        billingReason: invoice.billing_reason,
        ...(invoice.metadata || {}),
      }
    };

    const insertedOrderResults = await db
      .insert(ordersSchema)
      .values(orderData)
      .returning({ id: ordersSchema.id });
    const insertedOrder = insertedOrderResults[0];

    if (!insertedOrder) {
      console.error(`Error inserting order for invoice ${invoiceId}`);
      throw new Error('Could not insert order');
    }

    if (planId && userId && subscription) {
      // --- [custom] Upgrade ---
      const orderId = insertedOrder.id;
      try {
        await upgradeSubscriptionCredits(userId, planId, orderId, subscription);
      } catch (error) {
        console.error(`CRITICAL: Failed to upgrade subscription credits for user ${userId}, order ${orderId}:`, error);
        await sendCreditUpgradeFailedEmail({ userId, orderId, planId, error });
        throw error;
      }
      // --- End: [custom] Upgrade ---
    } else {
      console.warn(`Cannot grant subscription credits for invoice ${invoiceId} because planId (${planId}) or userId (${userId}) is unknown.`);
    }
  }

  try {
    await syncSubscriptionData(subscriptionId, customerId);
  } catch (syncError) {
    console.error(`Error during post-invoice sync for sub ${subscriptionId}:`, syncError);
  }
}

/**
 * Handles subscription update events (`created`, `updated`, `deleted`).
 * Calls syncSubscriptionData to update the central subscription record in `orders`.
 *
 * @param subscription The Stripe Subscription object.
 */
export async function handleSubscriptionUpdate(subscription: Stripe.Subscription, isDeleted: boolean = false) {
  const customerId = typeof subscription.customer === 'string' ? subscription.customer : null;

  if (!customerId) {
    console.error(`Customer ID missing on subscription object: ${subscription.id}. Cannot sync.`);
    return;
  }

  try {
    await syncSubscriptionData(subscription.id, customerId, subscription.metadata);

    if (isDeleted) {
      // --- [custom] Revoke the user's benefits---
      revokeRemainingSubscriptionCreditsOnEnd(subscription);
      // --- End: [custom] Revoke the user's benefits ---
    }
  } catch (error) {
    console.error(`Error syncing subscription ${subscription.id} during update event:`, error);
    throw error;
  }
}

/**
 * Handles the `invoice.payment_failed` event from Stripe.
 * Calls syncSubscriptionData to update the central subscription record in `orders`.
 *
 * @param invoice The Stripe Invoice object.
 */
export async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = typeof invoice.parent?.subscription_details?.subscription === 'string' ? invoice.parent?.subscription_details?.subscription : null;
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : null;
  const invoiceId = invoice.id;

  if (!subscriptionId || !customerId || !invoiceId) {
    console.warn(`Skipping invoice.payment_failed handler for invoice ${invoiceId ?? 'N/A'}: Could not determine subscriptionId (${subscriptionId}) or customerId (${customerId}).`);
    return;
  }

  // Sync the subscription state (likely becomes 'past_due' or 'unpaid')
  try {
    await syncSubscriptionData(subscriptionId, customerId);
  } catch (syncError) {
    console.error(`Error syncing subscription ${subscriptionId} during invoice.payment_failed handling for invoice ${invoiceId}:`, syncError);
    throw syncError;
  }

  // Send notification email
  try {
    await sendInvoicePaymentFailedEmail({
      invoice,
      subscriptionId,
      customerId,
      invoiceId
    });
  } catch (emailError) {
    console.error(`Error sending payment failed email for invoice ${invoiceId}:`, emailError);
  }
}

/**
 * Handles the `charge.refunded` event.
 *
 * - Creates a refund order record.
 * - Implement logic to revoke credits granted by the original purchase.
 *
 * @param charge The Stripe Charge object (specifically the refunded charge).
 */
export async function handleRefund(charge: Stripe.Charge) {
  if (!charge.refunded) {
    return;
  }

  const chargeId = charge.id;
  const paymentIntentId = charge.payment_intent as string | null;
  const customerId = typeof charge.customer === 'string' ? charge.customer : null;

  if (!chargeId || !paymentIntentId) {
    console.error(`Refund ID missing from refunded charge: ${charge.id}. Cannot process refund fully.`);
    return;
  }
  if (!customerId) {
    console.error(`Customer ID missing from refunded charge: ${charge.id}. Cannot process refund fully.`);
    return;
  }

  const existingRefundOrderResults = await db
    .select({ id: ordersSchema.id })
    .from(ordersSchema)
    .where(and(
      eq(ordersSchema.provider, 'stripe'),
      eq(ordersSchema.providerOrderId, chargeId),
      eq(ordersSchema.orderType, 'refund')
    ))
    .limit(1);

  if (existingRefundOrderResults.length > 0) {
    // already refunded
    return;
  }

  const originalOrderResults = await db
    .select()
    .from(ordersSchema)
    .where(and(
      eq(ordersSchema.provider, 'stripe'),
      eq(ordersSchema.stripePaymentIntentId, paymentIntentId),
      inArray(ordersSchema.orderType, ['one_time_purchase', 'subscription_initial', 'subscription_renewal'])
    ))
    .limit(1);
  const originalOrder = originalOrderResults[0];

  if (!originalOrder) {
    console.error(`Original order for payment intent ${paymentIntentId} not found.`);
    return;
  } else {
    const isFullRefund =
      Math.abs(charge.amount_refunded) === Math.round(parseFloat(originalOrder.amountTotal!) * 100);

    await db
      .update(ordersSchema)
      .set({ status: isFullRefund ? 'refunded' : 'partially_refunded' })
      .where(eq(ordersSchema.id, originalOrder.id));
  }

  if (!stripe) {
    console.error('Stripe is not initialized. Please check your environment variables.');
    return;
  }

  let userId: string | null = null;
  const customer = await stripe.customers.retrieve(customerId);
  if (!(customer as Stripe.DeletedCustomer).deleted) {
    userId = (customer as Stripe.Customer).metadata?.userId ?? null;
  }

  if (!userId) {
    console.error(`Customer ID missing from refunded charge: ${charge.id}. Cannot process refund fully.`);
    return;
  }

  const refundAmount = charge.amount_refunded / 100;
  const refundData: InferInsertModel<typeof ordersSchema> = {
    userId: originalOrder.userId ?? userId,
    provider: 'stripe',
    providerOrderId: chargeId,
    stripePaymentIntentId: paymentIntentId,
    stripeChargeId: chargeId,
    status: 'succeeded',
    orderType: 'refund',
    planId: originalOrder.planId ?? null,
    priceId: null,
    productId: null,
    amountSubtotal: null,
    amountDiscount: null,
    amountTax: null,
    amountTotal: (-refundAmount).toString(),
    currency: charge.currency,
    subscriptionId: null,
    metadata: {
      stripeChargeId: charge.id,
      stripePaymentIntentId: paymentIntentId,
      originalOrderId: originalOrder?.id ?? null,
      refundReason: charge.refunds?.data[0]?.reason,
      ...(charge.metadata || {}),
    }
  };

  const refundOrderResults = await db
    .insert(ordersSchema)
    .values(refundData)
    .returning({ id: ordersSchema.id });
  const refundOrder = refundOrderResults[0];

  if (!refundOrder) {
    throw new Error(`Error inserting refund order for refund ${chargeId}`);
  }

  // --- [custom] Revoke the user's benefits  ---
  if (originalOrder.subscriptionId) {
    revokeSubscriptionCredits(charge, originalOrder);
  } else {
    revokeOneTimeCredits(charge, originalOrder, refundOrder.id);
  }
  // --- End: [custom] Revoke the user's benefits ---
}

/**
 * Handles the `radar.early_fraud_warning.created` event.
 * Initiates a refund for the fraudulent charge.
 *
 * @param warning The Stripe Radar Early Fraud Warning object.
 */
export async function handleEarlyFraudWarningCreated(warning: Stripe.Radar.EarlyFraudWarning) {
  const chargeId = warning.charge;
  if (typeof chargeId !== 'string') {
    console.error('Charge ID missing from early fraud warning:', warning.id);
    return;
  }

  if (!stripe) {
    console.error('Stripe is not initialized. Please check your environment variables.');
    return;
  }

  // Get the configuration from environment variable
  const fraudWarningType = process.env.STRIPE_RADAR_EARLY_FRAUD_WARNING_TYPE?.toLowerCase() || '';
  const actions = fraudWarningType.split(',').map(action => action.trim());

  const shouldRefund = actions.includes('refund');
  const shouldSendEmail = actions.includes('email');

  if (!shouldRefund && !shouldSendEmail) {
    console.warn(`Fraud warning ${warning.id} for charge ${chargeId} detected, but no automatic actions configured. Set STRIPE_RADAR_EARLY_FRAUD_WARNING_TYPE to enable automatic responses.`);
    return;
  }

  try {
    const charge = (await stripe.charges.retrieve(chargeId)) as any;

    if (shouldRefund) {
      if (!charge.refunded) {
        await stripe.refunds.create({
          charge: chargeId,
          reason: 'fraudulent',
        });
        console.log(`Refund for charge ${chargeId}.`);

        // if the charge is a subscription, delete the latest subscription
        if (charge.description?.includes('Subscription')) {
          const customerId = charge.customer as string;
          const subscription = await stripe.subscriptions.list({
            customer: customerId,
            limit: 1,
          });
          const latestSubscription = subscription.data[0] || null;
          if (latestSubscription?.id) {
            await stripe.subscriptions.cancel(latestSubscription.id as string);
            console.log(`Cancelled subscription ${latestSubscription.id} due to fraudulent charge.`);
          }
        }
      } else {
        console.log(`Charge ${chargeId} already refunded.`);
      }
    }

    if (shouldSendEmail) {
      // Send email to admin about fraudulent charge
      const actionsTaken: string[] = [];
      if (shouldRefund) {
        actionsTaken.push('Automatic refund initiated');
        if (charge.description?.includes('Subscription')) {
          actionsTaken.push('Associated subscription cancelled');
        }
      }
      actionsTaken.push('Fraud warning email sent to administrators');

      try {
        await sendFraudWarningAdminEmail({
          warningId: warning.id,
          chargeId: chargeId,
          customerId: charge.customer as string,
          amount: charge.amount / 100,
          currency: charge.currency,
          fraudType: 'Early Fraud Warning',
          chargeDescription: charge.description || undefined,
          actionsTaken,
        });
      } catch (adminEmailError) {
        console.error(`Failed to send fraud warning admin email for charge ${chargeId}:`, adminEmailError);
      }

      // Send email to user about refund (only if refund was processed)
      if (shouldRefund && !charge.refunded) {
        try {
          await sendFraudRefundUserEmail({
            charge,
            refundAmount: charge.amount,
          });
        } catch (userEmailError) {
          console.error(`Failed to send fraud refund user email for charge ${chargeId}:`, userEmailError);
        }
      }
    }
  } catch (error) {
    console.error(`Error handling early fraud warning ${warning.id} for charge ${chargeId}:`, error);
    throw error;
  }
}