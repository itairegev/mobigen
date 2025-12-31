import * as fs from 'fs';
import * as path from 'path';
import type { Validator, ValidatorConfig, StageResult, ValidationError } from '../types';

/**
 * Navigation Validator
 *
 * Validates React Navigation route graph:
 * - All registered routes have corresponding screen files
 * - All screen files are registered in navigation
 * - Navigation structure is valid
 */
export const navigationValidator: Validator = {
  name: 'navigation',
  tier: 'tier1',

  async run(config: ValidatorConfig): Promise<StageResult> {
    const start = Date.now();
    const errors: ValidationError[] = [];
    const srcPath = path.join(config.projectPath, 'src');
    const appPath = path.join(config.projectPath, 'app');

    try {
      // Determine project structure (app router vs src/screens)
      const isAppRouter = fs.existsSync(appPath);
      const screensPath = isAppRouter
        ? appPath
        : path.join(srcPath, 'screens');

      if (!fs.existsSync(screensPath)) {
        return {
          name: 'navigation',
          passed: true,
          duration: Date.now() - start,
          errors: [],
          output: 'No screens directory found - skipping navigation validation',
        };
      }

      // Find all screen files
      const screenFiles = await findScreenFiles(screensPath, isAppRouter);
      const declaredScreens = new Set(screenFiles.map(f => getScreenName(f, screensPath, isAppRouter)));

      // Find navigation configuration
      const navConfig = await findNavigationConfig(config.projectPath, isAppRouter);

      if (!navConfig) {
        // No navigation config found - might be using app router which is self-routing
        if (isAppRouter) {
          return {
            name: 'navigation',
            passed: true,
            duration: Date.now() - start,
            errors: [],
            output: 'Using Expo Router - navigation is file-based',
          };
        }

        errors.push({
          file: config.projectPath,
          message: 'No navigation configuration found',
          severity: 'warning',
        });

        return {
          name: 'navigation',
          passed: true, // Warning only
          duration: Date.now() - start,
          errors,
        };
      }

      // Extract registered routes from navigation config
      const registeredRoutes = extractRegisteredRoutes(navConfig.content);

      // Check for unregistered screens
      for (const screen of declaredScreens) {
        if (screen.startsWith('_') || screen === 'index') continue; // Skip layout files and index

        if (!registeredRoutes.has(screen) && !isAppRouter) {
          errors.push({
            file: path.join(screensPath, `${screen}.tsx`),
            message: `Screen "${screen}" is not registered in navigation`,
            severity: 'warning',
          });
        }
      }

      // Check for missing screen files (only for non-app-router projects)
      if (!isAppRouter) {
        for (const route of registeredRoutes) {
          if (!declaredScreens.has(route)) {
            errors.push({
              file: navConfig.file,
              message: `Route "${route}" references non-existent screen`,
              severity: 'error',
            });
          }
        }
      }

      // Check for valid navigation structure
      const structureErrors = validateNavigationStructure(navConfig.content, navConfig.file);
      errors.push(...structureErrors);

      const hasErrors = errors.some(e => e.severity === 'error');

      return {
        name: 'navigation',
        passed: !hasErrors,
        duration: Date.now() - start,
        errors,
        output: `Found ${declaredScreens.size} screens, ${registeredRoutes.size} registered routes`,
      };
    } catch (error) {
      return {
        name: 'navigation',
        passed: false,
        duration: Date.now() - start,
        errors: [{
          file: config.projectPath,
          message: `Navigation validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'error',
        }],
      };
    }
  },
};

/**
 * Find all screen files in the project
 */
async function findScreenFiles(screensPath: string, isAppRouter: boolean): Promise<string[]> {
  const files: string[] = [];

  function walkDir(dir: string) {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip node_modules and hidden directories
        if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
        walkDir(fullPath);
      } else if (entry.isFile()) {
        // Include .tsx and .ts files that look like screens
        if (entry.name.match(/\.(tsx|ts)$/) && !entry.name.match(/\.(test|spec|styles?)\./)) {
          files.push(fullPath);
        }
      }
    }
  }

  walkDir(screensPath);
  return files;
}

/**
 * Get screen name from file path
 */
function getScreenName(filePath: string, basePath: string, isAppRouter: boolean): string {
  const relativePath = path.relative(basePath, filePath);
  const parsed = path.parse(relativePath);

  // For app router, use the directory structure
  if (isAppRouter) {
    return parsed.dir ? `${parsed.dir}/${parsed.name}` : parsed.name;
  }

  // For traditional screens, use the file name or directory name
  if (parsed.name === 'index') {
    return path.basename(parsed.dir);
  }

  return parsed.name;
}

/**
 * Find navigation configuration file
 */
async function findNavigationConfig(
  projectPath: string,
  isAppRouter: boolean
): Promise<{ file: string; content: string } | null> {
  const possibleFiles = isAppRouter
    ? ['app/_layout.tsx', 'app/_layout.ts']
    : [
        'src/navigation/index.tsx',
        'src/navigation/index.ts',
        'src/navigation/AppNavigator.tsx',
        'src/navigation/RootNavigator.tsx',
        'src/Navigator.tsx',
        'App.tsx',
      ];

  for (const file of possibleFiles) {
    const fullPath = path.join(projectPath, file);
    if (fs.existsSync(fullPath)) {
      return {
        file: fullPath,
        content: fs.readFileSync(fullPath, 'utf-8'),
      };
    }
  }

  return null;
}

/**
 * Extract registered routes from navigation config content
 */
function extractRegisteredRoutes(content: string): Set<string> {
  const routes = new Set<string>();

  // Match Stack.Screen, Tab.Screen, Drawer.Screen definitions
  const screenPattern = /<(?:Stack|Tab|Drawer)\.Screen[^>]*name=["']([^"']+)["']/g;
  let match;
  while ((match = screenPattern.exec(content)) !== null) {
    routes.add(match[1]);
  }

  // Match createStackNavigator/createBottomTabNavigator route objects
  const routeObjectPattern = /["']?(\w+)["']?\s*:\s*\{[^}]*screen\s*:/g;
  while ((match = routeObjectPattern.exec(content)) !== null) {
    routes.add(match[1]);
  }

  // Match Expo Router Stack.Screen/Tabs.Screen with name prop
  const expoRouterPattern = /<(?:Stack|Tabs)\.Screen[^>]*name=["']([^"']+)["']/g;
  while ((match = expoRouterPattern.exec(content)) !== null) {
    routes.add(match[1]);
  }

  return routes;
}

/**
 * Validate navigation structure for common issues
 */
function validateNavigationStructure(content: string, file: string): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check for NavigationContainer (required for React Navigation)
  if (content.includes('@react-navigation') && !content.includes('NavigationContainer')) {
    // Check if it might be wrapped elsewhere
    if (!content.includes('useNavigation') && !content.includes('navigation.')) {
      errors.push({
        file,
        message: 'NavigationContainer may be missing - ensure app is wrapped in NavigationContainer',
        severity: 'warning',
      });
    }
  }

  // Check for duplicate screen names
  const screenNames: string[] = [];
  const screenPattern = /name=["']([^"']+)["']/g;
  let match;
  while ((match = screenPattern.exec(content)) !== null) {
    if (screenNames.includes(match[1])) {
      errors.push({
        file,
        message: `Duplicate screen name: "${match[1]}"`,
        severity: 'error',
      });
    }
    screenNames.push(match[1]);
  }

  // Check for missing initialRouteName when using Stack/Tab navigators
  if (content.includes('createStackNavigator') || content.includes('createBottomTabNavigator')) {
    if (!content.includes('initialRouteName')) {
      errors.push({
        file,
        message: 'Consider adding initialRouteName to navigator options',
        severity: 'warning',
      });
    }
  }

  return errors;
}
