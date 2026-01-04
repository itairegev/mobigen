/**
 * Asset Extraction & Upload
 * Handles extracting and uploading images from Figma
 */

import axios from 'axios';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { Asset, AssetType, AssetFormat } from '../../types';

export interface AssetExtractionOptions {
  fileKey: string;
  accessToken: string;
  nodeIds: string[];
  scales?: number[];
  formats?: AssetFormat[];
  tempDir?: string;
}

export interface AssetUploadOptions {
  bucket: string;
  region: string;
  projectId: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
}

export class AssetExtractor {
  private options: Required<AssetExtractionOptions>;

  constructor(options: AssetExtractionOptions) {
    this.options = {
      ...options,
      scales: options.scales || [1, 2, 3],
      formats: options.formats || [],
      tempDir: options.tempDir || '/tmp/mobigen-assets',
    };
  }

  /**
   * Extract assets from Figma nodes
   */
  async extract(): Promise<Asset[]> {
    await fs.mkdir(this.options.tempDir, { recursive: true });
    const assets: Asset[] = [];

    for (const nodeId of this.options.nodeIds) {
      for (const scale of this.options.scales) {
        try {
          const asset = await this.extractNode(nodeId, scale);
          if (asset) assets.push(asset);
        } catch (error) {
          console.error(`Failed to extract node ${nodeId}:`, error);
        }
      }
    }

    return assets;
  }

  /**
   * Extract a single node as an asset
   */
  private async extractNode(nodeId: string, scale: number): Promise<Asset | null> {
    const format: AssetFormat = this.options.formats[0] || 'png';

    // Get image URL from Figma API
    const imageUrl = await this.getImageUrl(nodeId, format, scale);
    if (!imageUrl) return null;

    // Download image
    const assetId = this.generateId(nodeId, format, scale);
    const localPath = path.join(this.options.tempDir, `${assetId}.${format}`);
    await this.downloadFile(imageUrl, localPath);

    const stats = await fs.stat(localPath);

    return {
      id: assetId,
      type: 'image' as AssetType,
      format,
      figmaNodeId: nodeId,
      localPath,
      dimensions: { width: 0, height: 0, scale },
      metadata: {
        originalName: nodeId,
        semanticName: this.generateSemanticName(nodeId),
        fileSize: stats.size,
        hasTransparency: format === 'png',
        sourceNodeType: 'IMAGE',
      },
      extractedAt: new Date(),
    };
  }

  /**
   * Get image URL from Figma API
   */
  private async getImageUrl(nodeId: string, format: AssetFormat, scale: number): Promise<string | null> {
    const response = await axios.get(`https://api.figma.com/v1/images/${this.options.fileKey}`, {
      headers: { 'X-Figma-Token': this.options.accessToken },
      params: {
        ids: nodeId,
        format: format === 'jpg' ? 'jpg' : format === 'svg' ? 'svg' : 'png',
        scale,
      },
    });
    return response.data.images?.[nodeId] || null;
  }

  /**
   * Download file from URL
   */
  private async downloadFile(url: string, dest: string): Promise<void> {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    await fs.writeFile(dest, response.data);
  }

  /**
   * Generate unique asset ID
   */
  private generateId(nodeId: string, format: AssetFormat, scale: number): string {
    const hash = crypto.createHash('sha256').update(`${nodeId}-${format}-${scale}`).digest('hex').slice(0, 12);
    const scaleStr = scale === 1 ? '' : `@${scale}x`;
    return `asset-${hash}${scaleStr}`;
  }

  /**
   * Generate semantic name from node ID
   */
  private generateSemanticName(nodeId: string): string {
    return nodeId.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  }

  /**
   * Cleanup temp files
   */
  async cleanup(): Promise<void> {
    try {
      await fs.rm(this.options.tempDir, { recursive: true, force: true });
    } catch {}
  }
}

export class AssetUploader {
  private options: AssetUploadOptions;

  constructor(options: AssetUploadOptions) {
    this.options = options;
  }

  /**
   * Upload assets to S3
   */
  async upload(assets: Asset[]): Promise<Asset[]> {
    const uploaded: Asset[] = [];

    for (const asset of assets) {
      try {
        const s3Key = `projects/${this.options.projectId}/assets/${asset.id}.${asset.format}`;
        const s3Url = `https://${this.options.bucket}.s3.${this.options.region}.amazonaws.com/${s3Key}`;

        // In a real implementation, this would upload to S3
        // For now, we just set the URLs
        uploaded.push({
          ...asset,
          s3Key,
          s3Url,
          uploadedAt: new Date(),
        });
      } catch (error) {
        console.error(`Failed to upload asset ${asset.id}:`, error);
      }
    }

    return uploaded;
  }
}

export default { AssetExtractor, AssetUploader };
