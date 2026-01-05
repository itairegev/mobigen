/**
 * Presence Manager - Tracks user presence and awareness
 */

import type {
  User,
  UserPresence,
  CursorPosition,
  Selection,
  AwarenessState,
} from '../types.js';

export interface PresenceManagerConfig {
  userId: string;
  user: User;
  idleTimeout?: number;
  awayTimeout?: number;
  broadcastInterval?: number;
}

type PresenceEventType = 'user:join' | 'user:leave' | 'user:update' | 'cursor:move' | 'selection:change';
type PresenceEventListener = (event: { type: PresenceEventType; userId: string; data?: unknown }) => void;

export class PresenceManager {
  private config: PresenceManagerConfig;
  private localPresence: UserPresence;
  private remotePresences: Map<string, UserPresence>;
  private eventListeners: Set<PresenceEventListener>;
  private idleTimer?: NodeJS.Timeout;
  private awayTimer?: NodeJS.Timeout;
  private broadcastTimer?: NodeJS.Timeout;
  private lastActivityTime: number;

  constructor(config: PresenceManagerConfig) {
    this.config = {
      idleTimeout: config.idleTimeout || 60000,   // 1 minute
      awayTimeout: config.awayTimeout || 300000,  // 5 minutes
      broadcastInterval: config.broadcastInterval || 100,
      ...config,
    };

    this.localPresence = {
      user: config.user,
      lastActive: new Date(),
      status: 'active',
    };

    this.remotePresences = new Map();
    this.eventListeners = new Set();
    this.lastActivityTime = Date.now();

    this.startIdleTracking();
  }

  getLocalPresence(): UserPresence {
    return { ...this.localPresence };
  }

  getRemotePresences(): UserPresence[] {
    return Array.from(this.remotePresences.values());
  }

  getPresence(userId: string): UserPresence | undefined {
    if (userId === this.config.userId) {
      return this.localPresence;
    }
    return this.remotePresences.get(userId);
  }

  getAllPresences(): UserPresence[] {
    return [this.localPresence, ...this.remotePresences.values()];
  }

  updateCursor(cursor: CursorPosition): void {
    this.localPresence.cursor = cursor;
    this.localPresence.lastActive = new Date();
    this.markActive();
    this.emit({ type: 'cursor:move', userId: this.config.userId, data: cursor });
    this.scheduleBroadcast();
  }

  updateSelection(selection: Selection): void {
    this.localPresence.selection = selection;
    this.localPresence.lastActive = new Date();
    this.markActive();
    this.emit({ type: 'selection:change', userId: this.config.userId, data: selection });
    this.scheduleBroadcast();
  }

  updateViewingFile(file: string): void {
    this.localPresence.viewingFile = file;
    this.markActive();
    this.scheduleBroadcast();
  }

  handleRemotePresence(userId: string, presence: Partial<UserPresence>): void {
    const existing = this.remotePresences.get(userId);

    if (!existing) {
      // New user joined
      const newPresence: UserPresence = {
        user: presence.user || { id: userId, name: 'Unknown', color: '#888888' },
        lastActive: new Date(presence.lastActive || Date.now()),
        status: presence.status || 'active',
        cursor: presence.cursor,
        selection: presence.selection,
        viewingFile: presence.viewingFile,
      };
      this.remotePresences.set(userId, newPresence);
      this.emit({ type: 'user:join', userId, data: newPresence });
    } else {
      // Update existing presence
      const updated: UserPresence = {
        ...existing,
        ...presence,
        lastActive: new Date(presence.lastActive || existing.lastActive),
      };
      this.remotePresences.set(userId, updated);

      if (presence.cursor) {
        this.emit({ type: 'cursor:move', userId, data: presence.cursor });
      }
      if (presence.selection) {
        this.emit({ type: 'selection:change', userId, data: presence.selection });
      }
    }
  }

  handleRemoteLeave(userId: string): void {
    const presence = this.remotePresences.get(userId);
    if (presence) {
      this.remotePresences.delete(userId);
      this.emit({ type: 'user:leave', userId, data: presence });
    }
  }

  getAwarenessState(): AwarenessState {
    return {
      user: this.localPresence.user,
      cursor: this.localPresence.cursor,
      selection: this.localPresence.selection,
    };
  }

  applyAwarenessUpdate(userId: string, state: AwarenessState | null): void {
    if (!state) {
      this.handleRemoteLeave(userId);
      return;
    }

    this.handleRemotePresence(userId, {
      user: state.user,
      cursor: state.cursor,
      selection: state.selection,
      status: 'active',
      lastActive: new Date(),
    });
  }

  markActive(): void {
    this.lastActivityTime = Date.now();
    if (this.localPresence.status !== 'active') {
      this.localPresence.status = 'active';
      this.emit({ type: 'user:update', userId: this.config.userId, data: this.localPresence });
    }
    this.resetIdleTimers();
  }

  private startIdleTracking(): void {
    this.resetIdleTimers();
  }

  private resetIdleTimers(): void {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    if (this.awayTimer) clearTimeout(this.awayTimer);

    this.idleTimer = setTimeout(() => {
      this.localPresence.status = 'idle';
      this.emit({ type: 'user:update', userId: this.config.userId, data: this.localPresence });
      this.scheduleBroadcast();
    }, this.config.idleTimeout);

    this.awayTimer = setTimeout(() => {
      this.localPresence.status = 'away';
      this.emit({ type: 'user:update', userId: this.config.userId, data: this.localPresence });
      this.scheduleBroadcast();
    }, this.config.awayTimeout);
  }

  private scheduleBroadcast(): void {
    if (this.broadcastTimer) return;

    this.broadcastTimer = setTimeout(() => {
      this.broadcastTimer = undefined;
      // Broadcast would happen via transport layer
    }, this.config.broadcastInterval);
  }

  onPresence(listener: PresenceEventListener): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  private emit(event: { type: PresenceEventType; userId: string; data?: unknown }): void {
    for (const listener of this.eventListeners) {
      listener(event);
    }
  }

  destroy(): void {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    if (this.awayTimer) clearTimeout(this.awayTimer);
    if (this.broadcastTimer) clearTimeout(this.broadcastTimer);
    this.remotePresences.clear();
    this.eventListeners.clear();
  }
}

export function createPresenceManager(config: PresenceManagerConfig): PresenceManager {
  return new PresenceManager(config);
}
