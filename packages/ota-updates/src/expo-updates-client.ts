import { execa } from 'execa';
import type { ExpoPublishOptions, ExpoUpdateResponse } from './types';

/**
 * Client for interacting with Expo Updates API
 */
export class ExpoUpdatesClient {
  private easToken: string;

  constructor(easToken?: string) {
    this.easToken = easToken || process.env.EXPO_TOKEN || '';

    if (!this.easToken) {
      throw new Error('EXPO_TOKEN is required for OTA updates');
    }
  }

  /**
   * Publish an update to Expo
   */
  async publishUpdate(options: ExpoPublishOptions): Promise<ExpoUpdateResponse> {
    const {
      projectPath,
      message,
      branchName,
      platform = 'all',
      runtimeVersion,
    } = options;

    try {
      const args = [
        'update',
        '--branch', branchName,
        '--message', message,
        '--non-interactive',
      ];

      // Add platform if specified
      if (platform !== 'all') {
        args.push('--platform', platform);
      }

      // Add runtime version if specified
      if (runtimeVersion) {
        args.push('--runtime-version', runtimeVersion);
      }

      // Execute eas update command
      const { stdout } = await execa('eas', args, {
        cwd: projectPath,
        env: {
          ...process.env,
          EXPO_TOKEN: this.easToken,
        },
      });

      // Parse the output to extract update information
      const updateInfo = this.parseUpdateOutput(stdout);

      return updateInfo;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to publish update: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get update information for a specific update ID
   */
  async getUpdate(updateId: string, projectId: string): Promise<ExpoUpdateResponse | null> {
    try {
      const { stdout } = await execa('eas', [
        'update:view',
        updateId,
        '--json',
        '--non-interactive',
      ], {
        env: {
          ...process.env,
          EXPO_TOKEN: this.easToken,
        },
      });

      return JSON.parse(stdout);
    } catch (error) {
      console.error(`Failed to get update ${updateId}:`, error);
      return null;
    }
  }

  /**
   * List updates for a specific branch
   */
  async listUpdates(branchName: string, projectPath: string): Promise<ExpoUpdateResponse[]> {
    try {
      const { stdout } = await execa('eas', [
        'update:list',
        '--branch', branchName,
        '--json',
        '--non-interactive',
      ], {
        cwd: projectPath,
        env: {
          ...process.env,
          EXPO_TOKEN: this.easToken,
        },
      });

      return JSON.parse(stdout);
    } catch (error) {
      console.error(`Failed to list updates for branch ${branchName}:`, error);
      return [];
    }
  }

  /**
   * Delete an update
   */
  async deleteUpdate(updateId: string): Promise<void> {
    try {
      await execa('eas', [
        'update:delete',
        updateId,
        '--non-interactive',
      ], {
        env: {
          ...process.env,
          EXPO_TOKEN: this.easToken,
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to delete update: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Create or update a branch
   */
  async configureBranch(
    branchName: string,
    projectPath: string,
    runtimeVersion?: string
  ): Promise<void> {
    try {
      const args = [
        'branch:create',
        branchName,
        '--non-interactive',
      ];

      if (runtimeVersion) {
        args.push('--runtime-version', runtimeVersion);
      }

      await execa('eas', args, {
        cwd: projectPath,
        env: {
          ...process.env,
          EXPO_TOKEN: this.easToken,
        },
      });
    } catch (error) {
      // Branch might already exist, which is fine
      console.log(`Branch ${branchName} might already exist or creation failed:`, error);
    }
  }

  /**
   * Parse the output from eas update command
   */
  private parseUpdateOutput(output: string): ExpoUpdateResponse {
    // The output format varies, so we need to parse it carefully
    // This is a simplified parser - in production you'd want more robust parsing

    const lines = output.split('\n');
    const result: Partial<ExpoUpdateResponse> = {};

    for (const line of lines) {
      if (line.includes('Update ID:')) {
        result.id = line.split(':')[1]?.trim() || '';
      }
      if (line.includes('Group ID:')) {
        result.groupId = line.split(':')[1]?.trim() || '';
      }
      if (line.includes('Branch:')) {
        result.branchName = line.split(':')[1]?.trim() || '';
      }
      if (line.includes('Runtime version:')) {
        result.runtimeVersion = line.split(':')[1]?.trim() || '';
      }
      if (line.includes('Platform:')) {
        result.platform = line.split(':')[1]?.trim() || '';
      }
      if (line.includes('Manifest URL:')) {
        result.manifestUrl = line.split('URL:')[1]?.trim() || '';
      }
    }

    // Fallback values if parsing fails
    return {
      id: result.id || '',
      groupId: result.groupId || '',
      runtimeVersion: result.runtimeVersion || '',
      platform: result.platform || 'all',
      message: '',
      createdAt: new Date().toISOString(),
      branchName: result.branchName || '',
      manifestUrl: result.manifestUrl || '',
    };
  }

  /**
   * Get runtime version from app.json
   */
  async getRuntimeVersion(projectPath: string): Promise<string> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');

      const appJsonPath = path.join(projectPath, 'app.json');
      const appJson = JSON.parse(await fs.readFile(appJsonPath, 'utf-8'));

      // Runtime version can be in expo.runtimeVersion or we can derive from version
      return appJson.expo?.runtimeVersion || appJson.expo?.version || '1.0.0';
    } catch (error) {
      console.error('Failed to read runtime version:', error);
      return '1.0.0';
    }
  }
}
