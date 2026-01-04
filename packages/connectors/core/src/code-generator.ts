/**
 * Code generation utilities for connector installation
 *
 * @packageDocumentation
 */

import type {
  GeneratedFile,
  CodeGenContext,
  ConnectorDependency,
  ConnectorEnvVar,
} from './types';

/**
 * Strategy for merging generated code with existing files
 */
export enum MergeStrategy {
  /** Overwrite the entire file */
  OVERWRITE = 'overwrite',

  /** Skip if file exists */
  SKIP_IF_EXISTS = 'skip_if_exists',

  /** Append to existing file */
  APPEND = 'append',

  /** Smart merge (imports, exports, etc.) */
  SMART_MERGE = 'smart_merge',
}

/**
 * File generation result
 */
export interface FileGenerationResult {
  /** File path that was written */
  path: string;

  /** Was the file created or modified? */
  action: 'created' | 'modified' | 'skipped';

  /** File content */
  content: string;

  /** Any warnings during generation */
  warnings?: string[];
}

/**
 * Generate code from template with context
 *
 * @param file - File definition with template
 * @param context - Code generation context
 * @returns Generated file content
 *
 * @example
 * ```typescript
 * const file: GeneratedFile = {
 *   path: 'src/services/stripe.ts',
 *   template: (ctx) => `export const API_KEY = '${ctx.env.STRIPE_KEY}';`,
 * };
 *
 * const content = generateFileContent(file, context);
 * ```
 */
export function generateFileContent(
  file: GeneratedFile,
  context: CodeGenContext
): string {
  try {
    return file.template(context);
  } catch (error) {
    throw new Error(
      `Failed to generate ${file.path}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Generate multiple files from templates
 *
 * @param files - Array of file definitions
 * @param context - Code generation context
 * @returns Array of generation results
 */
export function generateFiles(
  files: GeneratedFile[],
  context: CodeGenContext
): FileGenerationResult[] {
  const results: FileGenerationResult[] = [];

  for (const file of files) {
    try {
      const content = generateFileContent(file, context);

      results.push({
        path: file.path,
        action: 'created', // Actual write happens in manager
        content,
      });
    } catch (error) {
      results.push({
        path: file.path,
        action: 'skipped',
        content: '',
        warnings: [
          error instanceof Error ? error.message : String(error),
        ],
      });
    }
  }

  return results;
}

/**
 * Merge dependencies into package.json
 *
 * @param existingPackageJson - Current package.json content
 * @param dependencies - Dependencies to add
 * @returns Updated package.json content
 *
 * @example
 * ```typescript
 * const packageJson = JSON.parse(existingContent);
 * const deps = [
 *   { package: '@stripe/stripe-react-native', version: '^0.37.0' },
 *   { package: 'stripe', version: '^14.0.0' },
 * ];
 *
 * const updated = mergeDependencies(packageJson, deps);
 * ```
 */
export function mergeDependencies(
  existingPackageJson: any,
  dependencies: ConnectorDependency[]
): any {
  const updated = { ...existingPackageJson };

  // Ensure dependencies and devDependencies objects exist
  if (!updated.dependencies) {
    updated.dependencies = {};
  }
  if (!updated.devDependencies) {
    updated.devDependencies = {};
  }

  for (const dep of dependencies) {
    const target = dep.dev ? updated.devDependencies : updated.dependencies;

    // Only add if not already present
    if (!target[dep.package]) {
      target[dep.package] = dep.version;
    }
  }

  return updated;
}

/**
 * Generate .env.example content from environment variables
 *
 * @param envVars - Environment variable definitions
 * @param includeValues - Include default values?
 * @returns .env content
 *
 * @example
 * ```typescript
 * const envVars = [
 *   {
 *     key: 'STRIPE_PUBLISHABLE_KEY',
 *     description: 'Stripe publishable key',
 *     required: true,
 *   },
 *   {
 *     key: 'STRIPE_SECRET_KEY',
 *     description: 'Stripe secret key (server-side only)',
 *     required: true,
 *   },
 * ];
 *
 * const content = generateEnvExample(envVars);
 * // # Stripe publishable key
 * // STRIPE_PUBLISHABLE_KEY=
 * // # Stripe secret key (server-side only)
 * // STRIPE_SECRET_KEY=
 * ```
 */
export function generateEnvExample(
  envVars: ConnectorEnvVar[],
  includeValues = false
): string {
  const lines: string[] = [];

  for (const envVar of envVars) {
    // Add comment with description
    if (envVar.description) {
      lines.push(`# ${envVar.description}`);
    }

    // Add variable
    const value = includeValues && envVar.defaultValue
      ? envVar.defaultValue
      : '';

    const required = envVar.required ? '' : ' (optional)';
    lines.push(`${envVar.key}=${value}${required ? ' ' + required : ''}`);

    // Add blank line between variables
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Merge new environment variables into existing .env.example
 *
 * @param existing - Existing .env.example content
 * @param envVars - Environment variables to add
 * @param connectorName - Name of connector (for section header)
 * @returns Updated .env.example content
 */
export function mergeEnvExample(
  existing: string,
  envVars: ConnectorEnvVar[],
  connectorName: string
): string {
  const newSection = `
# ============================================================================
# ${connectorName.toUpperCase()} CONNECTOR
# ============================================================================

${generateEnvExample(envVars, false)}
`;

  return existing.trimEnd() + '\n' + newSection;
}

/**
 * Smart merge strategy for TypeScript files
 *
 * Merges imports and exports intelligently.
 *
 * @param existing - Existing file content
 * @param newContent - New content to merge
 * @returns Merged content
 *
 * @internal
 */
export function smartMergeTypeScript(
  existing: string,
  newContent: string
): string {
  // Extract imports from both files
  const existingImports = extractImports(existing);
  const newImports = extractImports(newContent);

  // Merge imports (deduplicate)
  const mergedImports = Array.from(
    new Set([...existingImports, ...newImports])
  );

  // Remove imports from new content
  const newContentWithoutImports = newContent.replace(
    /^import\s+.+?;\s*$/gm,
    ''
  );

  // Combine
  return (
    mergedImports.join('\n') +
    '\n\n' +
    existing.replace(/^import\s+.+?;\s*$/gm, '') +
    '\n\n' +
    newContentWithoutImports
  ).trim() + '\n';
}

/**
 * Extract import statements from TypeScript/JavaScript file
 *
 * @param content - File content
 * @returns Array of import statements
 *
 * @internal
 */
function extractImports(content: string): string[] {
  const importRegex = /^import\s+.+?;/gm;
  const matches = content.match(importRegex);
  return matches || [];
}

/**
 * Validate generated file content
 *
 * @param content - Generated content
 * @param path - File path
 * @returns Validation warnings
 */
export function validateGeneratedContent(
  content: string,
  path: string
): string[] {
  const warnings: string[] = [];

  // Check for TODO comments
  if (content.includes('TODO') || content.includes('FIXME')) {
    warnings.push(
      'Generated code contains TODO/FIXME comments that should be addressed'
    );
  }

  // Check for placeholder values
  if (content.includes('REPLACE_ME') || content.includes('YOUR_')) {
    warnings.push('Generated code contains placeholder values');
  }

  // Check TypeScript files for basic syntax
  if (path.endsWith('.ts') || path.endsWith('.tsx')) {
    // Check for balanced braces
    const openBraces = (content.match(/{/g) || []).length;
    const closeBraces = (content.match(/}/g) || []).length;

    if (openBraces !== closeBraces) {
      warnings.push('Unbalanced braces detected');
    }

    // Check for balanced parentheses
    const openParens = (content.match(/\(/g) || []).length;
    const closeParens = (content.match(/\)/g) || []).length;

    if (openParens !== closeParens) {
      warnings.push('Unbalanced parentheses detected');
    }
  }

  return warnings;
}

/**
 * Template helper for generating TypeScript service files
 *
 * @param params - Service generation parameters
 * @returns Generated service file content
 */
export function generateServiceTemplate(params: {
  connectorName: string;
  imports: string[];
  exports: string[];
  functions: Array<{ name: string; content: string }>;
}): string {
  return `
/**
 * ${params.connectorName} service
 * Auto-generated by Mobigen
 */

${params.imports.join('\n')}

${params.exports.join('\n')}

${params.functions.map(f => f.content).join('\n\n')}
`.trim() + '\n';
}

/**
 * Template helper for generating React hooks
 *
 * @param params - Hook generation parameters
 * @returns Generated hook file content
 */
export function generateHookTemplate(params: {
  connectorName: string;
  hookName: string;
  imports: string[];
  hookContent: string;
}): string {
  return `
/**
 * ${params.connectorName} React hooks
 * Auto-generated by Mobigen
 */

import { useState, useEffect } from 'react';
${params.imports.join('\n')}

${params.hookContent}
`.trim() + '\n';
}

/**
 * Template helper for generating TypeScript types
 *
 * @param params - Type generation parameters
 * @returns Generated types file content
 */
export function generateTypesTemplate(params: {
  connectorName: string;
  interfaces: Array<{ name: string; content: string }>;
  enums?: Array<{ name: string; content: string }>;
}): string {
  return `
/**
 * ${params.connectorName} type definitions
 * Auto-generated by Mobigen
 */

${params.interfaces.map(i => i.content).join('\n\n')}

${params.enums ? params.enums.map(e => e.content).join('\n\n') : ''}
`.trim() + '\n';
}
