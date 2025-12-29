# OTA Updates Quick Start Guide

Quick reference for using OTA (Over-The-Air) updates in Mobigen.

## Setup

### 1. Run Database Migration

```bash
cd packages/db
npx prisma migrate dev --name add-ota-updates
npx prisma generate
```

### 2. Set Environment Variables

```bash
# .env
EXPO_TOKEN=your-expo-access-token
EAS_PROJECT_ID=your-eas-project-id
EAS_UPDATE_URL=https://u.expo.dev
EXPO_ACCOUNT_OWNER=mobigen
```

### 3. Install Dependencies

Already included in base template, but if updating existing project:

```bash
cd templates/base
pnpm add expo-updates@~0.25.0
```

## Common Operations

### Create Update Channel

```typescript
import { OTAUpdatesService } from '@mobigen/ota-updates';
import { prisma } from '@mobigen/db';

const service = new OTAUpdatesService(prisma);

const channel = await service.createChannel({
  projectId: 'project-uuid',
  name: 'production',
  description: 'Production release channel',
  isDefault: true,
  runtimeVersion: '1.0.0',
});
```

### Publish Update

```typescript
const update = await service.publishUpdate(
  {
    projectId: 'project-uuid',
    channelId: channel.id,
    message: 'Fix: Login button styling',
    changeType: 'fix', // feature, fix, style, content
    platform: 'all', // ios, android, all
    rolloutPercent: 100, // 0-100
  },
  '/path/to/project',
  'user-id'
);
```

### Rollback Update

```typescript
await service.rollbackUpdate(
  {
    updateId: 'failed-update-id',
    // Optional: specify target version
    targetUpdateId: 'previous-update-id',
  },
  'user-id'
);
```

### Get Update Status

```typescript
const status = await service.getUpdateStatus('update-id');

console.log('Status:', status.update.status);
console.log('Downloads:', status.update.downloadCount);
console.log('Errors:', status.update.errorCount);
console.log('Success rate:', status.metrics[0].successRate);
```

## In Generated Apps

### Option 1: Automatic Silent Updates

```typescript
// In app/_layout.tsx or App.tsx
import { useEffect } from 'react';
import { initializeUpdates } from './services/updates';

export default function RootLayout() {
  useEffect(() => {
    initializeUpdates({
      checkOnLaunch: true,
      autoDownload: true,
      autoReload: true, // Silently apply updates
    });
  }, []);

  return <Slot />;
}
```

### Option 2: Manual Control with UI

```typescript
// In your settings or home screen
import { UpdatePrompt } from '../components/UpdatePrompt';

function HomeScreen() {
  return (
    <View>
      <UpdatePrompt />
      {/* Rest of your app */}
    </View>
  );
}
```

### Option 3: Custom Implementation

```typescript
import { useUpdates } from '../hooks/useUpdates';

function SettingsScreen() {
  const {
    isChecking,
    updateAvailable,
    checkForUpdate,
    downloadUpdate,
    applyUpdate,
  } = useUpdates({
    checkOnMount: true,
    autoDownload: false,
    autoReload: false,
  });

  return (
    <View>
      <Button title="Check for Updates" onPress={checkForUpdate} />
      {updateAvailable && (
        <>
          <Text>Update available!</Text>
          <Button title="Download" onPress={downloadUpdate} />
          <Button title="Install" onPress={applyUpdate} />
        </>
      )}
    </View>
  );
}
```

## API Usage (tRPC)

### Create Channel

```typescript
const channel = await trpc.otaUpdates.createChannel.mutate({
  projectId: 'project-uuid',
  name: 'production',
  isDefault: true,
});
```

### Publish Update

```typescript
const update = await trpc.otaUpdates.publishUpdate.mutate({
  projectId: 'project-uuid',
  channelId: channel.id,
  message: 'Bug fix: Crash on startup',
  changeType: 'fix',
  platform: 'all',
  rolloutPercent: 100,
});
```

### Get Updates

```typescript
const updates = await trpc.otaUpdates.listUpdates.query({
  projectId: 'project-uuid',
  channelId: channel.id,
  limit: 20,
});
```

### Rollback

```typescript
await trpc.otaUpdates.rollback.mutate({
  updateId: 'failed-update-id',
});
```

### Get Metrics

```typescript
const metrics = await trpc.otaUpdates.getMetrics.query({
  updateId: 'update-id',
});
```

## CLI Commands

### Publish Update (using EAS CLI)

```bash
cd /path/to/project
eas update --branch production --message "Bug fix"
```

### List Updates

```bash
eas update:list --branch production
```

### View Update

```bash
eas update:view <update-id>
```

## Best Practices

### 1. Use Staging First

```typescript
// Publish to staging
await service.publishUpdate({
  channelId: stagingChannel.id,
  message: 'New feature',
  platform: 'all',
}, projectPath, userId);

// Test thoroughly
// Then publish to production
```

### 2. Gradual Rollout

```typescript
// Start with 10%
await service.publishUpdate({
  channelId: productionChannel.id,
  message: 'New feature',
  rolloutPercent: 10,
}, projectPath, userId);

// Monitor metrics
const status = await service.getUpdateStatus(update.id);

// Increase if looking good
await prisma.oTAUpdate.update({
  where: { id: update.id },
  data: { rolloutPercent: 50 },
});
```

### 3. Monitor Error Rates

```typescript
const status = await service.getUpdateStatus(update.id);

if (status.update.errorCount > status.update.downloadCount * 0.05) {
  // More than 5% error rate - rollback
  await service.rollbackUpdate({ updateId: update.id }, userId);
}
```

### 4. Clear Descriptions

```typescript
// Good
message: 'Fix: Login button not responding on iOS'
message: 'Feature: Add dark mode toggle in settings'

// Bad
message: 'Update'
message: 'Changes'
```

## What Can/Cannot Be Updated

### ✅ Can Update via OTA
- JavaScript/TypeScript code
- React components
- Styling (CSS/NativeWind)
- Images, fonts, assets
- App logic and business rules
- API integrations
- UI layouts

### ❌ Cannot Update via OTA (Requires App Store Build)
- Native code (Java/Kotlin/Swift/Objective-C)
- New native dependencies
- Expo SDK version changes
- Native permissions (AndroidManifest.xml, Info.plist)
- App icons and splash screens (native assets)
- Build configurations

## Troubleshooting

### Update Not Downloading

1. Check runtime version matches:
   ```typescript
   const current = getCurrentUpdate();
   console.log('Runtime version:', current.runtimeVersion);
   ```

2. Verify updates are enabled:
   ```typescript
   console.log('Updates enabled:', isUpdatesEnabled());
   ```

3. Check network:
   ```typescript
   const result = await checkForUpdates();
   console.log('Update available:', result.isAvailable);
   ```

### Update Failing to Apply

1. Check error logs:
   ```typescript
   const status = await service.getUpdateStatus(updateId);
   console.log('Recent errors:', status.recentErrors);
   ```

2. Verify compatibility:
   - Runtime version must match
   - Platform must match (iOS/Android/all)

3. Test in development:
   ```bash
   expo start --clear
   ```

## Support

- [Full Documentation](../packages/ota-updates/README.md)
- [Implementation Details](../OTA_UPDATES_IMPLEMENTATION.md)
- [Expo Updates Docs](https://docs.expo.dev/versions/latest/sdk/updates/)
- [EAS Update Docs](https://docs.expo.dev/eas-update/introduction/)
