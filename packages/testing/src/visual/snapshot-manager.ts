/**
 * Snapshot Manager
 *
 * Manages visual snapshots/baselines for projects.
 * Handles storing, retrieving, and updating baseline images.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { compareImages, type ImageComparisonResult } from './image-comparator';

export interface Snapshot {
  id: string;
  name: string;
  screenName: string;
  platform: 'ios' | 'android' | 'web';
  device?: string;
  filePath: string;
  hash: string;
  width: number;
  height: number;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface SnapshotDiff {
  snapshot: Snapshot;
  currentPath: string;
  result: ImageComparisonResult;
  status: 'match' | 'changed' | 'new' | 'missing' | 'error';
}

export interface SnapshotManagerConfig {
  projectPath: string;
  snapshotsDir?: string;
  platforms?: ('ios' | 'android' | 'web')[];
}

const DEFAULT_SNAPSHOTS_DIR = '.snapshots';

export class SnapshotManager {
  private projectPath: string;
  private snapshotsDir: string;
  private platforms: ('ios' | 'android' | 'web')[];
  private manifest: Map<string, Snapshot> = new Map();

  constructor(config: SnapshotManagerConfig) {
    this.projectPath = config.projectPath;
    this.snapshotsDir = config.snapshotsDir || DEFAULT_SNAPSHOTS_DIR;
    this.platforms = config.platforms || ['ios', 'android'];

    this.ensureDirectories();
    this.loadManifest();
  }

  /**
   * Ensure snapshot directories exist
   */
  private ensureDirectories(): void {
    const baseDir = path.join(this.projectPath, this.snapshotsDir);

    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }

    for (const platform of this.platforms) {
      const platformDir = path.join(baseDir, platform);
      if (!fs.existsSync(platformDir)) {
        fs.mkdirSync(platformDir, { recursive: true });
      }
    }
  }

  /**
   * Load snapshot manifest from disk
   */
  private loadManifest(): void {
    const manifestPath = this.getManifestPath();

    if (fs.existsSync(manifestPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
        this.manifest = new Map(
          Object.entries(data).map(([k, v]) => [k, this.deserializeSnapshot(v as Record<string, unknown>)])
        );
      } catch {
        console.warn('[snapshot] Failed to load manifest, starting fresh');
        this.manifest = new Map();
      }
    }
  }

  /**
   * Save manifest to disk
   */
  private saveManifest(): void {
    const manifestPath = this.getManifestPath();
    const data = Object.fromEntries(this.manifest);
    fs.writeFileSync(manifestPath, JSON.stringify(data, null, 2));
  }

  /**
   * Get manifest file path
   */
  private getManifestPath(): string {
    return path.join(this.projectPath, this.snapshotsDir, 'manifest.json');
  }

  /**
   * Deserialize snapshot from JSON
   */
  private deserializeSnapshot(data: Record<string, unknown>): Snapshot {
    return {
      ...data,
      createdAt: new Date(data.createdAt as string),
      updatedAt: new Date(data.updatedAt as string),
    } as Snapshot;
  }

  /**
   * Generate snapshot ID
   */
  private generateSnapshotId(
    screenName: string,
    platform: 'ios' | 'android' | 'web',
    device?: string
  ): string {
    const parts = [screenName, platform];
    if (device) parts.push(device);
    return parts.join('-').toLowerCase().replace(/[^a-z0-9-]/g, '-');
  }

  /**
   * Calculate file hash
   */
  private async calculateHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);

      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex').substring(0, 16)));
      stream.on('error', reject);
    });
  }

  /**
   * Get image dimensions (basic implementation)
   */
  private async getImageDimensions(filePath: string): Promise<{ width: number; height: number }> {
    // Read PNG header for dimensions
    const buffer = Buffer.alloc(24);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 24, 0);
    fs.closeSync(fd);

    // PNG width and height are at bytes 16-23 (big-endian)
    if (buffer.toString('hex', 0, 8) === '89504e470d0a1a0a') {
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      return { width, height };
    }

    // Default fallback
    return { width: 0, height: 0 };
  }

  /**
   * Add or update a baseline snapshot
   */
  async setBaseline(
    screenName: string,
    platform: 'ios' | 'android' | 'web',
    imagePath: string,
    options: {
      device?: string;
      metadata?: Record<string, unknown>;
    } = {}
  ): Promise<Snapshot> {
    const id = this.generateSnapshotId(screenName, platform, options.device);
    const hash = await this.calculateHash(imagePath);
    const dimensions = await this.getImageDimensions(imagePath);

    // Copy image to snapshots directory
    const fileName = `${id}.png`;
    const destPath = path.join(
      this.projectPath,
      this.snapshotsDir,
      platform,
      fileName
    );

    fs.copyFileSync(imagePath, destPath);

    const now = new Date();
    const existing = this.manifest.get(id);

    const snapshot: Snapshot = {
      id,
      name: `${screenName} (${platform})`,
      screenName,
      platform,
      device: options.device,
      filePath: destPath,
      hash,
      width: dimensions.width,
      height: dimensions.height,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      metadata: options.metadata,
    };

    this.manifest.set(id, snapshot);
    this.saveManifest();

    return snapshot;
  }

  /**
   * Get a baseline snapshot
   */
  getBaseline(
    screenName: string,
    platform: 'ios' | 'android' | 'web',
    device?: string
  ): Snapshot | null {
    const id = this.generateSnapshotId(screenName, platform, device);
    return this.manifest.get(id) || null;
  }

  /**
   * Get all baselines for a platform
   */
  getBaselinesByPlatform(platform: 'ios' | 'android' | 'web'): Snapshot[] {
    return Array.from(this.manifest.values()).filter(s => s.platform === platform);
  }

  /**
   * Get all baselines
   */
  getAllBaselines(): Snapshot[] {
    return Array.from(this.manifest.values());
  }

  /**
   * Compare current screenshots against baselines
   */
  async compareWithBaselines(
    screenshots: Array<{
      screenName: string;
      platform: 'ios' | 'android' | 'web';
      imagePath: string;
      device?: string;
    }>,
    options: {
      threshold?: number;
      updateOnChange?: boolean;
    } = {}
  ): Promise<SnapshotDiff[]> {
    const diffs: SnapshotDiff[] = [];
    const { threshold = 0.1, updateOnChange = false } = options;

    for (const screenshot of screenshots) {
      const baseline = this.getBaseline(
        screenshot.screenName,
        screenshot.platform,
        screenshot.device
      );

      if (!baseline) {
        // New screenshot - no baseline exists
        const newSnapshot = await this.setBaseline(
          screenshot.screenName,
          screenshot.platform,
          screenshot.imagePath,
          { device: screenshot.device }
        );

        diffs.push({
          snapshot: newSnapshot,
          currentPath: screenshot.imagePath,
          result: {
            match: false,
            diffCount: -1,
            diffPercentage: 100,
            width: newSnapshot.width,
            height: newSnapshot.height,
            threshold,
            error: 'New screenshot - no baseline',
          },
          status: 'new',
        });
        continue;
      }

      // Check if baseline file exists
      if (!fs.existsSync(baseline.filePath)) {
        diffs.push({
          snapshot: baseline,
          currentPath: screenshot.imagePath,
          result: {
            match: false,
            diffCount: -1,
            diffPercentage: 100,
            width: 0,
            height: 0,
            threshold,
            error: 'Baseline file missing',
          },
          status: 'missing',
        });
        continue;
      }

      // Compare images
      const result = await compareImages(baseline.filePath, screenshot.imagePath, {
        threshold,
        outputDiff: true,
        outputPath: path.join(
          this.projectPath,
          this.snapshotsDir,
          'diffs',
          `${baseline.id}.diff.png`
        ),
      });

      let status: SnapshotDiff['status'];
      if (result.error) {
        status = 'error';
      } else if (result.match) {
        status = 'match';
      } else {
        status = 'changed';

        // Update baseline if requested
        if (updateOnChange) {
          await this.setBaseline(
            screenshot.screenName,
            screenshot.platform,
            screenshot.imagePath,
            { device: screenshot.device, metadata: baseline.metadata }
          );
        }
      }

      diffs.push({
        snapshot: baseline,
        currentPath: screenshot.imagePath,
        result,
        status,
      });
    }

    return diffs;
  }

  /**
   * Delete a baseline
   */
  deleteBaseline(
    screenName: string,
    platform: 'ios' | 'android' | 'web',
    device?: string
  ): boolean {
    const id = this.generateSnapshotId(screenName, platform, device);
    const snapshot = this.manifest.get(id);

    if (!snapshot) return false;

    // Delete file
    if (fs.existsSync(snapshot.filePath)) {
      fs.unlinkSync(snapshot.filePath);
    }

    // Remove from manifest
    this.manifest.delete(id);
    this.saveManifest();

    return true;
  }

  /**
   * Clear all baselines
   */
  clearAllBaselines(): void {
    for (const snapshot of this.manifest.values()) {
      if (fs.existsSync(snapshot.filePath)) {
        fs.unlinkSync(snapshot.filePath);
      }
    }

    this.manifest.clear();
    this.saveManifest();
  }

  /**
   * Generate visual regression report
   */
  generateReport(diffs: SnapshotDiff[]): {
    total: number;
    matched: number;
    changed: number;
    new: number;
    missing: number;
    errors: number;
    passed: boolean;
    summary: string;
    details: Array<{
      name: string;
      status: string;
      diffPercentage: number;
      diffImagePath?: string;
    }>;
  } {
    const counts = {
      match: 0,
      changed: 0,
      new: 0,
      missing: 0,
      error: 0,
    };

    const details = diffs.map(diff => {
      counts[diff.status]++;
      return {
        name: diff.snapshot.name,
        status: diff.status,
        diffPercentage: diff.result.diffPercentage,
        diffImagePath: diff.result.diffImagePath,
      };
    });

    const passed = counts.changed === 0 && counts.error === 0;

    const summaryParts: string[] = [];
    if (counts.match > 0) summaryParts.push(`${counts.match} matched`);
    if (counts.changed > 0) summaryParts.push(`${counts.changed} changed`);
    if (counts.new > 0) summaryParts.push(`${counts.new} new`);
    if (counts.missing > 0) summaryParts.push(`${counts.missing} missing`);
    if (counts.error > 0) summaryParts.push(`${counts.error} errors`);

    return {
      total: diffs.length,
      matched: counts.match,
      changed: counts.changed,
      new: counts.new,
      missing: counts.missing,
      errors: counts.error,
      passed,
      summary: summaryParts.join(', ') || 'No screenshots',
      details,
    };
  }
}
