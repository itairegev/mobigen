/**
 * Context enricher
 *
 * Adds code context and surrounding lines to errors
 */

import * as fs from 'fs/promises';
import * as path from 'path';

export interface ErrorContext {
  lines: Array<{
    number: number;
    content: string;
    isErrorLine: boolean;
  }>;
  column?: number;
  pointer?: string;
}

/**
 * Get code context around an error line
 */
export async function getCodeContext(
  file: string,
  line: number,
  projectRoot: string,
  contextLines: number = 2
): Promise<ErrorContext | null> {
  try {
    const filePath = path.isAbsolute(file) ? file : path.join(projectRoot, file);
    const content = await fs.readFile(filePath, 'utf-8');
    const allLines = content.split('\n');

    // Calculate range
    const startLine = Math.max(1, line - contextLines);
    const endLine = Math.min(allLines.length, line + contextLines);

    const context: ErrorContext = {
      lines: [],
    };

    for (let i = startLine; i <= endLine; i++) {
      context.lines.push({
        number: i,
        content: allLines[i - 1],
        isErrorLine: i === line,
      });
    }

    return context;
  } catch {
    return null;
  }
}

/**
 * Get code context with column pointer
 */
export async function getCodeContextWithPointer(
  file: string,
  line: number,
  column: number,
  projectRoot: string,
  contextLines: number = 2
): Promise<ErrorContext | null> {
  const context = await getCodeContext(file, line, projectRoot, contextLines);

  if (context && column > 0) {
    context.column = column;
    context.pointer = ' '.repeat(column - 1) + '^';
  }

  return context;
}

/**
 * Format code context for display
 */
export function formatCodeContext(context: ErrorContext): string {
  const lines: string[] = [];

  // Calculate padding for line numbers
  const maxLineNum = Math.max(...context.lines.map(l => l.number));
  const padding = String(maxLineNum).length;

  for (const line of context.lines) {
    const lineNum = String(line.number).padStart(padding, ' ');
    const prefix = line.isErrorLine ? '>' : ' ';
    lines.push(`${prefix} ${lineNum} | ${line.content}`);

    // Add pointer for error column
    if (line.isErrorLine && context.pointer) {
      lines.push(`  ${' '.repeat(padding)} | ${context.pointer}`);
    }
  }

  return lines.join('\n');
}

/**
 * Extract relevant code snippet for an error
 */
export async function extractRelevantSnippet(
  file: string,
  line: number,
  projectRoot: string,
  maxLines: number = 10
): Promise<string | null> {
  try {
    const filePath = path.isAbsolute(file) ? file : path.join(projectRoot, file);
    const content = await fs.readFile(filePath, 'utf-8');
    const allLines = content.split('\n');

    // Find the function/component containing this line
    let startLine = line - 1;
    let depth = 0;

    // Search backwards for function/component declaration
    for (let i = line - 1; i >= 0; i--) {
      const currentLine = allLines[i];

      // Count braces
      depth += (currentLine.match(/\{/g) || []).length;
      depth -= (currentLine.match(/\}/g) || []).length;

      // Found function/component start
      if (currentLine.match(/^(export\s+)?(const|function|class)\s+/)) {
        startLine = i;
        break;
      }

      // Don't go too far back
      if (i < line - 20) break;
    }

    // Get lines from start to error line + a few more
    const endLine = Math.min(allLines.length - 1, line + 3);
    const snippet = allLines.slice(startLine, endLine + 1);

    return snippet.join('\n');
  } catch {
    return null;
  }
}
