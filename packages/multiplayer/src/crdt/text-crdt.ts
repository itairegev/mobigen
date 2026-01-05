/**
 * Text CRDT Implementation
 * Uses Yjs for conflict-free collaborative text editing
 */

import * as Y from 'yjs';
import type { Operation, OperationBatch, DocumentChange } from '../types.js';

export interface TextCRDTConfig {
  documentId: string;
  userId: string;
  initialContent?: string;
}

export class TextCRDT {
  private doc: Y.Doc;
  private text: Y.Text;
  private documentId: string;
  private userId: string;
  private changeListeners: Set<(change: DocumentChange) => void>;
  private version: number = 0;

  constructor(config: TextCRDTConfig) {
    this.documentId = config.documentId;
    this.userId = config.userId;
    this.doc = new Y.Doc();
    this.text = this.doc.getText('content');
    this.changeListeners = new Set();

    if (config.initialContent) {
      this.doc.transact(() => {
        this.text.insert(0, config.initialContent!);
      }, this.userId);
    }

    // Listen for changes
    this.text.observe((event: Y.YTextEvent) => {
      if (event.transaction.origin !== this.userId) {
        this.notifyChangeListeners(event);
      }
    });
  }

  getContent(): string {
    return this.text.toString();
  }

  getLength(): number {
    return this.text.length;
  }

  insert(position: number, content: string): void {
    this.doc.transact(() => {
      this.text.insert(position, content);
    }, this.userId);
    this.version++;
  }

  delete(position: number, length: number): void {
    this.doc.transact(() => {
      this.text.delete(position, length);
    }, this.userId);
    this.version++;
  }

  applyOperation(operation: Operation): void {
    this.doc.transact(() => {
      switch (operation.type) {
        case 'insert':
          if (operation.content) {
            this.text.insert(operation.position, operation.content);
          }
          break;
        case 'delete':
          if (operation.length) {
            this.text.delete(operation.position, operation.length);
          }
          break;
        case 'retain':
          // No action needed for retain
          break;
      }
    }, this.userId);
    this.version++;
  }

  applyBatch(batch: OperationBatch): void {
    this.doc.transact(() => {
      let currentPosition = 0;
      for (const op of batch.operations) {
        switch (op.type) {
          case 'insert':
            if (op.content) {
              this.text.insert(currentPosition + op.position, op.content);
              currentPosition += op.content.length;
            }
            break;
          case 'delete':
            if (op.length) {
              this.text.delete(currentPosition + op.position, op.length);
            }
            break;
          case 'retain':
            currentPosition += op.length || 0;
            break;
        }
      }
    }, batch.userId);
    this.version = Math.max(this.version, batch.version);
  }

  getStateVector(): Uint8Array {
    return Y.encodeStateVector(this.doc);
  }

  getStateUpdate(stateVector?: Uint8Array): Uint8Array {
    if (stateVector) {
      return Y.encodeStateAsUpdate(this.doc, stateVector);
    }
    return Y.encodeStateAsUpdate(this.doc);
  }

  applyUpdate(update: Uint8Array, origin?: string): void {
    Y.applyUpdate(this.doc, update, origin || 'remote');
    this.version++;
  }

  mergeWith(other: TextCRDT): void {
    const update = other.getStateUpdate();
    this.applyUpdate(update);
  }

  getVersion(): number {
    return this.version;
  }

  getDoc(): Y.Doc {
    return this.doc;
  }

  onChange(listener: (change: DocumentChange) => void): () => void {
    this.changeListeners.add(listener);
    return () => this.changeListeners.delete(listener);
  }

  private notifyChangeListeners(event: Y.YTextEvent): void {
    const operations = this.eventToOperations(event);
    const change: DocumentChange = {
      id: `${this.documentId}-${Date.now()}`,
      documentId: this.documentId,
      userId: String(event.transaction.origin) || 'unknown',
      timestamp: Date.now(),
      operation: operations[0], // Simplified - take first operation
    };

    for (const listener of this.changeListeners) {
      listener(change);
    }
  }

  private eventToOperations(event: Y.YTextEvent): Operation[] {
    const operations: Operation[] = [];
    let position = 0;

    for (const delta of event.delta) {
      if (delta.retain !== undefined) {
        position += delta.retain;
        operations.push({ type: 'retain', position, length: delta.retain });
      }
      if (delta.insert !== undefined) {
        const content = typeof delta.insert === 'string' ? delta.insert : '';
        operations.push({ type: 'insert', position, content });
        position += content.length;
      }
      if (delta.delete !== undefined) {
        operations.push({ type: 'delete', position, length: delta.delete });
      }
    }

    return operations;
  }

  destroy(): void {
    this.doc.destroy();
    this.changeListeners.clear();
  }
}

export function createTextCRDT(config: TextCRDTConfig): TextCRDT {
  return new TextCRDT(config);
}
