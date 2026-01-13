/**
 * Screenshot Capture Service for Mobigen Mockup System
 *
 * Generates high-quality device mockup screenshots using Puppeteer.
 * Supports dynamic branding, color overlays, and logo injection.
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import { BrandingConfig, DeviceType, MockupScreen } from '@mobigen/ui/mockup';

export interface ScreenshotOptions {
  device: DeviceType;
  screen: MockupScreen;
  branding: BrandingConfig;
  width?: number;
  height?: number;
  scale?: number;
  format?: 'png' | 'jpeg' | 'webp';
  quality?: number;
}

export interface ScreenshotResult {
  buffer: Buffer;
  width: number;
  height: number;
  format: string;
  size: number;
}

export class ScreenshotService {
  private browser: Browser | null = null;
  private isInitialized = false;

  /**
   * Initialize headless browser
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
      ],
    });

    this.isInitialized = true;
  }

  /**
   * Capture a single screen mockup as screenshot
   */
  async captureScreen(options: ScreenshotOptions): Promise<ScreenshotResult> {
    await this.initialize();

    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const page = await this.browser.newPage();

    try {
      // Set viewport to device dimensions
      await page.setViewport({
        width: options.width || 400,
        height: options.height || 800,
        deviceScaleFactor: options.scale || 2,
      });

      // Generate HTML for the mockup
      const html = this.generateMockupHTML(options);

      // Load the HTML content
      await page.setContent(html, {
        waitUntil: 'networkidle0',
      });

      // Wait for fonts and images to load
      await page.evaluate(() => {
        return Promise.all([
          document.fonts.ready,
          ...Array.from(document.images).map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise(resolve => {
              img.onload = resolve;
              img.onerror = resolve;
            });
          }),
        ]);
      });

      // Capture screenshot
      const screenshotBuffer = await page.screenshot({
        type: options.format || 'png',
        quality: options.quality || 90,
        omitBackground: false,
      });

      const buffer = Buffer.from(screenshotBuffer);

      return {
        buffer,
        width: options.width || 400,
        height: options.height || 800,
        format: options.format || 'png',
        size: buffer.length,
      };
    } finally {
      await page.close();
    }
  }

  /**
   * Capture multiple screens in batch
   */
  async captureMultiple(
    options: ScreenshotOptions[]
  ): Promise<ScreenshotResult[]> {
    await this.initialize();

    const results: ScreenshotResult[] = [];

    // Process in parallel with concurrency limit
    const concurrency = 3;
    for (let i = 0; i < options.length; i += concurrency) {
      const batch = options.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        batch.map(opt => this.captureScreen(opt))
      );
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Generate HTML for device mockup
   */
  private generateMockupHTML(options: ScreenshotOptions): string {
    const { device, screen, branding } = options;

    // Import device specs
    const deviceSpecs = {
      'iphone-15-pro': { width: 393, height: 852, cornerRadius: 55 },
      'iphone-14': { width: 390, height: 844, cornerRadius: 47 },
      'pixel-8': { width: 412, height: 915, cornerRadius: 40 },
      'galaxy-s23': { width: 360, height: 780, cornerRadius: 48 },
    };

    const spec = deviceSpecs[device];

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
    }

    .device-frame {
      width: ${spec.width}px;
      height: ${spec.height}px;
      background: #1C1C1E;
      border-radius: ${spec.cornerRadius}px;
      padding: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      position: relative;
      overflow: hidden;
    }

    .screen {
      width: 100%;
      height: 100%;
      background: white;
      border-radius: ${spec.cornerRadius - 8}px;
      overflow: hidden;
      position: relative;
    }

    .app-header {
      background: ${branding.primaryColor};
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 24px;
      font-weight: bold;
    }

    .app-name {
      color: white;
      font-size: 20px;
      font-weight: bold;
    }

    .content {
      padding: 16px;
    }

    .screen-title {
      font-size: 24px;
      font-weight: bold;
      color: #1C1C1E;
      margin-bottom: 8px;
    }

    .screen-description {
      font-size: 14px;
      color: #6B7280;
      margin-bottom: 16px;
    }

    .button {
      width: 100%;
      padding: 16px;
      border-radius: 12px;
      border: none;
      font-size: 16px;
      font-weight: 600;
      color: white;
      background: ${branding.primaryColor};
      margin-bottom: 8px;
      cursor: pointer;
    }

    .button.secondary {
      background: ${branding.secondaryColor};
    }

    ${screen.customCSS || ''}
  </style>
</head>
<body>
  <div class="device-frame">
    <div class="screen">
      <div class="app-header">
        ${
          branding.logo
            ? `<img src="${branding.logo.url}" class="logo" alt="Logo" />`
            : `<div class="logo">${branding.appName.charAt(0)}</div>`
        }
        <div class="app-name">${branding.appName}</div>
      </div>
      <div class="content">
        ${screen.html || this.generateDefaultScreenHTML(screen)}
      </div>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Generate default HTML for a screen if custom HTML not provided
   */
  private generateDefaultScreenHTML(screen: MockupScreen): string {
    return `
      <div class="screen-title">${screen.title || 'Screen'}</div>
      <div class="screen-description">${
        screen.description || 'Screen description'
      }</div>
      <button class="button">Primary Action</button>
      <button class="button secondary">Secondary Action</button>
    `;
  }

  /**
   * Clean up resources
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.isInitialized = false;
    }
  }
}

// Singleton instance
let screenshotServiceInstance: ScreenshotService | null = null;

/**
 * Get screenshot service instance
 */
export function getScreenshotService(): ScreenshotService {
  if (!screenshotServiceInstance) {
    screenshotServiceInstance = new ScreenshotService();
  }
  return screenshotServiceInstance;
}

/**
 * Clean up screenshot service
 */
export async function closeScreenshotService(): Promise<void> {
  if (screenshotServiceInstance) {
    await screenshotServiceInstance.close();
    screenshotServiceInstance = null;
  }
}
