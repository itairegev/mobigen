/**
 * BulkActions Component
 *
 * Multi-select operation toolbar for content lists.
 * Shows when items are selected and provides bulk operations.
 */

import React, { useState } from 'react';
import type { BulkActionsProps } from './types';

export const BulkActions: React.FC<BulkActionsProps> = ({
  selectedCount,
  onDelete,
  onExport,
  onClearSelection,
  isDeleting = false,
  canDelete = true,
  canExport = true,
  className = '',
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (selectedCount === 0) {
    return null;
  }

  const handleDeleteClick = () => {
    if (selectedCount > 10) {
      // Show confirmation for large deletions
      setShowDeleteConfirm(true);
    } else {
      onDelete?.();
    }
  };

  const handleConfirmDelete = () => {
    setShowDeleteConfirm(false);
    onDelete?.();
  };

  return (
    <>
      <div
        className={`
          fixed bottom-4 left-1/2 -translate-x-1/2
          bg-gray-900 dark:bg-gray-800
          rounded-lg shadow-lg
          px-4 py-3
          flex items-center space-x-4
          z-50
          ${className}
        `}
      >
        {/* Selection count */}
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center justify-center w-6 h-6 text-sm font-bold text-white bg-blue-600 rounded-full">
            {selectedCount > 99 ? '99+' : selectedCount}
          </span>
          <span className="text-white text-sm">
            {selectedCount === 1 ? 'item selected' : 'items selected'}
          </span>
        </div>

        {/* Separator */}
        <div className="h-6 w-px bg-gray-700" />

        {/* Action buttons */}
        <div className="flex items-center space-x-2">
          {/* Export button */}
          {onExport && canExport && (
            <button
              onClick={onExport}
              className="
                inline-flex items-center px-3 py-1.5
                text-sm font-medium
                text-white
                bg-gray-700 hover:bg-gray-600
                rounded-md
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500
              "
            >
              <ExportIcon className="w-4 h-4 mr-1.5" />
              Export
            </button>
          )}

          {/* Delete button */}
          {onDelete && canDelete && (
            <button
              onClick={handleDeleteClick}
              disabled={isDeleting}
              className="
                inline-flex items-center px-3 py-1.5
                text-sm font-medium
                text-white
                bg-red-600 hover:bg-red-700
                rounded-md
                disabled:opacity-50 disabled:cursor-not-allowed
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-red-500
              "
            >
              {isDeleting ? (
                <>
                  <Spinner className="w-4 h-4 mr-1.5" />
                  Deleting...
                </>
              ) : (
                <>
                  <DeleteIcon className="w-4 h-4 mr-1.5" />
                  Delete
                </>
              )}
            </button>
          )}

          {/* Clear selection button */}
          {onClearSelection && (
            <button
              onClick={onClearSelection}
              className="
                p-1.5
                text-gray-400 hover:text-white
                rounded-md
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500
              "
              title="Clear selection"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <DeleteConfirmModal
          count={selectedCount}
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </>
  );
};

// ============================================================================
// DELETE CONFIRMATION MODAL
// ============================================================================

interface DeleteConfirmModalProps {
  count: number;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  count,
  onConfirm,
  onCancel,
}) => (
  <div className="fixed inset-0 z-50 overflow-y-auto">
    {/* Backdrop */}
    <div
      className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
      onClick={onCancel}
    />

    {/* Modal */}
    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
      <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
        <div className="px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
          <div className="sm:flex sm:items-start">
            {/* Warning icon */}
            <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 sm:mx-0 sm:h-10 sm:w-10">
              <WarningIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>

            {/* Content */}
            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
              <h3 className="text-lg font-semibold leading-6 text-gray-900 dark:text-white">
                Delete {count} items?
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Are you sure you want to delete {count} items? This action
                  cannot be undone. All selected items will be permanently
                  removed.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
          <button
            type="button"
            onClick={onConfirm}
            className="
              inline-flex w-full justify-center rounded-md
              bg-red-600 px-3 py-2 text-sm font-semibold text-white
              shadow-sm hover:bg-red-500
              sm:ml-3 sm:w-auto
            "
          >
            Delete {count} items
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="
              mt-3 inline-flex w-full justify-center rounded-md
              bg-white dark:bg-gray-700 px-3 py-2 text-sm font-semibold
              text-gray-900 dark:text-white
              shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600
              hover:bg-gray-50 dark:hover:bg-gray-600
              sm:mt-0 sm:w-auto
            "
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
);

// ============================================================================
// ICON COMPONENTS
// ============================================================================

const ExportIcon: React.FC<{ className?: string }> = ({ className }) => (
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
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
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

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
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
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

const WarningIcon: React.FC<{ className?: string }> = ({ className }) => (
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
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
    />
  </svg>
);

const Spinner: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={`animate-spin ${className}`}
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);
