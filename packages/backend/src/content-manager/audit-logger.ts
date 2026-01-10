/**
 * Audit Logger
 *
 * Tracks all content changes for compliance, debugging, and undo functionality.
 * Supports both database-backed and in-memory audit logging.
 */

import type { AuditLogEntry, AuditAction, UserTier } from './types';

// ============================================================================
// TYPES
// ============================================================================

export interface AuditLogInput {
  projectId: string;
  userId: string;
  userName?: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  previousData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  bulkCount?: number;
  bulkIds?: string[];
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogFilter {
  projectId?: string;
  userId?: string;
  action?: AuditAction | AuditAction[];
  resource?: string;
  resourceId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface AuditLoggerConfig {
  enabled: boolean;
  retentionDays: number;
  maxEntriesPerProject: number;
  sensitiveFields?: string[];
  storage: AuditStorage;
}

export interface AuditStorage {
  save(entry: AuditLogEntry): Promise<void>;
  query(filter: AuditLogFilter, limit: number, offset?: number): Promise<AuditLogEntry[]>;
  count(filter: AuditLogFilter): Promise<number>;
  delete(filter: AuditLogFilter): Promise<number>;
}

// ============================================================================
// AUDIT LOGGER CLASS
// ============================================================================

export class AuditLogger {
  private config: AuditLoggerConfig;
  private sensitiveFields: Set<string>;

  constructor(config: AuditLoggerConfig) {
    this.config = config;
    this.sensitiveFields = new Set(config.sensitiveFields || [
      'password',
      'passwordHash',
      'secret',
      'apiKey',
      'token',
      'accessToken',
      'refreshToken',
      'creditCard',
      'ssn',
      'pin',
    ]);
  }

  /**
   * Log an audit event
   */
  async log(input: AuditLogInput): Promise<AuditLogEntry> {
    if (!this.config.enabled) {
      return this.createEntry(input);
    }

    const entry = this.createEntry(input);

    // Redact sensitive fields
    if (entry.previousData) {
      entry.previousData = this.redactSensitiveData(entry.previousData);
    }
    if (entry.newData) {
      entry.newData = this.redactSensitiveData(entry.newData);
    }

    await this.config.storage.save(entry);

    return entry;
  }

  /**
   * Get audit log entries for a project
   */
  async getEntries(
    projectId: string,
    resource?: string,
    limit = 100
  ): Promise<AuditLogEntry[]> {
    const filter: AuditLogFilter = { projectId };
    if (resource) {
      filter.resource = resource;
    }

    return this.config.storage.query(filter, limit);
  }

  /**
   * Get entries for a specific resource item
   */
  async getItemHistory(
    projectId: string,
    resource: string,
    resourceId: string,
    limit = 50
  ): Promise<AuditLogEntry[]> {
    return this.config.storage.query(
      { projectId, resource, resourceId },
      limit
    );
  }

  /**
   * Get entries by user
   */
  async getByUser(
    projectId: string,
    userId: string,
    limit = 100
  ): Promise<AuditLogEntry[]> {
    return this.config.storage.query({ projectId, userId }, limit);
  }

  /**
   * Search entries with filters
   */
  async search(
    filter: AuditLogFilter,
    limit = 100,
    offset = 0
  ): Promise<{ entries: AuditLogEntry[]; total: number }> {
    const [entries, total] = await Promise.all([
      this.config.storage.query(filter, limit, offset),
      this.config.storage.count(filter),
    ]);

    return { entries, total };
  }

  /**
   * Get changes between two points in time
   */
  async getChanges(
    projectId: string,
    startDate: Date,
    endDate: Date = new Date()
  ): Promise<AuditLogEntry[]> {
    return this.config.storage.query(
      { projectId, startDate, endDate },
      1000
    );
  }

  /**
   * Clean up old entries based on retention policy
   */
  async cleanup(projectId?: string): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

    const filter: AuditLogFilter = {
      endDate: cutoffDate,
    };

    if (projectId) {
      filter.projectId = projectId;
    }

    return this.config.storage.delete(filter);
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Create an audit log entry
   */
  private createEntry(input: AuditLogInput): AuditLogEntry {
    return {
      id: crypto.randomUUID(),
      projectId: input.projectId,
      userId: input.userId,
      userName: input.userName,
      action: input.action,
      resource: input.resource,
      resourceId: input.resourceId,
      previousData: input.previousData,
      newData: input.newData,
      bulkCount: input.bulkCount,
      bulkIds: input.bulkIds,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Redact sensitive data from objects
   */
  private redactSensitiveData(data: Record<string, unknown>): Record<string, unknown> {
    const redacted: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      if (this.sensitiveFields.has(key.toLowerCase())) {
        redacted[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        redacted[key] = this.redactSensitiveData(value as Record<string, unknown>);
      } else {
        redacted[key] = value;
      }
    }

    return redacted;
  }
}

// ============================================================================
// IN-MEMORY STORAGE (for development/testing)
// ============================================================================

export class InMemoryAuditStorage implements AuditStorage {
  private entries: AuditLogEntry[] = [];
  private maxEntries: number;

  constructor(maxEntries = 10000) {
    this.maxEntries = maxEntries;
  }

  async save(entry: AuditLogEntry): Promise<void> {
    this.entries.unshift(entry);

    // Trim if exceeds max
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(0, this.maxEntries);
    }
  }

  async query(filter: AuditLogFilter, limit: number, offset = 0): Promise<AuditLogEntry[]> {
    let filtered = this.entries;

    if (filter.projectId) {
      filtered = filtered.filter((e) => e.projectId === filter.projectId);
    }

    if (filter.userId) {
      filtered = filtered.filter((e) => e.userId === filter.userId);
    }

    if (filter.action) {
      const actions = Array.isArray(filter.action) ? filter.action : [filter.action];
      filtered = filtered.filter((e) => actions.includes(e.action));
    }

    if (filter.resource) {
      filtered = filtered.filter((e) => e.resource === filter.resource);
    }

    if (filter.resourceId) {
      filtered = filtered.filter((e) => e.resourceId === filter.resourceId);
    }

    if (filter.startDate) {
      filtered = filtered.filter((e) => new Date(e.createdAt) >= filter.startDate!);
    }

    if (filter.endDate) {
      filtered = filtered.filter((e) => new Date(e.createdAt) <= filter.endDate!);
    }

    return filtered.slice(offset, offset + limit);
  }

  async count(filter: AuditLogFilter): Promise<number> {
    const filtered = await this.query(filter, this.entries.length);
    return filtered.length;
  }

  async delete(filter: AuditLogFilter): Promise<number> {
    const initialLength = this.entries.length;

    this.entries = this.entries.filter((entry) => {
      if (filter.projectId && entry.projectId !== filter.projectId) return true;
      if (filter.endDate && new Date(entry.createdAt) > filter.endDate) return true;
      return false;
    });

    return initialLength - this.entries.length;
  }

  clear(): void {
    this.entries = [];
  }
}

// ============================================================================
// PRISMA STORAGE (for production)
// ============================================================================

export class PrismaAuditStorage implements AuditStorage {
  private prisma: PrismaClientLike;

  constructor(prisma: PrismaClientLike) {
    this.prisma = prisma;
  }

  async save(entry: AuditLogEntry): Promise<void> {
    await this.prisma.contentAuditLog.create({
      data: {
        id: entry.id,
        projectId: entry.projectId,
        userId: entry.userId,
        userName: entry.userName,
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId,
        previousData: entry.previousData as object | undefined,
        newData: entry.newData as object | undefined,
        bulkCount: entry.bulkCount,
        bulkIds: entry.bulkIds,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        createdAt: new Date(entry.createdAt),
      },
    });
  }

  async query(filter: AuditLogFilter, limit: number, offset = 0): Promise<AuditLogEntry[]> {
    const where = this.buildWhereClause(filter);

    const entries = await this.prisma.contentAuditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return entries.map(this.mapToAuditLogEntry);
  }

  async count(filter: AuditLogFilter): Promise<number> {
    const where = this.buildWhereClause(filter);
    return this.prisma.contentAuditLog.count({ where });
  }

  async delete(filter: AuditLogFilter): Promise<number> {
    const where = this.buildWhereClause(filter);
    const result = await this.prisma.contentAuditLog.deleteMany({ where });
    return result.count;
  }

  private buildWhereClause(filter: AuditLogFilter): Record<string, unknown> {
    const where: Record<string, unknown> = {};

    if (filter.projectId) {
      where.projectId = filter.projectId;
    }

    if (filter.userId) {
      where.userId = filter.userId;
    }

    if (filter.action) {
      where.action = Array.isArray(filter.action)
        ? { in: filter.action }
        : filter.action;
    }

    if (filter.resource) {
      where.resource = filter.resource;
    }

    if (filter.resourceId) {
      where.resourceId = filter.resourceId;
    }

    if (filter.startDate || filter.endDate) {
      where.createdAt = {};
      if (filter.startDate) {
        (where.createdAt as Record<string, Date>).gte = filter.startDate;
      }
      if (filter.endDate) {
        (where.createdAt as Record<string, Date>).lte = filter.endDate;
      }
    }

    return where;
  }

  private mapToAuditLogEntry(record: ContentAuditLogRecord): AuditLogEntry {
    return {
      id: record.id,
      projectId: record.projectId,
      userId: record.userId,
      userName: record.userName || undefined,
      action: record.action as AuditAction,
      resource: record.resource,
      resourceId: record.resourceId || undefined,
      previousData: record.previousData as Record<string, unknown> | undefined,
      newData: record.newData as Record<string, unknown> | undefined,
      bulkCount: record.bulkCount || undefined,
      bulkIds: record.bulkIds || undefined,
      ipAddress: record.ipAddress || undefined,
      userAgent: record.userAgent || undefined,
      createdAt: record.createdAt.toISOString(),
    };
  }
}

// Type for Prisma client (to avoid hard dependency)
interface PrismaClientLike {
  contentAuditLog: {
    create(args: { data: Record<string, unknown> }): Promise<unknown>;
    findMany(args: {
      where?: Record<string, unknown>;
      orderBy?: Record<string, string>;
      take?: number;
      skip?: number;
    }): Promise<ContentAuditLogRecord[]>;
    count(args: { where?: Record<string, unknown> }): Promise<number>;
    deleteMany(args: { where?: Record<string, unknown> }): Promise<{ count: number }>;
  };
}

interface ContentAuditLogRecord {
  id: string;
  projectId: string;
  userId: string;
  userName: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  previousData: unknown;
  newData: unknown;
  bulkCount: number | null;
  bulkIds: string[] | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create an audit logger with in-memory storage
 */
export function createInMemoryAuditLogger(
  config?: Partial<AuditLoggerConfig>
): AuditLogger {
  return new AuditLogger({
    enabled: true,
    retentionDays: 30,
    maxEntriesPerProject: 10000,
    storage: new InMemoryAuditStorage(),
    ...config,
  });
}

/**
 * Create an audit logger with Prisma storage
 */
export function createPrismaAuditLogger(
  prisma: PrismaClientLike,
  config?: Partial<Omit<AuditLoggerConfig, 'storage'>>
): AuditLogger {
  return new AuditLogger({
    enabled: true,
    retentionDays: 90,
    maxEntriesPerProject: 100000,
    storage: new PrismaAuditStorage(prisma),
    ...config,
  });
}

/**
 * Create an audit logger based on user tier
 */
export function createTieredAuditLogger(
  prisma: PrismaClientLike,
  userTier: UserTier
): AuditLogger {
  const tierConfig: Record<UserTier, Partial<AuditLoggerConfig>> = {
    basic: {
      enabled: false,
      retentionDays: 0,
      maxEntriesPerProject: 0,
    },
    pro: {
      enabled: true,
      retentionDays: 7,
      maxEntriesPerProject: 10000,
    },
    enterprise: {
      enabled: true,
      retentionDays: 365,
      maxEntriesPerProject: 1000000,
    },
  };

  return createPrismaAuditLogger(prisma, tierConfig[userTier]);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get human-readable action description
 */
export function getActionDescription(action: AuditAction): string {
  const descriptions: Record<AuditAction, string> = {
    create: 'Created',
    update: 'Updated',
    delete: 'Deleted',
    bulk_create: 'Bulk created',
    bulk_update: 'Bulk updated',
    bulk_delete: 'Bulk deleted',
    import: 'Imported',
    export: 'Exported',
    restore: 'Restored',
  };

  return descriptions[action] || action;
}

/**
 * Format audit entry for display
 */
export function formatAuditEntry(entry: AuditLogEntry): string {
  const action = getActionDescription(entry.action);
  const user = entry.userName || entry.userId;
  const resource = entry.resource;
  const count = entry.bulkCount;

  if (count && count > 1) {
    return `${user} ${action.toLowerCase()} ${count} ${resource}`;
  }

  if (entry.resourceId) {
    return `${user} ${action.toLowerCase()} ${resource} #${entry.resourceId}`;
  }

  return `${user} ${action.toLowerCase()} ${resource}`;
}

/**
 * Compute diff between previous and new data
 */
export function computeDiff(
  previousData?: Record<string, unknown>,
  newData?: Record<string, unknown>
): { field: string; from: unknown; to: unknown }[] {
  const diff: { field: string; from: unknown; to: unknown }[] = [];

  if (!previousData && !newData) return diff;

  const allKeys = new Set([
    ...Object.keys(previousData || {}),
    ...Object.keys(newData || {}),
  ]);

  for (const key of allKeys) {
    const from = previousData?.[key];
    const to = newData?.[key];

    if (JSON.stringify(from) !== JSON.stringify(to)) {
      diff.push({ field: key, from, to });
    }
  }

  return diff;
}
