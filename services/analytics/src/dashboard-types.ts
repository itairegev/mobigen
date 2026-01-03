/**
 * Analytics Dashboard Types
 *
 * Type definitions for the analytics dashboard API
 */

// ============================================================================
// TIME RANGE & FILTERING
// ============================================================================

export type TimeRange = {
  start: Date;
  end: Date;
};

export type TimeGranularity = 'hour' | 'day' | 'week' | 'month';

export interface TimeRangeParams {
  start: Date;
  end: Date;
  granularity?: TimeGranularity;
}

// ============================================================================
// ANALYTICS OVERVIEW
// ============================================================================

export interface AnalyticsOverview {
  // High-level metrics
  summary: {
    dailyActiveUsers: number;
    monthlyActiveUsers: number;
    totalSessions: number;
    totalScreenViews: number;
    avgSessionDuration: number; // in seconds
    retentionRate7Day: number; // percentage
    retentionRate30Day: number; // percentage
  };

  // Trends (comparison with previous period)
  trends: {
    dauChange: number; // percentage change
    mauChange: number;
    sessionsChange: number;
    screenViewsChange: number;
  };

  // Quick insights
  insights: {
    topScreens: Array<{ screen: string; views: number }>;
    topEvents: Array<{ event: string; count: number }>;
    activeDevices: {
      ios: number;
      android: number;
    };
  };
}

// ============================================================================
// METRIC DATA POINTS (FOR CHARTS)
// ============================================================================

export interface MetricDataPoint {
  timestamp: string; // ISO string
  value: number;
  label?: string; // Optional label for display
}

export interface MultiSeriesDataPoint {
  timestamp: string;
  values: Record<string, number>; // key: series name, value: metric value
}

// ============================================================================
// EVENT ANALYTICS
// ============================================================================

export interface EventAnalytics {
  events: EventData[];
  totalCount: number;
  uniqueUsers: number;
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface EventData {
  id: string;
  event: string;
  userId?: string;
  projectId?: string;
  metadata: Record<string, any>;
  timestamp: Date;
}

export interface EventFilter {
  eventType?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

// ============================================================================
// SCREEN ANALYTICS
// ============================================================================

export interface ScreenAnalytics {
  screens: ScreenMetrics[];
  totalViews: number;
  uniqueScreens: number;
}

export interface ScreenMetrics {
  screen: string;
  views: number;
  uniqueUsers: number;
  avgTimeOnScreen: number; // in seconds
  bounceRate: number; // percentage of users who left after viewing this screen
  entrances: number; // number of sessions starting on this screen
  exits: number; // number of sessions ending on this screen
}

// ============================================================================
// USER ANALYTICS
// ============================================================================

export interface UserAnalytics {
  totalUsers: number;
  activeUsers: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  newUsers: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  userSegments: UserSegment[];
  deviceDistribution: {
    ios: number;
    android: number;
  };
  platformVersions: Array<{
    platform: string;
    version: string;
    count: number;
  }>;
}

export interface UserSegment {
  name: string;
  count: number;
  percentage: number;
  description?: string;
}

// ============================================================================
// RETENTION ANALYTICS
// ============================================================================

export interface RetentionData {
  cohorts: RetentionCohort[];
  overall: {
    day1: number;
    day7: number;
    day14: number;
    day30: number;
  };
}

export interface RetentionCohort {
  cohortDate: string; // ISO date string (YYYY-MM-DD)
  cohortSize: number;
  retention: {
    day0: number; // Always 100
    day1: number;
    day7: number;
    day14: number;
    day30: number;
  };
}

// ============================================================================
// FUNNEL ANALYTICS
// ============================================================================

export interface FunnelAnalytics {
  funnel: FunnelStep[];
  totalEntries: number;
  conversionRate: number; // percentage from first to last step
  avgTimeToComplete: number; // in seconds
  dropoffPoints: Array<{
    fromStep: string;
    toStep: string;
    dropoffRate: number; // percentage
  }>;
}

export interface FunnelStep {
  step: string;
  eventName: string;
  users: number;
  conversionRate: number; // percentage from previous step
  dropoffRate: number; // percentage dropped from previous step
  avgTimeFromPrevious: number; // in seconds
}

export interface FunnelDefinition {
  name: string;
  steps: string[]; // Array of event names in order
}

// ============================================================================
// SESSION ANALYTICS
// ============================================================================

export interface SessionAnalytics {
  totalSessions: number;
  avgSessionDuration: number; // in seconds
  medianSessionDuration: number;
  sessionsPerUser: number;
  sessionsByHour: Array<{ hour: number; count: number }>;
  sessionsByDay: Array<{ day: string; count: number }>;
}

// ============================================================================
// PERFORMANCE ANALYTICS
// ============================================================================

export interface PerformanceMetrics {
  avgAppStartTime: number; // milliseconds
  avgScreenLoadTime: number; // milliseconds
  errorRate: number; // percentage
  crashRate: number; // percentage
  topErrors: Array<{
    error: string;
    count: number;
    lastSeen: Date;
  }>;
}

// ============================================================================
// REAL-TIME ANALYTICS
// ============================================================================

export interface RealTimeMetrics {
  activeUsers: number; // Users active in last 5 minutes
  recentEvents: EventData[];
  topScreens: Array<{ screen: string; activeUsers: number }>;
  recentSessions: number; // Sessions started in last hour
}

// ============================================================================
// QUERY PARAMETERS
// ============================================================================

export interface AnalyticsQueryParams {
  projectId: string;
  startDate?: string; // ISO string
  endDate?: string; // ISO string
  granularity?: TimeGranularity;
  page?: number;
  pageSize?: number;
  orderBy?: string;
  order?: 'asc' | 'desc';
}

export interface FunnelQueryParams extends AnalyticsQueryParams {
  funnelSteps: string[]; // Array of event names
  timeWindow?: number; // Max time between steps in hours (default: 24)
}

export interface RetentionQueryParams {
  projectId: string;
  cohortStartDate: string; // ISO string
  cohortEndDate: string; // ISO string
  retentionDays: number[]; // e.g., [1, 7, 14, 30]
}

// ============================================================================
// AGGREGATION RESULTS (INTERNAL USE)
// ============================================================================

export interface AggregationResult<T = any> {
  data: T;
  cached: boolean;
  computedAt: Date;
  expiresAt?: Date;
}

export interface CacheOptions {
  ttl: number; // Time to live in seconds
  key?: string; // Custom cache key
  skipCache?: boolean;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export class AnalyticsError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AnalyticsError';
  }
}

export class InvalidDateRangeError extends AnalyticsError {
  constructor(message: string = 'Invalid date range provided') {
    super(message, 'INVALID_DATE_RANGE', 400);
  }
}

export class ProjectNotFoundError extends AnalyticsError {
  constructor(projectId: string) {
    super(`Project ${projectId} not found`, 'PROJECT_NOT_FOUND', 404);
  }
}

export class InsufficientDataError extends AnalyticsError {
  constructor(message: string = 'Insufficient data for this analysis') {
    super(message, 'INSUFFICIENT_DATA', 422);
  }
}
