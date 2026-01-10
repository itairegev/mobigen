/**
 * Query Builder
 *
 * Constructs DynamoDB queries with filtering, sorting, and pagination support.
 * Provides a fluent API for building complex queries against content resources.
 */

import type {
  ScanCommandInput,
  QueryCommandInput,
} from '@aws-sdk/lib-dynamodb';
import type { ResourceDefinition, ContentAttributeDefinition } from './types';

// ============================================================================
// TYPES
// ============================================================================

export type FilterOperator =
  | 'eq'       // Equal
  | 'ne'       // Not equal
  | 'lt'       // Less than
  | 'lte'      // Less than or equal
  | 'gt'       // Greater than
  | 'gte'      // Greater than or equal
  | 'between'  // Between two values
  | 'begins'   // Begins with (for strings)
  | 'contains' // Contains (for strings/lists)
  | 'in'       // In a list of values
  | 'exists'   // Attribute exists
  | 'not_exists'; // Attribute does not exist

export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value?: unknown;
  value2?: unknown; // For 'between' operator
}

export interface SortConfig {
  field: string;
  order: 'asc' | 'desc';
}

export interface PaginationConfig {
  limit: number;
  cursor?: string;
  offset?: number;
}

export interface QueryConfig {
  tableName: string;
  indexName?: string;
  filters?: FilterCondition[];
  sort?: SortConfig;
  pagination?: PaginationConfig;
  search?: {
    query: string;
    fields: string[];
  };
  projection?: string[];
  includeDeleted?: boolean;
}

export interface BuiltQuery {
  type: 'scan' | 'query';
  params: ScanCommandInput | QueryCommandInput;
  sortInMemory?: SortConfig;
}

// ============================================================================
// QUERY BUILDER CLASS
// ============================================================================

export class QueryBuilder {
  private config: QueryConfig;
  private expressionNames: Record<string, string> = {};
  private expressionValues: Record<string, unknown> = {};
  private filterExpressions: string[] = [];
  private nameCounter = 0;
  private valueCounter = 0;

  constructor(tableName: string) {
    this.config = {
      tableName,
      filters: [],
      pagination: { limit: 50 },
    };
  }

  /**
   * Set the table name
   */
  table(tableName: string): this {
    this.config.tableName = tableName;
    return this;
  }

  /**
   * Use a GSI index
   */
  index(indexName: string): this {
    this.config.indexName = indexName;
    return this;
  }

  /**
   * Add a filter condition
   */
  filter(field: string, operator: FilterOperator, value?: unknown, value2?: unknown): this {
    this.config.filters = this.config.filters || [];
    this.config.filters.push({ field, operator, value, value2 });
    return this;
  }

  /**
   * Add an equality filter (shorthand)
   */
  where(field: string, value: unknown): this {
    return this.filter(field, 'eq', value);
  }

  /**
   * Add a search condition
   */
  search(query: string, fields: string[]): this {
    this.config.search = { query, fields };
    return this;
  }

  /**
   * Set sort configuration
   */
  sort(field: string, order: 'asc' | 'desc' = 'asc'): this {
    this.config.sort = { field, order };
    return this;
  }

  /**
   * Set pagination
   */
  paginate(limit: number, cursor?: string): this {
    this.config.pagination = { limit: Math.min(limit, 100), cursor };
    return this;
  }

  /**
   * Set projection (fields to return)
   */
  select(...fields: string[]): this {
    this.config.projection = fields;
    return this;
  }

  /**
   * Include soft-deleted items
   */
  includeDeleted(): this {
    this.config.includeDeleted = true;
    return this;
  }

  /**
   * Build the query parameters
   */
  build(): BuiltQuery {
    this.reset();

    // Always filter for META sort key (our data model convention)
    this.addFilterExpression('sk', 'eq', 'META');

    // Add soft delete filter unless includeDeleted
    if (!this.config.includeDeleted) {
      this.addFilterExpression('deletedAt', 'not_exists');
    }

    // Add custom filters
    if (this.config.filters) {
      for (const filter of this.config.filters) {
        this.addFilterExpression(filter.field, filter.operator, filter.value, filter.value2);
      }
    }

    // Add search condition
    if (this.config.search && this.config.search.query && this.config.search.fields.length > 0) {
      const searchConditions = this.config.search.fields.map((field) => {
        const namePlaceholder = this.addName(field);
        return `contains(${namePlaceholder}, ${this.addValue(this.config.search!.query.toLowerCase())})`;
      });

      if (searchConditions.length > 0) {
        this.filterExpressions.push(`(${searchConditions.join(' OR ')})`);
      }
    }

    // Build the params
    const params: ScanCommandInput = {
      TableName: this.config.tableName,
      Limit: this.config.pagination?.limit || 50,
    };

    // Add index if specified
    if (this.config.indexName) {
      params.IndexName = this.config.indexName;
    }

    // Add filter expression
    if (this.filterExpressions.length > 0) {
      params.FilterExpression = this.filterExpressions.join(' AND ');
    }

    // Add expression attribute names and values
    if (Object.keys(this.expressionNames).length > 0) {
      params.ExpressionAttributeNames = this.expressionNames;
    }

    if (Object.keys(this.expressionValues).length > 0) {
      params.ExpressionAttributeValues = this.expressionValues;
    }

    // Add projection
    if (this.config.projection && this.config.projection.length > 0) {
      const projectionNames = this.config.projection.map((field) => this.addName(field));
      params.ProjectionExpression = projectionNames.join(', ');
    }

    // Add cursor for pagination
    if (this.config.pagination?.cursor) {
      try {
        const lastKey = JSON.parse(
          Buffer.from(this.config.pagination.cursor, 'base64').toString()
        );
        params.ExclusiveStartKey = lastKey;
      } catch {
        // Invalid cursor, ignore
      }
    }

    // Determine if we need in-memory sorting
    // DynamoDB Scan doesn't support sorting, so we sort in memory
    const sortInMemory = this.config.sort;

    return {
      type: 'scan',
      params,
      sortInMemory,
    };
  }

  /**
   * Build a query using a GSI
   */
  buildGSIQuery(
    partitionKeyField: string,
    partitionKeyValue: unknown,
    sortKeyField?: string,
    sortKeyCondition?: { operator: 'eq' | 'lt' | 'lte' | 'gt' | 'gte' | 'between' | 'begins'; value: unknown; value2?: unknown }
  ): BuiltQuery {
    this.reset();

    // Build key condition expression
    const pkPlaceholder = this.addName(partitionKeyField);
    const pkValuePlaceholder = this.addValue(partitionKeyValue);
    let keyConditionExpression = `${pkPlaceholder} = ${pkValuePlaceholder}`;

    // Add sort key condition if provided
    if (sortKeyField && sortKeyCondition) {
      const skPlaceholder = this.addName(sortKeyField);
      const skValuePlaceholder = this.addValue(sortKeyCondition.value);

      switch (sortKeyCondition.operator) {
        case 'eq':
          keyConditionExpression += ` AND ${skPlaceholder} = ${skValuePlaceholder}`;
          break;
        case 'lt':
          keyConditionExpression += ` AND ${skPlaceholder} < ${skValuePlaceholder}`;
          break;
        case 'lte':
          keyConditionExpression += ` AND ${skPlaceholder} <= ${skValuePlaceholder}`;
          break;
        case 'gt':
          keyConditionExpression += ` AND ${skPlaceholder} > ${skValuePlaceholder}`;
          break;
        case 'gte':
          keyConditionExpression += ` AND ${skPlaceholder} >= ${skValuePlaceholder}`;
          break;
        case 'between':
          const skValue2Placeholder = this.addValue(sortKeyCondition.value2);
          keyConditionExpression += ` AND ${skPlaceholder} BETWEEN ${skValuePlaceholder} AND ${skValue2Placeholder}`;
          break;
        case 'begins':
          keyConditionExpression += ` AND begins_with(${skPlaceholder}, ${skValuePlaceholder})`;
          break;
      }
    }

    // Add custom filters
    if (this.config.filters) {
      for (const filter of this.config.filters) {
        this.addFilterExpression(filter.field, filter.operator, filter.value, filter.value2);
      }
    }

    // Add soft delete filter
    if (!this.config.includeDeleted) {
      this.addFilterExpression('deletedAt', 'not_exists');
    }

    const params: QueryCommandInput = {
      TableName: this.config.tableName,
      IndexName: this.config.indexName,
      KeyConditionExpression: keyConditionExpression,
      Limit: this.config.pagination?.limit || 50,
      ScanIndexForward: this.config.sort?.order !== 'desc',
    };

    if (this.filterExpressions.length > 0) {
      params.FilterExpression = this.filterExpressions.join(' AND ');
    }

    if (Object.keys(this.expressionNames).length > 0) {
      params.ExpressionAttributeNames = this.expressionNames;
    }

    if (Object.keys(this.expressionValues).length > 0) {
      params.ExpressionAttributeValues = this.expressionValues;
    }

    if (this.config.pagination?.cursor) {
      try {
        params.ExclusiveStartKey = JSON.parse(
          Buffer.from(this.config.pagination.cursor, 'base64').toString()
        );
      } catch {
        // Invalid cursor
      }
    }

    return {
      type: 'query',
      params,
    };
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Reset builder state
   */
  private reset(): void {
    this.expressionNames = {};
    this.expressionValues = {};
    this.filterExpressions = [];
    this.nameCounter = 0;
    this.valueCounter = 0;
  }

  /**
   * Add a name placeholder
   */
  private addName(name: string): string {
    const placeholder = `#n${this.nameCounter++}`;
    this.expressionNames[placeholder] = name;
    return placeholder;
  }

  /**
   * Add a value placeholder
   */
  private addValue(value: unknown): string {
    const placeholder = `:v${this.valueCounter++}`;
    this.expressionValues[placeholder] = value;
    return placeholder;
  }

  /**
   * Add a filter expression
   */
  private addFilterExpression(
    field: string,
    operator: FilterOperator,
    value?: unknown,
    value2?: unknown
  ): void {
    const namePlaceholder = this.addName(field);

    switch (operator) {
      case 'eq':
        this.filterExpressions.push(`${namePlaceholder} = ${this.addValue(value)}`);
        break;

      case 'ne':
        this.filterExpressions.push(`${namePlaceholder} <> ${this.addValue(value)}`);
        break;

      case 'lt':
        this.filterExpressions.push(`${namePlaceholder} < ${this.addValue(value)}`);
        break;

      case 'lte':
        this.filterExpressions.push(`${namePlaceholder} <= ${this.addValue(value)}`);
        break;

      case 'gt':
        this.filterExpressions.push(`${namePlaceholder} > ${this.addValue(value)}`);
        break;

      case 'gte':
        this.filterExpressions.push(`${namePlaceholder} >= ${this.addValue(value)}`);
        break;

      case 'between':
        const val1 = this.addValue(value);
        const val2 = this.addValue(value2);
        this.filterExpressions.push(`${namePlaceholder} BETWEEN ${val1} AND ${val2}`);
        break;

      case 'begins':
        this.filterExpressions.push(`begins_with(${namePlaceholder}, ${this.addValue(value)})`);
        break;

      case 'contains':
        this.filterExpressions.push(`contains(${namePlaceholder}, ${this.addValue(value)})`);
        break;

      case 'in':
        if (Array.isArray(value) && value.length > 0) {
          const valuePlaceholders = value.map((v) => this.addValue(v));
          this.filterExpressions.push(`${namePlaceholder} IN (${valuePlaceholders.join(', ')})`);
        }
        break;

      case 'exists':
        this.filterExpressions.push(`attribute_exists(${namePlaceholder})`);
        break;

      case 'not_exists':
        this.filterExpressions.push(`attribute_not_exists(${namePlaceholder})`);
        break;
    }
  }
}

// ============================================================================
// QUERY BUILDER FACTORY
// ============================================================================

/**
 * Create a new query builder instance
 */
export function createQueryBuilder(tableName: string): QueryBuilder {
  return new QueryBuilder(tableName);
}

// ============================================================================
// FILTER PARSING
// ============================================================================

/**
 * Parse filter string from URL query params into FilterConditions
 * Format: field:operator:value (e.g., "status:eq:active", "price:gte:100")
 */
export function parseFilterString(filterStr: string): FilterCondition | null {
  const parts = filterStr.split(':');
  if (parts.length < 2) return null;

  const field = parts[0];
  const operator = parts[1] as FilterOperator;

  // Validate operator
  const validOperators: FilterOperator[] = [
    'eq', 'ne', 'lt', 'lte', 'gt', 'gte', 'between', 'begins', 'contains', 'in', 'exists', 'not_exists',
  ];

  if (!validOperators.includes(operator)) return null;

  // Parse value(s)
  let value: unknown = parts[2];
  let value2: unknown;

  if (operator === 'between' && parts.length >= 4) {
    value2 = parseValue(parts[3]);
  }

  if (operator === 'in' && value) {
    value = String(value).split(',').map(parseValue);
  } else if (operator !== 'exists' && operator !== 'not_exists') {
    value = parseValue(value);
  }

  return { field, operator, value, value2 };
}

/**
 * Parse a value from string to appropriate type
 */
function parseValue(value: unknown): unknown {
  if (value === undefined || value === null) return value;

  const str = String(value);

  // Boolean
  if (str === 'true') return true;
  if (str === 'false') return false;

  // Null
  if (str === 'null') return null;

  // Number
  if (/^-?\d+(\.\d+)?$/.test(str)) {
    return parseFloat(str);
  }

  // Date (ISO format)
  if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/.test(str)) {
    const date = new Date(str);
    if (!isNaN(date.getTime())) return date.toISOString();
  }

  return str;
}

// ============================================================================
// SORT HELPERS
// ============================================================================

/**
 * Sort items in memory based on sort config
 */
export function sortItems<T extends Record<string, unknown>>(
  items: T[],
  sort: SortConfig
): T[] {
  return [...items].sort((a, b) => {
    const aVal = a[sort.field];
    const bVal = b[sort.field];

    // Handle nulls
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;
    if (aVal === bVal) return 0;

    // Compare values
    let comparison: number;

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      comparison = aVal.localeCompare(bVal);
    } else if (typeof aVal === 'number' && typeof bVal === 'number') {
      comparison = aVal - bVal;
    } else if (aVal instanceof Date && bVal instanceof Date) {
      comparison = aVal.getTime() - bVal.getTime();
    } else {
      comparison = String(aVal).localeCompare(String(bVal));
    }

    return sort.order === 'desc' ? -comparison : comparison;
  });
}

// ============================================================================
// PAGINATION HELPERS
// ============================================================================

/**
 * Encode pagination cursor
 */
export function encodeCursor(lastEvaluatedKey: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(lastEvaluatedKey)).toString('base64');
}

/**
 * Decode pagination cursor
 */
export function decodeCursor(cursor: string): Record<string, unknown> | null {
  try {
    return JSON.parse(Buffer.from(cursor, 'base64').toString());
  } catch {
    return null;
  }
}

// ============================================================================
// RESOURCE-AWARE QUERY BUILDER
// ============================================================================

/**
 * Create a query builder with resource schema awareness
 */
export function createResourceQueryBuilder(
  tableName: string,
  resourceDef: ResourceDefinition
): QueryBuilder {
  const builder = new QueryBuilder(tableName);

  // Apply default sort if defined
  if (resourceDef.defaultSort) {
    builder.sort(resourceDef.defaultSort.field, resourceDef.defaultSort.order);
  }

  // Apply default filters if defined
  if (resourceDef.defaultFilters) {
    Object.entries(resourceDef.defaultFilters).forEach(([field, value]) => {
      builder.where(field, value);
    });
  }

  return builder;
}
