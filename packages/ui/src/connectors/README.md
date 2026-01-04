# Connector UI Components

React components and hooks for managing third-party service integrations in the Mobigen dashboard.

## Components

### ConnectorCard

Individual connector display card showing icon, name, description, category, tier, and action buttons.

```tsx
import { ConnectorCard } from '@mobigen/ui';

<ConnectorCard
  connector={stripeConnector}
  projectId="proj_123"
  isInstalled={false}
  onInstall={() => openModal()}
  onConfigure={() => openConfig()}
/>
```

**Features:**
- Icon and branding display
- Category and tier badges
- Platform indicators (iOS, Android, Web)
- Install/Configure buttons
- Documentation links
- Dark mode support

### ConnectorList

Browse and filter available connectors with category tabs and search.

```tsx
import { ConnectorList } from '@mobigen/ui';

<ConnectorList
  projectId="proj_123"
  category="payments"
  onConnectorSelect={(id) => handleSelect(id)}
/>
```

**Features:**
- Category filtering with tabs
- Search functionality
- Grid layout (responsive)
- Loading skeleton
- Empty states
- Dark mode support

### ConnectorConfigModal

Multi-step modal wizard for connector installation.

```tsx
import { ConnectorConfigModal } from '@mobigen/ui';

<ConnectorConfigModal
  connector={stripeConnector}
  projectId="proj_123"
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onSuccess={() => refetchConnectors()}
/>
```

**Steps:**
1. Enter credentials
2. Test connection
3. Install connector
4. Success/error handling

**Features:**
- Progress bar
- Field validation
- Connection testing
- Error handling with retry
- Troubleshooting tips
- Dark mode support

### InstalledConnectorCard

Display and manage installed connectors with status indicators and actions.

```tsx
import { InstalledConnectorCard } from '@mobigen/ui';

<InstalledConnectorCard
  connector={installedStripe}
  projectId="proj_123"
  onReconfigure={() => openConfig()}
  onUninstall={() => confirmUninstall()}
  onTest={() => testConnection()}
/>
```

**Features:**
- Status badges (installed, failed, etc.)
- Last tested timestamp
- Quick action buttons
- Error message display
- Relative time formatting
- Dark mode support

### ConnectorSetupWizard

Full-page step-by-step connector setup flow.

```tsx
import { ConnectorSetupWizard } from '@mobigen/ui';

<ConnectorSetupWizard
  connector={stripeConnector}
  projectId="proj_123"
  onComplete={() => navigateToDashboard()}
  onCancel={() => closeWizard()}
/>
```

**Steps:**
1. Select connector (overview)
2. Enter credentials
3. Test connection
4. Install
5. Complete (success)

**Features:**
- Visual step progress
- Step validation
- Back/forward navigation
- Connector metadata display
- Dark mode support

## Hooks

### useConnectors

Fetch available connectors with filtering.

```tsx
import { useConnectors } from '@mobigen/ui';

const { data: connectors, isLoading, error, refetch } = useConnectors({
  projectId: 'proj_123',
  category: 'payments',
  tier: 'free',
  search: 'stripe',
});
```

### useInstalledConnectors

Fetch installed connectors for a project.

```tsx
import { useInstalledConnectors } from '@mobigen/ui';

const { data: installed, isLoading, error } = useInstalledConnectors({
  projectId: 'proj_123',
});
```

### useConnectorInstall

Install a connector with credentials.

```tsx
import { useConnectorInstall } from '@mobigen/ui';

const { install, isInstalling, error } = useConnectorInstall();

await install({
  projectId: 'proj_123',
  connectorId: 'stripe',
  credentials: { apiKey: 'sk_test_...' },
});
```

### useConnectorUninstall

Uninstall a connector from a project.

```tsx
import { useConnectorUninstall } from '@mobigen/ui';

const { uninstall, isUninstalling } = useConnectorUninstall();

await uninstall({
  projectId: 'proj_123',
  connectorId: 'stripe',
});
```

### useTestConnection

Test connector credentials before installation.

```tsx
import { useTestConnection } from '@mobigen/ui';

const { testConnection, isTesting, result } = useTestConnection();

const result = await testConnection({
  connectorId: 'stripe',
  credentials: { apiKey: 'sk_test_...' },
});

if (result.success) {
  console.log('Connection successful!');
}
```

### useConnectorDetails

Fetch connector details including credential fields.

```tsx
import { useConnectorDetails } from '@mobigen/ui';

const { data: details, isLoading } = useConnectorDetails({
  connectorId: 'stripe',
});

// details.credentialFields contains form field definitions
```

## Types

All TypeScript types are exported from the package:

```tsx
import type {
  ConnectorMetadata,
  ConnectorCategory,
  ConnectorTier,
  CredentialField,
  InstalledConnector,
  ConnectionTestResult,
} from '@mobigen/ui';
```

## Integration with tRPC/REST API

The hooks currently contain placeholder implementations. Replace the `TODO` sections with your actual API calls:

```tsx
// Example with tRPC
const data = await trpc.connectors.list.query({ category, tier });

// Example with REST
const res = await fetch('/api/connectors');
const data = await res.json();
```

## Styling

All components use:
- TailwindCSS for styling
- Dark mode support via `dark:` classes
- Responsive design breakpoints
- `cn()` utility for class merging
- CVA (Class Variance Authority) patterns

## Accessibility

Components include:
- ARIA labels
- Keyboard navigation
- Focus management
- Screen reader support
- Loading states
- Error states

## Dark Mode

All components support dark mode automatically. No additional configuration needed if your app uses the `dark` class on the root element.

## Dependencies

Required peer dependencies:
- React 18+
- TailwindCSS 3+
- `class-variance-authority`
- Base UI components from `@mobigen/ui`

## Examples

See the technical design document for complete implementation examples and integration patterns.
