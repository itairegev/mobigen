/**
 * Content Management UI Components
 *
 * Shared UI components for the owner dashboard content management system.
 * These components auto-generate from resource definitions.
 */

// Types
export type {
  UIComponentType,
  SelectOption,
  ValidationRules,
  RelationConfig,
  ContentAttribute,
  ResourceDefinition,
  ContentItem,
  ResourceTableProps,
  ResourceFormProps,
  FieldRendererProps,
  FilterPanelProps,
  BulkActionsProps,
  ResourceDetailProps,
  PaginationProps,
  UseContentListConfig,
  UseContentListReturn,
  UseContentMutationConfig,
  UseContentMutationReturn,
  ResourceStat,
  DashboardStats,
  ResourceCardProps,
  DashboardOverviewProps,
  SortOrder,
  ColumnDef,
  FormField,
} from './types';

// Components
export { ResourceTable } from './ResourceTable';
export { ResourceForm } from './ResourceForm';
export { ResourceDetail } from './ResourceDetail';
export { FieldRenderer, FieldDisplay } from './FieldRenderer';
export { FilterPanel } from './FilterPanel';
export { BulkActions } from './BulkActions';
export { Pagination } from './Pagination';
export { ImageUploader, type ImageUploaderProps } from './ImageUploader';
