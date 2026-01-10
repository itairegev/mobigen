/**
 * Content Manager
 *
 * Generic content management system for Mobigen template projects.
 * Enables project owners to manage their app's data through a unified interface.
 *
 * @module content-manager
 */

// Types
export type {
  UIComponentType,
  ValidationRules,
  RelationConfig,
  SelectOption,
  ContentAttributeDefinition,
  DashboardWidget,
  QuickAction,
  ResourceDefinition,
  ContentManagementConfig,
  ListParams,
  ListResult,
  ContentItem,
  CreateInput,
  UpdateInput,
  DeleteResult,
  BulkOperationResult,
  ExportResult,
  ImportOptions,
  SearchOptions,
  SearchResultItem,
  SearchResult,
  AuditAction,
  AuditLogEntry,
  IContentService,
  UserTier,
  ContentOperation,
} from './types';

export { TIER_ACCESS, hasAccess } from './types';

// Schema Resolver
export { SchemaResolver } from './schema-resolver';

// Content Service
export {
  ContentService,
  ContentServiceError,
  createContentService,
  type ContentServiceConfig,
  type ProjectBackendInfo,
} from './content-service';

// Query Builder
export {
  QueryBuilder,
  createQueryBuilder,
  createResourceQueryBuilder,
  parseFilterString,
  sortItems,
  encodeCursor,
  decodeCursor,
  type FilterOperator,
  type FilterCondition,
  type SortConfig,
  type PaginationConfig,
  type QueryConfig,
  type BuiltQuery,
} from './query-builder';

// Validation Engine
export {
  ValidationEngine,
  ValidationEngineError,
  createValidationEngine,
  validateField,
  sanitizeData,
  registerValidator,
  getValidator,
  type ValidationResult,
  type ValidationError,
  type ValidationEngineConfig,
} from './validation-engine';

// Audit Logger
export {
  AuditLogger,
  InMemoryAuditStorage,
  PrismaAuditStorage,
  createInMemoryAuditLogger,
  createPrismaAuditLogger,
  createTieredAuditLogger,
  getActionDescription,
  formatAuditEntry,
  computeDiff,
  type AuditLogInput,
  type AuditLogFilter,
  type AuditLoggerConfig,
  type AuditStorage,
} from './audit-logger';

// ============================================================================
// CONVENIENCE FACTORY
// ============================================================================

import type { ProjectBackendInfo } from './content-service';
import type { UserTier } from './types';
import { ContentService } from './content-service';
import { SchemaResolver } from './schema-resolver';
import { createValidationEngine } from './validation-engine';
import { createTieredAuditLogger, createInMemoryAuditLogger } from './audit-logger';

/**
 * Configuration for creating a full content manager stack
 */
export interface ContentManagerFactoryConfig {
  backend: ProjectBackendInfo;
  userId: string;
  userTier: UserTier;
  prisma?: unknown; // Optional Prisma client for audit logging
}

/**
 * Factory function to create a fully configured content service
 */
export function createContentManager(config: ContentManagerFactoryConfig): ContentService {
  const { backend, userId, userTier, prisma } = config;

  // Create the content service
  const service = new ContentService({
    region: backend.region,
    tablePrefix: backend.tablePrefix,
    projectId: backend.projectId,
    templateId: backend.templateId,
    userId,
    userTier,
  });

  // Get schema for the template
  const schemaResolver = new SchemaResolver();
  const schema = schemaResolver.resolveTemplate(backend.templateId);

  // Create validation engine
  const validationEngine = createValidationEngine(schema.resources);

  // Create audit logger (use Prisma if available, otherwise in-memory)
  const auditLogger = prisma
    ? createTieredAuditLogger(prisma as Parameters<typeof createTieredAuditLogger>[0], userTier)
    : createInMemoryAuditLogger({ enabled: userTier !== 'basic' });

  // Wire up dependencies
  service.setDependencies({
    validationEngine,
    auditLogger,
  });

  return service;
}
