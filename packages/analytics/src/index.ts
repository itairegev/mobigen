/**
 * @mobigen/analytics
 *
 * Analytics SDK for Mobigen generated apps
 *
 * @example
 * ```tsx
 * import { init, track, screen } from '@mobigen/analytics';
 *
 * // Initialize
 * await init({
 *   projectId: 'your-project-id',
 *   apiKey: 'your-api-key',
 *   debug: true,
 * });
 *
 * // Track events
 * track('button_clicked', { button: 'submit' });
 *
 * // Track screens
 * screen('Home');
 * ```
 */

// Core analytics client
export { MobigenAnalytics } from './analytics';

// Singleton methods
export {
  init,
  track,
  screen,
  identify,
  setUserProperties,
  reset,
  flush,
  addPlugin,
  getUserId,
  getAnonymousId,
  getSession,
} from './analytics';

// React hooks
export { useAnalytics } from './hooks/useAnalytics';
export type { UseAnalyticsReturn } from './hooks/useAnalytics';

export { useScreenTracking } from './hooks/useScreenTracking';
export type { UseScreenTrackingOptions } from './hooks/useScreenTracking';

export { useEventTracking, useTrackedEvent } from './hooks/useEventTracking';
export type { UseEventTrackingReturn } from './hooks/useEventTracking';

// Provider
export { AnalyticsProvider, useAnalyticsContext } from './provider/AnalyticsProvider';
export type { AnalyticsProviderProps } from './provider/AnalyticsProvider';

// Types
export type {
  AnalyticsConfig,
  AutoTrackConfig,
  EventProperties,
  UserTraits,
  AnalyticsEvent,
  EventContext,
  AppContext,
  DeviceContext,
  OSContext,
  ScreenContext,
  NetworkContext,
  SessionInfo,
  AnalyticsPlugin,
} from './types';
