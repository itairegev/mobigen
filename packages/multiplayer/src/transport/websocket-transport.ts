/**
 * WebSocket Transport Layer
 */

import type {
  ConnectionState,
  TransportConfig,
  TransportMessage,
} from '../types.js';

export interface WebSocketTransportConfig extends TransportConfig {
  protocols?: string[];
  headers?: Record<string, string>;
}

type TransportEventType = 'connect' | 'disconnect' | 'message' | 'error' | 'reconnect';
type TransportEventListener = (event: { type: TransportEventType; data?: unknown }) => void;

export class WebSocketTransport {
  private config: WebSocketTransportConfig;
  private ws: WebSocket | null = null;
  private state: ConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimer?: NodeJS.Timeout;
  private heartbeatTimer?: NodeJS.Timeout;
  private eventListeners: Set<TransportEventListener>;
  private messageQueue: TransportMessage[] = [];

  constructor(config: WebSocketTransportConfig) {
    this.config = {
      reconnectInterval: config.reconnectInterval || 1000,
      maxReconnectAttempts: config.maxReconnectAttempts || 10,
      heartbeatInterval: config.heartbeatInterval || 30000,
      timeout: config.timeout || 10000,
      ...config,
    };
    this.eventListeners = new Set();
  }

  async connect(): Promise<void> {
    if (this.state === 'connected' || this.state === 'connecting') {
      return;
    }

    this.state = 'connecting';

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.url, this.config.protocols);

        const timeout = setTimeout(() => {
          if (this.state === 'connecting') {
            this.ws?.close();
            reject(new Error('Connection timeout'));
          }
        }, this.config.timeout);

        this.ws.onopen = () => {
          clearTimeout(timeout);
          this.state = 'connected';
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.flushMessageQueue();
          this.emit({ type: 'connect' });
          resolve();
        };

        this.ws.onclose = (event) => {
          this.state = 'disconnected';
          this.stopHeartbeat();
          this.emit({ type: 'disconnect', data: { code: event.code, reason: event.reason } });

          if (!event.wasClean && this.reconnectAttempts < (this.config.maxReconnectAttempts || 10)) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          this.emit({ type: 'error', data: error });
          if (this.state === 'connecting') {
            reject(error);
          }
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data as string) as TransportMessage;
            this.emit({ type: 'message', data: message });
          } catch (error) {
            this.emit({ type: 'error', data: { error, rawData: event.data } });
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    this.state = 'disconnected';
    this.stopHeartbeat();
    this.clearReconnect();

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }

  send(message: TransportMessage): void {
    if (this.state !== 'connected' || !this.ws) {
      // Queue message for later
      this.messageQueue.push(message);
      return;
    }

    try {
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      this.messageQueue.push(message);
      this.emit({ type: 'error', data: error });
    }
  }

  sendBinary(data: ArrayBuffer | Uint8Array): void {
    if (this.state !== 'connected' || !this.ws) {
      this.emit({ type: 'error', data: new Error('Not connected') });
      return;
    }

    try {
      this.ws.send(data);
    } catch (error) {
      this.emit({ type: 'error', data: error });
    }
  }

  getState(): ConnectionState {
    return this.state;
  }

  isConnected(): boolean {
    return this.state === 'connected';
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;

    this.state = 'reconnecting';
    this.reconnectAttempts++;

    const delay = Math.min(
      (this.config.reconnectInterval || 1000) * Math.pow(2, this.reconnectAttempts - 1),
      30000 // Max 30 seconds
    );

    this.emit({ type: 'reconnect', data: { attempt: this.reconnectAttempts, delay } });

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      void this.connect().catch(() => {
        // Will trigger another reconnect via onclose
      });
    }, delay);
  }

  private clearReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
    this.reconnectAttempts = 0;
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.state === 'connected') {
        this.send({
          type: 'ping',
          roomId: '',
          payload: { timestamp: Date.now() },
          timestamp: Date.now(),
        });
      }
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.state === 'connected') {
      const message = this.messageQueue.shift();
      if (message) {
        this.send(message);
      }
    }
  }

  onTransport(listener: TransportEventListener): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  private emit(event: { type: TransportEventType; data?: unknown }): void {
    for (const listener of this.eventListeners) {
      listener(event);
    }
  }

  destroy(): void {
    this.disconnect();
    this.eventListeners.clear();
    this.messageQueue = [];
  }
}

export function createWebSocketTransport(config: WebSocketTransportConfig): WebSocketTransport {
  return new WebSocketTransport(config);
}
