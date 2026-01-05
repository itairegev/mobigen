/**
 * Collaboration Room - Main interface for multiplayer editing
 */

import type {
  User,
  Room,
  RoomConfig,
  Document,
  CursorPosition,
  Selection,
  CollaborationEvent,
  TransportMessage,
} from './types.js';
import { TextCRDT, createTextCRDT } from './crdt/index.js';
import { SyncManager, createSyncManager } from './sync/index.js';
import { PresenceManager, createPresenceManager } from './presence/index.js';
import { WebSocketTransport, createWebSocketTransport } from './transport/index.js';

export interface CollaborationRoomConfig {
  roomId: string;
  projectId: string;
  user: User;
  serverUrl: string;
  roomConfig?: RoomConfig;
}

type RoomEventListener = (event: CollaborationEvent) => void;

export class CollaborationRoom {
  private config: CollaborationRoomConfig;
  private transport: WebSocketTransport;
  private syncManager: SyncManager;
  private presenceManager: PresenceManager;
  private documents: Map<string, TextCRDT>;
  private eventListeners: Set<RoomEventListener>;
  private isConnected = false;

  constructor(config: CollaborationRoomConfig) {
    this.config = config;
    this.documents = new Map();
    this.eventListeners = new Set();

    // Initialize transport
    this.transport = createWebSocketTransport({
      url: `${config.serverUrl}/rooms/${config.roomId}`,
      reconnectInterval: 1000,
      maxReconnectAttempts: 10,
    });

    // Initialize sync manager
    this.syncManager = createSyncManager({
      syncInterval: 100,
      conflictStrategy: config.roomConfig?.conflictStrategy || 'merge',
    });

    // Initialize presence manager
    this.presenceManager = createPresenceManager({
      userId: config.user.id,
      user: config.user,
      idleTimeout: config.roomConfig?.idleTimeout || 60000,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Transport events
    this.transport.onTransport((event) => {
      switch (event.type) {
        case 'connect':
          this.handleConnect();
          break;
        case 'disconnect':
          this.handleDisconnect();
          break;
        case 'message':
          this.handleMessage(event.data as TransportMessage);
          break;
        case 'error':
          this.emit('sync:error', event.data);
          break;
      }
    });

    // Sync events
    this.syncManager.onSync((event) => {
      this.emit(event.type as CollaborationEvent['type'], event.data);
    });

    // Presence events
    this.presenceManager.onPresence((event) => {
      this.emit(event.type as CollaborationEvent['type'], {
        userId: event.userId,
        ...event.data as object,
      });

      // Broadcast presence changes
      if (event.userId === this.config.user.id) {
        this.transport.send({
          type: 'presence',
          roomId: this.config.roomId,
          payload: this.presenceManager.getAwarenessState(),
          timestamp: Date.now(),
        });
      }
    });
  }

  async connect(): Promise<void> {
    await this.transport.connect();
  }

  disconnect(): void {
    this.transport.disconnect();
    this.isConnected = false;
  }

  private handleConnect(): void {
    this.isConnected = true;

    // Send join message
    this.transport.send({
      type: 'join',
      roomId: this.config.roomId,
      payload: {
        user: this.config.user,
        presence: this.presenceManager.getAwarenessState(),
      },
      timestamp: Date.now(),
    });

    this.emit('user:join', { user: this.config.user });
  }

  private handleDisconnect(): void {
    this.isConnected = false;
    this.syncManager.setOffline();
  }

  private handleMessage(message: TransportMessage): void {
    switch (message.type) {
      case 'document:update': {
        const { documentId, update } = message.payload as { documentId: string; update: number[] };
        void this.syncManager.applyRemoteUpdate(documentId, new Uint8Array(update));
        break;
      }

      case 'presence': {
        const { userId, state } = message.payload as { userId: string; state: unknown };
        if (userId !== this.config.user.id) {
          this.presenceManager.applyAwarenessUpdate(
            userId,
            state as Parameters<PresenceManager['applyAwarenessUpdate']>[1]
          );
        }
        break;
      }

      case 'user:join': {
        const { user, presence } = message.payload as { user: User; presence: unknown };
        this.presenceManager.handleRemotePresence(user.id, {
          user,
          ...(presence as object),
        });
        this.emit('user:join', { user });
        break;
      }

      case 'user:leave': {
        const { userId } = message.payload as { userId: string };
        this.presenceManager.handleRemoteLeave(userId);
        this.emit('user:leave', { userId });
        break;
      }

      case 'pong':
        // Heartbeat response
        break;
    }
  }

  // Document operations
  openDocument(documentId: string, content: string): TextCRDT {
    let crdt = this.documents.get(documentId);

    if (!crdt) {
      crdt = createTextCRDT({
        documentId,
        userId: this.config.user.id,
        initialContent: content,
      });

      this.documents.set(documentId, crdt);
      this.syncManager.registerDocument(documentId, crdt);

      // Listen for changes
      crdt.onChange((change) => {
        this.emit('document:change', { documentId, change });

        // Send update to server
        this.transport.send({
          type: 'document:update',
          roomId: this.config.roomId,
          payload: {
            documentId,
            update: Array.from(crdt!.getStateUpdate()),
          },
          timestamp: Date.now(),
        });
      });
    }

    return crdt;
  }

  closeDocument(documentId: string): void {
    const crdt = this.documents.get(documentId);
    if (crdt) {
      this.syncManager.unregisterDocument(documentId);
      crdt.destroy();
      this.documents.delete(documentId);
    }
  }

  getDocument(documentId: string): TextCRDT | undefined {
    return this.documents.get(documentId);
  }

  // Cursor operations
  updateCursor(position: CursorPosition): void {
    this.presenceManager.updateCursor(position);
  }

  updateSelection(selection: Selection): void {
    this.presenceManager.updateSelection(selection);
  }

  // Presence operations
  getUsers(): User[] {
    return this.presenceManager.getAllPresences().map(p => p.user);
  }

  getUserPresence(userId: string) {
    return this.presenceManager.getPresence(userId);
  }

  // Event handling
  onEvent(listener: RoomEventListener): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  private emit(type: CollaborationEvent['type'], data?: unknown): void {
    const event: CollaborationEvent = {
      type,
      roomId: this.config.roomId,
      userId: this.config.user.id,
      timestamp: Date.now(),
      data,
    };

    for (const listener of this.eventListeners) {
      listener(event);
    }
  }

  // State getters
  isOnline(): boolean {
    return this.isConnected;
  }

  getRoomId(): string {
    return this.config.roomId;
  }

  getLocalUser(): User {
    return this.config.user;
  }

  destroy(): void {
    this.disconnect();

    for (const [documentId] of this.documents) {
      this.closeDocument(documentId);
    }

    this.syncManager.destroy();
    this.presenceManager.destroy();
    this.transport.destroy();
    this.eventListeners.clear();
  }
}

export function createCollaborationRoom(config: CollaborationRoomConfig): CollaborationRoom {
  return new CollaborationRoom(config);
}
