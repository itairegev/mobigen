/**
 * Asset Processing Pipeline for Mobigen Mockup System
 *
 * Handles image transformations: color overlays, logo injection,
 * dynamic branding, and optimization.
 */

import { BrandingConfig } from '@mobigen/ui/mockup';

export interface AssetProcessingOptions {
  sourceBuffer: Buffer;
  branding: BrandingConfig;
  operations: AssetOperation[];
  outputFormat?: 'png' | 'jpeg' | 'webp';
  quality?: number;
}

export type AssetOperation =
  | { type: 'color-overlay'; color: string; opacity: number }
  | { type: 'logo-inject'; position: LogoPosition; size?: number }
  | { type: 'text-replace'; find: string; replace: string }
  | { type: 'resize'; width: number; height: number }
  | { type: 'optimize' };

export interface LogoPosition {
  x: number;
  y: number;
  width?: number;
  height?: number;
  anchor?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
}

export interface ProcessedAsset {
  buffer: Buffer;
  width: number;
  height: number;
  format: string;
  size: number;
  metadata: AssetMetadata;
}

export interface AssetMetadata {
  originalSize: number;
  compressionRatio: number;
  operations: string[];
  processingTime: number;
}

/**
 * Asset Processing Service
 *
 * Uses Canvas API for image manipulation (fast, no external dependencies for MVP)
 * Can be extended with Sharp for production use
 */
export class AssetProcessor {
  /**
   * Process asset with specified operations
   */
  async process(options: AssetProcessingOptions): Promise<ProcessedAsset> {
    const startTime = Date.now();
    const operations: string[] = [];

    let buffer = options.sourceBuffer;
    const originalSize = buffer.length;

    // For MVP, we'll use data URLs and Canvas API
    // In production, consider using Sharp for better performance

    for (const operation of options.operations) {
      switch (operation.type) {
        case 'color-overlay':
          buffer = await this.applyColorOverlay(buffer, operation);
          operations.push(`color-overlay:${operation.color}`);
          break;

        case 'logo-inject':
          buffer = await this.injectLogo(
            buffer,
            options.branding.logo?.url || '',
            operation
          );
          operations.push(`logo-inject:${operation.position.anchor}`);
          break;

        case 'text-replace':
          // Text replacement is handled in screenshot generation
          operations.push(`text-replace:${operation.find}->${operation.replace}`);
          break;

        case 'resize':
          buffer = await this.resizeImage(buffer, operation);
          operations.push(`resize:${operation.width}x${operation.height}`);
          break;

        case 'optimize':
          buffer = await this.optimizeImage(buffer, options);
          operations.push('optimize');
          break;
      }
    }

    const processingTime = Date.now() - startTime;

    return {
      buffer,
      width: 0, // Will be set by actual image processing
      height: 0,
      format: options.outputFormat || 'png',
      size: buffer.length,
      metadata: {
        originalSize,
        compressionRatio: buffer.length / originalSize,
        operations,
        processingTime,
      },
    };
  }

  /**
   * Apply color overlay to image
   * Uses CSS filter-style HSL adjustments
   */
  private async applyColorOverlay(
    buffer: Buffer,
    operation: Extract<AssetOperation, { type: 'color-overlay' }>
  ): Promise<Buffer> {
    // For MVP, return original buffer
    // In production, implement with Sharp or Canvas
    return buffer;
  }

  /**
   * Inject logo into image at specified position
   */
  private async injectLogo(
    buffer: Buffer,
    logoUrl: string,
    operation: Extract<AssetOperation, { type: 'logo-inject' }>
  ): Promise<Buffer> {
    // For MVP, return original buffer
    // In production, implement with Sharp or Canvas
    return buffer;
  }

  /**
   * Resize image to specified dimensions
   */
  private async resizeImage(
    buffer: Buffer,
    operation: Extract<AssetOperation, { type: 'resize' }>
  ): Promise<Buffer> {
    // For MVP, return original buffer
    // In production, implement with Sharp
    return buffer;
  }

  /**
   * Optimize image for web delivery
   */
  private async optimizeImage(
    buffer: Buffer,
    options: AssetProcessingOptions
  ): Promise<Buffer> {
    // For MVP, return original buffer
    // In production, implement with Sharp (compression, format conversion)
    return buffer;
  }

  /**
   * Generate color overlay CSS filter
   * Converts hex color to HSL and creates filter string
   */
  generateColorFilter(hexColor: string): string {
    const { h, s, l } = this.hexToHSL(hexColor);

    return `
      brightness(${l / 50})
      saturate(${s / 50})
      hue-rotate(${h}deg)
    `.trim();
  }

  /**
   * Convert hex color to HSL
   */
  private hexToHSL(hex: string): { h: number; s: number; l: number } {
    // Remove # if present
    hex = hex.replace('#', '');

    // Convert hex to RGB
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    // Find min/max RGB values
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    // Calculate lightness
    let l = (max + min) / 2;

    // Calculate saturation
    let s = 0;
    if (delta !== 0) {
      s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    }

    // Calculate hue
    let h = 0;
    if (delta !== 0) {
      switch (max) {
        case r:
          h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / delta + 2) / 6;
          break;
        case b:
          h = ((r - g) / delta + 4) / 6;
          break;
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  }

  /**
   * Calculate optimal logo position based on screen layout
   */
  calculateLogoPosition(
    screenWidth: number,
    screenHeight: number,
    anchor: LogoPosition['anchor'] = 'top-left',
    size: number = 64
  ): LogoPosition {
    const padding = 16;

    switch (anchor) {
      case 'top-left':
        return { x: padding, y: padding, width: size, height: size, anchor };

      case 'top-right':
        return {
          x: screenWidth - size - padding,
          y: padding,
          width: size,
          height: size,
          anchor,
        };

      case 'bottom-left':
        return {
          x: padding,
          y: screenHeight - size - padding,
          width: size,
          height: size,
          anchor,
        };

      case 'bottom-right':
        return {
          x: screenWidth - size - padding,
          y: screenHeight - size - padding,
          width: size,
          height: size,
          anchor,
        };

      case 'center':
        return {
          x: (screenWidth - size) / 2,
          y: (screenHeight - size) / 2,
          width: size,
          height: size,
          anchor,
        };

      default:
        return { x: padding, y: padding, width: size, height: size, anchor: 'top-left' };
    }
  }
}

// Singleton instance
let assetProcessorInstance: AssetProcessor | null = null;

/**
 * Get asset processor instance
 */
export function getAssetProcessor(): AssetProcessor {
  if (!assetProcessorInstance) {
    assetProcessorInstance = new AssetProcessor();
  }
  return assetProcessorInstance;
}
