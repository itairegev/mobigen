import { remote, Browser } from 'webdriverio';
import sharp from 'sharp';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

export interface Screenshot {
  id: string;
  buildId: string;
  screen: string;
  platform: 'ios' | 'android';
  url: string;
  width: number;
  height: number;
  createdAt: Date;
}

export interface VisualDiff {
  screen: string;
  baselineUrl: string;
  currentUrl: string;
  diffUrl: string;
  diffPercentage: number;
  passed: boolean;
}

export interface CaptureOptions {
  buildId: string;
  platform: 'ios' | 'android';
  screens: string[];
}

export interface CompareOptions {
  buildId: string;
  baselineId?: string;
  screenshots: Screenshot[];
}

export interface CompareBuildsOptions {
  buildId: string;
  baselineId: string;
  threshold?: number;
}

export class ScreenshotService {
  private s3: S3Client;
  private bucket: string;
  private appiumUrl: string;

  constructor() {
    this.s3 = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      endpoint: process.env.S3_ENDPOINT,
      forcePathStyle: true,
    });
    this.bucket = process.env.SCREENSHOTS_BUCKET || 'mobigen-screenshots';
    this.appiumUrl = process.env.APPIUM_URL || 'http://localhost:4723';
  }

  async captureScreenshots(options: CaptureOptions): Promise<Screenshot[]> {
    const { buildId, platform, screens } = options;
    const screenshots: Screenshot[] = [];

    // For now, we'll simulate screenshot capture
    // In production, this would connect to a real device/emulator via Appium

    for (const screen of screens) {
      try {
        const screenshot = await this.captureScreen(buildId, platform, screen);
        screenshots.push(screenshot);
      } catch (error) {
        console.error(`Failed to capture screen ${screen}:`, error);
      }
    }

    return screenshots;
  }

  private async captureScreen(
    buildId: string,
    platform: 'ios' | 'android',
    screen: string
  ): Promise<Screenshot> {
    const timestamp = Date.now();
    const key = `screenshots/${buildId}/${platform}/${screen}-${timestamp}.png`;

    // In production, this would capture from a real device
    // For now, create a placeholder
    const placeholderImage = await this.createPlaceholderImage(screen);

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: placeholderImage,
        ContentType: 'image/png',
      })
    );

    const url = `${process.env.S3_ENDPOINT || 'https://s3.amazonaws.com'}/${this.bucket}/${key}`;

    return {
      id: `${buildId}-${screen}-${timestamp}`,
      buildId,
      screen,
      platform,
      url,
      width: 390,
      height: 844,
      createdAt: new Date(),
    };
  }

  private async createPlaceholderImage(screen: string): Promise<Buffer> {
    // Create a simple placeholder image
    const width = 390;
    const height = 844;

    return sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 240, g: 240, b: 240, alpha: 1 },
      },
    })
      .png()
      .toBuffer();
  }

  async compareScreenshots(options: CompareOptions): Promise<VisualDiff[]> {
    const { buildId, baselineId, screenshots } = options;
    const diffs: VisualDiff[] = [];

    if (!baselineId) {
      // No baseline to compare against
      return diffs;
    }

    for (const screenshot of screenshots) {
      try {
        const baselineScreenshot = await this.getBaselineScreenshot(
          baselineId,
          screenshot.platform,
          screenshot.screen
        );

        if (baselineScreenshot) {
          const diff = await this.compareImages(
            baselineScreenshot,
            screenshot,
            buildId
          );
          diffs.push(diff);
        }
      } catch (error) {
        console.error(`Failed to compare ${screenshot.screen}:`, error);
      }
    }

    return diffs;
  }

  async compareBuilds(options: CompareBuildsOptions): Promise<VisualDiff[]> {
    const { buildId, baselineId, threshold = 0.1 } = options;
    const diffs: VisualDiff[] = [];

    // Get all screenshots for both builds
    const currentScreenshots = await this.getScreenshots(buildId);
    const baselineScreenshots = await this.getScreenshots(baselineId);

    for (const current of currentScreenshots) {
      const baseline = baselineScreenshots.find(
        (s) => s.screen === current.screen && s.platform === current.platform
      );

      if (baseline) {
        const diff = await this.compareImages(baseline, current, buildId, threshold);
        diffs.push(diff);
      }
    }

    return diffs;
  }

  private async compareImages(
    baseline: Screenshot,
    current: Screenshot,
    buildId: string,
    threshold: number = 0.1
  ): Promise<VisualDiff> {
    // Fetch both images
    const baselineBuffer = await this.fetchImage(baseline.url);
    const currentBuffer = await this.fetchImage(current.url);

    // Parse PNGs
    const baselinePng = PNG.sync.read(baselineBuffer);
    const currentPng = PNG.sync.read(currentBuffer);

    // Ensure same dimensions
    if (
      baselinePng.width !== currentPng.width ||
      baselinePng.height !== currentPng.height
    ) {
      return {
        screen: current.screen,
        baselineUrl: baseline.url,
        currentUrl: current.url,
        diffUrl: '',
        diffPercentage: 100,
        passed: false,
      };
    }

    // Create diff image
    const diffPng = new PNG({ width: baselinePng.width, height: baselinePng.height });

    const numDiffPixels = pixelmatch(
      baselinePng.data,
      currentPng.data,
      diffPng.data,
      baselinePng.width,
      baselinePng.height,
      { threshold: 0.1 }
    );

    const totalPixels = baselinePng.width * baselinePng.height;
    const diffPercentage = (numDiffPixels / totalPixels) * 100;

    // Save diff image
    const diffBuffer = PNG.sync.write(diffPng);
    const diffKey = `diffs/${buildId}/${current.platform}/${current.screen}-diff.png`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: diffKey,
        Body: diffBuffer,
        ContentType: 'image/png',
      })
    );

    const diffUrl = `${process.env.S3_ENDPOINT || 'https://s3.amazonaws.com'}/${this.bucket}/${diffKey}`;

    return {
      screen: current.screen,
      baselineUrl: baseline.url,
      currentUrl: current.url,
      diffUrl,
      diffPercentage,
      passed: diffPercentage <= threshold * 100,
    };
  }

  private async fetchImage(url: string): Promise<Buffer> {
    // Parse S3 URL and fetch
    const urlParts = new URL(url);
    const key = urlParts.pathname.slice(1); // Remove leading slash

    const response = await this.s3.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    );

    const stream = response.Body as Readable;
    const chunks: Buffer[] = [];

    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  }

  async getScreenshots(buildId: string): Promise<Screenshot[]> {
    const screenshots: Screenshot[] = [];

    try {
      const response = await this.s3.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: `screenshots/${buildId}/`,
        })
      );

      for (const obj of response.Contents || []) {
        if (obj.Key && obj.Key.endsWith('.png')) {
          const parts = obj.Key.split('/');
          const platform = parts[2] as 'ios' | 'android';
          const filename = parts[3];
          const screen = filename.replace(/-\d+\.png$/, '');

          screenshots.push({
            id: obj.Key,
            buildId,
            screen,
            platform,
            url: `${process.env.S3_ENDPOINT || 'https://s3.amazonaws.com'}/${this.bucket}/${obj.Key}`,
            width: 390,
            height: 844,
            createdAt: obj.LastModified || new Date(),
          });
        }
      }
    } catch (error) {
      console.error('Failed to list screenshots:', error);
    }

    return screenshots;
  }

  private async getBaselineScreenshot(
    baselineId: string,
    platform: 'ios' | 'android',
    screen: string
  ): Promise<Screenshot | null> {
    const screenshots = await this.getScreenshots(baselineId);
    return screenshots.find((s) => s.platform === platform && s.screen === screen) || null;
  }

  async setBaseline(buildId: string): Promise<void> {
    // Copy screenshots to baseline folder
    const screenshots = await this.getScreenshots(buildId);

    for (const screenshot of screenshots) {
      const sourceKey = `screenshots/${buildId}/${screenshot.platform}/${screenshot.screen}.png`;
      const targetKey = `baselines/${screenshot.platform}/${screenshot.screen}.png`;

      // Copy in S3 would require GetObject + PutObject
      // Simplified for now
      console.log(`Setting baseline: ${sourceKey} -> ${targetKey}`);
    }
  }
}
