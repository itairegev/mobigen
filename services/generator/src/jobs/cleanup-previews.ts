/**
 * Preview Cleanup Job
 *
 * Scheduled job that cleans up expired previews:
 * - Deletes S3 files for expired web previews
 * - Removes tracking data for expired previews
 * - Logs cleanup statistics
 *
 * Run this job on a schedule (e.g., every hour via cron or CloudWatch Events)
 */

import { cleanupExpiredPreviews, getPreviewStatus } from '../preview-service';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Configuration
const PREVIEW_BUCKET = process.env.PREVIEW_S3_BUCKET || 'mobigen-previews';
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
const DRY_RUN = process.env.CLEANUP_DRY_RUN === 'true';

interface CleanupResult {
  success: boolean;
  cleanedCount: number;
  s3ObjectsDeleted: number;
  errors: string[];
  duration: number;
  timestamp: Date;
}

/**
 * Run cleanup for all expired previews
 */
export async function runCleanup(): Promise<CleanupResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  let s3ObjectsDeleted = 0;

  console.log(`[cleanup] Starting preview cleanup job (dry_run: ${DRY_RUN})`);

  try {
    // Clean up in-memory previews and get count
    const cleanedCount = await cleanupExpiredPreviews();

    // Clean up orphaned S3 objects (previews that exist in S3 but not tracked)
    if (process.env.AWS_ACCESS_KEY_ID || process.env.AWS_PROFILE) {
      try {
        const s3Cleaned = await cleanupOrphanedS3Objects();
        s3ObjectsDeleted = s3Cleaned;
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown S3 error';
        errors.push(`S3 cleanup failed: ${msg}`);
        console.error(`[cleanup] S3 cleanup error: ${msg}`);
      }
    }

    const duration = Date.now() - startTime;
    console.log(
      `[cleanup] Completed: ${cleanedCount} previews cleaned, ${s3ObjectsDeleted} S3 objects deleted in ${duration}ms`
    );

    return {
      success: errors.length === 0,
      cleanedCount,
      s3ObjectsDeleted,
      errors,
      duration,
      timestamp: new Date(),
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const msg = error instanceof Error ? error.message : 'Unknown error';
    errors.push(msg);
    console.error(`[cleanup] Job failed: ${msg}`);

    return {
      success: false,
      cleanedCount: 0,
      s3ObjectsDeleted: 0,
      errors,
      duration,
      timestamp: new Date(),
    };
  }
}

/**
 * Clean up S3 objects that are older than the preview expiry
 */
async function cleanupOrphanedS3Objects(): Promise<number> {
  if (DRY_RUN) {
    console.log('[cleanup] Dry run - skipping S3 cleanup');
    return 0;
  }

  try {
    // List all objects in the preview bucket
    const { stdout } = await execAsync(
      `aws s3 ls s3://${PREVIEW_BUCKET}/ --recursive`,
      { timeout: 60000 }
    );

    if (!stdout) return 0;

    // Parse S3 listing to find old previews
    const lines = stdout.split('\n').filter(Boolean);
    const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    let deletedCount = 0;

    for (const line of lines) {
      // S3 ls format: 2024-01-01 12:00:00 1234 path/to/file
      const match = line.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})\s+(\d+)\s+(.+)$/);
      if (!match) continue;

      const [, dateStr, timeStr, , key] = match;
      const objectDate = new Date(`${dateStr}T${timeStr}Z`);

      if (objectDate < cutoffDate) {
        // Extract project ID and preview ID from key
        const keyParts = key.split('/');
        if (keyParts.length >= 2) {
          const projectId = keyParts[0];
          const previewId = keyParts[1];

          // Check if this preview is still tracked
          const status = getPreviewStatus(previewId);
          if (!status || status.status === 'expired') {
            // Delete the object
            try {
              await execAsync(
                `aws s3 rm s3://${PREVIEW_BUCKET}/${key}`,
                { timeout: 30000 }
              );
              deletedCount++;
              console.log(`[cleanup] Deleted orphaned S3 object: ${key}`);
            } catch (deleteError) {
              console.error(`[cleanup] Failed to delete ${key}:`, deleteError);
            }
          }
        }
      }
    }

    return deletedCount;
  } catch (error) {
    console.error('[cleanup] S3 listing failed:', error);
    return 0;
  }
}

/**
 * Start the cleanup job on a schedule
 */
export function startCleanupScheduler(): void {
  console.log(`[cleanup] Starting cleanup scheduler (interval: ${CLEANUP_INTERVAL_MS}ms)`);

  // Run immediately on startup
  runCleanup().catch(console.error);

  // Then run on interval
  setInterval(() => {
    runCleanup().catch(console.error);
  }, CLEANUP_INTERVAL_MS);
}

// If run directly (for testing or manual execution)
if (require.main === module) {
  runCleanup()
    .then((result) => {
      console.log('Cleanup result:', JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Cleanup failed:', error);
      process.exit(1);
    });
}
