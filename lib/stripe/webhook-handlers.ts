import { sendInvoicePaymentFailedEmail, syncSubscriptionData } from '@/lib/stripe/actions';
import stripe from '@/lib/stripe/stripe';

import { Database, TablesInsert } from '@/lib/supabase/types';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
    const paymentIntentId = session.payment_intent as string;

    if (!paymentIntentId) {
      console.error('Payment Intent ID missing from completed checkout session (mode=payment):', session.id);
      return;
    }

    /**
     * Idempotency Check
     * 幂等性检查
     * 冪等性チェック
     */
    const { data: existingOrder, error: queryError } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('provider', 'stripe')
      .eq('provider_order_id', paymentIntentId)
      .maybeSingle();

    if (queryError) {
      console.error('DB error checking for existing order:', queryError);
      throw queryError;
    }

    if (existingOrder) {
      return;
    }

    const orderData: Database['public']['Tables']['orders']['Insert'] = {
      user_id: userId,
      provider: 'stripe',
      provider_order_id: paymentIntentId,
      status: 'succeeded',
      order_type: 'one_time_purchase',
      plan_id: planId,
      price_id: priceId,
      amount_subtotal: session.amount_subtotal ? session.amount_subtotal / 100 : null,
      amount_discount: session.total_details?.amount_discount ? session.total_details.amount_discount / 100 : 0,
      amount_tax: session.total_details?.amount_tax ? session.total_details.amount_tax / 100 : 0,
      amount_total: session.amount_total ? session.amount_total / 100 : 0,
      currency: session.currency || process.env.NEXT_PUBLIC_DEFAULT_CURRENCY || 'usd',
      metadata: {
        stripeCheckoutSessionId: session.id,
        ...session.metadata
      }
    };

    const { error: insertOrderError } = await supabaseAdmin
      .from('orders')
      .insert(orderData);

    if (insertOrderError) {
      console.error('Error inserting one-time purchase order:', insertOrderError);
      throw insertOrderError;
    }

    // --- [custom] Upgrade the user's benefits ---
    upgradeOneTimeCredits(userId, planId, paymentIntentId);
    // --- End: [custom] Upgrade the user's benefits ---
  }
}

export async function upgradeOneTimeCredits(userId: string, planId: string, paymentIntentId?: string) {
  // --- TODO: [custom] Upgrade the user's benefits ---
  /**
   * Complete the user's benefit upgrade based on your business logic.
   * We recommend defining benefits in the `benefits_jsonb` field within your pricing plans (accessible in the dashboard at /dashboard/prices). This code upgrades the user's benefits based on those defined benefits.
   * The following code provides an example using `one_time_credits`.  Modify the code below according to your specific business logic if you need to upgrade other benefits.
   * 
   * 根据你的业务逻辑，为用户完成权益升级。
   * 我们建议在定价方案的 `benefits_jsonb` 字段中（可在仪表板的 /dashboard/prices 访问）定义权益。此代码会根据定义的权益，为用户完成权益升级。
   * 以下代码以 `one_time_credits` 为例。如果你需要升级其他权益，请根据你的具体业务逻辑修改以下代码。
   * 
   * お客様のビジネスロジックに基づいて、ユーザーの特典アップグレードを完了させてください。
   * 特典は、料金プランの `benefits_jsonb` フィールド（ダッシュボードの /dashboard/prices でアクセス可能）で定義することをお勧めします。このコードは、定義された特典に基づいて、ユーザーの特典をアップグレードします。
   * 以下のコードは、`one_time_credits` を使用した例です。他の特典をアップグレードする必要がある場合は、お客様のビジネスロジックに従って、以下のコードを修正してください。
   */
  const { data: planData, error: planError } = await supabaseAdmin
    .from('pricing_plans')
    .select('benefits_jsonb')
    .eq('id', planId)
    .single();

  if (planError || !planData) {
    console.error(`Error fetching plan benefits for planId ${planId}:`, planError);
    throw new Error(`Could not fetch plan benefits for ${planId}: ${planError?.message}`);
  }

  const creditsToGrant = (planData.benefits_jsonb as any)?.one_time_credits || 0;

  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('id')
    .eq('provider_order_id', paymentIntentId)
    .single();

  const orderId = order?.id;

  if (creditsToGrant && creditsToGrant > 0) {
    const { error: usageError } = await supabaseAdmin.rpc('grant_one_time_credits_and_log', {
      p_user_id: userId,
      p_credits_to_add: creditsToGrant,
      p_related_order_id: orderId,
    });

    if (usageError) {
      console.error(`Error updating usage (one-time credits, user_id: ${userId}, creditsToGrant: ${creditsToGrant}):`, usageError);
      throw new Error(`Failed to grant one-time credits for user ${userId}: ${usageError.message}`);
    }
  } else {
    console.log(`No one-time credits defined or amount is zero for plan ${planId}. Skipping credit grant.`);
  }
  // --- End: [custom] Upgrade the user's benefits ---
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
  const { data: existingOrder, error: queryError } = await supabaseAdmin
    .from('orders')
    .select('id')
    .eq('provider', 'stripe')
    .eq('provider_order_id', invoiceId)
    .maybeSingle();

  if (queryError) {
    console.error('DB error checking for existing invoice order:', queryError);
    throw queryError;
  }

  if (existingOrder) {
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
      planId = subscription.metadata?.planId;
      if (subscription.items.data.length > 0) {
        priceId = subscription.items.data[0].price.id;
        productId = typeof subscription.items.data[0].price.product === 'string'
          ? subscription.items.data[0].price.product
          : (subscription.items.data[0].price.product as Stripe.Product)?.id;
      }

      if (!userId && customerId) {
        const customer = await stripe.customers.retrieve(customerId);
        if (customer && !customer.deleted) {
          userId = customer.metadata?.userId ?? null;
        }
      }

      if (!planId && priceId) {
        const { data: planData } = await supabaseAdmin
          .from('pricing_plans')
          .select('id')
          .eq('stripe_price_id', priceId)
          .maybeSingle();
        planId = planData?.id ?? null;
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

    const orderType = invoice.billing_reason === 'subscription_create' ? 'subscription_initial' : 'subscription_renewal';
    const orderData: TablesInsert<'orders'> = {
      user_id: userId,
      provider: 'stripe',
      provider_order_id: invoiceId,
      subscription_provider_id: subscriptionId,
      status: 'succeeded',
      order_type: orderType,
      plan_id: planId,
      price_id: priceId,
      product_id: productId,
      amount_subtotal: invoice.subtotal / 100,
      amount_discount: (invoice.total_discount_amounts?.reduce((sum, disc) => sum + disc.amount, 0) ?? 0) / 100,
      amount_tax: (invoice.total_taxes?.reduce((sum, tax) => sum + tax.amount, 0) ?? 0) / 100,
      amount_total: invoice.amount_paid / 100,
      currency: invoice.currency,
      metadata: {
        stripeInvoiceId: invoice.id,
        stripeSubscriptionId: subscriptionId,
        stripeCustomerId: customerId,
        billingReason: invoice.billing_reason,
        ...(invoice.metadata || {}),
      }
    };

    const { error: insertOrderError } = await supabaseAdmin
      .from('orders')
      .insert(orderData);

    if (insertOrderError) {
      console.error(`Error inserting order for invoice ${invoiceId}:`, insertOrderError);
      throw insertOrderError;
    }

    if (planId && userId && subscription) {
      // --- [custom] Upgrade the user's benefits ---
      upgradeSubscriptionCredits(userId, planId, invoiceId, subscription);
      // --- End: [custom] Upgrade the user's benefits ---
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

export async function upgradeSubscriptionCredits(userId: string, planId: string, invoiceId: string, subscription: Stripe.Subscription) {
  // --- TODO: [custom] Upgrade the user's benefits ---
  /**
   * Complete the user's benefit upgrade based on your business logic.
   * We recommend defining benefits in the `benefits_jsonb` field within your pricing plans (accessible in the dashboard at /dashboard/prices). This code upgrades the user's benefits based on those defined benefits.
   * The following code provides an example using `monthly_credits`.  Modify the code below according to your specific business logic if you need to upgrade other benefits.
   * 
   * 根据你的业务逻辑，为用户完成权益升级。
   * 我们建议在定价方案的 `benefits_jsonb` 字段中（可在仪表板的 /dashboard/prices 访问）定义权益。此代码会根据定义的权益，为用户完成权益升级。
   * 以下代码以 `monthly_credits` 为例。如果你需要升级其他权益，请根据你的具体业务逻辑修改以下代码。
   * 
   * お客様のビジネスロジックに基づいて、ユーザーの特典アップグレードを完了させてください。
   * 特典は、料金プランの `benefits_jsonb` フィールド（ダッシュボードの /dashboard/prices でアクセス可能）で定義することをお勧めします。このコードは、定義された特典に基づいて、ユーザーの特典をアップグレードします。
   * 以下のコードは、`monthly_credits` を使用した例です。他の特典をアップグレードする必要がある場合は、お客様のビジネスロジックに従って、以下のコードを修正してください。
   */
  try {
    const { data: planData, error: planError } = await supabaseAdmin
      .from('pricing_plans')
      .select('recurring_interval, benefits_jsonb')
      .eq('id', planId)
      .single();

    if (planError || !planData) {
      console.error(`Error fetching plan benefits for planId ${planId} during invoice ${invoiceId} processing:`, planError);
    } else {
      const benefits = planData.benefits_jsonb as any;
      const recurringInterval = planData.recurring_interval;

      const creditsToGrant = benefits?.monthly_credits || 0;

      const { data: order } = await supabaseAdmin
        .from('orders')
        .select('id')
        .eq('provider_order_id', invoiceId)
        .single();

      const orderId = order?.id;

      if (recurringInterval === 'month' && creditsToGrant) {
        const { error: usageError } = await supabaseAdmin.rpc('grant_subscription_credits_and_log', {
          p_user_id: userId,
          p_credits_to_set: creditsToGrant,
          p_related_order_id: orderId,
        });

        if (usageError) {
          console.error(`Error setting subscription credits for user ${userId} (invoice ${invoiceId}):`, usageError);
        }
        return
      }

      if (recurringInterval === 'year' && benefits?.total_months && benefits?.monthly_credits) {
        await supabaseAdmin.rpc('initialize_or_reset_yearly_allocation', {
          p_user_id: userId,
          p_total_months: benefits.total_months,
          p_monthly_credits: benefits.monthly_credits,
          p_subscription_start_date: new Date(subscription.start_date * 1000).toISOString(),
          p_related_order_id: orderId,
        });
        return
      }

    }
  } catch (creditError) {
    console.error(`Error processing credits for user ${userId} (invoice ${invoiceId}):`, creditError);
  }
  // --- End: [custom] Upgrade the user's benefits ---
}

/**
 * Handles subscription update events (`created`, `updated`, `deleted`).
 * Calls syncSubscriptionData to update the central subscription record in `orders`.
 *
 * @param subscription The Stripe Subscription object.
 */
export async function handleSubscriptionUpdate(subscription: Stripe.Subscription, isDeleted: boolean = false) {
  const customerId = typeof subscription.customer === 'string' ? subscription.customer : null;
  const userId = subscription.metadata?.userId;
  const planId = subscription.metadata?.planId;

  if (!customerId) {
    console.error(`Customer ID missing on subscription object: ${subscription.id}. Cannot sync.`);
    return;
  }

  try {
    await syncSubscriptionData(subscription.id, customerId, subscription.metadata);

    if (isDeleted && userId && planId) {
      // --- [custom] Revoke the user's benefits (only for one time purchase) ---
      revokeSubscriptionCredits(userId, planId, subscription.id);
      // --- End: [custom] Revoke the user's benefits ---
    }
  } catch (error) {
    console.error(`Error syncing subscription ${subscription.id} during update event:`, error);
    throw error;
  }
}

export async function revokeSubscriptionCredits(userId: string, planId: string, subscriptionId: string) {
  // --- TODO: [custom] Revoke the user's subscription benefits ---
  /**
   * Complete the user's subscription benefit revocation based on your business logic.
   * This function is triggered when a subscription is canceled ('customer.subscription.deleted').
   * 
   * 根据你的业务逻辑，取消用户的订阅权益。
   * 此函数在订阅被取消时 ('customer.subscription.deleted') 触发。
   *
   * お客様のビジネスロジックに基づいて、ユーザーのサブスクリプション特典を取消してください。
   * この関数は、サブスクリプションがキャンセルされたとき ('customer.subscription.deleted') にトリガーされます。
   */
  try {
    const { data: planData, error: planError } = await supabaseAdmin
      .from('pricing_plans')
      .select('recurring_interval')
      .eq('id', planId)
      .single();

    if (planError || !planData) {
      console.error(`Error fetching plan benefits for planId ${planId} during subscription ${subscriptionId} cancellation:`, planError);
      return;
    }

    let subscriptionToRevoke = 0;
    const recurringInterval = planData.recurring_interval;
    let clearYearly = false;
    let clearMonthly = false;

    const { data: usageData, error: usageError } = await supabaseAdmin
      .from('usage')
      .select('balance_jsonb')
      .eq('user_id', userId)
      .single();

    if (usageError) {
      console.error(`Error fetching usage data for user ${userId}:`, usageError);
      return;
    }

    if (recurringInterval === 'year') {
      const yearlyDetails = usageData.balance_jsonb?.yearly_allocation_details;
      subscriptionToRevoke = yearlyDetails?.monthly_credits
      clearYearly = true;
    } else if (recurringInterval === 'month') {
      const monthlyDetails = usageData.balance_jsonb?.monthly_allocation_details;
      subscriptionToRevoke = monthlyDetails?.monthly_credits
      clearMonthly = true;
    }

    if (subscriptionToRevoke) {
      const { data: revokeResult, error: revokeError } = await supabaseAdmin.rpc('revoke_credits_and_log', {
        p_user_id: userId,
        p_revoke_one_time: 0,
        p_revoke_subscription: subscriptionToRevoke,
        p_log_type: 'subscription_cancel_revoke',
        p_notes: `Subscription ${subscriptionId} cancelled/ended.`,
        p_related_order_id: null,
        p_clear_yearly_details: clearYearly,
        p_clear_monthly_details: clearMonthly
      });

      if (revokeError) {
        console.error(`Error calling revoke_credits_and_log RPC (subscription) for user ${userId}, subscription ${subscriptionId}:`, revokeError);
      } else {
        console.log(`Successfully revoked subscription credits for user ${userId} related to subscription ${subscriptionId} cancellation.`);
      }
    }
  } catch (error) {
    console.error(`Error during revokeSubscriptionCredits for user ${userId}, subscription ${subscriptionId}:`, error);
  }
  // --- End: [custom] Revoke the user's subscription benefits ---
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

  const refundId = charge.id;
  const paymentIntentId = charge.payment_intent as string | null;
  const customerId = typeof charge.customer === 'string' ? charge.customer : null;

  if (!refundId || !paymentIntentId) {
    console.error(`Refund ID missing from refunded charge: ${charge.id}. Cannot process refund fully.`);
    return;
  }
  if (!customerId) {
    console.error(`Customer ID missing from refunded charge: ${charge.id}. Cannot process refund fully.`);
    return;
  }

  const { data: existingRefundOrder, error: queryError } = await supabaseAdmin
    .from('orders')
    .select('id')
    .eq('provider', 'stripe')
    .eq('provider_order_id', refundId)
    .eq('order_type', 'refund')
    .maybeSingle();

  if (queryError) {
    console.error('DB error checking for existing refund order:', queryError);
    throw queryError;
  }

  if (existingRefundOrder) {
    return;
  }

  const { data: originalOrder, error: originalOrderError } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('provider', 'stripe')
    .eq('provider_order_id', paymentIntentId)
    .in('order_type', ['one_time_purchase', 'subscription_initial', 'subscription_renewal'])
    .maybeSingle();

  if (originalOrderError) {
    console.error(`DB error fetching original order for PI ${paymentIntentId}:`, originalOrderError);
    throw originalOrderError;
  }

  if (!originalOrder) {
    // The invoice.paid event triggered by a subscription is recorded with invoice_id, not payment_intentId, so the revoke credits logic for the subscription will not be triggered in handleRefund.
    console.warn(`Original order for payment intent ${paymentIntentId} not found. Subscription will not be revoked.`);
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
  const refundData: Database['public']['Tables']['orders']['Insert'] = {
    user_id: originalOrder?.user_id ?? userId,
    provider: 'stripe',
    provider_order_id: refundId,
    status: 'succeeded',
    order_type: 'refund',
    plan_id: originalOrder?.plan_id ?? null,
    price_id: null,
    product_id: null,
    amount_subtotal: null,
    amount_discount: null,
    amount_tax: null,
    amount_total: -refundAmount,
    currency: charge.currency,
    subscription_provider_id: null,
    metadata: {
      stripeRefundId: refundId,
      stripeChargeId: charge.id,
      stripePaymentIntentId: paymentIntentId,
      originalOrderId: originalOrder?.id ?? null,
      refundReason: charge.refunds?.data[0]?.reason,
      ...(charge.metadata || {}),
    }
  };

  const { data: refundOrder, error: insertRefundError } = await supabaseAdmin
    .from('orders')
    .insert(refundData)
    .select('id')
    .single();

  if (insertRefundError) {
    console.error(`Error inserting refund order for refund ${refundId}:`, insertRefundError);
    throw insertRefundError;
  }

  // --- [custom] Revoke the user's benefits (only for one time purchase) ---
  if (originalOrder) {
    revokeOneTimeCredits(charge, originalOrder, refundOrder?.id ?? null);
  }
  // --- End: [custom] Revoke the user's benefits ---
}

export async function revokeOneTimeCredits(charge: Stripe.Charge, originalOrder: Database['public']['Tables']['orders']['Row'], refundOrderId: string) {
  // --- TODO: [custom] Revoke the user's one time purchase benefits ---
  /**
   * Complete the user's benefit revoke based on your business logic.
   * We recommend defining benefits in the `benefits_jsonb` field within your pricing plans (accessible in the dashboard at /dashboard/prices). This code revokes the user's benefits based on those defined benefits.
   * The following code provides examples using `one_time_credits`.  If you need to revoke other benefits, please modify the code below based on your specific business logic.
   * 
   * 根据你的业务逻辑，取消退款用户的付费权益。
   * 我们建议在定价方案的 `benefits_jsonb` 字段中（可在仪表板的 /dashboard/prices 访问）定义权益。此代码会根据定义的权益，取消退款用户的付费权益。
   * 以下代码以 `one_time_credits` 为例。如果你需要取消其他权益，请根据你的具体业务逻辑修改以下代码。
   * 
   * お客様のビジネスロジックに基づいて、ユーザーの特典を取消してください。
   * 特典は、料金プランの `benefits_jsonb` フィールド（ダッシュボードの /dashboard/prices でアクセス可能）で定義することをお勧めします。このコードは、定義された特典に基づいて、ユーザーの特典を取消します。
   * 以下のコードは、`one_time_credits` を使用した例です。他の特典を取消する必要がある場合は、お客様のビジネスロジックに従って、以下のコードを修正してください。
   */
  if (originalOrder && originalOrder.user_id && originalOrder.plan_id) {
    const isFullRefund = Math.abs(charge.amount_refunded) === Math.round(originalOrder.amount_total * 100);

    if (isFullRefund) {
      const { data: planData, error: planError } = await supabaseAdmin
        .from('pricing_plans')
        .select('benefits_jsonb')
        .eq('id', originalOrder.plan_id)
        .single();

      if (planError || !planData) {
        console.error(`Error fetching plan benefits for planId ${originalOrder.plan_id} during refund ${refundOrderId}:`, planError);
      } else {
        let oneTimeToRevoke = 0;
        const benefits = planData.benefits_jsonb as any;

        if (benefits?.one_time_credits > 0) {
          oneTimeToRevoke = benefits.one_time_credits;
        }

        if (oneTimeToRevoke > 0) {
          const { data: revokeResult, error: revokeError } = await supabaseAdmin.rpc('revoke_credits_and_log', {
            p_user_id: originalOrder.user_id,
            p_revoke_one_time: oneTimeToRevoke,
            p_revoke_subscription: 0,
            p_log_type: 'refund_revoke',
            p_notes: `Full refund for order ${originalOrder.id}.`,
            p_related_order_id: refundOrderId,
            p_clear_yearly_details: false,
            p_clear_monthly_details: false
          });

          if (revokeError) {
            console.error(`Error calling revoke_credits_and_log RPC for user ${originalOrder.user_id}, refund ${refundOrderId}:`, revokeError);
          } else {
            console.log(`Successfully revoked credits for user ${originalOrder.user_id} related to refund ${refundOrderId}.`);
          }
        } else {
          console.log(`No credits defined to revoke for plan ${originalOrder.plan_id}, order type ${originalOrder.order_type} on refund ${refundOrderId}.`);
        }
      }
    } else {
      console.log(`Refund ${charge.id} is not a full refund. Skipping credit revocation. Refunded: ${charge.amount_refunded}, Original Total: ${originalOrder.amount_total * 100}`);
    }
  } else {
    if (!originalOrder) {
      console.warn(`Cannot revoke one-time credits for refund ${refundOrderId} because original order was not found.`);
    } else if (originalOrder.order_type !== 'one_time_purchase') {
      console.log(`Skipping one-time credit revocation for refund ${refundOrderId} as original order type is ${originalOrder.order_type}.`);
    } else {
      console.warn(`Cannot revoke one-time credits for refund ${refundOrderId} due to missing user_id or plan_id on original order ${originalOrder.id}.`);
    }
  }
  // --- End: [custom] Revoke the user's one time purchase benefits ---
}
