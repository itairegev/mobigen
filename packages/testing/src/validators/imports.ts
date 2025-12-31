import * as fs from 'fs';
import * as path from 'path';
import type { Validator, ValidatorConfig, StageResult, ValidationError } from '../types';

/**
 * Imports Validator
 *
 * Validates that all imports in the project can be resolved:
 * - Relative imports point to existing files
 * - Alias imports (@/) are properly configured
 * - Package imports exist in node_modules
 */
export const importsValidator: Validator = {
  name: 'imports',
  tier: 'tier1',

  async run(config: ValidatorConfig): Promise<StageResult> {
    const start = Date.now();
    const errors: ValidationError[] = [];
    const srcPath = path.join(config.projectPath, 'src');
    const appPath = path.join(config.projectPath, 'app');

    try {
      // Load package.json to get dependencies
      const packageJsonPath = path.join(config.projectPath, 'package.json');
      const packageJson = fs.existsSync(packageJsonPath)
        ? JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
        : { dependencies: {}, devDependencies: {} };

      const installedPackages = new Set([
        ...Object.keys(packageJson.dependencies || {}),
        ...Object.keys(packageJson.devDependencies || {}),
        // Built-in node modules
        'react', 'react-native', 'expo',
        'fs', 'path', 'util', 'child_process', 'os', 'crypto', 'stream', 'events',
      ]);

      // Load tsconfig for path aliases
      const aliases = await loadPathAliases(config.projectPath);

      // Find all TypeScript/JavaScript files
      const filesToCheck = [
        ...(fs.existsSync(srcPath) ? findTsFiles(srcPath) : []),
        ...(fs.existsSync(appPath) ? findTsFiles(appPath) : []),
      ];

      // Check imports in each file
      for (const file of filesToCheck) {
        const content = fs.readFileSync(file, 'utf-8');
        const importErrors = checkFileImports(
          file,
          content,
          config.projectPath,
          installedPackages,
          aliases
        );
        errors.push(...importErrors);
      }

      return {
        name: 'imports',
        passed: errors.filter(e => e.severity === 'error').length === 0,
        duration: Date.now() - start,
        errors,
        output: `Checked ${filesToCheck.length} files, found ${errors.length} import issues`,
      };
    } catch (error) {
      return {
        name: 'imports',
        passed: false,
        duration: Date.now() - start,
        errors: [{
          file: config.projectPath,
          message: `Import validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'error',
        }],
      };
    }
  },
};

/**
 * Find all TypeScript files in a directory
 */
function findTsFiles(dir: string): string[] {
  const files: string[] = [];

  function walkDir(currentDir: string) {
    if (!fs.existsSync(currentDir)) return;

    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
        walkDir(fullPath);
      } else if (entry.isFile()) {
        if (entry.name.match(/\.(tsx?|jsx?)$/) && !entry.name.match(/\.d\.ts$/)) {
          files.push(fullPath);
        }
      }
    }
  }

  walkDir(dir);
  return files;
}

/**
 * Load path aliases from tsconfig.json
 */
async function loadPathAliases(projectPath: string): Promise<Map<string, string>> {
  const aliases = new Map<string, string>();

  const tsconfigPath = path.join(projectPath, 'tsconfig.json');
  if (!fs.existsSync(tsconfigPath)) return aliases;

  try {
    const content = fs.readFileSync(tsconfigPath, 'utf-8');
    // Remove comments for parsing
    const cleanContent = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
    const tsconfig = JSON.parse(cleanContent);

    const paths = tsconfig.compilerOptions?.paths || {};
    const baseUrl = tsconfig.compilerOptions?.baseUrl || '.';

    for (const [alias, targets] of Object.entries(paths)) {
      if (Array.isArray(targets) && targets.length > 0) {
        // Remove wildcard from alias (e.g., "@/*" -> "@/")
        const cleanAlias = alias.replace(/\*$/, '');
        // Remove wildcard from target and resolve
        const target = (targets[0] as string).replace(/\*$/, '');
        const resolvedTarget = path.resolve(projectPath, baseUrl, target);
        aliases.set(cleanAlias, resolvedTarget);
      }
    }
  } catch {
    // Ignore parsing errors
  }

  return aliases;
}

/**
 * Check imports in a single file
 */
function checkFileImports(
  filePath: string,
  content: string,
  projectPath: string,
  installedPackages: Set<string>,
  aliases: Map<string, string>
): ValidationError[] {
  const errors: ValidationError[] = [];
  const lines = content.split('\n');

  // Match various import patterns
  const importPatterns = [
    // ES6 imports: import X from 'Y'
    /import\s+(?:[\w{},\s*]+\s+from\s+)?['"]([^'"]+)['"]/g,
    // Dynamic imports: import('Y')
    /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    // Require: require('Y')
    /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    // Export from: export X from 'Y'
    /export\s+(?:[\w{},\s*]+\s+from\s+)?['"]([^'"]+)['"]/g,
  ];

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum];

    for (const pattern of importPatterns) {
      // Reset pattern state
      pattern.lastIndex = 0;

      let match;
      while ((match = pattern.exec(line)) !== null) {
        const importPath = match[1];
        const error = validateImport(
          importPath,
          filePath,
          projectPath,
          installedPackages,
          aliases
        );

        if (error) {
          errors.push({
            file: filePath,
            line: lineNum + 1,
            message: error,
            severity: 'error',
          });
        }
      }
    }
  }

  return errors;
}

/**
 * Validate a single import path
 */
function validateImport(
  importPath: string,
  fromFile: string,
  projectPath: string,
  installedPackages: Set<string>,
  aliases: Map<string, string>
): string | null {
  // Relative imports
  if (importPath.startsWith('.')) {
    const resolved = resolveRelativeImport(importPath, fromFile);
    if (!resolved) {
      return `Cannot resolve relative import: ${importPath}`;
    }
    return null;
  }

  // Alias imports (e.g., @/components)
  for (const [alias, target] of aliases) {
    if (importPath.startsWith(alias)) {
      const relativePart = importPath.slice(alias.length);
      const resolved = resolveAliasImport(target, relativePart);
      if (!resolved) {
        return `Cannot resolve alias import: ${importPath}`;
      }
      return null;
    }
  }

  // Package imports
  const packageName = getPackageName(importPath);

  // Check if it's installed
  if (installedPackages.has(packageName)) {
    return null;
  }

  // Check node_modules
  const nodeModulesPath = path.join(projectPath, 'node_modules', packageName);
  if (fs.existsSync(nodeModulesPath)) {
    return null;
  }

  // Known React Native built-ins that might not be in package.json
  const builtIns = new Set([
    'react-native',
    'react',
    'expo-status-bar',
    'expo-router',
    'expo-constants',
    'expo-linking',
  ]);

  if (builtIns.has(packageName)) {
    return null;
  }

  return `Package not found: ${packageName}`;
}

/**
 * Get package name from import path
 */
function getPackageName(importPath: string): string {
  // Scoped packages: @scope/package/path -> @scope/package
  if (importPath.startsWith('@')) {
    const parts = importPath.split('/');
    return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : importPath;
  }

  // Regular packages: package/path -> package
  return importPath.split('/')[0];
}

/**
 * Resolve relative import to actual file
 */
function resolveRelativeImport(importPath: string, fromFile: string): string | null {
  const fromDir = path.dirname(fromFile);
  const resolvedBase = path.resolve(fromDir, importPath);

  // Try various extensions and index files
  const attempts = [
    resolvedBase,
    `${resolvedBase}.ts`,
    `${resolvedBase}.tsx`,
    `${resolvedBase}.js`,
    `${resolvedBase}.jsx`,
    `${resolvedBase}.json`,
    path.join(resolvedBase, 'index.ts'),
    path.join(resolvedBase, 'index.tsx'),
    path.join(resolvedBase, 'index.js'),
    path.join(resolvedBase, 'index.jsx'),
  ];

  for (const attempt of attempts) {
    if (fs.existsSync(attempt)) {
      return attempt;
    }
  }

  return null;
}

/**
 * Resolve alias import to actual file
 */
function resolveAliasImport(aliasTarget: string, relativePart: string): string | null {
  const resolvedBase = path.join(aliasTarget, relativePart);

  const attempts = [
    resolvedBase,
    `${resolvedBase}.ts`,
    `${resolvedBase}.tsx`,
    `${resolvedBase}.js`,
    `${resolvedBase}.jsx`,
    path.join(resolvedBase, 'index.ts'),
    path.join(resolvedBase, 'index.tsx'),
    path.join(resolvedBase, 'index.js'),
  ];

  for (const attempt of attempts) {
    if (fs.existsSync(attempt)) {
      return attempt;
    }
  }

  return null;
}
