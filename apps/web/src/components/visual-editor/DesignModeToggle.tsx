'use client';

import { useVisualEditor, useDesignModeShortcuts } from '../../hooks/useVisualEditor';

interface DesignModeToggleProps {
  className?: string;
}

/**
 * Design Mode Toggle - switch between chat mode and visual design mode
 */
export function DesignModeToggle({ className = '' }: DesignModeToggleProps) {
  const { isDesignMode, toggleDesignMode, canUndo, canRedo, undo, redo, pendingChanges } =
    useVisualEditor();

  // Enable keyboard shortcuts
  useDesignModeShortcuts();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Mode Toggle */}
      <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
        <button
          onClick={() => !isDesignMode && toggleDesignMode()}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
            !isDesignMode
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          💬 Chat
        </button>
        <button
          onClick={() => isDesignMode || toggleDesignMode()}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
            isDesignMode
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          🎨 Design
        </button>
      </div>

      {/* Undo/Redo (only shown in design mode) */}
      {isDesignMode && (
        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Undo (Cmd/Ctrl + Z)"
          >
            <svg
              className="w-4 h-4 text-slate-600 dark:text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
              />
            </svg>
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Redo (Cmd/Ctrl + Shift + Z)"
          >
            <svg
              className="w-4 h-4 text-slate-600 dark:text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Pending changes indicator */}
      {isDesignMode && pendingChanges.length > 0 && (
        <div className="ml-2 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 rounded text-xs text-yellow-700 dark:text-yellow-400">
          {pendingChanges.length} unsaved
        </div>
      )}
    </div>
  );
}

export default DesignModeToggle;
