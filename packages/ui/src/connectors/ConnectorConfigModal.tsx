import * as React from 'react';
import { cn } from '../utils/cn';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from '../components/Modal';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Badge } from '../components/Badge';
import { useConnectorInstall, useTestConnection } from './hooks';
import type { ConnectorConfigModalProps, CredentialField } from './types';

type Step = 'credentials' | 'testing' | 'installing' | 'success' | 'error';

/**
 * ConnectorConfigModal - Configuration wizard for installing connectors
 *
 * Multi-step modal that guides users through:
 * 1. Entering credentials
 * 2. Testing connection
 * 3. Installing the connector
 * 4. Success/error handling
 *
 * @example
 * ```tsx
 * <ConnectorConfigModal
 *   connector={stripeConnector}
 *   projectId="proj_123"
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   onSuccess={() => refetchConnectors()}
 * />
 * ```
 */
export const ConnectorConfigModal = React.forwardRef<HTMLDivElement, ConnectorConfigModalProps>(
  ({ connector, projectId, isOpen, onClose, onSuccess, ...props }, ref) => {
    const [step, setStep] = React.useState<Step>('credentials');
    const [credentials, setCredentials] = React.useState<Record<string, string>>({});
    const [validationErrors, setValidationErrors] = React.useState<Record<string, string>>({});

    const { install, isInstalling, error: installError } = useConnectorInstall();
    const { testConnection, isTesting, result: testResult } = useTestConnection();

    // Reset state when modal opens
    React.useEffect(() => {
      if (isOpen) {
        setStep('credentials');
        setCredentials({});
        setValidationErrors({});
      }
    }, [isOpen]);

    const validateCredentials = (): boolean => {
      const errors: Record<string, string> = {};

      // Note: Actual validation would use connector.credentialFields
      // This is a placeholder implementation
      const requiredFields = ['apiKey']; // Example

      requiredFields.forEach((field) => {
        if (!credentials[field] || credentials[field].trim() === '') {
          errors[field] = 'This field is required';
        }
      });

      setValidationErrors(errors);
      return Object.keys(errors).length === 0;
    };

    const handleTestConnection = async () => {
      if (!validateCredentials()) {
        return;
      }

      setStep('testing');

      try {
        const result = await testConnection({
          connectorId: connector.id,
          credentials,
        });

        if (result.success) {
          handleInstall();
        } else {
          setStep('error');
        }
      } catch (error) {
        setStep('error');
      }
    };

    const handleInstall = async () => {
      setStep('installing');

      try {
        await install({
          projectId,
          connectorId: connector.id,
          credentials,
        });

        setStep('success');

        // Auto-close after success
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 2000);
      } catch (error) {
        setStep('error');
      }
    };

    const handleRetry = () => {
      setStep('credentials');
      setValidationErrors({});
    };

    const renderCredentialField = (field: CredentialField) => {
      const hasError = !!validationErrors[field.key];

      return (
        <div key={field.key} className="space-y-2">
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>

          {field.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {field.description}
            </p>
          )}

          {field.type === 'select' ? (
            <Select
              value={credentials[field.key] || ''}
              onChange={(value) =>
                setCredentials({ ...credentials, [field.key]: value })
              }
              options={field.options || []}
              className={cn(hasError && 'border-red-500')}
            />
          ) : field.type === 'file' ? (
            <Input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    setCredentials({
                      ...credentials,
                      [field.key]: event.target?.result as string,
                    });
                  };
                  reader.readAsText(file);
                }
              }}
              className={cn(hasError && 'border-red-500')}
            />
          ) : (
            <Input
              type={field.type === 'password' ? 'password' : field.type === 'url' ? 'url' : 'text'}
              value={credentials[field.key] || ''}
              onChange={(e) =>
                setCredentials({ ...credentials, [field.key]: e.target.value })
              }
              placeholder={field.placeholder}
              className={cn(hasError && 'border-red-500')}
            />
          )}

          {hasError && (
            <p className="text-xs text-red-500 dark:text-red-400">
              {validationErrors[field.key]}
            </p>
          )}

          {field.instructionsUrl && (
            <a
              href={field.instructionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center gap-1"
            >
              How to get this credential
              <span>→</span>
            </a>
          )}
        </div>
      );
    };

    return (
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent ref={ref} className="max-w-2xl" {...props}>
          <ModalHeader>
            <div className="flex items-center gap-4">
              <div className="text-4xl">{connector.icon}</div>
              <div className="flex-1">
                <ModalTitle>Configure {connector.name}</ModalTitle>
                <ModalDescription>
                  {step === 'credentials' && 'Enter your credentials to get started'}
                  {step === 'testing' && 'Testing connection...'}
                  {step === 'installing' && 'Installing connector...'}
                  {step === 'success' && 'Connector installed successfully!'}
                  {step === 'error' && 'Installation failed'}
                </ModalDescription>
              </div>
            </div>
          </ModalHeader>

          {/* Progress Bar */}
          <div className="flex items-center gap-2 px-6 mb-6">
            <div
              className={cn(
                'flex-1 h-1 rounded transition-colors',
                step !== 'credentials' ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
              )}
            />
            <div
              className={cn(
                'flex-1 h-1 rounded transition-colors',
                step === 'installing' || step === 'success'
                  ? 'bg-blue-600'
                  : 'bg-gray-200 dark:bg-gray-700'
              )}
            />
            <div
              className={cn(
                'flex-1 h-1 rounded transition-colors',
                step === 'success' ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
              )}
            />
          </div>

          <div className="px-6 pb-6">
            {/* Step: Credentials */}
            {step === 'credentials' && (
              <div className="space-y-4">
                {/* Placeholder for credential fields - in real implementation,
                    this would map over connector.credentialFields */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                    API Key <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="password"
                    placeholder="Enter your API key"
                    value={credentials.apiKey || ''}
                    onChange={(e) =>
                      setCredentials({ ...credentials, apiKey: e.target.value })
                    }
                    className={cn(validationErrors.apiKey && 'border-red-500')}
                  />
                  {validationErrors.apiKey && (
                    <p className="text-xs text-red-500">{validationErrors.apiKey}</p>
                  )}
                </div>
              </div>
            )}

            {/* Step: Testing */}
            {step === 'testing' && (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="animate-spin text-4xl">⚙️</div>
                <div className="text-center space-y-2">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                    Testing Connection
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Verifying your credentials...
                  </p>
                </div>
              </div>
            )}

            {/* Step: Installing */}
            {step === 'installing' && (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="animate-pulse text-4xl">📦</div>
                <div className="text-center space-y-2">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                    Installing Connector
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Generating code and configuring your app...
                  </p>
                </div>
              </div>
            )}

            {/* Step: Success */}
            {step === 'success' && (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="text-6xl animate-bounce">✅</div>
                <div className="text-center space-y-2">
                  <h3 className="font-semibold text-lg text-green-600 dark:text-green-400">
                    Connector Installed!
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {connector.name} has been successfully added to your project
                  </p>
                </div>
              </div>
            )}

            {/* Step: Error */}
            {step === 'error' && (
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <div className="text-6xl">❌</div>
                  <div className="text-center space-y-2">
                    <h3 className="font-semibold text-lg text-red-600 dark:text-red-400">
                      Installation Failed
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {installError || testResult?.error || 'An unexpected error occurred'}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
                  <h4 className="font-medium text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                    Troubleshooting Tips:
                  </h4>
                  <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1 list-disc list-inside">
                    <li>Verify your API credentials are correct</li>
                    <li>Check that your account has the necessary permissions</li>
                    <li>Ensure you're using the correct environment (test/production)</li>
                    {connector.docsUrl && (
                      <li>
                        <a
                          href={connector.docsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-yellow-900 dark:hover:text-yellow-100"
                        >
                          View {connector.name} documentation
                        </a>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            )}
          </div>

          <ModalFooter>
            {step === 'credentials' && (
              <>
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleTestConnection}
                  isLoading={isTesting}
                >
                  Test & Install
                </Button>
              </>
            )}

            {step === 'error' && (
              <>
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleRetry}>
                  Try Again
                </Button>
              </>
            )}

            {step === 'success' && (
              <Button variant="primary" onClick={onClose} className="w-full">
                Done
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  }
);

ConnectorConfigModal.displayName = 'ConnectorConfigModal';
