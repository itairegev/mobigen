# @mobigen/submission

App Store submission utilities for Mobigen.

## Overview

This package provides comprehensive tools and services for guiding users through the app store submission process, including:

- **Asset Generation**: Automatic generation of app icons in all required sizes for iOS and Android
- **Screenshot Templates**: Templates and validation for app store screenshots
- **Submission Checklists**: Platform-specific step-by-step submission guides
- **Metadata Management**: Templates and validation for app store metadata
- **Credential Management**: Secure storage for App Store Connect and Play Console credentials (Pro/Enterprise tier)

## Installation

```bash
pnpm add @mobigen/submission
```

## Usage

### Asset Generation

Generate all required app icons from a source image:

```typescript
import { assetGenerator } from '@mobigen/submission';

const result = await assetGenerator.generateIcons({
  projectId: 'project-uuid',
  projectPath: '/path/to/project',
  logoPath: '/path/to/logo.png', // Optional, will generate placeholder if not provided
  primaryColor: '#007AFF',
  backgroundColor: '#FFFFFF',
});

if (result.success) {
  console.log(`Generated ${result.generatedIcons.length} icons`);
} else {
  console.error('Errors:', result.errors);
}
```

Validate existing icons:

```typescript
const validation = await assetGenerator.validateIcons('/path/to/project');

if (!validation.valid) {
  console.log('Missing icons:', validation.missing);
  console.log('Invalid icons:', validation.invalid);
}
```

### Screenshot Management

Generate screenshot templates:

```typescript
import { screenshotService } from '@mobigen/submission';

const result = await screenshotService.generateTemplates(
  '/path/to/project',
  'both' // or 'ios' or 'android'
);

console.log(`Generated ${result.generatedScreenshots.length} screenshot templates`);
```

Get screenshot requirements:

```typescript
const requirements = screenshotService.getRequirements('ios');
console.log(requirements); // Array of ScreenshotSpec
```

Validate screenshots:

```typescript
const validation = await screenshotService.validateScreenshots(
  '/path/to/project',
  'ios'
);

if (!validation.valid) {
  console.log('Missing screenshots:', validation.missing);
  console.log('Invalid screenshots:', validation.invalid);
}
```

### Submission Checklist

Get platform-specific checklist:

```typescript
import { checklistService } from '@mobigen/submission';

const checklist = checklistService.getChecklist('ios');
// Returns array of ChecklistItem with dependencies, estimated time, etc.

const estimatedTime = checklistService.getTotalEstimatedTime('ios');
console.log(`Estimated time: ${estimatedTime}`);
```

Get detailed guide for a specific step:

```typescript
const guide = checklistService.getStepGuide('apple-developer-account', 'ios');
if (guide) {
  console.log(guide.title);
  console.log(guide.sections); // Detailed step-by-step instructions
  console.log(guide.resources); // Links to documentation
}
```

### Metadata Management

Generate metadata template:

```typescript
import { metadataService } from '@mobigen/submission';

const metadata = metadataService.generateTemplate({
  name: 'My App',
  description: 'A great mobile app',
  category: 'Productivity',
  userEmail: 'support@example.com',
});
```

Validate metadata:

```typescript
const validation = metadataService.validateMetadata(metadata, 'ios');

if (!validation.valid) {
  console.error('Errors:', validation.errors);
}
if (validation.warnings.length > 0) {
  console.warn('Warnings:', validation.warnings);
}
```

Get keyword suggestions:

```typescript
const keywords = metadataService.suggestKeywords({
  name: 'My Todo App',
  category: 'Productivity',
  description: 'Manage your tasks efficiently',
});
```

## API Router Integration

The package integrates with Mobigen's tRPC API through the `submissionGuideRouter`:

```typescript
// Available endpoints:
submissionGuide.getChecklist({ projectId, platform });
submissionGuide.getInstructions({ projectId, platform, step });
submissionGuide.initializeProgress({ projectId, platform });
submissionGuide.updateProgress({ projectId, step });
submissionGuide.updateMetadata({ projectId, ...metadata });
submissionGuide.updateStatus({ projectId, platform, status });
submissionGuide.storeCredentials({ projectId, platform, credentials }); // Pro/Enterprise only
submissionGuide.generateMetadata({ projectId });
submissionGuide.markAssetsGenerated({ projectId, assetType });
```

## Database Models

### SubmissionProgress

Tracks user's progress through the submission checklist:

```prisma
model SubmissionProgress {
  id        String   @id @default(uuid())
  projectId String   @unique
  platform  String   // ios, android, both

  completedSteps String[]
  totalSteps     Int
  currentStep    String?

  iosStatus     String @default("not_started")
  androidStatus String @default("not_started")

  // Platform-specific metadata
  iosAppId          String?
  androidPackageName String?

  // Asset tracking
  iconsGenerated       Boolean @default(false)
  screenshotsGenerated Boolean @default(false)
  metadataCompleted    Boolean @default(false)

  // Submission dates
  iosSubmittedAt   DateTime?
  androidSubmittedAt DateTime?
}
```

### StoreCredentials

Securely stores API keys and credentials (encrypted with AES-256-GCM):

```prisma
model StoreCredentials {
  id        String @id @default(uuid())
  projectId String
  userId    String
  platform  String // ios, android

  // Encrypted credentials
  credentialsEncrypted String @db.Text
  credentialsIv        String
  credentialsTag       String

  credentialType String // app_store_connect_api_key, google_play_service_account, etc.
  expiresAt      DateTime?
}
```

### AppMetadata

Stores app store metadata:

```prisma
model AppMetadata {
  id        String @id @default(uuid())
  projectId String @unique

  appName        String
  appSubtitle    String?
  shortDescription String @db.Text
  fullDescription  String @db.Text

  keywords String[]
  category String

  privacyPolicyUrl String
  supportUrl       String
  supportEmail     String

  contentRating   String?

  iosScreenshots     Json @default("{}")
  androidScreenshots Json @default("{}")
}
```

## Icon Sizes Reference

### iOS

| Device | Size | Scale | Filename |
|--------|------|-------|----------|
| iPhone Notification | 20pt | 2x, 3x | icon-20@2x.png, icon-20@3x.png |
| iPhone Settings | 29pt | 2x, 3x | icon-29@2x.png, icon-29@3x.png |
| iPhone Spotlight | 40pt | 2x, 3x | icon-40@2x.png, icon-40@3x.png |
| iPhone App | 60pt | 2x, 3x | icon-60@2x.png, icon-60@3x.png |
| App Store | 1024pt | 1x | icon-1024.png |

### Android

| Density | Size | Path |
|---------|------|------|
| mdpi | 48px | mipmap-mdpi/ic_launcher.png |
| hdpi | 72px | mipmap-hdpi/ic_launcher.png |
| xhdpi | 96px | mipmap-xhdpi/ic_launcher.png |
| xxhdpi | 144px | mipmap-xxhdpi/ic_launcher.png |
| xxxhdpi | 192px | mipmap-xxxhdpi/ic_launcher.png |
| Play Store | 512px | playstore-icon.png |

## Screenshot Sizes Reference

### iOS

- 6.7" iPhone: 1290 × 2796 (required)
- 6.5" iPhone: 1242 × 2688 (required)
- 5.5" iPhone: 1242 × 2208 (optional)
- 12.9" iPad Pro: 2048 × 2732 (optional)
- 11" iPad Pro: 1668 × 2388 (optional)

### Android

- Phone: 1080 × 1920 minimum (required)
- 7" Tablet: 1200 × 1920 (optional)
- 10" Tablet: 1600 × 2560 (optional)

## Security

### Credential Encryption

Store credentials are encrypted using AES-256-GCM before storage:

1. Credentials are serialized to JSON
2. Encrypted with AES-256-GCM using a server-side encryption key
3. Initialization vector (IV) and authentication tag are stored separately
4. Only accessible to users with Pro or Enterprise tier

**Environment Variables Required:**
```bash
ENCRYPTION_KEY=<64-character-hex-string>
```

Generate a key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Best Practices

### Icons

1. Start with a high-resolution source (at least 1024×1024)
2. Use simple, recognizable designs
3. Avoid text in icons (use name/subtitle instead)
4. Test on actual devices
5. Follow platform guidelines:
   - iOS: Rounded corners automatically applied
   - Android: Use adaptive icons (foreground + background layers)

### Screenshots

1. Show real app content (no lorem ipsum)
2. Highlight key features
3. Use device frames for professionalism
4. Add text overlays to explain features
5. Localize for all supported languages
6. Keep consistent style across all screenshots

### Metadata

1. Front-load important information
2. Use keywords naturally in description
3. Keep descriptions scannable (bullet points, short paragraphs)
4. Update regularly to maintain relevance
5. A/B test different descriptions and screenshots

## License

MIT

## Support

For issues or questions, contact support@mobigen.io or visit https://docs.mobigen.io/submission-guide
