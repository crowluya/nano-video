import { apiResponse } from '@/lib/api-response';
import { getErrorMessage } from '@/lib/error-utils';
import { stripe } from '@/lib/stripe';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { handleCheckoutSessionCompleted, handleEarlyFraudWarningCreated, handleInvoicePaid, handleInvoicePaymentFailed, handleRefund, handleSubscriptionUpdate } from './webhook-handlers';

const relevantEvents = new Set([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.paid',
  'invoice.payment_failed',
  'charge.refunded',
  'radar.early_fraud_warning.created'
]);

export async function POST(req: Request) {
  const body = await req.text();
  const headerPayload = await headers();
  const sig = headerPayload.get('stripe-signature') as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    console.error('Error: Missing stripe-signature or webhook secret.');
    return apiResponse.badRequest('Webhook secret not configured');
  }

  if (!stripe) {
    return apiResponse.serverError('Stripe is not initialized. Please check your environment variables.');
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error(`Error constructing webhook event: ${err.message}`);
    return apiResponse.badRequest(`Webhook Error: ${err.message}`);
  }

  if (relevantEvents.has(event.type)) {
    try {
      await processWebhookEvent(event);
      return apiResponse.success({ received: true });
    } catch (error) {
      console.error(`Error during sync processing for webhook ${event.type}:`, error);
      const errorMessage = getErrorMessage(error);
      return apiResponse.serverError(`Webhook handler failed during sync processing. Error: ${errorMessage}`);
    }
  } else {
    return apiResponse.success({ received: true });
  }
}

async function processWebhookEvent(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;

      if (event.data.object.mode === 'payment') {
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
      }
      break;
    case 'invoice.paid':
      await handleInvoicePaid(event.data.object as Stripe.Invoice);
      break;
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionUpdate(event.data.object as Stripe.Subscription, true);
      break;
    case 'invoice.payment_failed':
      await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
      break;
    case 'charge.refunded':
      await handleRefund(event.data.object as Stripe.Charge);
      break;
    case 'radar.early_fraud_warning.created':
      await handleEarlyFraudWarningCreated(event.data.object as Stripe.Radar.EarlyFraudWarning);
      break;
    default:
      console.warn(`Unhandled relevant event type: ${event.type}`);
  }
} 