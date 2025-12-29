# Mobigen OTA Updates

Over-The-Air (OTA) updates service for Mobigen using Expo Updates. This allows you to push updates to your mobile apps without going through app store review for minor changes.

## Features

- **Channel Management**: Create multiple update channels (production, staging, development, beta)
- **Version Control**: Track all published updates with rollback capabilities
- **Metrics & Analytics**: Monitor update downloads, errors, and performance
- **Gradual Rollouts**: Roll out updates to a percentage of users
- **Automatic Tracking**: Built-in event tracking for downloads, installs, and errors
- **Runtime Version Management**: Ensure compatibility between updates and app binaries

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    MOBIGEN OTA UPDATES                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Dashboard          API                 Generated Apps          │
│  ┌──────────┐    ┌──────────┐         ┌──────────────┐        │
│  │ Publish  │───▶│  OTA     │         │  App checks  │        │
│  │ Update   │    │  Service │         │  for updates │        │
│  └──────────┘    └────┬─────┘         └──────┬───────┘        │
│                       │                       │                 │
│                       ▼                       │                 │
│                  ┌──────────┐                 │                 │
│                  │   Expo   │◀────────────────┘                 │
│                  │  Updates │                                   │
│                  └──────────┘                                   │
│                       │                                         │
│                       ▼                                         │
│                  ┌──────────┐                                   │
│                  │   CDN    │                                   │
│                  │ (u.expo) │                                   │
│                  └──────────┘                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Database Schema

### UpdateChannel
- Represents a release channel (e.g., production, staging)
- Each channel has a unique branch name in Expo
- Can target specific runtime versions

### OTAUpdate
- Individual update published to a channel
- Tracks status, version, files changed
- Supports gradual rollouts (0-100%)
- Can be rolled back to previous versions

### OTAUpdateMetric
- Aggregated metrics per update
- Success/failure counts by platform
- Performance metrics (download time, apply time)

### OTAUpdateEvent
- Individual update events from devices
- Tracks download, apply, error events
- Used for debugging and analytics

## Usage

### 1. Create Update Channels

```typescript
import { OTAUpdatesService } from '@mobigen/ota-updates';

const service = new OTAUpdatesService(prisma);

// Create production channel
const productionChannel = await service.createChannel({
  projectId: 'project-uuid',
  name: 'production',
  description: 'Production release channel',
  isDefault: true,
  runtimeVersion: '1.0.0',
});

// Create staging channel
const stagingChannel = await service.createChannel({
  projectId: 'project-uuid',
  name: 'staging',
  description: 'Staging/QA channel',
  isDefault: false,
});
```

### 2. Publish Updates

```typescript
// Publish an update
const update = await service.publishUpdate(
  {
    projectId: 'project-uuid',
    channelId: productionChannel.id,
    message: 'Fix: Resolve login button alignment issue',
    changeType: 'fix',
    platform: 'all', // 'ios', 'android', or 'all'
    rolloutPercent: 100, // Gradual rollout: 0-100
  },
  '/path/to/project',
  'user-id'
);

console.log('Published update:', update.version);
```

### 3. Gradual Rollout

```typescript
// Start with 10% of users
const update = await service.publishUpdate({
  projectId: 'project-uuid',
  channelId: productionChannel.id,
  message: 'New feature: Dark mode',
  changeType: 'feature',
  platform: 'all',
  rolloutPercent: 10, // Only 10% of users will receive this
}, projectPath, userId);

// Later, increase to 50%
await prisma.oTAUpdate.update({
  where: { id: update.id },
  data: { rolloutPercent: 50 },
});

// Finally, roll out to everyone
await prisma.oTAUpdate.update({
  where: { id: update.id },
  data: { rolloutPercent: 100 },
});
```

### 4. Rollback

```typescript
// Rollback to previous version
const rolledBack = await service.rollbackUpdate(
  {
    updateId: 'failed-update-id',
    // Optional: specify which version to rollback to
    // If omitted, rolls back to the previous version
    targetUpdateId: 'previous-update-id',
  },
  'user-id'
);
```

### 5. Get Update Metrics

```typescript
// Get metrics for an update
const metrics = await service.getUpdateMetrics('update-id');

console.log('Success rate:', metrics[0].successRate);
console.log('Average download time:', metrics[0].avgDownloadTimeMs);
```

### 6. Monitor Update Status

```typescript
// Get comprehensive status
const status = await service.getUpdateStatus('update-id');

console.log('Update:', status.update);
console.log('Metrics:', status.metrics);
console.log('Recent errors:', status.recentErrors);
```

## API Endpoints

The `otaUpdatesRouter` provides the following tRPC endpoints:

### Channels
- `createChannel`: Create a new update channel
- `listChannels`: List all channels for a project
- `getChannel`: Get a specific channel
- `deleteChannel`: Delete a channel

### Updates
- `publishUpdate`: Publish a new update
- `listUpdates`: List updates for a project/channel
- `getUpdate`: Get a specific update
- `rollback`: Rollback to a previous update

### Analytics
- `trackEvent`: Track update events (public endpoint for apps)
- `getMetrics`: Get metrics for an update
- `getUpdateStatus`: Get comprehensive update status
- `getConfig`: Get OTA configuration for an app (public)

## In Generated Apps

Generated apps automatically include the OTA updates functionality:

### 1. Automatic Updates

```typescript
// In app/_layout.tsx or App.tsx
import { initializeUpdates } from './services/updates';

export default function RootLayout() {
  useEffect(() => {
    // Initialize updates with default settings
    // Checks on launch and auto-downloads/applies updates
    initializeUpdates();
  }, []);

  return <Slot />;
}
```

### 2. Manual Update Control with Hook

```typescript
import { useUpdates } from '../hooks/useUpdates';

function SettingsScreen() {
  const {
    isChecking,
    isDownloading,
    updateAvailable,
    updateDownloaded,
    checkForUpdate,
    downloadUpdate,
    applyUpdate,
  } = useUpdates({
    checkOnMount: false, // Don't check automatically
    autoDownload: false,
    autoReload: false,
  });

  return (
    <View>
      <Button
        title="Check for Updates"
        onPress={checkForUpdate}
        disabled={isChecking}
      />
      {updateAvailable && !updateDownloaded && (
        <Button
          title="Download Update"
          onPress={downloadUpdate}
          disabled={isDownloading}
        />
      )}
      {updateDownloaded && (
        <Button title="Install Update" onPress={applyUpdate} />
      )}
    </View>
  );
}
```

### 3. Update Prompt Component

```typescript
import { UpdatePrompt } from '../components/UpdatePrompt';

function App() {
  return (
    <View>
      <UpdatePrompt />
      {/* Rest of your app */}
    </View>
  );
}
```

## Configuration

### Environment Variables

```bash
# Required
EXPO_TOKEN=your-expo-access-token
EAS_PROJECT_ID=your-eas-project-id

# Optional
EAS_UPDATE_URL=https://u.expo.dev
EXPO_ACCOUNT_OWNER=your-expo-username
```

### app.json Configuration

The build service automatically configures `app.json` with:

```json
{
  "expo": {
    "runtimeVersion": {
      "policy": "sdkVersion"
    },
    "updates": {
      "enabled": true,
      "fallbackToCacheTimeout": 0,
      "checkAutomatically": "ON_LOAD",
      "url": "https://u.expo.dev"
    },
    "plugins": [
      "expo-router",
      "expo-secure-store",
      ["expo-updates", { "username": "mobigen" }]
    ]
  }
}
```

## Runtime Version Strategies

### 1. SDK Version Policy (Default)
- Runtime version matches Expo SDK version
- Updates only work for apps built with the same SDK version
- Safest option, prevents incompatibilities

```json
{
  "runtimeVersion": {
    "policy": "sdkVersion"
  }
}
```

### 2. App Version Policy
- Runtime version matches app version
- More flexible for updates across SDK versions
- Requires careful testing

```json
{
  "runtimeVersion": {
    "policy": "appVersion"
  }
}
```

### 3. Manual Runtime Version
- Specify exact runtime version
- Full control over update compatibility

```json
{
  "runtimeVersion": "1.0.0"
}
```

## Best Practices

### 1. Use Channels for Different Environments
```typescript
// Production
await service.createChannel({
  projectId,
  name: 'production',
  isDefault: true,
});

// Staging/QA
await service.createChannel({
  projectId,
  name: 'staging',
});

// Internal testing
await service.createChannel({
  projectId,
  name: 'development',
});
```

### 2. Test Updates Before Wide Release
```typescript
// 1. Publish to staging first
await service.publishUpdate({
  channelId: stagingChannel.id,
  message: 'New feature: User profiles',
  platform: 'all',
}, projectPath, userId);

// 2. Test thoroughly

// 3. Publish to production with gradual rollout
await service.publishUpdate({
  channelId: productionChannel.id,
  message: 'New feature: User profiles',
  platform: 'all',
  rolloutPercent: 10, // Start with 10%
}, projectPath, userId);

// 4. Monitor metrics, increase rollout
```

### 3. Monitor Update Metrics
```typescript
// Check metrics regularly
const metrics = await service.getUpdateMetrics(updateId);

if (metrics[0].successRate < 0.95) {
  // High failure rate - consider rollback
  await service.rollbackUpdate({ updateId }, userId);
}
```

### 4. Provide User Feedback
```typescript
// Show update status to users
import { UpdatePrompt } from '../components/UpdatePrompt';

// Or use silent updates with notifications
import { SilentUpdateHandler } from '../components/UpdatePrompt';
```

## Limitations

### What CAN be updated via OTA:
- JavaScript/TypeScript code
- Assets (images, fonts)
- Styling
- App logic and features

### What CANNOT be updated via OTA:
- Native code changes
- New native dependencies
- Changes to `app.json` that affect native configuration
- Permissions changes
- SDK version upgrades

For these changes, you must publish a new app store build.

## Troubleshooting

### Updates not downloading
1. Check that `expo-updates` is installed
2. Verify `EXPO_TOKEN` is set correctly
3. Ensure app's runtime version matches update's runtime version
4. Check network connectivity

### Updates failing to apply
1. Check console logs for errors
2. Verify the update is compatible with the app version
3. Check the update's error metrics in the dashboard

### Rollback not working
1. Ensure there is a previous version to roll back to
2. Check that `canRollback` is true on the update
3. Verify you have permissions to rollback

## License

MIT
