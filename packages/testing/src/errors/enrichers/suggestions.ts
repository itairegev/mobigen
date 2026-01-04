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

  if (message.includes('must be rendered within')) {
    return {
      description: 'Wrap the content in the required component',
      action: 'review',
      autoFixable: false,
      confidence: 0.85,
    };
  }

  if (message.includes('is deprecated')) {
    return {
      description: 'Update to the recommended alternative',
      action: 'change',
      autoFixable: false,
      confidence: 0.9,
    };
  }

  if (message.includes('unmounted component')) {
    return {
      description: 'Add cleanup logic to prevent state updates on unmounted components',
      action: 'add',
      example: 'useEffect(() => { let mounted = true; ... return () => { mounted = false; }; }, []);',
      autoFixable: false,
      confidence: 0.8,
    };
  }

  return null;
}

/**
 * React Native specific suggestions
 */
const REACT_NATIVE_SUGGESTIONS: Record<string, FixSuggestion> = {
  'text-component': {
    description: 'Wrap text strings in a <Text> component',
    action: 'change',
    example: '<Text>Your text here</Text>',
    autoFixable: true,
    confidence: 0.95,
  },

  'undefined-object': {
    description: 'Add null/undefined checks before accessing properties',
    action: 'add',
    example: 'obj?.property or if (obj) { obj.property }',
    autoFixable: true,
    confidence: 0.9,
  },

  'view-prop-types': {
    description: 'Replace ViewPropTypes with ViewProps from react-native',
    action: 'change',
    example: "import { ViewProps } from 'react-native';",
    autoFixable: true,
    confidence: 0.95,
  },

  'hooks-rules': {
    description: 'Move hook calls to the top level of the function component',
    action: 'change',
    autoFixable: false,
    confidence: 0.7,
  },

  'screen-not-found': {
    description: 'Register the screen in your navigator configuration',
    action: 'add',
    autoFixable: true,
    confidence: 0.85,
  },
};

/**
 * Expo specific suggestions
 */
const EXPO_SUGGESTIONS: Record<string, FixSuggestion> = {
  'missing-bundle-id': {
    description: 'Add ios.bundleIdentifier to app.json',
    action: 'add',
    example: '"ios": { "bundleIdentifier": "com.yourcompany.yourapp" }',
    autoFixable: true,
    confidence: 0.95,
  },

  'missing-package': {
    description: 'Add android.package to app.json',
    action: 'add',
    example: '"android": { "package": "com.yourcompany.yourapp" }',
    autoFixable: true,
    confidence: 0.95,
  },

  'invalid-config': {
    description: 'Check app.json for invalid or missing required fields',
    action: 'review',
    autoFixable: false,
    confidence: 0.8,
  },

  'plugin-error': {
    description: 'Install the required Expo config plugin package',
    action: 'add',
    autoFixable: false,
    confidence: 0.75,
  },

  'prebuild-clean': {
    description: 'Run npx expo prebuild --clean to regenerate native projects',
    action: 'review',
    example: 'npx expo prebuild --clean',
    autoFixable: false,
    confidence: 0.9,
  },

  'sdk-version': {
    description: 'Check SDK version compatibility in app.json and package.json',
    action: 'review',
    autoFixable: false,
    confidence: 0.8,
  },
};

/**
 * Get suggestion for React Native error
 */
export function getReactNativeSuggestion(message: string): FixSuggestion | null {
  if (message.includes('Text strings must be rendered')) {
    return REACT_NATIVE_SUGGESTIONS['text-component'];
  }

  if (message.includes('undefined is not an object') || message.includes('Cannot read property')) {
    return REACT_NATIVE_SUGGESTIONS['undefined-object'];
  }

  if (message.includes('ViewPropTypes')) {
    return REACT_NATIVE_SUGGESTIONS['view-prop-types'];
  }

  if (message.includes('Hooks can only be called') || message.includes('Rendered more hooks')) {
    return REACT_NATIVE_SUGGESTIONS['hooks-rules'];
  }

  if (message.includes('screen') && message.includes('not in the navigator')) {
    return REACT_NATIVE_SUGGESTIONS['screen-not-found'];
  }

  return null;
}

/**
 * Get suggestion for Expo error
 */
export function getExpoSuggestion(message: string): FixSuggestion | null {
  if (message.includes('bundleIdentifier')) {
    return EXPO_SUGGESTIONS['missing-bundle-id'];
  }

  if (message.includes('android.package')) {
    return EXPO_SUGGESTIONS['missing-package'];
  }

  if (message.includes('config') || message.includes('app.json')) {
    return EXPO_SUGGESTIONS['invalid-config'];
  }

  if (message.includes('plugin')) {
    return EXPO_SUGGESTIONS['plugin-error'];
  }

  if (message.includes('prebuild')) {
    return EXPO_SUGGESTIONS['prebuild-clean'];
  }

  if (message.includes('SDK version') || message.includes('version')) {
    return EXPO_SUGGESTIONS['sdk-version'];
  }

  return null;
}
