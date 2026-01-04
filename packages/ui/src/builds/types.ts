/**
 * Build Status Dashboard Types
 * TypeScript types for build-related UI components
 */

export type BuildPlatform = 'ios' | 'android';

export type BuildStatus =
  | 'pending'
  | 'queued'
  | 'building'
  | 'uploading'
  | 'processing'
  | 'ready'
  | 'failed'
  | 'cancelled';

export type BuildStage =
  | 'queued'
  | 'building'
  | 'uploading'
  | 'processing'
  | 'ready';

export interface Build {
  id: string;
  projectId: string;
  version: number;
  platform: BuildPlatform;
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
  estimatedTimeRemaining?: number; // in seconds
  queuePosition?: number;
}

export interface ValidationError {
  file: string;
  line?: number;
  message: string;
  type?: 'error' | 'warning';
}

export interface BuildProgress {
  buildId: string;
  stage: BuildStage;
  progress: number; // 0-100
  message?: string;
  estimatedTimeRemaining?: number;
}

export interface DeploymentOptions {
  platform: BuildPlatform;
  version?: number;
  autoIncrement?: boolean;
  submitToTestFlight?: boolean;
  submitToPlayStore?: boolean;
}

export interface BuildHistoryFilters {
  platform?: BuildPlatform;
  status?: BuildStatus;
  limit?: number;
  offset?: number;
}

export interface BuildQueueInfo {
  position: number;
  totalInQueue: number;
  estimatedWaitTime: number; // in seconds
}

// Component Props Types

export interface BuildStatusCardProps {
  build: Build;
  onViewDetails?: (buildId: string) => void;
  onCancel?: (buildId: string) => void;
  className?: string;
}

export interface BuildProgressBarProps {
  build: Build;
  showStages?: boolean;
  showPercentage?: boolean;
  className?: string;
}

export interface BuildHistoryListProps {
  builds: Build[];
  filters?: BuildHistoryFilters;
  onFilterChange?: (filters: BuildHistoryFilters) => void;
  onBuildClick?: (build: Build) => void;
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  className?: string;
}

export interface BuildDetailsModalProps {
  build: Build | null;
  isOpen: boolean;
  onClose: () => void;
  onDownloadArtifact?: (buildId: string) => void;
  onViewLogs?: (buildId: string) => void;
  className?: string;
}

export interface DeployButtonProps {
  projectId: string;
  platform: BuildPlatform;
  disabled?: boolean;
  options?: Partial<DeploymentOptions>;
  onDeployStart?: (buildId: string) => void;
  onDeployError?: (error: Error) => void;
  className?: string;
}

export interface BuildQueueIndicatorProps {
  queueInfo: BuildQueueInfo;
  buildId?: string;
  className?: string;
}

export interface PlatformTabsProps {
  selectedPlatform: BuildPlatform;
  onPlatformChange: (platform: BuildPlatform) => void;
  iosBuildCount?: number;
  androidBuildCount?: number;
  className?: string;
}

// Hook Return Types

export interface UseBuildStatusReturn {
  build: Build | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  cancel: () => Promise<void>;
}

export interface UseBuildHistoryReturn {
  builds: Build[];
  isLoading: boolean;
  error: Error | null;
  hasMore: boolean;
  filters: BuildHistoryFilters;
  setFilters: (filters: BuildHistoryFilters) => void;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

export interface UseDeploymentReturn {
  deploy: (options: DeploymentOptions) => Promise<Build>;
  isDeploying: boolean;
  error: Error | null;
  currentBuild: Build | null;
}

// Stage Configuration

export interface BuildStageConfig {
  label: string;
  description: string;
  estimatedDuration: number; // in seconds
  order: number;
}

export const BUILD_STAGES: Record<BuildStage, BuildStageConfig> = {
  queued: {
    label: 'Queued',
    description: 'Waiting in build queue',
    estimatedDuration: 60,
    order: 0,
  },
  building: {
    label: 'Building',
    description: 'Compiling and bundling',
    estimatedDuration: 300,
    order: 1,
  },
  uploading: {
    label: 'Uploading',
    description: 'Uploading artifacts',
    estimatedDuration: 60,
    order: 2,
  },
  processing: {
    label: 'Processing',
    description: 'Post-build processing',
    estimatedDuration: 120,
    order: 3,
  },
  ready: {
    label: 'Ready',
    description: 'Build completed successfully',
    estimatedDuration: 0,
    order: 4,
  },
};

// Status Configuration

export interface BuildStatusConfig {
  label: string;
  color: string;
  icon: string;
  description: string;
}

export const BUILD_STATUS_CONFIG: Record<BuildStatus, BuildStatusConfig> = {
  pending: {
    label: 'Pending',
    color: 'gray',
    icon: 'clock',
    description: 'Build is pending validation',
  },
  queued: {
    label: 'Queued',
    color: 'blue',
    icon: 'queue',
    description: 'Build is queued',
  },
  building: {
    label: 'Building',
    color: 'blue',
    icon: 'cog',
    description: 'Build in progress',
  },
  uploading: {
    label: 'Uploading',
    color: 'blue',
    icon: 'upload',
    description: 'Uploading build artifacts',
  },
  processing: {
    label: 'Processing',
    color: 'blue',
    icon: 'spinner',
    description: 'Processing build',
  },
  ready: {
    label: 'Ready',
    color: 'green',
    icon: 'check',
    description: 'Build completed successfully',
  },
  failed: {
    label: 'Failed',
    color: 'red',
    icon: 'x',
    description: 'Build failed',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'gray',
    icon: 'ban',
    description: 'Build was cancelled',
  },
};

// Utility Types

export type BuildGroupByPlatform = Record<BuildPlatform, Build[]>;

export interface BuildStatistics {
  total: number;
  successful: number;
  failed: number;
  inProgress: number;
  averageDuration: number; // in seconds
  successRate: number; // 0-100
}
