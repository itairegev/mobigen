/**
 * useAnalytics Hook
 *
 * Provides access to analytics methods in React components
 */

import { useCallback } from 'react';
import { MobigenAnalytics } from '../analytics';
import type { EventProperties, UserTraits } from '../types';

export interface UseAnalyticsReturn {
  track: (eventName: string, properties?: EventProperties) => Promise<void>;
  screen: (screenName: string, properties?: EventProperties) => Promise<void>;
  identify: (userId: string, traits?: UserTraits) => Promise<void>;
  setUserProperties: (properties: UserTraits) => Promise<void>;
  reset: () => Promise<void>;
  flush: () => Promise<void>;
  getUserId: () => string | null;
  getAnonymousId: () => string | null;
}

export function useAnalytics(): UseAnalyticsReturn {
  const analytics = MobigenAnalytics.getInstance();

  const track = useCallback(
    async (eventName: string, properties?: EventProperties) => {
      await analytics.track(eventName, properties);
    },
    []
  );

  const screen = useCallback(
    async (screenName: string, properties?: EventProperties) => {
      await analytics.screen(screenName, properties);
    },
    []
  );

  const identify = useCallback(async (userId: string, traits?: UserTraits) => {
    await analytics.identify(userId, traits);
  }, []);

  const setUserProperties = useCallback(async (properties: UserTraits) => {
    await analytics.setUserProperties(properties);
  }, []);

  const reset = useCallback(async () => {
    await analytics.reset();
  }, []);

  const flush = useCallback(async () => {
    await analytics.flush();
  }, []);

  const getUserId = useCallback(() => {
    return analytics.getUserId();
  }, []);

  const getAnonymousId = useCallback(() => {
    return analytics.getAnonymousId();
  }, []);

  return {
    track,
    screen,
    identify,
    setUserProperties,
    reset,
    flush,
    getUserId,
    getAnonymousId,
  };
}
