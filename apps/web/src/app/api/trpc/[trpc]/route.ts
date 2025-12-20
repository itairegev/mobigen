import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@mobigen/api';
import { createContext } from '@mobigen/api';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = async (req: Request) => {
  const session = await getServerSession(authOptions);

  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createContext({ userId: session?.user?.id }),
  });
};

export { handler as GET, handler as POST };
