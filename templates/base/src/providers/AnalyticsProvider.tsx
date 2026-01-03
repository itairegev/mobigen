/**
 * Analytics Provider Integration for Mobigen Templates
 *
 * This provider wraps the app and initializes Mobigen Analytics.
 * Configuration is automatically injected during app generation.
 */

import { AnalyticsProvider as MobigenAnalyticsProvider } from '@mobigen/analytics';
import type { ReactNode } from 'react';

interface AnalyticsProviderProps {
  children: ReactNode;
}

/**
 * Analytics configuration - automatically set during generation
 * DO NOT EDIT: These values are populated by the Mobigen generation process
 */
const ANALYTICS_CONFIG = {
  projectId: process.env.EXPO_PUBLIC_MOBIGEN_PROJECT_ID || '__PROJECT_ID__',
  apiKey: process.env.EXPO_PUBLIC_MOBIGEN_ANALYTICS_KEY || '__ANALYTICS_KEY__',
  debug: __DEV__,
  autoTrack: {
    screens: true,
    sessions: true,
    errors: true,
    performance: false,
    taps: false,
  },
};

/**
 * Wraps the app with Mobigen Analytics
 *
 * @example
 * ```tsx
 * export default function RootLayout() {
 *   return (
 *     <AnalyticsProvider>
 *       <Stack />
 *     </AnalyticsProvider>
 *   );
 * }
 * ```
 */
export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  return (
    <MobigenAnalyticsProvider config={ANALYTICS_CONFIG}>
      {children}
    </MobigenAnalyticsProvider>
  );
}
