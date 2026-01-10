/**
 * FilterPanel Component
 *
 * Search and filter UI for content lists.
 * Auto-generates filter options from filterable attributes.
 */

import React, { useState, useCallback, useMemo } from 'react';
import type { FilterPanelProps, ContentAttribute } from './types';

export const FilterPanel: React.FC<FilterPanelProps> = ({
  resource,
  filters,
  onFilterChange,
  onSearch,
  searchQuery = '',
  className = '',
}) => {
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [isExpanded, setIsExpanded] = useState(false);

  // Get filterable attributes
  const filterableAttributes = useMemo(() => {
    return resource.attributes.filter(
      (attr) => attr.filterable && !attr.hidden
    );
  }, [resource.attributes]);

  // Handle search input
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setLocalSearch(value);
    },
    []
  );

  // Handle search submit
  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onSearch?.(localSearch);
    },
    [localSearch, onSearch]
  );

  // Handle filter change
  const handleFilterChange = useCallback(
    (name: string, value: unknown) => {
      const newFilters = { ...filters };

      if (value === '' || value === null || value === undefined) {
        delete newFilters[name];
      } else {
        newFilters[name] = value;
      }

      onFilterChange(newFilters);
    },
    [filters, onFilterChange]
  );

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setLocalSearch('');
    onFilterChange({});
    onSearch?.('');
  }, [onFilterChange, onSearch]);

  const hasActiveFilters = Object.keys(filters).length > 0 || searchQuery;

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Search bar */}
      <form onSubmit={handleSearchSubmit} className="px-4 py-3">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="text-gray-400" />
            </div>
            <input
              type="text"
              value={localSearch}
              onChange={handleSearchChange}
              placeholder={`Search ${resource.pluralName}...`}
              className="
                w-full pl-10 pr-4 py-2
                border border-gray-300 dark:border-gray-600
                rounded-md
                bg-white dark:bg-gray-800
                text-gray-900 dark:text-white
                placeholder-gray-400 dark:placeholder-gray-500
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              "
            />
          </div>

          <button
            type="submit"
            className="
              px-4 py-2 text-sm font-medium
              text-white bg-blue-600
              rounded-md
              hover:bg-blue-700
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
            "
          >
            Search
          </button>

          {filterableAttributes.length > 0 && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className={`
                px-4 py-2 text-sm font-medium
                border rounded-md
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                ${isExpanded
                  ? 'text-blue-600 border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                }
              `}
            >
              <div className="flex items-center space-x-2">
                <FilterIcon />
                <span>Filters</span>
                {Object.keys(filters).length > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-600 rounded-full">
                    {Object.keys(filters).length}
                  </span>
                )}
              </div>
            </button>
          )}
        </div>
      </form>

      {/* Expanded filter panel */}
      {isExpanded && filterableAttributes.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filterableAttributes.map((attr) => (
              <FilterField
                key={attr.name}
                attribute={attr}
                value={filters[attr.name]}
                onChange={(value) => handleFilterChange(attr.name, value)}
              />
            ))}
          </div>

          {hasActiveFilters && (
            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                type="button"
                onClick={handleClearFilters}
                className="
                  text-sm text-gray-500 hover:text-gray-700
                  dark:text-gray-400 dark:hover:text-gray-200
                "
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Active filters display */}
      {!isExpanded && hasActiveFilters && (
        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-2">
          {searchQuery && (
            <FilterTag
              label={`Search: "${searchQuery}"`}
              onRemove={() => {
                setLocalSearch('');
                onSearch?.('');
              }}
            />
          )}
          {Object.entries(filters).map(([key, value]) => {
            const attr = resource.attributes.find((a) => a.name === key);
            const label = attr?.displayName || key;
            const displayValue = formatFilterValue(attr, value);
            return (
              <FilterTag
                key={key}
                label={`${label}: ${displayValue}`}
                onRemove={() => handleFilterChange(key, null)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// FILTER FIELD COMPONENT
// ============================================================================

interface FilterFieldProps {
  attribute: ContentAttribute;
  value: unknown;
  onChange: (value: unknown) => void;
}

const FilterField: React.FC<FilterFieldProps> = ({
  attribute,
  value,
  onChange,
}) => {
  const label = attribute.displayName || formatDisplayName(attribute.name);

  // Boolean filter (toggle/checkbox)
  if (attribute.type === 'boolean') {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
        <select
          value={value === undefined ? '' : String(value)}
          onChange={(e) => {
            const v = e.target.value;
            onChange(v === '' ? undefined : v === 'true');
          }}
          className="
            w-full px-3 py-2
            border border-gray-300 dark:border-gray-600
            rounded-md
            bg-white dark:bg-gray-800
            text-gray-900 dark:text-white
            focus:outline-none focus:ring-2 focus:ring-blue-500
          "
        >
          <option value="">Any</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      </div>
    );
  }

  // Select/enum filter
  if (attribute.options && attribute.options.length > 0) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
        <select
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value || undefined)}
          className="
            w-full px-3 py-2
            border border-gray-300 dark:border-gray-600
            rounded-md
            bg-white dark:bg-gray-800
            text-gray-900 dark:text-white
            focus:outline-none focus:ring-2 focus:ring-blue-500
          "
        >
          <option value="">All</option>
          {attribute.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  // Number filter (range)
  if (attribute.type === 'number') {
    const rangeValue = value as { min?: number; max?: number } | undefined;
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
        <div className="flex space-x-2">
          <input
            type="number"
            placeholder="Min"
            value={rangeValue?.min ?? ''}
            onChange={(e) => {
              const min = e.target.value ? Number(e.target.value) : undefined;
              const max = rangeValue?.max;
              if (min === undefined && max === undefined) {
                onChange(undefined);
              } else {
                onChange({ min, max });
              }
            }}
            className="
              w-full px-3 py-2
              border border-gray-300 dark:border-gray-600
              rounded-md
              bg-white dark:bg-gray-800
              text-gray-900 dark:text-white
              focus:outline-none focus:ring-2 focus:ring-blue-500
            "
          />
          <input
            type="number"
            placeholder="Max"
            value={rangeValue?.max ?? ''}
            onChange={(e) => {
              const min = rangeValue?.min;
              const max = e.target.value ? Number(e.target.value) : undefined;
              if (min === undefined && max === undefined) {
                onChange(undefined);
              } else {
                onChange({ min, max });
              }
            }}
            className="
              w-full px-3 py-2
              border border-gray-300 dark:border-gray-600
              rounded-md
              bg-white dark:bg-gray-800
              text-gray-900 dark:text-white
              focus:outline-none focus:ring-2 focus:ring-blue-500
            "
          />
        </div>
      </div>
    );
  }

  // Date filter
  if (
    attribute.uiComponent === 'date' ||
    attribute.uiComponent === 'datetime'
  ) {
    const dateValue = value as { from?: string; to?: string } | undefined;
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
        <div className="flex space-x-2">
          <input
            type="date"
            value={dateValue?.from ?? ''}
            onChange={(e) => {
              const from = e.target.value || undefined;
              const to = dateValue?.to;
              if (!from && !to) {
                onChange(undefined);
              } else {
                onChange({ from, to });
              }
            }}
            className="
              w-full px-3 py-2
              border border-gray-300 dark:border-gray-600
              rounded-md
              bg-white dark:bg-gray-800
              text-gray-900 dark:text-white
              focus:outline-none focus:ring-2 focus:ring-blue-500
            "
          />
          <input
            type="date"
            value={dateValue?.to ?? ''}
            onChange={(e) => {
              const from = dateValue?.from;
              const to = e.target.value || undefined;
              if (!from && !to) {
                onChange(undefined);
              } else {
                onChange({ from, to });
              }
            }}
            className="
              w-full px-3 py-2
              border border-gray-300 dark:border-gray-600
              rounded-md
              bg-white dark:bg-gray-800
              text-gray-900 dark:text-white
              focus:outline-none focus:ring-2 focus:ring-blue-500
            "
          />
        </div>
      </div>
    );
  }

  // Text filter (contains)
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <input
        type="text"
        placeholder={`Filter by ${label.toLowerCase()}...`}
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="
          w-full px-3 py-2
          border border-gray-300 dark:border-gray-600
          rounded-md
          bg-white dark:bg-gray-800
          text-gray-900 dark:text-white
          focus:outline-none focus:ring-2 focus:ring-blue-500
        "
      />
    </div>
  );
};

// ============================================================================
// FILTER TAG COMPONENT
// ============================================================================

interface FilterTagProps {
  label: string;
  onRemove: () => void;
}

const FilterTag: React.FC<FilterTagProps> = ({ label, onRemove }) => (
  <span className="
    inline-flex items-center px-2 py-1
    rounded-full text-sm
    bg-gray-100 dark:bg-gray-700
    text-gray-700 dark:text-gray-300
  ">
    <span className="truncate max-w-[200px]">{label}</span>
    <button
      type="button"
      onClick={onRemove}
      className="ml-1 p-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
    >
      <CloseIcon />
    </button>
  </span>
);

// ============================================================================
// ICON COMPONENTS
// ============================================================================

const SearchIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={`w-5 h-5 ${className}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

const FilterIcon: React.FC = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
    />
  </svg>
);

const CloseIcon: React.FC = () => (
  <svg
    className="w-3 h-3"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
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

function formatFilterValue(
  attr: ContentAttribute | undefined,
  value: unknown
): string {
  if (value === undefined || value === null) return '';

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (typeof value === 'object' && value !== null) {
    if ('min' in value || 'max' in value) {
      const range = value as { min?: number; max?: number };
      if (range.min !== undefined && range.max !== undefined) {
        return `${range.min} - ${range.max}`;
      }
      if (range.min !== undefined) {
        return `>= ${range.min}`;
      }
      if (range.max !== undefined) {
        return `<= ${range.max}`;
      }
    }
    if ('from' in value || 'to' in value) {
      const date = value as { from?: string; to?: string };
      if (date.from && date.to) {
        return `${date.from} to ${date.to}`;
      }
      if (date.from) {
        return `from ${date.from}`;
      }
      if (date.to) {
        return `until ${date.to}`;
      }
    }
  }

  // Look up option label
  if (attr?.options) {
    const option = attr.options.find((o) => o.value === value);
    if (option) return option.label;
  }

  return String(value);
}
