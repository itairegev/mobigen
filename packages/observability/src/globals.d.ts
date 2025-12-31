/**
 * Node.js global type declarations
 * These are minimal declarations to avoid requiring @types/node
 */

declare function setTimeout(callback: () => void, ms: number): NodeJS.Timeout;
declare function clearTimeout(timeoutId: NodeJS.Timeout): void;

declare namespace NodeJS {
  interface Timeout {}
}

declare const process: {
  env: Record<string, string | undefined>;
  memoryUsage(): {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
};

declare const console: {
  log(...args: unknown[]): void;
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
  debug(...args: unknown[]): void;
};
