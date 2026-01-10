/**
 * Content Manager Type Definitions
 *
 * Extends the base schema types with UI hints and content management capabilities.
 * These types enable auto-generation of forms, tables, and validation from template schemas.
 */

import type { AttributeDefinition, AttributeType } from '../schemas/types';

// ============================================================================
// UI COMPONENT TYPES
// ============================================================================

/**
 * Available UI components for rendering attributes
 */
export type UIComponentType =
  | 'text'
  | 'textarea'
  | 'richtext'
  | 'number'
  | 'currency'
  | 'select'
  | 'multiselect'
  | 'toggle'
  | 'date'
  | 'datetime'
  | 'image'
  | 'images'
  | 'color'
  | 'relation'
  | 'json'
  | 'hidden';

/**
 * Validation rules for content attributes
 */
export interface ValidationRules {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  patternMessage?: string;
  customValidator?: string; // Name of custom validation function
}

/**
 * Relationship configuration for relation type attributes
 */
export interface RelationConfig {
  resource: string; // Target resource name (e.g., 'categories')
  displayField: string; // Field to display in dropdown (e.g., 'name')
  valueField?: string; // Field to use as value (default: 'id')
  multiple?: boolean; // Allow multiple selections
  createInline?: boolean; // Allow creating new items inline
}

/**
 * Select option for select/multiselect components
 */
export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  icon?: string;
}

// ============================================================================
// EXTENDED ATTRIBUTE DEFINITION
// ============================================================================

/**
 * Extended attribute definition with UI hints for content management.
 * Extends the base AttributeDefinition from schemas/types.ts.
 */
export interface ContentAttributeDefinition extends AttributeDefinition {
  // Display configuration
  displayName?: string; // Human-readable label (auto-generated if not provided)
  description?: string; // Help text shown below the input
  placeholder?: string; // Placeholder text for inputs
  icon?: string; // Icon name or emoji

  // UI component selection
  uiComponent?: UIComponentType; // Component to render (auto-inferred if not provided)

  // Validation
  validation?: ValidationRules;

  // Relationship (for 'relation' component)
  relation?: RelationConfig;

  // Select options (for 'select'/'multiselect' components)
  options?: SelectOption[];

  // List view behavior
  showInList?: boolean; // Show in table view (default: true for first 5 fields)
  sortable?: boolean; // Can sort by this field (default: true for primitive types)
  filterable?: boolean; // Can filter by this field
  searchable?: boolean; // Include in text search (default: true for string fields)
  listWidth?: 'sm' | 'md' | 'lg' | 'xl'; // Column width hint

  // Form behavior
  readOnly?: boolean; // Cannot be edited (but displayed)
  hidden?: boolean; // Never show in UI
  adminOnly?: boolean; // Only show for enterprise tier
  section?: string; // Group into form section
  order?: number; // Display order within section

  // Special handling
  isTitle?: boolean; // This field is the primary display field
  isSubtitle?: boolean; // This field is secondary display
  isImage?: boolean; // This field contains an image URL
  isTimestamp?: boolean; // Auto-populated timestamp field
}

// ============================================================================
// RESOURCE DEFINITION
// ============================================================================

/**
 * Dashboard widget configuration for resource overview
 */
export interface DashboardWidget {
  type: 'count' | 'sum' | 'chart' | 'recent';
  title: string;
  field?: string; // For sum/chart
  filter?: Record<string, unknown>; // Filter for the widget
}

/**
 * Quick action available from resource overview
 */
export interface QuickAction {
  id: string;
  label: string;
  icon?: string;
  action: 'create' | 'export' | 'import' | 'custom';
  customHandler?: string; // For 'custom' action
}

/**
 * Complete resource definition for content management.
 * Defines how a template table/entity is presented and managed.
 */
export interface ResourceDefinition {
  // Identity
  name: string; // Table/resource name (e.g., 'products')
  singularName: string; // Singular form (e.g., 'product')
  pluralName: string; // Plural form (e.g., 'products')
  icon?: string; // Emoji or icon name
  description?: string; // Description for UI

  // Attributes with UI hints
  attributes: ContentAttributeDefinition[];

  // Primary display configuration
  titleField: string; // Primary display field (e.g., 'name', 'title')
  subtitleField?: string; // Secondary display field (e.g., 'description')
  imageField?: string; // Image field (e.g., 'imageUrl', 'avatar')

  // Default list configuration
  defaultSort?: { field: string; order: 'asc' | 'desc' };
  defaultFilters?: Record<string, unknown>;
  defaultPageSize?: number;

  // Capabilities
  canCreate?: boolean; // Default: true
  canEdit?: boolean; // Default: true
  canDelete?: boolean; // Default: true
  canBulkDelete?: boolean; // Default: true
  canExport?: boolean; // Default: true (Pro+)
  canImport?: boolean; // Default: true (Pro+)
  canDuplicate?: boolean; // Default: false

  // Dashboard configuration
  dashboardWidgets?: DashboardWidget[];
  quickActions?: QuickAction[];

  // Grouping
  category?: string; // Group resources (e.g., 'Content', 'Orders', 'Users')
  priority?: number; // Display order (lower = higher priority)
}

// ============================================================================
// CONTENT MANAGEMENT CONFIG
// ============================================================================

/**
 * Complete content management configuration for a template.
 * Defines all resources and dashboard settings.
 */
export interface ContentManagementConfig {
  templateId: string;
  templateName: string;
  resources: ResourceDefinition[];

  // Dashboard configuration
  dashboard?: {
    title?: string;
    description?: string;
    widgets?: DashboardWidget[];
    quickActions?: QuickAction[];
  };

  // Feature flags
  features?: {
    bulkOperations?: boolean;
    csvImportExport?: boolean;
    auditLog?: boolean;
    apiKeys?: boolean;
    teamMembers?: boolean;
  };
}

// ============================================================================
// CRUD OPERATION TYPES
// ============================================================================

/**
 * Parameters for listing content items
 */
export interface ListParams {
  resource: string;
  limit?: number;
  cursor?: string;
  offset?: number;
  sort?: { field: string; order: 'asc' | 'desc' };
  filters?: Record<string, unknown>;
  search?: string;
  includeDeleted?: boolean;
}

/**
 * Result of a list operation
 */
export interface ListResult<T = ContentItem> {
  items: T[];
  total: number;
  cursor?: string;
  hasMore: boolean;
  page?: number;
  pageSize?: number;
}

/**
 * A single content item
 */
export interface ContentItem {
  id: string;
  [key: string]: unknown;
  _metadata?: {
    createdAt?: string;
    updatedAt?: string;
    deletedAt?: string;
    version?: number;
  };
}

/**
 * Input for creating content
 */
export interface CreateInput {
  resource: string;
  data: Record<string, unknown>;
}

/**
 * Input for updating content
 */
export interface UpdateInput {
  resource: string;
  id: string;
  data: Record<string, unknown>;
}

/**
 * Result of a delete operation
 */
export interface DeleteResult {
  success: boolean;
  id: string;
  softDeleted?: boolean;
}

/**
 * Result of a bulk operation
 */
export interface BulkOperationResult {
  success: boolean;
  total: number;
  succeeded: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
  auditId?: string;
}

/**
 * Result of an export operation
 */
export interface ExportResult {
  success: boolean;
  downloadUrl: string;
  format: 'csv' | 'json';
  rowCount: number;
  expiresAt: string;
}

/**
 * Options for import operation
 */
export interface ImportOptions {
  mode: 'create' | 'update' | 'upsert';
  skipErrors?: boolean;
  dryRun?: boolean;
}

// ============================================================================
// SEARCH TYPES
// ============================================================================

/**
 * Options for search operation
 */
export interface SearchOptions {
  resource?: string;
  fields?: string[]; // Limit search to specific fields
  limit?: number;
  fuzzy?: boolean;
}

/**
 * A search result item
 */
export interface SearchResultItem {
  id: string;
  resource: string;
  title: string;
  subtitle?: string;
  image?: string;
  highlights?: Record<string, string>; // Field -> highlighted snippet
  score?: number;
}

/**
 * Result of a search operation
 */
export interface SearchResult {
  items: SearchResultItem[];
  total: number;
  query: string;
}

// ============================================================================
// AUDIT TYPES
// ============================================================================

/**
 * Audit log entry action types
 */
export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'bulk_create'
  | 'bulk_update'
  | 'bulk_delete'
  | 'import'
  | 'export'
  | 'restore';

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  id: string;
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
  createdAt: string;
}

// ============================================================================
// SERVICE INTERFACE
// ============================================================================

/**
 * Content service interface for performing CRUD operations
 */
export interface IContentService {
  // Schema
  getSchema(projectId: string): Promise<ContentManagementConfig>;
  getResourceSchema(projectId: string, resource: string): Promise<ResourceDefinition>;

  // CRUD operations
  list(projectId: string, params: ListParams): Promise<ListResult>;
  get(projectId: string, resource: string, id: string): Promise<ContentItem>;
  create(projectId: string, input: CreateInput): Promise<ContentItem>;
  update(projectId: string, input: UpdateInput): Promise<ContentItem>;
  delete(projectId: string, resource: string, id: string): Promise<DeleteResult>;

  // Bulk operations
  bulkCreate(projectId: string, resource: string, items: Record<string, unknown>[]): Promise<BulkOperationResult>;
  bulkUpdate(projectId: string, resource: string, items: Array<{ id: string; data: Record<string, unknown> }>): Promise<BulkOperationResult>;
  bulkDelete(projectId: string, resource: string, ids: string[]): Promise<BulkOperationResult>;

  // Search
  search(projectId: string, query: string, options?: SearchOptions): Promise<SearchResult>;

  // Import/Export
  exportToCSV(projectId: string, resource: string, filters?: Record<string, unknown>): Promise<ExportResult>;
  importFromCSV(projectId: string, resource: string, data: string, options?: ImportOptions): Promise<BulkOperationResult>;

  // Audit
  getAuditLog(projectId: string, resource?: string, limit?: number): Promise<AuditLogEntry[]>;
}

// ============================================================================
// TIER ACCESS
// ============================================================================

/**
 * User tier levels
 */
export type UserTier = 'basic' | 'pro' | 'enterprise';

/**
 * Content operation types for access control
 */
export type ContentOperation =
  | 'view'
  | 'create'
  | 'update'
  | 'delete'
  | 'bulk'
  | 'export'
  | 'import'
  | 'audit'
  | 'api_keys'
  | 'team';

/**
 * Access control configuration
 */
export const TIER_ACCESS: Record<UserTier, ContentOperation[]> = {
  basic: ['view'],
  pro: ['view', 'create', 'update', 'delete', 'bulk', 'export', 'import', 'audit'],
  enterprise: ['view', 'create', 'update', 'delete', 'bulk', 'export', 'import', 'audit', 'api_keys', 'team'],
};

/**
 * Check if a tier has access to an operation
 */
export function hasAccess(tier: UserTier, operation: ContentOperation): boolean {
  return TIER_ACCESS[tier]?.includes(operation) ?? false;
}
