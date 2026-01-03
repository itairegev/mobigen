/**
 * Documentation Generator
 * Automatically generates comprehensive documentation for exported Mobigen projects
 */

import * as fs from 'fs';
import * as path from 'path';
import Handlebars from 'handlebars';
import {
  DocConfig,
  ProjectInfo,
  DocGenerationResult,
  NavigationStructure,
  RouteInfo,
  ScreenInfo,
  ComponentInfo,
  ServiceInfo,
  EnvironmentVariable,
} from './doc-types';

export class DocGenerator {
  private templatesDir: string;

  constructor() {
    this.templatesDir = path.join(__dirname, 'doc-templates');
    this.registerHandlebarsHelpers();
  }

  /**
   * Generate all documentation for a project
   */
  async generateDocs(config: DocConfig): Promise<DocGenerationResult> {
    const result: DocGenerationResult = {
      success: false,
      files: [],
      errors: [],
      warnings: [],
    };

    try {
      // Extract project information
      const projectInfo = await this.extractProjectInfo(config.projectPath);

      // Generate README.md
      const readmePath = await this.generateReadme(config.outputPath, projectInfo);
      result.files.push(readmePath);

      // Generate SETUP.md if requested
      if (config.includeSetupInstructions) {
        const setupPath = await this.generateSetupGuide(config.outputPath, projectInfo);
        result.files.push(setupPath);
      }

      // Generate API.md if requested
      if (config.includeApiDocs) {
        const apiPath = await this.generateApiDocs(config.outputPath, projectInfo);
        result.files.push(apiPath);
      }

      // Generate component documentation if requested
      if (config.includeComponentDocs) {
        const componentPath = await this.generateComponentDocs(config.outputPath, projectInfo);
        result.files.push(componentPath);
      }

      result.success = true;
      console.log(`[doc-generator] Generated ${result.files.length} documentation files`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      result.errors?.push(message);
      console.error(`[doc-generator] Error: ${message}`);
    }

    return result;
  }

  /**
   * Generate README.md
   */
  async generateReadme(outputPath: string, projectInfo: ProjectInfo): Promise<string> {
    const template = await this.loadTemplate('readme.md.template');
    const compile = Handlebars.compile(template);

    const data = {
      APP_NAME: projectInfo.name,
      APP_SLUG: projectInfo.slug,
      VERSION: projectInfo.version,
      DESCRIPTION: projectInfo.description,
      FEATURES: this.extractFeatures(projectInfo),
      SCREENS: projectInfo.screens,
      SCREEN_GROUPS: this.extractScreenGroups(projectInfo),
      ENV_VARS: projectInfo.environmentVariables,
      KEY_DEPENDENCIES: this.extractKeyDependencies(projectInfo),
      SCRIPTS: this.formatScripts(projectInfo.scripts),
      HAS_API_DOCS: projectInfo.services.length > 0,
      HAS_COMPONENT_DOCS: projectInfo.components.length > 0,
      GENERATION_DATE: new Date().toISOString(),
      MOBIGEN_VERSION: '1.0.0',
    };

    const content = compile(data);
    const filePath = path.join(outputPath, 'README.md');

    await fs.promises.writeFile(filePath, content, 'utf-8');
    console.log(`[doc-generator] Generated README.md`);

    return filePath;
  }

  /**
   * Generate SETUP.md
   */
  async generateSetupGuide(outputPath: string, projectInfo: ProjectInfo): Promise<string> {
    const template = await this.loadTemplate('setup.md.template');
    const compile = Handlebars.compile(template);

    const data = {
      APP_NAME: projectInfo.name,
      APP_SLUG: projectInfo.slug,
      VERSION: projectInfo.version,
      IOS_BUNDLE_ID: projectInfo.ios.bundleIdentifier,
      ANDROID_PACKAGE: projectInfo.android.package,
      ENV_VARS: projectInfo.environmentVariables,
      IOS_PERMISSIONS: this.extractIOSPermissions(projectInfo),
      ANDROID_PERMISSIONS: this.formatAndroidPermissions(projectInfo),
      HAS_E2E_TESTS: this.hasE2ETests(outputPath),
      GENERATION_DATE: new Date().toISOString(),
    };

    const content = compile(data);
    const filePath = path.join(outputPath, 'SETUP.md');

    await fs.promises.writeFile(filePath, content, 'utf-8');
    console.log(`[doc-generator] Generated SETUP.md`);

    return filePath;
  }

  /**
   * Generate API.md
   */
  async generateApiDocs(outputPath: string, projectInfo: ProjectInfo): Promise<string> {
    const template = await this.loadTemplate('api.md.template');
    const compile = Handlebars.compile(template);

    const data = {
      APP_NAME: projectInfo.name,
      SERVICES: projectInfo.services,
      BACKEND_SERVICES: this.extractBackendServices(projectInfo),
      API_BASE_URL: this.extractApiBaseUrl(projectInfo),
      AUTH_TYPE: this.detectAuthType(projectInfo),
      AUTH_TYPE_JWT: this.detectAuthType(projectInfo) === 'JWT',
      AUTH_TYPE_OAUTH: this.detectAuthType(projectInfo) === 'OAuth',
      RATE_LIMIT: this.extractRateLimit(projectInfo),
      DATA_MODELS: this.extractDataModels(projectInfo),
      OFFLINE_SUPPORT: this.hasOfflineSupport(projectInfo),
      OFFLINE_STORAGE_TYPE: 'AsyncStorage / SQLite',
      OFFLINE_SYNC_STRATEGY: 'Background sync',
      CONFLICT_RESOLUTION_STRATEGY: 'Last-write-wins',
      API_ENV_VARS: this.extractApiEnvVars(projectInfo),
      WEBSOCKET_SUPPORT: this.hasWebSocketSupport(projectInfo),
      WEBSOCKET_URL: this.extractWebSocketUrl(projectInfo),
      GENERATION_DATE: new Date().toISOString(),
    };

    const content = compile(data);
    const filePath = path.join(outputPath, 'API.md');

    await fs.promises.writeFile(filePath, content, 'utf-8');
    console.log(`[doc-generator] Generated API.md`);

    return filePath;
  }

  /**
   * Generate component documentation
   */
  async generateComponentDocs(outputPath: string, projectInfo: ProjectInfo): Promise<string> {
    const content = this.buildComponentDocumentation(projectInfo);
    const filePath = path.join(outputPath, 'COMPONENTS.md');

    await fs.promises.writeFile(filePath, content, 'utf-8');
    console.log(`[doc-generator] Generated COMPONENTS.md`);

    return filePath;
  }

  /**
   * Extract project information from files
   */
  async extractProjectInfo(projectPath: string): Promise<ProjectInfo> {
    // Read app.json or app.config.ts
    const appConfig = await this.readAppConfig(projectPath);

    // Extract navigation structure
    const navigationStructure = await this.extractNavigationStructure(projectPath);

    // Extract screens
    const screens = await this.extractScreens(projectPath, navigationStructure);

    // Extract components
    const components = await this.extractComponents(projectPath);

    // Extract services
    const services = await this.extractServices(projectPath);

    // Extract environment variables
    const environmentVariables = await this.extractEnvVars(projectPath);

    // Read package.json
    const packageJson = await this.readPackageJson(projectPath);

    return {
      name: appConfig.expo?.name || appConfig.name || 'Mobigen App',
      slug: appConfig.expo?.slug || appConfig.slug || 'mobigen-app',
      version: appConfig.expo?.version || appConfig.version || '1.0.0',
      description: packageJson.description,
      ios: {
        bundleIdentifier: appConfig.expo?.ios?.bundleIdentifier || 'com.mobigen.app',
        supportsTablet: appConfig.expo?.ios?.supportsTablet,
        permissions: this.extractIOSPermissionList(appConfig),
      },
      android: {
        package: appConfig.expo?.android?.package || 'com.mobigen.app',
        permissions: appConfig.expo?.android?.permissions || [],
      },
      plugins: appConfig.expo?.plugins || [],
      navigationStructure,
      screens,
      components,
      services,
      environmentVariables,
      dependencies: packageJson.dependencies || {},
      scripts: packageJson.scripts || {},
    };
  }

  /**
   * Read app configuration
   */
  private async readAppConfig(projectPath: string): Promise<any> {
    const appJsonPath = path.join(projectPath, 'app.json');

    if (fs.existsSync(appJsonPath)) {
      const content = await fs.promises.readFile(appJsonPath, 'utf-8');
      return JSON.parse(content);
    }

    // Fallback to default config
    return {
      expo: {
        name: 'Mobigen App',
        slug: 'mobigen-app',
        version: '1.0.0',
      },
    };
  }

  /**
   * Read package.json
   */
  private async readPackageJson(projectPath: string): Promise<any> {
    const packagePath = path.join(projectPath, 'package.json');

    if (fs.existsSync(packagePath)) {
      const content = await fs.promises.readFile(packagePath, 'utf-8');
      return JSON.parse(content);
    }

    return { dependencies: {}, scripts: {} };
  }

  /**
   * Extract navigation structure from app directory
   */
  private async extractNavigationStructure(projectPath: string): Promise<NavigationStructure> {
    const appDir = path.join(projectPath, 'src', 'app');

    if (!fs.existsSync(appDir)) {
      return { type: 'stack', routes: [] };
    }

    const routes = await this.scanAppDirectory(appDir);
    const type = this.detectNavigationType(routes);

    return { type, routes };
  }

  /**
   * Scan app directory for routes (Expo Router)
   */
  private async scanAppDirectory(dirPath: string, basePath = ''): Promise<RouteInfo[]> {
    const routes: RouteInfo[] = [];
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name.startsWith('_') || entry.name.startsWith('.')) {
        continue; // Skip layout files and hidden files
      }

      const fullPath = path.join(dirPath, entry.name);
      const routePath = path.join(basePath, entry.name);

      if (entry.isDirectory()) {
        // Group or nested route
        const children = await this.scanAppDirectory(fullPath, routePath);
        routes.push({
          name: entry.name,
          path: routePath,
          type: 'group',
          children,
        });
      } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
        // Screen file
        const screenName = entry.name.replace(/\.(tsx|ts)$/, '');
        const route = this.convertToRoute(routePath.replace(/\.(tsx|ts)$/, ''));

        routes.push({
          name: screenName,
          path: fullPath,
          type: 'screen',
          description: await this.extractScreenDescription(fullPath),
        });
      }
    }

    return routes;
  }

  /**
   * Convert file path to route
   */
  private convertToRoute(filePath: string): string {
    return '/' + filePath
      .replace(/\\/g, '/')
      .replace(/\(.*?\)\//g, '') // Remove route groups
      .replace(/index$/, ''); // Remove index from path
  }

  /**
   * Detect navigation type
   */
  private detectNavigationType(routes: RouteInfo[]): 'stack' | 'tabs' | 'drawer' | 'nested' {
    const hasTabsGroup = routes.some(r => r.name === '(tabs)');
    const hasDrawerGroup = routes.some(r => r.name === '(drawer)');

    if (hasTabsGroup) return 'tabs';
    if (hasDrawerGroup) return 'drawer';
    if (routes.some(r => r.children && r.children.length > 0)) return 'nested';
    return 'stack';
  }

  /**
   * Extract screens information
   */
  private async extractScreens(projectPath: string, nav: NavigationStructure): Promise<ScreenInfo[]> {
    const screens: ScreenInfo[] = [];

    const extractFromRoutes = (routes: RouteInfo[], parentPath = '') => {
      for (const route of routes) {
        if (route.type === 'screen' && route.path) {
          screens.push({
            name: route.name,
            path: route.path,
            route: this.convertToRoute(path.relative(path.join(projectPath, 'src', 'app'), route.path)),
            description: route.description,
            features: [],
            dependencies: [],
          });
        }

        if (route.children) {
          extractFromRoutes(route.children, route.path);
        }
      }
    };

    extractFromRoutes(nav.routes);
    return screens;
  }

  /**
   * Extract components from project
   */
  private async extractComponents(projectPath: string): Promise<ComponentInfo[]> {
    const components: ComponentInfo[] = [];
    const componentsDir = path.join(projectPath, 'src', 'components');

    if (!fs.existsSync(componentsDir)) {
      return components;
    }

    const files = await this.findTsxFiles(componentsDir);

    for (const file of files) {
      const name = path.basename(file, '.tsx');
      components.push({
        name,
        path: file,
        props: [],
        exports: [name],
      });
    }

    return components;
  }

  /**
   * Extract services from project
   */
  private async extractServices(projectPath: string): Promise<ServiceInfo[]> {
    const services: ServiceInfo[] = [];
    const servicesDir = path.join(projectPath, 'src', 'services');

    if (!fs.existsSync(servicesDir)) {
      return services;
    }

    const files = await this.findTsFiles(servicesDir);

    for (const file of files) {
      const name = path.basename(file, '.ts');
      const content = await fs.promises.readFile(file, 'utf-8');

      services.push({
        name,
        path: file,
        description: this.extractServiceDescription(content),
        exports: this.extractExports(content),
        dependencies: [],
      });
    }

    return services;
  }

  /**
   * Extract environment variables
   */
  private async extractEnvVars(projectPath: string): Promise<EnvironmentVariable[]> {
    const envVars: EnvironmentVariable[] = [];
    const envExamplePath = path.join(projectPath, '.env.example');

    if (fs.existsSync(envExamplePath)) {
      const content = await fs.promises.readFile(envExamplePath, 'utf-8');
      const lines = content.split('\n');

      for (const line of lines) {
        if (line.trim() && !line.startsWith('#')) {
          const [name, value] = line.split('=');
          if (name) {
            envVars.push({
              name: name.trim(),
              required: !value || value.trim() === '',
              description: 'Environment variable',
              example: value?.trim() || 'your-value-here',
            });
          }
        }
      }
    }

    return envVars;
  }

  /**
   * Helper methods
   */

  private async loadTemplate(filename: string): Promise<string> {
    const filePath = path.join(this.templatesDir, filename);
    return fs.promises.readFile(filePath, 'utf-8');
  }

  private extractFeatures(projectInfo: ProjectInfo): string[] {
    const features: string[] = [];

    if (projectInfo.plugins.includes('expo-router')) {
      features.push('File-based routing with Expo Router');
    }
    if (projectInfo.plugins.includes('expo-location')) {
      features.push('Location services');
    }
    if (projectInfo.plugins.includes('expo-image-picker')) {
      features.push('Image capture and selection');
    }
    if (projectInfo.navigationStructure.type === 'tabs') {
      features.push('Tab-based navigation');
    }
    if (projectInfo.services.length > 0) {
      features.push(`${projectInfo.services.length} API services`);
    }

    return features;
  }

  private extractScreenGroups(projectInfo: ProjectInfo): string[] {
    const groups = new Set<string>();

    for (const screen of projectInfo.screens) {
      const parts = screen.route.split('/').filter(Boolean);
      if (parts.length > 1) {
        groups.add(parts[0]);
      }
    }

    return Array.from(groups);
  }

  private extractKeyDependencies(projectInfo: ProjectInfo): Array<{ name: string; version: string; description: string }> {
    const keyDeps = [
      { pkg: 'expo', desc: 'Expo framework for React Native' },
      { pkg: 'expo-router', desc: 'File-based routing' },
      { pkg: 'react-native', desc: 'React Native framework' },
      { pkg: 'nativewind', desc: 'Tailwind CSS for React Native' },
    ];

    return keyDeps
      .filter(({ pkg }) => projectInfo.dependencies[pkg])
      .map(({ pkg, desc }) => ({
        name: pkg,
        version: projectInfo.dependencies[pkg],
        description: desc,
      }));
  }

  private formatScripts(scripts: Record<string, string>): Array<{ name: string; description: string }> {
    const descriptions: Record<string, string> = {
      start: 'Start development server',
      ios: 'Run on iOS simulator',
      android: 'Run on Android emulator',
      web: 'Run in web browser',
      test: 'Run tests',
      lint: 'Run linter',
      build: 'Build production app',
    };

    return Object.entries(scripts).map(([name, cmd]) => ({
      name,
      description: descriptions[name] || cmd,
    }));
  }

  private extractIOSPermissions(projectInfo: ProjectInfo): Array<{ key: string; description: string }> {
    const infoPlist = (projectInfo as any).ios?.infoPlist || {};
    return Object.entries(infoPlist).map(([key, value]) => ({
      key,
      description: value as string,
    }));
  }

  private formatAndroidPermissions(projectInfo: ProjectInfo): Array<{ permission: string; description: string }> {
    return projectInfo.android.permissions.map(perm => ({
      permission: perm,
      description: this.getPermissionDescription(perm),
    }));
  }

  private getPermissionDescription(permission: string): string {
    const descriptions: Record<string, string> = {
      ACCESS_FINE_LOCATION: 'Access precise location',
      ACCESS_COARSE_LOCATION: 'Access approximate location',
      CAMERA: 'Access camera for photos',
      READ_EXTERNAL_STORAGE: 'Read from device storage',
      WRITE_EXTERNAL_STORAGE: 'Write to device storage',
    };
    return descriptions[permission] || permission;
  }

  private extractIOSPermissionList(appConfig: any): string[] {
    const infoPlist = appConfig.expo?.ios?.infoPlist || {};
    return Object.keys(infoPlist);
  }

  private hasE2ETests(projectPath: string): boolean {
    const maestroDir = path.join(projectPath, '.maestro');
    return fs.existsSync(maestroDir);
  }

  private extractBackendServices(projectInfo: ProjectInfo): any[] {
    // Analyze services to detect backend services
    return projectInfo.services
      .filter(s => s.name.includes('api') || s.name.includes('service'))
      .map(s => ({
        name: s.name,
        description: s.description || 'API service',
      }));
  }

  private extractApiBaseUrl(projectInfo: ProjectInfo): string | undefined {
    const apiEnvVar = projectInfo.environmentVariables.find(
      v => v.name.includes('API_URL') || v.name.includes('BASE_URL')
    );
    return apiEnvVar?.example;
  }

  private detectAuthType(projectInfo: ProjectInfo): string | undefined {
    const hasAuthService = projectInfo.services.some(s => s.name.toLowerCase().includes('auth'));
    if (hasAuthService) return 'JWT';
    return undefined;
  }

  private extractRateLimit(projectInfo: ProjectInfo): string | undefined {
    return undefined; // Would need to parse API docs or comments
  }

  private extractDataModels(projectInfo: ProjectInfo): any[] {
    // Would need to parse TypeScript types
    return [];
  }

  private hasOfflineSupport(projectInfo: ProjectInfo): boolean {
    return projectInfo.plugins.includes('expo-sqlite') ||
           Object.keys(projectInfo.dependencies).some(dep => dep.includes('sqlite'));
  }

  private extractApiEnvVars(projectInfo: ProjectInfo): EnvironmentVariable[] {
    return projectInfo.environmentVariables.filter(
      v => v.name.includes('API') || v.name.includes('URL') || v.name.includes('KEY')
    );
  }

  private hasWebSocketSupport(projectInfo: ProjectInfo): boolean {
    return Object.keys(projectInfo.dependencies).some(dep =>
      dep.includes('websocket') || dep.includes('socket.io')
    );
  }

  private extractWebSocketUrl(projectInfo: ProjectInfo): string | undefined {
    const wsEnvVar = projectInfo.environmentVariables.find(
      v => v.name.includes('WS_URL') || v.name.includes('WEBSOCKET')
    );
    return wsEnvVar?.example;
  }

  private buildComponentDocumentation(projectInfo: ProjectInfo): string {
    let doc = `# Component Documentation\n\n`;
    doc += `Component reference for **${projectInfo.name}**.\n\n`;
    doc += `## Components\n\n`;

    for (const component of projectInfo.components) {
      doc += `### ${component.name}\n\n`;
      doc += `**File:** \`${component.path}\`\n\n`;
      if (component.description) {
        doc += `${component.description}\n\n`;
      }
      doc += `---\n\n`;
    }

    return doc;
  }

  private async extractScreenDescription(filePath: string): Promise<string | undefined> {
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      const match = content.match(/\/\*\*\s*\n\s*\*\s*(.+?)\s*\n/);
      return match ? match[1] : undefined;
    } catch {
      return undefined;
    }
  }

  private extractServiceDescription(content: string): string | undefined {
    const match = content.match(/\/\*\*\s*\n\s*\*\s*(.+?)\s*\n/);
    return match ? match[1] : undefined;
  }

  private extractExports(content: string): string[] {
    const exports: string[] = [];
    const exportRegex = /export\s+(?:async\s+)?(?:function|const|class)\s+(\w+)/g;
    let match;

    while ((match = exportRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }

    return exports;
  }

  private async findTsxFiles(dir: string): Promise<string[]> {
    return this.findFiles(dir, '.tsx');
  }

  private async findTsFiles(dir: string): Promise<string[]> {
    return this.findFiles(dir, '.ts');
  }

  private async findFiles(dir: string, ext: string): Promise<string[]> {
    const files: string[] = [];
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        const subFiles = await this.findFiles(fullPath, ext);
        files.push(...subFiles);
      } else if (entry.name.endsWith(ext)) {
        files.push(fullPath);
      }
    }

    return files;
  }

  private registerHandlebarsHelpers(): void {
    Handlebars.registerHelper('if', function(this: any, conditional, options) {
      if (conditional) {
        return options.fn(this);
      }
      return options.inverse(this);
    });

    Handlebars.registerHelper('unless', function(this: any, conditional, options) {
      if (!conditional) {
        return options.fn(this);
      }
      return options.inverse(this);
    });

    Handlebars.registerHelper('each', function(this: any, context, options) {
      let ret = '';
      if (context && context.length > 0) {
        for (let i = 0; i < context.length; i++) {
          ret += options.fn({ ...context[i], '@index': i, '@last': i === context.length - 1 });
        }
      }
      return ret;
    });
  }
}

export default DocGenerator;
