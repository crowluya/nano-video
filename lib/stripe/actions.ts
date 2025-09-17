'use server';

import { sendEmail } from '@/actions/resend';
import { siteConfig } from '@/config/site';
import { CreditUpgradeFailedEmail } from '@/emails/credit-upgrade-failed';
import { InvoicePaymentFailedEmail } from '@/emails/invoice-payment-failed';
import { getSession } from '@/lib/auth/server';
import { db } from '@/lib/db';
import {
  pricingPlans as pricingPlansSchema,
  subscriptions as subscriptionsSchema,
  user as userSchema,
} from '@/lib/db/schema';
import { getErrorMessage } from '@/lib/error-utils';
import stripe from '@/lib/stripe/stripe';
import { eq, InferInsertModel } from 'drizzle-orm';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import Stripe from 'stripe';

export async function getOrCreateStripeCustomer(
  userId: string
): Promise<string> {

  const userProfileResults = await db
    .select({
      stripeCustomerId: userSchema.stripeCustomerId,
      email: userSchema.email,
    })
    .from(userSchema)
    .where(eq(userSchema.id, userId))
    .limit(1);
  const userProfile = userProfileResults[0];

  if (!userProfile) {
    throw new Error(`Could not fetch user profile for ${userId}`);
  }

  if (!stripe) {
    console.error('Stripe is not initialized. Please check your environment variables.');
    throw new Error(`Stripe is not initialized. Please check your environment variables.`);
  }

  if (userProfile?.stripeCustomerId) {
    const customer = await stripe.customers.retrieve(userProfile.stripeCustomerId);
    if (customer && !customer.deleted) {
      return userProfile.stripeCustomerId;
    }
  }

  const userEmail = userProfile?.email
  if (!userEmail) {
    throw new Error(`Could not retrieve email for user ${userId}`);
  }

  try {
    const customer = await stripe.customers.create({
      email: userEmail,
      metadata: {
        userId: userId,
      },
    });

    try {
      await db
        .update(userSchema)
        .set({ stripeCustomerId: customer.id })
        .where(eq(userSchema.id, userId));
    } catch (updateError) {
      console.error('Error updating user profile with Stripe customer ID:', updateError);
      // cleanup in Stripe if this fails critically
      await stripe.customers.del(customer.id);
      throw new Error(`Failed to update user ${userId} with Stripe customer ID ${customer.id}`);
    }

    return customer.id;
  } catch (error) {
    console.error('Error creating Stripe customer or updating database:', error);
    const errorMessage = getErrorMessage(error);
    throw new Error(`Stripe customer creation/update failed: ${errorMessage}`);
  }
}

export async function createStripePortalSession(): Promise<void> {
  const session = await getSession()
  const user = session?.user;

  if (!user) {
    redirect('/login');
  }

  let portalUrl: string | null = null;
  try {
    const profileResults = await db
      .select({ stripeCustomerId: userSchema.stripeCustomerId })
      .from(userSchema)
      .where(eq(userSchema.id, user.id))
      .limit(1);
    const profile = profileResults[0];

    if (!profile?.stripeCustomerId) {
      throw new Error(`Could not find Stripe customer ID`);
    }
    const customerId = profile.stripeCustomerId;

    const headersList = await headers();
    const domain = headersList.get('x-forwarded-host') || headersList.get('host') || process.env.NEXT_PUBLIC_SITE_URL?.replace(/^https?:\/\//, '');
    const protocol = headersList.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http');
    if (!domain) throw new Error("Could not determine domain for return URL.");
    const returnUrl = `${protocol}://${domain}/${process.env.STRIPE_CUSTOMER_PORTAL_URL}`;

    if (!stripe) {
      console.error('Stripe is not initialized. Please check your environment variables.');
      throw new Error(`Stripe is not initialized. Please check your environment variables.`);
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    if (!portalSession.url) {
      throw new Error('Failed to create Stripe portal session (URL missing).');
    }
    portalUrl = portalSession.url;

  } catch (error) {
    console.error('Error preparing Stripe portal session:', error);
    const errorMessage = getErrorMessage(error);
    redirect(`/stripe-error?message=Failed to open subscription management: ${encodeURIComponent(errorMessage)}`);
  }

  if (portalUrl) {
    redirect(portalUrl);
  } else {
    redirect(`/stripe-error?message=Failed to get portal URL after creation attempt.`);
  }
}

/**
 * Fetches the latest subscription data from Stripe and updates/creates the corresponding
 * record in the public.orders table to represent the subscription's state.
 *
 * @param subscriptionId The Stripe Subscription ID (sub_...).
 * @param customerId The Stripe Customer ID (cus_...). Used for logging/context.
 * @param initialMetadata Optional metadata from checkout session for initial sync.
 */
export async function syncSubscriptionData(
  subscriptionId: string,
  customerId: string,
  initialMetadata?: Record<string, any>
): Promise<void> {
  try {
    if (!stripe) {
      console.error('Stripe is not initialized. Please check your environment variables.');
      throw new Error(`Stripe is not initialized. Please check your environment variables.`);
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['default_payment_method', 'customer']
    });

    if (!subscription) {
      throw new Error(`Subscription ${subscriptionId} not found in Stripe.`);
    }
    if (subscription.items.data.length === 0 || !subscription.items.data[0].price) {
      throw new Error(`Subscription ${subscriptionId} is missing line items or price data.`);
    }

    let userId = subscription.metadata?.userId;
    let planId = subscription.metadata?.planId;

    if (!userId && initialMetadata?.userId) {
      userId = initialMetadata.userId;
    }
    if (!planId && initialMetadata?.planId) {
      planId = initialMetadata.planId;
    }

    if (!userId && customerId) {
      try {
        const customer = subscription.customer as Stripe.Customer;

        if (customer && !customer.deleted) {
          userId = customer.metadata?.userId;
        } else {
          console.warn(`Stripe customer ${customerId} is deleted or not found.`);
        }
      } catch (customerError) {
        console.error(`Error fetching Stripe customer ${customerId}:`, customerError);
      }
    }

    if (!userId) {
      console.warn(`User ID still missing for sub ${subscriptionId}. Trying DB lookup via customer ID ${customerId}.`);
      const userProfileResults = await db
        .select({ id: userSchema.id })
        .from(userSchema)
        .where(eq(userSchema.stripeCustomerId, customerId))
        .limit(1);
      const userProfile = userProfileResults[0];


      if (!userProfile) {
        console.error(`DB lookup failed for customer ${customerId}:`);
        throw new Error(`Cannot determine userId for subscription ${subscriptionId}. Critical metadata missing and DB lookup failed.`);
      }
      userId = userProfile.id;
    }
    if (!planId) {
      const priceId = subscription.items.data[0].price.id;
      console.warn(`Plan ID is missing for subscription ${subscriptionId}. Attempting lookup via price ${priceId}.`);
      const planDataResults = await db
        .select({ id: pricingPlansSchema.id })
        .from(pricingPlansSchema)
        .where(eq(pricingPlansSchema.stripePriceId, priceId))
        .limit(1);
      const planData = planDataResults[0];

      if (planData) {
        planId = planData.id;
      } else {
        console.error(`FATAL: Cannot determine planId for subscription ${subscriptionId}. Metadata missing and DB lookup by price failed.`);
        throw new Error(`Cannot determine planId for subscription ${subscriptionId}.`);
      }
    }

    const priceId = subscription.items.data[0]?.price.id;

    type SubscriptionInsert = InferInsertModel<typeof subscriptionsSchema>;
    const subscriptionData: SubscriptionInsert = {
      userId: userId,
      planId: planId,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id,
      priceId: priceId,
      status: subscription.status,
      currentPeriodStart: subscription.items.data[0].current_period_start ? new Date(subscription.items.data[0].current_period_start * 1000) : null,
      currentPeriodEnd: subscription.items.data[0].current_period_end ? new Date(subscription.items.data[0].current_period_end * 1000) : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
      endedAt: subscription.ended_at ? new Date(subscription.ended_at * 1000) : null,
      trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      metadata: {
        ...subscription.metadata,
        ...(initialMetadata && { checkoutSessionMetadata: initialMetadata })
      },
    };

    const { stripeSubscriptionId, ...updateData } = subscriptionData;
    await db
      .insert(subscriptionsSchema)
      .values(subscriptionData)
      .onConflictDoUpdate({
        target: subscriptionsSchema.stripeSubscriptionId,
        set: updateData,
      });


  } catch (error) {
    console.error(`Error in syncSubscriptionData for sub ${subscriptionId}, cust ${customerId}:`, error);
    const errorMessage = getErrorMessage(error);
    throw new Error(`Subscription sync failed (${subscriptionId}): ${errorMessage}`);
  }
}

export async function sendCreditUpgradeFailedEmail({
  userId,
  orderId,
  planId,
  error,
}: {
  userId: string,
  orderId: string,
  planId: string,
  error: any,
}) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.warn('ADMIN_EMAIL is not set, skipping credit upgrade failure email.');
    return;
  }

  const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
  const errorStack = error instanceof Error ? error.stack : undefined;

  try {
    const subject = `🚨 CRITICAL: Credit Upgrade Failed for user ${userId}`;

    await sendEmail({
      email: adminEmail,
      subject,
      react: CreditUpgradeFailedEmail({
        userId,
        orderId,
        planId: planId,
        errorMessage,
        errorStack,
      }),
    });
    console.log(`Sent credit upgrade failure email to ${adminEmail} for order ${orderId}`);
  } catch (emailError) {
    console.error(`Failed to send credit upgrade failure email for order ${orderId}:`, emailError);
  }
}

/**
 * Sends a notification email using the configured email provider (Resend).
 */
export async function sendInvoicePaymentFailedEmail({
  invoice,
  subscriptionId,
  customerId,
  invoiceId
}: {
  invoice: Stripe.Invoice;
  subscriptionId: string;
  customerId: string;
  invoiceId: string
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.error('Resend API Key is not configured. Skipping email send.');
    return;
  }
  if (!process.env.ADMIN_EMAIL) {
    console.error('FROM_EMAIL environment variable is not set. Cannot send email.');
    return;
  }

  if (!stripe) {
    console.error('Stripe is not initialized. Please check your environment variables.');
    throw new Error(`Stripe is not initialized. Please check your environment variables.`);
  }

  let userEmail: string | null = null;
  let planName: string = 'Your Subscription Plan';
  let userId: string | null = null;

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    userId = subscription.metadata?.userId || null;

    if (!userId) {
      const customer = await stripe.customers.retrieve(customerId);
      if (customer && !customer.deleted) {
        userId = customer.metadata?.userId;
      }
    }

    if (!userId) {
      return;
    }

    const userDataResults = await db
      .select({ email: userSchema.email })
      .from(userSchema)
      .where(eq(userSchema.id, userId))
      .limit(1);
    const userData = userDataResults[0];


    if (!userData?.email) {
      console.error(`Error fetching email for user ${userId}:`);
      return
    }

    userEmail = userData.email;

    const planId = subscription.metadata?.planId;
    if (planId) {
      const planDataResults = await db
        .select({ cardTitle: pricingPlansSchema.cardTitle })
        .from(pricingPlansSchema)
        .where(eq(pricingPlansSchema.id, planId))
        .limit(1);
      const planData = planDataResults[0];

      if (planData && planData.cardTitle) {
        planName = planData.cardTitle;
      }
    }

    if (userEmail && userId) {
      const updatePaymentMethodLink = `${process.env.NEXT_PUBLIC_SITE_URL}${process.env.STRIPE_CUSTOMER_PORTAL_URL}`;
      const supportLink = `${process.env.NEXT_PUBLIC_DISCORD_INVITE_URL}`;

      const nextPaymentAttemptTimestamp = invoice.next_payment_attempt;
      const nextPaymentAttemptDate = nextPaymentAttemptTimestamp
        ? new Date(nextPaymentAttemptTimestamp * 1000).toLocaleDateString()
        : undefined;

      const emailProps = {
        invoiceId: invoiceId,
        subscriptionId: subscriptionId,
        planName: planName,
        amountDue: invoice.amount_due / 100,
        currency: invoice.currency,
        nextPaymentAttemptDate: nextPaymentAttemptDate,
        updatePaymentMethodLink: updatePaymentMethodLink,
        supportLink: supportLink,
      };

      try {
        const subject = `Action Required: Payment Failed on ${siteConfig.name}`;

        await sendEmail({
          email: userEmail,
          subject,
          react: await InvoicePaymentFailedEmail(emailProps)
        })
      } catch (emailError) {
        console.error(`Failed to send payment failed email for invoice ${invoiceId} to ${userEmail}:`, emailError);
      }
    }
  } catch (exception) {
    console.error(`Exception occurred while sending email to ${userEmail}:`, exception);
  }
}

