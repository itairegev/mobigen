/**
 * Analytics Event Types
 *
 * Defines the schema for events sent from generated mobile apps.
 */

export interface BaseEvent {
  /** Event type identifier */
  type: string;
  /** Unique event ID */
  eventId: string;
  /** User ID (anonymous or authenticated) */
  userId?: string;
  /** Session ID */
  sessionId: string;
  /** Project/App ID */
  projectId: string;
  /** Timestamp (ISO 8601) */
  timestamp: string;
  /** Event properties */
  properties?: Record<string, unknown>;
  /** Device information */
  device?: DeviceInfo;
  /** Geo information (enriched server-side) */
  geo?: GeoInfo;
}

export interface DeviceInfo {
  /** Platform: ios, android, web */
  platform: 'ios' | 'android' | 'web';
  /** OS version */
  osVersion?: string;
  /** App version */
  appVersion?: string;
  /** Device model */
  model?: string;
  /** Screen dimensions */
  screenWidth?: number;
  screenHeight?: number;
  /** Device locale */
  locale?: string;
  /** Timezone */
  timezone?: string;
  /** Network type: wifi, cellular, none */
  networkType?: 'wifi' | 'cellular' | 'none' | 'unknown';
}

export interface GeoInfo {
  /** Country code (ISO 3166-1 alpha-2) */
  country?: string;
  /** Region/State */
  region?: string;
  /** City */
  city?: string;
  /** Latitude */
  lat?: number;
  /** Longitude */
  lon?: number;
  /** IP address (not stored in production for privacy) */
  ip?: string;
}

/**
 * Screen View Event
 */
export interface ScreenEvent extends BaseEvent {
  type: 'screen_view';
  properties: {
    screenName: string;
    previousScreen?: string;
    /** Time spent on previous screen (ms) */
    timeOnPreviousScreen?: number;
  };
}

/**
 * Custom Event (user-defined)
 */
export interface CustomEvent extends BaseEvent {
  type: 'custom';
  properties: {
    eventName: string;
    [key: string]: unknown;
  };
}

/**
 * Session Start Event
 */
export interface SessionEvent extends BaseEvent {
  type: 'session_start' | 'session_end';
  properties: {
    /** Session duration (ms) - only for session_end */
    duration?: number;
    /** Number of screens viewed in session */
    screenCount?: number;
  };
}

/**
 * Error Event
 */
export interface ErrorEvent extends BaseEvent {
  type: 'error' | 'crash';
  properties: {
    errorMessage: string;
    errorStack?: string;
    errorType?: string;
    fatal?: boolean;
    screenName?: string;
  };
}

/**
 * Performance Event
 */
export interface PerformanceEvent extends BaseEvent {
  type: 'performance';
  properties: {
    metric: 'app_start' | 'screen_load' | 'api_call' | 'render';
    duration: number;
    screenName?: string;
    apiEndpoint?: string;
  };
}

/**
 * User Tap/Interaction Event
 */
export interface InteractionEvent extends BaseEvent {
  type: 'tap' | 'swipe' | 'scroll';
  properties: {
    elementId?: string;
    screenName: string;
    elementType?: string;
    value?: string | number;
  };
}

/**
 * Union type of all event types
 */
export type AnalyticsEvent =
  | ScreenEvent
  | CustomEvent
  | SessionEvent
  | ErrorEvent
  | PerformanceEvent
  | InteractionEvent;

/**
 * Batch of events
 */
export interface EventBatch {
  /** Batch ID */
  batchId: string;
  /** Project ID (for auth) */
  projectId: string;
  /** Events in the batch */
  events: AnalyticsEvent[];
  /** Client timestamp when batch was created */
  createdAt: string;
  /** Client SDK version */
  sdkVersion?: string;
}

/**
 * Validated and enriched event (ready for storage)
 */
export interface EnrichedEvent extends AnalyticsEvent {
  /** Server-side timestamp when event was received */
  receivedAt: string;
  /** Server-side enriched geo data */
  geo: GeoInfo;
  /** Validation metadata */
  _meta: {
    version: string;
    enriched: boolean;
    errors?: string[];
  };
}

/**
 * Rate limit information
 */
export interface RateLimitInfo {
  projectId: string;
  /** Current count in window */
  count: number;
  /** Limit per window */
  limit: number;
  /** Window duration (seconds) */
  windowSeconds: number;
  /** When the window resets */
  resetAt: Date;
  /** Is limit exceeded */
  exceeded: boolean;
}

/**
 * Ingestion result
 */
export interface IngestionResult {
  success: boolean;
  /** Number of events accepted */
  accepted: number;
  /** Number of events rejected */
  rejected: number;
  /** Rejection reasons */
  errors?: Array<{
    eventId: string;
    reason: string;
  }>;
  /** Rate limit info */
  rateLimit?: RateLimitInfo;
}
