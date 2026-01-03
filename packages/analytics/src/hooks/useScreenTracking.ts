/**
 * useScreenTracking Hook
 *
 * Automatically tracks screen views when a component mounts
 */

import { useEffect } from 'react';
import { MobigenAnalytics } from '../analytics';
import type { EventProperties } from '../types';

export interface UseScreenTrackingOptions {
  screenName: string;
  properties?: EventProperties;
  enabled?: boolean;
}

export function useScreenTracking(options: UseScreenTrackingOptions): void;
export function useScreenTracking(screenName: string, properties?: EventProperties): void;
export function useScreenTracking(
  optionsOrScreenName: UseScreenTrackingOptions | string,
  properties?: EventProperties
): void {
  const analytics = MobigenAnalytics.getInstance();

  useEffect(() => {
    // Handle both function signatures
    let screenName: string;
    let props: EventProperties | undefined;
    let enabled = true;

    if (typeof optionsOrScreenName === 'string') {
      screenName = optionsOrScreenName;
      props = properties;
    } else {
      screenName = optionsOrScreenName.screenName;
      props = optionsOrScreenName.properties;
      enabled = optionsOrScreenName.enabled ?? true;
    }

    if (!enabled) {
      return;
    }

    // Track screen view
    analytics.screen(screenName, props);
  }, [
    typeof optionsOrScreenName === 'string'
      ? optionsOrScreenName
      : optionsOrScreenName.screenName,
  ]);
}
