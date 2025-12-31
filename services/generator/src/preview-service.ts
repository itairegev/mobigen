/**
 * Preview Service
 *
 * Handles app preview functionality:
 * - Web preview export and hosting
 * - QR code generation for Expo Go
 * - Preview lifecycle management
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Optional QR code library - gracefully handle if not installed
let QRCode: { toDataURL: (url: string, options: Record<string, unknown>) => Promise<string> } | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  QRCode = require('qrcode');
} catch {
  console.warn('[preview] QR code library not installed. QR codes will not be generated.');
}

const execAsync = promisify(exec);

// Preview configuration
const PREVIEW_EXPIRY_HOURS = 24;
const PREVIEW_BUCKET = process.env.PREVIEW_S3_BUCKET || 'mobigen-previews';
const PREVIEW_BASE_URL = process.env.PREVIEW_BASE_URL || 'https://preview.mobigen.io';
const EXPO_DEV_PORT_START = 19000;

// Types
export interface PreviewResult {
  success: boolean;
  previewId: string;
  type: 'web' | 'expo-go' | 'dev-build';
  url?: string;
  qrCode?: string; // Base64 encoded QR code image
  expiresAt: Date;
  error?: string;
  warnings?: string[];
}

export interface WebPreviewResult extends PreviewResult {
  type: 'web';
  bundleSize?: string;
  filesCount?: number;
}

export interface ExpoGoPreviewResult extends PreviewResult {
  type: 'expo-go';
  devServerUrl?: string;
  tunnelUrl?: string;
  lanUrl?: string;
}

export interface PreviewStatus {
  previewId: string;
  projectId: string;
  type: 'web' | 'expo-go' | 'dev-build';
  status: 'pending' | 'deploying' | 'active' | 'expired' | 'error';
  url?: string;
  createdAt: Date;
  expiresAt: Date;
  lastAccessedAt?: Date;
  error?: string;
}

// In-memory storage for previews (would be Redis/DB in production)
const activePreviews = new Map<string, PreviewStatus>();
const projectPreviews = new Map<string, Set<string>>();

// Helper to get project path
function getProjectPath(projectId: string): string {
  const mobigenRoot = process.env.MOBIGEN_ROOT || path.resolve(process.cwd(), '../..');
  return path.join(mobigenRoot, 'projects', projectId);
}

/**
 * Create a web preview by exporting the app and uploading to hosting
 */
export async function createWebPreview(projectId: string): Promise<WebPreviewResult> {
  const previewId = uuidv4();
  const projectPath = getProjectPath(projectId);
  const expiresAt = new Date(Date.now() + PREVIEW_EXPIRY_HOURS * 60 * 60 * 1000);

  // Track preview status
  const status: PreviewStatus = {
    previewId,
    projectId,
    type: 'web',
    status: 'pending',
    createdAt: new Date(),
    expiresAt,
  };
  activePreviews.set(previewId, status);
  const projectPreviewSet = projectPreviews.get(projectId) || new Set();
  projectPreviewSet.add(previewId);
  projectPreviews.set(projectId, projectPreviewSet);

  try {
    // Validate project exists
    if (!fs.existsSync(projectPath)) {
      throw new Error(`Project not found: ${projectId}`);
    }

    // Check for app.json
    const appJsonPath = path.join(projectPath, 'app.json');
    if (!fs.existsSync(appJsonPath)) {
      throw new Error('Invalid project: app.json not found');
    }

    status.status = 'deploying';

    // Install dependencies if needed
    const nodeModulesPath = path.join(projectPath, 'node_modules');
    if (!fs.existsSync(nodeModulesPath)) {
      console.log(`[preview] Installing dependencies for ${projectId}`);
      await execAsync('npm install --legacy-peer-deps', {
        cwd: projectPath,
        timeout: 120000,
      });
    }

    // Export to web
    console.log(`[preview] Exporting ${projectId} to web`);
    const distPath = path.join(projectPath, 'dist');

    // Clean previous export
    if (fs.existsSync(distPath)) {
      fs.rmSync(distPath, { recursive: true });
    }

    // Run expo export
    const { stdout, stderr } = await execAsync(
      'npx expo export --platform web --output-dir dist',
      {
        cwd: projectPath,
        timeout: 300000, // 5 minutes
        env: {
          ...process.env,
          CI: 'true', // Prevent interactive prompts
        },
      }
    );

    // Check export succeeded
    if (!fs.existsSync(path.join(distPath, 'index.html'))) {
      throw new Error('Export failed: index.html not generated');
    }

    // Calculate bundle size
    const bundleSize = await getDirectorySize(distPath);
    const filesCount = await countFiles(distPath);

    // Upload to S3 (if configured)
    let previewUrl = '';
    if (process.env.AWS_ACCESS_KEY_ID || process.env.AWS_PROFILE) {
      await uploadToS3(distPath, projectId, previewId);
      previewUrl = `${PREVIEW_BASE_URL}/${projectId}/${previewId}/`;
    } else {
      // Local preview URL for development
      previewUrl = `file://${distPath}/index.html`;
      console.log('[preview] AWS not configured, using local file URL');
    }

    // Update status
    status.status = 'active';
    status.url = previewUrl;
    activePreviews.set(previewId, status);

    // Generate QR code for the URL
    const qrCode = await generateQRCode(previewUrl);

    return {
      success: true,
      previewId,
      type: 'web',
      url: previewUrl,
      qrCode,
      expiresAt,
      bundleSize: formatBytes(bundleSize),
      filesCount,
      warnings: stderr ? [stderr] : undefined,
    };
  } catch (error) {
    status.status = 'error';
    status.error = error instanceof Error ? error.message : 'Unknown error';
    activePreviews.set(previewId, status);

    return {
      success: false,
      previewId,
      type: 'web',
      expiresAt,
      error: status.error,
    };
  }
}

/**
 * Generate QR code for Expo Go preview
 */
export async function createExpoGoPreview(projectId: string): Promise<ExpoGoPreviewResult> {
  const previewId = uuidv4();
  const projectPath = getProjectPath(projectId);
  const expiresAt = new Date(Date.now() + PREVIEW_EXPIRY_HOURS * 60 * 60 * 1000);

  // Track preview status
  const status: PreviewStatus = {
    previewId,
    projectId,
    type: 'expo-go',
    status: 'pending',
    createdAt: new Date(),
    expiresAt,
  };
  activePreviews.set(previewId, status);

  try {
    // Validate project exists
    if (!fs.existsSync(projectPath)) {
      throw new Error(`Project not found: ${projectId}`);
    }

    // Read app.json for slug
    const appJsonPath = path.join(projectPath, 'app.json');
    if (!fs.existsSync(appJsonPath)) {
      throw new Error('Invalid project: app.json not found');
    }

    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf-8'));
    const slug = appJson.expo?.slug || projectId;

    // Install dependencies if needed
    const nodeModulesPath = path.join(projectPath, 'node_modules');
    if (!fs.existsSync(nodeModulesPath)) {
      console.log(`[preview] Installing dependencies for ${projectId}`);
      await execAsync('npm install --legacy-peer-deps', {
        cwd: projectPath,
        timeout: 120000,
      });
    }

    // Generate Expo Go URLs
    // Note: These are template URLs - actual dev server would need to be running
    const devPort = EXPO_DEV_PORT_START;
    const localIp = await getLocalIpAddress();

    // expo-cli URLs format
    const devServerUrl = `exp://localhost:${devPort}`;
    const lanUrl = localIp ? `exp://${localIp}:${devPort}` : undefined;

    // For tunnel URL, would need to run `npx expo start --tunnel`
    // This would require ngrok or similar service

    // Generate QR code for LAN URL (most reliable for local preview)
    const qrUrl = lanUrl || devServerUrl;
    const qrCode = await generateQRCode(qrUrl);

    // Update status
    status.status = 'active';
    status.url = qrUrl;
    activePreviews.set(previewId, status);

    return {
      success: true,
      previewId,
      type: 'expo-go',
      url: qrUrl,
      qrCode,
      expiresAt,
      devServerUrl,
      lanUrl,
    };
  } catch (error) {
    status.status = 'error';
    status.error = error instanceof Error ? error.message : 'Unknown error';
    activePreviews.set(previewId, status);

    return {
      success: false,
      previewId,
      type: 'expo-go',
      expiresAt,
      error: status.error,
    };
  }
}

/**
 * Get preview status
 */
export function getPreviewStatus(previewId: string): PreviewStatus | null {
  const status = activePreviews.get(previewId);
  if (!status) return null;

  // Check if expired
  if (new Date() > status.expiresAt && status.status === 'active') {
    status.status = 'expired';
    activePreviews.set(previewId, status);
  }

  return status;
}

/**
 * Get all previews for a project
 */
export function getProjectPreviews(projectId: string): PreviewStatus[] {
  const previewIds = projectPreviews.get(projectId);
  if (!previewIds) return [];

  const previews: PreviewStatus[] = [];
  for (const previewId of previewIds) {
    const status = getPreviewStatus(previewId);
    if (status) {
      previews.push(status);
    }
  }

  return previews.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * Delete a preview
 */
export async function deletePreview(previewId: string): Promise<boolean> {
  const status = activePreviews.get(previewId);
  if (!status) return false;

  // If S3, delete from bucket
  if (status.type === 'web' && process.env.AWS_ACCESS_KEY_ID) {
    try {
      await execAsync(
        `aws s3 rm s3://${PREVIEW_BUCKET}/${status.projectId}/${previewId}/ --recursive`
      );
    } catch (error) {
      console.error(`[preview] Failed to delete S3 preview: ${error}`);
    }
  }

  // Remove from tracking
  activePreviews.delete(previewId);
  const projectPreviewSet = projectPreviews.get(status.projectId);
  if (projectPreviewSet) {
    projectPreviewSet.delete(previewId);
  }

  return true;
}

/**
 * Cleanup expired previews
 */
export async function cleanupExpiredPreviews(): Promise<number> {
  let cleanedCount = 0;
  const now = new Date();

  for (const [previewId, status] of activePreviews) {
    if (now > status.expiresAt) {
      await deletePreview(previewId);
      cleanedCount++;
    }
  }

  console.log(`[preview] Cleaned up ${cleanedCount} expired previews`);
  return cleanedCount;
}

// Helper functions

async function uploadToS3(
  localPath: string,
  projectId: string,
  previewId: string
): Promise<void> {
  const s3Path = `s3://${PREVIEW_BUCKET}/${projectId}/${previewId}/`;

  console.log(`[preview] Uploading to ${s3Path}`);

  // Upload all files except HTML
  await execAsync(
    `aws s3 sync "${localPath}" "${s3Path}" --delete --cache-control "max-age=31536000" --exclude "*.html"`,
    { timeout: 120000 }
  );

  // Upload HTML with no-cache
  const indexPath = path.join(localPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    await execAsync(
      `aws s3 cp "${indexPath}" "${s3Path}index.html" --cache-control "no-cache"`,
      { timeout: 30000 }
    );
  }
}

async function generateQRCode(url: string): Promise<string> {
  if (!QRCode) {
    console.warn('[preview] QR code library not available');
    return '';
  }

  try {
    return await QRCode.toDataURL(url, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
  } catch (error) {
    console.error('[preview] QR code generation failed:', error);
    return '';
  }
}

async function getDirectorySize(dirPath: string): Promise<number> {
  let totalSize = 0;

  const files = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const file of files) {
    const filePath = path.join(dirPath, file.name);
    if (file.isDirectory()) {
      totalSize += await getDirectorySize(filePath);
    } else {
      const stats = fs.statSync(filePath);
      totalSize += stats.size;
    }
  }

  return totalSize;
}

async function countFiles(dirPath: string): Promise<number> {
  let count = 0;

  const files = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const file of files) {
    if (file.isDirectory()) {
      count += await countFiles(path.join(dirPath, file.name));
    } else {
      count++;
    }
  }

  return count;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function getLocalIpAddress(): Promise<string | null> {
  try {
    const { stdout } = await execAsync(
      "hostname -I | awk '{print $1}' || ipconfig getifaddr en0"
    );
    return stdout.trim() || null;
  } catch {
    return null;
  }
}
