/**
 * Code Export Service
 *
 * Allows Pro/Enterprise users to export their app's source code
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import archiver from 'archiver';
import tar from 'tar';
import { v4 as uuidv4 } from 'uuid';
import { createWriteStream } from 'fs';
import { glob as globSearch } from 'glob';
import type {
  ExportOptions,
  ExportResult,
  ExportStatus,
  ExportMetadata,
  ExportListItem,
} from './export-types';
import {
  SECRET_PATTERNS,
  DEFAULT_EXCLUDE_PATTERNS,
  ENV_TEMPLATE,
} from './export-types';

// AWS S3 for storage
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand } from '@aws-sdk/client-s3';

/**
 * In-memory export tracking
 * In production, this should be persisted to database
 */
const exports = new Map<string, ExportResult>();

export class ExportService {
  private projectsDir: string;
  private s3Client: S3Client;
  private s3Bucket: string;

  constructor(projectsDir: string = process.env.PROJECTS_DIR || '/tmp/mobigen/projects') {
    this.projectsDir = projectsDir;
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
    });
    this.s3Bucket = process.env.S3_BUCKET || 'mobigen-artifacts';
  }

  /**
   * Export project source code
   */
  async exportProject(
    projectId: string,
    options: Partial<ExportOptions> = {},
    metadata: Pick<ExportMetadata, 'version' | 'appName' | 'templateId' | 'userTier'>
  ): Promise<ExportResult> {
    const exportId = uuidv4();

    // Default options
    const exportOptions: ExportOptions = {
      format: options.format || 'zip',
      includeEnv: options.includeEnv ?? true,
      cleanSecrets: options.cleanSecrets ?? true,
      includeDocs: options.includeDocs ?? true,
      includeGitHistory: options.includeGitHistory ?? false,
      excludePatterns: [
        ...DEFAULT_EXCLUDE_PATTERNS,
        ...(options.excludePatterns || []),
      ],
    };

    // Create initial export record
    const exportResult: ExportResult = {
      exportId,
      projectId,
      status: 'pending',
      format: exportOptions.format,
      metadata: {
        ...metadata,
        options: exportOptions,
        filesExcluded: [],
      },
      createdAt: new Date(),
    };

    exports.set(exportId, exportResult);

    // Process export asynchronously
    this.processExport(exportId, projectId, exportOptions, metadata)
      .catch((error) => {
        console.error(`Export ${exportId} failed:`, error);
        const result = exports.get(exportId);
        if (result) {
          result.status = 'failed';
          result.error = error.message;
          exports.set(exportId, result);
        }
      });

    return exportResult;
  }

  /**
   * Get export status
   */
  async getExportStatus(exportId: string): Promise<ExportResult | null> {
    return exports.get(exportId) || null;
  }

  /**
   * Get download URL for completed export
   */
  async downloadExport(exportId: string): Promise<string | null> {
    const exportResult = exports.get(exportId);

    if (!exportResult) {
      throw new Error('Export not found');
    }

    if (exportResult.status !== 'completed') {
      throw new Error(`Export is ${exportResult.status}, not available for download`);
    }

    if (!exportResult.s3Key) {
      throw new Error('Export S3 key not found');
    }

    // Check if export has expired
    if (exportResult.expiresAt && exportResult.expiresAt < new Date()) {
      exportResult.status = 'expired';
      exports.set(exportId, exportResult);
      throw new Error('Export has expired');
    }

    // Generate presigned URL (expires in 1 hour)
    const downloadUrl = await this.getPresignedUrl(exportResult.s3Key, 3600);

    // Update download URL in result
    exportResult.downloadUrl = downloadUrl;
    exports.set(exportId, exportResult);

    return downloadUrl;
  }

  /**
   * List exports for a project
   */
  async listExports(projectId: string): Promise<ExportListItem[]> {
    const projectExports = Array.from(exports.values())
      .filter((exp) => exp.projectId === projectId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((exp) => ({
        exportId: exp.exportId,
        status: exp.status,
        format: exp.format,
        fileSize: exp.fileSize,
        filesIncluded: exp.filesIncluded,
        createdAt: exp.createdAt,
        expiresAt: exp.expiresAt,
      }));

    return projectExports;
  }

  /**
   * Delete an export
   */
  async deleteExport(exportId: string): Promise<void> {
    exports.delete(exportId);
    // TODO: Delete from S3 as well
  }

  /**
   * Process export (private)
   */
  private async processExport(
    exportId: string,
    projectId: string,
    options: ExportOptions,
    metadata: Pick<ExportMetadata, 'version' | 'appName' | 'templateId' | 'userTier'>
  ): Promise<void> {
    const result = exports.get(exportId)!;
    result.status = 'processing';
    exports.set(exportId, result);

    try {
      const projectPath = path.join(this.projectsDir, projectId);

      // Verify project exists
      try {
        await fs.access(projectPath);
      } catch {
        throw new Error('Project directory not found');
      }

      // Collect files to export
      const files = await this.collectFiles(projectPath, options.excludePatterns || []);
      result.filesIncluded = files.length;
      exports.set(exportId, result);

      // Create temporary directory for processing
      const tempDir = path.join('/tmp', `export-${exportId}`);
      await fs.mkdir(tempDir, { recursive: true });

      // Copy and process files
      const filesExcluded: string[] = [];
      for (const file of files) {
        const sourcePath = path.join(projectPath, file);
        const destPath = path.join(tempDir, file);

        // Create directory
        await fs.mkdir(path.dirname(destPath), { recursive: true });

        // Read file
        let content = await fs.readFile(sourcePath, 'utf-8').catch(() => null);

        if (content !== null) {
          // Clean secrets if enabled
          if (options.cleanSecrets) {
            const cleaned = this.cleanSecrets(content);
            if (cleaned !== content) {
              filesExcluded.push(file);
            }
            content = cleaned;
          }

          // Write processed file
          await fs.writeFile(destPath, content);
        } else {
          // Binary file, copy as-is
          await fs.copyFile(sourcePath, destPath);
        }
      }

      // Add environment template if enabled
      if (options.includeEnv) {
        await fs.writeFile(path.join(tempDir, '.env.example'), ENV_TEMPLATE);
      }

      // Add README with export info
      if (options.includeDocs) {
        const readme = this.generateReadme(metadata);
        await fs.writeFile(path.join(tempDir, 'EXPORT_README.md'), readme);
      }

      // Create archive
      const archivePath = await this.createArchive(
        tempDir,
        exportId,
        options.format
      );

      // Get file size
      const stats = await fs.stat(archivePath);
      result.fileSize = stats.size;

      // Upload to S3
      const s3Key = `exports/${projectId}/${exportId}.${options.format}`;
      await this.uploadToS3(archivePath, s3Key);

      result.s3Key = s3Key;

      // Clean up temp files
      await fs.rm(tempDir, { recursive: true, force: true });
      await fs.rm(archivePath, { force: true });

      // Update result
      result.status = 'completed';
      result.completedAt = new Date();
      result.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      if (result.metadata) {
        result.metadata.filesExcluded = filesExcluded;
      }

      exports.set(exportId, result);
    } catch (error) {
      result.status = 'failed';
      result.error = error instanceof Error ? error.message : 'Unknown error';
      exports.set(exportId, result);
      throw error;
    }
  }

  /**
   * Collect files to export
   */
  private async collectFiles(
    projectPath: string,
    excludePatterns: string[]
  ): Promise<string[]> {
    // Build ignore patterns for glob
    const ignorePatterns = excludePatterns.map((pattern) =>
      pattern.startsWith('!') ? pattern.slice(1) : `**/${pattern}`
    );

    // Find all files
    const files = await globSearch('**/*', {
      cwd: projectPath,
      ignore: ignorePatterns,
      nodir: true,
      dot: true,
    });

    return files;
  }

  /**
   * Clean secrets from content
   */
  private cleanSecrets(content: string): string {
    let cleaned = content;

    for (const pattern of SECRET_PATTERNS) {
      cleaned = cleaned.replace(pattern, (match, group1) => {
        // Replace the secret value with a placeholder
        return match.replace(group1, 'REDACTED_SECRET');
      });
    }

    return cleaned;
  }

  /**
   * Create archive (ZIP or tar.gz)
   */
  private async createArchive(
    sourceDir: string,
    exportId: string,
    format: 'zip' | 'tar.gz'
  ): Promise<string> {
    const archivePath = path.join('/tmp', `${exportId}.${format}`);

    if (format === 'zip') {
      return this.createZipArchive(sourceDir, archivePath);
    } else {
      return this.createTarGzArchive(sourceDir, archivePath);
    }
  }

  /**
   * Create ZIP archive
   */
  private async createZipArchive(
    sourceDir: string,
    outputPath: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const output = createWriteStream(outputPath);
      const archive = archiver('zip', {
        zlib: { level: 9 }, // Maximum compression
      });

      output.on('close', () => {
        resolve(outputPath);
      });

      archive.on('error', (err) => {
        reject(err);
      });

      archive.pipe(output);
      archive.directory(sourceDir, false);
      archive.finalize();
    });
  }

  /**
   * Create tar.gz archive
   */
  private async createTarGzArchive(
    sourceDir: string,
    outputPath: string
  ): Promise<string> {
    await tar.create(
      {
        gzip: true,
        file: outputPath,
        cwd: sourceDir,
      },
      ['.']
    );

    return outputPath;
  }

  /**
   * Upload file to S3
   */
  private async uploadToS3(filePath: string, s3Key: string): Promise<void> {
    const fileStream = require('fs').createReadStream(filePath);
    const stats = await fs.stat(filePath);

    const upload = new Upload({
      client: this.s3Client,
      params: {
        Bucket: this.s3Bucket,
        Key: s3Key,
        Body: fileStream,
        ContentType: s3Key.endsWith('.zip')
          ? 'application/zip'
          : 'application/gzip',
      },
    });

    await upload.done();
  }

  /**
   * Get presigned download URL
   */
  private async getPresignedUrl(s3Key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.s3Bucket,
      Key: s3Key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * Generate README for export
   */
  private generateReadme(
    metadata: Pick<ExportMetadata, 'version' | 'appName' | 'templateId' | 'userTier'>
  ): string {
    return `# ${metadata.appName || 'Exported App'} - Source Code

This is an exported Mobigen project.

## Project Info

- **Version:** ${metadata.version}
- **Template:** ${metadata.templateId || 'N/A'}
- **Exported:** ${new Date().toISOString()}
- **User Tier:** ${metadata.userTier}

## Getting Started

### Prerequisites

- Node.js 18+ and npm/pnpm/yarn
- Expo CLI: \`npm install -g expo-cli\`
- iOS: Xcode 14+ (for iOS development)
- Android: Android Studio (for Android development)

### Installation

1. Install dependencies:

\`\`\`bash
npm install
# or
pnpm install
# or
yarn install
\`\`\`

2. Configure environment variables:

Copy \`.env.example\` to \`.env\` and fill in your actual values.

\`\`\`bash
cp .env.example .env
\`\`\`

### Running the App

#### Development with Expo Go

\`\`\`bash
npx expo start
\`\`\`

Scan the QR code with Expo Go app on your device.

#### iOS Simulator

\`\`\`bash
npx expo start --ios
\`\`\`

#### Android Emulator

\`\`\`bash
npx expo start --android
\`\`\`

### Building for Production

#### Using EAS Build (Recommended)

1. Install EAS CLI:

\`\`\`bash
npm install -g eas-cli
\`\`\`

2. Login to your Expo account:

\`\`\`bash
eas login
\`\`\`

3. Build for iOS:

\`\`\`bash
eas build --platform ios
\`\`\`

4. Build for Android:

\`\`\`bash
eas build --platform android
\`\`\`

#### Local Builds

For local builds, you'll need to:

1. Generate native projects:

\`\`\`bash
npx expo prebuild
\`\`\`

2. Build with Xcode (iOS) or Android Studio (Android)

## Project Structure

\`\`\`
.
├── app/              # App screens (Expo Router)
├── components/       # Reusable components
├── services/         # API and service integrations
├── hooks/            # Custom React hooks
├── stores/           # State management
├── types/            # TypeScript type definitions
├── assets/           # Images, fonts, etc.
├── app.json          # Expo configuration
└── package.json      # Dependencies
\`\`\`

## Important Notes

### Secrets & API Keys

All secrets and API keys have been redacted from this export for security.
You'll need to:

1. Set up your own backend/API services
2. Obtain API keys for any third-party services
3. Configure environment variables in \`.env\`

### Backend Integration

If your app uses a backend, you'll need to:

1. Deploy your own backend infrastructure
2. Update API endpoints in \`.env\` and service files
3. Set up database and authentication services

### App Store Deployment

To publish to App Store/Play Store:

1. Update \`app.json\` with your bundle identifiers
2. Configure signing certificates
3. Follow platform-specific submission guidelines

## Support

For issues or questions:

- Mobigen Documentation: https://docs.mobigen.io
- Expo Documentation: https://docs.expo.dev
- React Native Documentation: https://reactnative.dev

## License

This code is exported from Mobigen and belongs to the project owner.

---

Generated by Mobigen - AI-Powered Mobile App Platform
`;
  }
}

// Singleton instance
let exportServiceInstance: ExportService | null = null;

/**
 * Get ExportService singleton
 */
export function getExportService(): ExportService {
  if (!exportServiceInstance) {
    exportServiceInstance = new ExportService();
  }
  return exportServiceInstance;
}
