/**
 * Analytics Export Types
 *
 * Type definitions for analytics report export functionality
 */

// ============================================================================
// EXPORT FORMATS
// ============================================================================

export type ExportFormat = 'csv' | 'pdf' | 'json' | 'xlsx';

// ============================================================================
// REPORT TYPES
// ============================================================================

export type ReportType =
  | 'overview'
  | 'events'
  | 'screens'
  | 'users'
  | 'retention'
  | 'funnel'
  | 'sessions'
  | 'performance'
  | 'custom';

// ============================================================================
// EXPORT STATUS
// ============================================================================

export type ExportStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'expired';

// ============================================================================
// EXPORT REQUEST
// ============================================================================

export interface ExportRequest {
  /** Project ID for the export */
  projectId: string;
  /** Type of report to export */
  reportType: ReportType;
  /** Export format */
  format: ExportFormat;
  /** Date range for the export */
  dateRange: {
    start: Date;
    end: Date;
  };
  /** Optional filters */
  filters?: ExportFilters;
  /** Optional custom columns/fields */
  columns?: string[];
  /** User requesting the export */
  userId: string;
  /** Email to send the export to (optional) */
  email?: string;
}

// ============================================================================
// EXPORT FILTERS
// ============================================================================

export interface ExportFilters {
  /** Filter by event types */
  eventTypes?: string[];
  /** Filter by screen names */
  screenNames?: string[];
  /** Filter by user IDs */
  userIds?: string[];
  /** Filter by platform */
  platform?: 'ios' | 'android' | 'web';
  /** Filter by country */
  country?: string;
  /** Custom property filters */
  properties?: Record<string, any>;
}

// ============================================================================
// EXPORT RECORD
// ============================================================================

export interface ExportRecord {
  /** Unique export ID */
  id: string;
  /** Project ID */
  projectId: string;
  /** User who requested the export */
  userId: string;
  /** Report type */
  reportType: ReportType;
  /** Export format */
  format: ExportFormat;
  /** Current status */
  status: ExportStatus;
  /** Date range */
  dateRange: {
    start: Date;
    end: Date;
  };
  /** Filters applied */
  filters?: ExportFilters;
  /** File metadata (when completed) */
  file?: {
    /** S3 key or file path */
    key: string;
    /** File size in bytes */
    size: number;
    /** Download URL (signed, temporary) */
    downloadUrl?: string;
    /** URL expiry time */
    expiresAt?: Date;
  };
  /** Error message (if failed) */
  error?: string;
  /** Progress (0-100) */
  progress: number;
  /** Estimated rows/records to export */
  estimatedRows?: number;
  /** Actual rows exported */
  actualRows?: number;
  /** Time when export was requested */
  createdAt: Date;
  /** Time when export was last updated */
  updatedAt: Date;
  /** Time when export was completed */
  completedAt?: Date;
  /** Time when export will expire and be deleted */
  expiresAt: Date;
}

// ============================================================================
// EXPORT RESULT
// ============================================================================

export interface ExportResult {
  /** Export ID */
  exportId: string;
  /** Status of the export */
  status: ExportStatus;
  /** Download URL (if completed) */
  downloadUrl?: string;
  /** File size (if completed) */
  fileSize?: number;
  /** Number of rows exported */
  rowCount?: number;
  /** Error message (if failed) */
  error?: string;
  /** When the download URL expires */
  expiresAt?: Date;
}

// ============================================================================
// EXPORT OPTIONS
// ============================================================================

export interface ExportOptions {
  /** Include headers in CSV */
  includeHeaders?: boolean;
  /** CSV delimiter */
  delimiter?: ',' | ';' | '\t' | '|';
  /** Date format for exports */
  dateFormat?: string;
  /** Timezone for date formatting */
  timezone?: string;
  /** Maximum rows per export (for pagination) */
  maxRows?: number;
  /** Include metadata in export */
  includeMetadata?: boolean;
  /** Compress export file */
  compress?: boolean;
}

// ============================================================================
// EXPORT LIST RESPONSE
// ============================================================================

export interface ExportListResponse {
  exports: ExportRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================================
// EXPORT STATISTICS
// ============================================================================

export interface ExportStatistics {
  /** Total exports created */
  totalExports: number;
  /** Exports by status */
  byStatus: Record<ExportStatus, number>;
  /** Exports by format */
  byFormat: Record<ExportFormat, number>;
  /** Exports by report type */
  byReportType: Record<ReportType, number>;
  /** Average export time (seconds) */
  avgExportTime: number;
  /** Storage used by exports (bytes) */
  storageUsed: number;
}

// ============================================================================
// CSV EXPORT DATA
// ============================================================================

export interface CSVExportData {
  headers: string[];
  rows: Array<Record<string, any>>;
}

// ============================================================================
// PDF EXPORT DATA
// ============================================================================

export interface PDFExportData {
  title: string;
  subtitle?: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  sections: PDFSection[];
  footer?: string;
}

export interface PDFSection {
  title: string;
  type: 'text' | 'table' | 'chart' | 'metrics';
  content: any;
}

// ============================================================================
// EXPORT CONFIGURATION
// ============================================================================

export interface ExportConfig {
  /** Maximum concurrent exports per project */
  maxConcurrentExports: number;
  /** Maximum file size (bytes) */
  maxFileSize: number;
  /** Maximum rows per export */
  maxRows: number;
  /** Export retention period (days) */
  retentionDays: number;
  /** S3 bucket for exports */
  s3Bucket: string;
  /** S3 prefix for exports */
  s3Prefix: string;
  /** Enable email notifications */
  emailNotifications: boolean;
  /** Download URL expiry (hours) */
  downloadUrlExpiry: number;
}

// ============================================================================
// EXPORT ERRORS
// ============================================================================

export class ExportError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'ExportError';
  }
}

export class ExportNotFoundError extends ExportError {
  constructor(exportId: string) {
    super(`Export ${exportId} not found`, 'EXPORT_NOT_FOUND', 404);
  }
}

export class ExportLimitExceededError extends ExportError {
  constructor(message: string = 'Export limit exceeded') {
    super(message, 'EXPORT_LIMIT_EXCEEDED', 429);
  }
}

export class ExportTooLargeError extends ExportError {
  constructor(message: string = 'Export data exceeds maximum size') {
    super(message, 'EXPORT_TOO_LARGE', 413);
  }
}

export class InvalidExportFormatError extends ExportError {
  constructor(format: string) {
    super(`Invalid export format: ${format}`, 'INVALID_EXPORT_FORMAT', 400);
  }
}
