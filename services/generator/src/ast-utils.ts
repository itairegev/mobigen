/**
 * AST Utilities for Code Analysis
 * Uses TypeScript compiler API and @babel/parser for React Native code analysis
 */

import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Types
// ============================================================================

export interface ComponentInfo {
  name: string;
  filePath: string;
  type: 'function' | 'arrow' | 'class';
  props: PropInfo[];
  hooks: string[];
  imports: ImportInfo[];
  exports: ExportInfo[];
  jsxElements: string[];
  hasDefaultExport: boolean;
}

export interface PropInfo {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: string;
}

export interface ImportInfo {
  source: string;
  specifiers: string[];
  isDefault: boolean;
  isNamespace: boolean;
}

export interface ExportInfo {
  name: string;
  isDefault: boolean;
  type: 'function' | 'const' | 'class' | 'type' | 'interface';
}

export interface NavigationRoute {
  name: string;
  screen: string;
  filePath: string;
  params?: Record<string, string>;
}

export interface ProjectStructure {
  screens: ComponentInfo[];
  components: ComponentInfo[];
  hooks: HookInfo[];
  services: ServiceInfo[];
  navigation: NavigationInfo;
  types: TypeInfo[];
}

export interface HookInfo {
  name: string;
  filePath: string;
  dependencies: string[];
  returnType: string;
}

export interface ServiceInfo {
  name: string;
  filePath: string;
  functions: FunctionInfo[];
}

export interface FunctionInfo {
  name: string;
  params: { name: string; type: string }[];
  returnType: string;
  isAsync: boolean;
}

export interface NavigationInfo {
  type: 'stack' | 'tab' | 'drawer' | 'mixed';
  routes: NavigationRoute[];
  nestedNavigators: NavigationInfo[];
}

export interface TypeInfo {
  name: string;
  filePath: string;
  kind: 'type' | 'interface' | 'enum';
  properties?: { name: string; type: string }[];
}

// ============================================================================
// AST Parser
// ============================================================================

export class ASTParser {
  private program: ts.Program | null = null;
  private checker: ts.TypeChecker | null = null;

  /**
   * Initialize parser with project path
   */
  initialize(projectPath: string): void {
    const configPath = ts.findConfigFile(projectPath, ts.sys.fileExists, 'tsconfig.json');

    if (configPath) {
      const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
      const parsedConfig = ts.parseJsonConfigFileContent(
        configFile.config,
        ts.sys,
        path.dirname(configPath)
      );

      this.program = ts.createProgram(parsedConfig.fileNames, parsedConfig.options);
      this.checker = this.program.getTypeChecker();
    }
  }

  /**
   * Parse a single TypeScript/TSX file
   */
  parseFile(filePath: string): ComponentInfo | null {
    const content = fs.readFileSync(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true,
      filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );

    const result: ComponentInfo = {
      name: path.basename(filePath, path.extname(filePath)),
      filePath,
      type: 'function',
      props: [],
      hooks: [],
      imports: [],
      exports: [],
      jsxElements: [],
      hasDefaultExport: false,
    };

    this.visitNode(sourceFile, result);
    return result;
  }

  private visitNode(node: ts.Node, result: ComponentInfo): void {
    // Extract imports
    if (ts.isImportDeclaration(node)) {
      const importInfo = this.extractImport(node);
      if (importInfo) result.imports.push(importInfo);
    }

    // Extract exports
    if (ts.isExportDeclaration(node) || ts.isExportAssignment(node)) {
      result.hasDefaultExport = result.hasDefaultExport || ts.isExportAssignment(node);
    }

    // Extract function declarations (components)
    if (ts.isFunctionDeclaration(node) && node.name) {
      const name = node.name.getText();
      if (this.isComponentName(name)) {
        result.type = 'function';
        result.name = name;

        // Check for default export
        if (node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword &&
            node.modifiers?.some(m => m.kind === ts.SyntaxKind.DefaultKeyword))) {
          result.hasDefaultExport = true;
        }
      }
    }

    // Extract arrow function components
    if (ts.isVariableStatement(node)) {
      node.declarationList.declarations.forEach(decl => {
        if (ts.isIdentifier(decl.name) && decl.initializer) {
          if (ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer)) {
            const name = decl.name.getText();
            if (this.isComponentName(name)) {
              result.type = 'arrow';
              result.name = name;
            }
          }
        }
      });
    }

    // Extract hook calls
    if (ts.isCallExpression(node)) {
      const expression = node.expression;
      if (ts.isIdentifier(expression)) {
        const name = expression.getText();
        if (name.startsWith('use')) {
          result.hooks.push(name);
        }
      }
    }

    // Extract JSX elements
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tagName = ts.isJsxOpeningElement(node)
        ? node.tagName.getText()
        : node.tagName.getText();
      if (!result.jsxElements.includes(tagName)) {
        result.jsxElements.push(tagName);
      }
    }

    ts.forEachChild(node, child => this.visitNode(child, result));
  }

  private extractImport(node: ts.ImportDeclaration): ImportInfo | null {
    const moduleSpecifier = node.moduleSpecifier;
    if (!ts.isStringLiteral(moduleSpecifier)) return null;

    const source = moduleSpecifier.text;
    const specifiers: string[] = [];
    let isDefault = false;
    let isNamespace = false;

    if (node.importClause) {
      // Default import
      if (node.importClause.name) {
        specifiers.push(node.importClause.name.getText());
        isDefault = true;
      }

      // Named imports
      if (node.importClause.namedBindings) {
        if (ts.isNamespaceImport(node.importClause.namedBindings)) {
          specifiers.push(node.importClause.namedBindings.name.getText());
          isNamespace = true;
        } else if (ts.isNamedImports(node.importClause.namedBindings)) {
          node.importClause.namedBindings.elements.forEach(element => {
            specifiers.push(element.name.getText());
          });
        }
      }
    }

    return { source, specifiers, isDefault, isNamespace };
  }

  private isComponentName(name: string): boolean {
    // React component names start with uppercase
    return /^[A-Z]/.test(name);
  }
}

// ============================================================================
// Project Analyzer
// ============================================================================

export class ProjectAnalyzer {
  private parser: ASTParser;
  private projectPath: string;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
    this.parser = new ASTParser();
    this.parser.initialize(projectPath);
  }

  /**
   * Analyze entire project structure
   */
  async analyzeProject(): Promise<ProjectStructure> {
    const structure: ProjectStructure = {
      screens: [],
      components: [],
      hooks: [],
      services: [],
      navigation: { type: 'stack', routes: [], nestedNavigators: [] },
      types: [],
    };

    // Analyze screens
    const screensPath = path.join(this.projectPath, 'src', 'screens');
    if (fs.existsSync(screensPath)) {
      structure.screens = await this.analyzeDirectory(screensPath);
    }

    // Also check app/ directory for Expo Router
    const appPath = path.join(this.projectPath, 'app');
    if (fs.existsSync(appPath)) {
      const appScreens = await this.analyzeDirectory(appPath);
      structure.screens.push(...appScreens);
    }

    // Analyze components
    const componentsPath = path.join(this.projectPath, 'src', 'components');
    if (fs.existsSync(componentsPath)) {
      structure.components = await this.analyzeDirectory(componentsPath);
    }

    // Analyze hooks
    const hooksPath = path.join(this.projectPath, 'src', 'hooks');
    if (fs.existsSync(hooksPath)) {
      structure.hooks = await this.analyzeHooks(hooksPath);
    }

    // Analyze services
    const servicesPath = path.join(this.projectPath, 'src', 'services');
    if (fs.existsSync(servicesPath)) {
      structure.services = await this.analyzeServices(servicesPath);
    }

    // Analyze navigation
    structure.navigation = await this.analyzeNavigation();

    // Analyze types
    const typesPath = path.join(this.projectPath, 'src', 'types');
    if (fs.existsSync(typesPath)) {
      structure.types = await this.analyzeTypes(typesPath);
    }

    return structure;
  }

  private async analyzeDirectory(dirPath: string): Promise<ComponentInfo[]> {
    const components: ComponentInfo[] = [];
    const files = this.getTypeScriptFiles(dirPath);

    for (const file of files) {
      const info = this.parser.parseFile(file);
      if (info) components.push(info);
    }

    return components;
  }

  private async analyzeHooks(dirPath: string): Promise<HookInfo[]> {
    const hooks: HookInfo[] = [];
    const files = this.getTypeScriptFiles(dirPath);

    for (const file of files) {
      const info = this.parser.parseFile(file);
      if (info) {
        hooks.push({
          name: info.name,
          filePath: file,
          dependencies: info.hooks,
          returnType: 'unknown', // Would need deeper analysis
        });
      }
    }

    return hooks;
  }

  private async analyzeServices(dirPath: string): Promise<ServiceInfo[]> {
    const services: ServiceInfo[] = [];
    const files = this.getTypeScriptFiles(dirPath);

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const sourceFile = ts.createSourceFile(
        file,
        content,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TS
      );

      const functions: FunctionInfo[] = [];

      const visit = (node: ts.Node) => {
        if (ts.isFunctionDeclaration(node) && node.name) {
          functions.push({
            name: node.name.getText(),
            params: node.parameters.map(p => ({
              name: p.name.getText(),
              type: p.type?.getText() || 'any',
            })),
            returnType: node.type?.getText() || 'void',
            isAsync: node.modifiers?.some(m => m.kind === ts.SyntaxKind.AsyncKeyword) || false,
          });
        }
        ts.forEachChild(node, visit);
      };

      visit(sourceFile);

      services.push({
        name: path.basename(file, path.extname(file)),
        filePath: file,
        functions,
      });
    }

    return services;
  }

  private async analyzeNavigation(): Promise<NavigationInfo> {
    const navInfo: NavigationInfo = {
      type: 'stack',
      routes: [],
      nestedNavigators: [],
    };

    // Check for Expo Router (app/ directory structure)
    const appPath = path.join(this.projectPath, 'app');
    if (fs.existsSync(appPath)) {
      navInfo.routes = this.extractExpoRouterRoutes(appPath);
      navInfo.type = 'mixed'; // Expo Router often uses mixed navigation
      return navInfo;
    }

    // Check for React Navigation config
    const possibleNavFiles = [
      path.join(this.projectPath, 'src', 'navigation', 'index.tsx'),
      path.join(this.projectPath, 'src', 'navigation', 'AppNavigator.tsx'),
      path.join(this.projectPath, 'src', 'navigation', 'RootNavigator.tsx'),
    ];

    for (const navFile of possibleNavFiles) {
      if (fs.existsSync(navFile)) {
        const routes = this.extractReactNavigationRoutes(navFile);
        navInfo.routes.push(...routes);
      }
    }

    return navInfo;
  }

  private extractExpoRouterRoutes(appPath: string, prefix = ''): NavigationRoute[] {
    const routes: NavigationRoute[] = [];
    const entries = fs.readdirSync(appPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        // Skip special directories
        if (entry.name.startsWith('_') || entry.name === 'node_modules') continue;

        const nestedRoutes = this.extractExpoRouterRoutes(
          path.join(appPath, entry.name),
          `${prefix}/${entry.name}`
        );
        routes.push(...nestedRoutes);
      } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
        const routeName = entry.name.replace(/\.(tsx|ts)$/, '');

        // Skip layout files
        if (routeName === '_layout') continue;

        const routePath = routeName === 'index'
          ? prefix || '/'
          : `${prefix}/${routeName}`;

        routes.push({
          name: routeName,
          screen: routeName,
          filePath: path.join(appPath, entry.name),
          params: routeName.startsWith('[') ? { dynamic: routeName } : undefined,
        });
      }
    }

    return routes;
  }

  private extractReactNavigationRoutes(navFile: string): NavigationRoute[] {
    const routes: NavigationRoute[] = [];
    const content = fs.readFileSync(navFile, 'utf-8');

    // Match Stack.Screen, Tab.Screen, etc.
    const screenRegex = /<(?:Stack|Tab|Drawer)\.Screen\s+name=["']([^"']+)["']\s+component=\{([^}]+)\}/g;
    let match;

    while ((match = screenRegex.exec(content)) !== null) {
      routes.push({
        name: match[1],
        screen: match[2],
        filePath: navFile,
      });
    }

    return routes;
  }

  private async analyzeTypes(dirPath: string): Promise<TypeInfo[]> {
    const types: TypeInfo[] = [];
    const files = this.getTypeScriptFiles(dirPath);

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const sourceFile = ts.createSourceFile(
        file,
        content,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TS
      );

      const visit = (node: ts.Node) => {
        if (ts.isInterfaceDeclaration(node)) {
          types.push({
            name: node.name.getText(),
            filePath: file,
            kind: 'interface',
            properties: node.members
              .filter(ts.isPropertySignature)
              .map(p => ({
                name: p.name.getText(),
                type: p.type?.getText() || 'any',
              })),
          });
        }

        if (ts.isTypeAliasDeclaration(node)) {
          types.push({
            name: node.name.getText(),
            filePath: file,
            kind: 'type',
          });
        }

        if (ts.isEnumDeclaration(node)) {
          types.push({
            name: node.name.getText(),
            filePath: file,
            kind: 'enum',
          });
        }

        ts.forEachChild(node, visit);
      };

      visit(sourceFile);
    }

    return types;
  }

  private getTypeScriptFiles(dirPath: string): string[] {
    const files: string[] = [];

    const walk = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          walk(fullPath);
        } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
          files.push(fullPath);
        }
      }
    };

    walk(dirPath);
    return files;
  }
}

// ============================================================================
// LLM Context Generator
// ============================================================================

export class LLMContextGenerator {
  private analyzer: ProjectAnalyzer;

  constructor(projectPath: string) {
    this.analyzer = new ProjectAnalyzer(projectPath);
  }

  /**
   * Generate compressed context for LLM consumption
   * This is much more efficient than sending raw file contents
   */
  async generateContext(): Promise<string> {
    const structure = await this.analyzer.analyzeProject();

    return `
## Project Structure

### Screens (${structure.screens.length})
${structure.screens.map(s => `- **${s.name}** (${s.filePath})
  - Hooks: ${s.hooks.join(', ') || 'none'}
  - JSX: ${s.jsxElements.slice(0, 5).join(', ')}${s.jsxElements.length > 5 ? '...' : ''}`).join('\n')}

### Components (${structure.components.length})
${structure.components.map(c => `- **${c.name}**: uses ${c.hooks.length} hooks, renders ${c.jsxElements.length} elements`).join('\n')}

### Hooks (${structure.hooks.length})
${structure.hooks.map(h => `- **${h.name}**: depends on [${h.dependencies.join(', ')}]`).join('\n')}

### Services (${structure.services.length})
${structure.services.map(s => `- **${s.name}**: ${s.functions.map(f => `${f.name}(${f.isAsync ? 'async' : ''})`).join(', ')}`).join('\n')}

### Navigation (${structure.navigation.type})
Routes:
${structure.navigation.routes.map(r => `- ${r.name} -> ${r.screen}`).join('\n')}

### Types (${structure.types.length})
${structure.types.map(t => `- ${t.kind} ${t.name}`).join('\n')}
`.trim();
  }

  /**
   * Generate minimal context for specific file modification
   */
  async generateFileContext(filePath: string): Promise<string> {
    const parser = new ASTParser();
    const info = parser.parseFile(filePath);

    if (!info) return '';

    return `
## File: ${info.name}

**Imports:**
${info.imports.map(i => `- ${i.specifiers.join(', ')} from '${i.source}'`).join('\n')}

**Hooks Used:** ${info.hooks.join(', ') || 'none'}

**JSX Elements:** ${info.jsxElements.join(', ')}

**Has Default Export:** ${info.hasDefaultExport}
`.trim();
  }

  /**
   * Generate dependency graph for understanding component relationships
   */
  async generateDependencyGraph(): Promise<Record<string, string[]>> {
    const structure = await this.analyzer.analyzeProject();
    const graph: Record<string, string[]> = {};

    for (const screen of structure.screens) {
      graph[screen.name] = screen.imports
        .filter(i => i.source.startsWith('.') || i.source.startsWith('@/'))
        .map(i => i.specifiers)
        .flat();
    }

    for (const component of structure.components) {
      graph[component.name] = component.imports
        .filter(i => i.source.startsWith('.') || i.source.startsWith('@/'))
        .map(i => i.specifiers)
        .flat();
    }

    return graph;
  }
}

// ============================================================================
// Exports
// ============================================================================

export async function analyzeProject(projectPath: string): Promise<ProjectStructure> {
  const analyzer = new ProjectAnalyzer(projectPath);
  return analyzer.analyzeProject();
}

export async function generateLLMContext(projectPath: string): Promise<string> {
  const generator = new LLMContextGenerator(projectPath);
  return generator.generateContext();
}

export async function generateFileContext(filePath: string): Promise<string> {
  const generator = new LLMContextGenerator(path.dirname(filePath));
  return generator.generateFileContext(filePath);
}

export default {
  ASTParser,
  ProjectAnalyzer,
  LLMContextGenerator,
  analyzeProject,
  generateLLMContext,
  generateFileContext,
};
