/**
 * AI Client Factory
 *
 * Supports multiple AI providers:
 * - anthropic: Direct Anthropic API (requires ANTHROPIC_API_KEY)
 * - bedrock: AWS Bedrock (requires AWS credentials)
 *
 * Set AI_PROVIDER environment variable to switch providers.
 */

import Anthropic from '@anthropic-ai/sdk';
import AnthropicBedrock from '@anthropic-ai/bedrock-sdk';

export type AIProvider = 'anthropic' | 'bedrock';

export interface AIClientConfig {
  provider?: AIProvider;
  // Anthropic-specific
  apiKey?: string;
  // Bedrock-specific
  awsRegion?: string;
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
  awsSessionToken?: string;
}

// Model mapping between Anthropic and Bedrock
export const MODEL_MAPPING = {
  // Anthropic model IDs -> Bedrock model IDs
  'claude-sonnet-4-20250514': 'anthropic.claude-sonnet-4-20250514-v1:0',
  'claude-3-5-sonnet-20241022': 'anthropic.claude-3-5-sonnet-20241022-v2:0',
  'claude-3-5-haiku-20241022': 'anthropic.claude-3-5-haiku-20241022-v1:0',
  'claude-3-opus-20240229': 'anthropic.claude-3-opus-20240229-v1:0',
  'claude-3-sonnet-20240229': 'anthropic.claude-3-sonnet-20240229-v1:0',
  'claude-3-haiku-20240307': 'anthropic.claude-3-haiku-20240307-v1:0',
} as const;

// Reverse mapping for convenience
export const BEDROCK_TO_ANTHROPIC = Object.fromEntries(
  Object.entries(MODEL_MAPPING).map(([k, v]) => [v, k])
) as Record<string, string>;

/**
 * Get the appropriate model ID based on provider
 */
export function getModelId(baseModel: string, provider: AIProvider): string {
  if (provider === 'bedrock') {
    // If already a Bedrock model ID, return as-is
    if (baseModel.startsWith('anthropic.')) {
      return baseModel;
    }
    // Map Anthropic model to Bedrock
    return MODEL_MAPPING[baseModel as keyof typeof MODEL_MAPPING] || baseModel;
  }
  // For direct Anthropic, use as-is or reverse map
  if (baseModel.startsWith('anthropic.')) {
    return BEDROCK_TO_ANTHROPIC[baseModel] || baseModel;
  }
  return baseModel;
}

/**
 * Create an AI client based on configuration
 */
export function createAIClient(config: AIClientConfig = {}): Anthropic | AnthropicBedrock {
  const provider = config.provider || (process.env.AI_PROVIDER as AIProvider) || 'anthropic';

  if (provider === 'bedrock') {
    return createBedrockClient(config);
  }

  return createAnthropicClient(config);
}

/**
 * Create a direct Anthropic API client
 */
function createAnthropicClient(config: AIClientConfig): Anthropic {
  const apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY is required when using the Anthropic provider. ' +
        'Set AI_PROVIDER=bedrock to use AWS Bedrock instead.'
    );
  }

  return new Anthropic({ apiKey });
}

/**
 * Create an AWS Bedrock client
 *
 * Authentication methods (in order of precedence):
 * 1. Explicit credentials in config
 * 2. Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
 * 3. AWS credential chain (IAM role, ~/.aws/credentials, etc.)
 */
function createBedrockClient(config: AIClientConfig): AnthropicBedrock {
  const region = config.awsRegion || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';

  // If explicit credentials provided, use them
  if (config.awsAccessKeyId && config.awsSecretAccessKey) {
    return new AnthropicBedrock({
      awsRegion: region,
      awsAccessKey: config.awsAccessKeyId,
      awsSecretKey: config.awsSecretAccessKey,
      awsSessionToken: config.awsSessionToken,
    });
  }

  // Otherwise, use environment variables or AWS credential chain
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const sessionToken = process.env.AWS_SESSION_TOKEN;

  if (accessKeyId && secretAccessKey) {
    return new AnthropicBedrock({
      awsRegion: region,
      awsAccessKey: accessKeyId,
      awsSecretKey: secretAccessKey,
      awsSessionToken: sessionToken,
    });
  }

  // Use default credential chain (IAM role, ~/.aws/credentials, etc.)
  return new AnthropicBedrock({
    awsRegion: region,
  });
}

/**
 * Get the current AI provider from environment
 */
export function getCurrentProvider(): AIProvider {
  return (process.env.AI_PROVIDER as AIProvider) || 'anthropic';
}

/**
 * Check if Bedrock is configured
 */
export function isBedrockConfigured(): boolean {
  return (
    process.env.AI_PROVIDER === 'bedrock' ||
    !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) ||
    !!(process.env.AWS_PROFILE || process.env.AWS_ROLE_ARN)
  );
}

/**
 * Validate AI configuration
 */
export function validateAIConfig(): { valid: boolean; provider: AIProvider; error?: string } {
  const provider = getCurrentProvider();

  if (provider === 'bedrock') {
    // Bedrock uses AWS credential chain, so just check region
    const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
    if (!region) {
      return {
        valid: true, // Still valid, will use us-east-1
        provider,
        error: 'AWS_REGION not set, defaulting to us-east-1',
      };
    }
    return { valid: true, provider };
  }

  // Anthropic provider
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      valid: false,
      provider,
      error: 'ANTHROPIC_API_KEY is required. Set AI_PROVIDER=bedrock to use AWS Bedrock instead.',
    };
  }

  return { valid: true, provider };
}

// Export client type for convenience
export type AIClient = Anthropic | AnthropicBedrock;

// Default export for convenience
export default createAIClient;
