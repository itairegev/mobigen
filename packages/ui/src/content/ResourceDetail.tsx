/**
 * ResourceDetail Component
 *
 * Displays a single content item with all its fields.
 * Supports view mode with edit/delete actions.
 */

import React, { useMemo } from 'react';
import type {
  ResourceDetailProps,
  ContentAttribute,
} from './types';
import { FieldDisplay } from './FieldRenderer';

export const ResourceDetail: React.FC<ResourceDetailProps> = ({
  resource,
  item,
  onEdit,
  onDelete,
  onBack,
  canEdit = true,
  canDelete = true,
  className = '',
}) => {
  // Group attributes by section
  const sections = useMemo(() => {
    const grouped = new Map<string, ContentAttribute[]>();

    resource.attributes
      .filter((attr) => !attr.hidden && attr.uiComponent !== 'hidden')
      .sort((a, b) => (a.order ?? 100) - (b.order ?? 100))
      .forEach((attr) => {
        const section = attr.section || 'General';
        if (!grouped.has(section)) {
          grouped.set(section, []);
        }
        grouped.get(section)!.push(attr);
      });

    return grouped;
  }, [resource.attributes]);

  // Get title and subtitle values
  const title = item[resource.titleField] as string || 'Untitled';
  const subtitle = resource.subtitleField
    ? (item[resource.subtitleField] as string)
    : undefined;
  const image = resource.imageField
    ? (item[resource.imageField] as string)
    : undefined;

  // Format metadata dates
  const createdAt = item._metadata?.createdAt
    ? new Date(item._metadata.createdAt).toLocaleString()
    : undefined;
  const updatedAt = item._metadata?.updatedAt
    ? new Date(item._metadata.updatedAt).toLocaleString()
    : undefined;

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Back button */}
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Go back"
              >
                <BackIcon />
              </button>
            )}

            {/* Image */}
            {image && (
              <img
                src={image}
                alt={title}
                className="w-16 h-16 rounded-lg object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}

            {/* Title and subtitle */}
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {onEdit && canEdit && (
              <button
                onClick={onEdit}
                className="
                  inline-flex items-center px-4 py-2 text-sm font-medium
                  text-gray-700 dark:text-gray-300
                  bg-white dark:bg-gray-800
                  border border-gray-300 dark:border-gray-600
                  rounded-md shadow-sm
                  hover:bg-gray-50 dark:hover:bg-gray-700
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                "
              >
                <EditIcon className="w-4 h-4 mr-2" />
                Edit
              </button>
            )}

            {onDelete && canDelete && (
              <button
                onClick={onDelete}
                className="
                  inline-flex items-center px-4 py-2 text-sm font-medium
                  text-red-600 dark:text-red-400
                  bg-white dark:bg-gray-800
                  border border-red-300 dark:border-red-600
                  rounded-md shadow-sm
                  hover:bg-red-50 dark:hover:bg-red-900/20
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500
                "
              >
                <DeleteIcon className="w-4 h-4 mr-2" />
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content sections */}
      <div className="px-6 py-4 space-y-8">
        {Array.from(sections.entries()).map(([sectionName, attrs]) => (
          <div key={sectionName}>
            {/* Section header */}
            {sections.size > 1 && (
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                {sectionName}
              </h2>
            )}

            {/* Section fields */}
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              {attrs.map((attr) => {
                // Determine if this field should span full width
                const isFullWidth =
                  attr.uiComponent === 'textarea' ||
                  attr.uiComponent === 'richtext' ||
                  attr.uiComponent === 'json' ||
                  attr.uiComponent === 'multiselect';

                return (
                  <div
                    key={attr.name}
                    className={isFullWidth ? 'sm:col-span-2' : ''}
                  >
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      {attr.displayName || formatDisplayName(attr.name)}
                    </dt>
                    <dd className="text-sm text-gray-900 dark:text-white">
                      <FieldDisplay
                        attribute={attr}
                        value={item[attr.name]}
                      />
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>
        ))}

        {/* Metadata section */}
        {(createdAt || updatedAt) && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
              Metadata
            </h2>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 text-sm">
              {createdAt && (
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Created</dt>
                  <dd className="text-gray-900 dark:text-white">{createdAt}</dd>
                </div>
              )}
              {updatedAt && (
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Last updated</dt>
                  <dd className="text-gray-900 dark:text-white">{updatedAt}</dd>
                </div>
              )}
              <div>
                <dt className="text-gray-500 dark:text-gray-400">ID</dt>
                <dd className="text-gray-900 dark:text-white font-mono text-xs">
                  {item.id}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// ICON COMPONENTS
// ============================================================================

const BackIcon: React.FC = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 19l-7-7m0 0l7-7m-7 7h18"
    />
  </svg>
);

const EditIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
    />
  </svg>
);

const DeleteIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatDisplayName(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}
