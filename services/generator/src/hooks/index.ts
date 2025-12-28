import type { HookConfig, HookCallback, PostToolUseHookInput, PreToolUseHookInput } from '@mobigen/ai';
import { execSync, exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execAsync = promisify(exec);

// ═══════════════════════════════════════════════════════════════════════════
// FILE CHANGE TRACKING (Per-Project)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * FileChangeTracker - Manages file modification tracking per project
 * Avoids global mutable state by using a project-keyed registry
 */
class FileChangeTracker {
  private static projectTrackers: Map<string, Map<string, { count: number; lastModified: Date }>> = new Map();

  /**
   * Get or create a tracker for a specific project
   */
  static getTracker(projectId: string): Map<string, { count: number; lastModified: Date }> {
    let tracker = this.projectTrackers.get(projectId);
    if (!tracker) {
      tracker = new Map();
      this.projectTrackers.set(projectId, tracker);
    }
    return tracker;
  }

  /**
   * Record a file modification for a project
   */
  static recordModification(projectId: string, filePath: string): void {
    const tracker = this.getTracker(projectId);
    const existing = tracker.get(filePath);
    tracker.set(filePath, {
      count: (existing?.count || 0) + 1,
      lastModified: new Date(),
    });
  }

  /**
   * Get all modified files for a project
   */
  static getModifiedFiles(projectId: string): Map<string, { count: number; lastModified: Date }> {
    return new Map(this.getTracker(projectId));
  }

  /**
   * Clear tracking for a specific project
   */
  static clearProject(projectId: string): void {
    this.projectTrackers.delete(projectId);
  }

  /**
   * Clear all trackers (for testing)
   */
  static clearAll(): void {
    this.projectTrackers.clear();
  }
}

// Legacy global tracker for backward compatibility (will be removed)
const modifiedFiles: Map<string, { count: number; lastModified: Date }> = new Map();

/**
 * Create a file change logger for a specific project
 */
function createFileChangeLogger(projectId: string): HookCallback {
  return async (input, toolUseId, { signal }) => {
    const postInput = input as PostToolUseHookInput;
    const filePath = postInput.tool_input?.file_path as string;

    if (filePath) {
      FileChangeTracker.recordModification(projectId, filePath);
      const tracker = FileChangeTracker.getTracker(projectId);
      const fileInfo = tracker.get(filePath);
      console.log(`[${new Date().toISOString()}] [${projectId}] Modified: ${filePath} (${fileInfo?.count || 1}x)`);
    }

    return {};
  };
}

// Legacy global logger for backward compatibility
const fileChangeLogger: HookCallback = async (input, toolUseId, { signal }) => {
  const postInput = input as PostToolUseHookInput;
  const filePath = postInput.tool_input?.file_path as string;

  if (filePath) {
    const existing = modifiedFiles.get(filePath);
    modifiedFiles.set(filePath, {
      count: (existing?.count || 0) + 1,
      lastModified: new Date(),
    });
    console.log(`[${new Date().toISOString()}] Modified: ${filePath} (${existing?.count || 0 + 1}x)`);
  }

  return {};
};

// ═══════════════════════════════════════════════════════════════════════════
// SECURITY HOOKS
// ═══════════════════════════════════════════════════════════════════════════

// Comprehensive secret patterns
const SECRET_PATTERNS = [
  /(api[_-]?key|apikey)\s*[:=]\s*['"][^'"]{10,}['"]/gi,
  /AKIA[0-9A-Z]{16}/g, // AWS Access Key
  /-----BEGIN (RSA |EC |DSA )?PRIVATE KEY-----/g,
  /(password|passwd|pwd)\s*[:=]\s*['"][^'"]+['"]/gi,
  /(token|bearer|auth)\s*[:=]\s*['"][^'"]{20,}['"]/gi,
  /mongodb(\+srv)?:\/\/[^:]+:[^@]+@/g, // MongoDB connection string
  /AIza[0-9A-Za-z_-]{35}/g, // Firebase API key
  /sk-[a-zA-Z0-9]{48}/g, // OpenAI API key
  /ghp_[a-zA-Z0-9]{36}/g, // GitHub personal access token
  /xox[baprs]-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24}/g, // Slack token
];

// Prevent secret exposure (PreToolUse hook can block)
const secretGuard: HookCallback = async (input, toolUseId, context) => {
  const preInput = input as PreToolUseHookInput;
  const content = (preInput.tool_input?.content as string) || '';
  const filePath = (preInput.tool_input?.file_path as string) || '';

  // Skip check for test files and config templates
  if (filePath.includes('.test.') || filePath.includes('.spec.') || filePath.endsWith('.example')) {
    return {};
  }

  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(content)) {
      console.warn(`[Security] Blocked potential secret in ${filePath}`);
      return {
        hookSpecificOutput: {
          hookEventName: preInput.hook_event_name,
          permissionDecision: 'deny',
          permissionDecisionReason: `Content appears to contain secrets matching pattern: ${pattern.source.substring(0, 30)}...`,
        },
      };
    }
  }
  return {};
};

// Check for insecure patterns
const insecureCodeGuard: HookCallback = async (input, toolUseId, context) => {
  const preInput = input as PreToolUseHookInput;
  const content = (preInput.tool_input?.content as string) || '';

  const insecurePatterns = [
    { pattern: /eval\s*\(/g, message: 'eval() usage detected - potential code injection risk' },
    { pattern: /dangerouslySetInnerHTML/g, message: 'dangerouslySetInnerHTML usage - potential XSS risk' },
    { pattern: /http:\/\/(?!localhost|127\.0\.0\.1)/g, message: 'HTTP URL detected - use HTTPS instead' },
    { pattern: /AsyncStorage\.setItem\s*\(\s*['"`](token|password|secret|key)/gi, message: 'Sensitive data in AsyncStorage - use SecureStore instead' },
  ];

  const warnings: string[] = [];
  for (const { pattern, message } of insecurePatterns) {
    if (pattern.test(content)) {
      warnings.push(message);
    }
  }

  if (warnings.length > 0) {
    console.warn(`[Security] Warnings:\n${warnings.map(w => `  - ${w}`).join('\n')}`);
    // Don't block, just warn - these might be intentional
  }

  return {};
};

// ═══════════════════════════════════════════════════════════════════════════
// CODE QUALITY HOOKS
// ═══════════════════════════════════════════════════════════════════════════

// Run TypeScript check after edits
const typescriptValidator: HookCallback = async (input, toolUseId, { signal }) => {
  const postInput = input as PostToolUseHookInput;
  const filePath = postInput.tool_input?.file_path as string;

  // Only check TypeScript/TSX files
  if (!filePath || (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx'))) {
    return {};
  }

  try {
    execSync('npx tsc --noEmit --skipLibCheck 2>&1 | head -20', {
      timeout: 30000,
    });
    return {};
  } catch (error) {
    const errorOutput = error instanceof Error ? error.message : String(error);
    console.warn('[TypeScript] Check warning:', errorOutput.substring(0, 500));
    return {};
  }
};

// Check for console.log statements
const consoleLogChecker: HookCallback = async (input, toolUseId, context) => {
  const postInput = input as PostToolUseHookInput;
  const content = (postInput.tool_input?.content as string) || '';
  const filePath = (postInput.tool_input?.file_path as string) || '';

  // Skip test files
  if (filePath.includes('.test.') || filePath.includes('.spec.')) {
    return {};
  }

  const consoleMatches = content.match(/console\.(log|warn|error|debug|info)\s*\(/g);
  if (consoleMatches && consoleMatches.length > 0) {
    console.warn(`[Quality] Found ${consoleMatches.length} console statements in ${filePath}`);
  }

  return {};
};

// ═══════════════════════════════════════════════════════════════════════════
// ACCESSIBILITY HOOKS
// ═══════════════════════════════════════════════════════════════════════════

// Check for missing accessibility props
const accessibilityChecker: HookCallback = async (input, toolUseId, context) => {
  const postInput = input as PostToolUseHookInput;
  const content = (postInput.tool_input?.content as string) || '';
  const filePath = (postInput.tool_input?.file_path as string) || '';

  // Only check TSX files
  if (!filePath.endsWith('.tsx')) {
    return {};
  }

  const interactiveElements = [
    { pattern: /<Pressable(?![^>]*accessibilityLabel)/g, element: 'Pressable' },
    { pattern: /<TouchableOpacity(?![^>]*accessibilityLabel)/g, element: 'TouchableOpacity' },
    { pattern: /<TouchableHighlight(?![^>]*accessibilityLabel)/g, element: 'TouchableHighlight' },
    { pattern: /<Button(?![^>]*accessibilityLabel)/g, element: 'Button' },
    { pattern: /<TextInput(?![^>]*accessibilityLabel)/g, element: 'TextInput' },
  ];

  const missingLabels: string[] = [];
  for (const { pattern, element } of interactiveElements) {
    const matches = content.match(pattern);
    if (matches && matches.length > 0) {
      missingLabels.push(`${element}: ${matches.length} instances`);
    }
  }

  if (missingLabels.length > 0) {
    console.warn(`[Accessibility] Missing accessibilityLabel in ${filePath}:\n${missingLabels.map(l => `  - ${l}`).join('\n')}`);
  }

  // Check for missing testID (needed for E2E tests)
  const missingTestIds = [
    { pattern: /<Pressable(?![^>]*testID)/g, element: 'Pressable' },
    { pattern: /<TouchableOpacity(?![^>]*testID)/g, element: 'TouchableOpacity' },
    { pattern: /<TextInput(?![^>]*testID)/g, element: 'TextInput' },
  ];

  const missingIds: string[] = [];
  for (const { pattern, element } of missingTestIds) {
    const matches = content.match(pattern);
    if (matches && matches.length > 0) {
      missingIds.push(`${element}: ${matches.length} instances`);
    }
  }

  if (missingIds.length > 0) {
    console.warn(`[Testing] Missing testID in ${filePath}:\n${missingIds.map(l => `  - ${l}`).join('\n')}`);
  }

  return {};
};

// ═══════════════════════════════════════════════════════════════════════════
// PERFORMANCE HOOKS
// ═══════════════════════════════════════════════════════════════════════════

// Check for performance anti-patterns
const performanceChecker: HookCallback = async (input, toolUseId, context) => {
  const postInput = input as PostToolUseHookInput;
  const content = (postInput.tool_input?.content as string) || '';
  const filePath = (postInput.tool_input?.file_path as string) || '';

  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) {
    return {};
  }

  const warnings: string[] = [];

  // Check for inline functions in JSX
  const inlineFunctionPattern = /\bonPress\s*=\s*\{\s*\(\)\s*=>/g;
  const inlineMatches = content.match(inlineFunctionPattern);
  if (inlineMatches && inlineMatches.length > 2) {
    warnings.push(`${inlineMatches.length} inline arrow functions in JSX - consider useCallback`);
  }

  // Check for missing useMemo/useCallback
  if (content.includes('useMemo') === false && content.includes('.map(') && content.length > 2000) {
    warnings.push('Large component with .map() but no useMemo - consider memoization');
  }

  // Check for FlatList without keyExtractor
  if (content.includes('<FlatList') && !content.includes('keyExtractor')) {
    warnings.push('FlatList without keyExtractor - this can cause performance issues');
  }

  if (warnings.length > 0) {
    console.warn(`[Performance] Warnings in ${filePath}:\n${warnings.map(w => `  - ${w}`).join('\n')}`);
  }

  return {};
};

// ═══════════════════════════════════════════════════════════════════════════
// IMPORT/EXPORT VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

// Check for valid imports
const importValidator: HookCallback = async (input, toolUseId, context) => {
  const postInput = input as PostToolUseHookInput;
  const content = (postInput.tool_input?.content as string) || '';
  const filePath = (postInput.tool_input?.file_path as string) || '';

  if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) {
    return {};
  }

  // Check for duplicate imports
  const importLines = content.match(/^import .* from ['"][^'"]+['"];?$/gm) || [];
  const importSources = importLines.map(line => {
    const match = line.match(/from ['"]([^'"]+)['"]/);
    return match ? match[1] : '';
  });

  const duplicates = importSources.filter((item, index) => importSources.indexOf(item) !== index);
  if (duplicates.length > 0) {
    console.warn(`[Imports] Duplicate imports in ${filePath}: ${duplicates.join(', ')}`);
  }

  return {};
};

// ═══════════════════════════════════════════════════════════════════════════
// HOOK CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════════════════

// Configure hooks for query() options
export function createQAHooks(projectId: string): HookConfig {
  // Create a project-specific file change logger
  const projectFileLogger = createFileChangeLogger(projectId);

  return {
    PreToolUse: [
      {
        matcher: 'Write|Edit',
        hooks: [secretGuard, insecureCodeGuard],
      },
    ],
    PostToolUse: [
      {
        matcher: 'Edit|Write',
        hooks: [projectFileLogger, consoleLogChecker, importValidator],
      },
      {
        matcher: 'Edit',
        hooks: [typescriptValidator],
      },
    ],
  };
}

// Enhanced hooks with accessibility and performance checks
export function createEnhancedQAHooks(projectId: string): HookConfig {
  // Create a project-specific file change logger
  const projectFileLogger = createFileChangeLogger(projectId);

  return {
    PreToolUse: [
      {
        matcher: 'Write|Edit',
        hooks: [secretGuard, insecureCodeGuard],
      },
    ],
    PostToolUse: [
      {
        matcher: 'Edit|Write',
        hooks: [
          projectFileLogger,
          consoleLogChecker,
          importValidator,
          accessibilityChecker,
          performanceChecker,
        ],
      },
      {
        matcher: 'Edit',
        hooks: [typescriptValidator],
      },
    ],
  };
}

// Strict hooks for production-ready validation
export function createStrictQAHooks(projectId: string, projectPath: string): HookConfig {
  // Create a project-specific file change logger
  const projectFileLogger = createFileChangeLogger(projectId);

  // Run ESLint after edits
  const eslintValidator: HookCallback = async (input, toolUseId, { signal }) => {
    const postInput = input as PostToolUseHookInput;
    const filePath = postInput.tool_input?.file_path as string;

    if (!filePath || (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx'))) {
      return {};
    }

    try {
      await execAsync(`npx eslint "${filePath}" --max-warnings 0`, {
        cwd: projectPath,
        timeout: 30000,
      });
    } catch (error) {
      const errorOutput = error instanceof Error ? error.message : String(error);
      console.warn('[ESLint] Check failed:', errorOutput.substring(0, 500));
    }

    return {};
  };

  return {
    PreToolUse: [
      {
        matcher: 'Write|Edit',
        hooks: [secretGuard, insecureCodeGuard],
      },
    ],
    PostToolUse: [
      {
        matcher: 'Edit|Write',
        hooks: [
          projectFileLogger,
          consoleLogChecker,
          importValidator,
          accessibilityChecker,
          performanceChecker,
        ],
      },
      {
        matcher: 'Edit',
        hooks: [typescriptValidator, eslintValidator],
      },
    ],
  };
}

/**
 * Get list of modified files for a specific project
 * @param projectId - The project ID (if undefined, returns legacy global tracker)
 */
export function getModifiedFiles(projectId?: string): Map<string, { count: number; lastModified: Date }> {
  if (projectId) {
    return FileChangeTracker.getModifiedFiles(projectId);
  }
  // Legacy fallback
  return new Map(modifiedFiles);
}

/**
 * Clear modified files tracking
 * @param projectId - The project ID (if undefined, clears legacy global tracker)
 */
export function clearModifiedFiles(projectId?: string): void {
  if (projectId) {
    FileChangeTracker.clearProject(projectId);
  } else {
    modifiedFiles.clear();
  }
}

/**
 * Get the list of file paths modified for a project
 */
export function getModifiedFilePaths(projectId: string): string[] {
  return Array.from(FileChangeTracker.getModifiedFiles(projectId).keys());
}

// Export individual hooks for custom configurations
export {
  fileChangeLogger,
  secretGuard,
  insecureCodeGuard,
  typescriptValidator,
  consoleLogChecker,
  accessibilityChecker,
  performanceChecker,
  importValidator,
  createFileChangeLogger,
  FileChangeTracker,
};
