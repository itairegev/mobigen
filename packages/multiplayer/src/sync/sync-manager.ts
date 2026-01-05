/**
 * Sync Manager - Coordinates document synchronization
 */

import type {
  SyncState,
  SyncStatus,
  OperationBatch,
  ConflictResolution,
  Document,
} from '../types.js';
import { TextCRDT } from '../crdt/text-crdt.js';

export interface SyncManagerConfig {
  syncInterval?: number;
  maxPendingChanges?: number;
  conflictStrategy?: 'last-write-wins' | 'merge' | 'manual';
  onConflict?: (conflict: ConflictResolution) => Promise<ConflictResolution>;
}

type SyncEventType = 'sync:start' | 'sync:complete' | 'sync:error' | 'conflict:detected' | 'conflict:resolved';
type SyncEventListener = (event: { type: SyncEventType; data?: unknown }) => void;

export class SyncManager {
  private config: SyncManagerConfig;
  private documents: Map<string, TextCRDT>;
  private pendingChanges: Map<string, OperationBatch[]>;
  private syncStatus: Map<string, SyncStatus>;
  private syncTimers: Map<string, NodeJS.Timeout>;
  private eventListeners: Set<SyncEventListener>;

  constructor(config: SyncManagerConfig = {}) {
    this.config = {
      syncInterval: config.syncInterval || 1000,
      maxPendingChanges: config.maxPendingChanges || 100,
      conflictStrategy: config.conflictStrategy || 'merge',
      onConflict: config.onConflict,
    };
    this.documents = new Map();
    this.pendingChanges = new Map();
    this.syncStatus = new Map();
    this.syncTimers = new Map();
    this.eventListeners = new Set();
  }

  registerDocument(documentId: string, crdt: TextCRDT): void {
    this.documents.set(documentId, crdt);
    this.pendingChanges.set(documentId, []);
    this.syncStatus.set(documentId, {
      state: 'synced',
      pendingChanges: 0,
      lastSyncedAt: new Date(),
      conflictCount: 0,
    });
  }

  unregisterDocument(documentId: string): void {
    this.documents.delete(documentId);
    this.pendingChanges.delete(documentId);
    this.syncStatus.delete(documentId);

    const timer = this.syncTimers.get(documentId);
    if (timer) {
      clearTimeout(timer);
      this.syncTimers.delete(documentId);
    }
  }

  queueChange(documentId: string, batch: OperationBatch): void {
    const pending = this.pendingChanges.get(documentId) || [];
    pending.push(batch);
    this.pendingChanges.set(documentId, pending);

    this.updateStatus(documentId, {
      state: 'syncing',
      pendingChanges: pending.length,
    });

    this.scheduleSync(documentId);
  }

  private scheduleSync(documentId: string): void {
    // Clear existing timer
    const existingTimer = this.syncTimers.get(documentId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Schedule new sync
    const timer = setTimeout(() => {
      void this.syncDocument(documentId);
    }, this.config.syncInterval);

    this.syncTimers.set(documentId, timer);
  }

  async syncDocument(documentId: string): Promise<boolean> {
    const crdt = this.documents.get(documentId);
    const pending = this.pendingChanges.get(documentId);

    if (!crdt || !pending || pending.length === 0) {
      return true;
    }

    this.emit({ type: 'sync:start', data: { documentId } });

    try {
      // Apply all pending changes
      for (const batch of pending) {
        crdt.applyBatch(batch);
      }

      // Clear pending changes
      this.pendingChanges.set(documentId, []);

      this.updateStatus(documentId, {
        state: 'synced',
        pendingChanges: 0,
        lastSyncedAt: new Date(),
      });

      this.emit({ type: 'sync:complete', data: { documentId } });
      return true;
    } catch (error) {
      this.updateStatus(documentId, { state: 'conflict' });
      this.emit({ type: 'sync:error', data: { documentId, error } });
      return false;
    }
  }

  async applyRemoteUpdate(documentId: string, update: Uint8Array): Promise<void> {
    const crdt = this.documents.get(documentId);
    if (!crdt) {
      throw new Error(`Document not found: ${documentId}`);
    }

    try {
      crdt.applyUpdate(update, 'remote');
    } catch (error) {
      await this.handleConflict(documentId, error as Error);
    }
  }

  async handleConflict(documentId: string, _error: Error): Promise<ConflictResolution> {
    const crdt = this.documents.get(documentId);
    const status = this.syncStatus.get(documentId);

    if (!crdt || !status) {
      throw new Error(`Document not found: ${documentId}`);
    }

    const strategy = this.config.conflictStrategy === 'last-write-wins' ? 'remote' :
                     (this.config.conflictStrategy || 'merge');
    const conflict: ConflictResolution = {
      documentId,
      localVersion: crdt.getVersion(),
      remoteVersion: crdt.getVersion(), // Would come from server
      strategy,
    };

    this.emit({ type: 'conflict:detected', data: conflict });

    if (this.config.onConflict) {
      const resolved = await this.config.onConflict(conflict);
      this.emit({ type: 'conflict:resolved', data: resolved });
      return resolved;
    }

    // Default resolution
    switch (this.config.conflictStrategy) {
      case 'last-write-wins':
        // Remote wins - already applied
        break;
      case 'merge':
        // CRDT handles merge automatically
        break;
      case 'manual':
        // Return conflict for manual resolution
        break;
    }

    this.updateStatus(documentId, {
      state: 'synced',
      conflictCount: (status.conflictCount || 0) + 1,
    });

    this.emit({ type: 'conflict:resolved', data: conflict });
    return conflict;
  }

  getStatus(documentId: string): SyncStatus | undefined {
    return this.syncStatus.get(documentId);
  }

  getAllStatuses(): Map<string, SyncStatus> {
    return new Map(this.syncStatus);
  }

  getPendingChanges(documentId: string): OperationBatch[] {
    return [...(this.pendingChanges.get(documentId) || [])];
  }

  isOnline(): boolean {
    return true; // Would check actual connectivity
  }

  setOffline(): void {
    for (const [documentId] of this.documents) {
      this.updateStatus(documentId, { state: 'offline' });
    }
  }

  setOnline(): void {
    for (const [documentId] of this.documents) {
      const pending = this.pendingChanges.get(documentId);
      this.updateStatus(documentId, {
        state: pending && pending.length > 0 ? 'syncing' : 'synced',
      });
      if (pending && pending.length > 0) {
        this.scheduleSync(documentId);
      }
    }
  }

  private updateStatus(documentId: string, updates: Partial<SyncStatus>): void {
    const current = this.syncStatus.get(documentId);
    if (current) {
      this.syncStatus.set(documentId, { ...current, ...updates });
    }
  }

  onSync(listener: SyncEventListener): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  private emit(event: { type: SyncEventType; data?: unknown }): void {
    for (const listener of this.eventListeners) {
      listener(event);
    }
  }

  destroy(): void {
    for (const timer of this.syncTimers.values()) {
      clearTimeout(timer);
    }
    this.syncTimers.clear();
    this.documents.clear();
    this.pendingChanges.clear();
    this.syncStatus.clear();
    this.eventListeners.clear();
  }
}

export function createSyncManager(config?: SyncManagerConfig): SyncManager {
  return new SyncManager(config);
}
