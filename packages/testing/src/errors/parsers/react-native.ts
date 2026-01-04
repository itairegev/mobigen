/**
 * React Native error parser
 *
 * Parses React Native specific errors (Component, StyleSheet, Platform)
 */

export interface ReactNativeError {
  type:
    | 'component'
    | 'stylesheet'
    | 'props'
    | 'hooks'
    | 'navigation'
    | 'platform'
    | 'unknown';
  component?: string;
  file?: string;
  line?: number;
  message: string;
  stack?: string;
}

/**
 * Parse React Native runtime error output
 */
export function parseReactNativeError(output: string): ReactNativeError[] {
  const errors: ReactNativeError[] = [];

  // Split by error boundaries
  const errorBlocks = output.split(
    /(?=Error:|Warning:|Invariant Violation|Unhandled)/i
  );

  for (const block of errorBlocks) {
    const error = parseRNErrorBlock(block);
    if (error) {
      errors.push(error);
    }
  }

  return errors;
}

/**
 * Parse a single React Native error block
 */
function parseRNErrorBlock(block: string): ReactNativeError | null {
  const lines = block.split('\n').filter((l) => l.trim());
  if (lines.length === 0) return null;

  // Component rendering errors
  const componentMatch = block.match(
    /(?:in|at)\s+(?:component\s+)?([A-Z]\w+)(?:\s+\(at\s+(.+?):(\d+):(\d+)\))?/
  );
  if (componentMatch) {
    return {
      type: 'component',
      component: componentMatch[1],
      file: componentMatch[2],
      line: componentMatch[3] ? parseInt(componentMatch[3], 10) : undefined,
      message: extractMessage(block),
      stack: extractStackTrace(block),
    };
  }

  // StyleSheet errors
  if (block.match(/StyleSheet|style\s+prop/i)) {
    return {
      type: 'stylesheet',
      message: extractMessage(block),
      stack: extractStackTrace(block),
    };
  }

  // Props validation errors
  if (block.match(/(?:Invalid|Failed)\s+prop/i)) {
    return {
      type: 'props',
      message: extractMessage(block),
    };
  }

  // Hooks errors
  if (block.match(/hook|useState|useEffect|useCallback/i)) {
    return {
      type: 'hooks',
      message: extractMessage(block),
      stack: extractStackTrace(block),
    };
  }

  // Navigation errors
  if (
    block.match(
      /navigation|screen|route|navigator|couldn't find.*screen/i
    )
  ) {
    return {
      type: 'navigation',
      message: extractMessage(block),
    };
  }

  // Platform-specific errors
  if (block.match(/Platform\.(?:OS|select)/i)) {
    return {
      type: 'platform',
      message: extractMessage(block),
    };
  }

  // Invariant Violation
  if (block.match(/Invariant Violation/i)) {
    return {
      type: 'unknown',
      message: extractMessage(block),
      stack: extractStackTrace(block),
    };
  }

  return null;
}

/**
 * Extract error message from block
 */
function extractMessage(block: string): string {
  const lines = block.split('\n');

  // Find the first non-empty line that looks like an error message
  for (const line of lines) {
    const trimmed = line.trim();
    if (
      trimmed &&
      !trimmed.startsWith('at ') &&
      !trimmed.startsWith('in ')
    ) {
      // Remove "Error: " prefix if present
      return trimmed.replace(/^(?:Error|Warning):\s*/i, '');
    }
  }

  return lines[0]?.trim() || 'Unknown error';
}

/**
 * Extract stack trace from error block
 */
function extractStackTrace(block: string): string | undefined {
  const lines = block.split('\n');
  const stackLines = lines.filter((l) => l.match(/^\s*(?:at|in)\s+/));
  return stackLines.length > 0 ? stackLines.join('\n') : undefined;
}

/**
 * Get user-friendly description of React Native error type
 */
export function getReactNativeErrorDescription(
  type: ReactNativeError['type']
): string {
  const descriptions: Record<ReactNativeError['type'], string> = {
    component: 'React component error',
    stylesheet: 'StyleSheet or style prop error',
    props: 'Component props validation error',
    hooks: 'React Hooks usage error',
    navigation: 'Navigation/routing error',
    platform: 'Platform-specific code error',
    unknown: 'Unknown React Native error',
  };

  return descriptions[type];
}

/**
 * Common React Native error patterns and their fixes
 */
export const REACT_NATIVE_ERROR_PATTERNS = [
  {
    pattern: /Text strings must be rendered within a <Text> component/i,
    message: 'All text must be wrapped in a <Text> component',
    fix: 'Wrap the text in <Text>...</Text>',
    example: '<Text>Your text here</Text>',
  },
  {
    pattern: /Invalid prop `(.+?)` of type `(.+?)` supplied to `(.+?)`/,
    message: 'Component received incorrect prop type',
    fix: 'Check the prop types being passed to the component',
  },
  {
    pattern: /undefined is not an object \(evaluating '(.+?)'\)/,
    message: 'Attempting to access property on undefined object',
    fix: 'Add null/undefined checks before accessing properties',
    example: 'obj?.property or if (obj) { obj.property }',
  },
  {
    pattern: /Cannot read property '(.+?)' of (null|undefined)/,
    message: 'Attempting to access property on null/undefined',
    fix: 'Add null/undefined checks before accessing properties',
    example: 'obj?.property or if (obj) { obj.property }',
  },
  {
    pattern: /ViewPropTypes.*deprecated/i,
    message: 'ViewPropTypes is deprecated',
    fix: 'Import propTypes from prop-types instead',
    example: "import { ViewProps } from 'react-native';",
  },
  {
    pattern: /Hooks can only be called inside.*function component/i,
    message: 'Hooks must be called at the top level of function components',
    fix: 'Move hook calls outside of conditionals, loops, or nested functions',
  },
  {
    pattern: /Rendered (more|fewer) hooks than during the previous render/i,
    message: 'Hooks must be called in the same order every render',
    fix: 'Ensure hooks are not called conditionally',
  },
  {
    pattern: /The screen '(.+?)' is not in the navigator/i,
    message: 'Screen not registered in navigation',
    fix: 'Register the screen in your navigator configuration',
  },
  {
    pattern: /Cannot update.*unmounted component/i,
    message: 'State update on unmounted component',
    fix: 'Cancel async operations or use cleanup in useEffect',
    example: 'useEffect(() => { let mounted = true; ... return () => { mounted = false; }; }, []);',
  },
];

/**
 * Get suggestion for React Native error from pattern matching
 */
export function getReactNativeErrorSuggestion(message: string): {
  description: string;
  example?: string;
} | null {
  for (const pattern of REACT_NATIVE_ERROR_PATTERNS) {
    if (pattern.pattern.test(message)) {
      return {
        description: pattern.fix,
        example: pattern.example,
      };
    }
  }

  return null;
}

/**
 * Check if React Native error is critical
 */
export function isReactNativeErrorCritical(error: ReactNativeError): boolean {
  // Component and hooks errors are critical
  return (
    error.type === 'component' ||
    error.type === 'hooks' ||
    error.type === 'navigation'
  );
}
