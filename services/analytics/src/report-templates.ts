/**
 * Analytics Report Templates
 *
 * Templates for different report types (overview, events, retention, etc.)
 */

import type {
  ReportType,
  CSVExportData,
  PDFExportData,
  PDFSection,
} from './export-types';
import type {
  AnalyticsOverview,
  EventAnalytics,
  ScreenAnalytics,
  UserAnalytics,
  RetentionData,
  FunnelAnalytics,
  SessionAnalytics,
  PerformanceMetrics,
} from './dashboard-types';

// ============================================================================
// OVERVIEW REPORT TEMPLATE
// ============================================================================

export function createOverviewCSV(data: AnalyticsOverview): CSVExportData {
  const headers = ['Metric', 'Value', 'Change'];
  const rows = [
    {
      Metric: 'Daily Active Users',
      Value: data.summary.dailyActiveUsers.toString(),
      Change: `${data.trends.dauChange >= 0 ? '+' : ''}${data.trends.dauChange.toFixed(2)}%`,
    },
    {
      Metric: 'Monthly Active Users',
      Value: data.summary.monthlyActiveUsers.toString(),
      Change: `${data.trends.mauChange >= 0 ? '+' : ''}${data.trends.mauChange.toFixed(2)}%`,
    },
    {
      Metric: 'Total Sessions',
      Value: data.summary.totalSessions.toString(),
      Change: `${data.trends.sessionsChange >= 0 ? '+' : ''}${data.trends.sessionsChange.toFixed(2)}%`,
    },
    {
      Metric: 'Total Screen Views',
      Value: data.summary.totalScreenViews.toString(),
      Change: `${data.trends.screenViewsChange >= 0 ? '+' : ''}${data.trends.screenViewsChange.toFixed(2)}%`,
    },
    {
      Metric: 'Avg Session Duration (seconds)',
      Value: data.summary.avgSessionDuration.toFixed(2),
      Change: '-',
    },
    {
      Metric: '7-Day Retention Rate',
      Value: `${data.summary.retentionRate7Day.toFixed(2)}%`,
      Change: '-',
    },
    {
      Metric: '30-Day Retention Rate',
      Value: `${data.summary.retentionRate30Day.toFixed(2)}%`,
      Change: '-',
    },
  ];

  // Add top screens
  rows.push({ Metric: '', Value: '', Change: '' });
  rows.push({ Metric: 'Top Screens', Value: '', Change: '' });
  data.insights.topScreens.forEach((screen, idx) => {
    rows.push({
      Metric: `${idx + 1}. ${screen.screen}`,
      Value: screen.views.toString(),
      Change: '',
    });
  });

  // Add top events
  rows.push({ Metric: '', Value: '', Change: '' });
  rows.push({ Metric: 'Top Events', Value: '', Change: '' });
  data.insights.topEvents.forEach((event, idx) => {
    rows.push({
      Metric: `${idx + 1}. ${event.event}`,
      Value: event.count.toString(),
      Change: '',
    });
  });

  // Add device distribution
  rows.push({ Metric: '', Value: '', Change: '' });
  rows.push({ Metric: 'Device Distribution', Value: '', Change: '' });
  rows.push({
    Metric: 'iOS Devices',
    Value: data.insights.activeDevices.ios.toString(),
    Change: '',
  });
  rows.push({
    Metric: 'Android Devices',
    Value: data.insights.activeDevices.android.toString(),
    Change: '',
  });

  return { headers, rows };
}

export function createOverviewPDF(
  data: AnalyticsOverview,
  dateRange: { start: Date; end: Date }
): PDFExportData {
  const sections: PDFSection[] = [
    {
      title: 'Summary Metrics',
      type: 'metrics',
      content: {
        metrics: [
          {
            label: 'Daily Active Users',
            value: data.summary.dailyActiveUsers,
            change: data.trends.dauChange,
          },
          {
            label: 'Monthly Active Users',
            value: data.summary.monthlyActiveUsers,
            change: data.trends.mauChange,
          },
          {
            label: 'Total Sessions',
            value: data.summary.totalSessions,
            change: data.trends.sessionsChange,
          },
          {
            label: 'Total Screen Views',
            value: data.summary.totalScreenViews,
            change: data.trends.screenViewsChange,
          },
        ],
      },
    },
    {
      title: 'Engagement Metrics',
      type: 'table',
      content: {
        headers: ['Metric', 'Value'],
        rows: [
          ['Avg Session Duration', `${data.summary.avgSessionDuration.toFixed(2)}s`],
          ['7-Day Retention', `${data.summary.retentionRate7Day.toFixed(2)}%`],
          ['30-Day Retention', `${data.summary.retentionRate30Day.toFixed(2)}%`],
        ],
      },
    },
    {
      title: 'Top Screens',
      type: 'table',
      content: {
        headers: ['Screen', 'Views'],
        rows: data.insights.topScreens.map(s => [s.screen, s.views.toString()]),
      },
    },
    {
      title: 'Top Events',
      type: 'table',
      content: {
        headers: ['Event', 'Count'],
        rows: data.insights.topEvents.map(e => [e.event, e.count.toString()]),
      },
    },
  ];

  return {
    title: 'Analytics Overview Report',
    subtitle: `${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()}`,
    dateRange,
    sections,
    footer: `Generated on ${new Date().toLocaleDateString()}`,
  };
}

// ============================================================================
// EVENTS REPORT TEMPLATE
// ============================================================================

export function createEventsCSV(data: EventAnalytics): CSVExportData {
  const headers = ['Event ID', 'Event', 'User ID', 'Timestamp', 'Metadata'];
  const rows = data.events.map(event => ({
    'Event ID': event.id,
    'Event': event.event,
    'User ID': event.userId || 'Anonymous',
    'Timestamp': event.timestamp.toISOString(),
    'Metadata': JSON.stringify(event.metadata),
  }));

  return { headers, rows };
}

export function createEventsPDF(
  data: EventAnalytics,
  dateRange: { start: Date; end: Date }
): PDFExportData {
  const sections: PDFSection[] = [
    {
      title: 'Summary',
      type: 'metrics',
      content: {
        metrics: [
          { label: 'Total Events', value: data.totalCount },
          { label: 'Unique Users', value: data.uniqueUsers },
        ],
      },
    },
    {
      title: 'Event List',
      type: 'table',
      content: {
        headers: ['Event', 'User ID', 'Timestamp'],
        rows: data.events.slice(0, 100).map(e => [
          e.event,
          e.userId || 'Anonymous',
          e.timestamp.toLocaleString(),
        ]),
      },
    },
  ];

  return {
    title: 'Events Report',
    subtitle: `${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()}`,
    dateRange,
    sections,
    footer: `Generated on ${new Date().toLocaleDateString()} | Showing first 100 events`,
  };
}

// ============================================================================
// SCREENS REPORT TEMPLATE
// ============================================================================

export function createScreensCSV(data: ScreenAnalytics): CSVExportData {
  const headers = [
    'Screen',
    'Views',
    'Unique Users',
    'Avg Time (seconds)',
    'Bounce Rate (%)',
    'Entrances',
    'Exits',
  ];
  const rows = data.screens.map(screen => ({
    'Screen': screen.screen,
    'Views': screen.views.toString(),
    'Unique Users': screen.uniqueUsers.toString(),
    'Avg Time (seconds)': screen.avgTimeOnScreen.toFixed(2),
    'Bounce Rate (%)': screen.bounceRate.toFixed(2),
    'Entrances': screen.entrances.toString(),
    'Exits': screen.exits.toString(),
  }));

  return { headers, rows };
}

export function createScreensPDF(
  data: ScreenAnalytics,
  dateRange: { start: Date; end: Date }
): PDFExportData {
  const sections: PDFSection[] = [
    {
      title: 'Summary',
      type: 'metrics',
      content: {
        metrics: [
          { label: 'Total Views', value: data.totalViews },
          { label: 'Unique Screens', value: data.uniqueScreens },
        ],
      },
    },
    {
      title: 'Screen Performance',
      type: 'table',
      content: {
        headers: ['Screen', 'Views', 'Unique Users', 'Avg Time', 'Bounce Rate'],
        rows: data.screens.map(s => [
          s.screen,
          s.views.toString(),
          s.uniqueUsers.toString(),
          `${s.avgTimeOnScreen.toFixed(1)}s`,
          `${s.bounceRate.toFixed(1)}%`,
        ]),
      },
    },
  ];

  return {
    title: 'Screen Analytics Report',
    subtitle: `${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()}`,
    dateRange,
    sections,
    footer: `Generated on ${new Date().toLocaleDateString()}`,
  };
}

// ============================================================================
// USERS REPORT TEMPLATE
// ============================================================================

export function createUsersCSV(data: UserAnalytics): CSVExportData {
  const headers = ['Metric', 'Value'];
  const rows = [
    { Metric: 'Total Users', Value: data.totalUsers.toString() },
    { Metric: 'Daily Active Users', Value: data.activeUsers.daily.toString() },
    { Metric: 'Weekly Active Users', Value: data.activeUsers.weekly.toString() },
    { Metric: 'Monthly Active Users', Value: data.activeUsers.monthly.toString() },
    { Metric: '', Value: '' },
    { Metric: 'New Users Today', Value: data.newUsers.today.toString() },
    { Metric: 'New Users This Week', Value: data.newUsers.thisWeek.toString() },
    { Metric: 'New Users This Month', Value: data.newUsers.thisMonth.toString() },
    { Metric: '', Value: '' },
    { Metric: 'iOS Devices', Value: data.deviceDistribution.ios.toString() },
    { Metric: 'Android Devices', Value: data.deviceDistribution.android.toString() },
  ];

  return { headers, rows };
}

export function createUsersPDF(
  data: UserAnalytics,
  dateRange: { start: Date; end: Date }
): PDFExportData {
  const sections: PDFSection[] = [
    {
      title: 'User Metrics',
      type: 'metrics',
      content: {
        metrics: [
          { label: 'Total Users', value: data.totalUsers },
          { label: 'Daily Active', value: data.activeUsers.daily },
          { label: 'Weekly Active', value: data.activeUsers.weekly },
          { label: 'Monthly Active', value: data.activeUsers.monthly },
        ],
      },
    },
    {
      title: 'New Users',
      type: 'table',
      content: {
        headers: ['Period', 'Count'],
        rows: [
          ['Today', data.newUsers.today.toString()],
          ['This Week', data.newUsers.thisWeek.toString()],
          ['This Month', data.newUsers.thisMonth.toString()],
        ],
      },
    },
    {
      title: 'Device Distribution',
      type: 'table',
      content: {
        headers: ['Platform', 'Count', 'Percentage'],
        rows: [
          [
            'iOS',
            data.deviceDistribution.ios.toString(),
            `${((data.deviceDistribution.ios / data.totalUsers) * 100).toFixed(1)}%`,
          ],
          [
            'Android',
            data.deviceDistribution.android.toString(),
            `${((data.deviceDistribution.android / data.totalUsers) * 100).toFixed(1)}%`,
          ],
        ],
      },
    },
  ];

  return {
    title: 'User Analytics Report',
    subtitle: `${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()}`,
    dateRange,
    sections,
    footer: `Generated on ${new Date().toLocaleDateString()}`,
  };
}

// ============================================================================
// RETENTION REPORT TEMPLATE
// ============================================================================

export function createRetentionCSV(data: RetentionData): CSVExportData {
  const headers = ['Cohort Date', 'Cohort Size', 'Day 0', 'Day 1', 'Day 7', 'Day 14', 'Day 30'];
  const rows = data.cohorts.map(cohort => ({
    'Cohort Date': cohort.cohortDate,
    'Cohort Size': cohort.cohortSize.toString(),
    'Day 0': `${cohort.retention.day0.toFixed(1)}%`,
    'Day 1': `${cohort.retention.day1.toFixed(1)}%`,
    'Day 7': `${cohort.retention.day7.toFixed(1)}%`,
    'Day 14': `${cohort.retention.day14.toFixed(1)}%`,
    'Day 30': `${cohort.retention.day30.toFixed(1)}%`,
  }));

  return { headers, rows };
}

export function createRetentionPDF(
  data: RetentionData,
  dateRange: { start: Date; end: Date }
): PDFExportData {
  const sections: PDFSection[] = [
    {
      title: 'Overall Retention',
      type: 'metrics',
      content: {
        metrics: [
          { label: 'Day 1 Retention', value: `${data.overall.day1.toFixed(1)}%` },
          { label: 'Day 7 Retention', value: `${data.overall.day7.toFixed(1)}%` },
          { label: 'Day 14 Retention', value: `${data.overall.day14.toFixed(1)}%` },
          { label: 'Day 30 Retention', value: `${data.overall.day30.toFixed(1)}%` },
        ],
      },
    },
    {
      title: 'Cohort Analysis',
      type: 'table',
      content: {
        headers: ['Cohort', 'Size', 'Day 1', 'Day 7', 'Day 30'],
        rows: data.cohorts.map(c => [
          c.cohortDate,
          c.cohortSize.toString(),
          `${c.retention.day1.toFixed(1)}%`,
          `${c.retention.day7.toFixed(1)}%`,
          `${c.retention.day30.toFixed(1)}%`,
        ]),
      },
    },
  ];

  return {
    title: 'Retention Analysis Report',
    subtitle: `${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()}`,
    dateRange,
    sections,
    footer: `Generated on ${new Date().toLocaleDateString()}`,
  };
}

// ============================================================================
// FUNNEL REPORT TEMPLATE
// ============================================================================

export function createFunnelCSV(data: FunnelAnalytics): CSVExportData {
  const headers = [
    'Step',
    'Event',
    'Users',
    'Conversion Rate (%)',
    'Dropoff Rate (%)',
    'Avg Time From Previous (seconds)',
  ];
  const rows = data.funnel.map(step => ({
    'Step': step.step,
    'Event': step.eventName,
    'Users': step.users.toString(),
    'Conversion Rate (%)': step.conversionRate.toFixed(2),
    'Dropoff Rate (%)': step.dropoffRate.toFixed(2),
    'Avg Time From Previous (seconds)': step.avgTimeFromPrevious.toFixed(2),
  }));

  return { headers, rows };
}

export function createFunnelPDF(
  data: FunnelAnalytics,
  dateRange: { start: Date; end: Date }
): PDFExportData {
  const sections: PDFSection[] = [
    {
      title: 'Funnel Summary',
      type: 'metrics',
      content: {
        metrics: [
          { label: 'Total Entries', value: data.totalEntries },
          { label: 'Overall Conversion', value: `${data.conversionRate.toFixed(2)}%` },
          {
            label: 'Avg Time to Complete',
            value: `${(data.avgTimeToComplete / 60).toFixed(1)} min`,
          },
        ],
      },
    },
    {
      title: 'Funnel Steps',
      type: 'table',
      content: {
        headers: ['Step', 'Users', 'Conversion', 'Dropoff'],
        rows: data.funnel.map(s => [
          s.eventName,
          s.users.toString(),
          `${s.conversionRate.toFixed(1)}%`,
          `${s.dropoffRate.toFixed(1)}%`,
        ]),
      },
    },
    {
      title: 'Major Dropoff Points',
      type: 'table',
      content: {
        headers: ['From Step', 'To Step', 'Dropoff Rate'],
        rows: data.dropoffPoints.map(d => [
          d.fromStep,
          d.toStep,
          `${d.dropoffRate.toFixed(1)}%`,
        ]),
      },
    },
  ];

  return {
    title: 'Funnel Analysis Report',
    subtitle: `${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()}`,
    dateRange,
    sections,
    footer: `Generated on ${new Date().toLocaleDateString()}`,
  };
}

// ============================================================================
// SESSIONS REPORT TEMPLATE
// ============================================================================

export function createSessionsCSV(data: SessionAnalytics): CSVExportData {
  const headers = ['Metric', 'Value'];
  const rows = [
    { Metric: 'Total Sessions', Value: data.totalSessions.toString() },
    { Metric: 'Avg Session Duration (seconds)', Value: data.avgSessionDuration.toFixed(2) },
    { Metric: 'Median Session Duration (seconds)', Value: data.medianSessionDuration.toFixed(2) },
    { Metric: 'Sessions Per User', Value: data.sessionsPerUser.toFixed(2) },
  ];

  return { headers, rows };
}

export function createSessionsPDF(
  data: SessionAnalytics,
  dateRange: { start: Date; end: Date }
): PDFExportData {
  const sections: PDFSection[] = [
    {
      title: 'Session Metrics',
      type: 'metrics',
      content: {
        metrics: [
          { label: 'Total Sessions', value: data.totalSessions },
          { label: 'Avg Duration', value: `${data.avgSessionDuration.toFixed(1)}s` },
          { label: 'Median Duration', value: `${data.medianSessionDuration.toFixed(1)}s` },
          { label: 'Sessions Per User', value: data.sessionsPerUser.toFixed(2) },
        ],
      },
    },
  ];

  return {
    title: 'Session Analytics Report',
    subtitle: `${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()}`,
    dateRange,
    sections,
    footer: `Generated on ${new Date().toLocaleDateString()}`,
  };
}

// ============================================================================
// PERFORMANCE REPORT TEMPLATE
// ============================================================================

export function createPerformanceCSV(data: PerformanceMetrics): CSVExportData {
  const headers = ['Metric', 'Value'];
  const rows = [
    { Metric: 'Avg App Start Time (ms)', Value: data.avgAppStartTime.toFixed(2) },
    { Metric: 'Avg Screen Load Time (ms)', Value: data.avgScreenLoadTime.toFixed(2) },
    { Metric: 'Error Rate (%)', Value: data.errorRate.toFixed(2) },
    { Metric: 'Crash Rate (%)', Value: data.crashRate.toFixed(2) },
    { Metric: '', Value: '' },
    { Metric: 'Top Errors', Value: '' },
  ];

  data.topErrors.forEach((error, idx) => {
    rows.push({
      Metric: `${idx + 1}. ${error.error}`,
      Value: `${error.count} occurrences`,
    });
  });

  return { headers, rows };
}

export function createPerformancePDF(
  data: PerformanceMetrics,
  dateRange: { start: Date; end: Date }
): PDFExportData {
  const sections: PDFSection[] = [
    {
      title: 'Performance Metrics',
      type: 'metrics',
      content: {
        metrics: [
          { label: 'Avg App Start', value: `${data.avgAppStartTime.toFixed(0)}ms` },
          { label: 'Avg Screen Load', value: `${data.avgScreenLoadTime.toFixed(0)}ms` },
          { label: 'Error Rate', value: `${data.errorRate.toFixed(2)}%` },
          { label: 'Crash Rate', value: `${data.crashRate.toFixed(2)}%` },
        ],
      },
    },
    {
      title: 'Top Errors',
      type: 'table',
      content: {
        headers: ['Error', 'Count', 'Last Seen'],
        rows: data.topErrors.map(e => [
          e.error,
          e.count.toString(),
          e.lastSeen.toLocaleString(),
        ]),
      },
    },
  ];

  return {
    title: 'Performance Report',
    subtitle: `${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()}`,
    dateRange,
    sections,
    footer: `Generated on ${new Date().toLocaleDateString()}`,
  };
}

// ============================================================================
// TEMPLATE REGISTRY
// ============================================================================

export const reportTemplates = {
  overview: {
    csv: createOverviewCSV,
    pdf: createOverviewPDF,
  },
  events: {
    csv: createEventsCSV,
    pdf: createEventsPDF,
  },
  screens: {
    csv: createScreensCSV,
    pdf: createScreensPDF,
  },
  users: {
    csv: createUsersCSV,
    pdf: createUsersPDF,
  },
  retention: {
    csv: createRetentionCSV,
    pdf: createRetentionPDF,
  },
  funnel: {
    csv: createFunnelCSV,
    pdf: createFunnelPDF,
  },
  sessions: {
    csv: createSessionsCSV,
    pdf: createSessionsPDF,
  },
  performance: {
    csv: createPerformanceCSV,
    pdf: createPerformancePDF,
  },
};
