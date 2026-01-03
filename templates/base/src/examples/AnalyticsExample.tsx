/**
 * Analytics Usage Examples
 *
 * This file demonstrates how to use Mobigen Analytics in your app.
 * You can copy these patterns into your screens and components.
 */

import { View, Text, Pressable } from 'react-native';
import { useAnalytics, useScreenTracking, useEventTracking, useTrackedEvent } from '@mobigen/analytics';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Example 1: Auto-track screen views
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function ScreenTrackingExample() {
  // Automatically tracks when this screen is viewed
  useScreenTracking('ExampleScreen', { tab: 'main' });

  return (
    <View>
      <Text>This screen view is automatically tracked</Text>
    </View>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Example 2: Track custom events
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function EventTrackingExample() {
  const { trackEvent } = useEventTracking();

  const handlePurchase = async () => {
    // Your purchase logic here...

    // Track the event
    await trackEvent('purchase_completed', {
      orderId: '12345',
      total: 99.99,
      items: 3,
      currency: 'USD',
    });
  };

  return (
    <Pressable onPress={handlePurchase}>
      <Text>Complete Purchase</Text>
    </Pressable>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Example 3: Track repeated events with useTrackedEvent
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function ProductCard({ product }: { product: any }) {
  // Create a tracker for this specific event
  const trackProductView = useTrackedEvent('product_viewed', {
    category: product.category,
  });

  const handlePress = async () => {
    // Track with additional properties
    await trackProductView({
      productId: product.id,
      productName: product.name,
      price: product.price,
    });

    // Navigate to product details...
  };

  return (
    <Pressable onPress={handlePress}>
      <Text>{product.name}</Text>
    </Pressable>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Example 4: User identification (login/signup)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function LoginExample() {
  const { identify, reset } = useAnalytics();

  const handleLogin = async (user: any) => {
    // Your login logic here...

    // Identify the user
    await identify(user.id, {
      email: user.email,
      name: user.name,
      plan: user.plan,
      signupDate: user.signupDate,
    });
  };

  const handleLogout = async () => {
    // Your logout logic here...

    // Reset analytics identity
    await reset();
  };

  return (
    <View>
      <Pressable onPress={() => handleLogin({ id: '123', email: 'user@example.com' })}>
        <Text>Login</Text>
      </Pressable>
      <Pressable onPress={handleLogout}>
        <Text>Logout</Text>
      </Pressable>
    </View>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Example 5: Update user properties
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function UserPropertiesExample() {
  const { setUserProperties } = useAnalytics();

  const handleUpgradePlan = async (newPlan: string) => {
    // Your upgrade logic here...

    // Update user properties
    await setUserProperties({
      plan: newPlan,
      upgradeDate: new Date().toISOString(),
    });
  };

  return (
    <Pressable onPress={() => handleUpgradePlan('premium')}>
      <Text>Upgrade to Premium</Text>
    </Pressable>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Example 6: All analytics methods
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function AllMethodsExample() {
  const analytics = useAnalytics();

  return (
    <View>
      <Text>User ID: {analytics.getUserId() || 'Anonymous'}</Text>
      <Text>Anonymous ID: {analytics.getAnonymousId()}</Text>

      <Pressable onPress={() => analytics.track('button_clicked', { button: 'demo' })}>
        <Text>Track Event</Text>
      </Pressable>

      <Pressable onPress={() => analytics.screen('DemoScreen')}>
        <Text>Track Screen</Text>
      </Pressable>

      <Pressable onPress={() => analytics.identify('user_123', { name: 'John' })}>
        <Text>Identify User</Text>
      </Pressable>

      <Pressable onPress={() => analytics.setUserProperties({ theme: 'dark' })}>
        <Text>Set User Properties</Text>
      </Pressable>

      <Pressable onPress={() => analytics.flush()}>
        <Text>Force Flush Events</Text>
      </Pressable>

      <Pressable onPress={() => analytics.reset()}>
        <Text>Reset (Logout)</Text>
      </Pressable>
    </View>
  );
}
