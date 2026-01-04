# RevenueCat Connector for Mobigen

In-app purchases and subscription management connector using [RevenueCat](https://www.revenuecat.com).

## Features

- ✅ Cross-platform support (iOS & Android)
- ✅ Easy subscription management
- ✅ Free trial support
- ✅ Intro pricing
- ✅ Promotional offers
- ✅ Restore purchases
- ✅ Entitlement checking
- ✅ React hooks for easy integration
- ✅ TypeScript support

## Installation

This connector is automatically configured when installed through the Mobigen dashboard.

### Manual Installation

```bash
npm install react-native-purchases
```

For iOS, also run:
```bash
cd ios && pod install
```

## Configuration

### Required Credentials

1. **iOS Public SDK Key** (required)
   - Get from: https://app.revenuecat.com/settings/api-keys
   - Format: `appl_...`

2. **Android Public SDK Key** (optional but recommended)
   - Get from: https://app.revenuecat.com/settings/api-keys
   - Format: `goog_...`

3. **Entitlement ID** (required)
   - Create in RevenueCat dashboard under Entitlements
   - Example: `premium`, `pro`, `all_access`

4. **Secret API Key** (optional, for server-side operations)
   - Get from: https://app.revenuecat.com/settings/api-keys
   - Format: `sk_...`

## Usage

### 1. Wrap Your App with RevenueCatProvider

```tsx
import { RevenueCatProvider } from './providers/revenuecat-provider';

export default function App() {
  return (
    <RevenueCatProvider debugMode={__DEV__}>
      <YourApp />
    </RevenueCatProvider>
  );
}
```

### 2. Display Available Products

```tsx
import { useOfferings, usePurchase } from '../hooks/useRevenueCat';

function SubscriptionScreen() {
  const { currentOffering, loading } = useOfferings();
  const { purchase, purchasing } = usePurchase();

  if (loading) return <LoadingSpinner />;

  const handlePurchase = async (pkg) => {
    const result = await purchase(pkg);

    if (result.success) {
      console.log('Purchase successful!');
    } else if (result.userCancelled) {
      console.log('User cancelled');
    } else {
      console.error('Purchase failed:', result.error);
    }
  };

  return (
    <View>
      {currentOffering?.availablePackages.map((pkg) => (
        <TouchableOpacity
          key={pkg.identifier}
          onPress={() => handlePurchase(pkg)}
          disabled={purchasing}
        >
          <Text>{pkg.product.title}</Text>
          <Text>{pkg.product.priceString}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
```

### 3. Check Entitlement Status

```tsx
import { useEntitlement } from '../hooks/useRevenueCat';

function PremiumFeature() {
  const { hasEntitlement, loading } = useEntitlement('premium');

  if (loading) return <LoadingSpinner />;

  if (!hasEntitlement) {
    return <UpgradeToPremiumScreen />;
  }

  return <PremiumContent />;
}
```

### 4. Restore Purchases

```tsx
import { useRestorePurchases } from '../hooks/useRevenueCat';

function SettingsScreen() {
  const { restore, restoring } = useRestorePurchases();

  const handleRestore = async () => {
    const result = await restore();

    if (result.success) {
      Alert.alert('Success', 'Purchases restored!');
    } else {
      Alert.alert('Error', 'Failed to restore purchases');
    }
  };

  return (
    <TouchableOpacity onPress={handleRestore} disabled={restoring}>
      <Text>Restore Purchases</Text>
    </TouchableOpacity>
  );
}
```

## API Reference

### Hooks

#### `useRevenueCat()`
Access customer info and entitlements.

```tsx
const { customerInfo, loading, error, refresh } = useRevenueCat();
```

#### `useOfferings()`
Get available products and packages.

```tsx
const { offerings, currentOffering, loading, error, refresh } = useOfferings();
```

#### `usePurchase()`
Handle purchase flow.

```tsx
const { purchase, purchasing, error } = usePurchase();
const result = await purchase(package);
```

#### `useRestorePurchases()`
Restore previous purchases.

```tsx
const { restore, restoring, error } = useRestorePurchases();
const result = await restore();
```

#### `useEntitlement(entitlementId?)`
Check if user has a specific entitlement.

```tsx
const { hasEntitlement, loading, error, refresh } = useEntitlement('premium');
```

### Services

All hooks use the underlying service functions which can also be called directly:

```tsx
import {
  configureRevenueCat,
  getOfferings,
  purchasePackage,
  restorePurchases,
  getCustomerInfo,
  checkEntitlement,
  identifyUser,
  logoutUser,
} from '../services/revenuecat';
```

## Platform Differences

### iOS
- Uses App Store Connect for products
- Supports family sharing
- Requires iOS 13.0+

### Android
- Uses Google Play Console for products
- Requires Android 5.0+ (API 21)

## Testing

### Test Mode
RevenueCat automatically detects sandbox purchases. Use test accounts from:
- iOS: App Store Connect → Users and Access → Sandbox Testers
- Android: Google Play Console → Internal testing

### Debug Mode
Enable debug mode in development:

```tsx
<RevenueCatProvider debugMode={true}>
```

## Troubleshooting

### "No offerings found"
- Verify products are configured in App Store Connect / Google Play Console
- Check products are added to RevenueCat dashboard
- Ensure app bundle ID matches RevenueCat configuration

### "Invalid API key"
- Verify you're using the correct platform key (iOS vs Android)
- Check API key hasn't been revoked in RevenueCat dashboard

### "Purchase failed"
- Check device has active payment method
- Verify product is available in the user's region
- Ensure app is properly signed and provisioned

## Resources

- [RevenueCat Documentation](https://www.revenuecat.com/docs)
- [React Native SDK Reference](https://sdk.revenuecat.com/react-native/)
- [Sample Apps](https://github.com/RevenueCat/react-native-purchases/tree/main/examples)
- [Migration Guide](https://www.revenuecat.com/docs/migrating-to-revenuecat)

## Support

For issues specific to this connector, contact Mobigen support.
For RevenueCat-specific issues, see [RevenueCat Support](https://www.revenuecat.com/support).
