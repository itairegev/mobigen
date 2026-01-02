/**
 * Suggestion enricher
 *
 * Provides fix suggestions for common errors
 */

export interface FixSuggestion {
  description: string;
  action: 'add' | 'remove' | 'change' | 'review';
  example?: string;
  autoFixable: boolean;
  confidence: number; // 0-1
}

/**
 * TypeScript error suggestions
 */
const TYPESCRIPT_SUGGESTIONS: Record<string, FixSuggestion | ((message: string) => FixSuggestion)> = {
  // Cannot find name
  'TS2304': (message: string) => {
    const nameMatch = message.match(/Cannot find name ['"](.+?)['"]/);
    const name = nameMatch?.[1] || 'unknown';

    return {
      description: `Import or define '${name}'`,
      action: 'add',
      example: `import { ${name} } from './path-to-module';`,
      autoFixable: true,
      confidence: 0.9,
    };
  },

  // Module not found
  'TS2307': (message: string) => {
    const moduleMatch = message.match(/Cannot find module ['"](.+?)['"]/);
    const module = moduleMatch?.[1] || 'unknown';

    return {
      description: module.startsWith('.')
        ? `Check the import path. The file may not exist at '${module}'`
        : `Install the package: npm install ${module}`,
      action: 'review',
      example: module.startsWith('.')
        ? undefined
        : `npm install ${module}`,
      autoFixable: false,
      confidence: 0.85,
    };
  },

  // Property does not exist
  'TS2339': (message: string) => {
    const propMatch = message.match(/Property ['"](.+?)['"] does not exist on type ['"](.+?)['"]/);

    return {
      description: propMatch
        ? `Add property '${propMatch[1]}' to type or check for typos`
        : 'Check if the property exists on this type',
      action: 'review',
      autoFixable: false,
      confidence: 0.7,
    };
  },

  // Type not assignable
  'TS2322': {
    description: 'Check type compatibility. Ensure the value matches the expected type.',
    action: 'change',
    autoFixable: false,
    confidence: 0.6,
  },

  // Missing property
  'TS2741': (message: string) => {
    const propMatch = message.match(/Property ['"](.+?)['"] is missing/);

    return {
      description: propMatch
        ? `Add the required property '${propMatch[1]}'`
        : 'Add all required properties to the object',
      action: 'add',
      autoFixable: true,
      confidence: 0.85,
    };
  },

  // Argument type mismatch
  'TS2345': {
    description: 'Check argument types match function parameter types',
    action: 'change',
    autoFixable: false,
    confidence: 0.6,
  },

  // Object possibly undefined
  'TS2532': {
    description: 'Add null check before accessing property',
    action: 'add',
    example: 'obj?.property or if (obj) { obj.property }',
    autoFixable: true,
    confidence: 0.9,
  },

  // Missing type declaration
  'TS7016': (message: string) => {
    const moduleMatch = message.match(/Could not find a declaration file for module ['"](.+?)['"]/);
    const module = moduleMatch?.[1] || 'unknown';

    return {
      description: `Install types: npm install --save-dev @types/${module.replace('/', '__')}`,
      action: 'add',
      example: `npm install --save-dev @types/${module.replace('/', '__')}`,
      autoFixable: false,
      confidence: 0.8,
    };
  },
};

/**
 * ESLint error suggestions
 */
const ESLINT_SUGGESTIONS: Record<string, FixSuggestion> = {
  'no-undef': {
    description: 'Define or import the undefined variable',
    action: 'add',
    autoFixable: true,
    confidence: 0.9,
  },

  'no-unused-vars': {
    description: 'Remove the unused variable or use it',
    action: 'remove',
    autoFixable: true,
    confidence: 0.95,
  },

  '@typescript-eslint/no-unused-vars': {
    description: 'Remove the unused variable or use it',
    action: 'remove',
    autoFixable: true,
    confidence: 0.95,
  },

  'react/jsx-no-undef': {
    description: 'Import the JSX component or check for typos',
    action: 'add',
    example: "import { Component } from './Component';",
    autoFixable: true,
    confidence: 0.9,
  },

  'react-hooks/rules-of-hooks': {
    description: 'Move hook call outside of conditionals and loops. Hooks must be called at top level.',
    action: 'change',
    autoFixable: false,
    confidence: 0.7,
  },

  'react-hooks/exhaustive-deps': {
    description: 'Add missing dependencies to the dependency array',
    action: 'add',
    autoFixable: true,
    confidence: 0.85,
  },

  'import/no-unresolved': {
    description: 'Check the import path or install the missing package',
    action: 'review',
    autoFixable: false,
    confidence: 0.7,
  },
};

/**
 * Get suggestion for TypeScript error
 */
export function getTypeScriptSuggestion(code: string, message: string): FixSuggestion | null {
  const suggestionOrFn = TYPESCRIPT_SUGGESTIONS[code];

  if (!suggestionOrFn) {
    return null;
  }

  if (typeof suggestionOrFn === 'function') {
    return suggestionOrFn(message);
  }

  return suggestionOrFn;
}

/**
 * Get suggestion for ESLint error
 */
export function getESLintSuggestion(ruleId: string): FixSuggestion | null {
  return ESLINT_SUGGESTIONS[ruleId] || null;
}

/**
 * Get generic suggestion based on error message
 */
export function getGenericSuggestion(message: string): FixSuggestion | null {
  // Common patterns
  if (message.includes('is not defined')) {
    return {
      description: 'Import or define the missing symbol',
      action: 'add',
      autoFixable: true,
      confidence: 0.8,
    };
  }

  if (message.includes('cannot find') || message.includes('not found')) {
    return {
      description: 'Check paths and imports. Ensure the file/module exists.',
      action: 'review',
      autoFixable: false,
      confidence: 0.7,
    };
  }

  if (message.includes('unexpected token')) {
    return {
      description: 'Check for syntax errors: missing brackets, semicolons, or quotes',
      action: 'review',
      autoFixable: false,
      confidence: 0.6,
    };
  }

  return null;
}
