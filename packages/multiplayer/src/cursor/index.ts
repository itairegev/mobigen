/**
 * Cursor Sync Index
 */

export { CursorManager, createCursorManager } from './cursor-manager.js';
export type {
  CursorState,
  CursorManagerConfig,
  CursorDecoration,
  SelectionDecoration,
} from './cursor-manager.js';

export { CursorRenderer, createCursorRenderer } from './cursor-renderer.js';
export type {
  RenderOptions,
  CursorStyle,
  LabelStyle,
  SelectionStyle,
} from './cursor-renderer.js';
