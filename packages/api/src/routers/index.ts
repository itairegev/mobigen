import { router } from '../trpc';
import { projectsRouter } from './projects';
import { buildsRouter } from './builds';
import { usersRouter } from './users';
import { githubRouter } from './github';
import { backendRouter } from './backend';
import { analyticsRouter } from './analytics';
import { marketplaceRouter } from './marketplace';
import { otaUpdatesRouter } from './ota-updates';
import { submissionGuideRouter } from './submission-guide';

export const appRouter = router({
  projects: projectsRouter,
  builds: buildsRouter,
  users: usersRouter,
  github: githubRouter,
  backend: backendRouter,
  analytics: analyticsRouter,
  marketplace: marketplaceRouter,
  otaUpdates: otaUpdatesRouter,
  submissionGuide: submissionGuideRouter,
});

export type AppRouter = typeof appRouter;
