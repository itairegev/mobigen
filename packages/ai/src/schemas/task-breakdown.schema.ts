import { z } from 'zod';

/**
 * Schema for DevelopmentTask
 */
export const DevelopmentTaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  type: z.enum(['feature', 'bugfix', 'refactor', 'test', 'docs', 'chore']),
  priority: z.number().min(1).max(5),
  estimatedHours: z.number().optional(),
  files: z.array(z.string()),
  dependencies: z.array(z.string()),
  acceptanceCriteria: z.array(z.string()),
  tags: z.array(z.string()).optional(),
});

export type DevelopmentTask = z.infer<typeof DevelopmentTaskSchema>;

/**
 * Schema for TaskBreakdown
 */
export const TaskBreakdownSchema = z.object({
  tasks: z.array(DevelopmentTaskSchema),
  estimatedComplexity: z.enum(['low', 'medium', 'high']),
  criticalPath: z.array(z.string()),
  parallelizableTasks: z.array(z.array(z.string())),
});

export type TaskBreakdown = z.infer<typeof TaskBreakdownSchema>;
