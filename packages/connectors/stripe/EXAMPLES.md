# Stripe Connector Examples

Real-world examples of using the Stripe connector in your Mobigen app.

## Table of Contents

- [Setup](#setup)
- [One-Time Payments](#one-time-payments)
- [Subscriptions](#subscriptions)
- [Payment Sheet](#payment-sheet)
- [Error Handling](#error-handling)
- [Backend Examples](#backend-examples)

---

## Setup

### 1. Wrap Your App

```tsx
// App.tsx
import { StripePaymentProvider } from './services/stripe';

export default function App() {
  return (
    <StripePaymentProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </StripePaymentProvider>
  );
}
```

---

## One-Time Payments

### Simple Checkout

```tsx
import { View, Button, Alert, ActivityIndicator } from 'react-native';
import { useStripePayment } from './hooks/useStripe';

function ProductCheckout({ product }) {
  const { pay, loading, error } = useStripePayment();

  const handlePurchase = async () => {
    const result = await pay({
      amount: product.price, // in cents
      currency: 'usd',
      description: product.name,
      metadata: {
        productId: product.id,
        userId: 'user_123',
      },
    });

    if (result.success) {
      Alert.alert('Success!', 'Your purchase is complete');
      // Navigate to confirmation screen
    } else {
      Alert.alert('Payment Failed', result.error || 'Please try again');
    }
  };

  return (
    <View>
      <Button
        title={loading ? 'Processing...' : `Buy for $${product.price / 100}`}
        onPress={handlePurchase}
        disabled={loading}
      />
      {loading && <ActivityIndicator />}
      {error && <Text style={{ color: 'red' }}>{error}</Text>}
    </View>
  );
}
```

### Checkout with Card Input

```tsx
import { CardField, useConfirmPayment } from '@stripe/stripe-react-native';
import { useState } from 'react';
import { createPaymentIntent } from './services/stripe';

function CheckoutForm({ amount, onSuccess }) {
  const { confirmPayment, loading } = useConfirmPayment();
  const [cardComplete, setCardComplete] = useState(false);

  const handlePay = async () => {
    try {
      // Create payment intent on backend
      const clientSecret = await createPaymentIntent({
        amount,
        currency: 'usd',
      });

      // Confirm with Stripe
      const { error, paymentIntent } = await confirmPayment(clientSecret, {
        paymentMethodType: 'Card',
      });

      if (error) {
        Alert.alert('Error', error.message);
      } else if (paymentIntent) {
        onSuccess(paymentIntent);
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  return (
    <View>
      <CardField
        postalCodeEnabled={true}
        placeholder={{
          number: '4242 4242 4242 4242',
        }}
        cardStyle={{
          backgroundColor: '#FFFFFF',
          textColor: '#000000',
        }}
        style={{
          width: '100%',
          height: 50,
          marginVertical: 20,
        }}
        onCardChange={(cardDetails) => {
          setCardComplete(cardDetails.complete);
        }}
      />
      <Button
        title="Pay Now"
        onPress={handlePay}
        disabled={!cardComplete || loading}
      />
    </View>
  );
}
```

---

## Subscriptions

### Basic Subscription

```tsx
import { useStripeSubscription } from './hooks/useStripe';

function SubscriptionScreen() {
  const { subscribe, loading, error } = useStripeSubscription();
  const [subscribed, setSubscribed] = useState(false);

  const plans = [
    { id: 'price_basic', name: 'Basic', price: '$9.99/mo' },
    { id: 'price_pro', name: 'Pro', price: '$19.99/mo' },
    { id: 'price_premium', name: 'Premium', price: '$29.99/mo' },
  ];

  const handleSubscribe = async (priceId: string) => {
    const result = await subscribe({
      priceId,
      trialPeriodDays: 7,
      metadata: {
        userId: 'user_123',
      },
    });

    if (result.success) {
      setSubscribed(true);
      Alert.alert('Success!', 'Your subscription is active');
    }
  };

  return (
    <View>
      {plans.map((plan) => (
        <View key={plan.id} style={styles.planCard}>
          <Text style={styles.planName}>{plan.name}</Text>
          <Text style={styles.planPrice}>{plan.price}</Text>
          <Button
            title="Subscribe"
            onPress={() => handleSubscribe(plan.id)}
            disabled={loading}
          />
        </View>
      ))}
    </View>
  );
}
```

### Subscription Management

```tsx
import { useStripeSubscription } from './hooks/useStripe';

function ManageSubscription({ subscription }) {
  const { unsubscribe, loading } = useStripeSubscription();

  const handleCancel = async () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure? You will lose access at the end of your billing period.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            const result = await unsubscribe(subscription.id);
            if (result.success) {
              Alert.alert('Cancelled', 'Your subscription has been cancelled');
            }
          },
        },
      ]
    );
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Subscription</Text>

      <View style={styles.info}>
        <Text>Status: {subscription.status}</Text>
        <Text>Renews: {formatDate(subscription.currentPeriodEnd)}</Text>
        {subscription.cancelAtPeriodEnd && (
          <Text style={styles.warning}>
            Cancels on {formatDate(subscription.currentPeriodEnd)}
          </Text>
        )}
      </View>

      {!subscription.cancelAtPeriodEnd && (
        <Button
          title="Cancel Subscription"
          onPress={handleCancel}
          disabled={loading}
          color="red"
        />
      )}
    </View>
  );
}
```

---

## Payment Sheet

### Quick Checkout with Payment Sheet

```tsx
import { usePaymentSheet } from './hooks/useStripe';

function QuickCheckout({ amount, onComplete }) {
  const { initializePaymentSheet, presentPaymentSheet, loading } = usePaymentSheet();

  const checkout = async () => {
    // Initialize payment sheet
    const initialized = await initializePaymentSheet({
      amount,
      currency: 'usd',
      description: 'Product purchase',
    });

    if (!initialized) {
      Alert.alert('Error', 'Failed to initialize payment');
      return;
    }

    // Present the payment UI
    const result = await presentPaymentSheet();

    if (result.success) {
      onComplete();
    } else if (result.error) {
      Alert.alert('Payment Failed', result.error);
    }
  };

  return (
    <Button
      title={loading ? 'Processing...' : 'Checkout'}
      onPress={checkout}
      disabled={loading}
    />
  );
}
```

---

## Error Handling

### Comprehensive Error Handling

```tsx
import { useStripePayment } from './hooks/useStripe';

function PaymentScreen({ amount }) {
  const { pay, loading, error, clearError } = useStripePayment();

  const handlePayment = async () => {
    clearError(); // Clear any previous errors

    const result = await pay({
      amount,
      currency: 'usd',
    });

    if (result.success) {
      // Success case
      Alert.alert('Success!', 'Payment completed');
    } else if (result.stripeError) {
      // Handle specific Stripe errors
      const { stripeError } = result;

      switch (stripeError.code) {
        case 'card_declined':
          Alert.alert('Card Declined', 'Your card was declined. Please try another payment method.');
          break;
        case 'insufficient_funds':
          Alert.alert('Insufficient Funds', 'Your card has insufficient funds.');
          break;
        case 'expired_card':
          Alert.alert('Expired Card', 'Your card has expired. Please use a different card.');
          break;
        case 'incorrect_cvc':
          Alert.alert('Incorrect CVC', 'The security code is incorrect.');
          break;
        default:
          Alert.alert('Payment Error', stripeError.message);
      }
    } else {
      // Generic error
      Alert.alert('Error', result.error || 'Payment failed');
    }
  };

  return (
    <View>
      <Button title="Pay" onPress={handlePayment} disabled={loading} />
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button title="Dismiss" onPress={clearError} />
        </View>
      )}
    </View>
  );
}
```

---

## Backend Examples

### Node.js/Express Backend

```typescript
// server.ts
import express from 'express';
import Stripe from 'stripe';

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

app.use(express.json());

// Create payment intent
app.post('/payments/create-intent', async (req, res) => {
  try {
    const { amount, currency, description, metadata, customerId } = req.body;

    // Validate amount
    if (!amount || amount < 50) {
      return res.status(400).json({ error: 'Amount must be at least $0.50' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: currency || 'usd',
      description,
      metadata,
      customer: customerId,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    console.error('Payment intent error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create subscription
app.post('/payments/create-subscription', async (req, res) => {
  try {
    const { customerId, priceId, trialPeriodDays, metadata } = req.body;

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      trial_period_days: trialPeriodDays,
      metadata,
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });

    const invoice = subscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

    res.json({
      subscriptionId: subscription.id,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error: any) {
    console.error('Subscription error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Cancel subscription
app.post('/payments/subscriptions/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;

    const subscription = await stripe.subscriptions.update(id, {
      cancel_at_period_end: true,
    });

    res.json({ subscription });
  } catch (error: any) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Webhook handler
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature']!;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log('PaymentIntent succeeded:', paymentIntent.id);
      // Fulfill order, send confirmation email, etc.
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object as Stripe.PaymentIntent;
      console.log('PaymentIntent failed:', failedPayment.id);
      // Send failure notification
      break;

    case 'customer.subscription.created':
      const subscription = event.data.object as Stripe.Subscription;
      console.log('Subscription created:', subscription.id);
      // Grant access to subscription features
      break;

    case 'customer.subscription.deleted':
      const deletedSub = event.data.object as Stripe.Subscription;
      console.log('Subscription deleted:', deletedSub.id);
      // Revoke access
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### Next.js API Routes

```typescript
// pages/api/payments/create-intent.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, currency, description, metadata } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: currency || 'usd',
      description,
      metadata,
      automatic_payment_methods: { enabled: true },
    });

    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
```

---

## Testing

### Test Card Numbers

Use these test cards in development:

```tsx
// Successful payment
4242 4242 4242 4242

// Declined
4000 0000 0000 0002

// Requires 3D Secure
4000 0025 0000 3155

// Insufficient funds
4000 0000 0000 9995
```

Any future expiration date, any 3-digit CVC, any ZIP code.

### Example Test Component

```tsx
function TestPayment() {
  const { pay } = useStripePayment();

  const testSuccessfulPayment = async () => {
    const result = await pay({
      amount: 1000, // $10.00
      currency: 'usd',
      description: 'Test payment',
    });
    console.log('Result:', result);
  };

  return <Button title="Test Payment" onPress={testSuccessfulPayment} />;
}
```

---

## More Examples

For more examples, see:
- [Stripe React Native Docs](https://stripe.com/docs/mobile/react-native)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
