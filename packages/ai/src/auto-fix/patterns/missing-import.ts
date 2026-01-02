/**
 * Pattern 1: Missing import auto-fix
 *
 * Detects: "Cannot find name 'X'" or "X is not defined"
 * Fixes: Adds import statement for the missing symbol
 */

import * as fs from 'fs/promises';
import * as path from 'path';

export interface MissingImportError {
  file: string;
  line: number;
  symbol: string;
  message: string;
}

export interface ImportFix {
  type: 'add-import';
  file: string;
  importStatement: string;
  position: 'after-last-import' | 'start-of-file';
  confidence: number;
}

// Common React Native / Expo imports
const COMMON_IMPORTS: Record<string, { from: string; isDefault?: boolean }> = {
  // React
  'React': { from: 'react', isDefault: true },
  'useState': { from: 'react' },
  'useEffect': { from: 'react' },
  'useCallback': { from: 'react' },
  'useMemo': { from: 'react' },
  'useRef': { from: 'react' },
  'useContext': { from: 'react' },

  // React Native
  'View': { from: 'react-native' },
  'Text': { from: 'react-native' },
  'TouchableOpacity': { from: 'react-native' },
  'ScrollView': { from: 'react-native' },
  'FlatList': { from: 'react-native' },
  'Image': { from: 'react-native' },
  'TextInput': { from: 'react-native' },
  'StyleSheet': { from: 'react-native' },
  'ActivityIndicator': { from: 'react-native' },
  'SafeAreaView': { from: 'react-native' },
  'Pressable': { from: 'react-native' },
  'Modal': { from: 'react-native' },
  'Alert': { from: 'react-native' },
  'Platform': { from: 'react-native' },
  'Dimensions': { from: 'react-native' },

  // Expo
  'StatusBar': { from: 'expo-status-bar' },
  'LinearGradient': { from: 'expo-linear-gradient' },

  // Navigation
  'useNavigation': { from: '@react-navigation/native' },
  'useRoute': { from: '@react-navigation/native' },
  'NavigationContainer': { from: '@react-navigation/native' },
  'useLocalSearchParams': { from: 'expo-router' },
  'useRouter': { from: 'expo-router' },
  'Link': { from: 'expo-router' },
  'Stack': { from: 'expo-router' },
  'Tabs': { from: 'expo-router' },

  // Icons (Lucide)
  'Lucide': { from: 'lucide-react-native' },

  // TanStack Query
  'useQuery': { from: '@tanstack/react-query' },
  'useMutation': { from: '@tanstack/react-query' },
  'useQueryClient': { from: '@tanstack/react-query' },
  'QueryClient': { from: '@tanstack/react-query' },
  'QueryClientProvider': { from: '@tanstack/react-query' },
};

/**
 * Parse missing import error
 */
export function parseMissingImportError(
  message: string,
  file: string,
  line?: number
): MissingImportError | null {
  // TypeScript: "Cannot find name 'useState'"
  const tsMatch = message.match(/Cannot find name ['"](.+?)['"]/);
  if (tsMatch) {
    return { file, line: line || 0, symbol: tsMatch[1], message };
  }

  // ESLint: "'useState' is not defined"
  const eslintMatch = message.match(/['"](.+?)['"] is not defined/);
  if (eslintMatch) {
    return { file, line: line || 0, symbol: eslintMatch[1], message };
  }

  // JSX: "React/JSX element 'View' has no corresponding..."
  const jsxMatch = message.match(/JSX element ['"](.+?)['"]/);
  if (jsxMatch) {
    return { file, line: line || 0, symbol: jsxMatch[1], message };
  }

  return null;
}

/**
 * Find where symbol is exported in the project
 */
export async function findSymbolExport(
  symbol: string,
  projectRoot: string
): Promise<{ file: string; isDefault: boolean } | null> {
  // First check common imports
  if (COMMON_IMPORTS[symbol]) {
    return {
      file: COMMON_IMPORTS[symbol].from,
      isDefault: COMMON_IMPORTS[symbol].isDefault || false,
    };
  }

  // Search project for export
  const searchPaths = [
    `${projectRoot}/src/components`,
    `${projectRoot}/src/hooks`,
    `${projectRoot}/src/services`,
    `${projectRoot}/src/utils`,
    `${projectRoot}/src/types`,
  ];

  for (const searchPath of searchPaths) {
    try {
      const files = await findFilesRecursive(searchPath);
      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8');

        // Check for named export
        if (new RegExp(`export\\s+(const|function|class|interface|type)\\s+${symbol}\\b`).test(content)) {
          return { file: path.relative(projectRoot, file), isDefault: false };
        }

        // Check for export { symbol }
        if (new RegExp(`export\\s*\\{[^}]*\\b${symbol}\\b[^}]*\\}`).test(content)) {
          return { file: path.relative(projectRoot, file), isDefault: false };
        }

        // Check for default export
        if (new RegExp(`export\\s+default\\s+(class|function)?\\s*${symbol}\\b`).test(content)) {
          return { file: path.relative(projectRoot, file), isDefault: true };
        }
      }
    } catch {
      // Directory doesn't exist
    }
  }

  return null;
}

/**
 * Generate import fix for missing symbol
 */
export async function generateMissingImportFix(
  error: MissingImportError,
  projectRoot: string
): Promise<ImportFix | null> {
  const exportSource = await findSymbolExport(error.symbol, projectRoot);

  if (!exportSource) {
    return null; // Can't determine source
  }

  // Calculate import path
  let importPath = exportSource.file;

  // If it's a relative path (project file), calculate relative import
  if (!importPath.startsWith('@') && !importPath.includes('/')) {
    // It's a package import, use as-is
  } else if (importPath.startsWith('src/')) {
    // Convert to relative path from the error file
    const errorDir = path.dirname(path.join(projectRoot, error.file));
    const targetPath = path.join(projectRoot, importPath);
    importPath = path.relative(errorDir, targetPath);

    // Ensure it starts with ./
    if (!importPath.startsWith('.')) {
      importPath = './' + importPath;
    }

    // Remove extension
    importPath = importPath.replace(/\.(ts|tsx|js|jsx)$/, '');
  }

  // Generate import statement
  const importStatement = exportSource.isDefault
    ? `import ${error.symbol} from '${importPath}';`
    : `import { ${error.symbol} } from '${importPath}';`;

  return {
    type: 'add-import',
    file: error.file,
    importStatement,
    position: 'after-last-import',
    confidence: COMMON_IMPORTS[error.symbol] ? 0.99 : 0.85,
  };
}

/**
 * Apply missing import fix to file
 */
export async function applyMissingImportFix(
  fix: ImportFix,
  projectRoot: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const filePath = path.join(projectRoot, fix.file);
    let content = await fs.readFile(filePath, 'utf-8');

    // Check if already imported
    if (content.includes(fix.importStatement)) {
      return { success: true }; // Already has the import
    }

    // Find position to insert import
    const lines = content.split('\n');
    let insertIndex = 0;

    // Find last import statement
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('import ')) {
        insertIndex = i + 1;
      }
    }

    // Insert import
    lines.splice(insertIndex, 0, fix.importStatement);
    content = lines.join('\n');

    await fs.writeFile(filePath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// Helper function
async function findFilesRecursive(dir: string): Promise<string[]> {
  const files: string[] = [];
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...await findFilesRecursive(fullPath));
      } else if (entry.name.match(/\.(ts|tsx)$/)) {
        files.push(fullPath);
      }
    }
  } catch {
    // Directory doesn't exist
  }
  return files;
}
