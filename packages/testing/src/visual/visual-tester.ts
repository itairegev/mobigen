/**
 * Visual Tester
 *
 * High-level API for running visual regression tests on React Native projects.
 */

import * as fs from 'fs';
import * as path from 'path';
import { SnapshotManager, type SnapshotDiff } from './snapshot-manager';
import { compareImages, type ImageComparisonResult } from './image-comparator';
import type { StageResult, ValidationError } from '../types';

export interface VisualTestConfig {
  projectPath: string;
  screenshotsDir?: string;
  snapshotsDir?: string;
  platforms?: ('ios' | 'android' | 'web')[];
  threshold?: number;
  updateBaselines?: boolean;
  failOnNew?: boolean;
  ignorePatterns?: string[];
}

export interface VisualTestResult extends StageResult {
  diffs: SnapshotDiff[];
  report: {
    total: number;
    matched: number;
    changed: number;
    new: number;
    missing: number;
    errors: number;
    passed: boolean;
    summary: string;
  };
}

export class VisualTester {
  private config: Required<VisualTestConfig>;
  private snapshotManager: SnapshotManager;

  constructor(config: VisualTestConfig) {
    this.config = {
      projectPath: config.projectPath,
      screenshotsDir: config.screenshotsDir || 'screenshots',
      snapshotsDir: config.snapshotsDir || '.snapshots',
      platforms: config.platforms || ['ios', 'android'],
      threshold: config.threshold || 0.1,
      updateBaselines: config.updateBaselines || false,
      failOnNew: config.failOnNew || false,
      ignorePatterns: config.ignorePatterns || [],
    };

    this.snapshotManager = new SnapshotManager({
      projectPath: this.config.projectPath,
      snapshotsDir: this.config.snapshotsDir,
      platforms: this.config.platforms,
    });
  }

  /**
   * Run visual regression tests
   */
  async run(): Promise<VisualTestResult> {
    const start = Date.now();
    const errors: ValidationError[] = [];

    try {
      // Find current screenshots
      const screenshots = await this.findScreenshots();

      if (screenshots.length === 0) {
        return {
          name: 'visual-regression',
          passed: true,
          duration: Date.now() - start,
          errors: [],
          output: 'No screenshots found to compare',
          diffs: [],
          report: {
            total: 0,
            matched: 0,
            changed: 0,
            new: 0,
            missing: 0,
            errors: 0,
            passed: true,
            summary: 'No screenshots found',
          },
        };
      }

      // Compare with baselines
      const diffs = await this.snapshotManager.compareWithBaselines(screenshots, {
        threshold: this.config.threshold,
        updateOnChange: this.config.updateBaselines,
      });

      // Generate report
      const report = this.snapshotManager.generateReport(diffs);

      // Convert diffs to errors
      for (const diff of diffs) {
        if (diff.status === 'changed') {
          errors.push({
            file: diff.currentPath,
            message: `Visual change detected: ${diff.snapshot.name} (${diff.result.diffPercentage.toFixed(2)}% changed)`,
            severity: 'error',
          });
        } else if (diff.status === 'new' && this.config.failOnNew) {
          errors.push({
            file: diff.currentPath,
            message: `New screenshot without baseline: ${diff.snapshot.name}`,
            severity: 'warning',
          });
        } else if (diff.status === 'missing') {
          errors.push({
            file: diff.snapshot.filePath,
            message: `Baseline file missing: ${diff.snapshot.name}`,
            severity: 'error',
          });
        } else if (diff.status === 'error') {
          errors.push({
            file: diff.currentPath,
            message: `Visual test error: ${diff.result.error}`,
            severity: 'error',
          });
        }
      }

      return {
        name: 'visual-regression',
        passed: report.passed,
        duration: Date.now() - start,
        errors,
        output: report.summary,
        diffs,
        report,
      };
    } catch (error) {
      return {
        name: 'visual-regression',
        passed: false,
        duration: Date.now() - start,
        errors: [{
          file: this.config.projectPath,
          message: `Visual testing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'error',
        }],
        diffs: [],
        report: {
          total: 0,
          matched: 0,
          changed: 0,
          new: 0,
          missing: 0,
          errors: 1,
          passed: false,
          summary: 'Visual testing failed',
        },
      };
    }
  }

  /**
   * Find screenshots in the project
   */
  private async findScreenshots(): Promise<Array<{
    screenName: string;
    platform: 'ios' | 'android' | 'web';
    imagePath: string;
    device?: string;
  }>> {
    const screenshots: Array<{
      screenName: string;
      platform: 'ios' | 'android' | 'web';
      imagePath: string;
      device?: string;
    }> = [];

    for (const platform of this.config.platforms) {
      const platformDir = path.join(
        this.config.projectPath,
        this.config.screenshotsDir,
        platform
      );

      if (!fs.existsSync(platformDir)) continue;

      const files = this.findImageFiles(platformDir);

      for (const file of files) {
        // Skip if matches ignore pattern
        if (this.shouldIgnore(file)) continue;

        const parsed = path.parse(file);
        const relativePath = path.relative(platformDir, file);

        // Extract screen name from file path
        // e.g., "HomeScreen.png" -> "HomeScreen"
        // e.g., "screens/Home/screenshot.png" -> "screens-Home"
        const screenName = this.extractScreenName(relativePath);

        // Extract device info if present in filename
        // e.g., "HomeScreen-iphone15.png" -> device: "iphone15"
        const device = this.extractDeviceInfo(parsed.name);

        screenshots.push({
          screenName,
          platform,
          imagePath: file,
          device,
        });
      }
    }

    return screenshots;
  }

  /**
   * Find all image files in a directory
   */
  private findImageFiles(dir: string): string[] {
    const files: string[] = [];

    const walk = (currentDir: string) => {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);

        if (entry.isDirectory()) {
          walk(fullPath);
        } else if (entry.isFile()) {
          if (entry.name.match(/\.(png|jpg|jpeg)$/i)) {
            files.push(fullPath);
          }
        }
      }
    };

    walk(dir);
    return files;
  }

  /**
   * Check if file should be ignored
   */
  private shouldIgnore(filePath: string): boolean {
    const relativePath = path.relative(this.config.projectPath, filePath);

    for (const pattern of this.config.ignorePatterns) {
      // Simple glob matching
      if (pattern.includes('*')) {
        const regex = new RegExp(
          '^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$'
        );
        if (regex.test(relativePath)) return true;
      } else {
        if (relativePath.includes(pattern)) return true;
      }
    }

    // Ignore diff images
    if (filePath.includes('.diff.')) return true;

    return false;
  }

  /**
   * Extract screen name from relative path
   */
  private extractScreenName(relativePath: string): string {
    const parsed = path.parse(relativePath);
    const parts = relativePath.split(path.sep);

    if (parts.length === 1) {
      // Simple filename: "HomeScreen.png"
      return this.cleanScreenName(parsed.name);
    }

    // Nested path: join with hyphens
    return parts
      .slice(0, -1)
      .concat(this.cleanScreenName(parsed.name))
      .join('-');
  }

  /**
   * Clean screen name (remove device suffix, etc.)
   */
  private cleanScreenName(name: string): string {
    // Remove common device suffixes
    return name
      .replace(/-?(iphone|ipad|android|pixel|samsung|web)[0-9-]*$/i, '')
      .replace(/-?screenshot$/i, '')
      .replace(/-?baseline$/i, '');
  }

  /**
   * Extract device info from filename
   */
  private extractDeviceInfo(filename: string): string | undefined {
    const deviceMatch = filename.match(/-(iphone\d+|ipad\w+|pixel\d+|android|web)/i);
    return deviceMatch ? deviceMatch[1].toLowerCase() : undefined;
  }

  /**
   * Update all baselines with current screenshots
   */
  async updateBaselines(): Promise<{
    updated: number;
    failed: number;
    errors: string[];
  }> {
    const screenshots = await this.findScreenshots();
    let updated = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const screenshot of screenshots) {
      try {
        await this.snapshotManager.setBaseline(
          screenshot.screenName,
          screenshot.platform,
          screenshot.imagePath,
          { device: screenshot.device }
        );
        updated++;
      } catch (error) {
        failed++;
        errors.push(
          `Failed to update baseline for ${screenshot.screenName}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
      }
    }

    return { updated, failed, errors };
  }

  /**
   * Get snapshot manager for direct access
   */
  getSnapshotManager(): SnapshotManager {
    return this.snapshotManager;
  }

  /**
   * Compare two specific images
   */
  async compareImages(
    baselinePath: string,
    currentPath: string
  ): Promise<ImageComparisonResult> {
    return compareImages(baselinePath, currentPath, {
      threshold: this.config.threshold,
    });
  }
}

/**
 * Create a visual tester instance
 */
export function createVisualTester(config: VisualTestConfig): VisualTester {
  return new VisualTester(config);
}
