import { z } from 'zod';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EVENT TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const EventSchema = z.object({
  event_id: z.string().uuid().optional(),
  event_type: z.string(),
  event_name: z.string(),
  timestamp: z.date().optional(),
  ingested_at: z.date().optional(),
  project_id: z.string().uuid(),
  app_version: z.string().optional(),
  bundle_id: z.string().optional(),
  user_id: z.string().optional(),
  anonymous_id: z.string(),
  session_id: z.string(),
  platform: z.enum(['ios', 'android', 'web']),
  os_version: z.string().optional(),
  device_model: z.string().optional(),
  app_build_number: z.number().optional(),
  country: z.string().optional(),
  region: z.string().optional(),
  city: z.string().optional(),
  properties: z.record(z.unknown()).optional(),
  screen_name: z.string().optional(),
  duration_ms: z.number().optional(),
});

export type Event = z.infer<typeof EventSchema>;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SESSION TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface Session {
  session_id: string;
  project_id: string;
  user_id?: string;
  anonymous_id: string;
  session_start: Date;
  session_end: Date;
  duration_seconds: number;
  event_count: number;
  screen_count: number;
  platform: string;
  os_version?: string;
  device_model?: string;
  app_version?: string;
  country?: string;
  first_screen?: string;
  last_screen?: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// METRIC TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface DailyMetrics {
  day: Date;
  project_id: string;
  total_events: number;
  daily_active_users: number;
  total_sessions: number;
  unique_screens_viewed: number;
  avg_event_duration_ms: number;
}

export interface HourlyMetrics {
  hour: Date;
  project_id: string;
  event_type: string;
  event_count: number;
  unique_users: number;
  unique_sessions: number;
  avg_duration_ms: number;
  median_duration_ms: number;
  p95_duration_ms: number;
}

export interface ScreenViewMetrics {
  day: Date;
  project_id: string;
  screen_name: string;
  view_count: number;
  unique_viewers: number;
  avg_time_on_screen_ms: number;
}

export interface PlatformMetrics {
  day: Date;
  project_id: string;
  platform: string;
  events: number;
  users: number;
  sessions: number;
}

export interface CountryMetrics {
  day: Date;
  project_id: string;
  country: string;
  events: number;
  users: number;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RETENTION TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface RetentionRate {
  day_offset: number;
  cohort_size: number;
  returned_users: number;
  retention_rate: number;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// QUERY PARAMETERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface DateRangeQuery {
  project_id: string;
  start_date: Date;
  end_date: Date;
}

export interface EventQuery extends DateRangeQuery {
  event_type?: string;
  event_name?: string;
  user_id?: string;
  platform?: string;
  limit?: number;
  offset?: number;
}

export interface FunnelQuery extends DateRangeQuery {
  steps: string[]; // Event names in order
}

export interface FunnelStep {
  step_index: number;
  event_name: string;
  count: number;
  conversion_rate: number;
  drop_off_rate: number;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DATABASE CONFIGURATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface ClickHouseConfig {
  url: string;
  database: string;
  username: string;
  password: string;
  request_timeout?: number;
  max_open_connections?: number;
  compression?: {
    request: boolean;
    response: boolean;
  };
}

export interface TimescaleConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  max_connections?: number;
  idle_timeout_ms?: number;
  connection_timeout_ms?: number;
  ssl?: boolean;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// BATCH OPERATIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface BatchInsertResult {
  inserted: number;
  failed: number;
  errors?: Array<{ index: number; error: string }>;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DASHBOARD DATA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface DashboardData {
  overview: {
    dau: number;
    mau: number;
    total_sessions: number;
    avg_session_duration: number;
    total_events: number;
  };
  charts: {
    dau_trend: Array<{ date: string; users: number }>;
    platform_breakdown: Array<{ platform: string; users: number; percentage: number }>;
    top_screens: Array<{ screen_name: string; views: number; unique_viewers: number }>;
    retention: RetentionRate[];
  };
  real_time: {
    active_now: number;
    events_last_hour: number;
  };
}
