import * as fs from 'fs/promises';
import * as path from 'path';
import simpleGit, { SimpleGit } from 'simple-git';

export interface TemplateInfo {
  name: string;
  version: string;
  commit: string;
  description: string;
  files: number;
  lastModified: Date;
}

export interface TemplateContext {
  name: string;
  version: string;
  description: string;
  category: string;
  features: string[];

  // What the template already provides
  screens: ScreenInfo[];
  components: ComponentInfo[];
  hooks: HookInfo[];
  types: TypeInfo[];
  services: ServiceInfo[];

  // Dependencies already installed
  dependencies: Record<string, string>;

  // File structure overview
  fileStructure: string[];
}

export interface ScreenInfo {
  name: string;
  path: string;
  description: string;
  components: string[];
}

export interface ComponentInfo {
  name: string;
  path: string;
  props?: string[];
  description?: string;
}

export interface HookInfo {
  name: string;
  path: string;
  returns?: string[];
  description?: string;
}

export interface TypeInfo {
  name: string;
  path: string;
  fields?: string[];
}

export interface ServiceInfo {
  name: string;
  path: string;
  methods?: string[];
}

export interface ProjectMetadata {
  projectId: string;
  template: string;
  templateVersion: string;
  templateCommit: string;
  createdAt: string;
  generationHistory: GenerationRecord[];
}

export interface GenerationRecord {
  version: number;
  timestamp: string;
  prompt: string;
  commit: string;
  phase: string;
  agent?: string;
}

/**
 * TemplateManager handles:
 * - Bare repos (templates-bare/*.git) - Source of truth
 * - Working copies (templates/*) - For template development
 * - Project creation by cloning from bare repos
 */
export class TemplateManager {
  private bareRepoDir: string;
  private workingCopyDir: string;
  private projectsDir: string;

  constructor(config: {
    bareRepoDir: string;
    workingCopyDir: string;
    projectsDir: string;
  }) {
    this.bareRepoDir = config.bareRepoDir;
    this.workingCopyDir = config.workingCopyDir;
    this.projectsDir = config.projectsDir;
  }

  /**
   * List all available templates from bare repos
   */
  async listTemplates(): Promise<TemplateInfo[]> {
    const entries = await fs.readdir(this.bareRepoDir, { withFileTypes: true });
    const templates: TemplateInfo[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory() || !entry.name.endsWith('.git')) continue;

      const templateName = entry.name.replace('.git', '');
      const info = await this.getTemplateInfo(templateName);
      if (info) {
        templates.push(info);
      }
    }

    return templates;
  }

  /**
   * Get info about a specific template from its bare repo
   */
  async getTemplateInfo(templateName: string): Promise<TemplateInfo | null> {
    const bareRepoPath = path.join(this.bareRepoDir, `${templateName}.git`);
    const workingCopyPath = path.join(this.workingCopyDir, templateName);

    try {
      await fs.access(bareRepoPath);
    } catch {
      return null;
    }

    const git = simpleGit(bareRepoPath);
    let version = '0.0.0';
    let commit = 'unknown';
    let lastModified = new Date();

    try {
      // Get latest tag as version
      const tags = await git.tags();
      if (tags.latest) {
        version = tags.latest.replace(/^v/, '');
      }

      // Get latest commit
      const log = await git.log({ maxCount: 1 });
      if (log.latest) {
        commit = log.latest.hash.substring(0, 7);
        lastModified = new Date(log.latest.date);
      }
    } catch {
      // No commits yet
    }

    // Count files from working copy
    let fileCount = 0;
    try {
      const countFiles = async (dir: string) => {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.name === '.git' || entry.name === 'node_modules') continue;
          if (entry.isDirectory()) {
            await countFiles(path.join(dir, entry.name));
          } else {
            fileCount++;
          }
        }
      };
      await countFiles(workingCopyPath);
    } catch {
      // Working copy may not exist
    }

    // Get description from template.json in working copy
    let description = `${templateName} template`;
    try {
      const templateJsonPath = path.join(workingCopyPath, 'template.json');
      const templateJson = JSON.parse(await fs.readFile(templateJsonPath, 'utf-8'));
      description = templateJson.description || description;
    } catch {
      // No template.json
    }

    return {
      name: templateName,
      version,
      commit,
      description,
      files: fileCount,
      lastModified,
    };
  }

  /**
   * Get comprehensive template context for AI agents
   * This tells agents what the template already provides
   */
  async getTemplateContext(templateName: string): Promise<TemplateContext | null> {
    const workingCopyPath = path.join(this.workingCopyDir, templateName);

    try {
      await fs.access(workingCopyPath);
    } catch {
      return null;
    }

    // Read template.json for metadata
    let templateJson: {
      name?: string;
      version?: string;
      description?: string;
      category?: string;
      features?: string[];
      screens?: string[];
      components?: string[];
    } = {};
    try {
      const content = await fs.readFile(path.join(workingCopyPath, 'template.json'), 'utf-8');
      templateJson = JSON.parse(content);
    } catch {
      // No template.json
    }

    // Read package.json for dependencies
    let dependencies: Record<string, string> = {};
    try {
      const content = await fs.readFile(path.join(workingCopyPath, 'package.json'), 'utf-8');
      const packageJson = JSON.parse(content);
      dependencies = packageJson.dependencies || {};
    } catch {
      // No package.json
    }

    // Extract screens from app/(tabs) directory
    const screens = await this.extractScreens(workingCopyPath);

    // Extract components from components directory
    const components = await this.extractComponents(workingCopyPath);

    // Extract hooks from hooks directory
    const hooks = await this.extractHooks(workingCopyPath);

    // Extract types from types directory
    const types = await this.extractTypes(workingCopyPath);

    // Extract services from services directory
    const services = await this.extractServices(workingCopyPath);

    // Get file structure overview
    const fileStructure = await this.getFileStructure(workingCopyPath);

    return {
      name: templateJson.name || templateName,
      version: templateJson.version || '1.0.0',
      description: templateJson.description || `${templateName} template`,
      category: templateJson.category || 'custom',
      features: templateJson.features || [],
      screens,
      components,
      hooks,
      types,
      services,
      dependencies,
      fileStructure,
    };
  }

  /**
   * Extract screen information from the template
   */
  private async extractScreens(templatePath: string): Promise<ScreenInfo[]> {
    const screens: ScreenInfo[] = [];
    const tabsDir = path.join(templatePath, 'src', 'app', '(tabs)');

    try {
      const entries = await fs.readdir(tabsDir, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isFile() || entry.name.startsWith('_')) continue;
        if (!entry.name.endsWith('.tsx')) continue;

        const screenName = entry.name.replace('.tsx', '');
        const screenPath = path.join(tabsDir, entry.name);
        const content = await fs.readFile(screenPath, 'utf-8');

        // Extract imported components
        const componentImports = content.match(/import\s+\{([^}]+)\}\s+from\s+['"]@\/components['"]/);
        const components = componentImports
          ? componentImports[1].split(',').map((c) => c.trim())
          : [];

        // Try to extract a description from the first comment or function name
        const description = this.extractDescription(content, screenName);

        screens.push({
          name: screenName === 'index' ? 'Home' : this.formatName(screenName),
          path: `src/app/(tabs)/${entry.name}`,
          description,
          components,
        });
      }
    } catch {
      // No tabs directory
    }

    return screens;
  }

  /**
   * Extract component information from the template
   */
  private async extractComponents(templatePath: string): Promise<ComponentInfo[]> {
    const components: ComponentInfo[] = [];
    const componentsDir = path.join(templatePath, 'src', 'components');

    try {
      const entries = await fs.readdir(componentsDir, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isFile() || entry.name === 'index.ts') continue;
        if (!entry.name.endsWith('.tsx')) continue;

        const componentName = entry.name.replace('.tsx', '');
        const componentPath = path.join(componentsDir, entry.name);
        const content = await fs.readFile(componentPath, 'utf-8');

        // Extract props interface
        const propsMatch = content.match(/interface\s+\w*Props\s*\{([^}]+)\}/);
        const props = propsMatch
          ? propsMatch[1]
              .split('\n')
              .map((line) => line.trim())
              .filter((line) => line && !line.startsWith('//'))
              .map((line) => line.split(':')[0]?.trim())
              .filter(Boolean)
          : [];

        components.push({
          name: componentName,
          path: `src/components/${entry.name}`,
          props: props.length > 0 ? props : undefined,
          description: this.extractDescription(content, componentName),
        });
      }
    } catch {
      // No components directory
    }

    return components;
  }

  /**
   * Extract hook information from the template
   */
  private async extractHooks(templatePath: string): Promise<HookInfo[]> {
    const hooks: HookInfo[] = [];
    const hooksDir = path.join(templatePath, 'src', 'hooks');

    try {
      const entries = await fs.readdir(hooksDir, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isFile() || entry.name === 'index.ts') continue;
        if (!entry.name.endsWith('.ts')) continue;

        const hookName = entry.name.replace('.ts', '');
        const hookPath = path.join(hooksDir, entry.name);
        const content = await fs.readFile(hookPath, 'utf-8');

        // Extract return object properties
        const returnMatch = content.match(/return\s*\{([^}]+)\}/);
        const returns = returnMatch
          ? returnMatch[1]
              .split(',')
              .map((item) => item.trim().split(':')[0]?.trim())
              .filter(Boolean)
          : [];

        hooks.push({
          name: hookName,
          path: `src/hooks/${entry.name}`,
          returns: returns.length > 0 ? returns : undefined,
          description: this.extractDescription(content, hookName),
        });
      }
    } catch {
      // No hooks directory
    }

    return hooks;
  }

  /**
   * Extract type definitions from the template
   */
  private async extractTypes(templatePath: string): Promise<TypeInfo[]> {
    const types: TypeInfo[] = [];
    const typesPath = path.join(templatePath, 'src', 'types', 'index.ts');

    try {
      const content = await fs.readFile(typesPath, 'utf-8');

      // Extract all interface/type definitions
      const interfaceMatches = content.matchAll(/(?:export\s+)?interface\s+(\w+)\s*\{([^}]+)\}/g);

      for (const match of interfaceMatches) {
        const typeName = match[1];
        const fields = match[2]
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line && !line.startsWith('//'))
          .map((line) => {
            const fieldMatch = line.match(/^(\w+)\??:/);
            return fieldMatch ? fieldMatch[1] : null;
          })
          .filter(Boolean) as string[];

        types.push({
          name: typeName,
          path: 'src/types/index.ts',
          fields: fields.length > 0 ? fields : undefined,
        });
      }
    } catch {
      // No types file
    }

    return types;
  }

  /**
   * Extract service information from the template
   */
  private async extractServices(templatePath: string): Promise<ServiceInfo[]> {
    const services: ServiceInfo[] = [];
    const servicesDir = path.join(templatePath, 'src', 'services');

    try {
      const entries = await fs.readdir(servicesDir, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isFile() || entry.name === 'index.ts') continue;
        if (!entry.name.endsWith('.ts')) continue;

        const serviceName = entry.name.replace('.ts', '');
        const servicePath = path.join(servicesDir, entry.name);
        const content = await fs.readFile(servicePath, 'utf-8');

        // Extract exported functions
        const functionMatches = content.matchAll(/export\s+(?:async\s+)?function\s+(\w+)/g);
        const methods = Array.from(functionMatches).map((m) => m[1]);

        services.push({
          name: serviceName,
          path: `src/services/${entry.name}`,
          methods: methods.length > 0 ? methods : undefined,
        });
      }
    } catch {
      // No services directory
    }

    return services;
  }

  /**
   * Get file structure overview
   */
  private async getFileStructure(templatePath: string, prefix = ''): Promise<string[]> {
    const structure: string[] = [];
    const srcDir = path.join(templatePath, 'src');

    const walkDir = async (dir: string, currentPrefix: string) => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          if (entry.name === 'node_modules' || entry.name === '.git') continue;

          const relativePath = currentPrefix ? `${currentPrefix}/${entry.name}` : entry.name;

          if (entry.isDirectory()) {
            structure.push(`${relativePath}/`);
            await walkDir(path.join(dir, entry.name), relativePath);
          } else {
            structure.push(relativePath);
          }
        }
      } catch {
        // Directory doesn't exist
      }
    };

    await walkDir(srcDir, 'src');
    return structure;
  }

  /**
   * Extract description from code comments or function name
   */
  private extractDescription(content: string, name: string): string {
    // Look for JSDoc comment
    const jsdocMatch = content.match(/\/\*\*\s*\n\s*\*\s*([^\n*]+)/);
    if (jsdocMatch) {
      return jsdocMatch[1].trim();
    }

    // Look for first line comment
    const commentMatch = content.match(/\/\/\s*(.+)/);
    if (commentMatch) {
      return commentMatch[1].trim();
    }

    // Generate from name
    return `${this.formatName(name)} screen`;
  }

  /**
   * Format camelCase/kebab-case to readable name
   */
  private formatName(name: string): string {
    return name
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  /**
   * Clone a template from bare repo to create a new project
   * This creates a fresh git history for the project
   */
  async cloneToProject(
    templateName: string,
    projectId: string,
    config: { appName: string; bundleId: string }
  ): Promise<ProjectMetadata> {
    const bareRepoPath = path.join(this.bareRepoDir, `${templateName}.git`);
    const projectPath = path.join(this.projectsDir, projectId);

    // Verify bare repo exists
    try {
      await fs.access(bareRepoPath);
    } catch {
      throw new Error(`Template '${templateName}' not found at ${bareRepoPath}`);
    }

    // Get template info before cloning
    const templateInfo = await this.getTemplateInfo(templateName);

    // Clone from bare repo
    const git = simpleGit();
    await git.clone(bareRepoPath, projectPath, ['--depth', '1']);

    // Remove origin (no relationship to template after clone)
    const projectGit = simpleGit(projectPath);
    await projectGit.removeRemote('origin');

    // Remove .git and reinitialize for fresh history
    await fs.rm(path.join(projectPath, '.git'), { recursive: true });
    await projectGit.init();
    await projectGit.addConfig('user.email', 'mobigen@generated.local');
    await projectGit.addConfig('user.name', 'Mobigen Generator');

    // Create project metadata
    const metadata: ProjectMetadata = {
      projectId,
      template: templateName,
      templateVersion: templateInfo?.version || '0.0.0',
      templateCommit: templateInfo?.commit || 'unknown',
      createdAt: new Date().toISOString(),
      generationHistory: [],
    };

    // Write metadata file
    await fs.writeFile(
      path.join(projectPath, '.mobigen.json'),
      JSON.stringify(metadata, null, 2)
    );

    // Update app.json with project-specific values
    await this.updateAppConfig(projectPath, config);

    // Initial commit
    await projectGit.add('.');
    await projectGit.commit(
      `Initial project from ${templateName}@${templateInfo?.version || 'unknown'} (${templateInfo?.commit || 'unknown'})`
    );

    return metadata;
  }

  /**
   * Update app.json with project-specific configuration
   */
  private async updateAppConfig(
    projectPath: string,
    config: { appName: string; bundleId: string }
  ): Promise<void> {
    const appJsonPath = path.join(projectPath, 'app.json');

    try {
      const appJson = JSON.parse(await fs.readFile(appJsonPath, 'utf-8'));

      appJson.expo = appJson.expo || {};
      appJson.expo.name = config.appName;
      appJson.expo.slug = config.appName.toLowerCase().replace(/\s+/g, '-');
      appJson.expo.ios = appJson.expo.ios || {};
      appJson.expo.ios.bundleIdentifier = config.bundleId;
      appJson.expo.android = appJson.expo.android || {};
      appJson.expo.android.package = config.bundleId;

      await fs.writeFile(appJsonPath, JSON.stringify(appJson, null, 2));
    } catch {
      // No app.json to update
    }
  }

  /**
   * Get project metadata
   */
  async getProjectMetadata(projectId: string): Promise<ProjectMetadata | null> {
    const metadataPath = path.join(this.projectsDir, projectId, '.mobigen.json');

    try {
      const content = await fs.readFile(metadataPath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  /**
   * Update project metadata
   */
  async updateProjectMetadata(
    projectId: string,
    update: Partial<ProjectMetadata>
  ): Promise<void> {
    const metadata = await this.getProjectMetadata(projectId);
    if (!metadata) {
      throw new Error(`Project '${projectId}' not found`);
    }

    const updated = { ...metadata, ...update };
    const metadataPath = path.join(this.projectsDir, projectId, '.mobigen.json');
    await fs.writeFile(metadataPath, JSON.stringify(updated, null, 2));
  }

  /**
   * Add a generation record to project history and commit
   */
  async recordGeneration(
    projectId: string,
    record: Omit<GenerationRecord, 'timestamp' | 'commit'>
  ): Promise<string> {
    const projectPath = path.join(this.projectsDir, projectId);
    const git = simpleGit(projectPath);

    // Stage all changes
    await git.add('.');

    // Commit with descriptive message
    const commitMessage = `[${record.phase}] ${record.prompt.substring(0, 50)}${record.prompt.length > 50 ? '...' : ''}`;
    const result = await git.commit(commitMessage);
    const commitHash = result.commit.substring(0, 7);

    // Update metadata
    const metadata = await this.getProjectMetadata(projectId);
    if (metadata) {
      metadata.generationHistory.push({
        ...record,
        timestamp: new Date().toISOString(),
        commit: commitHash,
      });

      const metadataPath = path.join(projectPath, '.mobigen.json');
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

      // Commit metadata update
      await git.add('.mobigen.json');
      await git.commit(`Update generation history for ${record.phase}`);
    }

    return commitHash;
  }

  /**
   * Revert project to a previous generation
   */
  async revertProject(projectId: string, commitHash: string): Promise<void> {
    const projectPath = path.join(this.projectsDir, projectId);
    const git = simpleGit(projectPath);

    await git.checkout(commitHash, ['--', '.']);
    await git.add('.');
    await git.commit(`Reverted to ${commitHash}`);
  }

  /**
   * Get project git history
   */
  async getProjectHistory(projectId: string, count: number = 20): Promise<Array<{
    hash: string;
    message: string;
    date: Date;
  }>> {
    const projectPath = path.join(this.projectsDir, projectId);
    const git = simpleGit(projectPath);

    const log = await git.log({ maxCount: count });
    return log.all.map((entry) => ({
      hash: entry.hash.substring(0, 7),
      message: entry.message,
      date: new Date(entry.date),
    }));
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TEMPLATE MANAGEMENT (for template developers)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Push template working copy changes to bare repo
   */
  async pushTemplateChanges(templateName: string, message: string): Promise<string> {
    const workingCopyPath = path.join(this.workingCopyDir, templateName);
    const git = simpleGit(workingCopyPath);

    await git.add('.');
    const result = await git.commit(message);
    await git.push('origin', 'master');

    return result.commit.substring(0, 7);
  }

  /**
   * Tag a new template version
   */
  async tagTemplateVersion(templateName: string, version: string, message?: string): Promise<void> {
    const workingCopyPath = path.join(this.workingCopyDir, templateName);
    const git = simpleGit(workingCopyPath);

    const tag = version.startsWith('v') ? version : `v${version}`;
    if (message) {
      await git.addAnnotatedTag(tag, message);
    } else {
      await git.addTag(tag);
    }

    await git.push('origin', tag);
  }

  /**
   * Revert template to a previous version
   */
  async revertTemplate(templateName: string, version: string): Promise<void> {
    const workingCopyPath = path.join(this.workingCopyDir, templateName);
    const git = simpleGit(workingCopyPath);

    const tag = version.startsWith('v') ? version : `v${version}`;
    await git.checkout(tag);
  }

  /**
   * Get template commit history
   */
  async getTemplateHistory(templateName: string, count: number = 20): Promise<Array<{
    hash: string;
    message: string;
    date: Date;
    tags: string[];
  }>> {
    const bareRepoPath = path.join(this.bareRepoDir, `${templateName}.git`);
    const git = simpleGit(bareRepoPath);

    const log = await git.log({ maxCount: count });
    const tags = await git.tags();

    // Map tags to commits
    const tagMap = new Map<string, string[]>();
    for (const tag of tags.all) {
      try {
        const tagCommit = await git.revparse([tag]);
        const shortHash = tagCommit.substring(0, 7);
        if (!tagMap.has(shortHash)) {
          tagMap.set(shortHash, []);
        }
        tagMap.get(shortHash)!.push(tag);
      } catch {
        // Skip invalid tags
      }
    }

    return log.all.map((entry) => {
      const shortHash = entry.hash.substring(0, 7);
      return {
        hash: shortHash,
        message: entry.message,
        date: new Date(entry.date),
        tags: tagMap.get(shortHash) || [],
      };
    });
  }

  /**
   * Pull latest template changes from bare repo to working copy
   */
  async pullTemplateChanges(templateName: string): Promise<void> {
    const workingCopyPath = path.join(this.workingCopyDir, templateName);
    const git = simpleGit(workingCopyPath);

    await git.pull('origin', 'master');
  }
}
