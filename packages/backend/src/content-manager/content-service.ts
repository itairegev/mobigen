/**
 * Content Service
 *
 * Generic CRUD service for managing content across all template types.
 * This service is used by the owner dashboard to manage app data.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommand,
  QueryCommand,
  BatchWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import type {
  ContentItem,
  ListParams,
  ListResult,
  CreateInput,
  UpdateInput,
  DeleteResult,
  BulkOperationResult,
  ExportResult,
  ImportOptions,
  SearchOptions,
  SearchResult,
  SearchResultItem,
  IContentService,
  ContentManagementConfig,
  ResourceDefinition,
  UserTier,
  ContentOperation,
  hasAccess,
} from './types';
import { SchemaResolver } from './schema-resolver';
import type { QueryBuilder } from './query-builder';
import type { ValidationEngine } from './validation-engine';
import type { AuditLogger } from './audit-logger';

// ============================================================================
// TYPES
// ============================================================================

export interface ContentServiceConfig {
  region: string;
  tablePrefix: string;
  projectId: string;
  templateId: string;
  userId: string;
  userTier: UserTier;
}

export interface ProjectBackendInfo {
  projectId: string;
  templateId: string;
  tablePrefix: string;
  region: string;
  apiEndpoint?: string;
  apiKey?: string;
}

// ============================================================================
// CONTENT SERVICE IMPLEMENTATION
// ============================================================================

export class ContentService implements IContentService {
  private client: DynamoDBClient;
  private docClient: DynamoDBDocumentClient;
  private schemaResolver: SchemaResolver;
  private config: ContentServiceConfig;
  private queryBuilder?: QueryBuilder;
  private validationEngine?: ValidationEngine;
  private auditLogger?: AuditLogger;

  constructor(config: ContentServiceConfig) {
    this.config = config;
    this.client = new DynamoDBClient({ region: config.region });
    this.docClient = DynamoDBDocumentClient.from(this.client, {
      marshallOptions: { removeUndefinedValues: true },
    });
    this.schemaResolver = new SchemaResolver();
  }

  /**
   * Set optional dependencies (for testing and full integration)
   */
  setDependencies(deps: {
    queryBuilder?: QueryBuilder;
    validationEngine?: ValidationEngine;
    auditLogger?: AuditLogger;
  }): void {
    this.queryBuilder = deps.queryBuilder;
    this.validationEngine = deps.validationEngine;
    this.auditLogger = deps.auditLogger;
  }

  // ============================================================================
  // SCHEMA METHODS
  // ============================================================================

  /**
   * Get complete content management schema for the project
   */
  async getSchema(projectId: string): Promise<ContentManagementConfig> {
    this.checkAccess('view');
    return this.schemaResolver.resolveTemplate(this.config.templateId);
  }

  /**
   * Get schema for a specific resource
   */
  async getResourceSchema(projectId: string, resource: string): Promise<ResourceDefinition> {
    this.checkAccess('view');
    const schema = await this.getSchema(projectId);
    const resourceDef = schema.resources.find((r) => r.name === resource);

    if (!resourceDef) {
      throw new ContentServiceError(`Resource '${resource}' not found`, 'NOT_FOUND');
    }

    return resourceDef;
  }

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  /**
   * List items in a resource with pagination, filtering, and sorting
   */
  async list(projectId: string, params: ListParams): Promise<ListResult> {
    this.checkAccess('view');

    const tableName = this.getTableName(params.resource);
    const limit = Math.min(params.limit || 50, 100);

    try {
      // Use scan with filters
      const scanParams: Parameters<typeof this.docClient.send>[0] extends { input: infer T } ? T : never = {
        TableName: tableName,
        Limit: limit,
        FilterExpression: 'sk = :sk',
        ExpressionAttributeValues: { ':sk': 'META' } as Record<string, unknown>,
      };

      // Handle cursor-based pagination
      if (params.cursor) {
        try {
          const lastKey = JSON.parse(Buffer.from(params.cursor, 'base64').toString());
          (scanParams as { ExclusiveStartKey?: unknown }).ExclusiveStartKey = lastKey;
        } catch {
          // Invalid cursor, ignore
        }
      }

      // Add search filter if provided
      if (params.search) {
        const searchableFields = await this.getSearchableFields(params.resource);
        if (searchableFields.length > 0) {
          const searchConditions = searchableFields
            .map((f, i) => `contains(#searchField${i}, :searchValue)`)
            .join(' OR ');

          const existingFilter = (scanParams as { FilterExpression?: string }).FilterExpression;
          (scanParams as { FilterExpression: string }).FilterExpression = existingFilter
            ? `(${existingFilter}) AND (${searchConditions})`
            : searchConditions;

          const expressionNames = (scanParams as { ExpressionAttributeNames?: Record<string, string> }).ExpressionAttributeNames || {};
          const expressionValues = (scanParams as { ExpressionAttributeValues: Record<string, unknown> }).ExpressionAttributeValues;

          searchableFields.forEach((field, i) => {
            expressionNames[`#searchField${i}`] = field;
          });
          expressionValues[':searchValue'] = params.search!.toLowerCase();

          (scanParams as { ExpressionAttributeNames: Record<string, string> }).ExpressionAttributeNames = expressionNames;
        }
      }

      // Add custom filters
      if (params.filters && Object.keys(params.filters).length > 0) {
        const filterConditions: string[] = [];
        const expressionNames = (scanParams as { ExpressionAttributeNames?: Record<string, string> }).ExpressionAttributeNames || {};
        const expressionValues = (scanParams as { ExpressionAttributeValues: Record<string, unknown> }).ExpressionAttributeValues;

        Object.entries(params.filters).forEach(([key, value], i) => {
          expressionNames[`#filter${i}`] = key;
          expressionValues[`:filter${i}`] = value;
          filterConditions.push(`#filter${i} = :filter${i}`);
        });

        const existingFilter = (scanParams as { FilterExpression?: string }).FilterExpression;
        (scanParams as { FilterExpression: string }).FilterExpression = existingFilter
          ? `(${existingFilter}) AND (${filterConditions.join(' AND ')})`
          : filterConditions.join(' AND ');
        (scanParams as { ExpressionAttributeNames: Record<string, string> }).ExpressionAttributeNames = expressionNames;
      }

      const response = await this.docClient.send(new ScanCommand(scanParams as ConstructorParameters<typeof ScanCommand>[0]));

      // Transform items
      const items = (response.Items || []).map((item) => this.transformItem(item));

      // Apply sorting in memory (DynamoDB scan doesn't support sorting)
      if (params.sort) {
        items.sort((a, b) => {
          const aVal = a[params.sort!.field];
          const bVal = b[params.sort!.field];

          if (aVal === bVal) return 0;
          if (aVal === null || aVal === undefined) return 1;
          if (bVal === null || bVal === undefined) return -1;

          const comparison = aVal < bVal ? -1 : 1;
          return params.sort!.order === 'desc' ? -comparison : comparison;
        });
      }

      // Build cursor for next page
      let nextCursor: string | undefined;
      if (response.LastEvaluatedKey) {
        nextCursor = Buffer.from(JSON.stringify(response.LastEvaluatedKey)).toString('base64');
      }

      return {
        items,
        total: response.Count || 0,
        cursor: nextCursor,
        hasMore: !!response.LastEvaluatedKey,
        pageSize: limit,
      };
    } catch (error) {
      this.handleDynamoError(error, 'list', params.resource);
      throw error; // TypeScript needs this
    }
  }

  /**
   * Get a single item by ID
   */
  async get(projectId: string, resource: string, id: string): Promise<ContentItem> {
    this.checkAccess('view');

    const tableName = this.getTableName(resource);
    const pk = this.generatePK(resource, id);

    try {
      const response = await this.docClient.send(
        new GetCommand({
          TableName: tableName,
          Key: { pk, sk: 'META' },
        })
      );

      if (!response.Item) {
        throw new ContentServiceError(
          `${this.singularize(resource)} with id '${id}' not found`,
          'NOT_FOUND'
        );
      }

      return this.transformItem(response.Item);
    } catch (error) {
      if (error instanceof ContentServiceError) throw error;
      this.handleDynamoError(error, 'get', resource);
      throw error;
    }
  }

  /**
   * Create a new item
   */
  async create(projectId: string, input: CreateInput): Promise<ContentItem> {
    this.checkAccess('create');

    const { resource, data } = input;
    const tableName = this.getTableName(resource);
    const id = (data.id as string) || crypto.randomUUID();
    const pk = this.generatePK(resource, id);
    const now = new Date().toISOString();

    // Validate data if validation engine is available
    if (this.validationEngine) {
      await this.validationEngine.validate(resource, data);
    }

    const item = {
      ...data,
      pk,
      sk: 'META',
      id,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await this.docClient.send(
        new PutCommand({
          TableName: tableName,
          Item: item,
          ConditionExpression: 'attribute_not_exists(pk)',
        })
      );

      // Log audit event
      if (this.auditLogger) {
        await this.auditLogger.log({
          projectId,
          userId: this.config.userId,
          action: 'create',
          resource,
          resourceId: id,
          newData: data as Record<string, unknown>,
        });
      }

      return this.transformItem(item);
    } catch (error) {
      if ((error as { name?: string }).name === 'ConditionalCheckFailedException') {
        throw new ContentServiceError(
          `${this.singularize(resource)} with id '${id}' already exists`,
          'CONFLICT'
        );
      }
      this.handleDynamoError(error, 'create', resource);
      throw error;
    }
  }

  /**
   * Update an existing item
   */
  async update(projectId: string, input: UpdateInput): Promise<ContentItem> {
    this.checkAccess('update');

    const { resource, id, data } = input;
    const tableName = this.getTableName(resource);
    const pk = this.generatePK(resource, id);
    const now = new Date().toISOString();

    // Get existing item for audit
    let previousData: Record<string, unknown> | undefined;
    if (this.auditLogger) {
      try {
        const existing = await this.get(projectId, resource, id);
        previousData = existing as Record<string, unknown>;
      } catch {
        // Item doesn't exist, will fail on update
      }
    }

    // Validate data if validation engine is available
    if (this.validationEngine) {
      await this.validationEngine.validate(resource, data, true);
    }

    // Build update expression
    const updateExpressions: string[] = ['#updatedAt = :updatedAt'];
    const expressionValues: Record<string, unknown> = { ':updatedAt': now };
    const expressionNames: Record<string, string> = { '#updatedAt': 'updatedAt' };

    const reservedKeys = ['pk', 'sk', 'id', 'createdAt', 'updatedAt'];

    Object.entries(data).forEach(([key, value]) => {
      if (!reservedKeys.includes(key)) {
        updateExpressions.push(`#${key} = :${key}`);
        expressionValues[`:${key}`] = value;
        expressionNames[`#${key}`] = key;
      }
    });

    try {
      const response = await this.docClient.send(
        new UpdateCommand({
          TableName: tableName,
          Key: { pk, sk: 'META' },
          UpdateExpression: `SET ${updateExpressions.join(', ')}`,
          ExpressionAttributeValues: expressionValues,
          ExpressionAttributeNames: expressionNames,
          ConditionExpression: 'attribute_exists(pk)',
          ReturnValues: 'ALL_NEW',
        })
      );

      if (!response.Attributes) {
        throw new ContentServiceError(
          `${this.singularize(resource)} with id '${id}' not found`,
          'NOT_FOUND'
        );
      }

      // Log audit event
      if (this.auditLogger) {
        await this.auditLogger.log({
          projectId,
          userId: this.config.userId,
          action: 'update',
          resource,
          resourceId: id,
          previousData,
          newData: data,
        });
      }

      return this.transformItem(response.Attributes);
    } catch (error) {
      if ((error as { name?: string }).name === 'ConditionalCheckFailedException') {
        throw new ContentServiceError(
          `${this.singularize(resource)} with id '${id}' not found`,
          'NOT_FOUND'
        );
      }
      this.handleDynamoError(error, 'update', resource);
      throw error;
    }
  }

  /**
   * Delete an item
   */
  async delete(projectId: string, resource: string, id: string): Promise<DeleteResult> {
    this.checkAccess('delete');

    const tableName = this.getTableName(resource);
    const pk = this.generatePK(resource, id);

    // Get existing item for audit
    let previousData: Record<string, unknown> | undefined;
    if (this.auditLogger) {
      try {
        const existing = await this.get(projectId, resource, id);
        previousData = existing as Record<string, unknown>;
      } catch {
        // Item doesn't exist
      }
    }

    try {
      await this.docClient.send(
        new DeleteCommand({
          TableName: tableName,
          Key: { pk, sk: 'META' },
          ConditionExpression: 'attribute_exists(pk)',
        })
      );

      // Log audit event
      if (this.auditLogger) {
        await this.auditLogger.log({
          projectId,
          userId: this.config.userId,
          action: 'delete',
          resource,
          resourceId: id,
          previousData,
        });
      }

      return { success: true, id };
    } catch (error) {
      if ((error as { name?: string }).name === 'ConditionalCheckFailedException') {
        throw new ContentServiceError(
          `${this.singularize(resource)} with id '${id}' not found`,
          'NOT_FOUND'
        );
      }
      this.handleDynamoError(error, 'delete', resource);
      throw error;
    }
  }

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  /**
   * Bulk create items
   */
  async bulkCreate(
    projectId: string,
    resource: string,
    items: Record<string, unknown>[]
  ): Promise<BulkOperationResult> {
    this.checkAccess('bulk');

    const tableName = this.getTableName(resource);
    const now = new Date().toISOString();
    const results = { succeeded: 0, failed: 0, errors: [] as Array<{ id: string; error: string }> };

    // Process in batches of 25 (DynamoDB limit)
    const batchSize = 25;
    const createdIds: string[] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const writeRequests = batch.map((data) => {
        const id = (data.id as string) || crypto.randomUUID();
        const pk = this.generatePK(resource, id);
        createdIds.push(id);

        return {
          PutRequest: {
            Item: {
              ...data,
              pk,
              sk: 'META',
              id,
              createdAt: now,
              updatedAt: now,
            },
          },
        };
      });

      try {
        await this.docClient.send(
          new BatchWriteCommand({
            RequestItems: { [tableName]: writeRequests },
          })
        );
        results.succeeded += batch.length;
      } catch (error) {
        results.failed += batch.length;
        batch.forEach((_, idx) => {
          results.errors.push({
            id: createdIds[i + idx] || `item-${i + idx}`,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        });
      }
    }

    // Log audit event
    if (this.auditLogger) {
      await this.auditLogger.log({
        projectId,
        userId: this.config.userId,
        action: 'bulk_create',
        resource,
        bulkCount: results.succeeded,
        bulkIds: createdIds.slice(0, results.succeeded),
      });
    }

    return {
      success: results.failed === 0,
      total: items.length,
      succeeded: results.succeeded,
      failed: results.failed,
      errors: results.errors,
    };
  }

  /**
   * Bulk update items
   */
  async bulkUpdate(
    projectId: string,
    resource: string,
    items: Array<{ id: string; data: Record<string, unknown> }>
  ): Promise<BulkOperationResult> {
    this.checkAccess('bulk');

    const results = { succeeded: 0, failed: 0, errors: [] as Array<{ id: string; error: string }> };
    const updatedIds: string[] = [];

    // Updates must be done individually due to DynamoDB limitations
    for (const item of items) {
      try {
        await this.update(projectId, { resource, id: item.id, data: item.data });
        results.succeeded++;
        updatedIds.push(item.id);
      } catch (error) {
        results.failed++;
        results.errors.push({
          id: item.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Log bulk audit event (individual updates already logged)
    if (this.auditLogger && results.succeeded > 0) {
      await this.auditLogger.log({
        projectId,
        userId: this.config.userId,
        action: 'bulk_update',
        resource,
        bulkCount: results.succeeded,
        bulkIds: updatedIds,
      });
    }

    return {
      success: results.failed === 0,
      total: items.length,
      succeeded: results.succeeded,
      failed: results.failed,
      errors: results.errors,
    };
  }

  /**
   * Bulk delete items
   */
  async bulkDelete(projectId: string, resource: string, ids: string[]): Promise<BulkOperationResult> {
    this.checkAccess('bulk');

    const tableName = this.getTableName(resource);
    const results = { succeeded: 0, failed: 0, errors: [] as Array<{ id: string; error: string }> };
    const deletedIds: string[] = [];

    // Process in batches of 25
    const batchSize = 25;

    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);
      const writeRequests = batch.map((id) => ({
        DeleteRequest: {
          Key: {
            pk: this.generatePK(resource, id),
            sk: 'META',
          },
        },
      }));

      try {
        await this.docClient.send(
          new BatchWriteCommand({
            RequestItems: { [tableName]: writeRequests },
          })
        );
        results.succeeded += batch.length;
        deletedIds.push(...batch);
      } catch (error) {
        results.failed += batch.length;
        batch.forEach((id) => {
          results.errors.push({
            id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        });
      }
    }

    // Log audit event
    if (this.auditLogger) {
      await this.auditLogger.log({
        projectId,
        userId: this.config.userId,
        action: 'bulk_delete',
        resource,
        bulkCount: results.succeeded,
        bulkIds: deletedIds,
      });
    }

    return {
      success: results.failed === 0,
      total: ids.length,
      succeeded: results.succeeded,
      failed: results.failed,
      errors: results.errors,
    };
  }

  // ============================================================================
  // SEARCH
  // ============================================================================

  /**
   * Search across resources
   */
  async search(projectId: string, query: string, options?: SearchOptions): Promise<SearchResult> {
    this.checkAccess('view');

    const resource = options?.resource;
    const limit = options?.limit || 20;

    if (!resource) {
      throw new ContentServiceError('Resource is required for search', 'BAD_REQUEST');
    }

    const resourceDef = await this.getResourceSchema(projectId, resource);
    const searchableFields = options?.fields || await this.getSearchableFields(resource);

    // Perform search using scan (for MVP, consider ElasticSearch for production)
    const tableName = this.getTableName(resource);
    const searchConditions = searchableFields
      .map((f, i) => `contains(#field${i}, :searchValue)`)
      .join(' OR ');

    const expressionNames: Record<string, string> = {};
    searchableFields.forEach((field, i) => {
      expressionNames[`#field${i}`] = field;
    });

    try {
      const response = await this.docClient.send(
        new ScanCommand({
          TableName: tableName,
          Limit: limit,
          FilterExpression: `sk = :sk AND (${searchConditions})`,
          ExpressionAttributeNames: expressionNames,
          ExpressionAttributeValues: {
            ':sk': 'META',
            ':searchValue': query.toLowerCase(),
          },
        })
      );

      const items: SearchResultItem[] = (response.Items || []).map((item) => {
        const transformed = this.transformItem(item);
        return {
          id: transformed.id,
          resource,
          title: String(transformed[resourceDef.titleField] || transformed.id),
          subtitle: resourceDef.subtitleField
            ? String(transformed[resourceDef.subtitleField] || '')
            : undefined,
          image: resourceDef.imageField
            ? String(transformed[resourceDef.imageField] || '')
            : undefined,
        };
      });

      return {
        items,
        total: items.length,
        query,
      };
    } catch (error) {
      this.handleDynamoError(error, 'search', resource);
      throw error;
    }
  }

  // ============================================================================
  // IMPORT/EXPORT
  // ============================================================================

  /**
   * Export resource data to CSV
   */
  async exportToCSV(
    projectId: string,
    resource: string,
    filters?: Record<string, unknown>
  ): Promise<ExportResult> {
    this.checkAccess('export');

    // Get all items
    const result = await this.list(projectId, {
      resource,
      limit: 1000, // Export limit
      filters,
    });

    // Get resource schema for headers
    const resourceDef = await this.getResourceSchema(projectId, resource);
    const headers = resourceDef.attributes
      .filter((a) => !a.hidden)
      .map((a) => a.name);

    // Build CSV content
    const csvRows: string[] = [headers.join(',')];

    for (const item of result.items) {
      const row = headers.map((h) => {
        const value = item[h];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
        if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        return String(value);
      });
      csvRows.push(row.join(','));
    }

    const csvContent = csvRows.join('\n');

    // In production, upload to S3 and return presigned URL
    // For now, return the content directly (base64 encoded for transport)
    const downloadUrl = `data:text/csv;base64,${Buffer.from(csvContent).toString('base64')}`;

    // Log audit event
    if (this.auditLogger) {
      await this.auditLogger.log({
        projectId,
        userId: this.config.userId,
        action: 'export',
        resource,
        bulkCount: result.items.length,
      });
    }

    return {
      success: true,
      downloadUrl,
      format: 'csv',
      rowCount: result.items.length,
      expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour
    };
  }

  /**
   * Import data from CSV
   */
  async importFromCSV(
    projectId: string,
    resource: string,
    data: string,
    options?: ImportOptions
  ): Promise<BulkOperationResult> {
    this.checkAccess('import');

    const mode = options?.mode || 'create';
    const skipErrors = options?.skipErrors ?? true;
    const dryRun = options?.dryRun ?? false;

    // Parse CSV
    const lines = data.split('\n').filter((l) => l.trim());
    if (lines.length < 2) {
      throw new ContentServiceError('CSV must have header row and at least one data row', 'BAD_REQUEST');
    }

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    const items: Record<string, unknown>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      const item: Record<string, unknown> = {};

      headers.forEach((header, idx) => {
        let value: unknown = values[idx];

        // Try to parse JSON values
        if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
          try {
            value = JSON.parse(value);
          } catch {
            // Keep as string
          }
        }

        // Try to parse numbers
        if (typeof value === 'string' && /^-?\d+(\.\d+)?$/.test(value)) {
          value = parseFloat(value);
        }

        item[header] = value;
      });

      items.push(item);
    }

    if (dryRun) {
      return {
        success: true,
        total: items.length,
        succeeded: items.length,
        failed: 0,
        errors: [],
      };
    }

    // Perform import based on mode
    let result: BulkOperationResult;

    switch (mode) {
      case 'create':
        result = await this.bulkCreate(projectId, resource, items);
        break;

      case 'update':
        const updateItems = items
          .filter((item) => item.id)
          .map((item) => ({ id: item.id as string, data: item }));
        result = await this.bulkUpdate(projectId, resource, updateItems);
        break;

      case 'upsert':
        // For upsert, try update first, then create if not found
        const results = { succeeded: 0, failed: 0, errors: [] as Array<{ id: string; error: string }> };

        for (const item of items) {
          try {
            if (item.id) {
              await this.update(projectId, { resource, id: item.id as string, data: item });
            } else {
              await this.create(projectId, { resource, data: item });
            }
            results.succeeded++;
          } catch (error) {
            if ((error as ContentServiceError).code === 'NOT_FOUND' && item.id) {
              // Item doesn't exist, create it
              try {
                await this.create(projectId, { resource, data: item });
                results.succeeded++;
              } catch (createError) {
                results.failed++;
                if (!skipErrors) {
                  results.errors.push({
                    id: String(item.id || `row-${items.indexOf(item)}`),
                    error: createError instanceof Error ? createError.message : 'Unknown error',
                  });
                }
              }
            } else {
              results.failed++;
              if (!skipErrors) {
                results.errors.push({
                  id: String(item.id || `row-${items.indexOf(item)}`),
                  error: error instanceof Error ? error.message : 'Unknown error',
                });
              }
            }
          }
        }

        result = {
          success: results.failed === 0,
          total: items.length,
          succeeded: results.succeeded,
          failed: results.failed,
          errors: results.errors,
        };
        break;

      default:
        throw new ContentServiceError(`Invalid import mode: ${mode}`, 'BAD_REQUEST');
    }

    // Log audit event
    if (this.auditLogger) {
      await this.auditLogger.log({
        projectId,
        userId: this.config.userId,
        action: 'import',
        resource,
        bulkCount: result.succeeded,
      });
    }

    return result;
  }

  // ============================================================================
  // AUDIT
  // ============================================================================

  /**
   * Get audit log entries
   */
  async getAuditLog(
    projectId: string,
    resource?: string,
    limit?: number
  ): Promise<import('./types').AuditLogEntry[]> {
    this.checkAccess('audit');

    if (!this.auditLogger) {
      return [];
    }

    return this.auditLogger.getEntries(projectId, resource, limit);
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Check if user has access to the operation
   */
  private checkAccess(operation: ContentOperation): void {
    const tierAccess: Record<UserTier, ContentOperation[]> = {
      basic: ['view'],
      pro: ['view', 'create', 'update', 'delete', 'bulk', 'export', 'import', 'audit'],
      enterprise: ['view', 'create', 'update', 'delete', 'bulk', 'export', 'import', 'audit', 'api_keys', 'team'],
    };

    const allowed = tierAccess[this.config.userTier] || [];
    if (!allowed.includes(operation)) {
      throw new ContentServiceError(
        `Operation '${operation}' requires ${this.getRequiredTier(operation)} tier or higher`,
        'FORBIDDEN'
      );
    }
  }

  /**
   * Get required tier for an operation
   */
  private getRequiredTier(operation: ContentOperation): string {
    if (operation === 'view') return 'basic';
    if (['api_keys', 'team'].includes(operation)) return 'enterprise';
    return 'pro';
  }

  /**
   * Get full table name
   */
  private getTableName(resource: string): string {
    return `${this.config.tablePrefix}-${resource}`;
  }

  /**
   * Generate partition key
   */
  private generatePK(resource: string, id: string): string {
    const singular = this.singularize(resource);
    return `${singular.toUpperCase()}#${id}`;
  }

  /**
   * Singularize a resource name
   */
  private singularize(word: string): string {
    if (word.endsWith('ies')) {
      return word.slice(0, -3) + 'y';
    }
    if (word.endsWith('es') && (word.endsWith('sses') || word.endsWith('xes') || word.endsWith('shes') || word.endsWith('ches'))) {
      return word.slice(0, -2);
    }
    if (word.endsWith('s') && !word.endsWith('ss')) {
      return word.slice(0, -1);
    }
    return word;
  }

  /**
   * Transform DynamoDB item to ContentItem (remove internal keys)
   */
  private transformItem(item: Record<string, unknown>): ContentItem {
    const { pk, sk, ...rest } = item;
    return rest as ContentItem;
  }

  /**
   * Get searchable fields for a resource
   */
  private async getSearchableFields(resource: string): Promise<string[]> {
    try {
      const resourceDef = await this.getResourceSchema(this.config.projectId, resource);
      return resourceDef.attributes
        .filter((a) => a.searchable !== false && a.type === 'string')
        .map((a) => a.name);
    } catch {
      // Default searchable fields
      return ['name', 'title', 'description'];
    }
  }

  /**
   * Parse a CSV line handling quoted values
   */
  private parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"' && inQuotes && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    values.push(current);
    return values;
  }

  /**
   * Handle DynamoDB errors
   */
  private handleDynamoError(error: unknown, operation: string, resource: string): never {
    const err = error as { name?: string; message?: string };
    console.error(`[ContentService] ${operation} error on ${resource}:`, error);

    if (err.name === 'ResourceNotFoundException') {
      throw new ContentServiceError(`Resource '${resource}' table not found`, 'NOT_FOUND');
    }

    if (err.name === 'ValidationException') {
      throw new ContentServiceError(`Invalid data: ${err.message}`, 'BAD_REQUEST');
    }

    throw new ContentServiceError(
      `Database error: ${err.message || 'Unknown error'}`,
      'INTERNAL_ERROR'
    );
  }
}

// ============================================================================
// ERROR CLASS
// ============================================================================

export class ContentServiceError extends Error {
  code: 'NOT_FOUND' | 'CONFLICT' | 'FORBIDDEN' | 'BAD_REQUEST' | 'INTERNAL_ERROR';

  constructor(
    message: string,
    code: 'NOT_FOUND' | 'CONFLICT' | 'FORBIDDEN' | 'BAD_REQUEST' | 'INTERNAL_ERROR'
  ) {
    super(message);
    this.name = 'ContentServiceError';
    this.code = code;
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a content service instance for a project
 */
export function createContentService(
  backendInfo: ProjectBackendInfo,
  userId: string,
  userTier: UserTier
): ContentService {
  return new ContentService({
    region: backendInfo.region,
    tablePrefix: backendInfo.tablePrefix,
    projectId: backendInfo.projectId,
    templateId: backendInfo.templateId,
    userId,
    userTier,
  });
}
