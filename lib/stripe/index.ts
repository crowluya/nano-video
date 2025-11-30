import Stripe from 'stripe';

let stripe: Stripe | null = null;

const isStripeEnabled = process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET;

if (isStripeEnabled) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    // apiVersion: '2025-03-31.basil',
    typescript: true,
  });
} else {
  console.warn('Warning: STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET is not set');
}

export { isStripeEnabled, stripe };

