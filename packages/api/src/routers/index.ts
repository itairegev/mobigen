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
import { contentRouter } from './content';
import { apiKeysRouter } from './api-keys';
import { teamRouter } from './team';

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
  content: contentRouter,
  apiKeys: apiKeysRouter,
  team: teamRouter,
});

export type AppRouter = typeof appRouter;
