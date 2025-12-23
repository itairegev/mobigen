/**
 * Type declaration for glob module
 */
declare module 'glob' {
  export interface GlobOptions {
    cwd?: string;
    absolute?: boolean;
    nodir?: boolean;
    ignore?: string[];
    [key: string]: unknown;
  }

  export function glob(pattern: string, options?: GlobOptions): Promise<string[]>;
}
