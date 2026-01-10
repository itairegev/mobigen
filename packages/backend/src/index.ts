/**
 * @mobigen/backend
 *
 * AWS backend provisioning for Mobigen generated apps
 */

// Main provisioner
export {
  BackendProvisioner,
  type BackendProvisionerConfig,
  type ProvisionedBackend,
} from './provisioner';

// Individual provisioners (for advanced use)
export {
  DynamoDBProvisioner,
  type DynamoDBProvisionerConfig,
} from './provisioner/dynamodb';

export {
  LambdaDeployer,
  type LambdaDeployerConfig,
  type DeployedFunction,
} from './provisioner/lambda';

export {
  ApiGatewayProvisioner,
  type ApiGatewayConfig,
  type DeployedApi,
} from './provisioner/api-gateway';

// Schema definitions
export {
  templateSchemas,
  getSchemaForTemplate,
  hasSchemaForTemplate,
  getAvailableTemplates,
} from './schemas';

export type {
  TemplateSchema,
  TableSchema,
  AttributeDefinition,
  KeyDefinition,
  GlobalSecondaryIndex,
} from './schemas/types';

// Individual schemas
export { ecommerceSchema } from './schemas/ecommerce';
export { loyaltySchema } from './schemas/loyalty';
export { newsSchema } from './schemas/news';
export { socialSchema } from './schemas/social';
export { financeSchema } from './schemas/finance';
export { bookingSchema } from './schemas/booking';
export { aiAssistantSchema } from './schemas/ai-assistant';

// Client generator
export { generateApiClient, type GeneratedClient } from './client/generator';

// Content manager (owner dashboard)
export * from './content-manager';
