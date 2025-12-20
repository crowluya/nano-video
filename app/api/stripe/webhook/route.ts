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
  // #region agent log
  console.log('[Stripe Webhook] POST request received');
  fetch('http://127.0.0.1:7242/ingest/50c3a73e-ed9b-489d-9c57-b43ba19279a7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/stripe/webhook/route.ts:19',message:'Webhook POST received',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'F'})}).catch(()=>{});
  // #endregion
  
  const body = await req.text();
  const headerPayload = await headers();
  const sig = headerPayload.get('stripe-signature') as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // #region agent log
  console.log('[Stripe Webhook] Headers and config:', {
    hasSig: !!sig,
    hasWebhookSecret: !!webhookSecret,
    webhookSecretPrefix: webhookSecret?.substring(0, 10),
  });
  fetch('http://127.0.0.1:7242/ingest/50c3a73e-ed9b-489d-9c57-b43ba19279a7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/stripe/webhook/route.ts:24',message:'Webhook headers check',data:{hasSig:!!sig,hasWebhookSecret:!!webhookSecret,webhookSecretPrefix:webhookSecret?.substring(0,10)},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'F'})}).catch(()=>{});
  // #endregion

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
    
    // #region agent log
    console.log('[Stripe Webhook] Event constructed:', {
      type: event.type,
      id: event.id,
    });
    fetch('http://127.0.0.1:7242/ingest/50c3a73e-ed9b-489d-9c57-b43ba19279a7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/stripe/webhook/route.ts:37',message:'Event constructed',data:{type:event.type,id:event.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
  } catch (err: any) {
    console.error(`Error constructing webhook event: ${err.message}`);
    return apiResponse.badRequest(`Webhook Error: ${err.message}`);
  }

  if (relevantEvents.has(event.type)) {
    // #region agent log
    console.log('[Stripe Webhook] Processing relevant event:', event.type);
    fetch('http://127.0.0.1:7242/ingest/50c3a73e-ed9b-489d-9c57-b43ba19279a7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/stripe/webhook/route.ts:43',message:'Processing relevant event',data:{type:event.type},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    
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
  console.log('debug event', event.type);
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/50c3a73e-ed9b-489d-9c57-b43ba19279a7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/stripe/webhook/route.ts:57',message:'processWebhookEvent called',data:{type:event.type},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'G'})}).catch(()=>{});
  // #endregion

  switch (event.type) {
    case 'checkout.session.completed':
      // #region agent log
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('[Stripe Webhook] checkout.session.completed:', {
        mode: session.mode,
        metadata: session.metadata,
      });
      fetch('http://127.0.0.1:7242/ingest/50c3a73e-ed9b-489d-9c57-b43ba19279a7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/stripe/webhook/route.ts:61',message:'checkout.session.completed',data:{mode:session.mode,metadata:session.metadata},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'G'})}).catch(()=>{});
      // #endregion
      
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