/**
 * Content Management UI Types
 *
 * Type definitions for content management components used in owner dashboards.
 */

// ============================================================================
// RESOURCE TYPES (from backend content-manager)
// ============================================================================

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

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  icon?: string;
}

export interface ValidationRules {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  patternMessage?: string;
}

export interface RelationConfig {
  resource: string;
  displayField: string;
  valueField?: string;
  multiple?: boolean;
}

export interface ContentAttribute {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'list' | 'map' | 'binary';
  required?: boolean;
  displayName?: string;
  description?: string;
  placeholder?: string;
  icon?: string;
  uiComponent?: UIComponentType;
  validation?: ValidationRules;
  relation?: RelationConfig;
  options?: SelectOption[];
  showInList?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  searchable?: boolean;
  listWidth?: 'sm' | 'md' | 'lg' | 'xl';
  readOnly?: boolean;
  hidden?: boolean;
  isTitle?: boolean;
  isSubtitle?: boolean;
  isImage?: boolean;
  section?: string;
  order?: number;
}

export interface ResourceDefinition {
  name: string;
  singularName: string;
  pluralName: string;
  icon?: string;
  description?: string;
  attributes: ContentAttribute[];
  titleField: string;
  subtitleField?: string;
  imageField?: string;
  defaultSort?: { field: string; order: 'asc' | 'desc' };
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canBulkDelete?: boolean;
  canExport?: boolean;
  canImport?: boolean;
}

export interface ContentItem {
  id: string;
  [key: string]: unknown;
  _metadata?: {
    createdAt?: string;
    updatedAt?: string;
  };
}

// ============================================================================
// COMPONENT PROPS
// ============================================================================

export interface ResourceTableProps {
  resource: ResourceDefinition;
  items: ContentItem[];
  isLoading?: boolean;
  selectedIds?: string[];
  onSelect?: (ids: string[]) => void;
  onSort?: (field: string, order: 'asc' | 'desc') => void;
  currentSort?: { field: string; order: 'asc' | 'desc' };
  onRowClick?: (item: ContentItem) => void;
  onEdit?: (item: ContentItem) => void;
  onDelete?: (item: ContentItem) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  emptyMessage?: string;
  className?: string;
}

export interface ResourceFormProps {
  resource: ResourceDefinition;
  item?: ContentItem;
  mode: 'create' | 'edit' | 'view';
  onSubmit?: (data: Record<string, unknown>) => void | Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  errors?: Record<string, string>;
  className?: string;
}

export interface FieldRendererProps {
  attribute: ContentAttribute;
  value: unknown;
  onChange?: (value: unknown) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export interface FilterPanelProps {
  resource: ResourceDefinition;
  filters: Record<string, unknown>;
  onFilterChange: (filters: Record<string, unknown>) => void;
  onSearch?: (query: string) => void;
  searchQuery?: string;
  className?: string;
}

export interface BulkActionsProps {
  selectedCount: number;
  onDelete?: () => void;
  onExport?: () => void;
  onClearSelection?: () => void;
  isDeleting?: boolean;
  canDelete?: boolean;
  canExport?: boolean;
  className?: string;
}

export interface ResourceDetailProps {
  resource: ResourceDefinition;
  item: ContentItem;
  onEdit?: () => void;
  onDelete?: () => void;
  onBack?: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
  className?: string;
}

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  className?: string;
}

// ============================================================================
// HOOK TYPES
// ============================================================================

export interface UseContentListConfig {
  projectId: string;
  resource: string;
  initialPageSize?: number;
  initialSort?: { field: string; order: 'asc' | 'desc' };
}

export interface UseContentListReturn {
  items: ContentItem[];
  isLoading: boolean;
  error: Error | null;
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  sort: { field: string; order: 'asc' | 'desc' } | undefined;
  filters: Record<string, unknown>;
  search: string;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSort: (field: string, order: 'asc' | 'desc') => void;
  setFilters: (filters: Record<string, unknown>) => void;
  setSearch: (query: string) => void;
  refetch: () => void;
}

export interface UseContentMutationConfig {
  projectId: string;
  resource: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export interface UseContentMutationReturn {
  create: (data: Record<string, unknown>) => Promise<ContentItem>;
  update: (id: string, data: Record<string, unknown>) => Promise<ContentItem>;
  remove: (id: string) => Promise<void>;
  bulkDelete: (ids: string[]) => Promise<void>;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

// ============================================================================
// DASHBOARD TYPES
// ============================================================================

export interface ResourceStat {
  resource: string;
  singularName: string;
  pluralName: string;
  icon?: string;
  count: number;
}

export interface DashboardStats {
  projectId: string;
  templateId: string;
  resources: ResourceStat[];
  userTier: 'basic' | 'pro' | 'enterprise';
  canEdit: boolean;
}

export interface ResourceCardProps {
  stat: ResourceStat;
  onClick?: () => void;
  className?: string;
}

export interface DashboardOverviewProps {
  stats: DashboardStats;
  onResourceClick?: (resource: string) => void;
  className?: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type SortOrder = 'asc' | 'desc';

export interface ColumnDef {
  key: string;
  header: string;
  width?: 'sm' | 'md' | 'lg' | 'xl';
  sortable?: boolean;
  render?: (value: unknown, item: ContentItem) => React.ReactNode;
}

export interface FormField {
  name: string;
  label: string;
  type: UIComponentType;
  required?: boolean;
  placeholder?: string;
  options?: SelectOption[];
  validation?: ValidationRules;
}
