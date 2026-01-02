/**
 * Documentation link enricher
 *
 * Adds links to relevant documentation for errors
 */

export interface DocLink {
  title: string;
  url: string;
  description: string;
}

/**
 * TypeScript error documentation links
 */
const TYPESCRIPT_DOCS: Record<string, DocLink[]> = {
  'TS2304': [
    {
      title: 'TypeScript - Module Resolution',
      url: 'https://www.typescriptlang.org/docs/handbook/module-resolution.html',
      description: 'Learn how TypeScript resolves imports',
    },
  ],

  'TS2307': [
    {
      title: 'TypeScript - Modules',
      url: 'https://www.typescriptlang.org/docs/handbook/modules.html',
      description: 'Understanding module imports and exports',
    },
  ],

  'TS2322': [
    {
      title: 'TypeScript - Type Compatibility',
      url: 'https://www.typescriptlang.org/docs/handbook/type-compatibility.html',
      description: 'Learn about type assignability',
    },
  ],

  'TS2339': [
    {
      title: 'TypeScript - Type Narrowing',
      url: 'https://www.typescriptlang.org/docs/handbook/2/narrowing.html',
      description: 'How to narrow types and access properties safely',
    },
  ],

  'TS2532': [
    {
      title: 'TypeScript - Strict Null Checks',
      url: 'https://www.typescriptlang.org/docs/handbook/2/narrowing.html#truthiness-narrowing',
      description: 'Handling potentially undefined values',
    },
  ],
};

/**
 * ESLint/React error documentation links
 */
const ESLINT_DOCS: Record<string, DocLink[]> = {
  'react-hooks/rules-of-hooks': [
    {
      title: 'Rules of Hooks',
      url: 'https://react.dev/reference/rules/rules-of-hooks',
      description: 'Official React documentation on hook rules',
    },
  ],

  'react-hooks/exhaustive-deps': [
    {
      title: 'useEffect Dependencies',
      url: 'https://react.dev/reference/react/useEffect#specifying-reactive-dependencies',
      description: 'Understanding effect dependencies',
    },
  ],

  'react/jsx-no-undef': [
    {
      title: 'JSX In Depth',
      url: 'https://react.dev/reference/react/Component',
      description: 'Learn about JSX and components',
    },
  ],
};

/**
 * React Native specific documentation
 */
const REACT_NATIVE_DOCS: DocLink[] = [
  {
    title: 'React Native - Getting Started',
    url: 'https://reactnative.dev/docs/getting-started',
    description: 'React Native documentation',
  },
  {
    title: 'Expo Documentation',
    url: 'https://docs.expo.dev/',
    description: 'Expo SDK documentation',
  },
];

/**
 * Navigation documentation
 */
const NAVIGATION_DOCS: DocLink[] = [
  {
    title: 'Expo Router',
    url: 'https://docs.expo.dev/router/introduction/',
    description: 'File-based routing for Expo apps',
  },
  {
    title: 'React Navigation',
    url: 'https://reactnavigation.org/docs/getting-started',
    description: 'Navigation library documentation',
  },
];

/**
 * Get documentation links for TypeScript error
 */
export function getTypeScriptDocLinks(code: string): DocLink[] {
  return TYPESCRIPT_DOCS[code] || [];
}

/**
 * Get documentation links for ESLint error
 */
export function getESLintDocLinks(ruleId: string): DocLink[] {
  return ESLINT_DOCS[ruleId] || [];
}

/**
 * Get documentation links based on error context
 */
export function getContextualDocLinks(
  message: string,
  file: string
): DocLink[] {
  const links: DocLink[] = [];

  // React Native/Expo specific
  if (file.includes('app/') || message.includes('expo-router')) {
    links.push(...NAVIGATION_DOCS);
  }

  if (message.includes('react-native') || message.includes('View') || message.includes('Text')) {
    links.push(...REACT_NATIVE_DOCS);
  }

  // Hook-related
  if (message.includes('hook') || message.includes('useState') || message.includes('useEffect')) {
    links.push({
      title: 'React Hooks Reference',
      url: 'https://react.dev/reference/react/hooks',
      description: 'Complete hooks API reference',
    });
  }

  // Navigation-related
  if (message.includes('navigation') || message.includes('screen') || message.includes('route')) {
    links.push(...NAVIGATION_DOCS);
  }

  return links;
}

/**
 * Format documentation links for display
 */
export function formatDocLinks(links: DocLink[]): string {
  if (links.length === 0) return '';

  const lines = ['Documentation:'];

  for (const link of links) {
    lines.push(`  - ${link.title}`);
    lines.push(`    ${link.url}`);
    lines.push(`    ${link.description}`);
  }

  return lines.join('\n');
}
