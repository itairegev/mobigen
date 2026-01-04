import * as React from 'react';
import { cn } from '../utils/cn';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import type { ConnectorSetupWizardProps } from './types';

type WizardStep = 'select' | 'credentials' | 'test' | 'install' | 'complete';

/**
 * ConnectorSetupWizard - Step-by-step connector setup flow
 *
 * Guides users through the complete connector installation process
 * with clear progress indication and validation at each step.
 *
 * @example
 * ```tsx
 * <ConnectorSetupWizard
 *   connector={stripeConnector}
 *   projectId="proj_123"
 *   onComplete={() => navigateToDashboard()}
 *   onCancel={() => closeWizard()}
 * />
 * ```
 */
export const ConnectorSetupWizard = React.forwardRef<HTMLDivElement, ConnectorSetupWizardProps>(
  ({ connector, projectId, onComplete, onCancel, ...props }, ref) => {
    const [currentStep, setCurrentStep] = React.useState<WizardStep>('select');
    const [credentials, setCredentials] = React.useState<Record<string, string>>({});

    const steps: Array<{
      id: WizardStep;
      title: string;
      description: string;
      icon: string;
    }> = [
      {
        id: 'select',
        title: 'Select Connector',
        description: 'Choose the service to integrate',
        icon: '🔌',
      },
      {
        id: 'credentials',
        title: 'Enter Credentials',
        description: 'Provide your API credentials',
        icon: '🔑',
      },
      {
        id: 'test',
        title: 'Test Connection',
        description: 'Verify credentials work',
        icon: '🔌',
      },
      {
        id: 'install',
        title: 'Install',
        description: 'Generate integration code',
        icon: '📦',
      },
      {
        id: 'complete',
        title: 'Complete',
        description: 'Setup finished',
        icon: '✅',
      },
    ];

    const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

    const goToNextStep = () => {
      const nextIndex = currentStepIndex + 1;
      if (nextIndex < steps.length) {
        setCurrentStep(steps[nextIndex].id);
      }
    };

    const goToPreviousStep = () => {
      const prevIndex = currentStepIndex - 1;
      if (prevIndex >= 0) {
        setCurrentStep(steps[prevIndex].id);
      }
    };

    const canGoNext = () => {
      switch (currentStep) {
        case 'select':
          return true;
        case 'credentials':
          // In real implementation, validate all required credentials
          return Object.keys(credentials).length > 0;
        default:
          return false;
      }
    };

    return (
      <div
        ref={ref}
        className="max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-lg shadow-lg"
        {...props}
      >
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center gap-4">
            <div className="text-4xl">{connector.icon}</div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Setup {connector.name}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {connector.description}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-8 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const isActive = index === currentStepIndex;
              const isCompleted = index < currentStepIndex;
              const isUpcoming = index > currentStepIndex;

              return (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={cn(
                        'flex h-12 w-12 items-center justify-center rounded-full text-xl transition-all',
                        isActive && 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900',
                        isCompleted && 'bg-green-600 text-white',
                        isUpcoming && 'bg-gray-200 text-gray-400 dark:bg-gray-800 dark:text-gray-600'
                      )}
                    >
                      {isCompleted ? '✓' : step.icon}
                    </div>
                    <div className="text-center">
                      <div
                        className={cn(
                          'text-sm font-medium',
                          isActive && 'text-blue-600 dark:text-blue-400',
                          isCompleted && 'text-green-600 dark:text-green-400',
                          isUpcoming && 'text-gray-400 dark:text-gray-600'
                        )}
                      >
                        {step.title}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 hidden md:block">
                        {step.description}
                      </div>
                    </div>
                  </div>

                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        'flex-1 h-0.5 mx-4',
                        isCompleted
                          ? 'bg-green-600'
                          : 'bg-gray-200 dark:bg-gray-800'
                      )}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="px-6 py-8 min-h-[300px]">
          {/* Step 1: Select */}
          {currentStep === 'select' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Connector Selected
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  You've selected {connector.name}. This connector will add the following capabilities:
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Category:
                  </span>
                  <Badge variant="outline">{connector.category}</Badge>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Platforms:
                  </span>
                  <div className="flex gap-2">
                    {connector.platforms.map((platform) => (
                      <Badge key={platform} variant="outline">
                        {platform}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Version:
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {connector.version}
                  </span>
                </div>
              </div>

              <div className="rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900 p-4">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                  What happens next?
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                  <li>You'll enter your {connector.name} credentials</li>
                  <li>We'll test the connection to verify everything works</li>
                  <li>The connector will be installed in your project</li>
                  <li>Generated code will be validated automatically</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 2: Credentials */}
          {currentStep === 'credentials' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Enter Your Credentials
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Provide your {connector.name} API credentials. These will be encrypted and stored securely.
                </p>
              </div>

              {/* Placeholder credential form - in real implementation,
                  this would render actual credential fields */}
              <div className="space-y-4 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Credential fields would be rendered here based on connector configuration.
                </p>
              </div>

              {connector.docsUrl && (
                <div className="rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    Need help finding your credentials?
                  </p>
                  <a
                    href={connector.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    View {connector.name} documentation →
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Test */}
          {currentStep === 'test' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="animate-spin text-6xl">🔌</div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Testing Connection
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Verifying your credentials with {connector.name}...
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Install */}
          {currentStep === 'install' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="animate-pulse text-6xl">📦</div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Installing Connector
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Generating integration code and updating your project...
                </p>
              </div>
            </div>
          )}

          {/* Step 5: Complete */}
          {currentStep === 'complete' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <div className="text-6xl animate-bounce">🎉</div>
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">
                  Setup Complete!
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {connector.name} has been successfully integrated into your project
                </p>
              </div>

              <div className="rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-900 p-6 max-w-md">
                <h4 className="text-sm font-medium text-green-900 dark:text-green-100 mb-3">
                  What's next?
                </h4>
                <ul className="text-sm text-green-800 dark:text-green-200 space-y-2 list-disc list-inside">
                  <li>Generated code is ready to use in your app</li>
                  <li>Check the validation pipeline results</li>
                  <li>Review the generated service files</li>
                  <li>Test the integration in your app</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-800 px-6 py-4">
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={currentStepIndex === 0 ? onCancel : goToPreviousStep}
            >
              {currentStepIndex === 0 ? 'Cancel' : 'Back'}
            </Button>

            {currentStep === 'complete' ? (
              <Button variant="primary" onClick={onComplete}>
                Finish
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={goToNextStep}
                disabled={!canGoNext()}
              >
                {currentStep === 'install' ? 'Installing...' : 'Continue'}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }
);

ConnectorSetupWizard.displayName = 'ConnectorSetupWizard';
