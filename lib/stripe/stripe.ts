import Stripe from 'stripe';

let stripe: Stripe | null = null;

if (process.env.NEXT_PUBLIC_ENABLE_STRIPE === 'true' && process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    // apiVersion: '2025-03-31.basil',
    typescript: true,
  });
} else {
  console.warn('Warning: NEXT_PUBLIC_ENABLE_STRIPE is false, or STRIPE_SECRET_KEY is not set');
}

export default stripe;