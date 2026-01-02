/**
 * Pattern 2: Unregistered navigation route fix
 *
 * Detects: Screen exists but not registered in navigation
 * Fixes: Adds screen registration to navigation config
 */

import * as fs from 'fs/promises';
import * as path from 'path';

export interface UnregisteredRouteError {
  file: string;
  screenName: string;
  screenPath: string;
  message: string;
}

export interface RouteFix {
  type: 'add-route';
  navigationFile: string;
  screenName: string;
  screenPath: string;
  navigatorType: 'stack' | 'tab' | 'drawer';
  code: string;
  confidence: number;
}

/**
 * Parse unregistered route error
 */
export function parseUnregisteredRouteError(
  message: string,
  file: string
): UnregisteredRouteError | null {
  // Pattern: "Screen 'X' is not registered in navigation"
  const match = message.match(/Screen ['"](.+?)['"] is not registered/);
  if (match) {
    return {
      file,
      screenName: match[1],
      screenPath: file,
      message,
    };
  }

  return null;
}

/**
 * Find navigation config files
 */
export async function findNavigationFiles(
  projectRoot: string
): Promise<{ file: string; type: 'stack' | 'tab' | 'drawer' }[]> {
  const possiblePaths = [
    { path: 'app/_layout.tsx', type: 'stack' as const },
    { path: 'app/(tabs)/_layout.tsx', type: 'tab' as const },
    { path: 'src/navigation/index.tsx', type: 'stack' as const },
    { path: 'src/navigation/AppNavigator.tsx', type: 'stack' as const },
    { path: 'src/navigation/TabNavigator.tsx', type: 'tab' as const },
  ];

  const found: { file: string; type: 'stack' | 'tab' | 'drawer' }[] = [];

  for (const { path: p, type } of possiblePaths) {
    const fullPath = path.join(projectRoot, p);
    try {
      await fs.access(fullPath);
      found.push({ file: p, type });
    } catch {
      // Doesn't exist
    }
  }

  return found;
}

/**
 * Determine which navigator a screen should be added to
 */
export function determineNavigator(
  screenPath: string,
  navFiles: { file: string; type: 'stack' | 'tab' | 'drawer' }[]
): { file: string; type: 'stack' | 'tab' | 'drawer' } | null {
  // If screen is in (tabs) directory, add to tab navigator
  if (screenPath.includes('(tabs)')) {
    const tabNav = navFiles.find(f => f.type === 'tab');
    if (tabNav) return tabNav;
  }

  // Default to first stack navigator
  return navFiles.find(f => f.type === 'stack') || navFiles[0] || null;
}

/**
 * Generate route registration code
 */
export async function generateRouteRegistration(
  error: UnregisteredRouteError,
  projectRoot: string
): Promise<RouteFix | null> {
  const navFiles = await findNavigationFiles(projectRoot);
  if (navFiles.length === 0) {
    return null;
  }

  const navigator = determineNavigator(error.screenPath, navFiles);
  if (!navigator) {
    return null;
  }

  // Read navigation file to determine how to add
  const navFilePath = path.join(projectRoot, navigator.file);
  const navContent = await fs.readFile(navFilePath, 'utf-8');

  // For Expo Router, no explicit registration needed (file-based)
  if (navigator.file.includes('app/')) {
    return {
      type: 'add-route',
      navigationFile: navigator.file,
      screenName: error.screenName,
      screenPath: error.screenPath,
      navigatorType: navigator.type,
      code: '', // No code needed for Expo Router
      confidence: 0.95,
    };
  }

  // For React Navigation, generate Screen component
  const screenImport = generateScreenImport(error.screenName, error.screenPath, navigator.file, projectRoot);
  const screenComponent = generateScreenComponent(error.screenName, navigator.type);

  return {
    type: 'add-route',
    navigationFile: navigator.file,
    screenName: error.screenName,
    screenPath: error.screenPath,
    navigatorType: navigator.type,
    code: `${screenImport}\n${screenComponent}`,
    confidence: 0.85,
  };
}

/**
 * Generate import statement for screen
 */
function generateScreenImport(
  screenName: string,
  screenPath: string,
  navFile: string,
  projectRoot: string
): string {
  const navDir = path.dirname(path.join(projectRoot, navFile));
  const screenFullPath = path.join(projectRoot, screenPath);
  let importPath = path.relative(navDir, screenFullPath);

  if (!importPath.startsWith('.')) {
    importPath = './' + importPath;
  }
  importPath = importPath.replace(/\.(ts|tsx)$/, '');

  return `import ${screenName}Screen from '${importPath}';`;
}

/**
 * Generate screen component registration
 */
function generateScreenComponent(
  screenName: string,
  navigatorType: 'stack' | 'tab' | 'drawer'
): string {
  const prefix = navigatorType === 'stack' ? 'Stack'
    : navigatorType === 'tab' ? 'Tab'
    : 'Drawer';

  return `<${prefix}.Screen name="${screenName}" component={${screenName}Screen} />`;
}

/**
 * Apply route fix to navigation file
 */
export async function applyRoutefix(
  fix: RouteFix,
  projectRoot: string
): Promise<{ success: boolean; error?: string }> {
  if (!fix.code) {
    // Expo Router - no action needed
    return { success: true };
  }

  try {
    const navPath = path.join(projectRoot, fix.navigationFile);
    let content = await fs.readFile(navPath, 'utf-8');

    // Check if already registered
    if (content.includes(`name="${fix.screenName}"`)) {
      return { success: true };
    }

    // Find insertion points
    const lines = content.split('\n');

    // Add import after last import
    const [importStatement, screenComponent] = fix.code.split('\n');
    let importInsertIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('import ')) {
        importInsertIndex = i + 1;
      }
    }
    lines.splice(importInsertIndex, 0, importStatement);

    // Add screen component before closing navigator tag
    const closingTags = ['</Stack.Navigator>', '</Tab.Navigator>', '</Drawer.Navigator>'];
    for (let i = lines.length - 1; i >= 0; i--) {
      if (closingTags.some(tag => lines[i].includes(tag))) {
        lines.splice(i, 0, `        ${screenComponent}`);
        break;
      }
    }

    content = lines.join('\n');
    await fs.writeFile(navPath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
