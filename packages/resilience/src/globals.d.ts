/**
 * Node.js global type declarations
 * These are minimal declarations to avoid requiring @types/node
 */

declare function setTimeout(callback: () => void, ms: number): NodeJS.Timeout;
declare function clearTimeout(timeoutId: NodeJS.Timeout): void;
declare function setImmediate(callback: () => void): NodeJS.Immediate;

declare namespace NodeJS {
  interface Timeout {}
  interface Immediate {}
}

declare interface AbortSignal {
  readonly aborted: boolean;
  addEventListener(type: 'abort', listener: () => void): void;
  removeEventListener(type: 'abort', listener: () => void): void;
}
