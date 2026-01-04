import type { CodeGenContext } from '@mobigen/connectors-core';

/**
 * Generate OneSignal provider template
 */
export function onesignalProviderTemplate(ctx: CodeGenContext): string {
  return `// Auto-generated OneSignal provider for ${ctx.projectConfig.appName}
// Generated on ${new Date().toISOString()}
// DO NOT EDIT - This file is managed by Mobigen

import React, { useEffect, createContext, useContext, useState, ReactNode } from 'react';
import { initializeOneSignal, ONESIGNAL_APP_ID } from '../services/onesignal';
import type { DeviceState } from '../types/onesignal';

/**
 * OneSignal context
 */
interface OneSignalContextValue {
  /** Is OneSignal initialized? */
  isInitialized: boolean;

  /** OneSignal App ID */
  appId: string;

  /** Current device state (subscription, user ID, etc.) */
  deviceState: DeviceState | null;
}

const OneSignalContext = createContext<OneSignalContextValue | undefined>(undefined);

/**
 * OneSignal Provider Props
 */
interface OneSignalProviderProps {
  /** Child components */
  children: ReactNode;

  /**
   * Auto-prompt for push permission on mount (iOS only)
   * @default false
   */
  autoPromptForPermission?: boolean;

  /**
   * Log level for debugging
   * 0 = None, 1 = Fatal, 2 = Error, 3 = Warn, 4 = Info, 5 = Debug, 6 = Verbose
   * @default 4 (Info)
   */
  logLevel?: 0 | 1 | 2 | 3 | 4 | 5 | 6;

  /**
   * Callback when OneSignal is initialized
   */
  onInitialized?: () => void;

  /**
   * Callback when initialization fails
   */
  onInitializationError?: (error: Error) => void;
}

/**
 * OneSignal Provider Component
 *
 * Wrap your app with this provider to initialize OneSignal
 *
 * @example
 * ```tsx
 * import { OneSignalProvider } from './providers/OneSignalProvider';
 *
 * export default function App() {
 *   return (
 *     <OneSignalProvider
 *       autoPromptForPermission={true}
 *       logLevel={5}
 *       onInitialized={() => console.log('OneSignal ready!')}
 *     >
 *       <YourApp />
 *     </OneSignalProvider>
 *   );
 * }
 * ```
 */
export function OneSignalProvider({
  children,
  autoPromptForPermission = false,
  logLevel = 4,
  onInitialized,
  onInitializationError,
}: OneSignalProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [deviceState, setDeviceState] = useState<DeviceState | null>(null);

  useEffect(() => {
    // Initialize OneSignal
    const initialize = async () => {
      try {
        // Initialize SDK
        initializeOneSignal({
          logLevel,
          promptForPushNotificationsWithUserResponse: autoPromptForPermission,
        });

        setIsInitialized(true);

        // Call success callback
        if (onInitialized) {
          onInitialized();
        }

        console.log('[OneSignalProvider] Initialization complete');
      } catch (error) {
        console.error('[OneSignalProvider] Initialization failed:', error);

        if (onInitializationError) {
          onInitializationError(error as Error);
        }
      }
    };

    initialize();
  }, [autoPromptForPermission, logLevel, onInitialized, onInitializationError]);

  const contextValue: OneSignalContextValue = {
    isInitialized,
    appId: ONESIGNAL_APP_ID,
    deviceState,
  };

  return (
    <OneSignalContext.Provider value={contextValue}>
      {children}
    </OneSignalContext.Provider>
  );
}

/**
 * Hook to access OneSignal context
 *
 * @example
 * const { isInitialized, appId } = useOneSignalContext();
 */
export function useOneSignalContext() {
  const context = useContext(OneSignalContext);

  if (context === undefined) {
    throw new Error('useOneSignalContext must be used within OneSignalProvider');
  }

  return context;
}
`;
}
