/**
 * Code Export Types
 *
 * Type definitions for Pro/Enterprise code export functionality
 */

export interface ExportOptions {
  /**
   * Export format
   */
  format: 'zip' | 'tar.gz';

  /**
   * Include environment variables template
   */
  includeEnv?: boolean;

  /**
   * Clean/redact secrets and API keys
   */
  cleanSecrets?: boolean;

  /**
   * Include documentation
   */
  includeDocs?: boolean;

  /**
   * Include git history
   */
  includeGitHistory?: boolean;

  /**
   * Custom exclusion patterns
   */
  excludePatterns?: string[];

  /**
   * Format code with Prettier and ESLint
   * @default true
   */
  formatCode?: boolean;

  /**
   * Skip formatting validation (faster but less thorough)
   * @default false
   */
  skipFormatValidation?: boolean;
}

export interface ExportResult {
  /**
   * Unique export ID
   */
  exportId: string;

  /**
   * Project ID
   */
  projectId: string;

  /**
   * Export status
   */
  status: ExportStatus;

  /**
   * S3 key where export is stored
   */
  s3Key?: string;

  /**
   * Download URL (presigned, expires in 1 hour)
   */
  downloadUrl?: string;

  /**
   * File size in bytes
   */
  fileSize?: number;

  /**
   * Export format
   */
  format: 'zip' | 'tar.gz';

  /**
   * Error message if failed
   */
  error?: string;

  /**
   * Files included in export
   */
  filesIncluded?: number;

  /**
   * Export metadata
   */
  metadata?: ExportMetadata;

  /**
   * Created timestamp
   */
  createdAt: Date;

  /**
   * Completed timestamp
   */
  completedAt?: Date;

  /**
   * Expires timestamp (download link expiry)
   */
  expiresAt?: Date;
}

export type ExportStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'expired';

export interface ExportMetadata {
  /**
   * Project version exported
   */
  version: number;

  /**
   * App name
   */
  appName?: string;

  /**
   * Template used
   */
  templateId?: string;

  /**
   * Export options used
   */
  options: ExportOptions;

  /**
   * User tier at time of export
   */
  userTier: 'pro' | 'enterprise';

  /**
   * Files excluded (patterns matched)
   */
  filesExcluded?: string[];
}

export interface ExportListItem {
  exportId: string;
  status: ExportStatus;
  format: 'zip' | 'tar.gz';
  fileSize?: number;
  filesIncluded?: number;
  createdAt: Date;
  expiresAt?: Date;
}

/**
 * Secret patterns to clean/redact
 */
export const SECRET_PATTERNS = [
  /API_KEY[=:]\s*['"]?([^'"\s]+)['"]?/gi,
  /SECRET[=:]\s*['"]?([^'"\s]+)['"]?/gi,
  /PASSWORD[=:]\s*['"]?([^'"\s]+)['"]?/gi,
  /PRIVATE_KEY[=:]\s*['"]?([^'"\s]+)['"]?/gi,
  /ACCESS_TOKEN[=:]\s*['"]?([^'"\s]+)['"]?/gi,
  /REFRESH_TOKEN[=:]\s*['"]?([^'"\s]+)['"]?/gi,
  /ANTHROPIC_API_KEY[=:]\s*['"]?([^'"\s]+)['"]?/gi,
  /OPENAI_API_KEY[=:]\s*['"]?([^'"\s]+)['"]?/gi,
];

/**
 * Default exclusion patterns
 */
export const DEFAULT_EXCLUDE_PATTERNS = [
  'node_modules/**',
  '.git/**',
  'dist/**',
  'build/**',
  '.expo/**',
  '.turbo/**',
  'ios/Pods/**',
  'android/.gradle/**',
  'android/build/**',
  '*.log',
  '.DS_Store',
  '.env.local',
  '.env.*.local',
];

/**
 * Environment template content
 */
export const ENV_TEMPLATE = `# Environment Variables Template
# Replace placeholder values with your actual credentials

# Expo
EXPO_PUBLIC_API_URL=https://api.example.com

# Analytics (if enabled)
EXPO_PUBLIC_ANALYTICS_KEY=your-analytics-key-here

# Backend API (if using custom backend)
EXPO_PUBLIC_BACKEND_URL=https://your-backend.example.com
EXPO_PUBLIC_BACKEND_API_KEY=your-backend-api-key-here

# Third-party services (uncomment and configure as needed)
# EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
# EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...
# EXPO_PUBLIC_FIREBASE_API_KEY=AIza...

# Note: Never commit .env files with actual secrets to version control!
`;
