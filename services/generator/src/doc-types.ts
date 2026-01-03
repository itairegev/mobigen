/**
 * Documentation Generator Types
 * Types for auto-generated documentation for exported projects
 */

export interface DocConfig {
  projectId: string;
  projectPath: string;
  outputPath: string;
  includeSetupInstructions: boolean;
  includeApiDocs: boolean;
  includeComponentDocs: boolean;
  includeScreenshots?: boolean;
}

export interface ProjectInfo {
  // Basic info
  name: string;
  slug: string;
  version: string;
  description?: string;

  // Platform config
  ios: {
    bundleIdentifier: string;
    supportsTablet?: boolean;
    permissions: string[];
  };
  android: {
    package: string;
    permissions: string[];
  };

  // Features
  plugins: string[];
  navigationStructure: NavigationStructure;
  screens: ScreenInfo[];
  components: ComponentInfo[];
  services: ServiceInfo[];

  // Environment
  environmentVariables: EnvironmentVariable[];
  dependencies: Record<string, string>;
  scripts: Record<string, string>;
}

export interface NavigationStructure {
  type: 'stack' | 'tabs' | 'drawer' | 'nested';
  routes: RouteInfo[];
}

export interface RouteInfo {
  name: string;
  path: string;
  type: 'screen' | 'group';
  children?: RouteInfo[];
  params?: ParamInfo[];
  description?: string;
}

export interface ParamInfo {
  name: string;
  type: string;
  required: boolean;
  description?: string;
}

export interface ScreenInfo {
  name: string;
  path: string;
  route: string;
  description?: string;
  features: string[];
  dependencies: string[];
}

export interface ComponentInfo {
  name: string;
  path: string;
  description?: string;
  props: PropInfo[];
  exports: string[];
}

export interface PropInfo {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: string;
  description?: string;
}

export interface ServiceInfo {
  name: string;
  path: string;
  description?: string;
  exports: string[];
  dependencies: string[];
}

export interface EnvironmentVariable {
  name: string;
  required: boolean;
  description: string;
  defaultValue?: string;
  example?: string;
}

export interface DocGenerationResult {
  success: boolean;
  files: string[];
  errors?: string[];
  warnings?: string[];
}
