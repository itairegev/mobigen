// Utility
export { cn } from './utils/cn';

// Components
export { Avatar } from './components/Avatar';
export type { AvatarProps } from './components/Avatar';

export { Badge } from './components/Badge';
export type { BadgeProps } from './components/Badge';

export { Button } from './components/Button';
export type { ButtonProps } from './components/Button';

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './components/Card';
export type {
  CardProps,
  CardHeaderProps,
  CardTitleProps,
  CardDescriptionProps,
  CardContentProps,
  CardFooterProps,
} from './components/Card';

export { Input } from './components/Input';
export type { InputProps } from './components/Input';

export {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalContent,
  ModalFooter,
} from './components/Modal';
export type {
  ModalProps,
  ModalHeaderProps,
  ModalTitleProps,
  ModalDescriptionProps,
  ModalContentProps,
  ModalFooterProps,
} from './components/Modal';

export { Select } from './components/Select';
export type { SelectProps, SelectOption } from './components/Select';

export { Spinner } from './components/Spinner';
export type { SpinnerProps } from './components/Spinner';

export { Tabs, TabsList, TabsTrigger, TabsContent } from './components/Tabs';
export type {
  TabsProps,
  TabsListProps,
  TabsTriggerProps,
  TabsContentProps,
} from './components/Tabs';

export { Toast, ToastContainer, useToast } from './components/Toast';
export type { ToastProps, ToastContainerProps, Toast as ToastType } from './components/Toast';

// GitHub Integration Components
export {
  GitHubConnectionCard,
  SyncStatusIndicator,
  LastSyncInfo,
  SyncHistoryList,
  ConnectGitHubButton,
  SyncActionsMenu,
  useGitHubConnection,
  useSyncStatus,
  useSyncHistory,
  useRealtimeSyncStatus,
  useGitHubOAuth,
} from './github';
export type {
  GitHubConnectionStatus,
  SyncStatus,
  GitHubConnectionData,
  ProjectGitHubData,
  SyncHistoryEntry,
  SyncAction,
  OAuthFlowState,
  GitHubConnectionCardProps,
  SyncStatusIndicatorProps,
  LastSyncInfoProps,
  SyncHistoryListProps,
  ConnectGitHubButtonProps,
  SyncActionsMenuProps,
  GitHubHookConfig,
  HookResult,
} from './github';

// Build Status Dashboard Components
export {
  BuildStatusCard,
  BuildProgressBar,
  BuildHistoryList,
  BuildDetailsModal,
  DeployButton,
  BuildQueueIndicator,
  PlatformTabs,
  useBuildStatus,
  useBuildHistory,
  useDeployment,
  useBuildQueue,
  useBuildUpdates,
  BUILD_STAGES,
  BUILD_STATUS_CONFIG,
} from './builds';
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
} from './builds';
