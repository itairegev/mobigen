import { prisma } from '@mobigen/db';
import { BuildRequest, BuildStatus } from './types';
import { getEASClient } from './eas-client';
import { enqueueBuild } from './queue';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';

const execAsync = promisify(exec);

interface WhiteLabelConfig {
  appName: string;
  bundleId: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
  };
  logo?: string;
  splash?: string;
}

interface ValidationResult {
  passed: boolean;
  errors?: Array<{
    file: string;
    line?: number;
    message: string;
  }>;
}

export class BuildService {
  private easClient: ReturnType<typeof getEASClient> | null = null;

  private getEASClient() {
    if (!this.easClient) {
      this.easClient = getEASClient();
    }
    return this.easClient;
  }

  /**
   * Main entry point for triggering a build
   */
  async triggerBuild(request: BuildRequest): Promise<BuildStatus> {
    console.log(`Triggering build for project ${request.projectId} on ${request.platform}`);

    try {
      // 1. Verify project exists
      const project = await prisma.project.findUnique({
        where: { id: request.projectId },
      });

      if (!project) {
        throw new Error(`Project ${request.projectId} not found`);
      }

      // 2. Load project configuration and branding
      const branding = project.branding as Record<string, unknown> || {};

      // 3. Apply white-label configuration
      const appJson = this.buildAppJson(project, branding);

      // 4. Run Tier 3 validation before build (if enabled)
      if (process.env.SKIP_VALIDATION !== 'true') {
        const validation = await this.runTier3Validation(request.projectId);
        if (!validation.passed) {
          throw new Error(
            `Validation failed: ${validation.errors?.map((e) => e.message).join(', ')}`
          );
        }
      }

      // 5. Create build record in database
      const build = await prisma.build.create({
        data: {
          projectId: request.projectId,
          version: request.version,
          platform: request.platform,
          status: 'queued',
          startedAt: new Date(),
        },
      });

      // 6. Queue the build job
      await enqueueBuild(build.id, {
        ...request,
        projectId: request.projectId,
      });

      console.log(`Build ${build.id} queued successfully`);

      return {
        id: build.id,
        projectId: request.projectId,
        platform: request.platform,
        status: 'queued',
        startedAt: build.startedAt || undefined,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed to trigger build:`, error);
      throw new Error(`Failed to trigger build: ${errorMessage}`);
    }
  }

  /**
   * Process a build job (called by queue worker)
   */
  async processBuild(buildId: string, request: BuildRequest): Promise<void> {
    try {
      // 1. Update status to building
      await prisma.build.update({
        where: { id: buildId },
        data: { status: 'building' },
      });

      // 2. Get project with EAS project ID
      const project = await prisma.project.findUnique({
        where: { id: request.projectId },
      });

      if (!project) {
        throw new Error(`Project ${request.projectId} not found`);
      }

      // 3. Get or create EAS project
      let easProjectId = (project.config as Record<string, unknown>)?.easProjectId as string | undefined;

      if (!easProjectId) {
        const branding = project.branding as Record<string, unknown> || {};
        const appJson = this.buildAppJson(project, branding);
        easProjectId = await this.getEASClient().createProject(request.projectId, appJson);

        // Store EAS project ID
        await prisma.project.update({
          where: { id: request.projectId },
          data: {
            config: {
              ...(project.config as Record<string, unknown> || {}),
              easProjectId,
            },
          },
        });
      }

      // 4. Trigger EAS build
      const easBuild = await this.getEASClient().triggerBuild(
        easProjectId,
        request.platform,
        request.profile || 'production'
      );

      // 5. Update build record with EAS build ID
      await prisma.build.update({
        where: { id: buildId },
        data: {
          easBuildId: easBuild.id,
          easProjectId,
          status: 'building',
        },
      });

      console.log(`EAS build ${easBuild.id} triggered for build ${buildId}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed to process build ${buildId}:`, error);

      // Update build status to failed
      await prisma.build.update({
        where: { id: buildId },
        data: {
          status: 'failed',
          errorSummary: errorMessage,
          completedAt: new Date(),
        },
      });

      throw error;
    }
  }

  /**
   * Build app.json from project configuration
   */
  private buildAppJson(
    project: { name: string; bundleIdIos: string | null; bundleIdAndroid: string | null },
    branding: Record<string, unknown>
  ): Record<string, unknown> {
    const slug = project.name.toLowerCase().replace(/\s+/g, '-');
    const bundleId = project.bundleIdIos || `com.mobigen.${slug}`;

    return {
      expo: {
        name: project.name,
        slug,
        version: '1.0.0',
        orientation: 'portrait',
        icon: './assets/icon.png',
        userInterfaceStyle: 'automatic',
        splash: {
          image: './assets/splash.png',
          resizeMode: 'contain',
          backgroundColor: (branding.backgroundColor as string) || '#FFFFFF',
        },
        // OTA Updates configuration
        runtimeVersion: {
          policy: 'sdkVersion', // or use appVersion for more granular control
        },
        updates: {
          enabled: true,
          fallbackToCacheTimeout: 0, // Always try to fetch latest update
          checkAutomatically: 'ON_LOAD', // Check for updates on app launch
          url: process.env.EAS_UPDATE_URL || 'https://u.expo.dev',
        },
        ios: {
          bundleIdentifier: project.bundleIdIos || bundleId,
          supportsTablet: true,
        },
        android: {
          package: project.bundleIdAndroid || bundleId.replace(/-/g, '_'),
          adaptiveIcon: {
            foregroundImage: './assets/adaptive-icon.png',
            backgroundColor: (branding.backgroundColor as string) || '#FFFFFF',
          },
        },
        extra: {
          primaryColor: branding.primaryColor || '#007AFF',
          secondaryColor: branding.secondaryColor || '#5856D6',
          // Pass EAS project ID to app for OTA updates
          eas: {
            projectId: process.env.EAS_PROJECT_ID,
          },
        },
        plugins: [
          'expo-router',
          'expo-secure-store',
          // Add expo-updates plugin
          [
            'expo-updates',
            {
              username: process.env.EXPO_ACCOUNT_OWNER || 'mobigen',
            },
          ],
        ],
      },
    };
  }

  /**
   * Run Tier 3 validation before triggering build
   * Includes: TypeScript check, ESLint, Expo prebuild, Metro bundle check
   */
  private async runTier3Validation(projectId: string): Promise<ValidationResult> {
    console.log(`Running Tier 3 validation for project ${projectId}`);

    const projectPath = await this.getProjectPath(projectId);
    if (!projectPath) {
      return {
        passed: false,
        errors: [{ file: 'project', message: `Project path not found for ${projectId}` }],
      };
    }

    const errors: Array<{ file: string; line?: number; message: string }> = [];

    // 1. TypeScript check
    console.log('  [1/4] Running TypeScript check...');
    const tsResult = await this.runTypeScriptCheck(projectPath);
    if (!tsResult.passed && tsResult.errors) {
      errors.push(...tsResult.errors);
      console.log(`  [1/4] TypeScript check failed: ${tsResult.errors.length} errors`);
    } else {
      console.log('  [1/4] TypeScript check passed');
    }

    // 2. ESLint check
    console.log('  [2/4] Running ESLint check...');
    const eslintResult = await this.runESLintCheck(projectPath);
    if (!eslintResult.passed && eslintResult.errors) {
      errors.push(...eslintResult.errors);
      console.log(`  [2/4] ESLint check failed: ${eslintResult.errors.length} errors`);
    } else {
      console.log('  [2/4] ESLint check passed');
    }

    // 3. Expo prebuild check
    console.log('  [3/4] Running Expo prebuild check...');
    const prebuildResult = await this.runExpoPrebuild(projectPath);
    if (!prebuildResult.passed && prebuildResult.errors) {
      errors.push(...prebuildResult.errors);
      console.log(`  [3/4] Expo prebuild check failed`);
    } else {
      console.log('  [3/4] Expo prebuild check passed');
    }

    // 4. Metro bundle check
    console.log('  [4/4] Running Metro bundle check...');
    const bundleResult = await this.runMetroBundleCheck(projectPath);
    if (!bundleResult.passed && bundleResult.errors) {
      errors.push(...bundleResult.errors);
      console.log(`  [4/4] Metro bundle check failed`);
    } else {
      console.log('  [4/4] Metro bundle check passed');
    }

    const passed = errors.length === 0;
    console.log(`Tier 3 validation ${passed ? 'PASSED' : 'FAILED'} (${errors.length} errors)`);

    return {
      passed,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Get the project path from storage
   */
  private async getProjectPath(projectId: string): Promise<string | null> {
    // Projects are stored in the projects directory
    const projectsRoot = process.env.PROJECTS_ROOT || path.join(process.cwd(), 'projects');
    const projectPath = path.join(projectsRoot, projectId);

    if (fs.existsSync(projectPath)) {
      return projectPath;
    }

    // Check for S3 path in project config
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { s3Prefix: true },
    });

    if (project?.s3Prefix) {
      // For S3-stored projects, we'd need to download first
      // For now, return null if not found locally
      console.warn(`Project ${projectId} is stored in S3 but not locally available`);
    }

    return null;
  }

  /**
   * Run TypeScript type check
   */
  private async runTypeScriptCheck(projectPath: string): Promise<ValidationResult> {
    try {
      await execAsync('npx tsc --noEmit', { cwd: projectPath, timeout: 60000 });
      return { passed: true };
    } catch (error: unknown) {
      const execError = error as { stdout?: string; stderr?: string; message?: string };
      const output = execError.stderr || execError.stdout || '';
      return {
        passed: false,
        errors: this.parseTypeScriptErrors(output),
      };
    }
  }

  /**
   * Run ESLint check
   */
  private async runESLintCheck(projectPath: string): Promise<ValidationResult> {
    try {
      // Check if src directory exists
      const srcPath = path.join(projectPath, 'src');
      if (!fs.existsSync(srcPath)) {
        return { passed: true }; // No src to lint
      }

      await execAsync('npx eslint src/ --ext .ts,.tsx --max-warnings 0', {
        cwd: projectPath,
        timeout: 60000,
      });
      return { passed: true };
    } catch (error: unknown) {
      const execError = error as { stdout?: string; stderr?: string; message?: string };
      const output = execError.stdout || '';
      return {
        passed: false,
        errors: this.parseESLintErrors(output),
      };
    }
  }

  /**
   * Run Expo prebuild to validate native configuration
   */
  private async runExpoPrebuild(projectPath: string): Promise<ValidationResult> {
    try {
      await execAsync('npx expo prebuild --clean --no-install', {
        cwd: projectPath,
        timeout: 120000,
      });
      return { passed: true };
    } catch (error: unknown) {
      const execError = error as { message?: string };
      return {
        passed: false,
        errors: [{ file: 'expo-prebuild', message: execError.message || 'Expo prebuild failed' }],
      };
    }
  }

  /**
   * Run Metro bundle check to validate bundling
   */
  private async runMetroBundleCheck(projectPath: string): Promise<ValidationResult> {
    try {
      const outputDir = path.join('/tmp', `bundle-check-${Date.now()}`);
      await execAsync(`npx expo export --platform web --output-dir ${outputDir}`, {
        cwd: projectPath,
        timeout: 120000,
      });

      // Clean up the temporary bundle
      try {
        await execAsync(`rm -rf ${outputDir}`);
      } catch {
        // Ignore cleanup errors
      }

      return { passed: true };
    } catch (error: unknown) {
      const execError = error as { message?: string };
      return {
        passed: false,
        errors: [{ file: 'metro-bundle', message: execError.message || 'Metro bundle failed' }],
      };
    }
  }

  /**
   * Parse TypeScript error output into structured errors
   */
  private parseTypeScriptErrors(output: string): Array<{ file: string; line?: number; message: string }> {
    const errors: Array<{ file: string; line?: number; message: string }> = [];
    const lines = output.split('\n');

    // TypeScript error format: file.ts(line,col): error TS1234: message
    const errorRegex = /^(.+?)\((\d+),\d+\):\s*error\s+TS\d+:\s*(.+)$/;

    for (const line of lines) {
      const match = line.match(errorRegex);
      if (match) {
        errors.push({
          file: match[1],
          line: parseInt(match[2], 10),
          message: match[3],
        });
      }
    }

    // If no structured errors found but we know there was an error
    if (errors.length === 0 && output.includes('error TS')) {
      errors.push({
        file: 'typescript',
        message: output.substring(0, 500), // First 500 chars
      });
    }

    return errors;
  }

  /**
   * Parse ESLint error output into structured errors
   */
  private parseESLintErrors(output: string): Array<{ file: string; line?: number; message: string }> {
    const errors: Array<{ file: string; line?: number; message: string }> = [];
    const lines = output.split('\n');

    // ESLint format: /path/to/file.ts
    //   line:col  error  message  rule-name
    let currentFile = '';
    const fileRegex = /^(\/.*?\.tsx?)$/;
    const errorRegex = /^\s+(\d+):\d+\s+error\s+(.+?)\s+\S+$/;

    for (const line of lines) {
      const fileMatch = line.match(fileRegex);
      if (fileMatch) {
        currentFile = fileMatch[1];
        continue;
      }

      const errorMatch = line.match(errorRegex);
      if (errorMatch && currentFile) {
        errors.push({
          file: currentFile,
          line: parseInt(errorMatch[1], 10),
          message: errorMatch[2],
        });
      }
    }

    // If no structured errors found but we know there was an error
    if (errors.length === 0 && output.includes('error')) {
      errors.push({
        file: 'eslint',
        message: output.substring(0, 500),
      });
    }

    return errors;
  }

  /**
   * Update build status from EAS webhook or polling
   */
  async updateBuildFromEAS(
    buildId: string,
    easStatus: string,
    artifacts?: { buildUrl?: string }
  ): Promise<void> {
    const statusMap: Record<string, string> = {
      'in-queue': 'queued',
      'in-progress': 'building',
      'finished': 'success',
      'errored': 'failed',
      'canceled': 'cancelled',
    };

    const status = statusMap[easStatus] || 'building';

    const updateData: Record<string, unknown> = {
      status,
    };

    if (status === 'success' || status === 'failed' || status === 'cancelled') {
      updateData.completedAt = new Date();
    }

    if (artifacts?.buildUrl) {
      updateData.artifactS3Key = artifacts.buildUrl;
    }

    await prisma.build.update({
      where: { id: buildId },
      data: updateData,
    });
  }

  /**
   * Get build status from database
   */
  async getBuildStatus(buildId: string): Promise<BuildStatus | null> {
    const build = await prisma.build.findUnique({
      where: { id: buildId },
    });

    if (!build) {
      return null;
    }

    return {
      id: build.id,
      projectId: build.projectId,
      platform: build.platform as 'ios' | 'android',
      status: build.status as BuildStatus['status'],
      easBuildId: build.easBuildId || undefined,
      artifactUrl: build.artifactS3Key || undefined,
      errorSummary: build.errorSummary || undefined,
      startedAt: build.startedAt || undefined,
      completedAt: build.completedAt || undefined,
    };
  }

  /**
   * List builds for a project
   */
  async listBuilds(projectId: string, options?: {
    platform?: 'ios' | 'android';
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<BuildStatus[]> {
    const where: Record<string, unknown> = { projectId };

    if (options?.platform) {
      where.platform = options.platform;
    }
    if (options?.status) {
      where.status = options.status;
    }

    const builds = await prisma.build.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 20,
      skip: options?.offset || 0,
    });

    return builds.map((build) => ({
      id: build.id,
      projectId: build.projectId,
      platform: build.platform as 'ios' | 'android',
      status: build.status as BuildStatus['status'],
      easBuildId: build.easBuildId || undefined,
      artifactUrl: build.artifactS3Key || undefined,
      errorSummary: build.errorSummary || undefined,
      startedAt: build.startedAt || undefined,
      completedAt: build.completedAt || undefined,
    }));
  }

  /**
   * Cancel a build
   */
  async cancelBuild(buildId: string): Promise<void> {
    const build = await prisma.build.findUnique({
      where: { id: buildId },
    });

    if (!build) {
      throw new Error('Build not found');
    }

    if (!['queued', 'building'].includes(build.status)) {
      throw new Error('Cannot cancel completed build');
    }

    // Cancel on EAS if build has started
    if (build.easBuildId) {
      try {
        await this.getEASClient().cancelBuild(build.easBuildId);
      } catch (error) {
        console.error('Failed to cancel EAS build:', error);
      }
    }

    await prisma.build.update({
      where: { id: buildId },
      data: {
        status: 'cancelled',
        completedAt: new Date(),
      },
    });
  }
}

// Singleton instance
let buildServiceInstance: BuildService | null = null;

export function getBuildService(): BuildService {
  if (!buildServiceInstance) {
    buildServiceInstance = new BuildService();
  }
  return buildServiceInstance;
}
