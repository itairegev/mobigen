/**
 * Cursor Manager - Handles real-time cursor synchronization
 */

import type {
  User,
  CursorPosition,
  Selection,
} from '../types.js';

export interface CursorState {
  user: User;
  position: CursorPosition;
  selection?: Selection;
  lastUpdate: number;
  isInterpolating: boolean;
}

export interface CursorManagerConfig {
  userId: string;
  broadcastInterval?: number;
  interpolationDuration?: number;
  cursorTimeout?: number;
  maxCursors?: number;
}

export interface CursorDecoration {
  userId: string;
  color: string;
  label: string;
  line: number;
  column: number;
  file: string;
  isActive: boolean;
}

export interface SelectionDecoration {
  userId: string;
  color: string;
  file: string;
  ranges: Array<{
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  }>;
}

type CursorEventType = 'cursor:add' | 'cursor:move' | 'cursor:remove' | 'selection:change';
type CursorEventListener = (event: { type: CursorEventType; userId: string; data?: unknown }) => void;

export class CursorManager {
  private config: CursorManagerConfig;
  private cursors: Map<string, CursorState>;
  private localCursor: CursorPosition | null = null;
  private localSelection: Selection | null = null;
  private eventListeners: Set<CursorEventListener>;
  private broadcastTimer?: NodeJS.Timeout;
  private cleanupTimer?: NodeJS.Timeout;
  private pendingBroadcast = false;
  private interpolationFrames: Map<string, number>;

  constructor(config: CursorManagerConfig) {
    this.config = {
      broadcastInterval: config.broadcastInterval || 50,
      interpolationDuration: config.interpolationDuration || 100,
      cursorTimeout: config.cursorTimeout || 10000,
      maxCursors: config.maxCursors || 50,
      ...config,
    };
    this.cursors = new Map();
    this.eventListeners = new Set();
    this.interpolationFrames = new Map();

    this.startCleanupTimer();
  }

  // Local cursor operations
  setLocalCursor(position: CursorPosition): void {
    this.localCursor = position;
    this.scheduleBroadcast();
  }

  setLocalSelection(selection: Selection | null): void {
    this.localSelection = selection;
    this.scheduleBroadcast();
  }

  getLocalCursor(): CursorPosition | null {
    return this.localCursor;
  }

  getLocalSelection(): Selection | null {
    return this.localSelection;
  }

  // Remote cursor operations
  updateRemoteCursor(userId: string, user: User, position: CursorPosition): void {
    if (userId === this.config.userId) return;

    const existing = this.cursors.get(userId);
    const now = Date.now();

    if (existing) {
      // Start interpolation
      this.startInterpolation(userId, existing.position, position);

      existing.position = position;
      existing.lastUpdate = now;
      existing.isInterpolating = true;

      this.emit({ type: 'cursor:move', userId, data: { position, user } });
    } else {
      // Check max cursors limit
      if (this.cursors.size >= (this.config.maxCursors || 50)) {
        this.removeOldestCursor();
      }

      this.cursors.set(userId, {
        user,
        position,
        lastUpdate: now,
        isInterpolating: false,
      });

      this.emit({ type: 'cursor:add', userId, data: { position, user } });
    }
  }

  updateRemoteSelection(userId: string, selection: Selection | null): void {
    if (userId === this.config.userId) return;

    const existing = this.cursors.get(userId);
    if (existing) {
      existing.selection = selection || undefined;
      existing.lastUpdate = Date.now();
      this.emit({ type: 'selection:change', userId, data: { selection } });
    }
  }

  removeRemoteCursor(userId: string): void {
    const cursor = this.cursors.get(userId);
    if (cursor) {
      this.cancelInterpolation(userId);
      this.cursors.delete(userId);
      this.emit({ type: 'cursor:remove', userId, data: { user: cursor.user } });
    }
  }

  // Cursor queries
  getCursor(userId: string): CursorState | undefined {
    return this.cursors.get(userId);
  }

  getAllCursors(): CursorState[] {
    return Array.from(this.cursors.values());
  }

  getCursorsInFile(file: string): CursorState[] {
    return this.getAllCursors().filter(c => c.position.file === file);
  }

  getCursorCount(): number {
    return this.cursors.size;
  }

  // Decorations for editor integration
  getCursorDecorations(file: string): CursorDecoration[] {
    return this.getCursorsInFile(file).map(cursor => ({
      userId: cursor.user.id,
      color: cursor.user.color,
      label: cursor.user.name,
      line: cursor.position.line,
      column: cursor.position.column,
      file: cursor.position.file,
      isActive: Date.now() - cursor.lastUpdate < 5000,
    }));
  }

  getSelectionDecorations(file: string): SelectionDecoration[] {
    return this.getCursorsInFile(file)
      .filter(cursor => cursor.selection && cursor.selection.file === file)
      .map(cursor => ({
        userId: cursor.user.id,
        color: cursor.user.color,
        file,
        ranges: [{
          startLine: cursor.selection!.anchor.line,
          startColumn: cursor.selection!.anchor.column,
          endLine: cursor.selection!.head.line,
          endColumn: cursor.selection!.head.column,
        }],
      }));
  }

  // Interpolation for smooth cursor movement
  private startInterpolation(
    userId: string,
    from: CursorPosition,
    to: CursorPosition
  ): void {
    this.cancelInterpolation(userId);

    // Skip interpolation if different file
    if (from.file !== to.file) return;

    const startTime = performance.now();
    const duration = this.config.interpolationDuration || 100;

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const cursor = this.cursors.get(userId);
      if (!cursor) return;

      // Linear interpolation
      cursor.position = {
        file: to.file,
        line: Math.round(from.line + (to.line - from.line) * progress),
        column: Math.round(from.column + (to.column - from.column) * progress),
        timestamp: Date.now(),
      };

      if (progress < 1) {
        const frameId = requestAnimationFrame(animate);
        this.interpolationFrames.set(userId, frameId);
      } else {
        cursor.isInterpolating = false;
        this.interpolationFrames.delete(userId);
      }
    };

    const frameId = requestAnimationFrame(animate);
    this.interpolationFrames.set(userId, frameId);
  }

  private cancelInterpolation(userId: string): void {
    const frameId = this.interpolationFrames.get(userId);
    if (frameId !== undefined) {
      cancelAnimationFrame(frameId);
      this.interpolationFrames.delete(userId);
    }
  }

  // Broadcast throttling
  private scheduleBroadcast(): void {
    if (this.pendingBroadcast) return;

    this.pendingBroadcast = true;

    if (this.broadcastTimer) {
      clearTimeout(this.broadcastTimer);
    }

    this.broadcastTimer = setTimeout(() => {
      this.pendingBroadcast = false;
      // Broadcast would be handled by the transport layer
      // This just signals that a broadcast should happen
    }, this.config.broadcastInterval);
  }

  // Cleanup stale cursors
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      const timeout = this.config.cursorTimeout || 10000;

      for (const [userId, cursor] of this.cursors) {
        if (now - cursor.lastUpdate > timeout) {
          this.removeRemoteCursor(userId);
        }
      }
    }, 5000);
  }

  private removeOldestCursor(): void {
    let oldest: { userId: string; time: number } | null = null;

    for (const [userId, cursor] of this.cursors) {
      if (!oldest || cursor.lastUpdate < oldest.time) {
        oldest = { userId, time: cursor.lastUpdate };
      }
    }

    if (oldest) {
      this.removeRemoteCursor(oldest.userId);
    }
  }

  // Event handling
  onCursor(listener: CursorEventListener): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  private emit(event: { type: CursorEventType; userId: string; data?: unknown }): void {
    for (const listener of this.eventListeners) {
      listener(event);
    }
  }

  // State for broadcasting
  getStateForBroadcast(): { cursor: CursorPosition | null; selection: Selection | null } {
    return {
      cursor: this.localCursor,
      selection: this.localSelection,
    };
  }

  destroy(): void {
    if (this.broadcastTimer) clearTimeout(this.broadcastTimer);
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);

    for (const frameId of this.interpolationFrames.values()) {
      cancelAnimationFrame(frameId);
    }

    this.cursors.clear();
    this.interpolationFrames.clear();
    this.eventListeners.clear();
  }
}

export function createCursorManager(config: CursorManagerConfig): CursorManager {
  return new CursorManager(config);
}
