/**
 * Artifact Storage Service
 * Handles uploading and retrieving build artifacts (APK, IPA, ZIP) from S3
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

// S3 Configuration (uses existing ARTIFACTS_BUCKET env var)
const ARTIFACTS_BUCKET = process.env.ARTIFACTS_BUCKET || 'mobigen-artifacts';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const S3_ENABLED = process.env.S3_ARTIFACTS_ENABLED !== 'false';

// CloudFront distribution (optional, for faster downloads)
const CLOUDFRONT_DOMAIN = process.env.ARTIFACTS_CLOUDFRONT_DOMAIN;

export interface ArtifactInfo {
  projectId: string;
  buildId: string;
  type: 'apk' | 'ipa' | 'aab' | 'zip';
  filename: string;
  size: number;
  s3Key: string;
  s3Url: string;
  downloadUrl: string;
  uploadedAt: Date;
  expiresAt?: Date;
}

export interface UploadResult {
  success: boolean;
  artifact?: ArtifactInfo;
  error?: string;
}

/**
 * Upload a build artifact to S3
 */
export async function uploadArtifact(
  localPath: string,
  projectId: string,
  buildId: string,
  type: 'apk' | 'ipa' | 'aab' | 'zip'
): Promise<UploadResult> {
  if (!S3_ENABLED) {
    console.log('[artifact-storage] S3 disabled, skipping upload');
    return {
      success: false,
      error: 'S3 storage is disabled',
    };
  }

  if (!fs.existsSync(localPath)) {
    return {
      success: false,
      error: `File not found: ${localPath}`,
    };
  }

  try {
    const filename = path.basename(localPath);
    const stats = fs.statSync(localPath);
    const s3Key = `builds/${projectId}/${buildId}/${filename}`;
    const s3Url = `s3://${ARTIFACTS_BUCKET}/${s3Key}`;

    console.log(`[artifact-storage] Uploading ${filename} to ${s3Url}`);

    // Upload to S3 with appropriate content type
    const contentType = getContentType(type);
    await execAsync(
      `aws s3 cp "${localPath}" "${s3Url}" --content-type "${contentType}" --region ${AWS_REGION}`,
      { timeout: 300000 } // 5 min timeout for large files
    );

    // Generate download URL
    const downloadUrl = CLOUDFRONT_DOMAIN
      ? `https://${CLOUDFRONT_DOMAIN}/${s3Key}`
      : await generatePresignedUrl(s3Key);

    const artifact: ArtifactInfo = {
      projectId,
      buildId,
      type,
      filename,
      size: stats.size,
      s3Key,
      s3Url,
      downloadUrl,
      uploadedAt: new Date(),
      expiresAt: CLOUDFRONT_DOMAIN ? undefined : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days for presigned
    };

    console.log(`[artifact-storage] Upload complete: ${s3Key} (${formatSize(stats.size)})`);

    return {
      success: true,
      artifact,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[artifact-storage] Upload failed: ${message}`);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Upload a project as a ZIP file to S3
 */
export async function uploadProjectZip(
  projectPath: string,
  projectId: string
): Promise<UploadResult> {
  if (!S3_ENABLED) {
    return {
      success: false,
      error: 'S3 storage is disabled',
    };
  }

  if (!fs.existsSync(projectPath)) {
    return {
      success: false,
      error: `Project not found: ${projectPath}`,
    };
  }

  try {
    // Create a temporary ZIP file
    const zipFilename = `${projectId}.zip`;
    const tempZipPath = path.join('/tmp', zipFilename);

    console.log(`[artifact-storage] Creating ZIP of project ${projectId}`);

    // Create ZIP excluding node_modules and other large directories
    await execAsync(
      `cd "${projectPath}" && zip -r "${tempZipPath}" . -x "node_modules/*" -x ".git/*" -x "*.log" -x "dist/*" -x "android/*" -x "ios/*"`,
      { timeout: 120000 }
    );

    // Upload the ZIP
    const result = await uploadArtifact(tempZipPath, projectId, 'latest', 'zip');

    // Clean up temp file
    if (fs.existsSync(tempZipPath)) {
      fs.unlinkSync(tempZipPath);
    }

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[artifact-storage] ZIP upload failed: ${message}`);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Get a download URL for an artifact
 */
export async function getArtifactDownloadUrl(
  projectId: string,
  buildId: string,
  type: 'apk' | 'ipa' | 'aab' | 'zip'
): Promise<string | null> {
  const extension = type === 'aab' ? 'aab' : type;
  const s3Key = `builds/${projectId}/${buildId}/*.${extension}`;

  try {
    // List files matching the pattern
    const { stdout } = await execAsync(
      `aws s3 ls "s3://${ARTIFACTS_BUCKET}/builds/${projectId}/${buildId}/" --region ${AWS_REGION} 2>/dev/null | grep ".${extension}$" | head -1`,
      { timeout: 30000 }
    );

    if (!stdout.trim()) {
      return null;
    }

    // Extract filename from ls output
    const parts = stdout.trim().split(/\s+/);
    const filename = parts[parts.length - 1];
    const fullKey = `builds/${projectId}/${buildId}/${filename}`;

    if (CLOUDFRONT_DOMAIN) {
      return `https://${CLOUDFRONT_DOMAIN}/${fullKey}`;
    }

    return await generatePresignedUrl(fullKey);
  } catch (error) {
    console.error(`[artifact-storage] Failed to get download URL: ${error}`);
    return null;
  }
}

/**
 * List all artifacts for a project
 */
export async function listProjectArtifacts(projectId: string): Promise<ArtifactInfo[]> {
  if (!S3_ENABLED) {
    return [];
  }

  try {
    const { stdout } = await execAsync(
      `aws s3 ls "s3://${ARTIFACTS_BUCKET}/builds/${projectId}/" --recursive --region ${AWS_REGION} 2>/dev/null`,
      { timeout: 30000 }
    );

    if (!stdout.trim()) {
      return [];
    }

    const artifacts: ArtifactInfo[] = [];
    const lines = stdout.trim().split('\n');

    for (const line of lines) {
      // Parse S3 ls output: 2024-01-01 12:00:00 1234567 builds/project/build/file.apk
      const match = line.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})\s+(\d+)\s+(.+)$/);
      if (!match) continue;

      const [, date, time, sizeStr, s3Key] = match;
      const filename = path.basename(s3Key);
      const ext = path.extname(filename).toLowerCase().slice(1);

      if (!['apk', 'ipa', 'aab', 'zip'].includes(ext)) continue;

      const parts = s3Key.split('/');
      const buildId = parts.length >= 3 ? parts[2] : 'unknown';

      const downloadUrl = CLOUDFRONT_DOMAIN
        ? `https://${CLOUDFRONT_DOMAIN}/${s3Key}`
        : await generatePresignedUrl(s3Key);

      artifacts.push({
        projectId,
        buildId,
        type: ext as 'apk' | 'ipa' | 'aab' | 'zip',
        filename,
        size: parseInt(sizeStr, 10),
        s3Key,
        s3Url: `s3://${ARTIFACTS_BUCKET}/${s3Key}`,
        downloadUrl,
        uploadedAt: new Date(`${date}T${time}Z`),
      });
    }

    return artifacts;
  } catch (error) {
    console.error(`[artifact-storage] Failed to list artifacts: ${error}`);
    return [];
  }
}

/**
 * Delete an artifact from S3
 */
export async function deleteArtifact(s3Key: string): Promise<boolean> {
  if (!S3_ENABLED) {
    return false;
  }

  try {
    await execAsync(
      `aws s3 rm "s3://${ARTIFACTS_BUCKET}/${s3Key}" --region ${AWS_REGION}`,
      { timeout: 30000 }
    );
    console.log(`[artifact-storage] Deleted: ${s3Key}`);
    return true;
  } catch (error) {
    console.error(`[artifact-storage] Failed to delete ${s3Key}: ${error}`);
    return false;
  }
}

/**
 * Generate a presigned URL for temporary access
 */
async function generatePresignedUrl(s3Key: string, expiresIn = 604800): Promise<string> {
  try {
    const { stdout } = await execAsync(
      `aws s3 presign "s3://${ARTIFACTS_BUCKET}/${s3Key}" --expires-in ${expiresIn} --region ${AWS_REGION}`,
      { timeout: 10000 }
    );
    return stdout.trim();
  } catch (error) {
    console.error(`[artifact-storage] Failed to generate presigned URL: ${error}`);
    // Fallback to direct S3 URL (will only work with public bucket)
    return `https://${ARTIFACTS_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${s3Key}`;
  }
}

/**
 * Get content type for artifact type
 */
function getContentType(type: 'apk' | 'ipa' | 'aab' | 'zip'): string {
  switch (type) {
    case 'apk':
      return 'application/vnd.android.package-archive';
    case 'aab':
      return 'application/octet-stream';
    case 'ipa':
      return 'application/octet-stream';
    case 'zip':
      return 'application/zip';
    default:
      return 'application/octet-stream';
  }
}

/**
 * Format file size for display
 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * Check if S3 storage is available and configured
 */
export async function checkS3Availability(): Promise<{ available: boolean; bucket: string; error?: string }> {
  if (!S3_ENABLED) {
    return {
      available: false,
      bucket: ARTIFACTS_BUCKET,
      error: 'S3 storage is disabled (S3_ARTIFACTS_ENABLED=false)',
    };
  }

  try {
    await execAsync(
      `aws s3 ls "s3://${ARTIFACTS_BUCKET}" --region ${AWS_REGION} 2>&1 | head -1`,
      { timeout: 10000 }
    );
    return {
      available: true,
      bucket: ARTIFACTS_BUCKET,
    };
  } catch (error) {
    return {
      available: false,
      bucket: ARTIFACTS_BUCKET,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export default {
  uploadArtifact,
  uploadProjectZip,
  getArtifactDownloadUrl,
  listProjectArtifacts,
  deleteArtifact,
  checkS3Availability,
};
