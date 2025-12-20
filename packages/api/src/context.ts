import { prisma } from '@mobigen/db';

export interface Context {
  prisma: typeof prisma;
  userId?: string;
}

export function createContext(opts: { userId?: string }): Context {
  return {
    prisma,
    userId: opts.userId,
  };
}

export type { Context as TRPCContext };
