/**
 * TypeScript error parser
 *
 * Parses TypeScript compiler errors into structured format
 */

export interface TypeScriptError {
  code: string;
  file: string;
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning';
  rawOutput: string;
}

/**
 * Parse TypeScript error output
 * Format: "src/file.tsx(12,5): error TS2304: Cannot find name 'foo'."
 */
export function parseTypeScriptOutput(output: string): TypeScriptError[] {
  const errors: TypeScriptError[] = [];
  const lines = output.split('\n');

  // Match: file.tsx(line,col): error TSxxxx: message
  const errorRegex = /^(.+?)\((\d+),(\d+)\):\s*(error|warning)\s+(TS\d+):\s*(.+)$/;

  for (const line of lines) {
    const match = line.match(errorRegex);
    if (!match) continue;

    const [rawOutput, file, lineStr, colStr, severity, code, message] = match;

    errors.push({
      code,
      file,
      line: parseInt(lineStr, 10),
      column: parseInt(colStr, 10),
      message: message.trim(),
      severity: severity as 'error' | 'warning',
      rawOutput,
    });
  }

  return errors;
}

/**
 * Parse single TypeScript error message
 */
export function parseSingleError(errorMessage: string): Partial<TypeScriptError> | null {
  const patterns = [
    // Cannot find name
    /Cannot find name ['"](.+?)['"]/,
    // Cannot find module
    /Cannot find module ['"](.+?)['"]/,
    // Property does not exist
    /Property ['"](.+?)['"] does not exist on type/,
    // Type is not assignable
    /Type ['"](.+?)['"] is not assignable to type/,
    // Expected X arguments
    /Expected (\d+) arguments?, but got (\d+)/,
    // Object is possibly undefined
    /Object is possibly ['"]undefined['"]/,
    // Missing in type
    /Property ['"](.+?)['"] is missing in type/,
  ];

  for (const pattern of patterns) {
    const match = errorMessage.match(pattern);
    if (match) {
      return { message: errorMessage };
    }
  }

  return null;
}

/**
 * Get error category from TypeScript error code
 */
export function getErrorCategory(code: string): string {
  const categories: Record<string, string[]> = {
    'import': ['TS2304', 'TS2305', 'TS2306', 'TS2307', 'TS2613'],
    'type': ['TS2322', 'TS2339', 'TS2345', 'TS2365', 'TS2741', 'TS2769'],
    'syntax': ['TS1005', 'TS1003', 'TS1128', 'TS1109'],
    'async': ['TS1308', 'TS2339', 'TS7030'],
    'null-check': ['TS2531', 'TS2532', 'TS2533', 'TS18047', 'TS18048'],
    'generic': ['TS2314', 'TS2344', 'TS2707'],
    'return': ['TS2366', 'TS7030', 'TS2355'],
  };

  for (const [category, codes] of Object.entries(categories)) {
    if (codes.includes(code)) {
      return category;
    }
  }

  return 'unknown';
}

/**
 * Get error severity level (1-5, 5 being most severe)
 */
export function getErrorSeverityLevel(code: string): number {
  const severityMap: Record<string, number> = {
    // Critical - app won't run
    'TS1003': 5, 'TS1005': 5, 'TS1109': 5, 'TS1128': 5,
    // Severe - runtime error likely
    'TS2304': 4, 'TS2307': 4, 'TS2339': 4, 'TS2322': 4,
    // Moderate - potential runtime issues
    'TS2345': 3, 'TS2532': 3, 'TS2741': 3,
    // Minor - code quality
    'TS6133': 2, 'TS6196': 2,
    // Info
    'TS7016': 1,
  };

  return severityMap[code] || 3;
}
