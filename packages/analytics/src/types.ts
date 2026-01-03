/**
 * Analytics SDK Types
 */

export interface AnalyticsConfig {
  projectId: string;
  apiKey: string;
  endpoint?: string;
  autoTrack?: AutoTrackConfig;
  debug?: boolean;
  maxQueueSize?: number;
  flushInterval?: number;
  maxBatchSize?: number;
}

export interface AutoTrackConfig {
  screens?: boolean;
  taps?: boolean;
  errors?: boolean;
  performance?: boolean;
  sessions?: boolean;
}

export interface EventProperties {
  [key: string]: string | number | boolean | null | undefined;
}

export interface UserTraits {
  [key: string]: string | number | boolean | null | undefined;
}

export interface AnalyticsEvent {
  id: string;
  type: 'track' | 'screen' | 'identify' | 'page';
  name: string;
  properties?: EventProperties;
  userId?: string;
  anonymousId: string;
  timestamp: string;
  context: EventContext;
}

export interface EventContext {
  app: AppContext;
  device: DeviceContext;
  os: OSContext;
  screen?: ScreenContext;
  network?: NetworkContext;
  locale?: string;
  timezone?: string;
}

export interface AppContext {
  name: string;
  version: string;
  build: string;
  namespace: string;
}

export interface DeviceContext {
  id: string;
  manufacturer?: string;
  model?: string;
  name?: string;
  type: 'ios' | 'android' | 'web';
}

export interface OSContext {
  name: string;
  version: string;
}

export interface ScreenContext {
  width: number;
  height: number;
  density: number;
}

export interface NetworkContext {
  carrier?: string;
  cellular: boolean;
  wifi: boolean;
}

export interface SessionInfo {
  sessionId: string;
  startedAt: string;
  lastActivityAt: string;
  eventCount: number;
}

export interface AnalyticsPlugin {
  name: string;
  track?: (event: AnalyticsEvent) => void | Promise<void>;
  screen?: (screenName: string, properties?: EventProperties) => void | Promise<void>;
  identify?: (userId: string, traits?: UserTraits) => void | Promise<void>;
}
