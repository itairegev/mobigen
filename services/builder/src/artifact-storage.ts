import axios from 'axios';
import { getEASClient } from './eas-client';

// Storage interface (would be implemented by @mobigen/storage)
interface StorageClient {
  upload(key: string, data: Buffer, metadata?: any): Promise<string>;
  download(key: string): Promise<Buffer>;
  getSignedUrl(key: string, expiresIn?: number): Promise<string>;
  delete(key: string): Promise<void>;
}

// Mock storage implementation for now
class MockStorageClient implements StorageClient {
  async upload(key: string, data: Buffer, metadata?: any): Promise<string> {
    console.log(`Uploading ${data.length} bytes to ${key}`);
    // TODO: Implement actual S3 upload via @mobigen/storage
    return `https://s3.amazonaws.com/mobigen-builds/${key}`;
  }

  async download(key: string): Promise<Buffer> {
    console.log(`Downloading ${key}`);
    // TODO: Implement actual S3 download
    return Buffer.from('');
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    console.log(`Generating signed URL for ${key} (expires in ${expiresIn}s)`);
    // TODO: Implement actual S3 signed URL generation
    return `https://s3.amazonaws.com/mobigen-builds/${key}?signature=mock`;
  }

  async delete(key: string): Promise<void> {
    console.log(`Deleting ${key}`);
    // TODO: Implement actual S3 deletion
  }
}

// Singleton storage client
let storageClient: StorageClient | null = null;

function getStorageClient(): StorageClient {
  if (!storageClient) {
    // TODO: Replace with actual @mobigen/storage client
    storageClient = new MockStorageClient();
  }
  return storageClient;
}

/**
 * Download artifact from EAS and upload to S3
 */
export async function downloadAndStoreArtifact(
  buildId: string,
  buildUrl: string,
  platform: 'ios' | 'android'
): Promise<string> {
  console.log(`Downloading artifact from ${buildUrl}`);

  try {
    const easClient = getEASClient();
    const storage = getStorageClient();

    // 1. Download artifact from EAS
    const artifactData = await easClient.downloadArtifact(buildUrl);

    console.log(`Downloaded ${artifactData.length} bytes`);

    // 2. Determine file extension
    const extension = platform === 'ios' ? 'ipa' : 'apk';

    // 3. Generate S3 key
    const projectId = await getProjectIdForBuild(buildId);
    const s3Key = `builds/${projectId}/${buildId}.${extension}`;

    // 4. Upload to S3
    const s3Url = await storage.upload(s3Key, artifactData, {
      buildId,
      platform,
      contentType: platform === 'ios' ? 'application/octet-stream' : 'application/vnd.android.package-archive',
      timestamp: new Date().toISOString(),
    });

    console.log(`Artifact stored at ${s3Url}`);

    return s3Url;
  } catch (error: any) {
    console.error(`Failed to download and store artifact:`, error);
    throw new Error(`Artifact storage failed: ${error.message}`);
  }
}

/**
 * Generate signed download URL for artifact
 */
export async function getArtifactDownloadUrl(
  buildId: string,
  expiresIn: number = 3600
): Promise<string> {
  try {
    // 1. Get artifact S3 key from database
    const s3Key = await getArtifactS3Key(buildId);

    if (!s3Key) {
      throw new Error(`No artifact found for build ${buildId}`);
    }

    // 2. Generate signed URL
    const storage = getStorageClient();
    const signedUrl = await storage.getSignedUrl(s3Key, expiresIn);

    return signedUrl;
  } catch (error: any) {
    console.error(`Failed to generate download URL:`, error);
    throw new Error(`Download URL generation failed: ${error.message}`);
  }
}

/**
 * Delete artifact from storage
 */
export async function deleteArtifact(buildId: string): Promise<void> {
  try {
    const s3Key = await getArtifactS3Key(buildId);

    if (!s3Key) {
      console.log(`No artifact to delete for build ${buildId}`);
      return;
    }

    const storage = getStorageClient();
    await storage.delete(s3Key);

    console.log(`Deleted artifact for build ${buildId}`);
  } catch (error: any) {
    console.error(`Failed to delete artifact:`, error);
    throw new Error(`Artifact deletion failed: ${error.message}`);
  }
}

/**
 * Get artifact metadata
 */
export async function getArtifactMetadata(buildId: string): Promise<{
  s3Key: string;
  sizeBytes: number;
  platform: string;
  uploadedAt: Date;
} | null> {
  // TODO: Implement database query
  // This would fetch artifact metadata from builds table
  return null;
}

/**
 * Store build logs to S3
 */
export async function storeBuildLogs(
  buildId: string,
  logs: string
): Promise<string> {
  try {
    const storage = getStorageClient();
    const projectId = await getProjectIdForBuild(buildId);

    // Store logs as text file
    const s3Key = `builds/${projectId}/${buildId}/logs.txt`;
    const logsBuffer = Buffer.from(logs, 'utf-8');

    const s3Url = await storage.upload(s3Key, logsBuffer, {
      buildId,
      contentType: 'text/plain',
      timestamp: new Date().toISOString(),
    });

    console.log(`Build logs stored at ${s3Url}`);

    return s3Key;
  } catch (error: any) {
    console.error(`Failed to store build logs:`, error);
    throw new Error(`Log storage failed: ${error.message}`);
  }
}

/**
 * Get build logs from S3
 */
export async function getBuildLogs(buildId: string): Promise<string> {
  try {
    const logsS3Key = await getLogsS3Key(buildId);

    if (!logsS3Key) {
      throw new Error(`No logs found for build ${buildId}`);
    }

    const storage = getStorageClient();
    const logsBuffer = await storage.download(logsS3Key);

    return logsBuffer.toString('utf-8');
  } catch (error: any) {
    console.error(`Failed to retrieve build logs:`, error);
    throw new Error(`Log retrieval failed: ${error.message}`);
  }
}

/**
 * Calculate storage usage for a project
 */
export async function getProjectStorageUsage(
  projectId: string
): Promise<{
  totalBytes: number;
  buildCount: number;
  oldestBuild: Date | null;
  newestBuild: Date | null;
}> {
  // TODO: Implement database aggregation
  // This would calculate total storage used by all builds for a project
  return {
    totalBytes: 0,
    buildCount: 0,
    oldestBuild: null,
    newestBuild: null,
  };
}

/**
 * Clean up old artifacts (retention policy)
 */
export async function cleanupOldArtifacts(
  projectId: string,
  retentionDays: number = 30
): Promise<number> {
  try {
    // TODO: Implement cleanup logic
    // 1. Find builds older than retention period
    // 2. Delete artifacts from S3
    // 3. Update database to remove S3 keys
    // 4. Return count of deleted artifacts

    console.log(
      `Cleaning up artifacts older than ${retentionDays} days for project ${projectId}`
    );

    return 0;
  } catch (error: any) {
    console.error(`Failed to cleanup old artifacts:`, error);
    throw new Error(`Artifact cleanup failed: ${error.message}`);
  }
}

// Helper functions for database queries (to be implemented)

async function getProjectIdForBuild(buildId: string): Promise<string> {
  // TODO: Implement database query
  return 'mock-project-id';
}

async function getArtifactS3Key(buildId: string): Promise<string | null> {
  // TODO: Implement database query
  return null;
}

async function getLogsS3Key(buildId: string): Promise<string | null> {
  // TODO: Implement database query
  return null;
}

/**
 * Validate artifact integrity
 */
export async function validateArtifact(
  buildId: string,
  expectedChecksum?: string
): Promise<boolean> {
  try {
    const s3Key = await getArtifactS3Key(buildId);

    if (!s3Key) {
      return false;
    }

    // TODO: Implement checksum validation
    // 1. Download artifact
    // 2. Calculate checksum
    // 3. Compare with expected value

    return true;
  } catch (error: any) {
    console.error(`Failed to validate artifact:`, error);
    return false;
  }
}

/**
 * Copy artifact to another location
 */
export async function copyArtifact(
  buildId: string,
  destinationKey: string
): Promise<string> {
  try {
    const storage = getStorageClient();
    const sourceKey = await getArtifactS3Key(buildId);

    if (!sourceKey) {
      throw new Error(`No artifact found for build ${buildId}`);
    }

    // Download and re-upload (S3 copy would be more efficient)
    const artifactData = await storage.download(sourceKey);
    const newUrl = await storage.upload(destinationKey, artifactData);

    return newUrl;
  } catch (error: any) {
    console.error(`Failed to copy artifact:`, error);
    throw new Error(`Artifact copy failed: ${error.message}`);
  }
}

/**
 * Get artifact storage interface for webhooks
 */
export function getArtifactStorage() {
  return {
    async downloadAndStore(
      buildId: string,
      buildUrl: string,
      platform: 'ios' | 'android'
    ): Promise<string> {
      return downloadAndStoreArtifact(buildId, buildUrl, platform);
    },

    async storeLogs(buildId: string, logsUrl: string): Promise<string> {
      // Fetch logs from URL and store
      const response = await fetch(logsUrl);
      const logs = await response.text();
      return storeBuildLogs(buildId, logs);
    },
  };
}
