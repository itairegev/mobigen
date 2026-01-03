/**
 * AnalyticsProvider
 *
 * React context provider for Mobigen Analytics
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { MobigenAnalytics } from '../analytics';
import type { AnalyticsConfig } from '../types';

interface AnalyticsContextValue {
  initialized: boolean;
  analytics: MobigenAnalytics;
}

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

export interface AnalyticsProviderProps {
  config: AnalyticsConfig;
  children: ReactNode;
}

/**
 * Provider component for Mobigen Analytics
 *
 * Wrap your app root with this provider to enable analytics
 *
 * @example
 * ```tsx
 * <AnalyticsProvider config={{ projectId: 'xxx', apiKey: 'yyy' }}>
 *   <App />
 * </AnalyticsProvider>
 * ```
 */
export function AnalyticsProvider({ config, children }: AnalyticsProviderProps) {
  const [initialized, setInitialized] = useState(false);
  const [analytics] = useState(() => MobigenAnalytics.getInstance());

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        await analytics.init(config);
        if (mounted) {
          setInitialized(true);
        }
      } catch (error) {
        console.error('[AnalyticsProvider] Failed to initialize:', error);
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, [config.projectId, config.apiKey]);

  return (
    <AnalyticsContext.Provider value={{ initialized, analytics }}>
      {children}
    </AnalyticsContext.Provider>
  );
}

/**
 * Hook to access analytics context
 *
 * @throws Error if used outside AnalyticsProvider
 */
export function useAnalyticsContext(): AnalyticsContextValue {
  const context = useContext(AnalyticsContext);

  if (!context) {
    throw new Error('useAnalyticsContext must be used within AnalyticsProvider');
  }

  return context;
}
