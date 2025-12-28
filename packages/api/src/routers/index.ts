import { router } from '../trpc';
import { projectsRouter } from './projects';
import { buildsRouter } from './builds';
import { usersRouter } from './users';
import { githubRouter } from './github';
import { backendRouter } from './backend';

export const appRouter = router({
  projects: projectsRouter,
  builds: buildsRouter,
  users: usersRouter,
  github: githubRouter,
  backend: backendRouter,
});

export type AppRouter = typeof appRouter;
