/**
 * TypeScript types for Connector UI components
 */

/**
 * Connector category for organization
 */
export type ConnectorCategory =
  | 'payments'
  | 'authentication'
  | 'database'
  | 'analytics'
  | 'push_notifications'
  | 'in_app_purchases'
  | 'storage'
  | 'ai'
  | 'other';

/**
 * Connector tier (determines access level)
 */
export type ConnectorTier = 'free' | 'pro' | 'enterprise';

/**
 * Connector installation status
 */
export type ConnectorStatus =
  | 'available'
  | 'installing'
  | 'installed'
  | 'failed'
  | 'uninstalling'
  | 'updating';

/**
 * Connector metadata
 */
export interface ConnectorMetadata {
  id: string;
  name: string;
  description: string;
  category: ConnectorCategory;
  tier: ConnectorTier;
  icon: string;
  providerUrl: string;
  docsUrl?: string;
  version: string;
  platforms: ('ios' | 'android' | 'web')[];
  tags: string[];
}

/**
 * Credential field type
 */
export type CredentialFieldType = 'text' | 'password' | 'url' | 'file' | 'select';

/**
 * Credential field definition
 */
export interface CredentialField {
  key: string;
  label: string;
  description?: string;
  type: CredentialFieldType;
  required: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];
  instructionsUrl?: string;
}

/**
 * Connection test result
 */
export interface ConnectionTestResult {
  success: boolean;
  durationMs: number;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Installed connector info
 */
export interface InstalledConnector {
  connectorId: string;
  name: string;
  icon: string;
  status: ConnectorStatus;
  installedAt: Date;
  lastTestedAt?: Date;
  config?: Record<string, any>;
  errorMessage?: string;
}

/**
 * Setup wizard step
 */
export interface SetupWizardStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<any>;
}

/**
 * ConnectorCard component props
 */
export interface ConnectorCardProps {
  connector: ConnectorMetadata;
  projectId: string;
  isInstalled: boolean;
  onInstall?: () => void;
  onConfigure?: () => void;
}

/**
 * ConnectorList component props
 */
export interface ConnectorListProps {
  projectId: string;
  category?: ConnectorCategory;
  tier?: ConnectorTier;
  searchQuery?: string;
  onConnectorSelect?: (connectorId: string) => void;
}

/**
 * ConnectorConfigModal component props
 */
export interface ConnectorConfigModalProps {
  connector: ConnectorMetadata;
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * InstalledConnectorCard component props
 */
export interface InstalledConnectorCardProps {
  connector: InstalledConnector;
  projectId: string;
  onReconfigure?: () => void;
  onUninstall?: () => void;
  onTest?: () => void;
}

/**
 * ConnectorSetupWizard component props
 */
export interface ConnectorSetupWizardProps {
  connector: ConnectorMetadata;
  projectId: string;
  onComplete: () => void;
  onCancel: () => void;
}

/**
 * Connector details (with credential fields)
 */
export interface ConnectorDetails extends ConnectorMetadata {
  credentialFields: CredentialField[];
  dependencies: Array<{ package: string; version: string }>;
  envVars: Array<{ key: string; description: string; required: boolean }>;
}
