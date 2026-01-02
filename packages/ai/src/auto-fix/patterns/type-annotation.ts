/**
 * Pattern 4: Missing type annotation fix
 *
 * Detects: Implicit 'any' type warnings
 * Fixes: Infers type from usage and adds annotation
 */

import * as fs from 'fs/promises';
import * as path from 'path';

export interface TypeAnnotationError {
  file: string;
  line: number;
  column?: number;
  variableName: string;
  message: string;
}

export interface TypeAnnotationFix {
  type: 'add-type-annotation';
  file: string;
  line: number;
  variableName: string;
  inferredType: string;
  confidence: number;
}

// Common type patterns based on naming conventions
const TYPE_INFERENCE_PATTERNS: Array<{
  pattern: RegExp;
  type: string;
  confidence: number;
}> = [
  // Event handlers
  { pattern: /^on[A-Z]/, type: '() => void', confidence: 0.85 },
  { pattern: /^handle[A-Z]/, type: '() => void', confidence: 0.85 },

  // Booleans
  { pattern: /^is[A-Z]/, type: 'boolean', confidence: 0.95 },
  { pattern: /^has[A-Z]/, type: 'boolean', confidence: 0.95 },
  { pattern: /^can[A-Z]/, type: 'boolean', confidence: 0.90 },
  { pattern: /^should[A-Z]/, type: 'boolean', confidence: 0.90 },
  { pattern: /loading$/, type: 'boolean', confidence: 0.90 },
  { pattern: /visible$/, type: 'boolean', confidence: 0.90 },

  // Strings
  { pattern: /name$/i, type: 'string', confidence: 0.85 },
  { pattern: /title$/i, type: 'string', confidence: 0.85 },
  { pattern: /label$/i, type: 'string', confidence: 0.85 },
  { pattern: /text$/i, type: 'string', confidence: 0.80 },
  { pattern: /message$/i, type: 'string', confidence: 0.85 },
  { pattern: /id$/i, type: 'string', confidence: 0.80 },
  { pattern: /url$/i, type: 'string', confidence: 0.90 },
  { pattern: /path$/i, type: 'string', confidence: 0.85 },

  // Numbers
  { pattern: /count$/i, type: 'number', confidence: 0.90 },
  { pattern: /index$/i, type: 'number', confidence: 0.90 },
  { pattern: /total$/i, type: 'number', confidence: 0.85 },
  { pattern: /price$/i, type: 'number', confidence: 0.85 },
  { pattern: /amount$/i, type: 'number', confidence: 0.85 },
  { pattern: /size$/i, type: 'number', confidence: 0.80 },
  { pattern: /width$/i, type: 'number', confidence: 0.85 },
  { pattern: /height$/i, type: 'number', confidence: 0.85 },

  // Arrays
  { pattern: /items$/i, type: 'any[]', confidence: 0.80 },
  { pattern: /list$/i, type: 'any[]', confidence: 0.80 },
  { pattern: /s$/, type: 'any[]', confidence: 0.60 }, // Plural

  // Dates
  { pattern: /date$/i, type: 'Date', confidence: 0.85 },
  { pattern: /time$/i, type: 'Date', confidence: 0.75 },
  { pattern: /at$/i, type: 'Date', confidence: 0.70 },

  // React-specific
  { pattern: /ref$/i, type: 'React.RefObject<any>', confidence: 0.85 },
  { pattern: /style$/i, type: 'ViewStyle', confidence: 0.80 },
  { pattern: /children$/i, type: 'React.ReactNode', confidence: 0.90 },
];

/**
 * Parse type annotation error
 */
export function parseTypeAnnotationError(
  message: string,
  file: string,
  line?: number
): TypeAnnotationError | null {
  // TypeScript: "Parameter 'x' implicitly has an 'any' type"
  let match = message.match(/Parameter ['"](.+?)['"] implicitly has an? ['"]any['"] type/);
  if (match) {
    return { file, line: line || 0, variableName: match[1], message };
  }

  // TypeScript: "Variable 'x' implicitly has type 'any'"
  match = message.match(/Variable ['"](.+?)['"] implicitly has type/);
  if (match) {
    return { file, line: line || 0, variableName: match[1], message };
  }

  // ESLint @typescript-eslint/no-explicit-any
  match = message.match(/Unexpected any. Specify a different type/);
  if (match) {
    return { file, line: line || 0, variableName: '', message };
  }

  return null;
}

/**
 * Infer type from variable name
 */
export function inferTypeFromName(variableName: string): { type: string; confidence: number } | null {
  for (const { pattern, type, confidence } of TYPE_INFERENCE_PATTERNS) {
    if (pattern.test(variableName)) {
      return { type, confidence };
    }
  }

  return null;
}

/**
 * Infer type from usage in the code
 */
export async function inferTypeFromUsage(
  variableName: string,
  file: string,
  projectRoot: string
): Promise<{ type: string; confidence: number } | null> {
  try {
    const filePath = path.join(projectRoot, file);
    const content = await fs.readFile(filePath, 'utf-8');

    // Check for common usage patterns
    // String methods
    if (new RegExp(`${variableName}\\.(toLowerCase|toUpperCase|split|trim|slice|substring)`).test(content)) {
      return { type: 'string', confidence: 0.90 };
    }

    // Number methods
    if (new RegExp(`${variableName}\\.(toFixed|toPrecision)`).test(content)) {
      return { type: 'number', confidence: 0.90 };
    }

    // Array methods
    if (new RegExp(`${variableName}\\.(map|filter|reduce|forEach|find|some|every|length)`).test(content)) {
      return { type: 'any[]', confidence: 0.85 };
    }

    // Boolean context
    if (new RegExp(`(if|while)\\s*\\(\\s*!?${variableName}\\s*\\)`).test(content) ||
        new RegExp(`${variableName}\\s*\\?`).test(content)) {
      return { type: 'boolean', confidence: 0.75 };
    }

    // setState pattern (React)
    if (new RegExp(`set${variableName.charAt(0).toUpperCase() + variableName.slice(1)}\\(`).test(content)) {
      // It's a state variable - check the initial value
      const stateMatch = content.match(new RegExp(`useState\\((.+?)\\)`));
      if (stateMatch) {
        const initialValue = stateMatch[1].trim();
        if (initialValue === 'false' || initialValue === 'true') return { type: 'boolean', confidence: 0.95 };
        if (initialValue === '""' || initialValue === "''") return { type: 'string', confidence: 0.95 };
        if (initialValue === '0' || /^\d+$/.test(initialValue)) return { type: 'number', confidence: 0.95 };
        if (initialValue === '[]') return { type: 'any[]', confidence: 0.90 };
        if (initialValue === '{}') return { type: 'Record<string, any>', confidence: 0.85 };
        if (initialValue === 'null') return { type: 'any | null', confidence: 0.70 };
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Generate type annotation fix
 */
export async function generateTypeAnnotationFix(
  error: TypeAnnotationError,
  projectRoot: string
): Promise<TypeAnnotationFix | null> {
  // First try to infer from name
  const nameInference = inferTypeFromName(error.variableName);

  // Then try to infer from usage
  const usageInference = await inferTypeFromUsage(error.variableName, error.file, projectRoot);

  // Use the higher confidence inference
  const inference = (usageInference && (!nameInference || usageInference.confidence > nameInference.confidence))
    ? usageInference
    : nameInference;

  if (!inference || inference.confidence < 0.70) {
    return null; // Not confident enough
  }

  return {
    type: 'add-type-annotation',
    file: error.file,
    line: error.line,
    variableName: error.variableName,
    inferredType: inference.type,
    confidence: inference.confidence,
  };
}

/**
 * Apply type annotation fix
 */
export async function applyTypeAnnotationFix(
  fix: TypeAnnotationFix,
  projectRoot: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const filePath = path.join(projectRoot, fix.file);
    let content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    if (fix.line <= 0 || fix.line > lines.length) {
      return { success: false, error: 'Invalid line number' };
    }

    const line = lines[fix.line - 1];

    // Try to add type annotation to parameter or variable
    // Pattern: const x = ...
    let newLine = line.replace(
      new RegExp(`(const|let|var)\\s+${fix.variableName}\\s*=`),
      `$1 ${fix.variableName}: ${fix.inferredType} =`
    );

    // Pattern: function param (x)
    if (newLine === line) {
      newLine = line.replace(
        new RegExp(`\\(([^)]*?)\\b${fix.variableName}\\b([^)]*?)\\)`),
        `($1${fix.variableName}: ${fix.inferredType}$2)`
      );
    }

    // Pattern: arrow function param x =>
    if (newLine === line) {
      newLine = line.replace(
        new RegExp(`\\b${fix.variableName}\\b\\s*=>`),
        `(${fix.variableName}: ${fix.inferredType}) =>`
      );
    }

    if (newLine === line) {
      return { success: false, error: 'Could not find location to add annotation' };
    }

    lines[fix.line - 1] = newLine;
    content = lines.join('\n');

    await fs.writeFile(filePath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
