'use client';

import { useState, useEffect, useCallback } from 'react';
import { visualEditorStore, type SelectedElement, type DesignChange } from '../stores/visual-editor';

/**
 * Hook for accessing visual editor state and actions
 */
export function useVisualEditor() {
  const [state, setState] = useState(visualEditorStore.getState());

  useEffect(() => {
    return visualEditorStore.subscribe(() => {
      setState(visualEditorStore.getState());
    });
  }, []);

  const toggleDesignMode = useCallback(() => {
    visualEditorStore.setDesignMode(!state.isDesignMode);
  }, [state.isDesignMode]);

  const selectElement = useCallback((element: SelectedElement | null) => {
    visualEditorStore.selectElement(element);
  }, []);

  const hoverElement = useCallback((element: SelectedElement | null) => {
    visualEditorStore.hoverElement(element);
  }, []);

  const applyChange = useCallback((change: Omit<DesignChange, 'id' | 'timestamp'>) => {
    return visualEditorStore.applyChange(change);
  }, []);

  const undo = useCallback(() => {
    return visualEditorStore.undo();
  }, []);

  const redo = useCallback(() => {
    return visualEditorStore.redo();
  }, []);

  return {
    // State
    isDesignMode: state.isDesignMode,
    selectedElement: state.selectedElement,
    hoveredElement: state.hoveredElement,
    history: state.history,
    historyIndex: state.historyIndex,
    pendingChanges: state.pendingChanges,
    previewUrl: state.previewUrl,
    isSyncing: state.isSyncing,
    canUndo: visualEditorStore.canUndo(),
    canRedo: visualEditorStore.canRedo(),

    // Actions
    toggleDesignMode,
    setDesignMode: visualEditorStore.setDesignMode,
    selectElement,
    hoverElement,
    applyChange,
    undo,
    redo,
    setPreviewUrl: visualEditorStore.setPreviewUrl,
    setSyncing: visualEditorStore.setSyncing,
    clearPendingChanges: visualEditorStore.clearPendingChanges,
    reset: visualEditorStore.reset,
  };
}

/**
 * Hook for keyboard shortcuts in design mode
 */
export function useDesignModeShortcuts() {
  const { isDesignMode, undo, redo, canUndo, canRedo, setDesignMode } = useVisualEditor();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to exit design mode
      if (e.key === 'Escape' && isDesignMode) {
        setDesignMode(false);
        return;
      }

      // Cmd/Ctrl + Z for undo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey && isDesignMode) {
        e.preventDefault();
        if (canUndo) undo();
        return;
      }

      // Cmd/Ctrl + Shift + Z for redo
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'z' && isDesignMode) {
        e.preventDefault();
        if (canRedo) redo();
        return;
      }

      // Cmd/Ctrl + Y for redo (alternative)
      if ((e.metaKey || e.ctrlKey) && e.key === 'y' && isDesignMode) {
        e.preventDefault();
        if (canRedo) redo();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDesignMode, undo, redo, canUndo, canRedo, setDesignMode]);
}

export default useVisualEditor;
