import { prisma } from '@mobigen/db';
import { BuildRequest, BuildStatus } from './types';
import { getEASClient } from './eas-client';
import { enqueueBuild } from './queue';

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
        },
      },
    };
  }

  /**
   * Run Tier 3 validation before triggering build
   */
  private async runTier3Validation(projectId: string): Promise<ValidationResult> {
    // TODO: Implement full Tier 3 validation using @mobigen/testing
    console.log(`Running Tier 3 validation for project ${projectId}`);
    return { passed: true };
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
