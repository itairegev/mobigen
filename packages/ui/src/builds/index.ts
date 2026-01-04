/**
 * Build Status Dashboard Components
 * Export all build-related UI components, hooks, and types
 */

// Components
export { BuildStatusCard } from './BuildStatusCard';
export { BuildProgressBar } from './BuildProgressBar';
export { BuildHistoryList } from './BuildHistoryList';
export { BuildDetailsModal } from './BuildDetailsModal';
export { DeployButton } from './DeployButton';
export { BuildQueueIndicator } from './BuildQueueIndicator';
export { PlatformTabs } from './PlatformTabs';

// Hooks
export {
  useBuildStatus,
  useBuildHistory,
  useDeployment,
  useBuildQueue,
  useBuildUpdates,
} from './hooks';

// Types
export type {
  Build,
  BuildPlatform,
  BuildStatus,
  BuildStage,
  ValidationError,
  BuildProgress,
  DeploymentOptions,
  BuildHistoryFilters,
  BuildQueueInfo,
  BuildStatusCardProps,
  BuildProgressBarProps,
  BuildHistoryListProps,
  BuildDetailsModalProps,
  DeployButtonProps,
  BuildQueueIndicatorProps,
  PlatformTabsProps,
  UseBuildStatusReturn,
  UseBuildHistoryReturn,
  UseDeploymentReturn,
  BuildStageConfig,
  BuildStatusConfig,
  BuildGroupByPlatform,
  BuildStatistics,
} from './types';

export { BUILD_STAGES, BUILD_STATUS_CONFIG } from './types';
