import axios, { AxiosInstance } from 'axios';
import { EASBuildResponse } from './types';

interface EASProjectConfig {
  name: string;
  slug: string;
  owner?: string;
}

interface EASBuildRequest {
  projectId: string;
  platform: 'ios' | 'android';
  profile: string;
}

export class EASClient {
  private client: AxiosInstance;
  private token: string;

  constructor(token?: string) {
    this.token = token || process.env.EXPO_TOKEN || '';

    if (!this.token) {
      throw new Error('EXPO_TOKEN environment variable is required');
    }

    this.client = axios.create({
      baseURL: 'https://api.expo.dev/v2',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * Create a new EAS project
   */
  async createProject(projectId: string, appJson: any): Promise<string> {
    try {
      const projectConfig: EASProjectConfig = {
        name: appJson.expo.name,
        slug: appJson.expo.slug,
        owner: appJson.expo.owner,
      };

      const response = await this.client.post('/projects', projectConfig);

      return response.data.id;
    } catch (error: any) {
      throw new Error(`Failed to create EAS project: ${error.message}`);
    }
  }

  /**
   * Trigger a new build on EAS
   */
  async triggerBuild(
    easProjectId: string,
    platform: 'ios' | 'android',
    profile: string = 'production'
  ): Promise<EASBuildResponse> {
    try {
      const buildRequest: EASBuildRequest = {
        projectId: easProjectId,
        platform,
        profile,
      };

      const response = await this.client.post(
        `/projects/${easProjectId}/builds`,
        buildRequest
      );

      return {
        id: response.data.id,
        status: response.data.status,
        platform: response.data.platform,
        artifacts: response.data.artifacts,
      };
    } catch (error: any) {
      throw new Error(`Failed to trigger EAS build: ${error.message}`);
    }
  }

  /**
   * Get the current status of a build
   */
  async getBuildStatus(easBuildId: string): Promise<EASBuildResponse> {
    try {
      const response = await this.client.get(`/builds/${easBuildId}`);

      return {
        id: response.data.id,
        status: response.data.status,
        platform: response.data.platform,
        artifacts: response.data.artifacts,
      };
    } catch (error: any) {
      throw new Error(`Failed to get build status: ${error.message}`);
    }
  }

  /**
   * Download a build artifact
   */
  async downloadArtifact(buildUrl: string): Promise<Buffer> {
    try {
      const response = await axios.get(buildUrl, {
        responseType: 'arraybuffer',
        timeout: 300000, // 5 minutes for large files
      });

      return Buffer.from(response.data);
    } catch (error: any) {
      throw new Error(`Failed to download artifact: ${error.message}`);
    }
  }

  /**
   * Get build logs
   */
  async getBuildLogs(easBuildId: string): Promise<string> {
    try {
      const response = await this.client.get(`/builds/${easBuildId}/logs`);
      return response.data.logs || '';
    } catch (error: any) {
      throw new Error(`Failed to get build logs: ${error.message}`);
    }
  }

  /**
   * Cancel a build
   */
  async cancelBuild(easBuildId: string): Promise<void> {
    try {
      await this.client.post(`/builds/${easBuildId}/cancel`);
    } catch (error: any) {
      throw new Error(`Failed to cancel build: ${error.message}`);
    }
  }

  /**
   * List builds for a project
   */
  async listBuilds(
    easProjectId: string,
    options?: {
      platform?: 'ios' | 'android';
      status?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<EASBuildResponse[]> {
    try {
      const params = new URLSearchParams();

      if (options?.platform) params.append('platform', options.platform);
      if (options?.status) params.append('status', options.status);
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.offset) params.append('offset', options.offset.toString());

      const response = await this.client.get(
        `/projects/${easProjectId}/builds?${params.toString()}`
      );

      return response.data.builds || [];
    } catch (error: any) {
      throw new Error(`Failed to list builds: ${error.message}`);
    }
  }
}

// Singleton instance
let easClientInstance: EASClient | null = null;

export function getEASClient(): EASClient {
  if (!easClientInstance) {
    easClientInstance = new EASClient();
  }
  return easClientInstance;
}
