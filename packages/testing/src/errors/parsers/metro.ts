/**
 * Metro bundler error parser
 *
 * Parses Metro/React Native bundler errors
 */

export interface MetroError {
  type: 'syntax' | 'module' | 'transform' | 'resolve' | 'unknown';
  file: string;
  line?: number;
  column?: number;
  message: string;
  stack?: string;
}

/**
 * Parse Metro bundler error output
 */
export function parseMetroOutput(output: string): MetroError[] {
  const errors: MetroError[] = [];

  // Split by error boundaries
  const errorBlocks = output.split(/(?=error:|Error:|SyntaxError:|Unable to resolve)/i);

  for (const block of errorBlocks) {
    const error = parseErrorBlock(block);
    if (error) {
      errors.push(error);
    }
  }

  return errors;
}

/**
 * Parse a single error block
 */
function parseErrorBlock(block: string): MetroError | null {
  const lines = block.split('\n').filter(l => l.trim());
  if (lines.length === 0) return null;

  // Check for common Metro error patterns

  // Module not found
  const moduleMatch = block.match(/Unable to resolve (?:module )?['"]([^'"]+)['"] from ['"]([^'"]+)['"]/);
  if (moduleMatch) {
    return {
      type: 'resolve',
      file: moduleMatch[2],
      message: `Cannot resolve module: ${moduleMatch[1]}`,
    };
  }

  // Syntax error
  const syntaxMatch = block.match(/SyntaxError[^:]*:\s*(.+?)(?:\s*\((\d+):(\d+)\))?$/m);
  if (syntaxMatch) {
    return {
      type: 'syntax',
      file: extractFileFromBlock(block) || 'unknown',
      line: syntaxMatch[2] ? parseInt(syntaxMatch[2], 10) : undefined,
      column: syntaxMatch[3] ? parseInt(syntaxMatch[3], 10) : undefined,
      message: syntaxMatch[1].trim(),
    };
  }

  // Transform error
  const transformMatch = block.match(/TransformError[^:]*:\s*(.+)/m);
  if (transformMatch) {
    return {
      type: 'transform',
      file: extractFileFromBlock(block) || 'unknown',
      message: transformMatch[1].trim(),
      stack: extractStackTrace(block),
    };
  }

  // Generic error with file location
  const genericMatch = block.match(/error:\s*(.+?)(?:\s+at\s+(.+?):(\d+):(\d+))?$/im);
  if (genericMatch) {
    return {
      type: 'unknown',
      file: genericMatch[2] || extractFileFromBlock(block) || 'unknown',
      line: genericMatch[3] ? parseInt(genericMatch[3], 10) : undefined,
      column: genericMatch[4] ? parseInt(genericMatch[4], 10) : undefined,
      message: genericMatch[1].trim(),
    };
  }

  return null;
}

/**
 * Extract file path from error block
 */
function extractFileFromBlock(block: string): string | null {
  // Look for file paths
  const patterns = [
    /(?:in|at|from)\s+['"]?([^'":\s]+\.(?:ts|tsx|js|jsx))/i,
    /([\/\\][\w\/\\.-]+\.(?:ts|tsx|js|jsx))/,
  ];

  for (const pattern of patterns) {
    const match = block.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * Extract stack trace from error block
 */
function extractStackTrace(block: string): string | undefined {
  const lines = block.split('\n');
  const stackLines = lines.filter(l => l.match(/^\s*at\s+/));
  return stackLines.length > 0 ? stackLines.join('\n') : undefined;
}

/**
 * Get user-friendly description of Metro error type
 */
export function getMetroErrorDescription(type: MetroError['type']): string {
  const descriptions: Record<MetroError['type'], string> = {
    'syntax': 'JavaScript/TypeScript syntax error',
    'module': 'Module not found or invalid',
    'transform': 'Code transformation error (Babel)',
    'resolve': 'Import/require could not be resolved',
    'unknown': 'Unknown bundler error',
  };

  return descriptions[type];
}

/**
 * Check if Metro error is critical (blocks build)
 */
export function isMetroErrorCritical(error: MetroError): boolean {
  // All Metro errors are critical - they prevent the app from running
  return true;
}
