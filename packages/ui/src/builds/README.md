# Build Status Dashboard Components

A comprehensive set of React components and hooks for managing and displaying mobile app build status, designed for the Mobigen platform. These components provide a polished, production-ready UI for monitoring iOS and Android builds through their entire lifecycle.

## Table of Contents

- [Overview](#overview)
- [Components](#components)
- [Hooks](#hooks)
- [Types](#types)
- [Installation](#installation)
- [Usage Examples](#usage-examples)
- [Build Stages](#build-stages)
- [Styling](#styling)

## Overview

The Build Status Dashboard provides:

- **Real-time Build Monitoring**: Track builds from queue to completion
- **Multi-Platform Support**: Separate views for iOS and Android builds
- **Progress Visualization**: Stage-based progress bars with time estimates
- **Build History**: Filterable, paginated list of past builds
- **Detailed Build Information**: Modal view with validation errors, logs, and timing
- **Deployment Actions**: Trigger new TestFlight/Play Store builds
- **Queue Management**: Visual indicators for build queue position

## Components

### BuildStatusCard

Displays a single build's current status with progress information.

```tsx
import { BuildStatusCard } from '@mobigen/ui';

<BuildStatusCard
  build={build}
  onViewDetails={(buildId) => console.log('View details:', buildId)}
  onCancel={(buildId) => console.log('Cancel build:', buildId)}
/>
```

**Props:**
- `build: Build` - Build object with status, progress, and metadata
- `onViewDetails?: (buildId: string) => void` - Callback when viewing details
- `onCancel?: (buildId: string) => void` - Callback when canceling build
- `className?: string` - Additional CSS classes

**Features:**
- Platform-specific icons (iOS/Android)
- Real-time progress updates
- Queue position display
- Error summaries for failed builds
- Download button for completed builds

### BuildProgressBar

Visual progress indicator showing build stages and completion percentage.

```tsx
import { BuildProgressBar } from '@mobigen/ui';

<BuildProgressBar
  build={build}
  showStages={true}
  showPercentage={true}
/>
```

**Props:**
- `build: Build` - Build object with progress data
- `showStages?: boolean` - Show detailed stage timeline (default: true)
- `showPercentage?: boolean` - Show percentage indicator (default: true)
- `className?: string` - Additional CSS classes

**Build Stages:**
1. **Queued** - Waiting in build queue
2. **Building** - Compiling and bundling (5 min avg)
3. **Uploading** - Uploading artifacts (1 min avg)
4. **Processing** - Post-build processing (2 min avg)
5. **Ready** - Build completed successfully

### BuildHistoryList

Displays a filterable, paginated list of past builds.

```tsx
import { BuildHistoryList } from '@mobigen/ui';

<BuildHistoryList
  builds={builds}
  filters={{ platform: 'ios', status: 'ready' }}
  onFilterChange={(filters) => setFilters(filters)}
  onBuildClick={(build) => setSelectedBuild(build)}
  hasMore={hasMore}
  onLoadMore={() => loadMore()}
/>
```

**Props:**
- `builds: Build[]` - Array of build objects
- `filters?: BuildHistoryFilters` - Current filter state
- `onFilterChange?: (filters) => void` - Filter change callback
- `onBuildClick?: (build: Build) => void` - Build click callback
- `isLoading?: boolean` - Loading state
- `hasMore?: boolean` - More builds available
- `onLoadMore?: () => void` - Load more callback
- `className?: string` - Additional CSS classes

**Features:**
- Platform filtering (iOS/Android/All)
- Status filtering (Ready/Building/Failed/Cancelled)
- Infinite scroll support
- Empty state handling

### BuildDetailsModal

Detailed modal view of a build with logs, artifacts, timing, and validation errors.

```tsx
import { BuildDetailsModal } from '@mobigen/ui';

<BuildDetailsModal
  build={selectedBuild}
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  onDownloadArtifact={(buildId) => downloadArtifact(buildId)}
  onViewLogs={(buildId) => viewLogs(buildId)}
/>
```

**Props:**
- `build: Build | null` - Build to display
- `isOpen: boolean` - Modal visibility state
- `onClose: () => void` - Close callback
- `onDownloadArtifact?: (buildId: string) => void` - Download callback
- `onViewLogs?: (buildId: string) => void` - View logs callback
- `className?: string` - Additional CSS classes

**Tabs:**
- **Overview**: Build metadata, duration, artifact size
- **Validation**: Validation results and error details
- **Timing**: Build timeline with start/end times

### DeployButton

Trigger new TestFlight/Play Store deployment builds with options.

```tsx
import { DeployButton } from '@mobigen/ui';

<DeployButton
  projectId="project-123"
  platform="ios"
  options={{ autoIncrement: true, submitToTestFlight: true }}
  onDeployStart={(buildId) => console.log('Deployment started:', buildId)}
  onDeployError={(error) => console.error('Deploy failed:', error)}
/>
```

**Props:**
- `projectId: string` - Project ID
- `platform: BuildPlatform` - 'ios' | 'android'
- `disabled?: boolean` - Disable button
- `options?: Partial<DeploymentOptions>` - Deployment options
- `onDeployStart?: (buildId: string) => void` - Deploy start callback
- `onDeployError?: (error: Error) => void` - Error callback
- `className?: string` - Additional CSS classes

**Deployment Options:**
- `autoIncrement`: Auto-increment version number
- `submitToTestFlight`: Submit to TestFlight (iOS)
- `submitToPlayStore`: Submit to Play Store internal testing (Android)

### BuildQueueIndicator

Visual indicator showing position in build queue and estimated wait time.

```tsx
import { BuildQueueIndicator } from '@mobigen/ui';

<BuildQueueIndicator
  queueInfo={{ position: 3, totalInQueue: 10, estimatedWaitTime: 180 }}
  buildId="build-123"
/>
```

**Props:**
- `queueInfo: BuildQueueInfo` - Queue position and timing
- `buildId?: string` - Build ID (optional)
- `className?: string` - Additional CSS classes

**Features:**
- Visual queue position indicator
- Estimated wait time display
- Animated current position
- Build ID display

### PlatformTabs

Switch between iOS and Android build views with build counts.

```tsx
import { PlatformTabs } from '@mobigen/ui';

<PlatformTabs
  selectedPlatform={platform}
  onPlatformChange={(platform) => setPlatform(platform)}
  iosBuildCount={5}
  androidBuildCount={3}
/>
```

**Props:**
- `selectedPlatform: BuildPlatform` - Currently selected platform
- `onPlatformChange: (platform: BuildPlatform) => void` - Platform change callback
- `iosBuildCount?: number` - Number of iOS builds
- `androidBuildCount?: number` - Number of Android builds
- `className?: string` - Additional CSS classes

## Hooks

### useBuildStatus

Fetch and monitor a single build's status with automatic polling.

```tsx
import { useBuildStatus } from '@mobigen/ui';

const { build, isLoading, error, refresh, cancel } = useBuildStatus(buildId);
```

**Returns:**
- `build: Build | null` - Current build state
- `isLoading: boolean` - Loading state
- `error: Error | null` - Error state
- `refresh: () => Promise<void>` - Manual refresh function
- `cancel: () => Promise<void>` - Cancel build function

**Features:**
- Automatic polling for in-progress builds (5s interval)
- Stops polling when build reaches terminal state
- Manual refresh support
- Build cancellation

### useBuildHistory

Fetch and filter build history with pagination support.

```tsx
import { useBuildHistory } from '@mobigen/ui';

const {
  builds,
  isLoading,
  error,
  hasMore,
  filters,
  setFilters,
  loadMore,
  refresh,
} = useBuildHistory(projectId, { platform: 'ios', limit: 20 });
```

**Parameters:**
- `projectId: string` - Project ID
- `initialFilters?: BuildHistoryFilters` - Initial filter state

**Returns:**
- `builds: Build[]` - Array of builds
- `isLoading: boolean` - Loading state
- `error: Error | null` - Error state
- `hasMore: boolean` - More builds available
- `filters: BuildHistoryFilters` - Current filter state
- `setFilters: (filters) => void` - Update filters
- `loadMore: () => Promise<void>` - Load next page
- `refresh: () => Promise<void>` - Refresh list

**Filter Options:**
- `platform?: 'ios' | 'android'` - Filter by platform
- `status?: BuildStatus` - Filter by status
- `limit?: number` - Results per page (default: 20)
- `offset?: number` - Pagination offset

### useDeployment

Trigger and monitor new deployments.

```tsx
import { useDeployment } from '@mobigen/ui';

const { deploy, isDeploying, error, currentBuild } = useDeployment(projectId);

// Trigger deployment
const build = await deploy({
  platform: 'ios',
  autoIncrement: true,
  submitToTestFlight: true,
});
```

**Parameters:**
- `projectId: string` - Project ID

**Returns:**
- `deploy: (options: DeploymentOptions) => Promise<Build>` - Deploy function
- `isDeploying: boolean` - Deployment in progress
- `error: Error | null` - Error state
- `currentBuild: Build | null` - Created build object

### useBuildQueue

Fetch queue information for a build.

```tsx
import { useBuildQueue } from '@mobigen/ui';

const { queueInfo, isLoading, error } = useBuildQueue(buildId);
```

**Returns:**
- `queueInfo: BuildQueueInfo | null` - Queue position and timing
- `isLoading: boolean` - Loading state
- `error: Error | null` - Error state

**Features:**
- Automatic polling (10s interval)
- Queue position tracking
- Estimated wait time

### useBuildUpdates

Subscribe to real-time build updates via WebSocket.

```tsx
import { useBuildUpdates } from '@mobigen/ui';

const { connected } = useBuildUpdates(buildId, (build) => {
  console.log('Build updated:', build);
});
```

**Parameters:**
- `buildId: string | null` - Build ID to monitor
- `onUpdate?: (build: Build) => void` - Update callback

**Returns:**
- `connected: boolean` - WebSocket connection state

**Features:**
- Automatic WebSocket connection
- Real-time build updates
- Automatic reconnection handling
- Falls back to polling if WebSocket unavailable

## Types

### Build

```typescript
interface Build {
  id: string;
  projectId: string;
  version: number;
  platform: 'ios' | 'android';
  status: BuildStatus;

  // EAS integration
  easBuildId?: string;
  easProjectId?: string;

  // Artifacts
  artifactS3Key?: string;
  artifactSizeBytes?: number;

  // Logs
  logsS3Key?: string;
  errorSummary?: string;

  // Validation
  validationTier?: string;
  validationPassed?: boolean;
  validationErrors?: ValidationError[];

  // Timestamps
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;

  // Progress tracking
  progress?: number;
  currentStage?: BuildStage;
  estimatedTimeRemaining?: number;
  queuePosition?: number;
}
```

### BuildStatus

```typescript
type BuildStatus =
  | 'pending'      // Pending validation
  | 'queued'       // In queue
  | 'building'     // Build in progress
  | 'uploading'    // Uploading artifacts
  | 'processing'   // Post-build processing
  | 'ready'        // Completed successfully
  | 'failed'       // Build failed
  | 'cancelled';   // User cancelled
```

### BuildStage

```typescript
type BuildStage =
  | 'queued'
  | 'building'
  | 'uploading'
  | 'processing'
  | 'ready';
```

### ValidationError

```typescript
interface ValidationError {
  file: string;
  line?: number;
  message: string;
  type?: 'error' | 'warning';
}
```

## Installation

```bash
npm install @mobigen/ui
# or
yarn add @mobigen/ui
# or
pnpm add @mobigen/ui
```

## Usage Examples

### Complete Build Dashboard

```tsx
import { useState } from 'react';
import {
  PlatformTabs,
  BuildStatusCard,
  BuildHistoryList,
  BuildDetailsModal,
  DeployButton,
  useBuildHistory,
  useBuildStatus,
  useDeployment,
} from '@mobigen/ui';

export function BuildDashboard({ projectId }: { projectId: string }) {
  const [platform, setPlatform] = useState<'ios' | 'android'>('ios');
  const [selectedBuild, setSelectedBuild] = useState<Build | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    builds,
    isLoading,
    hasMore,
    loadMore,
    setFilters,
  } = useBuildHistory(projectId, { platform });

  const { deploy, isDeploying } = useDeployment(projectId);

  const handleDeploy = async () => {
    await deploy({
      platform,
      autoIncrement: true,
      submitToTestFlight: platform === 'ios',
    });
  };

  const handleBuildClick = (build: Build) => {
    setSelectedBuild(build);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Platform Tabs */}
      <PlatformTabs
        selectedPlatform={platform}
        onPlatformChange={(p) => {
          setPlatform(p);
          setFilters({ platform: p });
        }}
      />

      {/* Deploy Button */}
      <DeployButton
        projectId={projectId}
        platform={platform}
        disabled={isDeploying}
        onDeployStart={(buildId) => console.log('Build started:', buildId)}
      />

      {/* Current Build (if in progress) */}
      {builds[0] && ['queued', 'building', 'uploading', 'processing'].includes(builds[0].status) && (
        <BuildStatusCard
          build={builds[0]}
          onViewDetails={() => handleBuildClick(builds[0])}
        />
      )}

      {/* Build History */}
      <BuildHistoryList
        builds={builds}
        isLoading={isLoading}
        hasMore={hasMore}
        onLoadMore={loadMore}
        onBuildClick={handleBuildClick}
      />

      {/* Build Details Modal */}
      <BuildDetailsModal
        build={selectedBuild}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
```

### Real-time Build Monitor

```tsx
import { useEffect } from 'react';
import {
  BuildStatusCard,
  BuildProgressBar,
  BuildQueueIndicator,
  useBuildStatus,
  useBuildQueue,
  useBuildUpdates,
} from '@mobigen/ui';

export function BuildMonitor({ buildId }: { buildId: string }) {
  const { build, cancel } = useBuildStatus(buildId);
  const { queueInfo } = useBuildQueue(buildId);

  // Real-time updates
  const { connected } = useBuildUpdates(buildId, (updatedBuild) => {
    console.log('Build updated via WebSocket:', updatedBuild);
  });

  if (!build) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Queue Info (for queued builds) */}
      {build.status === 'queued' && queueInfo && (
        <BuildQueueIndicator queueInfo={queueInfo} buildId={buildId} />
      )}

      {/* Build Status */}
      <BuildStatusCard
        build={build}
        onCancel={cancel}
      />

      {/* Progress Bar (for in-progress builds) */}
      {['building', 'uploading', 'processing'].includes(build.status) && (
        <BuildProgressBar build={build} showStages={true} />
      )}

      {/* WebSocket Status */}
      {connected && (
        <p className="text-xs text-green-600">Real-time updates enabled</p>
      )}
    </div>
  );
}
```

## Build Stages

The build process follows these stages:

| Stage | Duration | Description |
|-------|----------|-------------|
| **Queued** | ~1 min | Waiting in build queue |
| **Building** | ~5 min | Compiling and bundling application |
| **Uploading** | ~1 min | Uploading build artifacts to storage |
| **Processing** | ~2 min | Post-build processing and validation |
| **Ready** | - | Build completed successfully |

**Total Average Duration**: ~9 minutes

## Styling

All components use Tailwind CSS classes with dark mode support. The components are fully responsive and follow these design principles:

- **Color Scheme**:
  - Blue: Active states, in-progress builds
  - Green: Success states, completed builds
  - Red: Error states, failed builds
  - Gray: Neutral states, cancelled builds

- **Responsive Design**:
  - Mobile-first approach
  - Breakpoints: `sm`, `md`, `lg`, `xl`
  - Touch-friendly tap targets

- **Dark Mode**:
  - Automatic dark mode support via `dark:` classes
  - Respects system preferences
  - High contrast for accessibility

- **Animations**:
  - Smooth transitions (150-300ms)
  - Loading spinners for async operations
  - Progress bar animations

## API Requirements

These components expect the following API endpoints:

- `GET /api/builds?projectId={id}&platform={platform}&status={status}&limit={n}&offset={n}`
- `GET /api/builds/{buildId}`
- `POST /api/builds/{buildId}/cancel`
- `POST /api/projects/{projectId}/deploy`
- `GET /api/builds/{buildId}/queue`
- `WS /ws/builds/{buildId}` (optional, for real-time updates)

## Environment Variables

```bash
# API Base URL
NEXT_PUBLIC_API_URL=https://api.mobigen.io

# WebSocket URL (optional)
NEXT_PUBLIC_WS_URL=wss://ws.mobigen.io
```

## License

MIT © Mobigen

## Support

For issues or questions, please open an issue on GitHub or contact support@mobigen.io.
