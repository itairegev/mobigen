import { getEASClient } from './eas-client';
import { BuildStatus } from './types';
import { downloadAndStoreArtifact } from './artifact-storage';

interface PollerConfig {
  pollInterval: number; // milliseconds
  maxRetries: number;
  timeout: number; // milliseconds
}

const DEFAULT_CONFIG: PollerConfig = {
  pollInterval: 30000, // 30 seconds
  maxRetries: 120, // 1 hour max (120 * 30s)
  timeout: 3600000, // 1 hour
};

export class BuildStatusPoller {
  private easClient = getEASClient();
  private activePolls: Map<string, NodeJS.Timeout> = new Map();
  private config: PollerConfig;

  constructor(config?: Partial<PollerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Start polling for build status
   */
  async startPolling(buildId: string, easBuildId: string): Promise<void> {
    // Don't start if already polling
    if (this.activePolls.has(buildId)) {
      console.log(`Already polling build ${buildId}`);
      return;
    }

    console.log(`Starting status polling for build ${buildId} (EAS: ${easBuildId})`);

    let retryCount = 0;
    const startTime = Date.now();

    const poll = async () => {
      try {
        // Check timeout
        if (Date.now() - startTime > this.config.timeout) {
          console.log(`Build ${buildId} polling timed out`);
          this.stopPolling(buildId);
          await this.handleTimeout(buildId, easBuildId);
          return;
        }

        // Check retry limit
        if (retryCount >= this.config.maxRetries) {
          console.log(`Build ${buildId} reached max retries`);
          this.stopPolling(buildId);
          await this.handleMaxRetries(buildId, easBuildId);
          return;
        }

        retryCount++;

        // Fetch build status from EAS
        const easBuild = await this.easClient.getBuildStatus(easBuildId);

        console.log(
          `Build ${buildId} status: ${easBuild.status} (attempt ${retryCount})`
        );

        // Update database with latest status
        await this.updateBuildStatus(buildId, {
          status: this.mapEASStatus(easBuild.status),
        });

        // Handle terminal states
        if (this.isTerminalState(easBuild.status)) {
          this.stopPolling(buildId);

          if (easBuild.status === 'finished' || easBuild.status === 'success') {
            await this.handleSuccess(buildId, easBuildId, easBuild);
          } else if (easBuild.status === 'errored' || easBuild.status === 'failed') {
            await this.handleFailure(buildId, easBuildId, easBuild);
          } else if (easBuild.status === 'canceled') {
            await this.handleCanceled(buildId, easBuildId);
          }
        }
      } catch (error: any) {
        console.error(`Error polling build ${buildId}:`, error);

        // Continue polling on transient errors
        if (retryCount < this.config.maxRetries) {
          console.log(`Will retry polling build ${buildId}`);
        } else {
          this.stopPolling(buildId);
          await this.handlePollingError(buildId, easBuildId, error);
        }
      }
    };

    // Initial poll
    await poll();

    // Schedule recurring polls if not in terminal state
    if (this.activePolls.has(buildId)) {
      const intervalId = setInterval(poll, this.config.pollInterval);
      this.activePolls.set(buildId, intervalId);
    }
  }

  /**
   * Stop polling for a build
   */
  stopPolling(buildId: string): void {
    const intervalId = this.activePolls.get(buildId);

    if (intervalId) {
      clearInterval(intervalId);
      this.activePolls.delete(buildId);
      console.log(`Stopped polling build ${buildId}`);
    }
  }

  /**
   * Stop all active polls
   */
  stopAll(): void {
    for (const buildId of this.activePolls.keys()) {
      this.stopPolling(buildId);
    }
  }

  /**
   * Map EAS build status to our status enum
   */
  private mapEASStatus(easStatus: string): BuildStatus['status'] {
    switch (easStatus.toLowerCase()) {
      case 'pending':
      case 'in-queue':
        return 'queued';
      case 'in-progress':
      case 'building':
        return 'building';
      case 'finished':
      case 'success':
        return 'success';
      case 'errored':
      case 'failed':
      case 'canceled':
        return 'failed';
      default:
        return 'building';
    }
  }

  /**
   * Check if status is terminal (no more polling needed)
   */
  private isTerminalState(status: string): boolean {
    const terminalStates = ['finished', 'success', 'errored', 'failed', 'canceled'];
    return terminalStates.includes(status.toLowerCase());
  }

  /**
   * Handle successful build completion
   */
  private async handleSuccess(
    buildId: string,
    easBuildId: string,
    easBuild: any
  ): Promise<void> {
    console.log(`Build ${buildId} completed successfully`);

    try {
      // Get build logs
      const logs = await this.easClient.getBuildLogs(easBuildId);

      // Download and store artifact if available
      let artifactUrl: string | undefined;

      if (easBuild.artifacts?.buildUrl) {
        artifactUrl = await downloadAndStoreArtifact(
          buildId,
          easBuild.artifacts.buildUrl,
          easBuild.platform
        );
      }

      // Update database
      await this.updateBuildStatus(buildId, {
        status: 'success',
        artifactUrl,
        logs,
        completedAt: new Date(),
      });

      console.log(`Build ${buildId} artifacts stored at ${artifactUrl}`);
    } catch (error: any) {
      console.error(`Error handling success for build ${buildId}:`, error);

      // Update with partial success
      await this.updateBuildStatus(buildId, {
        status: 'success',
        errorSummary: `Artifact download failed: ${error.message}`,
        completedAt: new Date(),
      });
    }
  }

  /**
   * Handle failed build
   */
  private async handleFailure(
    buildId: string,
    easBuildId: string,
    easBuild: any
  ): Promise<void> {
    console.log(`Build ${buildId} failed`);

    try {
      // Get build logs to extract error
      const logs = await this.easClient.getBuildLogs(easBuildId);
      const errorSummary = this.extractErrorSummary(logs);

      // Update database
      await this.updateBuildStatus(buildId, {
        status: 'failed',
        logs,
        errorSummary,
        completedAt: new Date(),
      });
    } catch (error: any) {
      console.error(`Error handling failure for build ${buildId}:`, error);

      await this.updateBuildStatus(buildId, {
        status: 'failed',
        errorSummary: 'Build failed (log retrieval error)',
        completedAt: new Date(),
      });
    }
  }

  /**
   * Handle canceled build
   */
  private async handleCanceled(
    buildId: string,
    easBuildId: string
  ): Promise<void> {
    console.log(`Build ${buildId} was canceled`);

    await this.updateBuildStatus(buildId, {
      status: 'failed',
      errorSummary: 'Build was canceled',
      completedAt: new Date(),
    });
  }

  /**
   * Handle polling timeout
   */
  private async handleTimeout(
    buildId: string,
    easBuildId: string
  ): Promise<void> {
    console.log(`Build ${buildId} polling timed out`);

    await this.updateBuildStatus(buildId, {
      status: 'failed',
      errorSummary: 'Build timed out',
      completedAt: new Date(),
    });
  }

  /**
   * Handle max retries reached
   */
  private async handleMaxRetries(
    buildId: string,
    easBuildId: string
  ): Promise<void> {
    console.log(`Build ${buildId} reached max polling retries`);

    await this.updateBuildStatus(buildId, {
      status: 'failed',
      errorSummary: 'Build status polling failed',
      completedAt: new Date(),
    });
  }

  /**
   * Handle polling error
   */
  private async handlePollingError(
    buildId: string,
    easBuildId: string,
    error: Error
  ): Promise<void> {
    console.error(`Polling error for build ${buildId}:`, error);

    await this.updateBuildStatus(buildId, {
      status: 'failed',
      errorSummary: `Polling error: ${error.message}`,
      completedAt: new Date(),
    });
  }

  /**
   * Extract error summary from logs
   */
  private extractErrorSummary(logs: string): string {
    // Look for common error patterns
    const errorPatterns = [
      /error: (.+)/i,
      /failed: (.+)/i,
      /exception: (.+)/i,
      /fatal: (.+)/i,
    ];

    const lines = logs.split('\n');

    for (const line of lines.reverse()) {
      for (const pattern of errorPatterns) {
        const match = line.match(pattern);
        if (match) {
          return match[1].trim().substring(0, 500); // Limit length
        }
      }
    }

    return 'Build failed (see logs for details)';
  }

  /**
   * Update build status in database
   */
  private async updateBuildStatus(
    buildId: string,
    updates: Partial<BuildStatus>
  ): Promise<void> {
    // TODO: Implement database update
    // This would use @mobigen/db to update build record
    console.log(`Updating build ${buildId}:`, updates);
  }

  /**
   * Get active poll count
   */
  getActivePollCount(): number {
    return this.activePolls.size;
  }

  /**
   * Get active poll IDs
   */
  getActivePolls(): string[] {
    return Array.from(this.activePolls.keys());
  }
}

// Singleton instance
let pollerInstance: BuildStatusPoller | null = null;

export function getStatusPoller(): BuildStatusPoller {
  if (!pollerInstance) {
    pollerInstance = new BuildStatusPoller();
  }
  return pollerInstance;
}

// Cleanup on process exit
process.on('SIGTERM', () => {
  if (pollerInstance) {
    pollerInstance.stopAll();
  }
});

process.on('SIGINT', () => {
  if (pollerInstance) {
    pollerInstance.stopAll();
  }
});
