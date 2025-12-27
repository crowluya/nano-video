---
inclusion: manual
---

## Overview

This project uses a **provider-agnostic payment architecture** that supports multiple payment providers (Stripe and Creem). The system is built with clear separation of concerns:

- **Provider-agnostic layer**: Unified credit management, webhook helpers, and utility functions
- **Provider-specific layer**: Individual webhook handlers and API clients for each provider

---

## Core Payment Modules

### 1. Credit Management (`lib/payments/credit-manager.ts`)
**Provider-agnostic credit operations** used by all payment providers.

**Key Operations:**
- `upgradeOneTimeCredits(userId, planId, orderId)` — Grant credits for one-time purchases
- `upgradeSubscriptionCredits(userId, planId, orderId, currentPeriodStart)` — Grant/reset subscription credits (handles both monthly and yearly intervals)
- `revokeOneTimeCredits(refundAmountCents, originalOrder, refundOrderId)` — Revoke credits for refunded one-time purchases
- `revokeSubscriptionCredits(originalOrder)` — Revoke credits for refunded subscriptions
- `revokeRemainingSubscriptionCreditsOnEnd(provider, subscriptionId, userId, metadata)` — Revoke remaining credits when subscription ends

**Features:**
- Atomic transactions with retry logic (up to 3 attempts with exponential backoff)
- Credit logs for full audit trail
- Support for both monthly and yearly subscription intervals
- Handles partial and full refunds

### 2. Webhook Helpers (`lib/payments/webhook-helpers.ts`)
**Reusable utilities** for webhook handlers across all providers.

**Currency Conversion:**
- `toCurrencyAmount(cents)` — Convert cents to currency string (e.g., 1000 → "10.00")
- `toCents(amount)` — Convert currency string to cents (e.g., "10.00" → 1000)

**Order Management:**
- `createOrderWithIdempotency(provider, orderData, idempotencyKey)` — Create order with idempotency check to prevent duplicates
- `findOriginalOrderForRefund(provider, paymentIntentId)` — Find original order for refund processing
- `updateOrderStatusAfterRefund(orderId, refundedAmount, originalAmount)` — Update order status ('refunded' or 'partially_refunded')
- `refundOrderExists(provider, refundId)` — Check if refund already processed

### 3. Provider Utilities (`lib/payments/provider-utils.ts`)
**Normalization utilities** to handle provider differences.

**Order Types:**
- Stripe: `subscription_initial`, `subscription_renewal`
- Creem: `recurring`
- Helper: `isSubscriptionOrder(orderType)`, `isOneTimePurchase(orderType)`

**Recurring Intervals:**
- Stripe: `month`, `year`
- Creem: `every-month`, `every-year`
- Helpers: `isMonthlyInterval(interval)`, `isYearlyInterval(interval)`, `normalizeRecurringInterval(interval)`

**Payment Types:**
- One-time: `one_time` (Stripe), `onetime` (Creem)
- Subscription: `recurring` (both)
- Helpers: `isOneTimePaymentType(type)`, `isRecurringPaymentType(type)`

### 4. Common Types (`lib/payments/types.ts`)
- `Order` — Order record from database
- `OrderInsertData` — Order data for insertion
- `CreateOrderResult` — Result of order creation with idempotency flag

---

## Stripe Integration

### Initialization
- Use singleton from `lib/stripe/index.ts`
- Gated by `STRIPE_WEBHOOK_SECRET` and `STRIPE_SECRET_KEY`

### Webhooks
- **Route**: `app/api/stripe/webhook/route.ts`
- **Handlers**: `app/api/stripe/webhook/webhook-handlers.ts`
- **Signature verification**: Uses `STRIPE_WEBHOOK_SECRET`

### Webhook Event Handlers

**`handleCheckoutSessionCompleted(session)`**
- Processes completed checkout sessions for one-time payments
- Creates order records and calls `upgradeOneTimeCredits`
- Subscriptions are handled via `invoice.paid` event

**`handleInvoicePaid(invoice)`**
- Handles paid subscription invoices (initial and renewal)
- Creates order records and calls `upgradeSubscriptionCredits`
- Syncs subscription data to local DB

**`handleSubscriptionUpdate(subscription, isDeleted)`**
- Syncs subscription updates to local DB
- Calls `revokeRemainingSubscriptionCreditsOnEnd` if subscription is deleted

**`handleInvoicePaymentFailed(invoice)`**
- Syncs subscription state (becomes 'past_due' or 'unpaid')
- Sends payment failure notification emails

**`handleRefund(charge)`**
- Processes refunds by creating refund order records
- Calls `revokeOneTimeCredits` or `revokeSubscriptionCredits` based on order type

**`handleEarlyFraudWarningCreated(warning)`**
- Handles fraud warnings based on `STRIPE_RADAR_EARLY_FRAUD_WARNING_TYPE` env variable
- Supports: 'refund', 'email', or 'refund,email'
- Can auto-refund fraudulent charges and cancel associated subscriptions

### Server Actions (`actions/stripe/index.ts`)
- `getOrCreateStripeCustomer(userId)` — Get or create Stripe customer and update `user.stripeCustomerId`
- `createStripePortalSession()` — Create Stripe billing portal session for authenticated users
- `syncSubscriptionData(subscriptionId, customerId, initialMetadata?)` — Sync Stripe subscription to local `subscriptions` table
- Email notification functions: `sendInvoicePaymentFailedEmail`, `sendCreditUpgradeFailedEmail`, `sendFraudWarningAdminEmail`, `sendFraudRefundUserEmail`

### Environment Variables
```
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_CUSTOMER_PORTAL_URL
STRIPE_RADAR_EARLY_FRAUD_WARNING_TYPE  # Optional: 'refund', 'email', or 'refund,email'
```

---

## Creem Integration

### Initialization
- Client functions in `lib/creem/client.ts`
- Gated by `CREEM_API_KEY` and `CREEM_WEBHOOK_SECRET`
- Base URL: `CREEM_API_BASE_URL` (defaults to `https://api.creem.io/v1`)

### API Client (`lib/creem/client.ts`)
- `retrieveCreemCustomer({ email?, customerId? })` — Get customer by email or ID
- `createCreemCheckoutSession(params)` — Create checkout session
- `retrieveCreemCheckoutSession(checkoutId)` — Get checkout session
- `retrieveCreemProduct(productId)` — Get product details
- `retrieveCreemSubscription(subscriptionId)` — Get subscription details
- `createCreemCustomerPortalLink(customerId)` — Create customer portal link
- `retrieveCreemDiscount({ discountId?, discountCode? })` — Get discount details

### Webhooks
- **Route**: `app/api/creem/webhook/route.ts`
- **Handlers**: `app/api/creem/webhook/handlers.ts`
- **Signature verification**: Uses `CREEM_WEBHOOK_SECRET`

### Webhook Event Handlers (`app/api/creem/webhook/handlers.ts`)

**`handleCreemPaymentSucceeded(payload: CreemCheckoutCompletedEvent)`**
- Processes completed checkout sessions for one-time payments only
- Creates order records and calls `upgradeOneTimeCredits`
- Subscription payments are handled via `subscription.paid` event
- Uses `payment.metadata.userId`, `metadata.planId`, and `metadata.productId`

**`handleCreemInvoicePaid(payload: CreemSubscriptionPaidEvent)`**
- Handles paid subscription invoices
- Creates order records and calls `upgradeSubscriptionCredits`
- Syncs subscription data to local DB via `syncCreemSubscriptionData`
- Falls back to DB lookup if planId not in metadata

**`handleCreemSubscriptionUpdated(payload, isDeleted)`**
- Syncs subscription updates to local DB
- Calls `revokeRemainingSubscriptionCreditsOnEnd` if subscription is deleted
- Handles events: `subscription.update`, `subscription.active`, `subscription.expired`, `subscription.canceled`

**`handleCreemPaymentRefunded(payload: CreemRefundCreatedEvent)`**
- Processes refunds by creating refund order records
- Updates original order status ('refunded' or 'partially_refunded')
- Calls `revokeOneTimeCredits` or `revokeSubscriptionCredits` based on order type

### Server Actions

**`actions/creem/index.ts`:**
- `syncCreemSubscriptionData(subscriptionId, initialMetadata?)` — Sync Creem subscription to local `subscriptions` table with upsert logic

**`actions/creem/portal.ts`:**
- `createCreemPortalSession()` — Create Creem customer portal session for authenticated users

### Types (`lib/creem/types.ts`)
Complete TypeScript definitions for Creem API objects:
- `CreemCheckout`, `CreemOrder`, `CreemProduct`, `CreemCustomer`
- `CreemFullSubscription`, `CreemSubscriptionItem`, `CreemTransaction`
- `CreemRefund`, `CreemDiscount`
- Event types: `CreemCheckoutCompletedEvent`, `CreemSubscriptionPaidEvent`, `CreemRefundCreatedEvent`, etc.

### Environment Variables
```
CREEM_API_KEY
CREEM_WEBHOOK_SECRET
CREEM_API_BASE_URL  # Optional: defaults to https://api.creem.io/v1
```

---

## Database Schema

### Orders Table (`orders`)
**Provider-agnostic fields:**
- `id`, `userId`, `provider` ('stripe' | 'creem')
- `providerOrderId` — Unique order ID from provider
- `status`, `orderType`, `planId`, `priceId`, `productId`
- `subscriptionId` — For subscription orders
- `amountSubtotal`, `amountDiscount`, `amountTax`, `amountTotal`, `currency`
- `metadata` — JSONB field for provider-specific data

**Stripe-specific fields:**
- `stripePaymentIntentId`, `stripeInvoiceId`, `stripeChargeId`

### Subscriptions Table (`subscriptions`)
- `userId`, `planId`, `provider` ('stripe' | 'creem')
- `subscriptionId`, `customerId`, `priceId`, `productId`
- `status`, `currentPeriodStart`, `currentPeriodEnd`
- `cancelAtPeriodEnd`, `canceledAt`, `endedAt`
- `trialStart`, `trialEnd`
- `metadata` — JSONB field with provider-specific data

### Pricing Plans Table (`pricingPlans`)
- `id`, `name`, `description`
- `paymentType` — 'one_time', 'onetime', or 'recurring'
- `recurringInterval` — 'month', 'year', 'every-month', 'every-year', 'once'
- `benefitsJsonb` — JSONB field defining plan benefits (e.g., `{ oneTimeCredits: 100, monthlyCredits: 50, totalMonths: 12 }`)
- **Stripe fields**: `stripePriceId`, `stripeProductId`
- **Creem fields**: `creemProductId`

### Usage Table (`usage`)
- `userId`, `oneTimeCreditsBalance`, `subscriptionCreditsBalance`
- `balanceJsonb` — JSONB field storing allocation details:
  - `monthlyAllocationDetails`: { `monthlyCredits`, `relatedOrderId` }
  - `yearlyAllocationDetails`: { `remainingMonths`, `nextCreditDate`, `monthlyCredits`, `lastAllocatedMonth`, `relatedOrderId` }

### Credit Logs Table (`creditLogs`)
- `userId`, `amount`, `type`, `notes`, `relatedOrderId`
- `oneTimeBalanceAfter`, `subscriptionBalanceAfter`
- `createdAt`

---

## Best Practices

### Metadata Usage
Always store `userId` and `planId` in metadata when creating checkout sessions or subscriptions:
- **Stripe**: Pass in `metadata` parameter when creating checkout sessions
- **Creem**: Pass in `metadata` parameter in `createCreemCheckoutSession`
- Fallback to DB lookups by `customerId` if metadata is missing

### Idempotency
- All webhook handlers check for existing records before creating new ones
- Use `createOrderWithIdempotency` to prevent duplicate order creation
- Use `refundOrderExists` to prevent duplicate refund processing

### Error Handling
- Credit operations use retry logic with exponential backoff (3 attempts)
- Log all errors with context (userId, orderId, subscriptionId)
- Send email notifications for critical failures (credit upgrade failures, payment failures, fraud warnings)

### Domain/Protocol Detection
When creating portal sessions or checkout URLs, derive domain/protocol from `headers()`:
```typescript
import { headers } from 'next/headers';
const headersList = headers();
const protocol = headersList.get('x-forwarded-proto') || 'https';
const host = headersList.get('host');
const baseUrl = `${protocol}://${host}`;
// Fallback to process.env.NEXT_PUBLIC_SITE_URL if needed
```

### Subscription vs One-time Purchase
- Check order type or payment type to determine if order is subscription or one-time
- Use helper functions: `isSubscriptionOrder`, `isOneTimePurchase`, `isRecurringPaymentType`

---

## Customization Guide

The system is designed to be customizable for different business models:

### Defining Benefits
- Store benefits in `pricingPlans.benefitsJsonb` field
- Access via dashboard at `/dashboard/prices`
- Example structure:
```json
{
  "oneTimeCredits": 100,      // For one-time purchases
  "monthlyCredits": 50,        // For monthly subscriptions
  "totalMonths": 12,           // For yearly subscriptions
  "customFeature": true        // Custom benefits
}
```

### Implementing Custom Credit Logic
Modify these functions in `lib/payments/credit-manager.ts`:
- `upgradeOneTimeCredits` — One-time purchase benefit grants
- `upgradeSubscriptionCredits` — Subscription benefit grants
- `revokeOneTimeCredits` — One-time purchase benefit revocations
- `revokeSubscriptionCredits` — Subscription benefit revocations

### Adding New Payment Providers
1. Create provider-specific client in `lib/{provider}/client.ts`
2. Create webhook handlers in `app/api/{provider}/webhook/handlers.ts`
3. Create server actions in `actions/{provider}/`
4. Update `lib/payments/provider-utils.ts` with provider-specific constants
5. Add provider to `PaymentProvider` type in DB schema
6. Use existing credit management functions from `lib/payments/credit-manager.ts`

---

## Testing Webhooks

**Stripe:**
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
stripe trigger checkout.session.completed
```

**Creem:**
Use Creem dashboard to configure webhook URL and test events.

---

## Common Issues

### Missing Metadata
If `userId` or `planId` is missing from webhook events:
- Check checkout session creation code
- Ensure metadata is passed correctly
- Fallback logic will attempt DB lookup by `customerId` or `stripeCustomerId`

### Duplicate Orders
If orders are being created multiple times:
- Verify `providerOrderId` is correctly set
- Ensure webhook signature verification is working
- Check `createOrderWithIdempotency` is being used

### Credit Not Granted
If credits are not being granted after payment:
- Check error logs for retry attempts
- Verify plan benefits are correctly defined in `benefitsJsonb`
- Ensure `planId` in metadata matches database records

### Subscription Not Syncing
If subscription data is out of sync:
- Verify webhook endpoints are configured in provider dashboards
- Check webhook signature secrets match environment variables
- Review logs for sync errors in `syncSubscriptionData` or `syncCreemSubscriptionData`
