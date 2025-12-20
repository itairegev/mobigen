import { router } from '../trpc.js';
import { projectsRouter } from './projects.js';
import { buildsRouter } from './builds.js';
import { usersRouter } from './users.js';

export const appRouter = router({
  projects: projectsRouter,
  builds: buildsRouter,
  users: usersRouter,
});

export type AppRouter = typeof appRouter;
