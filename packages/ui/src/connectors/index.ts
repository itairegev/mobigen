/**
 * Connector UI Components
 *
 * Components and hooks for managing third-party integrations
 * in the Mobigen dashboard.
 */

// Types
export type {
  ConnectorCategory,
  ConnectorTier,
  ConnectorStatus,
  ConnectorMetadata,
  CredentialFieldType,
  CredentialField,
  ConnectionTestResult,
  InstalledConnector,
  SetupWizardStep,
  ConnectorCardProps,
  ConnectorListProps,
  ConnectorConfigModalProps,
  InstalledConnectorCardProps,
  ConnectorSetupWizardProps,
  ConnectorDetails,
} from './types';

// Components
export { ConnectorCard } from './ConnectorCard';
export { ConnectorList } from './ConnectorList';
export { ConnectorConfigModal } from './ConnectorConfigModal';
export { InstalledConnectorCard } from './InstalledConnectorCard';
export { ConnectorSetupWizard } from './ConnectorSetupWizard';

// Hooks
export {
  useConnectors,
  useInstalledConnectors,
  useConnectorInstall,
  useConnectorUninstall,
  useTestConnection,
  useConnectorDetails,
} from './hooks';
export type { ConnectorHookConfig, HookResult } from './hooks';
