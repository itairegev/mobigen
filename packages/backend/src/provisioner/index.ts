/**
 * Backend Provisioner
 *
 * Orchestrates the creation of complete AWS backend infrastructure
 * for generated mobile apps (DynamoDB, Lambda, API Gateway)
 */

import { DynamoDBProvisioner, type DynamoDBProvisionerConfig } from './dynamodb';
import { LambdaDeployer, type LambdaDeployerConfig, type DeployedFunction } from './lambda';
import { ApiGatewayProvisioner, type ApiGatewayConfig, type DeployedApi } from './api-gateway';
import { getSchemaForTemplate, type TemplateSchema } from '../schemas';

export interface BackendProvisionerConfig {
  region: string;
  accountId: string;
  environment: 'dev' | 'staging' | 'prod';
  projectId: string;
}

export interface ProvisionedBackend {
  projectId: string;
  templateId: string;
  region: string;
  environment: string;

  // DynamoDB
  tablePrefix: string;
  tableNames: string[];

  // Lambda
  functionName: string;
  functionArn: string;
  lambdaRoleArn: string;

  // API Gateway
  apiId: string;
  apiEndpoint: string;
  apiKey: string;
  apiKeyId: string;
  stageName: string;

  // Timestamps
  provisionedAt: string;
}

export class BackendProvisioner {
  private config: BackendProvisionerConfig;
  private prefix: string;

  private dynamodb: DynamoDBProvisioner;
  private lambda: LambdaDeployer;
  private apiGateway: ApiGatewayProvisioner;

  constructor(config: BackendProvisionerConfig) {
    this.config = config;
    this.prefix = `mobigen-${config.environment}-${config.projectId}`;

    // Initialize provisioners
    this.dynamodb = new DynamoDBProvisioner({
      region: config.region,
      tablePrefix: this.prefix,
    });

    this.lambda = new LambdaDeployer({
      region: config.region,
      functionPrefix: this.prefix,
      accountId: config.accountId,
    });

    this.apiGateway = new ApiGatewayProvisioner({
      region: config.region,
      apiPrefix: this.prefix,
      accountId: config.accountId,
    });
  }

  /**
   * Provision complete backend infrastructure for a template
   */
  async provision(templateId: string): Promise<ProvisionedBackend> {
    console.log(`[Backend] Starting provisioning for project: ${this.config.projectId}`);
    console.log(`[Backend] Template: ${templateId}`);
    console.log(`[Backend] Environment: ${this.config.environment}`);

    // 1. Get the schema for this template
    const schema = getSchemaForTemplate(templateId);
    console.log(`[Backend] Found schema with ${schema.tables.length} tables`);

    // 2. Create DynamoDB tables
    console.log('[Backend] Step 1/4: Creating DynamoDB tables...');
    const tableNames = await this.dynamodb.createTables(schema);

    // 3. Seed initial data (if any)
    console.log('[Backend] Step 2/4: Seeding initial data...');
    await this.dynamodb.seedData(schema);

    // 4. Deploy Lambda function
    console.log('[Backend] Step 3/4: Deploying Lambda function...');
    const lambdaResult = await this.lambda.deployFunction(this.prefix);

    // 5. Create API Gateway
    console.log('[Backend] Step 4/4: Creating API Gateway...');
    const apiResult = await this.apiGateway.createApi(schema, lambdaResult.functionArn);

    // 6. Add permission for API Gateway to invoke Lambda
    await this.lambda.addApiGatewayPermission(
      lambdaResult.functionName,
      apiResult.apiId,
      apiResult.stageName
    );

    const result: ProvisionedBackend = {
      projectId: this.config.projectId,
      templateId,
      region: this.config.region,
      environment: this.config.environment,

      tablePrefix: this.prefix,
      tableNames,

      functionName: lambdaResult.functionName,
      functionArn: lambdaResult.functionArn,
      lambdaRoleArn: lambdaResult.roleArn,

      apiId: apiResult.apiId,
      apiEndpoint: apiResult.apiEndpoint,
      apiKey: apiResult.apiKey,
      apiKeyId: apiResult.apiKeyId,
      stageName: apiResult.stageName,

      provisionedAt: new Date().toISOString(),
    };

    console.log('[Backend] Provisioning complete!');
    console.log(`[Backend] API Endpoint: ${result.apiEndpoint}`);
    console.log(`[Backend] Tables: ${tableNames.join(', ')}`);

    return result;
  }

  /**
   * Deprovision all backend resources for a project
   */
  async deprovision(): Promise<void> {
    console.log(`[Backend] Starting deprovisioning for project: ${this.config.projectId}`);

    // Delete in reverse order of creation

    // 1. Delete API Gateway
    console.log('[Backend] Step 1/3: Deleting API Gateway...');
    await this.apiGateway.deleteApi();

    // 2. Delete Lambda function
    console.log('[Backend] Step 2/3: Deleting Lambda function...');
    await this.lambda.deleteFunction();

    // 3. Delete DynamoDB tables
    console.log('[Backend] Step 3/3: Deleting DynamoDB tables...');
    await this.dynamodb.deleteTables();

    console.log('[Backend] Deprovisioning complete!');
  }

  /**
   * Check if backend resources exist for this project
   */
  async exists(): Promise<boolean> {
    return this.dynamodb.tablesExist();
  }

  /**
   * Get table status for a specific table
   */
  async getTableStatus(tableName: string): Promise<string | undefined> {
    return this.dynamodb.getTableStatus(tableName);
  }

  /**
   * Get the resource prefix for this project
   */
  getResourcePrefix(): string {
    return this.prefix;
  }
}

// Re-export types and individual provisioners
export { DynamoDBProvisioner, type DynamoDBProvisionerConfig } from './dynamodb';
export { LambdaDeployer, type LambdaDeployerConfig, type DeployedFunction } from './lambda';
export { ApiGatewayProvisioner, type ApiGatewayConfig, type DeployedApi } from './api-gateway';
