/**
 * Mobigen AI Schemas - Runtime validation for AI agent outputs
 *
 * Uses Zod for type-safe runtime validation of structured outputs from Claude.
 */

import { z } from 'zod';

// Re-export all schemas
export * from './prd.schema';
export * from './architecture.schema';
export * from './ui-design.schema';
export * from './task-breakdown.schema';
export * from './validation.schema';

/**
 * Parse agent output with safe fallback
 * Extracts JSON from markdown code blocks or raw text
 */
export function parseAgentOutput<T>(
  schema: z.Schema<T>,
  output: string,
  fallback: T
): { success: boolean; data: T; errors?: z.ZodError } {
  // Try to extract JSON from markdown code blocks
  const jsonMatch = output.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const jsonStr = jsonMatch ? jsonMatch[1] : output;

  // Try to find a JSON object in the string
  const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (!objectMatch) {
    return { success: false, data: fallback };
  }

  try {
    const parsed = JSON.parse(objectMatch[0]);
    const result = schema.safeParse(parsed);

    if (result.success) {
      return { success: true, data: result.data };
    }

    // Return fallback with validation errors
    return { success: false, data: fallback, errors: result.error };
  } catch {
    return { success: false, data: fallback };
  }
}

/**
 * Parse agent output with strict validation (throws on error)
 */
export function parseAgentOutputStrict<T>(
  schema: z.Schema<T>,
  output: string
): T {
  const jsonMatch = output.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const jsonStr = jsonMatch ? jsonMatch[1] : output;

  const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (!objectMatch) {
    throw new Error('No JSON object found in agent output');
  }

  const parsed = JSON.parse(objectMatch[0]);
  return schema.parse(parsed);
}

/**
 * Type guard to check if output matches schema
 */
export function isValidAgentOutput<T>(
  schema: z.Schema<T>,
  output: string
): output is string {
  try {
    const result = parseAgentOutput(schema, output, undefined as unknown as T);
    return result.success;
  } catch {
    return false;
  }
}
