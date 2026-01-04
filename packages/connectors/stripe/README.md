# @mobigen/connector-stripe

Stripe payment integration connector for Mobigen.

## Overview

This connector enables Stripe payment processing in generated Mobigen mobile apps. It provides:

- ✅ One-time payments
- ✅ Subscription management
- ✅ Payment Sheet integration
- ✅ Webhook support
- ✅ Full TypeScript support
- ✅ Production-ready error handling

## Installation

This connector is automatically installed when you select it from the Mobigen dashboard.

### Manual Installation (for development)

```bash
npm install @mobigen/connector-stripe
```

## Generated Files

When installed, this connector generates the following files in your project:

```
src/
├── services/
│   └── stripe.ts          # Core Stripe service
├── hooks/
│   └── useStripe.ts       # React hooks
└── types/
    └── stripe.ts          # TypeScript types
```

## Configuration

### Required Credentials

You'll need the following from your [Stripe Dashboard](https://dashboard.stripe.com/apikeys):

1. **Publishable Key** (`pk_test_...` or `pk_live_...`)
   - Safe to use in client-side code
   - Used to initialize the Stripe SDK

2. **Secret Key** (`sk_test_...` or `sk_live_...`)
   - Must be kept secure (server-side only)
   - Used for creating payment intents on your backend

3. **Webhook Secret** (Optional, `whsec_...`)
   - Used to verify webhook events from Stripe
   - Get this when you create a webhook endpoint

### Environment Variables

The connector automatically configures these environment variables:

```env
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Usage

### Setup

Wrap your app with the Stripe provider:

```tsx
import { StripePaymentProvider } from './services/stripe';

export default function App() {
  return (
    <StripePaymentProvider>
      <YourApp />
    </StripePaymentProvider>
  );
}
```

### One-Time Payments

```tsx
import { useStripePayment } from './hooks/useStripe';

function CheckoutScreen() {
  const { pay, loading, error } = useStripePayment();

  const handleCheckout = async () => {
    const result = await pay({
      amount: 2999, // $29.99 in cents
      currency: 'usd',
      description: 'Premium subscription',
    });

    if (result.success) {
      Alert.alert('Success', 'Payment completed!');
    }
  };

  return (
    <Button
      title={loading ? 'Processing...' : 'Pay $29.99'}
      onPress={handleCheckout}
      disabled={loading}
    />
  );
}
```

### Subscriptions

```tsx
import { useStripeSubscription } from './hooks/useStripe';

function SubscriptionScreen() {
  const { subscribe, loading, error } = useStripeSubscription();

  const handleSubscribe = async () => {
    const result = await subscribe({
      priceId: 'price_1234567890', // From Stripe Dashboard
      trialPeriodDays: 7,
    });

    if (result.success) {
      Alert.alert('Subscribed!');
    }
  };

  return (
    <Button
      title="Start 7-Day Trial"
      onPress={handleSubscribe}
      disabled={loading}
    />
  );
}
```

### Payment Sheet (Native UI)

```tsx
import { usePaymentSheet } from './hooks/useStripe';

function CheckoutScreen() {
  const { initializePaymentSheet, presentPaymentSheet, loading } = usePaymentSheet();

  const handleCheckout = async () => {
    // Initialize
    const initialized = await initializePaymentSheet({
      amount: 2999,
      currency: 'usd',
    });

    if (!initialized) return;

    // Present the native payment UI
    const result = await presentPaymentSheet();
    if (result.success) {
      Alert.alert('Payment successful!');
    }
  };

  return (
    <Button title="Checkout" onPress={handleCheckout} disabled={loading} />
  );
}
```

## Backend Integration

**Important:** Payment intents must be created on your backend for security.

### Example Backend Endpoint (Node.js)

```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

app.post('/payments/create-intent', async (req, res) => {
  try {
    const { amount, currency, description, metadata } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      description,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Testing

Use Stripe's [test mode](https://stripe.com/docs/testing) for development:

### Test Card Numbers

- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- **3D Secure:** `4000 0025 0000 3155`

Use any future expiry date, any 3-digit CVC, and any ZIP code.

## Security Best Practices

1. **Never expose your secret key** - Only use it server-side
2. **Always create payment intents on your backend** - Prevents amount tampering
3. **Validate webhook signatures** - Use the webhook secret
4. **Use HTTPS** - Always encrypt data in transit
5. **Handle errors gracefully** - Don't expose sensitive error details to users

## Resources

- [Stripe React Native Docs](https://stripe.com/docs/mobile/react-native)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Testing Guide](https://stripe.com/docs/testing)
- [Webhook Guide](https://stripe.com/docs/webhooks)

## Support

For issues specific to this connector, please [open an issue](https://github.com/mobigen/connectors/issues).

For Stripe-specific questions, see [Stripe Support](https://support.stripe.com/).

## License

MIT
