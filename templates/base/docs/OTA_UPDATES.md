# OTA (Over-The-Air) Updates

This template includes full support for Expo Updates, allowing you to push updates to your app without going through the app store review process.

## Overview

Expo Updates enables Over-The-Air (OTA) updates for your React Native app. This means you can:

- 🚀 Deploy updates instantly without app store review
- 🔄 Fix bugs and add features in minutes, not days
- 📊 Track update adoption and rollback if needed
- 🎯 Target updates to specific channels (dev, staging, production)

## How It Works

1. **Build**: Create a production build of your app and submit to app stores
2. **Publish**: When you want to push an update, run `eas update`
3. **Automatic**: Users automatically receive updates on next app launch
4. **Seamless**: Updates apply in the background without user intervention

## Configuration

### app.config.ts

The update configuration is defined in `app.config.ts`:

```typescript
updates: {
  enabled: true,
  checkAutomatically: 'ON_LOAD',
  fallbackToCacheTimeout: 0,
  url: 'https://updates.mobigen.io/{projectId}',
}
```

### Runtime Version

The `runtimeVersion` determines update compatibility:

```typescript
runtimeVersion: {
  policy: 'sdkVersion', // Updates must match SDK version
}
```

## Usage

### Option 1: Automatic Silent Updates

For most apps, silent background updates work best:

```tsx
// In your app/_layout.tsx
import { SilentUpdateHandler } from '@/components';

export default function RootLayout() {
  return (
    <>
      <SilentUpdateHandler />
      {/* Your app content */}
    </>
  );
}
```

This will:
- Check for updates on app launch
- Download in the background
- Apply on next app restart

### Option 2: Update Banner with User Control

For apps where you want to notify users:

```tsx
// In your app/(tabs)/index.tsx
import { UpdateBanner } from '@/components';

export default function HomeScreen() {
  return (
    <View>
      <UpdateBanner position="top" autoDownload={true} />
      {/* Your screen content */}
    </View>
  );
}
```

### Option 3: Custom Update UI

Use the hooks directly for full control:

```tsx
import { useAppUpdate } from '@/hooks';

function MyCustomUpdateUI() {
  const {
    status,
    isUpdateAvailable,
    isUpdateReady,
    checkForUpdate,
    downloadUpdate,
    applyUpdate,
  } = useAppUpdate({
    checkOnMount: true,
    autoDownload: false,
  });

  if (status === 'checking') {
    return <Text>Checking for updates...</Text>;
  }

  if (isUpdateAvailable && !isUpdateReady) {
    return (
      <Button onPress={downloadUpdate}>
        Download Update
      </Button>
    );
  }

  if (isUpdateReady) {
    return (
      <Button onPress={applyUpdate}>
        Restart to Update
      </Button>
    );
  }

  return null;
}
```

## Components

### UpdateBanner

Full-featured update banner with progress indicators:

```tsx
<UpdateBanner
  position="top"          // 'top' | 'bottom'
  dismissible={true}      // Can user dismiss?
  autoDownload={true}     // Auto-download when available?
  onUpdateApplied={() => {
    console.log('Update applied!');
  }}
/>
```

### CompactUpdateBanner

Minimal space update notification:

```tsx
<CompactUpdateBanner position="bottom" autoDownload={true} />
```

### UpdatePrompt

Alternative simple prompt (from original template):

```tsx
<UpdatePrompt />
```

## Hooks

### useAppUpdate

Main hook for update management:

```tsx
const {
  status,              // 'idle' | 'checking' | 'downloading' | 'ready' | 'error'
  isUpdateAvailable,   // boolean
  isUpdateReady,       // boolean
  manifest,            // Update manifest info
  error,               // Error message if any
  currentUpdate,       // Current update info
  checkForUpdate,      // () => Promise<void>
  downloadUpdate,      // () => Promise<void>
  applyUpdate,         // () => Promise<void>
  clearError,          // () => void
} = useAppUpdate(options);
```

**Options:**
- `checkOnMount?: boolean` - Check for updates when component mounts (default: true)
- `autoDownload?: boolean` - Auto-download when update available (default: false)
- `autoReload?: boolean` - Auto-reload when update downloaded (default: false)
- `onUpdateAvailable?: (manifest) => void` - Callback when update found
- `onUpdateDownloaded?: (manifest) => void` - Callback when download complete
- `onError?: (error) => void` - Callback when error occurs

### useUpdatesEnabled

Simple check if updates are enabled:

```tsx
const isEnabled = useUpdatesEnabled();

if (!isEnabled) {
  return <Text>Running in development mode</Text>;
}
```

### useCurrentUpdate

Get current update information:

```tsx
const {
  updateId,
  createdAt,
  isEmbeddedLaunch,
  isEmergencyLaunch,
  channel,
  runtimeVersion,
} = useCurrentUpdate();
```

## Utilities

### Update Environment Info

```tsx
import {
  isDevelopment,
  isProduction,
  isUpdatesEnabled,
  getUpdateEnvironment,
  createUpdateDebugReport,
} from '@/utils';

// Check environment
if (isDevelopment()) {
  console.log('Running in dev mode, updates disabled');
}

// Get full environment info
const env = getUpdateEnvironment();
console.log('Update ID:', env.updateId);
console.log('Runtime Version:', env.runtimeVersion);

// Create debug report
const report = createUpdateDebugReport();
console.log(report);
```

### Formatting Utilities

```tsx
import {
  formatUpdateDate,
  getUpdateStatusMessage,
  formatBytes,
} from '@/utils';

// Format update date
const lastUpdate = formatUpdateDate(new Date());
// => "2 hours ago"

// Get status message
const status = getUpdateStatusMessage();
// => "Last updated 2 hours ago"

// Format sizes
const size = formatBytes(1536000);
// => "1.5 MB"
```

## Publishing Updates

### EAS Update (Recommended)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Publish an update
eas update --branch production --message "Fix login bug"

# Publish to specific channel
eas update --channel staging --message "Beta feature test"
```

### Classic Expo Publish

```bash
# Publish update
expo publish --release-channel production
```

## Update Strategies

### Strategy 1: Silent Background Updates (Recommended)

**Best for:** Most production apps

```tsx
// app/_layout.tsx
<SilentUpdateHandler />
```

**Pros:**
- No user interruption
- Always up-to-date
- Simple implementation

**Cons:**
- Users might not notice new features
- Update applies on next restart

### Strategy 2: Prompt on Critical Updates

**Best for:** Apps with critical fixes

```tsx
const { isUpdateReady } = useAppUpdate({ autoDownload: true });

if (isUpdateReady && isCriticalUpdate) {
  return <ForceUpdateScreen onUpdate={applyUpdate} />;
}
```

### Strategy 3: Optional Updates in Settings

**Best for:** Apps where users control updates

```tsx
// In settings screen
function SettingsScreen() {
  const { checkForUpdate, isUpdateAvailable } = useAppUpdate({
    checkOnMount: false,
  });

  return (
    <Button onPress={checkForUpdate}>
      Check for Updates
      {isUpdateAvailable && <Badge>New</Badge>}
    </Button>
  );
}
```

## Channels and Environments

Use update channels for different environments:

```bash
# Development builds
eas update --channel dev

# Staging builds
eas update --channel staging

# Production builds
eas update --channel production
```

Configure in your build profiles:

```json
// eas.json
{
  "build": {
    "development": {
      "channel": "dev"
    },
    "preview": {
      "channel": "staging"
    },
    "production": {
      "channel": "production"
    }
  }
}
```

## Rollback

If an update causes issues, rollback to a previous version:

```bash
# Republish a previous update
eas update --branch production --message "Rollback" \
  --republish --group {previous-update-group-id}
```

## Best Practices

### 1. Test Updates Thoroughly

Always test updates on a staging channel before production:

```bash
# Publish to staging first
eas update --channel staging

# Test thoroughly
# Then publish to production
eas update --channel production
```

### 2. Use Meaningful Messages

```bash
# ❌ Bad
eas update --message "update"

# ✅ Good
eas update --message "Fix: Resolve crash on checkout screen"
```

### 3. Monitor Update Adoption

Track update adoption in your analytics:

```tsx
import { useCurrentUpdate } from '@/hooks';

function trackUpdateInfo() {
  const update = useCurrentUpdate();

  analytics.track('app_version', {
    updateId: update.updateId,
    runtimeVersion: update.runtimeVersion,
    isEmbeddedLaunch: update.isEmbeddedLaunch,
  });
}
```

### 4. Handle Update Errors Gracefully

```tsx
const { error, clearError } = useAppUpdate({
  onError: (err) => {
    // Log to error tracking service
    Sentry.captureException(err);

    // Show user-friendly message
    Alert.alert('Update Failed', 'Could not download update. Please try again later.');
  },
});
```

### 5. Respect User's Network Conditions

```tsx
import { shouldDownloadOnCurrentNetwork } from '@/utils';

const { downloadUpdate } = useAppUpdate({
  autoDownload: false, // Manual control
});

async function handleUpdateCheck() {
  const shouldDownload = await shouldDownloadOnCurrentNetwork();

  if (shouldDownload) {
    await downloadUpdate();
  } else {
    Alert.alert(
      'Update Available',
      'Connect to WiFi to download the update and save data.'
    );
  }
}
```

## Limitations

OTA Updates **cannot** change:

- ❌ Native code (Swift, Kotlin, Objective-C, Java)
- ❌ Native dependencies (requires new build)
- ❌ Expo SDK version
- ❌ App permissions
- ❌ App bundle ID or package name

OTA Updates **can** change:

- ✅ JavaScript code
- ✅ React components
- ✅ Business logic
- ✅ Styles and themes
- ✅ Assets (images, fonts, etc.)
- ✅ API endpoints and configurations

## Troubleshooting

### Updates Not Working

1. **Check if updates are enabled:**
   ```tsx
   import { isUpdatesEnabled } from '@/utils';
   console.log('Updates enabled:', isUpdatesEnabled());
   ```

2. **Verify runtime version compatibility:**
   ```tsx
   import { getUpdateEnvironment } from '@/utils';
   const env = getUpdateEnvironment();
   console.log('Runtime version:', env.runtimeVersion);
   ```

3. **Create debug report:**
   ```tsx
   import { createUpdateDebugReport } from '@/utils';
   console.log(createUpdateDebugReport());
   ```

### Development vs Production

- **Development (Expo Go):** Updates are **disabled**
- **Development Build:** Updates are **enabled**
- **Production Build:** Updates are **enabled**

To test updates, use:
```bash
# Create development build (not Expo Go)
eas build --profile development --platform ios
```

## Analytics Integration

Track update events in Mobigen analytics:

```tsx
// The updates service automatically tracks:
// - download_start
// - download_complete
// - download_error
// - apply_start
// - apply_complete
// - apply_error

// View in Mobigen dashboard:
// Analytics > OTA Updates
```

## Security

- All updates are served over HTTPS
- Updates are signed and verified
- Runtime version ensures compatibility
- Emergency fallback to embedded bundle

## Resources

- [Expo Updates Documentation](https://docs.expo.dev/versions/latest/sdk/updates/)
- [EAS Update Documentation](https://docs.expo.dev/eas-update/introduction/)
- [Mobigen Updates Guide](https://mobigen.io/docs/updates)

## Support

For issues with OTA updates:
- Check [Mobigen Documentation](https://mobigen.io/docs)
- Contact support@mobigen.io
- Report bugs on GitHub
