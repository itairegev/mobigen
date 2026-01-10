/**
 * ResourceTable Component
 *
 * Generic data table for displaying content items.
 * Auto-generates columns from resource definition.
 */

import React, { useMemo } from 'react';
import type {
  ResourceTableProps,
  ContentItem,
  ContentAttribute,
  ColumnDef,
} from './types';
import { FieldDisplay } from './FieldRenderer';

export const ResourceTable: React.FC<ResourceTableProps> = ({
  resource,
  items,
  isLoading = false,
  selectedIds = [],
  onSelect,
  onSort,
  currentSort,
  onRowClick,
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true,
  emptyMessage = 'No items found',
  className = '',
}) => {
  // Generate columns from resource definition
  const columns = useMemo(() => {
    return resource.attributes
      .filter((attr) => attr.showInList !== false && !attr.hidden)
      .sort((a, b) => (a.order ?? 100) - (b.order ?? 100))
      .map((attr): ColumnDef => ({
        key: attr.name,
        header: attr.displayName || formatDisplayName(attr.name),
        width: attr.listWidth,
        sortable: attr.sortable !== false,
        render: (value, item) => (
          <FieldDisplay attribute={attr} value={value} />
        ),
      }));
  }, [resource.attributes]);

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (!onSelect) return;
    if (checked) {
      onSelect(items.map((item) => item.id));
    } else {
      onSelect([]);
    }
  };

  // Handle individual row selection
  const handleSelectRow = (id: string, checked: boolean) => {
    if (!onSelect) return;
    if (checked) {
      onSelect([...selectedIds, id]);
    } else {
      onSelect(selectedIds.filter((selectedId) => selectedId !== id));
    }
  };

  // Handle column sort
  const handleSort = (field: string) => {
    if (!onSort) return;
    const column = columns.find((c) => c.key === field);
    if (!column?.sortable) return;

    const newOrder =
      currentSort?.field === field && currentSort.order === 'asc'
        ? 'desc'
        : 'asc';
    onSort(field, newOrder);
  };

  const isAllSelected = items.length > 0 && selectedIds.length === items.length;
  const isSomeSelected = selectedIds.length > 0 && selectedIds.length < items.length;

  // Width classes for columns
  const widthClasses: Record<string, string> = {
    sm: 'w-24',
    md: 'w-32',
    lg: 'w-48',
    xl: 'w-64',
  };

  if (isLoading) {
    return (
      <div className={`overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="animate-pulse">
          {/* Header skeleton */}
          <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2" />
          </div>
          {/* Row skeletons */}
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="px-4 py-4 border-b border-gray-100 dark:border-gray-800"
            >
              <div className="flex space-x-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/4" />
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/3" />
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={`overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="px-4 py-12 text-center">
          <div className="text-gray-400 dark:text-gray-500 mb-2">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {/* Selection checkbox column */}
              {onSelect && (
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isSomeSelected;
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                </th>
              )}

              {/* Data columns */}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`
                    px-4 py-3 text-left text-xs font-medium
                    text-gray-500 dark:text-gray-400 uppercase tracking-wider
                    ${column.width ? widthClasses[column.width] : ''}
                    ${column.sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700' : ''}
                  `}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.header}</span>
                    {column.sortable && currentSort?.field === column.key && (
                      <SortIcon order={currentSort.order} />
                    )}
                  </div>
                </th>
              ))}

              {/* Actions column */}
              {(onEdit || onDelete) && (canEdit || canDelete) && (
                <th className="w-24 px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {items.map((item) => (
              <tr
                key={item.id}
                className={`
                  ${onRowClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : ''}
                  ${selectedIds.includes(item.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                `}
                onClick={() => onRowClick?.(item)}
              >
                {/* Selection checkbox */}
                {onSelect && (
                  <td
                    className="px-4 py-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={(e) => handleSelectRow(item.id, e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </td>
                )}

                {/* Data cells */}
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`
                      px-4 py-4 text-sm text-gray-900 dark:text-gray-100
                      ${column.width ? widthClasses[column.width] : ''}
                    `}
                  >
                    {column.render
                      ? column.render(item[column.key], item)
                      : String(item[column.key] ?? '')}
                  </td>
                ))}

                {/* Action buttons */}
                {(onEdit || onDelete) && (canEdit || canDelete) && (
                  <td
                    className="px-4 py-4 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex justify-end space-x-2">
                      {onEdit && canEdit && (
                        <button
                          onClick={() => onEdit(item)}
                          className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                          title="Edit"
                        >
                          <EditIcon />
                        </button>
                      )}
                      {onDelete && canDelete && (
                        <button
                          onClick={() => onDelete(item)}
                          className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                          title="Delete"
                        >
                          <DeleteIcon />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

const SortIcon: React.FC<{ order: 'asc' | 'desc' }> = ({ order }) => (
  <svg
    className="w-4 h-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    {order === 'asc' ? (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 15l7-7 7 7"
      />
    ) : (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    )}
  </svg>
);

const EditIcon: React.FC = () => (
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
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
    />
  </svg>
);

const DeleteIcon: React.FC = () => (
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
