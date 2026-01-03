# @mobigen/analytics

Analytics SDK for Mobigen generated mobile apps. Track user behavior, screen views, and custom events with automatic batching and offline support.

## Features

- **Auto-tracking**: Screen views, sessions, app lifecycle events
- **Custom events**: Track any custom event with properties
- **User identification**: Identify users and set user properties
- **Offline support**: Events are queued and sent when online
- **Session management**: Automatic session tracking with timeout
- **Plugin system**: Extend with custom analytics providers
- **Type-safe**: Full TypeScript support

## Installation

```bash
npm install @mobigen/analytics
# or
yarn add @mobigen/analytics
# or
pnpm add @mobigen/analytics
```

## Quick Start

### Initialize Analytics

```tsx
import { init } from '@mobigen/analytics';

// Initialize on app start
await init({
  projectId: 'your-project-id',
  apiKey: 'your-api-key',
  debug: __DEV__,
  autoTrack: {
    screens: true,
    sessions: true,
    errors: true,
  },
});
```

### Track Events

```tsx
import { track } from '@mobigen/analytics';

// Track a custom event
track('button_clicked', {
  button_name: 'submit',
  screen: 'checkout',
});

// Track a purchase
track('purchase_completed', {
  order_id: order.id,
  total: order.total,
  items: order.items.length,
});
```

### Track Screen Views

```tsx
import { screen } from '@mobigen/analytics';

// Manually track screen view
screen('Home', { tab: 'featured' });
```

### Identify Users

```tsx
import { identify, setUserProperties } from '@mobigen/analytics';

// Identify user on login
identify('user_123', {
  email: 'user@example.com',
  name: 'John Doe',
  plan: 'premium',
});

// Update user properties
setUserProperties({
  lastPurchase: new Date().toISOString(),
  totalSpent: 299.99,
});
```

## React Integration

### Using the Provider

Wrap your app with `AnalyticsProvider`:

```tsx
import { AnalyticsProvider } from '@mobigen/analytics';

function App() {
  return (
    <AnalyticsProvider
      config={{
        projectId: 'your-project-id',
        apiKey: 'your-api-key',
        debug: __DEV__,
      }}
    >
      <YourApp />
    </AnalyticsProvider>
  );
}
```

### Using Hooks

#### useAnalytics

Access analytics methods in any component:

```tsx
import { useAnalytics } from '@mobigen/analytics';

function MyComponent() {
  const { track, identify, getUserId } = useAnalytics();

  const handlePurchase = () => {
    track('purchase_completed', { total: 99.99 });
  };

  return <Button onPress={handlePurchase}>Buy Now</Button>;
}
```

#### useScreenTracking

Auto-track screen views:

```tsx
import { useScreenTracking } from '@mobigen/analytics';

function HomeScreen() {
  // Track when component mounts
  useScreenTracking('Home', { tab: 'featured' });

  return <View>...</View>;
}
```

#### useEventTracking

Track events with memoization:

```tsx
import { useEventTracking, useTrackedEvent } from '@mobigen/analytics';

function ProductCard({ product }) {
  // Generic event tracking
  const { trackEvent } = useEventTracking();

  // Predefined event tracker
  const trackProductView = useTrackedEvent('product_viewed');

  useEffect(() => {
    trackProductView({ product_id: product.id });
  }, [product.id]);

  return <View>...</View>;
}
```

## Configuration

### AnalyticsConfig

```typescript
interface AnalyticsConfig {
  projectId: string;            // Required: Your Mobigen project ID
  apiKey: string;               // Required: Your analytics API key
  endpoint?: string;            // Optional: Custom endpoint
  autoTrack?: {
    screens?: boolean;          // Auto-track screen views
    taps?: boolean;             // Auto-track taps
    errors?: boolean;           // Auto-track errors
    performance?: boolean;      // Auto-track performance
    sessions?: boolean;         // Auto-track sessions
  };
  debug?: boolean;              // Enable debug logging
  maxQueueSize?: number;        // Max events to queue (default: 1000)
  flushInterval?: number;       // Flush interval in ms (default: 30000)
  maxBatchSize?: number;        // Max events per batch (default: 50)
}
```

## API Reference

### Core Methods

- `init(config)` - Initialize analytics
- `track(eventName, properties?)` - Track custom event
- `screen(screenName, properties?)` - Track screen view
- `identify(userId, traits?)` - Identify user
- `setUserProperties(properties)` - Set user properties
- `reset()` - Reset user identity (logout)
- `flush()` - Force send queued events
- `addPlugin(plugin)` - Add analytics plugin
- `getUserId()` - Get current user ID
- `getAnonymousId()` - Get anonymous ID
- `getSession()` - Get current session

### React Hooks

- `useAnalytics()` - Access analytics methods
- `useScreenTracking(screenName, properties?)` - Auto-track screen
- `useEventTracking()` - Track events with memoization
- `useTrackedEvent(eventName, baseProperties?)` - Create event tracker
- `useAnalyticsContext()` - Access analytics context

## Plugin System

Create custom plugins to extend analytics:

```typescript
import { AnalyticsPlugin, addPlugin } from '@mobigen/analytics';

const customPlugin: AnalyticsPlugin = {
  name: 'MyPlugin',
  track: async (event) => {
    // Send to custom analytics service
    console.log('Track:', event.name, event.properties);
  },
  screen: async (screenName, properties) => {
    console.log('Screen:', screenName);
  },
  identify: async (userId, traits) => {
    console.log('Identify:', userId);
  },
};

addPlugin(customPlugin);
```

## License

MIT
