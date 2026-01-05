'use client';

/**
 * Visual Editor Store - manages visual design mode state
 * Includes element selection, undo/redo history, and design changes
 */

export interface SelectedElement {
  id: string;
  type: 'text' | 'image' | 'container' | 'button' | 'input';
  path: string; // file path
  line: number;
  content: string;
  styles: Record<string, string>;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface DesignChange {
  id: string;
  timestamp: number;
  type: 'style' | 'text' | 'image' | 'layout';
  elementId: string;
  elementPath: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  description: string;
}

export interface VisualEditorState {
  // Mode
  isDesignMode: boolean;

  // Selection
  selectedElement: SelectedElement | null;
  hoveredElement: SelectedElement | null;

  // History for undo/redo
  history: DesignChange[];
  historyIndex: number;

  // Pending changes (not yet applied)
  pendingChanges: DesignChange[];

  // Preview sync
  previewUrl: string | null;
  isSyncing: boolean;
}

// Create initial state
const initialState: VisualEditorState = {
  isDesignMode: false,
  selectedElement: null,
  hoveredElement: null,
  history: [],
  historyIndex: -1,
  pendingChanges: [],
  previewUrl: null,
  isSyncing: false,
};

// Store instance (simple implementation without zustand for now)
let state: VisualEditorState = { ...initialState };
const listeners: Set<() => void> = new Set();

function notify() {
  listeners.forEach((listener) => listener());
}

export const visualEditorStore = {
  getState: () => state,

  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  // Design mode toggle
  setDesignMode: (enabled: boolean) => {
    state = { ...state, isDesignMode: enabled };
    if (!enabled) {
      state.selectedElement = null;
      state.hoveredElement = null;
    }
    notify();
  },

  // Element selection
  selectElement: (element: SelectedElement | null) => {
    state = { ...state, selectedElement: element };
    notify();
  },

  hoverElement: (element: SelectedElement | null) => {
    state = { ...state, hoveredElement: element };
    notify();
  },

  // Apply a change
  applyChange: (change: Omit<DesignChange, 'id' | 'timestamp'>) => {
    const fullChange: DesignChange = {
      ...change,
      id: `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    // Remove any redo history
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(fullChange);

    state = {
      ...state,
      history: newHistory,
      historyIndex: newHistory.length - 1,
      pendingChanges: [...state.pendingChanges, fullChange],
    };
    notify();
    return fullChange;
  },

  // Undo
  undo: () => {
    if (state.historyIndex < 0) return null;

    const change = state.history[state.historyIndex];
    state = {
      ...state,
      historyIndex: state.historyIndex - 1,
    };
    notify();
    return change;
  },

  // Redo
  redo: () => {
    if (state.historyIndex >= state.history.length - 1) return null;

    const nextIndex = state.historyIndex + 1;
    const change = state.history[nextIndex];
    state = {
      ...state,
      historyIndex: nextIndex,
    };
    notify();
    return change;
  },

  // Check if can undo/redo
  canUndo: () => state.historyIndex >= 0,
  canRedo: () => state.historyIndex < state.history.length - 1,

  // Preview sync
  setPreviewUrl: (url: string | null) => {
    state = { ...state, previewUrl: url };
    notify();
  },

  setSyncing: (syncing: boolean) => {
    state = { ...state, isSyncing: syncing };
    notify();
  },

  // Clear pending changes after sync
  clearPendingChanges: () => {
    state = { ...state, pendingChanges: [] };
    notify();
  },

  // Reset store
  reset: () => {
    state = { ...initialState };
    notify();
  },
};

export default visualEditorStore;
