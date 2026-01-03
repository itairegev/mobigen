/**
 * Mobigen Configuration - Centralized configuration management
 *
 * All magic numbers, timeouts, and settings in one place.
 */

// ═══════════════════════════════════════════════════════════════════════════
// USER TIERS
// ═══════════════════════════════════════════════════════════════════════════

export type UserTier = 'basic' | 'pro' | 'enterprise';

export interface TierLimits {
  maxConcurrentAgents: number;
  maxGenerationsPerDay: number;
  maxBuildsPerDay: number;
  apiCallsPerMinute: number;
  enabledAgentTiers: UserTier[];
  features: {
    parallelExecution: boolean;
    advancedValidation: boolean;
    customAgents: boolean;
    priorityBuilds: boolean;
    advancedAnalytics: boolean;
    codeExport: boolean;
  };
}

export const TIER_LIMITS: Record<UserTier, TierLimits> = {
  basic: {
    maxConcurrentAgents: 2,
    maxGenerationsPerDay: 50,
    maxBuildsPerDay: 5,
    apiCallsPerMinute: 60,
    enabledAgentTiers: ['basic'],
    features: {
      parallelExecution: false,
      advancedValidation: false,
      customAgents: false,
      priorityBuilds: false,
      advancedAnalytics: false,
      codeExport: false,
    },
  },
  pro: {
    maxConcurrentAgents: 3,
    maxGenerationsPerDay: 500,
    maxBuildsPerDay: 50,
    apiCallsPerMinute: 300,
    enabledAgentTiers: ['basic', 'pro'],
    features: {
      parallelExecution: true,
      advancedValidation: true,
      customAgents: true,
      priorityBuilds: false,
      advancedAnalytics: true,
      codeExport: false,
    },
  },
  enterprise: {
    maxConcurrentAgents: 5,
    maxGenerationsPerDay: -1, // unlimited
    maxBuildsPerDay: -1, // unlimited
    apiCallsPerMinute: 1000,
    enabledAgentTiers: ['basic', 'pro', 'enterprise'],
    features: {
      parallelExecution: true,
      advancedValidation: true,
      customAgents: true,
      priorityBuilds: true,
      advancedAnalytics: true,
      codeExport: true,
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// AGENT CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

export interface AgentConfig {
  timeout: number;       // milliseconds
  maxTurns: number;
  retries: number;
  model: 'opus' | 'sonnet' | 'haiku';
}

// Default agent configurations by role category
export const AGENT_DEFAULTS: Record<string, AgentConfig> = {
  // Orchestration agents - long running, high complexity
  orchestration: {
    timeout: 900000,   // 15 min
    maxTurns: 200,
    retries: 3,
    model: 'opus',
  },
  // Planning agents - medium complexity
  planning: {
    timeout: 300000,   // 5 min
    maxTurns: 100,
    retries: 2,
    model: 'sonnet',
  },
  // Implementation agents - code generation
  implementation: {
    timeout: 300000,   // 5 min
    maxTurns: 150,
    retries: 2,
    model: 'opus',
  },
  // Analysis agents - quick parsing
  analysis: {
    timeout: 60000,    // 1 min
    maxTurns: 30,
    retries: 2,
    model: 'sonnet',
  },
  // Validation agents - checking code
  validation: {
    timeout: 180000,   // 3 min
    maxTurns: 50,
    retries: 3,
    model: 'sonnet',
  },
  // QA/Testing agents - thorough testing
  testing: {
    timeout: 600000,   // 10 min
    maxTurns: 100,
    retries: 2,
    model: 'sonnet',
  },
  // Default fallback
  default: {
    timeout: 180000,   // 3 min
    maxTurns: 80,
    retries: 2,
    model: 'sonnet',
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// SESSION CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

export const SESSION_CONFIG = {
  ttlHours: 20,                    // Session expiration
  maxSessionsPerProject: 10,       // Keep last N sessions
  cleanupIntervalHours: 24,        // How often to clean old sessions
};

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

export const VALIDATION_CONFIG = {
  maxRetries: 3,
  tierTimeouts: {
    tier1: 30000,    // 30 seconds - instant checks
    tier2: 120000,   // 2 minutes - fast checks
    tier3: 600000,   // 10 minutes - thorough checks
  },
  parallelValidators: true,
};

// ═══════════════════════════════════════════════════════════════════════════
// PARALLEL EXECUTION CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

export const PARALLEL_CONFIG = {
  maxConcurrentAgents: 3,
  taskTimeout: 300000,    // 5 minutes per task
  maxRetries: 2,
  continueOnTaskFailure: true,
  chunkSize: 3,           // Tasks per parallel batch
};

// ═══════════════════════════════════════════════════════════════════════════
// RATE LIMITING CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

export const RATE_LIMIT_CONFIG = {
  enabled: true,
  windowMs: 60000,                    // 1 minute window
  defaultRequestsPerWindow: 60,       // Default rate limit
  burstMultiplier: 1.5,               // Allow burst up to 1.5x limit
  retryAfterMs: 1000,                 // Wait before retry
  maxRetries: 3,
  backoffMultiplier: 2,               // Exponential backoff
};

// ═══════════════════════════════════════════════════════════════════════════
// CACHING CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

export const CACHE_CONFIG = {
  templateContext: {
    enabled: true,
    ttlMs: 300000,        // 5 minutes
    maxEntries: 50,
  },
  agentCatalog: {
    enabled: true,
    ttlMs: 60000,         // 1 minute
  },
  projectFiles: {
    enabled: true,
    ttlMs: 30000,         // 30 seconds
    maxSizeMb: 100,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// LOGGING CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export const LOGGING_CONFIG = {
  level: (process.env.LOG_LEVEL as LogLevel) || 'info',
  structured: true,
  includeTimestamp: true,
  includeAgentId: true,
  includePhase: true,
  maxMessageLength: 1000,
  sensitiveFields: ['apiKey', 'token', 'password', 'secret'],
};

// ═══════════════════════════════════════════════════════════════════════════
// MODEL CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

export const MODEL_CONFIG = {
  // Model IDs for Anthropic
  anthropic: {
    opus: 'claude-opus-4-5-20251101',
    sonnet: 'claude-sonnet-4-5-20251101',
    haiku: 'claude-haiku-4-5-20251001',
  },
  // Model IDs for AWS Bedrock
  bedrock: {
    opus: 'anthropic.claude-opus-4-5-20251101-v1:0',
    sonnet: 'anthropic.claude-sonnet-4-5-20251101-v1:0',
    haiku: 'anthropic.claude-haiku-4-5-20251001-v1:0',
  },
  // Default model for each use case
  defaults: {
    codeGeneration: 'opus',
    analysis: 'sonnet',
    validation: 'sonnet',
    quickTask: 'haiku',
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// PIPELINE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

export interface PipelinePhase {
  id: string;
  name: string;
  agents: string[];
  parallel: boolean;
  tier: UserTier;
  optional: boolean;
}

export const PIPELINE_PHASES: PipelinePhase[] = [
  { id: 'setup', name: 'Project Setup', agents: ['intent-analyzer'], parallel: false, tier: 'basic', optional: false },
  { id: 'analysis', name: 'Intent Analysis', agents: ['intent-analyzer'], parallel: false, tier: 'basic', optional: false },
  { id: 'product', name: 'Product Definition', agents: ['product-manager'], parallel: false, tier: 'basic', optional: false },
  { id: 'design', name: 'Architecture & Design', agents: ['technical-architect', 'ui-ux-expert'], parallel: true, tier: 'pro', optional: false },
  { id: 'planning', name: 'Task Planning', agents: ['lead-developer'], parallel: false, tier: 'basic', optional: false },
  { id: 'implementation', name: 'Code Implementation', agents: ['developer'], parallel: true, tier: 'basic', optional: false },
  { id: 'validation', name: 'Code Validation', agents: ['validator', 'error-fixer'], parallel: false, tier: 'basic', optional: false },
  { id: 'qa', name: 'Quality Assurance', agents: ['qa'], parallel: false, tier: 'basic', optional: true },
  { id: 'testing', name: 'Advanced Testing', agents: ['ui-interaction-tester', 'visual-regression-tester'], parallel: true, tier: 'pro', optional: true },
  { id: 'build', name: 'Build Validation', agents: ['build-validator'], parallel: false, tier: 'pro', optional: true },
];

// ═══════════════════════════════════════════════════════════════════════════
// ENVIRONMENT HELPERS
// ═══════════════════════════════════════════════════════════════════════════

export function isDevelopment(): boolean {
  return process.env.NODE_ENV !== 'production';
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (value === undefined && defaultValue === undefined) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value ?? defaultValue!;
}

export function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required env vars in production
  if (isProduction()) {
    const requiredEnvVars = ['ANTHROPIC_API_KEY'];
    for (const key of requiredEnvVars) {
      if (!process.env[key]) {
        errors.push(`Missing required environment variable: ${key}`);
      }
    }
  }

  // Validate tier limits
  for (const [tier, limits] of Object.entries(TIER_LIMITS)) {
    if (limits.maxConcurrentAgents < 1) {
      errors.push(`Invalid maxConcurrentAgents for tier ${tier}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

// ═══════════════════════════════════════════════════════════════════════════
// OTA UPDATES CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

export type OTAChannel = 'staging' | 'production' | 'development';

export interface OTAChannelConfig {
  name: string;
  description: string;
  runtimeVersion?: string;
  isDefault: boolean;
}

export const OTA_CONFIG = {
  // Channel configurations
  channels: {
    production: {
      name: 'production',
      description: 'Production releases for end users',
      isDefault: true,
    },
    staging: {
      name: 'staging',
      description: 'Pre-release testing environment',
      isDefault: false,
    },
    development: {
      name: 'development',
      description: 'Development and QA builds',
      isDefault: false,
    },
  } as Record<OTAChannel, OTAChannelConfig>,

  // Version naming conventions
  versioning: {
    // Format: {major}.{minor}.{patch}+{build}
    format: 'semver',
    // Auto-increment patch version for OTA updates
    autoIncrement: 'patch',
    // Prefix for runtime versions
    runtimePrefix: 'exposdk:',
  },

  // EAS Update configuration
  eas: {
    // Default runtime version if not specified
    defaultRuntimeVersion: '1.0.0',
    // Update URL base
    updateUrlBase: process.env.EXPO_UPDATE_URL || 'https://u.expo.dev',
    // Expo access token from env
    accessToken: process.env.EXPO_ACCESS_TOKEN,
  },

  // Rollout settings
  rollout: {
    // Default rollout percentage for new updates
    defaultPercent: 100,
    // Minimum percentage allowed
    minPercent: 0,
    // Maximum percentage allowed
    maxPercent: 100,
    // Gradual rollout step increments
    gradualSteps: [10, 25, 50, 75, 100],
  },

  // Update limits
  limits: {
    // Maximum number of updates to keep per channel
    maxUpdatesPerChannel: 100,
    // Maximum number of simultaneous rollouts
    maxSimultaneousRollouts: 5,
    // Days to keep archived updates before deletion
    archiveRetentionDays: 90,
  },

  // Monitoring thresholds
  monitoring: {
    // Error rate threshold for automatic rollback
    errorRateThreshold: 0.05, // 5%
    // Minimum downloads before considering rollback
    minDownloadsForRollback: 100,
    // Success rate threshold (below this triggers alert)
    successRateThreshold: 0.95, // 95%
  },
} as const;

export type OTAConfigType = typeof OTA_CONFIG;

// ═══════════════════════════════════════════════════════════════════════════
// ANALYTICS DATABASE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

export const ANALYTICS_DB_CONFIG = {
  // ClickHouse configuration
  clickhouse: {
    url: getEnvVar('CLICKHOUSE_URL', 'http://localhost:8123'),
    database: getEnvVar('CLICKHOUSE_DATABASE', 'mobigen_analytics'),
    username: getEnvVar('CLICKHOUSE_USER', 'mobigen'),
    password: getEnvVar('CLICKHOUSE_PASSWORD', ''),
    request_timeout: getEnvNumber('CLICKHOUSE_TIMEOUT', 60000),
    max_open_connections: getEnvNumber('CLICKHOUSE_MAX_CONNECTIONS', 10),
    compression: {
      request: true,
      response: true,
    },
  },

  // TimescaleDB configuration
  timescale: {
    host: getEnvVar('TIMESCALE_HOST', 'localhost'),
    port: getEnvNumber('TIMESCALE_PORT', 5433),
    database: getEnvVar('TIMESCALE_DATABASE', 'mobigen_analytics'),
    user: getEnvVar('TIMESCALE_USER', 'mobigen'),
    password: getEnvVar('TIMESCALE_PASSWORD', ''),
    max_connections: getEnvNumber('TIMESCALE_MAX_CONNECTIONS', 20),
    idle_timeout_ms: getEnvNumber('TIMESCALE_IDLE_TIMEOUT', 30000),
    connection_timeout_ms: getEnvNumber('TIMESCALE_CONNECTION_TIMEOUT', 10000),
    ssl: getEnvVar('TIMESCALE_SSL', 'false') === 'true',
  },

  // Batch insert settings
  batchInsert: {
    maxBatchSize: 1000,              // Events per batch
    flushIntervalMs: 5000,           // Flush every 5 seconds
    maxQueueSize: 10000,             // Max events in queue before backpressure
    retryAttempts: 3,
    retryDelayMs: 1000,
  },

  // Query settings
  query: {
    defaultTimeout: 30000,            // 30 seconds
    maxResults: 10000,                // Max rows to return
    enableCaching: true,
    cacheTtlSeconds: 300,             // 5 minutes
  },

  // Retention policies
  retention: {
    rawEventsMonths: 24,              // Keep raw events for 24 months
    aggregatesMonths: 36,             // Keep aggregates for 36 months
    sessionsMonths: 24,               // Keep sessions for 24 months
  },

  // Compression
  compression: {
    clickhouseEnabled: true,
    clickhouseCodec: 'ZSTD(3)',
    timescaleEnabled: true,
    timescaleAfterDays: 7,            // Compress chunks older than 7 days
  },

  // Analytics features by tier
  tierFeatures: {
    basic: {
      realTimeMetrics: false,
      customEvents: true,
      funnelAnalysis: false,
      cohortAnalysis: false,
      retentionAnalysis: false,
      exportData: false,
      apiAccess: false,
      customDashboards: false,
    },
    pro: {
      realTimeMetrics: true,
      customEvents: true,
      funnelAnalysis: true,
      cohortAnalysis: true,
      retentionAnalysis: true,
      exportData: true,
      apiAccess: true,
      customDashboards: true,
    },
    enterprise: {
      realTimeMetrics: true,
      customEvents: true,
      funnelAnalysis: true,
      cohortAnalysis: true,
      retentionAnalysis: true,
      exportData: true,
      apiAccess: true,
      customDashboards: true,
    },
  },
} as const;

export type AnalyticsDBConfigType = typeof ANALYTICS_DB_CONFIG;

// Export all as a single config object for convenience
export const CONFIG = {
  tiers: TIER_LIMITS,
  agents: AGENT_DEFAULTS,
  session: SESSION_CONFIG,
  validation: VALIDATION_CONFIG,
  parallel: PARALLEL_CONFIG,
  rateLimit: RATE_LIMIT_CONFIG,
  cache: CACHE_CONFIG,
  logging: LOGGING_CONFIG,
  models: MODEL_CONFIG,
  pipeline: PIPELINE_PHASES,
  ota: OTA_CONFIG,
  analyticsDb: ANALYTICS_DB_CONFIG,
};

export default CONFIG;
