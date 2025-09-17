import { db } from '@/lib/db';
import {
  creditLogs as creditLogsSchema,
  orders as ordersSchema,
  pricingPlans as pricingPlansSchema,
  usage as usageSchema,
} from '@/lib/db/schema';
import {
  sendCreditUpgradeFailedEmail,
  sendInvoicePaymentFailedEmail,
  syncSubscriptionData,
} from '@/lib/stripe/actions';
import stripe from '@/lib/stripe/stripe';
import { and, eq, inArray, InferInsertModel, sql } from 'drizzle-orm';
import Stripe from 'stripe';

type Order = typeof ordersSchema.$inferSelect;

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

export async function upgradeOneTimeCredits(userId: string, planId: string, orderId: string) {
  // --- TODO: [custom] Upgrade the user's benefits ---
  /**
   * Complete the user's benefit upgrade based on your business logic.
   * We recommend defining benefits in the `benefitsJsonb` field within your pricing plans (accessible in the dashboard at /dashboard/prices). This code upgrades the user's benefits based on those defined benefits.
   * The following code provides an example using `oneTimeCredits`.  Modify the code below according to your specific business logic if you need to upgrade other benefits.
   * 
   * 根据你的业务逻辑，为用户完成权益升级。
   * 我们建议在定价方案的 `benefitsJsonb` 字段中（可在仪表板的 /dashboard/prices 访问）定义权益。此代码会根据定义的权益，为用户完成权益升级。
   * 以下代码以 `oneTimeCredits` 为例。如果你需要升级其他权益，请根据你的具体业务逻辑修改以下代码。
   * 
   * お客様のビジネスロジックに基づいて、ユーザーの特典アップグレードを完了させてください。
   * 特典は、料金プランの `benefitsJsonb` フィールド（ダッシュボードの /dashboard/prices でアクセス可能）で定義することをお勧めします。このコードは、定義された特典に基づいて、ユーザーの特典をアップグレードします。
   * 以下のコードは、`oneTimeCredits` を使用した例です。他の特典をアップグレードする必要がある場合は、お客様のビジネスロジックに従って、以下のコードを修正してください。
   */
  const planDataResults = await db
    .select({ benefitsJsonb: pricingPlansSchema.benefitsJsonb })
    .from(pricingPlansSchema)
    .where(eq(pricingPlansSchema.id, planId))
    .limit(1);
  const planData = planDataResults[0];


  if (!planData) {
    throw new Error(`Could not fetch plan benefits for ${planId}`);
  }

  const creditsToGrant = (planData.benefitsJsonb as any)?.oneTimeCredits || 0;

  if (creditsToGrant && creditsToGrant > 0) {
    let attempts = 0;
    const maxAttempts = 3;
    let lastError: any = null;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        await db.transaction(async (tx) => {
          const updatedUsage = await tx
            .insert(usageSchema)
            .values({
              userId: userId,
              oneTimeCreditsBalance: creditsToGrant,
            })
            .onConflictDoUpdate({
              target: usageSchema.userId,
              set: {
                oneTimeCreditsBalance: sql`${usageSchema.oneTimeCreditsBalance} + ${creditsToGrant}`,
              },
            })
            .returning({
              oneTimeBalanceAfter: usageSchema.oneTimeCreditsBalance,
              subscriptionBalanceAfter: usageSchema.subscriptionCreditsBalance,
            });

          const balances = updatedUsage[0];
          if (!balances) {
            throw new Error('Failed to update usage and get new balances.');
          }

          await tx.insert(creditLogsSchema).values({
            userId: userId,
            amount: creditsToGrant,
            oneTimeBalanceAfter: balances.oneTimeBalanceAfter,
            subscriptionBalanceAfter: balances.subscriptionBalanceAfter,
            type: 'one_time_purchase',
            notes: 'One-time credit purchase',
            relatedOrderId: orderId,
          });
        });
        console.log(`Successfully granted one-time credits for user ${userId} on attempt ${attempts}.`);
        return; // Success, exit the function
      } catch (error) {
        lastError = error;
        console.warn(`Attempt ${attempts} failed for grant one-time credits and log for user ${userId}. Retrying in ${attempts}s...`, (lastError as Error).message);
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, attempts * 1000));
        }
      }
    }

    if (lastError) {
      console.error(`Error updating usage (one-time credits, userId: ${userId}, creditsToGrant: ${creditsToGrant}) after ${maxAttempts} attempts:`, lastError);
      throw lastError;
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
        const planDataResults = await db
          .select({ id: pricingPlansSchema.id })
          .from(pricingPlansSchema)
          .where(eq(pricingPlansSchema.stripePriceId, priceId))
          .limit(1);
        planId = planDataResults[0]?.id ?? null;
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
    const orderData: InferInsertModel<typeof ordersSchema> = {
      userId: userId,
      provider: 'stripe',
      providerOrderId: invoiceId,
      subscriptionProviderId: subscriptionId,
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
      // --- [custom] Upgrade the user's benefits ---
      const orderId = insertedOrder.id;
      try {
        await upgradeSubscriptionCredits(userId, planId, orderId, subscription);
      } catch (error) {
        console.error(`CRITICAL: Failed to upgrade subscription credits for user ${userId}, order ${orderId}:`, error);
        await sendCreditUpgradeFailedEmail({ userId, orderId, planId, error });
        throw error;
      }
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

export async function upgradeSubscriptionCredits(userId: string, planId: string, orderId: string, subscription: Stripe.Subscription) {
  // --- TODO: [custom] Upgrade the user's benefits ---
  /**
   * Complete the user's benefit upgrade based on your business logic.
   * We recommend defining benefits in the `benefitsJsonb` field within your pricing plans (accessible in the dashboard at /dashboard/prices). This code upgrades the user's benefits based on those defined benefits.
   * The following code provides an example using `monthlyCredits`.  Modify the code below according to your specific business logic if you need to upgrade other benefits.
   * 
   * 根据你的业务逻辑，为用户完成权益升级。
   * 我们建议在定价方案的 `benefitsJsonb` 字段中（可在仪表板的 /dashboard/prices 访问）定义权益。此代码会根据定义的权益，为用户完成权益升级。
   * 以下代码以 `monthlyCredits` 为例。如果你需要升级其他权益，请根据你的具体业务逻辑修改以下代码。
   * 
   * お客様のビジネスロジックに基づいて、ユーザーの特典アップグレードを完了させてください。
   * 特典は、料金プランの `benefitsJsonb` フィールド（ダッシュボードの /dashboard/prices でアクセス可能）で定義することをお勧めします。このコードは、定義された特典に基づいて、ユーザーの特典をアップグレードします。
   * 以下のコードは、`monthlyCredits` を使用した例です。他の特典をアップグレードする必要がある場合は、お客様のビジネスロジックに従って、以下のコードを修正してください。
   */
  try {
    const planDataResults = await db
      .select({
        recurringInterval: pricingPlansSchema.recurringInterval,
        benefitsJsonb: pricingPlansSchema.benefitsJsonb
      })
      .from(pricingPlansSchema)
      .where(eq(pricingPlansSchema.id, planId))
      .limit(1);
    const planData = planDataResults[0];

    if (!planData) {
      console.error(`Error fetching plan benefits for planId ${planId} during order ${orderId} processing`);
      throw new Error(`Could not fetch plan benefits for ${planId}`);
    } else {
      const benefits = planData.benefitsJsonb as any;
      const recurringInterval = planData.recurringInterval;

      const creditsToGrant = benefits?.monthlyCredits || 0;

      if (recurringInterval === 'month' && creditsToGrant) {
        let attempts = 0;
        const maxAttempts = 3;
        let lastError: any = null;

        while (attempts < maxAttempts) {
          attempts++;
          try {
            await db.transaction(async (tx) => {
              const monthlyDetails = {
                monthlyAllocationDetails: {
                  monthlyCredits: creditsToGrant,
                }
              };

              const updatedUsage = await tx
                .insert(usageSchema)
                .values({
                  userId: userId,
                  subscriptionCreditsBalance: creditsToGrant,
                  balanceJsonb: monthlyDetails,
                })
                .onConflictDoUpdate({
                  target: usageSchema.userId,
                  set: {
                    subscriptionCreditsBalance: creditsToGrant,
                    balanceJsonb: sql`coalesce(${usageSchema.balanceJsonb}, '{}'::jsonb) - 'monthlyAllocationDetails' || ${JSON.stringify(monthlyDetails)}::jsonb`,
                  },
                })
                .returning({
                  oneTimeBalanceAfter: usageSchema.oneTimeCreditsBalance,
                  subscriptionBalanceAfter: usageSchema.subscriptionCreditsBalance,
                });

              const balances = updatedUsage[0];
              if (!balances) { throw new Error('Failed to update usage for monthly subscription'); }

              await tx.insert(creditLogsSchema).values({
                userId: userId,
                amount: creditsToGrant,
                oneTimeBalanceAfter: balances.oneTimeBalanceAfter,
                subscriptionBalanceAfter: balances.subscriptionBalanceAfter,
                type: 'subscription_grant',
                notes: 'Subscription credits granted/reset',
                relatedOrderId: orderId,
              });
            });
            console.log(`Successfully granted subscription credits for user ${userId} on attempt ${attempts}.`);
            lastError = null;
            break;
          } catch (error) {
            lastError = error;
            console.warn(`Attempt ${attempts} failed for grant subscription credits and log for user ${userId}. Retrying in ${attempts}s...`, (lastError as Error).message);
            if (attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, attempts * 1000));
            }
          }
        }

        if (lastError) {
          console.error(`Error setting subscription credits for user ${userId} (order ${orderId}) after ${maxAttempts} attempts:`, lastError);
          throw lastError;
        }
        return
      }

      if (recurringInterval === 'year' && benefits?.totalMonths && benefits?.monthlyCredits) {
        let attempts = 0;
        const maxAttempts = 3;
        let lastError: any = null;

        while (attempts < maxAttempts) {
          attempts++;
          try {
            await db.transaction(async (tx) => {
              const startDate = new Date(subscription.start_date * 1000);
              const nextCreditDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, startDate.getDate());

              const yearlyDetails = {
                yearlyAllocationDetails: {
                  remainingMonths: benefits.totalMonths - 1,
                  nextCreditDate: nextCreditDate,
                  monthlyCredits: benefits.monthlyCredits,
                  lastAllocatedMonth: `${startDate.getFullYear()}-${(startDate.getMonth() + 1).toString().padStart(2, '0')}`,
                }
              };

              const updatedUsage = await tx
                .insert(usageSchema)
                .values({
                  userId: userId,
                  subscriptionCreditsBalance: benefits.monthlyCredits,
                  balanceJsonb: yearlyDetails,
                })
                .onConflictDoUpdate({
                  target: usageSchema.userId,
                  set: {
                    subscriptionCreditsBalance: benefits.monthlyCredits,
                    balanceJsonb: sql`coalesce(${usageSchema.balanceJsonb}, '{}'::jsonb) - 'yearlyAllocationDetails' || ${JSON.stringify(yearlyDetails)}::jsonb`,
                  }
                })
                .returning({
                  oneTimeBalanceAfter: usageSchema.oneTimeCreditsBalance,
                  subscriptionBalanceAfter: usageSchema.subscriptionCreditsBalance,
                });

              const balances = updatedUsage[0];
              if (!balances) { throw new Error('Failed to update usage for yearly subscription'); }

              await tx.insert(creditLogsSchema).values({
                userId: userId,
                amount: benefits.monthlyCredits,
                oneTimeBalanceAfter: balances.oneTimeBalanceAfter,
                subscriptionBalanceAfter: balances.subscriptionBalanceAfter,
                type: 'subscription_grant',
                notes: 'Yearly plan initial credits granted',
                relatedOrderId: orderId,
              });
            });
            console.log(`Successfully initialized yearly allocation for user ${userId} on attempt ${attempts}.`);
            lastError = null;
            break;
          } catch (error) {
            lastError = error;
            console.warn(`Attempt ${attempts} failed for initialize or reset yearly allocation for user ${userId}. Retrying in ${attempts}s...`, (lastError as Error).message);
            if (attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, attempts * 1000));
            }
          }
        }

        if (lastError) {
          console.error(`Failed to initialize yearly allocation for user ${userId} after ${maxAttempts} attempts:`, lastError);
          throw lastError;
        }
        return
      }

    }
  } catch (creditError) {
    console.error(`Error processing credits for user ${userId} (order ${orderId}):`, creditError);
    throw creditError;
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
    const planDataResults = await db
      .select({ recurringInterval: pricingPlansSchema.recurringInterval })
      .from(pricingPlansSchema)
      .where(eq(pricingPlansSchema.id, planId))
      .limit(1);
    const planData = planDataResults[0];

    if (!planData) {
      console.error(`Error fetching plan benefits for planId ${planId} during subscription ${subscriptionId} cancellation`);
      return;
    }

    let subscriptionToRevoke = 0;
    const recurringInterval = planData.recurringInterval;
    let clearYearly = false;
    let clearMonthly = false;

    const usageDataResults = await db
      .select({ balanceJsonb: usageSchema.balanceJsonb })
      .from(usageSchema)
      .where(eq(usageSchema.userId, userId))
      .limit(1);
    const usageData = usageDataResults[0];

    if (!usageData) {
      console.error(`Error fetching usage data for user ${userId}`);
      return;
    }

    if (recurringInterval === 'year') {
      const yearlyDetails = (usageData.balanceJsonb as any)?.yearlyAllocationDetails;
      subscriptionToRevoke = yearlyDetails?.monthlyCredits
      clearYearly = true;
    } else if (recurringInterval === 'month') {
      const monthlyDetails = (usageData.balanceJsonb as any)?.monthlyAllocationDetails;
      subscriptionToRevoke = monthlyDetails?.monthlyCredits
      clearMonthly = true;
    }

    if (subscriptionToRevoke) {
      try {
        await db.transaction(async (tx) => {
          const usageResults = await tx.select().from(usageSchema).where(eq(usageSchema.userId, userId)).for('update');
          const usage = usageResults[0];

          if (!usage) { return; }

          const newSubBalance = Math.max(0, usage.subscriptionCreditsBalance - subscriptionToRevoke);
          const amountRevoked = usage.subscriptionCreditsBalance - newSubBalance;
          let newBalanceJsonb = usage.balanceJsonb as any;
          if (clearYearly) {
            delete newBalanceJsonb?.yearlyAllocationDetails;
          }
          if (clearMonthly) {
            delete newBalanceJsonb?.monthlyAllocationDetails;
          }

          if (amountRevoked > 0) {
            await tx.update(usageSchema)
              .set({
                subscriptionCreditsBalance: newSubBalance,
                balanceJsonb: newBalanceJsonb,
              })
              .where(eq(usageSchema.userId, userId));

            await tx.insert(creditLogsSchema).values({
              userId: userId,
              amount: -amountRevoked,
              oneTimeBalanceAfter: usage.oneTimeCreditsBalance,
              subscriptionBalanceAfter: newSubBalance,
              type: 'subscription_cancel_revoke',
              notes: `Subscription ${subscriptionId} cancelled/ended.`,
              relatedOrderId: null,
            });
          }
        });
        console.log(`Successfully revoked subscription credits for user ${userId} related to subscription ${subscriptionId} cancellation.`);
      } catch (revokeError) {
        console.error(`Error calling revoke credits and log (subscription) for user ${userId}, subscription ${subscriptionId}:`, revokeError);
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

  const existingRefundOrderResults = await db
    .select({ id: ordersSchema.id })
    .from(ordersSchema)
    .where(and(
      eq(ordersSchema.provider, 'stripe'),
      eq(ordersSchema.providerOrderId, refundId),
      eq(ordersSchema.orderType, 'refund')
    ))
    .limit(1);

  if (existingRefundOrderResults.length > 0) {
    return;
  }

  const originalOrderResults = await db
    .select()
    .from(ordersSchema)
    .where(and(
      eq(ordersSchema.provider, 'stripe'),
      eq(ordersSchema.providerOrderId, paymentIntentId),
      inArray(ordersSchema.orderType, ['one_time_purchase', 'subscription_initial', 'subscription_renewal'])
    ))
    .limit(1);
  const originalOrder = originalOrderResults[0];

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
  const refundData: InferInsertModel<typeof ordersSchema> = {
    userId: originalOrder?.userId ?? userId,
    provider: 'stripe',
    providerOrderId: refundId,
    status: 'succeeded',
    orderType: 'refund',
    planId: originalOrder?.planId ?? null,
    priceId: null,
    productId: null,
    amountSubtotal: null,
    amountDiscount: null,
    amountTax: null,
    amountTotal: (-refundAmount).toString(),
    currency: charge.currency,
    subscriptionProviderId: null,
    metadata: {
      stripeRefundId: refundId,
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
    throw new Error(`Error inserting refund order for refund ${refundId}`);
  }

  // --- [custom] Revoke the user's benefits (only for one time purchase) ---
  if (originalOrder) {
    revokeOneTimeCredits(charge, originalOrder, refundOrder.id);
  }
  // --- End: [custom] Revoke the user's benefits ---
}

export async function revokeOneTimeCredits(charge: Stripe.Charge, originalOrder: Order, refundOrderId: string) {
  // --- TODO: [custom] Revoke the user's one time purchase benefits ---
  /**
   * Complete the user's benefit revoke based on your business logic.
   * We recommend defining benefits in the `benefitsJsonb` field within your pricing plans (accessible in the dashboard at /dashboard/prices). This code revokes the user's benefits based on those defined benefits.
   * The following code provides examples using `oneTimeCredits`.  If you need to revoke other benefits, please modify the code below based on your specific business logic.
   * 
   * 根据你的业务逻辑，取消退款用户的付费权益。
   * 我们建议在定价方案的 `benefitsJsonb` 字段中（可在仪表板的 /dashboard/prices 访问）定义权益。此代码会根据定义的权益，取消退款用户的付费权益。
   * 以下代码以 `oneTimeCredits` 为例。如果你需要取消其他权益，请根据你的具体业务逻辑修改以下代码。
   * 
   * お客様のビジネスロジックに基づいて、ユーザーの特典を取消してください。
   * 特典は、料金プランの `benefitsJsonb` フィールド（ダッシュボードの /dashboard/prices でアクセス可能）で定義することをお勧めします。このコードは、定義された特典に基づいて、ユーザーの特典を取消します。
   * 以下のコードは、`oneTimeCredits` を使用した例です。他の特典を取消する必要がある場合は、お客様のビジネスロジックに従って、以下のコードを修正してください。
   */
  if (originalOrder && originalOrder.userId && originalOrder.planId) {
    const isFullRefund = Math.abs(charge.amount_refunded) === Math.round(parseFloat(originalOrder.amountTotal!) * 100);

    if (isFullRefund) {
      const planDataResults = await db
        .select({ benefitsJsonb: pricingPlansSchema.benefitsJsonb })
        .from(pricingPlansSchema)
        .where(eq(pricingPlansSchema.id, originalOrder.planId))
        .limit(1);
      const planData = planDataResults[0];

      if (!planData) {
        console.error(`Error fetching plan benefits for planId ${originalOrder.planId} during refund ${refundOrderId}:`);
      } else {
        let oneTimeToRevoke = 0;
        const benefits = planData.benefitsJsonb as any;

        if (benefits?.oneTimeCredits > 0) {
          oneTimeToRevoke = benefits.oneTimeCredits;
        }

        if (oneTimeToRevoke > 0) {
          try {
            await db.transaction(async (tx) => {
              const usageResults = await tx.select().from(usageSchema).where(eq(usageSchema.userId, originalOrder.userId)).for('update');
              const usage = usageResults[0];

              if (!usage) { return; }

              const newOneTimeBalance = Math.max(0, usage.oneTimeCreditsBalance - oneTimeToRevoke);
              const amountRevoked = usage.oneTimeCreditsBalance - newOneTimeBalance;

              if (amountRevoked > 0) {
                await tx.update(usageSchema)
                  .set({ oneTimeCreditsBalance: newOneTimeBalance })
                  .where(eq(usageSchema.userId, originalOrder.userId));

                await tx.insert(creditLogsSchema).values({
                  userId: originalOrder.userId,
                  amount: -amountRevoked,
                  oneTimeBalanceAfter: newOneTimeBalance,
                  subscriptionBalanceAfter: usage.subscriptionCreditsBalance,
                  type: 'refund_revoke',
                  notes: `Full refund for order ${originalOrder.id}.`,
                  relatedOrderId: refundOrderId,
                });
              }
            });
            console.log(`Successfully revoked credits for user ${originalOrder.userId} related to refund ${refundOrderId}.`);
          } catch (revokeError) {
            console.error(`Error calling revoke credits and log for user ${originalOrder.userId}, refund ${refundOrderId}:`, revokeError);
          }
        } else {
          console.log(`No credits defined to revoke for plan ${originalOrder.planId}, order type ${originalOrder.orderType} on refund ${refundOrderId}.`);
        }
      }
    } else {
      console.log(`Refund ${charge.id} is not a full refund. Skipping credit revocation. Refunded: ${charge.amount_refunded}, Original Total: ${parseFloat(originalOrder.amountTotal!) * 100}`);
    }
  } else {
    if (!originalOrder) {
      console.warn(`Cannot revoke one-time credits for refund ${refundOrderId} because original order was not found.`);
    } else if (originalOrder.orderType !== 'one_time_purchase') {
      console.log(`Skipping one-time credit revocation for refund ${refundOrderId} as original order type is ${originalOrder.orderType}.`);
    } else {
      console.warn(`Cannot revoke one-time credits for refund ${refundOrderId} due to missing userId or planId on original order ${originalOrder.id}.`);
    }
  }
  // --- End: [custom] Revoke the user's one time purchase benefits ---
}
