import { router } from '../trpc';
import { projectsRouter } from './projects';
import { buildsRouter } from './builds';
import { usersRouter } from './users';

export const appRouter = router({
  projects: projectsRouter,
  builds: buildsRouter,
  users: usersRouter,
});

export type AppRouter = typeof appRouter;
