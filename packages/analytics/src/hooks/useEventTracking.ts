/**
 * useEventTracking Hook
 *
 * Helper hook for tracking events with memoization
 */

import { useCallback } from 'react';
import { MobigenAnalytics } from '../analytics';
import type { EventProperties } from '../types';

export interface UseEventTrackingReturn {
  trackEvent: (eventName: string, properties?: EventProperties) => Promise<void>;
}

/**
 * Hook for tracking custom events
 *
 * @example
 * ```tsx
 * const { trackEvent } = useEventTracking();
 *
 * const handlePurchase = () => {
 *   trackEvent('purchase_completed', {
 *     orderId: order.id,
 *     total: order.total,
 *   });
 * };
 * ```
 */
export function useEventTracking(): UseEventTrackingReturn {
  const analytics = MobigenAnalytics.getInstance();

  const trackEvent = useCallback(
    async (eventName: string, properties?: EventProperties) => {
      await analytics.track(eventName, properties);
    },
    []
  );

  return { trackEvent };
}

/**
 * Hook for tracking a specific event with predefined properties
 *
 * Useful for tracking the same event multiple times with varying properties
 *
 * @example
 * ```tsx
 * const trackButtonClick = useTrackedEvent('button_clicked');
 *
 * <Button onPress={() => trackButtonClick({ buttonName: 'submit' })} />
 * ```
 */
export function useTrackedEvent(
  eventName: string,
  baseProperties?: EventProperties
): (properties?: EventProperties) => Promise<void> {
  const analytics = MobigenAnalytics.getInstance();

  return useCallback(
    async (properties?: EventProperties) => {
      await analytics.track(eventName, {
        ...baseProperties,
        ...properties,
      });
    },
    [eventName, baseProperties]
  );
}
