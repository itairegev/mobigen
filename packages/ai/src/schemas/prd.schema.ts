import { z } from 'zod';

/**
 * Schema for Feature
 */
export const FeatureSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  priority: z.enum(['must-have', 'should-have', 'nice-to-have']),
  complexity: z.enum(['low', 'medium', 'high']),
});

export type Feature = z.infer<typeof FeatureSchema>;

/**
 * Schema for UserStory
 */
export const UserStorySchema = z.object({
  id: z.string(),
  persona: z.string(),
  action: z.string(),
  benefit: z.string(),
  acceptanceCriteria: z.array(z.string()),
});

export type UserStory = z.infer<typeof UserStorySchema>;

/**
 * Schema for PRDOutput
 */
export const PRDOutputSchema = z.object({
  appName: z.string(),
  description: z.string(),
  targetUsers: z.array(z.string()),
  coreFeatures: z.array(FeatureSchema),
  userStories: z.array(UserStorySchema),
  acceptanceCriteria: z.array(z.string()),
  constraints: z.array(z.string()),
  successMetrics: z.array(z.string()),
});

export type PRDOutput = z.infer<typeof PRDOutputSchema>;
