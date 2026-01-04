# OneSignal Connector for Mobigen

Push notifications, in-app messaging, and user engagement connector.

## Overview

The OneSignal connector integrates push notifications and in-app messaging into your Mobigen-generated app with a single click.

## Features

- **Push Notifications** - Send notifications to iOS and Android devices
- **In-App Messages** - Display messages while users are active
- **User Segmentation** - Target users with tags and triggers
- **External User ID** - Link OneSignal to your user system
- **Permission Management** - Handle iOS/Android permission flows
- **Notification Handlers** - React to notification taps and receives
- **Device State** - Track subscription status and push tokens

## Installation

This connector is automatically configured when installed through the Mobigen dashboard.

### Required Credentials

1. **OneSignal App ID** (required)
   - Format: UUID (e.g., `12345678-1234-1234-1234-123456789012`)
   - Get it from: [OneSignal Dashboard](https://app.onesignal.com) → Settings → Keys & IDs

2. **REST API Key** (optional)
   - Required only for server-side operations
   - Get it from: [OneSignal Dashboard](https://app.onesignal.com) → Settings → Keys & IDs

## Usage

### Initialize OneSignal

Wrap your app with the `OneSignalProvider`:

\`\`\`tsx
import { OneSignalProvider } from './providers/OneSignalProvider';

export default function App() {
  return (
    <OneSignalProvider
      autoPromptForPermission={true}
      logLevel={5}
      onInitialized={() => console.log('OneSignal ready!')}
    >
      <YourApp />
    </OneSignalProvider>
  );
}
\`\`\`

### Request Push Permission

\`\`\`tsx
import { usePushPermission } from './hooks/useOneSignal';

function SettingsScreen() {
  const { hasPermission, requestPermission, isRequesting } = usePushPermission();

  return (
    <View>
      <Text>Push Notifications: {hasPermission ? 'Enabled' : 'Disabled'}</Text>
      {!hasPermission && (
        <Button
          title="Enable Notifications"
          onPress={() => requestPermission(true)}
          disabled={isRequesting}
        />
      )}
    </View>
  );
}
\`\`\`

### Link User After Login

\`\`\`tsx
import { useOneSignal } from './hooks/useOneSignal';

function LoginScreen() {
  const { loginUser } = useOneSignal();

  async function handleLogin(email: string, password: string) {
    const user = await yourLoginFunction(email, password);

    // Link OneSignal to your user ID
    await loginUser(user.id);
  }

  return (
    <LoginForm onSubmit={handleLogin} />
  );
}
\`\`\`

### Handle Notification Taps

\`\`\`tsx
import { useNotificationHandler } from './hooks/useOneSignal';
import { useNavigation } from '@react-navigation/native';

function App() {
  const navigation = useNavigation();

  useNotificationHandler({
    onNotificationOpened: (notification) => {
      console.log('Notification tapped:', notification);

      // Navigate based on notification data
      if (notification.notification.additionalData?.screen) {
        navigation.navigate(notification.notification.additionalData.screen);
      }
    },
    onNotificationReceived: (notification) => {
      console.log('Notification received in foreground:', notification);

      // Return true to show, false to hide
      return true;
    },
  });

  return <YourApp />;
}
\`\`\`

### User Segmentation with Tags

\`\`\`tsx
import { useTags } from './hooks/useOneSignal';

function ProfileScreen() {
  const { addTag, removeTag, setMultipleTags } = useTags();

  function handlePreferenceChange(preference: string, value: boolean) {
    if (value) {
      addTag(preference, 'true');
    } else {
      removeTag(preference);
    }
  }

  // Or set multiple tags at once
  function updateUserSegments(segments: string[]) {
    const tags = segments.reduce((acc, segment) => {
      acc[segment] = 'true';
      return acc;
    }, {} as Record<string, string>);

    setMultipleTags(tags);
  }

  return (
    <View>
      <Switch
        value={true}
        onValueChange={(val) => handlePreferenceChange('premium_user', val)}
      />
    </View>
  );
}
\`\`\`

### Trigger In-App Messages

\`\`\`tsx
import { useInAppMessages } from './hooks/useOneSignal';

function CheckoutScreen() {
  const { setTrigger } = useInAppMessages();

  function handleCheckoutComplete(orderId: string, total: number) {
    // Trigger in-app message configured in OneSignal dashboard
    setTrigger('purchase_completed', true);
    setTrigger('order_total', total);
  }

  return <CheckoutFlow onComplete={handleCheckoutComplete} />;
}
\`\`\`

### Manage Subscription

\`\`\`tsx
import { usePushSubscription } from './hooks/useOneSignal';

function NotificationSettings() {
  const { isSubscribed, subscribe, unsubscribe, isLoading } = usePushSubscription();

  return (
    <View>
      <Text>Push Notifications</Text>
      <Switch
        value={isSubscribed || false}
        onValueChange={(val) => val ? subscribe() : unsubscribe()}
        disabled={isLoading}
      />
    </View>
  );
}
\`\`\`

## API Reference

### Services (`src/services/onesignal.ts`)

- `initializeOneSignal(options?)` - Initialize SDK
- `setExternalUserId(userId)` - Link user to your system
- `removeExternalUserId()` - Unlink user
- `sendTag(key, value)` - Set a tag
- `sendTags(tags)` - Set multiple tags
- `deleteTag(key)` - Remove a tag
- `getDeviceState()` - Get device info
- `promptForPushNotification(fallbackToSettings?)` - Request permission
- `setNotificationOpenedHandler(handler)` - Handle notification taps
- `setNotificationWillShowInForegroundHandler(handler)` - Handle foreground notifications
- `disablePush()` - Disable push for device
- `enablePush()` - Enable push for device
- `sendOutcome(name, value?)` - Track conversions
- `addTrigger(id, value)` - Trigger in-app message
- `removeTrigger(id)` - Remove trigger
- `pauseInAppMessages()` - Pause in-app messages
- `resumeInAppMessages()` - Resume in-app messages

### Hooks (`src/hooks/useOneSignal.ts`)

- `useOneSignal()` - Main hook for device state and user operations
- `usePushPermission()` - Permission management
- `useNotificationHandler(options)` - Notification event handlers
- `useTags()` - Tag management
- `usePushSubscription()` - Subscription management
- `useInAppMessages()` - In-app message triggers

## Platform-Specific Setup

### iOS

1. Add push notification capability in Xcode
2. Configure APNs certificate in OneSignal dashboard
3. Permission will be requested when you call `promptForPushNotification()`

### Android

1. Configure Firebase Cloud Messaging (FCM) in OneSignal dashboard
2. Push permission granted by default (Android 12 and below)
3. Android 13+ requires runtime permission

## Best Practices

1. **Request Permission at the Right Time**
   - Don't prompt immediately on app launch
   - Explain why you need permission first
   - Use contextual prompts (e.g., after user creates content)

2. **Link Users After Login**
   - Always call `setExternalUserId()` after successful login
   - This enables user-specific targeting

3. **Use Tags for Segmentation**
   - Tag users based on behavior (e.g., `premium_user`, `cart_abandoned`)
   - Keep tag keys consistent and documented

4. **Handle Deep Links**
   - Use `additionalData` in notifications for navigation
   - Implement `onNotificationOpened` handler for routing

5. **Test on Real Devices**
   - Push notifications don't work in simulators
   - Test on both iOS and Android devices

## Troubleshooting

### Notifications Not Received

1. Check device state: `await getDeviceState()`
2. Verify `subscribed` is `true`
3. Check OneSignal dashboard for delivery status
4. Ensure app has notification permission

### Permission Request Not Showing (iOS)

1. Check if permission already denied in Settings
2. Use `fallbackToSettings: true` to prompt user to Settings
3. Verify `Info.plist` has required keys

### External User ID Not Set

1. Ensure you call `setExternalUserId()` after login
2. Check console logs for errors
3. Verify OneSignal is initialized before calling

## Resources

- [OneSignal Documentation](https://documentation.onesignal.com/docs)
- [React Native SDK Reference](https://documentation.onesignal.com/docs/react-native-sdk-setup)
- [Dashboard](https://app.onesignal.com)

## Support

For issues specific to this connector, please contact Mobigen support.

For OneSignal-specific questions, visit [OneSignal Support](https://onesignal.com/support).
