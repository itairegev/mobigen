/**
 * Visual Editor Components
 *
 * Sprint 5: Visual Design Mode
 * Enables point-and-click editing of app elements
 */

// Main panel component
export { VisualEditorPanel } from './VisualEditorPanel';

// Individual components
export { SelectionOverlay } from './SelectionOverlay';
export { StyleControls } from './StyleControls';
export { TextEditor } from './TextEditor';
export { ImageUpload } from './ImageUpload';
export { ColorPicker } from './ColorPicker';
export { PreviewSync } from './PreviewSync';
export { DesignModeToggle } from './DesignModeToggle';

// Re-export types from store
export type { SelectedElement, DesignChange, VisualEditorState } from '../../stores/visual-editor';

// Re-export hooks
export { useVisualEditor, useDesignModeShortcuts } from '../../hooks/useVisualEditor';
