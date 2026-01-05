/**
 * Multiplayer Editing Types
 */

import { z } from 'zod';

// User and presence types
export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  avatar: z.string().url().optional(),
});

export type User = z.infer<typeof UserSchema>;

export interface UserPresence {
  user: User;
  cursor?: CursorPosition;
  selection?: Selection;
  lastActive: Date;
  status: 'active' | 'idle' | 'away';
  viewingFile?: string;
}

export interface CursorPosition {
  file: string;
  line: number;
  column: number;
  timestamp: number;
}

export interface Selection {
  file: string;
  anchor: { line: number; column: number };
  head: { line: number; column: number };
  timestamp: number;
}

// Document types
export interface Document {
  id: string;
  projectId: string;
  path: string;
  content: string;
  version: number;
  lastModified: Date;
  modifiedBy: string;
}

export interface DocumentChange {
  id: string;
  documentId: string;
  userId: string;
  timestamp: number;
  operation: Operation;
}

// Operation types for CRDT
export type OperationType = 'insert' | 'delete' | 'retain';

export interface Operation {
  type: OperationType;
  position: number;
  content?: string; // For insert
  length?: number;  // For delete/retain
}

export interface OperationBatch {
  documentId: string;
  userId: string;
  operations: Operation[];
  timestamp: number;
  version: number;
}

// Sync types
export type SyncState = 'synced' | 'syncing' | 'offline' | 'conflict';

export interface SyncStatus {
  state: SyncState;
  pendingChanges: number;
  lastSyncedAt: Date | null;
  conflictCount: number;
}

export interface ConflictResolution {
  documentId: string;
  localVersion: number;
  remoteVersion: number;
  strategy: 'local' | 'remote' | 'merge' | 'manual';
  resolvedContent?: string;
}

// Room types for collaboration
export interface Room {
  id: string;
  projectId: string;
  users: Map<string, UserPresence>;
  documents: Map<string, Document>;
  createdAt: Date;
  maxUsers?: number;
}

export interface RoomConfig {
  maxUsers?: number;
  idleTimeout?: number;
  syncInterval?: number;
  conflictStrategy?: 'last-write-wins' | 'merge' | 'manual';
}

// Event types
export type CollaborationEventType =
  | 'user:join'
  | 'user:leave'
  | 'user:presence'
  | 'document:change'
  | 'document:save'
  | 'cursor:move'
  | 'selection:change'
  | 'sync:start'
  | 'sync:complete'
  | 'sync:error'
  | 'conflict:detected'
  | 'conflict:resolved';

export interface CollaborationEvent {
  type: CollaborationEventType;
  roomId: string;
  userId: string;
  timestamp: number;
  data: unknown;
}

// Transport types
export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

export interface TransportConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  timeout?: number;
}

export interface TransportMessage {
  type: string;
  roomId: string;
  payload: unknown;
  timestamp: number;
}

// Awareness types (compatible with Yjs)
export interface AwarenessState {
  user: User;
  cursor?: CursorPosition;
  selection?: Selection;
}
