/**
 * Analytics Export Service
 *
 * Handles export of analytics reports to CSV, PDF, JSON, and Excel formats
 */

import { randomUUID } from 'crypto';
import Redis from 'ioredis';
import { prisma } from '@mobigen/db';
import { AggregationService } from './aggregations';
import { reportTemplates } from './report-templates';
import type {
  ExportRequest,
  ExportRecord,
  ExportResult,
  ExportStatus,
  ExportFormat,
  ReportType,
  ExportListResponse,
  ExportConfig,
  ExportNotFoundError,
  ExportLimitExceededError,
  ExportTooLargeError,
  InvalidExportFormatError,
  CSVExportData,
  PDFExportData,
  ExportOptions,
} from './export-types';

// ============================================================================
// EXPORT SERVICE
// ============================================================================

export class ExportService {
  private redis: Redis;
  private aggregationService: AggregationService;
  private config: ExportConfig;

  constructor(redis: Redis, config?: Partial<ExportConfig>) {
    this.redis = redis;
    this.aggregationService = new AggregationService(redis);
    this.config = {
      maxConcurrentExports: 5,
      maxFileSize: 100 * 1024 * 1024, // 100MB
      maxRows: 1000000, // 1 million rows
      retentionDays: 7,
      s3Bucket: process.env.EXPORTS_S3_BUCKET || 'mobigen-exports',
      s3Prefix: 'analytics-exports/',
      emailNotifications: true,
      downloadUrlExpiry: 24, // hours
      ...config,
    };
  }

  // ==========================================================================
  // MAIN EXPORT METHODS
  // ==========================================================================

  /**
   * Export analytics data to CSV format
   */
  async exportToCSV(
    projectId: string,
    reportType: ReportType,
    dateRange: { start: Date; end: Date },
    options?: ExportOptions
  ): Promise<ExportResult> {
    return this.createExport(projectId, reportType, 'csv', dateRange, undefined, options);
  }

  /**
   * Export analytics data to PDF format
   */
  async exportToPDF(
    projectId: string,
    reportType: ReportType,
    dateRange: { start: Date; end: Date },
    options?: ExportOptions
  ): Promise<ExportResult> {
    return this.createExport(projectId, reportType, 'pdf', dateRange, undefined, options);
  }

  /**
   * Export analytics data to JSON format
   */
  async exportToJSON(
    projectId: string,
    reportType: ReportType,
    dateRange: { start: Date; end: Date },
    options?: ExportOptions
  ): Promise<ExportResult> {
    return this.createExport(projectId, reportType, 'json', dateRange, undefined, options);
  }

  /**
   * Create a new export request
   */
  async createExport(
    projectId: string,
    reportType: ReportType,
    format: ExportFormat,
    dateRange: { start: Date; end: Date },
    userId?: string,
    options?: ExportOptions
  ): Promise<ExportResult> {
    // Check concurrent export limit
    const activeExports = await this.getActiveExportCount(projectId);
    if (activeExports >= this.config.maxConcurrentExports) {
      throw new (ExportLimitExceededError as any)(
        `Maximum ${this.config.maxConcurrentExports} concurrent exports allowed`
      );
    }

    // Validate format
    if (!['csv', 'pdf', 'json', 'xlsx'].includes(format)) {
      throw new (InvalidExportFormatError as any)(format);
    }

    // Create export record
    const exportId = randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.config.retentionDays * 24 * 60 * 60 * 1000);

    const exportRecord: ExportRecord = {
      id: exportId,
      projectId,
      userId: userId || 'system',
      reportType,
      format,
      status: 'pending',
      dateRange,
      progress: 0,
      createdAt: now,
      updatedAt: now,
      expiresAt,
    };

    // Store in Redis
    await this.saveExportRecord(exportRecord);

    // Queue export job (process asynchronously)
    this.processExport(exportRecord, options).catch(error => {
      console.error(`Export ${exportId} failed:`, error);
      this.updateExportStatus(exportId, 'failed', error.message);
    });

    return {
      exportId,
      status: 'pending',
    };
  }

  /**
   * Get export status and download URL
   */
  async getExportStatus(exportId: string): Promise<ExportResult> {
    const record = await this.getExportRecord(exportId);

    if (!record) {
      throw new (ExportNotFoundError as any)(exportId);
    }

    const result: ExportResult = {
      exportId: record.id,
      status: record.status,
    };

    if (record.status === 'completed' && record.file) {
      result.downloadUrl = record.file.downloadUrl;
      result.fileSize = record.file.size;
      result.rowCount = record.actualRows;
      result.expiresAt = record.file.expiresAt;
    }

    if (record.status === 'failed') {
      result.error = record.error;
    }

    return result;
  }

  /**
   * List all exports for a project
   */
  async listExports(
    projectId: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<ExportListResponse> {
    const pattern = `export:${projectId}:*`;
    const keys = await this.redis.keys(pattern);

    // Get all export records
    const records: ExportRecord[] = [];
    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        records.push(JSON.parse(data));
      }
    }

    // Sort by creation date (newest first)
    records.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Paginate
    const total = records.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedRecords = records.slice(start, end);

    return {
      exports: paginatedRecords,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  /**
   * Delete an export
   */
  async deleteExport(exportId: string): Promise<void> {
    const record = await this.getExportRecord(exportId);
    if (!record) {
      throw new (ExportNotFoundError as any)(exportId);
    }

    // Delete file from S3 if exists
    if (record.file?.key) {
      await this.deleteFileFromS3(record.file.key);
    }

    // Delete record from Redis
    await this.redis.del(`export:${record.projectId}:${exportId}`);
  }

  // ==========================================================================
  // EXPORT PROCESSING
  // ==========================================================================

  /**
   * Process an export request
   */
  private async processExport(
    record: ExportRecord,
    options?: ExportOptions
  ): Promise<void> {
    try {
      await this.updateExportStatus(record.id, 'processing');

      // Fetch analytics data
      const data = await this.fetchAnalyticsData(record);

      // Update progress
      await this.updateProgress(record.id, 50);

      // Generate export file
      const fileBuffer = await this.generateExportFile(record, data, options);

      // Check file size
      if (fileBuffer.length > this.config.maxFileSize) {
        throw new Error(`Export file size exceeds maximum of ${this.config.maxFileSize} bytes`);
      }

      // Upload to S3
      const fileKey = await this.uploadToS3(record, fileBuffer);

      // Generate signed download URL
      const downloadUrl = await this.generateDownloadUrl(fileKey);
      const expiresAt = new Date(
        Date.now() + this.config.downloadUrlExpiry * 60 * 60 * 1000
      );

      // Update record
      await this.updateExportComplete(record.id, {
        key: fileKey,
        size: fileBuffer.length,
        downloadUrl,
        expiresAt,
      });

      // Send email notification if enabled
      if (this.config.emailNotifications && record.userId !== 'system') {
        await this.sendExportNotification(record, downloadUrl);
      }
    } catch (error: any) {
      await this.updateExportStatus(record.id, 'failed', error.message);
      throw error;
    }
  }

  /**
   * Fetch analytics data based on report type
   */
  private async fetchAnalyticsData(record: ExportRecord): Promise<any> {
    const { projectId, reportType, dateRange } = record;

    switch (reportType) {
      case 'overview':
        const overview = await this.aggregationService.getOverview(projectId, {
          start: dateRange.start,
          end: dateRange.end,
        });
        return overview.data;

      case 'events':
        const events = await prisma.analyticsEvent.findMany({
          where: {
            projectId,
            timestamp: {
              gte: dateRange.start,
              lt: dateRange.end,
            },
          },
          orderBy: { timestamp: 'desc' },
          take: this.config.maxRows,
        });
        return {
          events: events.map(e => ({
            id: e.id,
            event: e.event,
            userId: e.userId,
            projectId: e.projectId,
            metadata: e.metadata,
            timestamp: e.timestamp,
          })),
          totalCount: events.length,
          uniqueUsers: new Set(events.map(e => e.userId).filter(Boolean)).size,
          pagination: { page: 1, pageSize: events.length, totalPages: 1 },
        };

      case 'screens':
        return await this.aggregationService.screenViewCounts(projectId, {
          start: dateRange.start,
          end: dateRange.end,
        });

      case 'users':
        // Fetch user analytics data
        const totalUsers = await prisma.analyticsEvent.findMany({
          where: { projectId },
          select: { userId: true },
          distinct: ['userId'],
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const dailyActiveUsers = await prisma.analyticsEvent.findMany({
          where: {
            projectId,
            timestamp: { gte: today, lt: tomorrow },
          },
          select: { userId: true },
          distinct: ['userId'],
        });

        return {
          totalUsers: totalUsers.length,
          activeUsers: {
            daily: dailyActiveUsers.length,
            weekly: 0,
            monthly: 0,
          },
          newUsers: { today: 0, thisWeek: 0, thisMonth: 0 },
          userSegments: [],
          deviceDistribution: { ios: 0, android: 0 },
          platformVersions: [],
        };

      case 'retention':
        return await this.aggregationService.retentionCohorts(
          projectId,
          dateRange.start,
          dateRange.end,
          [1, 7, 14, 30]
        );

      case 'sessions':
        return await this.aggregationService.sessionMetrics(projectId, {
          start: dateRange.start,
          end: dateRange.end,
        });

      default:
        throw new Error(`Unsupported report type: ${reportType}`);
    }
  }

  /**
   * Generate export file in the specified format
   */
  private async generateExportFile(
    record: ExportRecord,
    data: any,
    options?: ExportOptions
  ): Promise<Buffer> {
    const { format, reportType, dateRange } = record;

    switch (format) {
      case 'csv':
        return this.generateCSV(reportType, data, options);

      case 'pdf':
        return this.generatePDF(reportType, data, dateRange, options);

      case 'json':
        return this.generateJSON(data, options);

      case 'xlsx':
        return this.generateExcel(reportType, data, options);

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Generate CSV file
   */
  private async generateCSV(
    reportType: ReportType,
    data: any,
    options?: ExportOptions
  ): Promise<Buffer> {
    const template = reportTemplates[reportType as keyof typeof reportTemplates];
    if (!template || !template.csv) {
      throw new Error(`No CSV template for report type: ${reportType}`);
    }

    const csvData: CSVExportData = template.csv(data);
    const delimiter = options?.delimiter || ',';
    const includeHeaders = options?.includeHeaders !== false;

    let csv = '';

    // Add headers
    if (includeHeaders) {
      csv += csvData.headers.join(delimiter) + '\n';
    }

    // Add rows
    for (const row of csvData.rows) {
      const values = csvData.headers.map(header => {
        const value = row[header];
        // Escape values containing delimiter or quotes
        if (
          typeof value === 'string' &&
          (value.includes(delimiter) || value.includes('"') || value.includes('\n'))
        ) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      });
      csv += values.join(delimiter) + '\n';
    }

    return Buffer.from(csv, 'utf-8');
  }

  /**
   * Generate PDF file
   */
  private async generatePDF(
    reportType: ReportType,
    data: any,
    dateRange: { start: Date; end: Date },
    options?: ExportOptions
  ): Promise<Buffer> {
    const template = reportTemplates[reportType as keyof typeof reportTemplates];
    if (!template || !template.pdf) {
      throw new Error(`No PDF template for report type: ${reportType}`);
    }

    const pdfData: PDFExportData = template.pdf(data, dateRange);

    // Simple PDF generation (in production, use a library like pdfkit or puppeteer)
    const pdfContent = this.generateSimplePDF(pdfData);
    return Buffer.from(pdfContent, 'utf-8');
  }

  /**
   * Generate simple PDF content (placeholder - use proper PDF library in production)
   */
  private generateSimplePDF(data: PDFExportData): string {
    let content = '';
    content += `${data.title}\n`;
    content += `${data.subtitle || ''}\n\n`;

    for (const section of data.sections) {
      content += `\n${section.title}\n`;
      content += '='.repeat(section.title.length) + '\n\n';

      if (section.type === 'table' && section.content.headers) {
        content += section.content.headers.join(' | ') + '\n';
        content += '-'.repeat(section.content.headers.join(' | ').length) + '\n';
        for (const row of section.content.rows) {
          content += row.join(' | ') + '\n';
        }
      } else if (section.type === 'metrics' && section.content.metrics) {
        for (const metric of section.content.metrics) {
          content += `${metric.label}: ${metric.value}`;
          if (metric.change !== undefined) {
            content += ` (${metric.change >= 0 ? '+' : ''}${metric.change}%)`;
          }
          content += '\n';
        }
      }
      content += '\n';
    }

    if (data.footer) {
      content += `\n${data.footer}\n`;
    }

    return content;
  }

  /**
   * Generate JSON file
   */
  private async generateJSON(data: any, options?: ExportOptions): Promise<Buffer> {
    const json = JSON.stringify(data, null, 2);
    return Buffer.from(json, 'utf-8');
  }

  /**
   * Generate Excel file (placeholder - implement with exceljs in production)
   */
  private async generateExcel(
    reportType: ReportType,
    data: any,
    options?: ExportOptions
  ): Promise<Buffer> {
    // For now, generate CSV
    return this.generateCSV(reportType, data, options);
  }

  // ==========================================================================
  // STORAGE (S3 PLACEHOLDER)
  // ==========================================================================

  /**
   * Upload file to S3 (placeholder - implement with AWS SDK in production)
   */
  private async uploadToS3(record: ExportRecord, buffer: Buffer): Promise<string> {
    const fileExtension = record.format;
    const fileName = `${record.projectId}/${record.id}.${fileExtension}`;
    const key = `${this.config.s3Prefix}${fileName}`;

    // TODO: Implement actual S3 upload
    // const s3 = new S3Client({ region: 'us-east-1' });
    // await s3.send(new PutObjectCommand({
    //   Bucket: this.config.s3Bucket,
    //   Key: key,
    //   Body: buffer,
    //   ContentType: this.getContentType(record.format),
    // }));

    console.log(`[PLACEHOLDER] Would upload ${buffer.length} bytes to s3://${this.config.s3Bucket}/${key}`);

    return key;
  }

  /**
   * Generate signed download URL (placeholder)
   */
  private async generateDownloadUrl(fileKey: string): Promise<string> {
    // TODO: Implement actual S3 signed URL generation
    // const s3 = new S3Client({ region: 'us-east-1' });
    // const command = new GetObjectCommand({
    //   Bucket: this.config.s3Bucket,
    //   Key: fileKey,
    // });
    // return getSignedUrl(s3, command, { expiresIn: this.config.downloadUrlExpiry * 3600 });

    return `https://exports.mobigen.io/download/${fileKey}?expires=${Date.now() + this.config.downloadUrlExpiry * 3600000}`;
  }

  /**
   * Delete file from S3 (placeholder)
   */
  private async deleteFileFromS3(fileKey: string): Promise<void> {
    // TODO: Implement actual S3 deletion
    console.log(`[PLACEHOLDER] Would delete s3://${this.config.s3Bucket}/${fileKey}`);
  }

  // ==========================================================================
  // REDIS OPERATIONS
  // ==========================================================================

  /**
   * Save export record to Redis
   */
  private async saveExportRecord(record: ExportRecord): Promise<void> {
    const key = `export:${record.projectId}:${record.id}`;
    const ttl = this.config.retentionDays * 24 * 60 * 60; // seconds
    await this.redis.setex(key, ttl, JSON.stringify(record));
  }

  /**
   * Get export record from Redis
   */
  private async getExportRecord(exportId: string): Promise<ExportRecord | null> {
    // We need to search across all projects since we only have exportId
    const pattern = `export:*:${exportId}`;
    const keys = await this.redis.keys(pattern);

    if (keys.length === 0) {
      return null;
    }

    const data = await this.redis.get(keys[0]);
    if (!data) {
      return null;
    }

    const record = JSON.parse(data);
    // Parse dates
    record.createdAt = new Date(record.createdAt);
    record.updatedAt = new Date(record.updatedAt);
    record.expiresAt = new Date(record.expiresAt);
    record.dateRange.start = new Date(record.dateRange.start);
    record.dateRange.end = new Date(record.dateRange.end);
    if (record.completedAt) {
      record.completedAt = new Date(record.completedAt);
    }
    if (record.file?.expiresAt) {
      record.file.expiresAt = new Date(record.file.expiresAt);
    }

    return record;
  }

  /**
   * Update export status
   */
  private async updateExportStatus(
    exportId: string,
    status: ExportStatus,
    error?: string
  ): Promise<void> {
    const record = await this.getExportRecord(exportId);
    if (!record) {
      return;
    }

    record.status = status;
    record.updatedAt = new Date();

    if (error) {
      record.error = error;
    }

    await this.saveExportRecord(record);
  }

  /**
   * Update export progress
   */
  private async updateProgress(exportId: string, progress: number): Promise<void> {
    const record = await this.getExportRecord(exportId);
    if (!record) {
      return;
    }

    record.progress = progress;
    record.updatedAt = new Date();
    await this.saveExportRecord(record);
  }

  /**
   * Update export as completed
   */
  private async updateExportComplete(
    exportId: string,
    file: { key: string; size: number; downloadUrl: string; expiresAt: Date }
  ): Promise<void> {
    const record = await this.getExportRecord(exportId);
    if (!record) {
      return;
    }

    record.status = 'completed';
    record.progress = 100;
    record.file = file;
    record.completedAt = new Date();
    record.updatedAt = new Date();
    await this.saveExportRecord(record);
  }

  /**
   * Get count of active exports for a project
   */
  private async getActiveExportCount(projectId: string): Promise<number> {
    const pattern = `export:${projectId}:*`;
    const keys = await this.redis.keys(pattern);

    let activeCount = 0;
    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        const record = JSON.parse(data);
        if (record.status === 'pending' || record.status === 'processing') {
          activeCount++;
        }
      }
    }

    return activeCount;
  }

  // ==========================================================================
  // UTILITIES
  // ==========================================================================

  /**
   * Get content type for export format
   */
  private getContentType(format: ExportFormat): string {
    const contentTypes: Record<ExportFormat, string> = {
      csv: 'text/csv',
      pdf: 'application/pdf',
      json: 'application/json',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
    return contentTypes[format] || 'application/octet-stream';
  }

  /**
   * Send export completion notification (placeholder)
   */
  private async sendExportNotification(
    record: ExportRecord,
    downloadUrl: string
  ): Promise<void> {
    // TODO: Implement email notification
    console.log(`[PLACEHOLDER] Would send email to user ${record.userId} with download URL: ${downloadUrl}`);
  }
}
