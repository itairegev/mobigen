/**
 * @mobigen/multiplayer - Real-time Multiplayer Editing
 *
 * Provides collaborative editing, cursor sync, and presence
 * for Mobigen projects using CRDT and WebSocket.
 */

// Main collaboration room
export { CollaborationRoom, createCollaborationRoom } from './collaboration-room.js';
export type { CollaborationRoomConfig } from './collaboration-room.js';

// Types
export type {
  User,
  UserPresence,
  CursorPosition,
  Selection,
  Document,
  DocumentChange,
  Operation,
  OperationType,
  OperationBatch,
  SyncState,
  SyncStatus,
  ConflictResolution,
  Room,
  RoomConfig,
  CollaborationEventType,
  CollaborationEvent,
  ConnectionState,
  TransportConfig,
  TransportMessage,
  AwarenessState,
} from './types.js';
export { UserSchema } from './types.js';

// CRDT
export { TextCRDT, createTextCRDT } from './crdt/index.js';
export type { TextCRDTConfig } from './crdt/index.js';

// Sync
export { SyncManager, createSyncManager } from './sync/index.js';
export type { SyncManagerConfig } from './sync/index.js';

// Presence
export { PresenceManager, createPresenceManager } from './presence/index.js';
export type { PresenceManagerConfig } from './presence/index.js';

// Transport
export { WebSocketTransport, createWebSocketTransport } from './transport/index.js';
export type { WebSocketTransportConfig } from './transport/index.js';

// Cursor Sync
export { CursorManager, createCursorManager } from './cursor/index.js';
export type {
  CursorState,
  CursorManagerConfig,
  CursorDecoration,
  SelectionDecoration,
} from './cursor/index.js';

export { CursorRenderer, createCursorRenderer } from './cursor/index.js';
export type {
  RenderOptions,
  CursorStyle,
  LabelStyle,
  SelectionStyle,
} from './cursor/index.js';
