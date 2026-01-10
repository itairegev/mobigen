/**
 * Schema Resolver
 *
 * Transforms existing TemplateSchema definitions into ResourceDefinitions
 * with UI hints for auto-generating forms, tables, and validation.
 */

import type { TemplateSchema, TableSchema, AttributeDefinition } from '../schemas/types';
import { getSchemaForTemplate, hasSchemaForTemplate, getAvailableTemplates } from '../schemas';
import type {
  ContentAttributeDefinition,
  ResourceDefinition,
  ContentManagementConfig,
  UIComponentType,
  SelectOption,
  RelationConfig,
} from './types';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert camelCase or snake_case to human-readable format
 */
function humanize(str: string): string {
  return str
    .replace(/([A-Z])/g, ' $1') // Add space before capitals
    .replace(/_/g, ' ') // Replace underscores with spaces
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase()); // Capitalize first letter
}

/**
 * Convert plural to singular (simple rules)
 */
function singularize(str: string): string {
  if (str.endsWith('ies')) return str.slice(0, -3) + 'y';
  if (str.endsWith('es') && (str.endsWith('sses') || str.endsWith('xes') || str.endsWith('ches') || str.endsWith('shes'))) {
    return str.slice(0, -2);
  }
  if (str.endsWith('s') && !str.endsWith('ss')) return str.slice(0, -1);
  return str;
}

/**
 * Infer an icon/emoji for a resource based on its name
 */
function inferResourceIcon(name: string): string {
  const iconMap: Record<string, string> = {
    products: '📦',
    product: '📦',
    categories: '📁',
    category: '📁',
    orders: '🛒',
    order: '🛒',
    users: '👤',
    user: '👤',
    customers: '👥',
    customer: '👥',
    rewards: '🎁',
    reward: '🎁',
    points: '⭐',
    transactions: '💳',
    transaction: '💳',
    articles: '📰',
    article: '📰',
    posts: '📝',
    post: '📝',
    comments: '💬',
    comment: '💬',
    messages: '✉️',
    message: '✉️',
    conversations: '💭',
    conversation: '💭',
    appointments: '📅',
    appointment: '📅',
    services: '🔧',
    service: '🔧',
    bookings: '📋',
    booking: '📋',
    staff: '👨‍💼',
    sessions: '🎤',
    session: '🎤',
    speakers: '🎙️',
    speaker: '🎙️',
    events: '🎉',
    event: '🎉',
    courses: '📚',
    course: '📚',
    lessons: '📖',
    lesson: '📖',
    episodes: '🎧',
    episode: '🎧',
    listings: '🏷️',
    listing: '🏷️',
    properties: '🏠',
    property: '🏠',
    jobs: '🔨',
    job: '🔨',
    tasks: '✅',
    task: '✅',
    grades: '📊',
    grade: '📊',
    assignments: '📝',
    assignment: '📝',
    sermons: '⛪',
    sermon: '⛪',
    prayers: '🙏',
    prayer: '🙏',
    workouts: '💪',
    workout: '💪',
    exercises: '🏋️',
    exercise: '🏋️',
    recipes: '🍳',
    recipe: '🍳',
    menu_items: '🍽️',
    menu: '📋',
  };

  const lowerName = name.toLowerCase();
  return iconMap[lowerName] || '📄';
}

/**
 * Infer a category for a resource based on its name
 */
function inferResourceCategory(name: string): string {
  const lowerName = name.toLowerCase();

  if (['products', 'categories', 'menu_items', 'listings', 'properties', 'inventory'].some(n => lowerName.includes(n))) {
    return 'Content';
  }
  if (['orders', 'transactions', 'payments', 'bookings', 'appointments', 'reservations'].some(n => lowerName.includes(n))) {
    return 'Orders';
  }
  if (['users', 'customers', 'staff', 'members', 'attendees', 'speakers'].some(n => lowerName.includes(n))) {
    return 'Users';
  }
  if (['rewards', 'points', 'tiers', 'coupons', 'discounts'].some(n => lowerName.includes(n))) {
    return 'Rewards';
  }
  if (['articles', 'posts', 'comments', 'reviews', 'messages'].some(n => lowerName.includes(n))) {
    return 'Content';
  }
  if (['courses', 'lessons', 'quizzes', 'assignments', 'grades'].some(n => lowerName.includes(n))) {
    return 'Learning';
  }
  if (['sessions', 'events', 'schedules', 'calendar'].some(n => lowerName.includes(n))) {
    return 'Events';
  }

  return 'Other';
}

// ============================================================================
// UI COMPONENT INFERENCE
// ============================================================================

/**
 * Infer the appropriate UI component for an attribute based on its name and type
 */
function inferUIComponent(attr: AttributeDefinition): UIComponentType {
  const name = attr.name.toLowerCase();
  const type = attr.type;

  // By name patterns - most specific first

  // Image fields
  if (name === 'imageurl' || name === 'image_url' || name === 'image' || name === 'avatar' || name === 'thumbnail' || name === 'photo') {
    return 'image';
  }
  if (name === 'images' || name === 'photos' || name === 'gallery') {
    return 'images';
  }

  // URL fields
  if (name.endsWith('url') && !name.includes('image')) {
    return 'text'; // Regular text input for URLs
  }

  // Rich text fields
  if (name === 'content' || name === 'body' || name === 'html' || name === 'richtext') {
    return 'richtext';
  }

  // Long text fields
  if (name === 'description' || name === 'summary' || name === 'bio' || name === 'notes' || name === 'details') {
    return 'textarea';
  }

  // Date/time fields
  if (name.endsWith('at') || name.endsWith('date') || name === 'date') {
    if (name.includes('time') || name === 'createdat' || name === 'updatedat' || name === 'deletedat') {
      return 'datetime';
    }
    return 'date';
  }

  // Currency fields
  if (name === 'price' || name === 'total' || name === 'subtotal' || name === 'amount' ||
      name.includes('price') || name.includes('cost') || name.includes('fee')) {
    return 'currency';
  }

  // Color fields
  if (name === 'color' || name.includes('color')) {
    return 'color';
  }

  // Status/enum fields
  if (name === 'status' || name === 'state' || name === 'tier' || name === 'role' || name === 'type' || name === 'priority') {
    return 'select';
  }

  // Relation fields (end with Id but not 'id' itself)
  if (name.endsWith('id') && name !== 'id' && name !== 'pk' && name !== 'sk') {
    return 'relation';
  }

  // By type
  switch (type) {
    case 'boolean':
      return 'toggle';
    case 'number':
      return 'number';
    case 'list':
      return 'multiselect';
    case 'map':
      return 'json';
    default:
      return 'text';
  }
}

/**
 * Infer select options for common status fields
 */
function inferSelectOptions(attrName: string): SelectOption[] | undefined {
  const name = attrName.toLowerCase();

  if (name === 'status') {
    return [
      { value: 'pending', label: 'Pending' },
      { value: 'active', label: 'Active' },
      { value: 'completed', label: 'Completed' },
      { value: 'cancelled', label: 'Cancelled' },
    ];
  }

  if (name === 'orderstatus' || (name === 'status' && name.includes('order'))) {
    return [
      { value: 'pending', label: 'Pending' },
      { value: 'processing', label: 'Processing' },
      { value: 'shipped', label: 'Shipped' },
      { value: 'delivered', label: 'Delivered' },
      { value: 'cancelled', label: 'Cancelled' },
      { value: 'refunded', label: 'Refunded' },
    ];
  }

  if (name === 'priority') {
    return [
      { value: 'low', label: 'Low' },
      { value: 'medium', label: 'Medium' },
      { value: 'high', label: 'High' },
      { value: 'urgent', label: 'Urgent' },
    ];
  }

  if (name === 'role') {
    return [
      { value: 'user', label: 'User' },
      { value: 'admin', label: 'Admin' },
      { value: 'staff', label: 'Staff' },
    ];
  }

  return undefined;
}

/**
 * Infer relation configuration for relation fields
 */
function inferRelationConfig(attrName: string, allTables: string[]): RelationConfig | undefined {
  const name = attrName.toLowerCase();

  if (!name.endsWith('id') || name === 'id') {
    return undefined;
  }

  // Extract the resource name from the field name (e.g., 'categoryId' -> 'categories')
  const baseName = name.slice(0, -2); // Remove 'Id'

  // Try to find a matching table
  const possibleNames = [
    baseName + 's', // categoryId -> categories
    baseName + 'es', // classId -> classes
    baseName.replace(/y$/, 'ies'), // companyId -> companies
    baseName, // userId -> user (if singular table exists)
  ];

  for (const possibleName of possibleNames) {
    if (allTables.some(t => t.toLowerCase() === possibleName)) {
      return {
        resource: possibleName,
        displayField: 'name', // Default to 'name', can be overridden
        valueField: 'id',
      };
    }
  }

  // If no matching table found, still return a config (might be external reference)
  return {
    resource: baseName + 's',
    displayField: 'name',
    valueField: 'id',
  };
}

// ============================================================================
// ATTRIBUTE RESOLVER
// ============================================================================

/**
 * Resolve a single attribute to a ContentAttributeDefinition
 */
function resolveAttribute(
  attr: AttributeDefinition,
  allTables: string[],
  index: number,
  totalCount: number
): ContentAttributeDefinition {
  const name = attr.name.toLowerCase();
  const uiComponent = inferUIComponent(attr);

  // Determine if this should be shown in list view
  // Show first 5 meaningful fields (exclude pk, sk, internal fields)
  const isInternalField = ['pk', 'sk', 'gsi1pk', 'gsi1sk', 'gsi2pk', 'gsi2sk'].includes(name);
  const isTimestamp = name === 'createdat' || name === 'updatedat' || name === 'deletedat';
  const showInList = !isInternalField && !isTimestamp && index < 6;

  // Determine if field should be hidden
  const hidden = isInternalField;

  // Determine if field is read-only (timestamps, auto-generated IDs)
  const readOnly = isTimestamp || name === 'id';

  // Build the extended attribute
  const contentAttr: ContentAttributeDefinition = {
    ...attr,
    displayName: humanize(attr.name),
    uiComponent,
    showInList,
    hidden,
    readOnly,
    sortable: ['string', 'number', 'boolean'].includes(attr.type) && !isInternalField,
    filterable: ['string', 'number', 'boolean'].includes(attr.type) && !isInternalField,
    searchable: attr.type === 'string' && !isInternalField && !isTimestamp,
    isTimestamp,
  };

  // Add select options for status-like fields
  if (uiComponent === 'select') {
    contentAttr.options = inferSelectOptions(attr.name);
  }

  // Add relation config for relation fields
  if (uiComponent === 'relation') {
    contentAttr.relation = inferRelationConfig(attr.name, allTables);
  }

  // Mark title/subtitle/image fields
  if (name === 'name' || name === 'title') {
    contentAttr.isTitle = true;
  }
  if (name === 'description' || name === 'summary' || name === 'subtitle') {
    contentAttr.isSubtitle = true;
  }
  if (uiComponent === 'image' || uiComponent === 'images') {
    contentAttr.isImage = true;
  }

  // Add placeholder text
  if (uiComponent === 'text' || uiComponent === 'textarea') {
    contentAttr.placeholder = `Enter ${humanize(attr.name).toLowerCase()}`;
  }

  return contentAttr;
}

// ============================================================================
// TABLE/RESOURCE RESOLVER
// ============================================================================

/**
 * Resolve a TableSchema to a ResourceDefinition
 */
function resolveTable(table: TableSchema, allTables: string[]): ResourceDefinition {
  // Filter out pk/sk internal attributes for display
  const meaningfulAttrs = table.attributes.filter(
    a => !['pk', 'sk'].includes(a.name.toLowerCase())
  );

  // Resolve all attributes
  const attributes = meaningfulAttrs.map((attr, index) =>
    resolveAttribute(attr, allTables, index, meaningfulAttrs.length)
  );

  // Find title, subtitle, image fields
  const titleField = attributes.find(a => a.isTitle)?.name ||
                     attributes.find(a => a.name.toLowerCase() === 'name')?.name ||
                     attributes.find(a => a.name.toLowerCase() === 'title')?.name ||
                     attributes[0]?.name || 'id';

  const subtitleField = attributes.find(a => a.isSubtitle)?.name ||
                        attributes.find(a => a.name.toLowerCase() === 'description')?.name;

  const imageField = attributes.find(a => a.isImage)?.name ||
                     attributes.find(a => a.name.toLowerCase().includes('image'))?.name;

  return {
    name: table.name,
    singularName: singularize(table.name),
    pluralName: table.name,
    icon: inferResourceIcon(table.name),
    description: `Manage ${humanize(table.name).toLowerCase()}`,
    attributes,
    titleField,
    subtitleField,
    imageField,
    defaultSort: { field: 'createdAt', order: 'desc' },
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canBulkDelete: true,
    canExport: true,
    canImport: true,
    category: inferResourceCategory(table.name),
    priority: getPriorityForResource(table.name),
  };
}

/**
 * Get display priority for a resource (lower = shown first)
 */
function getPriorityForResource(name: string): number {
  const priorities: Record<string, number> = {
    products: 1,
    menu_items: 1,
    listings: 1,
    properties: 1,
    services: 1,
    courses: 1,
    articles: 1,
    episodes: 1,
    rewards: 1,
    categories: 2,
    orders: 3,
    appointments: 3,
    bookings: 3,
    transactions: 3,
    users: 4,
    customers: 4,
    staff: 4,
    members: 4,
  };

  return priorities[name.toLowerCase()] || 10;
}

// ============================================================================
// MAIN RESOLVER CLASS
// ============================================================================

/**
 * SchemaResolver class for transforming template schemas
 */
export class SchemaResolver {
  /**
   * Resolve a template schema to a content management config
   */
  resolveTemplate(templateId: string): ContentManagementConfig {
    if (!hasSchemaForTemplate(templateId)) {
      // Return a minimal config for templates without backend schemas
      return {
        templateId,
        templateName: humanize(templateId),
        resources: [],
        features: {
          bulkOperations: true,
          csvImportExport: true,
          auditLog: true,
          apiKeys: true,
          teamMembers: true,
        },
      };
    }

    const schema = getSchemaForTemplate(templateId);
    const allTableNames = schema.tables.map(t => t.name);

    // Resolve all tables to resources
    const resources = schema.tables
      .map(table => resolveTable(table, allTableNames))
      .sort((a, b) => (a.priority || 10) - (b.priority || 10));

    return {
      templateId: schema.templateId,
      templateName: humanize(schema.templateId),
      resources,
      dashboard: {
        title: `${humanize(schema.templateId)} Dashboard`,
        description: `Manage your ${humanize(schema.templateId).toLowerCase()} app content`,
      },
      features: {
        bulkOperations: true,
        csvImportExport: true,
        auditLog: true,
        apiKeys: true,
        teamMembers: true,
      },
    };
  }

  /**
   * Get a single resource definition
   */
  getResourceDefinition(templateId: string, resourceName: string): ResourceDefinition | null {
    const config = this.resolveTemplate(templateId);
    return config.resources.find(r => r.name === resourceName) || null;
  }

  /**
   * Get all available template IDs
   */
  getAvailableTemplates(): string[] {
    return getAvailableTemplates();
  }

  /**
   * Check if a template has a schema
   */
  hasSchema(templateId: string): boolean {
    return hasSchemaForTemplate(templateId);
  }
}

// Export singleton instance
export const schemaResolver = new SchemaResolver();

// Export utility functions for direct use
export {
  humanize,
  singularize,
  inferUIComponent,
  inferResourceIcon,
  inferResourceCategory,
};
