/**
 * Version Manager
 *
 * Manages semantic versioning for Mobigen projects with Expo Updates integration.
 * Supports major.minor.patch version format and runtime version calculation.
 */

import { prisma } from '@mobigen/db';
import * as crypto from 'crypto';

export interface SemanticVersion {
  major: number;
  minor: number;
  patch: number;
}

export interface VersionInfo {
  version: string;
  runtimeVersion: string;
  createdAt: Date;
  notes?: string;
  channel?: string;
}

export type VersionType = 'major' | 'minor' | 'patch';

/**
 * Parse semantic version string to components
 */
export function parseVersion(version: string): SemanticVersion {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    throw new Error(`Invalid semantic version format: ${version}. Expected format: major.minor.patch`);
  }

  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  };
}

/**
 * Format semantic version components to string
 */
export function formatVersion(semver: SemanticVersion): string {
  return `${semver.major}.${semver.minor}.${semver.patch}`;
}

/**
 * Validate semantic version format
 */
export function isValidVersion(version: string): boolean {
  return /^\d+\.\d+\.\d+$/.test(version);
}

/**
 * Compare two semantic versions
 * Returns: -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
 */
export function compareVersions(v1: string, v2: string): number {
  const ver1 = parseVersion(v1);
  const ver2 = parseVersion(v2);

  if (ver1.major !== ver2.major) {
    return ver1.major > ver2.major ? 1 : -1;
  }
  if (ver1.minor !== ver2.minor) {
    return ver1.minor > ver2.minor ? 1 : -1;
  }
  if (ver1.patch !== ver2.patch) {
    return ver1.patch > ver2.patch ? 1 : -1;
  }
  return 0;
}

/**
 * Calculate runtime version for Expo Updates compatibility
 * Runtime version determines update compatibility - apps with same runtime version can receive OTA updates
 *
 * Strategy:
 * - Use major.minor as runtime version (patch changes are always compatible)
 * - This allows patch updates via OTA without requiring new builds
 */
export function calculateRuntimeVersion(version: string): string {
  const semver = parseVersion(version);
  return `${semver.major}.${semver.minor}`;
}

/**
 * Calculate runtime version hash (alternative strategy)
 * Generates a deterministic hash based on native dependencies and configuration
 * This is more precise but requires analyzing the project
 */
export function calculateRuntimeVersionHash(
  nativeDependencies: string[],
  expoSdkVersion: string
): string {
  const content = JSON.stringify({
    nativeDependencies: nativeDependencies.sort(),
    expoSdkVersion,
  });

  return crypto
    .createHash('sha256')
    .update(content)
    .digest('hex')
    .substring(0, 12);
}

/**
 * Check if two versions are compatible for OTA updates
 */
export function areVersionsCompatible(v1: string, v2: string): boolean {
  try {
    const runtime1 = calculateRuntimeVersion(v1);
    const runtime2 = calculateRuntimeVersion(v2);
    return runtime1 === runtime2;
  } catch {
    return false;
  }
}

/**
 * Version Manager Class
 */
export class VersionManager {
  /**
   * Get current version for a project
   */
  static async getCurrentVersion(projectId: string): Promise<VersionInfo | null> {
    // Get project to find current version number
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { currentVersion: true },
    });

    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    // Get latest OTA update for the default channel
    const defaultChannel = await prisma.updateChannel.findFirst({
      where: {
        projectId,
        isDefault: true,
      },
      include: {
        updates: {
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });

    if (!defaultChannel || defaultChannel.updates.length === 0) {
      // No versions yet - return initial version
      return {
        version: '1.0.0',
        runtimeVersion: '1.0',
        createdAt: new Date(),
        notes: 'Initial version',
        channel: 'production',
      };
    }

    const latestUpdate = defaultChannel.updates[0];
    return {
      version: `${latestUpdate.version}.0.0`, // Convert incremental to semver
      runtimeVersion: latestUpdate.runtimeVersion,
      createdAt: latestUpdate.createdAt,
      notes: latestUpdate.message,
      channel: defaultChannel.name,
    };
  }

  /**
   * Increment version
   */
  static async incrementVersion(
    projectId: string,
    type: VersionType,
    notes?: string
  ): Promise<VersionInfo> {
    const current = await this.getCurrentVersion(projectId);

    if (!current) {
      throw new Error(`Cannot increment version: no current version found for project ${projectId}`);
    }

    const semver = parseVersion(current.version);

    // Increment based on type
    switch (type) {
      case 'major':
        semver.major += 1;
        semver.minor = 0;
        semver.patch = 0;
        break;
      case 'minor':
        semver.minor += 1;
        semver.patch = 0;
        break;
      case 'patch':
        semver.patch += 1;
        break;
    }

    const newVersion = formatVersion(semver);
    return this.setVersion(projectId, newVersion, notes);
  }

  /**
   * Set specific version
   */
  static async setVersion(
    projectId: string,
    version: string,
    notes?: string
  ): Promise<VersionInfo> {
    // Validate version format
    if (!isValidVersion(version)) {
      throw new Error(`Invalid version format: ${version}. Expected format: major.minor.patch`);
    }

    // Get current version to validate increment
    const current = await this.getCurrentVersion(projectId);

    if (current && compareVersions(version, current.version) <= 0) {
      throw new Error(
        `New version ${version} must be greater than current version ${current.version}`
      );
    }

    // Calculate runtime version
    const runtimeVersion = calculateRuntimeVersion(version);

    // Get or create default channel
    let channel = await prisma.updateChannel.findFirst({
      where: {
        projectId,
        isDefault: true,
      },
    });

    if (!channel) {
      // Create default production channel
      channel = await prisma.updateChannel.create({
        data: {
          projectId,
          name: 'production',
          description: 'Production release channel',
          isDefault: true,
          runtimeVersion,
          branchName: 'main',
        },
      });
    }

    // Get next incremental version number
    const lastUpdate = await prisma.oTAUpdate.findFirst({
      where: {
        projectId,
        channelId: channel.id,
      },
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    const incrementalVersion = (lastUpdate?.version || 0) + 1;

    // Create new OTA update record
    const update = await prisma.oTAUpdate.create({
      data: {
        projectId,
        channelId: channel.id,
        version: incrementalVersion,
        runtimeVersion,
        message: notes || `Version ${version}`,
        changeType: this.getChangeType(current?.version, version),
        status: 'draft',
        platform: 'all',
      },
    });

    // Update project current version
    const semver = parseVersion(version);
    await prisma.project.update({
      where: { id: projectId },
      data: { currentVersion: semver.major },
    });

    return {
      version,
      runtimeVersion,
      createdAt: update.createdAt,
      notes: update.message,
      channel: channel.name,
    };
  }

  /**
   * Get version history for a project
   */
  static async getVersionHistory(
    projectId: string,
    options: {
      channel?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<VersionInfo[]> {
    const { channel: channelName, limit = 50, offset = 0 } = options;

    // Build query conditions
    const where: any = { projectId };

    if (channelName) {
      const channel = await prisma.updateChannel.findFirst({
        where: { projectId, name: channelName },
      });

      if (channel) {
        where.channelId = channel.id;
      }
    }

    // Get updates with channel info
    const updates = await prisma.oTAUpdate.findMany({
      where,
      include: {
        channel: {
          select: { name: true },
        },
      },
      orderBy: { version: 'desc' },
      take: limit,
      skip: offset,
    });

    return updates.map(update => ({
      version: this.incrementalToSemver(update.version),
      runtimeVersion: update.runtimeVersion,
      createdAt: update.createdAt,
      notes: update.message,
      channel: update.channel.name,
    }));
  }

  /**
   * Get all versions across all channels
   */
  static async getAllVersions(projectId: string): Promise<{
    production: VersionInfo[];
    staging: VersionInfo[];
    development: VersionInfo[];
    beta: VersionInfo[];
    [key: string]: VersionInfo[];
  }> {
    const channels = await prisma.updateChannel.findMany({
      where: { projectId },
      include: {
        updates: {
          orderBy: { version: 'desc' },
        },
      },
    });

    const result: any = {
      production: [],
      staging: [],
      development: [],
      beta: [],
    };

    for (const channel of channels) {
      const versions = channel.updates.map(update => ({
        version: this.incrementalToSemver(update.version),
        runtimeVersion: update.runtimeVersion,
        createdAt: update.createdAt,
        notes: update.message,
        channel: channel.name,
      }));

      result[channel.name] = versions;
    }

    return result;
  }

  /**
   * Get version by version string
   */
  static async getVersionByString(
    projectId: string,
    versionString: string
  ): Promise<VersionInfo | null> {
    if (!isValidVersion(versionString)) {
      return null;
    }

    const semver = parseVersion(versionString);
    const incrementalVersion = semver.major; // Simplified mapping

    const update = await prisma.oTAUpdate.findFirst({
      where: {
        projectId,
        version: incrementalVersion,
      },
      include: {
        channel: {
          select: { name: true },
        },
      },
    });

    if (!update) {
      return null;
    }

    return {
      version: versionString,
      runtimeVersion: update.runtimeVersion,
      createdAt: update.createdAt,
      notes: update.message,
      channel: update.channel.name,
    };
  }

  /**
   * Determine change type based on version increment
   */
  private static getChangeType(oldVersion: string | undefined, newVersion: string): string {
    if (!oldVersion) {
      return 'feature';
    }

    const oldSemver = parseVersion(oldVersion);
    const newSemver = parseVersion(newVersion);

    if (newSemver.major > oldSemver.major) {
      return 'feature'; // Major version bump
    } else if (newSemver.minor > oldSemver.minor) {
      return 'feature'; // Minor version bump
    } else {
      return 'fix'; // Patch version bump
    }
  }

  /**
   * Convert incremental version to semantic version (simplified)
   */
  private static incrementalToSemver(incremental: number): string {
    // Simplified: treat incremental as major version
    // In a real implementation, you'd store the actual semver
    return `${incremental}.0.0`;
  }

  /**
   * Create a new channel for beta/staging releases
   */
  static async createChannel(
    projectId: string,
    channelName: string,
    description?: string
  ): Promise<{ id: string; name: string; branchName: string }> {
    const channel = await prisma.updateChannel.create({
      data: {
        projectId,
        name: channelName,
        description: description || `${channelName} release channel`,
        isDefault: false,
        branchName: channelName,
      },
    });

    return {
      id: channel.id,
      name: channel.name,
      branchName: channel.branchName,
    };
  }

  /**
   * Get all channels for a project
   */
  static async getChannels(projectId: string): Promise<Array<{
    id: string;
    name: string;
    description: string | null;
    isDefault: boolean;
    latestVersion?: string;
  }>> {
    const channels = await prisma.updateChannel.findMany({
      where: { projectId },
      include: {
        updates: {
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });

    return channels.map(channel => ({
      id: channel.id,
      name: channel.name,
      description: channel.description,
      isDefault: channel.isDefault,
      latestVersion: channel.updates[0]
        ? this.incrementalToSemver(channel.updates[0].version)
        : undefined,
    }));
  }
}
