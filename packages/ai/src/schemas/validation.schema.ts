import { z } from 'zod';

/**
 * Schema for ValidationError
 */
export const ValidationErrorSchema = z.object({
  file: z.string(),
  line: z.number().optional(),
  column: z.number().optional(),
  message: z.string(),
  severity: z.enum(['error', 'warning', 'info']),
  rule: z.string().optional(),
  fixable: z.boolean().optional(),
  fixSuggestion: z.string().optional(),
});

export type ValidationError = z.infer<typeof ValidationErrorSchema>;

/**
 * Schema for ValidationStage
 */
export const ValidationStageSchema = z.object({
  name: z.string(),
  passed: z.boolean(),
  duration: z.number().optional(),
  errors: z.array(ValidationErrorSchema),
  warnings: z.array(ValidationErrorSchema).optional(),
});

export type ValidationStage = z.infer<typeof ValidationStageSchema>;

/**
 * Schema for ValidationResult
 */
export const ValidationResultSchema = z.object({
  passed: z.boolean(),
  tier: z.enum(['tier1', 'tier2', 'tier3']),
  stages: z.record(ValidationStageSchema),
  summary: z.string(),
  totalErrors: z.number().optional(),
  totalWarnings: z.number().optional(),
});

export type ValidationResult = z.infer<typeof ValidationResultSchema>;

/**
 * Schema for QAFinding
 */
export const QAFindingSchema = z.object({
  id: z.string(),
  category: z.string(),
  severity: z.enum(['critical', 'major', 'minor', 'suggestion']),
  title: z.string(),
  description: z.string(),
  location: z.string().optional(),
  recommendation: z.string(),
});

export type QAFinding = z.infer<typeof QAFindingSchema>;

/**
 * Schema for QACategory
 */
export const QACategorySchema = z.object({
  name: z.string(),
  score: z.number().min(0).max(100),
  weight: z.number(),
  findings: z.array(QAFindingSchema),
});

export type QACategory = z.infer<typeof QACategorySchema>;

/**
 * Schema for QAReport
 */
export const QAReportSchema = z.object({
  overallScore: z.number().min(0).max(100),
  categories: z.array(QACategorySchema),
  recommendations: z.array(z.string()),
  readyForProduction: z.boolean(),
  blockers: z.array(z.string()),
});

export type QAReport = z.infer<typeof QAReportSchema>;
