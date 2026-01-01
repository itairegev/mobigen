#!/usr/bin/env npx ts-node
/**
 * Pre-generate AST context for all templates
 *
 * Usage:
 *   npx ts-node scripts/generate-template-ast.ts
 *
 * Or with pnpm:
 *   pnpm run generate:ast
 *
 * This creates a template.ast.json file in each template directory
 * containing the pre-analyzed project structure.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

// ============================================================================
// Types (matching ast-utils.ts)
// ============================================================================

interface ComponentInfo {
  name: string;
  filePath: string;
  type: 'function' | 'arrow' | 'class';
  props: PropInfo[];
  hooks: string[];
  imports: ImportInfo[];
  exports: string[];
  jsxElements: string[];
  hasDefaultExport: boolean;
}

interface PropInfo {
  name: string;
  type: string;
  required: boolean;
}

interface ImportInfo {
  source: string;
  specifiers: string[];
  isDefault: boolean;
  isNamespace: boolean;
}

interface HookInfo {
  name: string;
  filePath: string;
  dependencies: string[];
  returnType: string;
}

interface ServiceInfo {
  name: string;
  filePath: string;
  functions: FunctionInfo[];
}

interface FunctionInfo {
  name: string;
  params: { name: string; type: string }[];
  returnType: string;
  isAsync: boolean;
}

interface NavigationRoute {
  name: string;
  screen: string;
  filePath: string;
  params?: Record<string, string>;
}

interface NavigationInfo {
  type: 'stack' | 'tab' | 'drawer' | 'expo-router' | 'mixed';
  routes: NavigationRoute[];
}

interface TypeInfo {
  name: string;
  filePath: string;
  kind: 'type' | 'interface' | 'enum';
  properties?: { name: string; type: string }[];
}

interface TemplateAST {
  templateId: string;
  generatedAt: string;
  version: string;
  structure: {
    screens: ComponentInfo[];
    components: ComponentInfo[];
    hooks: HookInfo[];
    services: ServiceInfo[];
    navigation: NavigationInfo;
    types: TypeInfo[];
  };
  summary: string;
  stats: {
    totalFiles: number;
    totalScreens: number;
    totalComponents: number;
    totalHooks: number;
    totalServices: number;
    totalTypes: number;
  };
}

// ============================================================================
// AST Parser
// ============================================================================

function parseFile(filePath: string): ComponentInfo | null {
  if (!fs.existsSync(filePath)) return null;

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
    filePath: filePath,
    type: 'function',
    props: [],
    hooks: [],
    imports: [],
    exports: [],
    jsxElements: [],
    hasDefaultExport: false,
  };

  function visit(node: ts.Node): void {
    // Extract imports
    if (ts.isImportDeclaration(node)) {
      const moduleSpecifier = node.moduleSpecifier;
      if (ts.isStringLiteral(moduleSpecifier)) {
        const source = moduleSpecifier.text;
        const specifiers: string[] = [];
        let isDefault = false;
        let isNamespace = false;

        if (node.importClause) {
          if (node.importClause.name) {
            specifiers.push(node.importClause.name.getText());
            isDefault = true;
          }
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

        result.imports.push({ source, specifiers, isDefault, isNamespace });
      }
    }

    // Extract default export
    if (ts.isExportAssignment(node)) {
      result.hasDefaultExport = true;
    }

    // Extract named exports
    if (ts.isExportDeclaration(node) && node.exportClause && ts.isNamedExports(node.exportClause)) {
      node.exportClause.elements.forEach(element => {
        result.exports.push(element.name.getText());
      });
    }

    // Extract function with export modifier
    if (ts.isFunctionDeclaration(node) && node.name) {
      const hasExport = node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword);
      const hasDefault = node.modifiers?.some(m => m.kind === ts.SyntaxKind.DefaultKeyword);

      if (hasExport) {
        result.exports.push(node.name.getText());
      }
      if (hasDefault) {
        result.hasDefaultExport = true;
      }

      const name = node.name.getText();
      if (/^[A-Z]/.test(name)) {
        result.type = 'function';
        result.name = name;
      }
    }

    // Extract arrow function components
    if (ts.isVariableStatement(node)) {
      const hasExport = node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword);

      node.declarationList.declarations.forEach(decl => {
        if (ts.isIdentifier(decl.name) && decl.initializer) {
          const name = decl.name.getText();

          if (hasExport) {
            result.exports.push(name);
          }

          if (ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer)) {
            if (/^[A-Z]/.test(name)) {
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
        if (name.startsWith('use') && !result.hooks.includes(name)) {
          result.hooks.push(name);
        }
      }
    }

    // Extract JSX elements
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tagName = node.tagName.getText();
      if (!result.jsxElements.includes(tagName)) {
        result.jsxElements.push(tagName);
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return result;
}

function getTypeScriptFiles(dirPath: string): string[] {
  if (!fs.existsSync(dirPath)) return [];

  const files: string[] = [];

  function walk(dir: string): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
        files.push(fullPath);
      }
    }
  }

  walk(dirPath);
  return files;
}

function analyzeHooks(dirPath: string, templatePath: string): HookInfo[] {
  const hooks: HookInfo[] = [];
  const files = getTypeScriptFiles(dirPath);

  for (const file of files) {
    const info = parseFile(file);
    if (info && info.name.startsWith('use')) {
      hooks.push({
        name: info.name,
        filePath: path.relative(templatePath, file),
        dependencies: info.hooks,
        returnType: 'unknown',
      });
    }
  }

  return hooks;
}

function analyzeServices(dirPath: string, templatePath: string): ServiceInfo[] {
  const services: ServiceInfo[] = [];
  const files = getTypeScriptFiles(dirPath);

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

    function visit(node: ts.Node): void {
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

      // Also catch exported arrow functions
      if (ts.isVariableStatement(node)) {
        node.declarationList.declarations.forEach(decl => {
          if (ts.isIdentifier(decl.name) && decl.initializer) {
            if (ts.isArrowFunction(decl.initializer)) {
              const arrow = decl.initializer;
              functions.push({
                name: decl.name.getText(),
                params: arrow.parameters.map(p => ({
                  name: p.name.getText(),
                  type: p.type?.getText() || 'any',
                })),
                returnType: arrow.type?.getText() || 'void',
                isAsync: arrow.modifiers?.some(m => m.kind === ts.SyntaxKind.AsyncKeyword) || false,
              });
            }
          }
        });
      }

      ts.forEachChild(node, visit);
    }

    visit(sourceFile);

    if (functions.length > 0) {
      services.push({
        name: path.basename(file, path.extname(file)),
        filePath: path.relative(templatePath, file),
        functions,
      });
    }
  }

  return services;
}

function analyzeNavigation(templatePath: string): NavigationInfo {
  const navInfo: NavigationInfo = {
    type: 'stack',
    routes: [],
  };

  // Check for Expo Router (app/ directory - either at root or in src/)
  const appPaths = [
    path.join(templatePath, 'src', 'app'),
    path.join(templatePath, 'app'),
  ];

  for (const appPath of appPaths) {
    if (fs.existsSync(appPath)) {
      navInfo.type = 'expo-router';
      navInfo.routes = extractExpoRouterRoutes(appPath, '', templatePath);
      if (navInfo.routes.length > 0) return navInfo;
    }
  }

  // Check for React Navigation
  const navPaths = [
    path.join(templatePath, 'src', 'navigation'),
    path.join(templatePath, 'navigation'),
  ];

  for (const navPath of navPaths) {
    if (fs.existsSync(navPath)) {
      const files = getTypeScriptFiles(navPath);
      for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8');

        // Match Stack.Screen, Tab.Screen patterns
        const screenRegex = /<(?:Stack|Tab|Drawer)\.Screen\s+name=["']([^"']+)["']\s+component=\{([^}]+)\}/g;
        let match;

        while ((match = screenRegex.exec(content)) !== null) {
          navInfo.routes.push({
            name: match[1],
            screen: match[2],
            filePath: path.relative(templatePath, file),
          });
        }

        // Detect navigation type
        if (content.includes('createBottomTabNavigator') || content.includes('Tab.Navigator')) {
          navInfo.type = 'tab';
        } else if (content.includes('createDrawerNavigator') || content.includes('Drawer.Navigator')) {
          navInfo.type = 'drawer';
        }
      }
    }
  }

  return navInfo;
}

function extractExpoRouterRoutes(appPath: string, prefix: string, templatePath: string): NavigationRoute[] {
  const routes: NavigationRoute[] = [];

  if (!fs.existsSync(appPath)) return routes;

  const entries = fs.readdirSync(appPath, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith('_') || entry.name === 'node_modules') continue;

    const fullPath = path.join(appPath, entry.name);

    if (entry.isDirectory()) {
      // Handle route groups like (tabs), (auth)
      const isGroup = entry.name.startsWith('(') && entry.name.endsWith(')');
      const newPrefix = isGroup ? prefix : `${prefix}/${entry.name}`;

      const nestedRoutes = extractExpoRouterRoutes(fullPath, newPrefix, templatePath);
      routes.push(...nestedRoutes);
    } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
      const routeName = entry.name.replace(/\.(tsx|ts)$/, '');

      if (routeName === '_layout') continue;

      const routePath = routeName === 'index'
        ? prefix || '/'
        : `${prefix}/${routeName}`;

      routes.push({
        name: routeName,
        screen: routeName.charAt(0).toUpperCase() + routeName.slice(1),
        filePath: path.relative(templatePath, fullPath),
        params: routeName.startsWith('[') ? { dynamic: routeName.replace(/[\[\]]/g, '') } : undefined,
      });
    }
  }

  return routes;
}

function analyzeTypes(dirPath: string, templatePath: string): TypeInfo[] {
  const types: TypeInfo[] = [];
  const files = getTypeScriptFiles(dirPath);

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const sourceFile = ts.createSourceFile(
      file,
      content,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS
    );

    function visit(node: ts.Node): void {
      if (ts.isInterfaceDeclaration(node)) {
        types.push({
          name: node.name.getText(),
          filePath: path.relative(templatePath, file),
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
          filePath: path.relative(templatePath, file),
          kind: 'type',
        });
      }

      if (ts.isEnumDeclaration(node)) {
        types.push({
          name: node.name.getText(),
          filePath: path.relative(templatePath, file),
          kind: 'enum',
        });
      }

      ts.forEachChild(node, visit);
    }

    visit(sourceFile);
  }

  return types;
}

function generateSummary(ast: TemplateAST): string {
  const lines: string[] = [];

  lines.push(`## Template: ${ast.templateId}`);
  lines.push('');

  lines.push(`### Screens (${ast.structure.screens.length})`);
  for (const s of ast.structure.screens) {
    lines.push(`- **${s.name}** (${s.filePath})`);
    if (s.hooks.length > 0) lines.push(`  - Hooks: ${s.hooks.join(', ')}`);
    if (s.jsxElements.length > 0) lines.push(`  - JSX: ${s.jsxElements.slice(0, 5).join(', ')}${s.jsxElements.length > 5 ? '...' : ''}`);
  }
  lines.push('');

  lines.push(`### Components (${ast.structure.components.length})`);
  for (const c of ast.structure.components) {
    lines.push(`- **${c.name}**: ${c.hooks.length} hooks, ${c.jsxElements.length} elements`);
  }
  lines.push('');

  lines.push(`### Hooks (${ast.structure.hooks.length})`);
  for (const h of ast.structure.hooks) {
    lines.push(`- **${h.name}**: deps [${h.dependencies.join(', ')}]`);
  }
  lines.push('');

  lines.push(`### Services (${ast.structure.services.length})`);
  for (const s of ast.structure.services) {
    const funcs = s.functions.map(f => `${f.name}(${f.isAsync ? 'async' : ''})`).join(', ');
    lines.push(`- **${s.name}**: ${funcs}`);
  }
  lines.push('');

  lines.push(`### Navigation (${ast.structure.navigation.type})`);
  for (const r of ast.structure.navigation.routes) {
    lines.push(`- ${r.name} -> ${r.screen}`);
  }
  lines.push('');

  lines.push(`### Types (${ast.structure.types.length})`);
  for (const t of ast.structure.types) {
    lines.push(`- ${t.kind} ${t.name}`);
  }

  return lines.join('\n');
}

function analyzeTemplate(templatePath: string): TemplateAST {
  const templateId = path.basename(templatePath);

  console.log(`  Analyzing ${templateId}...`);

  // Analyze screens
  const screens: ComponentInfo[] = [];
  const screenPaths = [
    path.join(templatePath, 'src', 'screens'),
    path.join(templatePath, 'src', 'app'),  // Expo Router in src/
    path.join(templatePath, 'app'),          // Expo Router at root
  ];

  for (const screenPath of screenPaths) {
    const files = getTypeScriptFiles(screenPath);
    for (const file of files) {
      const info = parseFile(file);
      if (info) {
        info.filePath = path.relative(templatePath, file);
        screens.push(info);
      }
    }
  }

  // Analyze components
  const components: ComponentInfo[] = [];
  const componentPaths = [
    path.join(templatePath, 'src', 'components'),
    path.join(templatePath, 'components'),
  ];

  for (const compPath of componentPaths) {
    const files = getTypeScriptFiles(compPath);
    for (const file of files) {
      const info = parseFile(file);
      if (info) {
        info.filePath = path.relative(templatePath, file);
        components.push(info);
      }
    }
  }

  // Analyze hooks
  const hooksPath = path.join(templatePath, 'src', 'hooks');
  const hooks = analyzeHooks(hooksPath, templatePath);

  // Analyze services
  const servicesPath = path.join(templatePath, 'src', 'services');
  const services = analyzeServices(servicesPath, templatePath);

  // Analyze navigation
  const navigation = analyzeNavigation(templatePath);

  // Analyze types
  const typesPath = path.join(templatePath, 'src', 'types');
  const types = analyzeTypes(typesPath, templatePath);

  // Count total files
  const allFiles = getTypeScriptFiles(templatePath);

  const ast: TemplateAST = {
    templateId,
    generatedAt: new Date().toISOString(),
    version: '1.0.0',
    structure: {
      screens,
      components,
      hooks,
      services,
      navigation,
      types,
    },
    summary: '',
    stats: {
      totalFiles: allFiles.length,
      totalScreens: screens.length,
      totalComponents: components.length,
      totalHooks: hooks.length,
      totalServices: services.length,
      totalTypes: types.length,
    },
  };

  ast.summary = generateSummary(ast);

  return ast;
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  const MOBIGEN_ROOT = process.env.MOBIGEN_ROOT || path.resolve(__dirname, '..');
  // Use working templates directory (not bare repos)
  const TEMPLATES_DIR = path.join(MOBIGEN_ROOT, 'templates');

  console.log('='.repeat(60));
  console.log('Generating AST for templates');
  console.log('='.repeat(60));
  console.log(`Templates directory: ${TEMPLATES_DIR}`);
  console.log('');

  if (!fs.existsSync(TEMPLATES_DIR)) {
    console.error(`ERROR: Templates directory not found: ${TEMPLATES_DIR}`);
    process.exit(1);
  }

  const templates = fs.readdirSync(TEMPLATES_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith('.'))
    .map(d => d.name);

  console.log(`Found ${templates.length} templates: ${templates.join(', ')}`);
  console.log('');

  const results: { template: string; success: boolean; stats?: TemplateAST['stats']; error?: string }[] = [];

  for (const template of templates) {
    const templatePath = path.join(TEMPLATES_DIR, template);

    try {
      const ast = analyzeTemplate(templatePath);

      // Write AST to template directory
      const astPath = path.join(templatePath, 'template.ast.json');
      fs.writeFileSync(astPath, JSON.stringify(ast, null, 2));

      // Write summary to template directory
      const summaryPath = path.join(templatePath, 'template.ast.md');
      fs.writeFileSync(summaryPath, ast.summary);

      console.log(`  ✓ ${template}: ${ast.stats.totalFiles} files, ${ast.stats.totalScreens} screens, ${ast.stats.totalComponents} components`);

      results.push({ template, success: true, stats: ast.stats });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`  ✗ ${template}: ${message}`);
      results.push({ template, success: false, error: message });
    }
  }

  console.log('');
  console.log('='.repeat(60));
  console.log('Summary');
  console.log('='.repeat(60));

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`Successful: ${successful}/${templates.length}`);
  if (failed > 0) {
    console.log(`Failed: ${failed}`);
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.template}: ${r.error}`);
    });
  }

  // Write combined index
  const indexPath = path.join(TEMPLATES_DIR, 'templates.ast.json');
  const index = {
    generatedAt: new Date().toISOString(),
    templates: results.filter(r => r.success).map(r => ({
      id: r.template,
      stats: r.stats,
    })),
  };
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
  console.log('');
  console.log(`Index written to: ${indexPath}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
