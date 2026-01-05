/**
 * Code formatting service for exported projects
 * Handles Prettier and ESLint formatting with robust error handling
 */

import { promises as fs } from 'fs';
import path from 'path';
import { format as prettierFormat, resolveConfig as resolvePrettierConfig } from 'prettier';
import { ESLint } from 'eslint';
import {
  DEFAULT_PRETTIER_CONFIG,
  DEFAULT_ESLINT_CONFIG,
  shouldFormatFile,
  getFormatterForFile,
} from './formatter-config';
import { logger } from './logger';

/**
 * Result of formatting operation
 */
export interface FormatResult {
  success: boolean;
  filesFormatted: number;
  filesSkipped: number;
  errors: FormatError[];
}

/**
 * Error during formatting
 */
export interface FormatError {
  file: string;
  error: string;
  formatter: 'prettier' | 'eslint';
}

/**
 * Options for formatting
 */
export interface FormatOptions {
  skipValidation?: boolean; // Skip validation after formatting
  skipPrettier?: boolean; // Skip Prettier formatting
  skipESLint?: boolean; // Skip ESLint formatting
  continueOnError?: boolean; // Continue formatting even if some files fail
}

/**
 * CodeFormatter class - handles formatting of project files
 */
export class CodeFormatter {
  private prettierConfig: typeof DEFAULT_PRETTIER_CONFIG;
  private eslint: ESLint;

  constructor() {
    this.prettierConfig = { ...DEFAULT_PRETTIER_CONFIG };
    this.eslint = new ESLint({
      baseConfig: DEFAULT_ESLINT_CONFIG as unknown as ESLint.ConfigData,
      fix: true,
      useEslintrc: false, // Don't use external configs
    });
  }

  /**
   * Format an entire project directory
   */
  async formatProject(
    projectPath: string,
    options: FormatOptions = {}
  ): Promise<FormatResult> {
    logger.info(`Starting code formatting for project: ${projectPath}`);

    const result: FormatResult = {
      success: true,
      filesFormatted: 0,
      filesSkipped: 0,
      errors: [],
    };

    try {
      // Get all files in the project
      const files = await this.getAllFiles(projectPath);

      for (const file of files) {
        try {
          const relativePath = path.relative(projectPath, file);

          // Check if file should be formatted
          if (!shouldFormatFile(relativePath)) {
            result.filesSkipped++;
            continue;
          }

          // Format the file
          const formatted = await this.formatFile(file, options);

          if (formatted) {
            result.filesFormatted++;
          } else {
            result.filesSkipped++;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          logger.warn(`Error formatting file ${file}: ${errorMessage}`);

          result.errors.push({
            file: path.relative(projectPath, file),
            error: errorMessage,
            formatter: 'prettier', // Default to prettier
          });

          if (!options.continueOnError) {
            result.success = false;
            break;
          }
        }
      }

      // Validate formatting if requested
      if (!options.skipValidation && result.success) {
        const isValid = await this.validateFormatting(projectPath);
        if (!isValid) {
          logger.warn('Formatting validation failed');
          result.success = false;
        }
      }

      logger.info(
        `Formatting complete: ${result.filesFormatted} formatted, ${result.filesSkipped} skipped, ${result.errors.length} errors`
      );

      return result;
    } catch (error) {
      logger.error('Failed to format project:', error);
      result.success = false;
      result.errors.push({
        file: projectPath,
        error: error instanceof Error ? error.message : String(error),
        formatter: 'prettier',
      });
      return result;
    }
  }

  /**
   * Format a single file
   */
  async formatFile(filePath: string, options: FormatOptions = {}): Promise<boolean> {
    const formatterType = getFormatterForFile(filePath);

    if (formatterType === 'none') {
      return false;
    }

    try {
      // Read the file
      const content = await fs.readFile(filePath, 'utf-8');
      let formattedContent = content;

      // Apply Prettier if needed
      if (!options.skipPrettier && (formatterType === 'prettier' || formatterType === 'both')) {
        formattedContent = await this.formatWithPrettier(filePath, formattedContent);
      }

      // Apply ESLint if needed
      if (!options.skipESLint && (formatterType === 'eslint' || formatterType === 'both')) {
        formattedContent = await this.formatWithESLint(filePath, formattedContent);
      }

      // Write back if content changed
      if (formattedContent !== content) {
        await fs.writeFile(filePath, formattedContent, 'utf-8');
        logger.debug(`Formatted: ${filePath}`);
        return true;
      }

      return false;
    } catch (error) {
      logger.warn(`Failed to format ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Validate that formatting is correct
   */
  async validateFormatting(projectPath: string): Promise<boolean> {
    logger.info(`Validating formatting for: ${projectPath}`);

    try {
      const files = await this.getAllFiles(projectPath);
      const jsFiles = files.filter(
        (f) => f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js') || f.endsWith('.jsx')
      );

      // Check Prettier formatting
      for (const file of jsFiles) {
        const relativePath = path.relative(projectPath, file);

        if (!shouldFormatFile(relativePath)) {
          continue;
        }

        const content = await fs.readFile(file, 'utf-8');
        const formatted = await this.formatWithPrettier(file, content);

        if (formatted !== content) {
          logger.warn(`File ${relativePath} is not properly formatted`);
          return false;
        }
      }

      logger.info('All files are properly formatted');
      return true;
    } catch (error) {
      logger.error('Validation failed:', error);
      return false;
    }
  }

  /**
   * Format content with Prettier
   */
  private async formatWithPrettier(filePath: string, content: string): Promise<string> {
    try {
      // Try to resolve project-specific prettier config
      const projectConfig = await resolvePrettierConfig(filePath);
      const config = projectConfig || this.prettierConfig;

      // Detect parser based on file extension
      const parser = this.getPrettierParser(filePath);

      return await prettierFormat(content, {
        ...config,
        filepath: filePath,
        parser,
      });
    } catch (error) {
      logger.warn(`Prettier failed for ${filePath}:`, error);
      // Return original content if formatting fails
      return content;
    }
  }

  /**
   * Format content with ESLint
   */
  private async formatWithESLint(filePath: string, content: string): Promise<string> {
    try {
      // Only format TypeScript/JavaScript files
      if (
        !filePath.endsWith('.ts') &&
        !filePath.endsWith('.tsx') &&
        !filePath.endsWith('.js') &&
        !filePath.endsWith('.jsx')
      ) {
        return content;
      }

      // Write content to temp file for ESLint
      const tempFile = filePath + '.tmp';
      await fs.writeFile(tempFile, content, 'utf-8');

      try {
        // Run ESLint with --fix
        const results = await this.eslint.lintFiles([tempFile]);

        // Get the fixed content
        if (results.length > 0 && results[0].output) {
          await fs.unlink(tempFile);
          return results[0].output;
        }

        await fs.unlink(tempFile);
        return content;
      } catch (eslintError) {
        // Clean up temp file
        try {
          await fs.unlink(tempFile);
        } catch {
          // Ignore cleanup errors
        }
        throw eslintError;
      }
    } catch (error) {
      logger.warn(`ESLint failed for ${filePath}:`, error);
      // Return original content if formatting fails
      return content;
    }
  }

  /**
   * Get Prettier parser for file
   */
  private getPrettierParser(filePath: string): string {
    const ext = path.extname(filePath);

    switch (ext) {
      case '.ts':
        return 'typescript';
      case '.tsx':
        return 'typescript';
      case '.js':
        return 'babel';
      case '.jsx':
        return 'babel';
      case '.json':
        return 'json';
      case '.md':
        return 'markdown';
      case '.mdx':
        return 'mdx';
      case '.yml':
      case '.yaml':
        return 'yaml';
      case '.css':
        return 'css';
      case '.scss':
        return 'scss';
      case '.less':
        return 'less';
      case '.graphql':
      case '.gql':
        return 'graphql';
      case '.html':
        return 'html';
      default:
        return 'babel';
    }
  }

  /**
   * Recursively get all files in a directory
   */
  private async getAllFiles(dir: string): Promise<string[]> {
    const files: string[] = [];

    async function traverse(currentPath: string) {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);

        // Skip common directories that should never be formatted
        if (
          entry.isDirectory() &&
          (entry.name === 'node_modules' ||
            entry.name === '.git' ||
            entry.name === 'dist' ||
            entry.name === 'build' ||
            entry.name === '.expo' ||
            entry.name === 'android' ||
            entry.name === 'ios' ||
            entry.name === 'coverage' ||
            entry.name === '.turbo' ||
            entry.name === '.next')
        ) {
          continue;
        }

        if (entry.isDirectory()) {
          await traverse(fullPath);
        } else {
          files.push(fullPath);
        }
      }
    }

    await traverse(dir);
    return files;
  }

  /**
   * Create a formatted copy of a project
   * Useful for export scenarios where you don't want to modify the original
   */
  async createFormattedCopy(
    sourcePath: string,
    destPath: string,
    options: FormatOptions = {}
  ): Promise<FormatResult> {
    logger.info(`Creating formatted copy from ${sourcePath} to ${destPath}`);

    try {
      // Copy the project
      await this.copyDirectory(sourcePath, destPath);

      // Format the copy
      return await this.formatProject(destPath, options);
    } catch (error) {
      logger.error('Failed to create formatted copy:', error);
      throw error;
    }
  }

  /**
   * Copy directory recursively
   */
  private async copyDirectory(src: string, dest: string): Promise<void> {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      // Skip node_modules and other large directories
      if (
        entry.isDirectory() &&
        (entry.name === 'node_modules' ||
          entry.name === '.git' ||
          entry.name === 'dist' ||
          entry.name === 'build')
      ) {
        continue;
      }

      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }
}

/**
 * Create a default formatter instance
 */
export function createFormatter(): CodeFormatter {
  return new CodeFormatter();
}
