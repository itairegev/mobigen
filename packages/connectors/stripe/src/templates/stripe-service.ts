/**
 * Template: Stripe Service
 *
 * Generates the main Stripe service file for client apps.
 */

import type { CodeGenContext } from '@mobigen/connectors-core/types';

export function stripeServiceTemplate(ctx: CodeGenContext): string {
  const { projectConfig, env } = ctx;

  return `/**
 * Stripe Payment Service
 *
 * Auto-generated for ${projectConfig.appName}
 * Generated on ${new Date().toISOString()}
 *
 * This service handles Stripe payment processing including:
 * - Payment intents for one-time payments
 * - Subscriptions management
 * - Webhook handling
 *
 * @see https://stripe.com/docs/mobile/react-native
 */

import { StripeProvider, useStripe as useStripeNative } from '@stripe/stripe-react-native';
import type {
  PaymentIntent,
  PaymentMethod,
  Subscription,
  StripeError,
} from './types/stripe';

// ============================================================================
// Configuration
// ============================================================================

/**
 * Stripe publishable key (safe to use in client-side code)
 * Get this from https://dashboard.stripe.com/apikeys
 */
export const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '${env.STRIPE_PUBLISHABLE_KEY}';

/**
 * Your backend API endpoint for creating payment intents
 * The secret key should NEVER be exposed to the client
 */
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.${projectConfig.bundleIdIos}';

// ============================================================================
// Types
// ============================================================================

export interface PaymentIntentParams {
  /** Amount in cents (e.g., 1000 = $10.00) */
  amount: number;
  /** Three-letter ISO currency code (e.g., 'usd', 'eur') */
  currency: string;
  /** Description of the payment */
  description?: string;
  /** Arbitrary metadata to attach to the payment */
  metadata?: Record<string, string>;
  /** Customer ID for saved payment methods */
  customerId?: string;
}

export interface PaymentResult {
  /** Whether the payment succeeded */
  success: boolean;
  /** Payment intent ID if successful */
  paymentIntentId?: string;
  /** Client secret for additional actions */
  clientSecret?: string;
  /** Error message if failed */
  error?: string;
  /** Detailed error from Stripe */
  stripeError?: StripeError;
}

export interface SubscriptionParams {
  /** Price ID from Stripe dashboard */
  priceId: string;
  /** Customer ID */
  customerId?: string;
  /** Trial period in days */
  trialPeriodDays?: number;
  /** Metadata */
  metadata?: Record<string, string>;
}

export interface SubscriptionResult {
  success: boolean;
  subscriptionId?: string;
  error?: string;
}

// ============================================================================
// Backend API Calls
// ============================================================================

/**
 * Create a payment intent on your backend
 *
 * IMPORTANT: Never create payment intents directly from the client.
 * Always use your backend to create payment intents to prevent tampering.
 *
 * @example
 * ```typescript
 * const clientSecret = await createPaymentIntent({
 *   amount: 2999, // $29.99
 *   currency: 'usd',
 *   description: 'Premium subscription',
 * });
 * ```
 */
export async function createPaymentIntent(
  params: PaymentIntentParams
): Promise<string> {
  try {
    const response = await fetch(\`\${API_BASE_URL}/payments/create-intent\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add your authentication header here
        // 'Authorization': \`Bearer \${userToken}\`,
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create payment intent');
    }

    const data = await response.json();
    return data.clientSecret;
  } catch (error: any) {
    console.error('[Stripe] Failed to create payment intent:', error);
    throw new Error(error.message || 'Failed to create payment intent');
  }
}

/**
 * Create a subscription on your backend
 */
export async function createSubscription(
  params: SubscriptionParams
): Promise<string> {
  try {
    const response = await fetch(\`\${API_BASE_URL}/payments/create-subscription\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add your authentication header here
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create subscription');
    }

    const data = await response.json();
    return data.clientSecret;
  } catch (error: any) {
    console.error('[Stripe] Failed to create subscription:', error);
    throw new Error(error.message || 'Failed to create subscription');
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(
  subscriptionId: string
): Promise<SubscriptionResult> {
  try {
    const response = await fetch(
      \`\${API_BASE_URL}/payments/subscriptions/\${subscriptionId}/cancel\`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add your authentication header here
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to cancel subscription');
    }

    return { success: true, subscriptionId };
  } catch (error: any) {
    console.error('[Stripe] Failed to cancel subscription:', error);
    return {
      success: false,
      error: error.message || 'Failed to cancel subscription',
    };
  }
}

// ============================================================================
// Payment Processing
// ============================================================================

/**
 * Process a one-time payment
 *
 * @example
 * ```typescript
 * const stripe = useStripe();
 * const result = await processPayment(
 *   { amount: 2999, currency: 'usd' },
 *   stripe.confirmPayment
 * );
 * ```
 */
export async function processPayment(
  params: PaymentIntentParams,
  confirmPayment: ReturnType<typeof useStripeNative>['confirmPayment']
): Promise<PaymentResult> {
  try {
    // Step 1: Create payment intent on backend
    const clientSecret = await createPaymentIntent(params);

    // Step 2: Confirm payment with Stripe SDK
    const { error, paymentIntent } = await confirmPayment(clientSecret, {
      paymentMethodType: 'Card',
    });

    // Step 3: Handle result
    if (error) {
      return {
        success: false,
        error: error.message,
        stripeError: error as StripeError,
      };
    }

    if (!paymentIntent) {
      return {
        success: false,
        error: 'Payment intent not returned',
      };
    }

    return {
      success: true,
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.clientSecret || undefined,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Payment processing failed',
    };
  }
}

/**
 * Handle webhook events from Stripe
 *
 * This should be implemented on your backend.
 * Use the webhook secret to verify events.
 */
export async function handleWebhook(
  payload: string,
  signature: string
): Promise<void> {
  // This is a backend-only operation
  // Implement webhook handling in your server
  throw new Error('Webhook handling must be done on the backend');
}

// ============================================================================
// Stripe Provider Wrapper
// ============================================================================

/**
 * Wrap your app with this provider to enable Stripe
 *
 * @example
 * ```tsx
 * import { StripePaymentProvider } from './services/stripe';
 *
 * export default function App() {
 *   return (
 *     <StripePaymentProvider>
 *       <YourApp />
 *     </StripePaymentProvider>
 *   );
 * }
 * ```
 */
export function StripePaymentProvider({ children }: { children: React.ReactNode }) {
  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      {children}
    </StripeProvider>
  );
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format amount in cents to display string
 *
 * @example
 * formatAmount(2999, 'USD') // "$29.99"
 */
export function formatAmount(cents: number, currency: string): string {
  const amount = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount);
}

/**
 * Parse amount string to cents
 *
 * @example
 * parseAmount("29.99") // 2999
 */
export function parseAmount(amount: string): number {
  const parsed = parseFloat(amount);
  if (isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
}
`;
}
