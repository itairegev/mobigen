/**
 * Figma API Client
 * Handles all communication with Figma's REST API
 */

import axios, { AxiosInstance } from 'axios';
import type { FigmaFile, FigmaNode } from '../types';

const FIGMA_API_BASE = 'https://api.figma.com/v1';
const RATE_LIMIT_REQUESTS = 900;
const RATE_LIMIT_WINDOW_MS = 60000;

export interface FigmaClientConfig {
  accessToken: string;
  timeout?: number;
}

export interface GetFileOptions {
  ids?: string;
  depth?: number;
  geometry?: 'paths' | 'bounds';
  version?: string;
}

export interface GetImagesOptions {
  ids: string[];
  format?: 'png' | 'jpg' | 'svg' | 'pdf';
  scale?: number;
}

export class FigmaClient {
  private client: AxiosInstance;
  private requestQueue: Array<() => Promise<void>> = [];
  private requestCount = 0;
  private lastReset = Date.now();

  constructor(config: FigmaClientConfig) {
    this.client = axios.create({
      baseURL: FIGMA_API_BASE,
      timeout: config.timeout || 30000,
      headers: {
        'X-Figma-Token': config.accessToken,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Rate limiter - ensures we don't exceed 900 requests/minute
   */
  private async checkRateLimit(): Promise<void> {
    const now = Date.now();

    if (now - this.lastReset > RATE_LIMIT_WINDOW_MS) {
      this.requestCount = 0;
      this.lastReset = now;
    }

    if (this.requestCount >= RATE_LIMIT_REQUESTS) {
      const waitTime = RATE_LIMIT_WINDOW_MS - (now - this.lastReset);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.requestCount = 0;
      this.lastReset = Date.now();
    }

    this.requestCount++;
  }

  /**
   * Get a Figma file
   */
  async getFile(fileKey: string, options?: GetFileOptions): Promise<FigmaFile> {
    await this.checkRateLimit();

    const params: Record<string, string> = {};
    if (options?.ids) params.ids = options.ids;
    if (options?.depth) params.depth = String(options.depth);
    if (options?.geometry) params.geometry = options.geometry;
    if (options?.version) params.version = options.version;

    const response = await this.client.get(`/files/${fileKey}`, { params });
    return response.data;
  }

  /**
   * Get file nodes
   */
  async getNodes(fileKey: string, nodeIds: string[]): Promise<Record<string, FigmaNode>> {
    await this.checkRateLimit();

    const response = await this.client.get(`/files/${fileKey}/nodes`, {
      params: { ids: nodeIds.join(',') },
    });
    return response.data.nodes;
  }

  /**
   * Get rendered images from Figma
   */
  async getImages(fileKey: string, options: GetImagesOptions): Promise<Record<string, string>> {
    await this.checkRateLimit();

    const params: Record<string, string | number> = {
      ids: options.ids.join(','),
      format: options.format || 'png',
      scale: options.scale || 1,
    };

    const response = await this.client.get(`/images/${fileKey}`, { params });
    return response.data.images;
  }

  /**
   * Get file styles
   */
  async getStyles(fileKey: string): Promise<Record<string, any>> {
    await this.checkRateLimit();
    const file = await this.getFile(fileKey);
    return file.styles;
  }

  /**
   * Get file components
   */
  async getComponents(fileKey: string): Promise<Record<string, any>> {
    await this.checkRateLimit();
    const file = await this.getFile(fileKey);
    return file.components;
  }
}

export default FigmaClient;
