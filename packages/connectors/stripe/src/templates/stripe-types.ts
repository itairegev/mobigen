/**
 * Template: Stripe TypeScript Types
 *
 * Generates TypeScript type definitions for Stripe entities.
 */

import type { CodeGenContext } from '@mobigen/connectors-core/types';

export function stripeTypesTemplate(ctx: CodeGenContext): string {
  const { projectConfig } = ctx;

  return `/**
 * Stripe Type Definitions
 *
 * Auto-generated for ${projectConfig.appName}
 * Generated on ${new Date().toISOString()}
 *
 * TypeScript types for Stripe payment entities.
 * These types mirror the Stripe API objects but simplified for mobile use.
 */

// ============================================================================
// Payment Intent Types
// ============================================================================

export type PaymentIntentStatus =
  | 'requires_payment_method'
  | 'requires_confirmation'
  | 'requires_action'
  | 'processing'
  | 'requires_capture'
  | 'canceled'
  | 'succeeded';

export interface PaymentIntent {
  /** Unique identifier for the payment intent */
  id: string;

  /** Amount to charge in cents */
  amount: number;

  /** Three-letter ISO currency code */
  currency: string;

  /** Current status of the payment */
  status: PaymentIntentStatus;

  /** Client secret for confirming the payment */
  clientSecret: string | null;

  /** Description of the payment */
  description?: string;

  /** Arbitrary metadata */
  metadata?: Record<string, string>;

  /** Payment method used */
  paymentMethod?: string;

  /** Timestamp when created */
  created: number;
}

// ============================================================================
// Payment Method Types
// ============================================================================

export type PaymentMethodType = 'card' | 'bank_account' | 'apple_pay' | 'google_pay';

export interface PaymentMethod {
  /** Unique identifier */
  id: string;

  /** Type of payment method */
  type: PaymentMethodType;

  /** Card details if type is 'card' */
  card?: CardDetails;

  /** Customer ID this payment method is attached to */
  customerId?: string;

  /** Billing details */
  billingDetails?: BillingDetails;

  /** Timestamp when created */
  created: number;
}

export interface CardDetails {
  /** Card brand (visa, mastercard, amex, etc.) */
  brand: string;

  /** Last 4 digits of the card */
  last4: string;

  /** Expiration month (1-12) */
  expMonth: number;

  /** Expiration year */
  expYear: number;

  /** Funding type (credit, debit, prepaid) */
  funding?: 'credit' | 'debit' | 'prepaid' | 'unknown';

  /** Two-letter country code */
  country?: string;
}

export interface BillingDetails {
  /** Customer name */
  name?: string;

  /** Email address */
  email?: string;

  /** Phone number */
  phone?: string;

  /** Billing address */
  address?: Address;
}

export interface Address {
  /** Address line 1 */
  line1?: string;

  /** Address line 2 */
  line2?: string;

  /** City */
  city?: string;

  /** State/Province */
  state?: string;

  /** ZIP or postal code */
  postalCode?: string;

  /** Two-letter country code */
  country?: string;
}

// ============================================================================
// Subscription Types
// ============================================================================

export type SubscriptionStatus =
  | 'incomplete'
  | 'incomplete_expired'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'paused';

export interface Subscription {
  /** Unique identifier */
  id: string;

  /** Customer ID */
  customerId: string;

  /** Current subscription status */
  status: SubscriptionStatus;

  /** Start date timestamp */
  startDate: number;

  /** Current period start */
  currentPeriodStart: number;

  /** Current period end */
  currentPeriodEnd: number;

  /** Whether subscription is set to cancel at period end */
  cancelAtPeriodEnd: boolean;

  /** Timestamp when canceled */
  canceledAt?: number;

  /** Timestamp when subscription ended */
  endedAt?: number;

  /** Trial start date */
  trialStart?: number;

  /** Trial end date */
  trialEnd?: number;

  /** Subscription items */
  items: SubscriptionItem[];

  /** Arbitrary metadata */
  metadata?: Record<string, string>;
}

export interface SubscriptionItem {
  /** Unique identifier */
  id: string;

  /** Price ID */
  priceId: string;

  /** Product ID */
  productId?: string;

  /** Quantity */
  quantity: number;
}

export interface Price {
  /** Unique identifier */
  id: string;

  /** Product this price is for */
  productId: string;

  /** Amount in cents */
  unitAmount: number;

  /** Currency code */
  currency: string;

  /** Billing interval */
  recurring?: {
    interval: 'day' | 'week' | 'month' | 'year';
    intervalCount: number;
  };

  /** Price type */
  type: 'one_time' | 'recurring';

  /** Arbitrary metadata */
  metadata?: Record<string, string>;
}

// ============================================================================
// Customer Types
// ============================================================================

export interface Customer {
  /** Unique identifier */
  id: string;

  /** Customer email */
  email?: string;

  /** Customer name */
  name?: string;

  /** Phone number */
  phone?: string;

  /** Description */
  description?: string;

  /** Default payment method ID */
  defaultPaymentMethod?: string;

  /** Billing address */
  address?: Address;

  /** Arbitrary metadata */
  metadata?: Record<string, string>;

  /** Timestamp when created */
  created: number;
}

// ============================================================================
// Error Types
// ============================================================================

export interface StripeError {
  /** Type of error */
  type:
    | 'api_error'
    | 'card_error'
    | 'invalid_request_error'
    | 'authentication_error'
    | 'rate_limit_error'
    | 'validation_error';

  /** Error code */
  code?:
    | 'card_declined'
    | 'expired_card'
    | 'incorrect_cvc'
    | 'processing_error'
    | 'incorrect_number'
    | 'invalid_expiry_month'
    | 'invalid_expiry_year'
    | 'invalid_cvc'
    | 'insufficient_funds'
    | 'lost_card'
    | 'stolen_card'
    | string;

  /** Decline code for card errors */
  declineCode?: string;

  /** Human-readable error message */
  message: string;

  /** Parameter the error relates to */
  param?: string;

  /** Charge ID if applicable */
  charge?: string;
}

// ============================================================================
// Webhook Event Types
// ============================================================================

export type WebhookEventType =
  | 'payment_intent.succeeded'
  | 'payment_intent.payment_failed'
  | 'payment_intent.canceled'
  | 'customer.subscription.created'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'customer.subscription.trial_will_end'
  | 'invoice.paid'
  | 'invoice.payment_failed'
  | 'charge.succeeded'
  | 'charge.failed'
  | 'charge.refunded';

export interface WebhookEvent {
  /** Event ID */
  id: string;

  /** Event type */
  type: WebhookEventType;

  /** Event data */
  data: {
    object: any;
  };

  /** Timestamp when created */
  created: number;

  /** Whether this is a live or test event */
  livemode: boolean;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Result type for operations that may fail
 */
export interface StripeResult<T> {
  success: boolean;
  data?: T;
  error?: StripeError;
}

/**
 * Options for creating a payment intent
 */
export interface CreatePaymentIntentOptions {
  amount: number;
  currency: string;
  customerId?: string;
  paymentMethodId?: string;
  description?: string;
  metadata?: Record<string, string>;
  captureMethod?: 'automatic' | 'manual';
  setupFutureUsage?: 'on_session' | 'off_session';
}

/**
 * Options for creating a subscription
 */
export interface CreateSubscriptionOptions {
  customerId: string;
  priceId: string;
  quantity?: number;
  trialPeriodDays?: number;
  defaultPaymentMethod?: string;
  metadata?: Record<string, string>;
}
`;
}
