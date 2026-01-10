/**
 * Pagination Component
 *
 * Navigation controls for paginated content lists.
 */

import React from 'react';
import type { PaginationProps } from './types';

export const Pagination: React.FC<PaginationProps> = ({
  page,
  pageSize,
  total,
  hasMore,
  onPageChange,
  onPageSizeChange,
  className = '',
}) => {
  const totalPages = Math.ceil(total / pageSize);
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  // Generate page numbers to display
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (page > 3) {
        pages.push('ellipsis');
      }

      // Show pages around current page
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (page < totalPages - 2) {
        pages.push('ellipsis');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  const pageSizeOptions = [10, 25, 50, 100];

  if (total === 0) {
    return null;
  }

  return (
    <div
      className={`
        flex flex-col sm:flex-row items-center justify-between
        px-4 py-3
        bg-white dark:bg-gray-900
        border-t border-gray-200 dark:border-gray-700
        ${className}
      `}
    >
      {/* Page size selector and info */}
      <div className="flex items-center space-x-4 mb-3 sm:mb-0">
        {onPageSizeChange && (
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-500 dark:text-gray-400">
              Show
            </label>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="
                px-2 py-1 text-sm
                border border-gray-300 dark:border-gray-600
                rounded-md
                bg-white dark:bg-gray-800
                text-gray-900 dark:text-white
                focus:outline-none focus:ring-2 focus:ring-blue-500
              "
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              per page
            </span>
          </div>
        )}

        <span className="text-sm text-gray-500 dark:text-gray-400">
          Showing <span className="font-medium">{startItem}</span> to{' '}
          <span className="font-medium">{endItem}</span> of{' '}
          <span className="font-medium">{total}</span> results
        </span>
      </div>

      {/* Page navigation */}
      <nav className="flex items-center space-x-1">
        {/* Previous button */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="
            p-2 text-sm font-medium
            text-gray-500 dark:text-gray-400
            hover:text-gray-700 dark:hover:text-gray-200
            hover:bg-gray-100 dark:hover:bg-gray-800
            rounded-md
            disabled:opacity-50 disabled:cursor-not-allowed
            disabled:hover:bg-transparent
          "
          title="Previous page"
        >
          <ChevronLeftIcon />
        </button>

        {/* Page numbers */}
        <div className="hidden sm:flex items-center space-x-1">
          {getPageNumbers().map((pageNum, index) => {
            if (pageNum === 'ellipsis') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-3 py-2 text-sm text-gray-400"
                >
                  ...
                </span>
              );
            }

            const isActive = pageNum === page;

            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`
                  px-3 py-2 text-sm font-medium
                  rounded-md
                  ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }
                `}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Mobile page indicator */}
        <span className="sm:hidden px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
          Page {page} of {totalPages}
        </span>

        {/* Next button */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!hasMore && page === totalPages}
          className="
            p-2 text-sm font-medium
            text-gray-500 dark:text-gray-400
            hover:text-gray-700 dark:hover:text-gray-200
            hover:bg-gray-100 dark:hover:bg-gray-800
            rounded-md
            disabled:opacity-50 disabled:cursor-not-allowed
            disabled:hover:bg-transparent
          "
          title="Next page"
        >
          <ChevronRightIcon />
        </button>
      </nav>
    </div>
  );
};

// ============================================================================
// ICON COMPONENTS
// ============================================================================

const ChevronLeftIcon: React.FC = () => (
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
      d="M15 19l-7-7 7-7"
    />
  </svg>
);

const ChevronRightIcon: React.FC = () => (
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
      d="M9 5l7 7-7 7"
    />
  </svg>
);
