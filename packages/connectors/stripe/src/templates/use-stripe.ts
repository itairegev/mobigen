/**
 * Template: Stripe React Hooks
 *
 * Generates React hooks for Stripe payment functionality.
 */

import type { CodeGenContext } from '@mobigen/connectors-core/types';

export function stripeHookTemplate(ctx: CodeGenContext): string {
  const { projectConfig } = ctx;

  return `/**
 * Stripe React Hooks
 *
 * Auto-generated for ${projectConfig.appName}
 * Generated on ${new Date().toISOString()}
 *
 * Custom React hooks for Stripe payment functionality with proper
 * state management and error handling.
 */

import { useState, useCallback } from 'react';
import { useStripe as useStripeNative } from '@stripe/stripe-react-native';
import {
  processPayment,
  createSubscription,
  cancelSubscription,
  type PaymentIntentParams,
  type PaymentResult,
  type SubscriptionParams,
  type SubscriptionResult,
} from '../services/stripe';

// ============================================================================
// useStripePayment Hook
// ============================================================================

export interface UseStripePaymentResult {
  /** Process a payment */
  pay: (params: PaymentIntentParams) => Promise<PaymentResult>;
  /** Whether a payment is in progress */
  loading: boolean;
  /** Error message if payment failed */
  error: string | null;
  /** Clear error state */
  clearError: () => void;
  /** The underlying Stripe instance */
  stripe: ReturnType<typeof useStripeNative>;
}

/**
 * Hook for processing one-time payments
 *
 * @example
 * ```tsx
 * function CheckoutScreen() {
 *   const { pay, loading, error } = useStripePayment();
 *
 *   const handleCheckout = async () => {
 *     const result = await pay({
 *       amount: 2999, // $29.99
 *       currency: 'usd',
 *       description: 'Premium plan',
 *     });
 *
 *     if (result.success) {
 *       Alert.alert('Success', 'Payment completed!');
 *     }
 *   };
 *
 *   return (
 *     <View>
 *       <Button
 *         title="Pay $29.99"
 *         onPress={handleCheckout}
 *         disabled={loading}
 *       />
 *       {error && <Text style={{ color: 'red' }}>{error}</Text>}
 *     </View>
 *   );
 * }
 * ```
 */
export function useStripePayment(): UseStripePaymentResult {
  const stripe = useStripeNative();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pay = useCallback(
    async (params: PaymentIntentParams): Promise<PaymentResult> => {
      setLoading(true);
      setError(null);

      try {
        const result = await processPayment(params, stripe.confirmPayment);

        if (!result.success) {
          setError(result.error || 'Payment failed');
        }

        return result;
      } catch (err: any) {
        const errorMessage = err.message || 'Payment processing failed';
        setError(errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setLoading(false);
      }
    },
    [stripe]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    pay,
    loading,
    error,
    clearError,
    stripe,
  };
}

// ============================================================================
// useStripeSubscription Hook
// ============================================================================

export interface UseStripeSubscriptionResult {
  /** Create a new subscription */
  subscribe: (params: SubscriptionParams) => Promise<SubscriptionResult>;
  /** Cancel an existing subscription */
  unsubscribe: (subscriptionId: string) => Promise<SubscriptionResult>;
  /** Whether an operation is in progress */
  loading: boolean;
  /** Error message if operation failed */
  error: string | null;
  /** Clear error state */
  clearError: () => void;
}

/**
 * Hook for managing subscriptions
 *
 * @example
 * ```tsx
 * function SubscriptionScreen() {
 *   const { subscribe, unsubscribe, loading, error } = useStripeSubscription();
 *   const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
 *
 *   const handleSubscribe = async () => {
 *     const result = await subscribe({
 *       priceId: 'price_1234567890',
 *       trialPeriodDays: 7,
 *     });
 *
 *     if (result.success && result.subscriptionId) {
 *       setSubscriptionId(result.subscriptionId);
 *       Alert.alert('Success', 'Subscription created!');
 *     }
 *   };
 *
 *   const handleCancel = async () => {
 *     if (!subscriptionId) return;
 *
 *     const result = await unsubscribe(subscriptionId);
 *     if (result.success) {
 *       setSubscriptionId(null);
 *       Alert.alert('Cancelled', 'Subscription cancelled');
 *     }
 *   };
 *
 *   return (
 *     <View>
 *       {!subscriptionId ? (
 *         <Button
 *           title="Subscribe"
 *           onPress={handleSubscribe}
 *           disabled={loading}
 *         />
 *       ) : (
 *         <Button
 *           title="Cancel Subscription"
 *           onPress={handleCancel}
 *           disabled={loading}
 *         />
 *       )}
 *       {error && <Text style={{ color: 'red' }}>{error}</Text>}
 *     </View>
 *   );
 * }
 * ```
 */
export function useStripeSubscription(): UseStripeSubscriptionResult {
  const stripe = useStripeNative();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subscribe = useCallback(
    async (params: SubscriptionParams): Promise<SubscriptionResult> => {
      setLoading(true);
      setError(null);

      try {
        // Create subscription on backend
        const clientSecret = await createSubscription(params);

        // Confirm payment method for subscription
        const { error: confirmError, paymentIntent } = await stripe.confirmPayment(
          clientSecret,
          {
            paymentMethodType: 'Card',
          }
        );

        if (confirmError) {
          setError(confirmError.message);
          return {
            success: false,
            error: confirmError.message,
          };
        }

        // Extract subscription ID from payment intent
        // Note: You might need to adjust this based on your backend implementation
        const subscriptionId = paymentIntent?.id;

        return {
          success: true,
          subscriptionId,
        };
      } catch (err: any) {
        const errorMessage = err.message || 'Subscription creation failed';
        setError(errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setLoading(false);
      }
    },
    [stripe]
  );

  const unsubscribe = useCallback(
    async (subscriptionId: string): Promise<SubscriptionResult> => {
      setLoading(true);
      setError(null);

      try {
        const result = await cancelSubscription(subscriptionId);

        if (!result.success) {
          setError(result.error || 'Cancellation failed');
        }

        return result;
      } catch (err: any) {
        const errorMessage = err.message || 'Cancellation failed';
        setError(errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    subscribe,
    unsubscribe,
    loading,
    error,
    clearError,
  };
}

// ============================================================================
// usePaymentSheet Hook
// ============================================================================

export interface UsePaymentSheetResult {
  /** Initialize the payment sheet */
  initializePaymentSheet: (params: PaymentIntentParams) => Promise<boolean>;
  /** Present the payment sheet to the user */
  presentPaymentSheet: () => Promise<PaymentResult>;
  /** Whether the sheet is loading */
  loading: boolean;
  /** Error message */
  error: string | null;
  /** Clear error */
  clearError: () => void;
}

/**
 * Hook for using Stripe Payment Sheet
 *
 * Payment Sheet provides a pre-built, native payment UI.
 *
 * @example
 * ```tsx
 * function CheckoutScreen() {
 *   const { initializePaymentSheet, presentPaymentSheet, loading } = usePaymentSheet();
 *
 *   const handleCheckout = async () => {
 *     // Initialize the payment sheet
 *     const initialized = await initializePaymentSheet({
 *       amount: 2999,
 *       currency: 'usd',
 *     });
 *
 *     if (!initialized) return;
 *
 *     // Present the payment sheet
 *     const result = await presentPaymentSheet();
 *     if (result.success) {
 *       Alert.alert('Success!');
 *     }
 *   };
 *
 *   return <Button title="Checkout" onPress={handleCheckout} disabled={loading} />;
 * }
 * ```
 */
export function usePaymentSheet(): UsePaymentSheetResult {
  const { initPaymentSheet, presentPaymentSheet: presentSheet } = useStripeNative();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initializePaymentSheet = useCallback(
    async (params: PaymentIntentParams): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const clientSecret = await processPayment(params, async () => ({
          error: null as any,
          paymentIntent: null as any,
        }));

        if (!clientSecret.success || !clientSecret.clientSecret) {
          setError(clientSecret.error || 'Failed to initialize');
          return false;
        }

        const { error: initError } = await initPaymentSheet({
          paymentIntentClientSecret: clientSecret.clientSecret,
          merchantDisplayName: '${projectConfig.appName}',
          returnURL: '${projectConfig.bundleIdIos}://stripe-redirect',
        });

        if (initError) {
          setError(initError.message);
          return false;
        }

        return true;
      } catch (err: any) {
        setError(err.message || 'Initialization failed');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [initPaymentSheet]
  );

  const presentPaymentSheet = useCallback(async (): Promise<PaymentResult> => {
    setLoading(true);
    setError(null);

    try {
      const { error: presentError } = await presentSheet();

      if (presentError) {
        setError(presentError.message);
        return {
          success: false,
          error: presentError.message,
        };
      }

      return { success: true };
    } catch (err: any) {
      const errorMessage = err.message || 'Payment failed';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, [presentSheet]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    initializePaymentSheet,
    presentPaymentSheet,
    loading,
    error,
    clearError,
  };
}
`;
}
