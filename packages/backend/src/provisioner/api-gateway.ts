/**
 * API Gateway Provisioner
 *
 * Creates and manages REST API Gateway for generated apps
 */

import {
  APIGatewayClient,
  CreateRestApiCommand,
  DeleteRestApiCommand,
  GetRestApisCommand,
  GetResourcesCommand,
  CreateResourceCommand,
  PutMethodCommand,
  PutIntegrationCommand,
  PutMethodResponseCommand,
  PutIntegrationResponseCommand,
  CreateDeploymentCommand,
  CreateStageCommand,
  UpdateStageCommand,
  CreateApiKeyCommand,
  CreateUsagePlanCommand,
  CreateUsagePlanKeyCommand,
  DeleteApiKeyCommand,
  GetApiKeysCommand,
  GetUsagePlansCommand,
  DeleteUsagePlanCommand,
  type RestApi,
  type Resource,
} from '@aws-sdk/client-api-gateway';
import type { TemplateSchema } from '../schemas/types';

export interface ApiGatewayConfig {
  region: string;
  apiPrefix: string;
  accountId: string;
}

export interface DeployedApi {
  apiId: string;
  apiEndpoint: string;
  apiKey: string;
  apiKeyId: string;
  stageName: string;
}

export class ApiGatewayProvisioner {
  private client: APIGatewayClient;
  private prefix: string;
  private accountId: string;
  private region: string;

  constructor(config: ApiGatewayConfig) {
    this.client = new APIGatewayClient({ region: config.region });
    this.prefix = config.apiPrefix;
    this.accountId = config.accountId;
    this.region = config.region;
  }

  /**
   * Create a REST API with routes for all entities in the schema
   */
  async createApi(
    schema: TemplateSchema,
    lambdaArn: string
  ): Promise<DeployedApi> {
    const apiName = `${this.prefix}-api`;

    console.log(`[API Gateway] Creating REST API: ${apiName}`);

    // 1. Create the REST API
    const api = await this.createRestApi(apiName);

    // 2. Get the root resource
    const rootResource = await this.getRootResource(api.id!);

    // 3. Create resources and methods for each entity
    for (const table of schema.tables) {
      await this.createEntityRoutes(api.id!, rootResource.id!, table.name, lambdaArn);
    }

    // 4. Deploy the API
    const stageName = 'v1';
    await this.deployApi(api.id!, stageName);

    // 5. Create API key for authentication
    const { apiKey, apiKeyId } = await this.createApiKey(api.id!, stageName);

    const apiEndpoint = `https://${api.id}.execute-api.${this.region}.amazonaws.com/${stageName}`;

    console.log(`[API Gateway] API deployed: ${apiEndpoint}`);

    return {
      apiId: api.id!,
      apiEndpoint,
      apiKey,
      apiKeyId,
      stageName,
    };
  }

  /**
   * Create the REST API resource
   */
  private async createRestApi(apiName: string): Promise<RestApi> {
    const response = await this.client.send(
      new CreateRestApiCommand({
        name: apiName,
        description: 'Mobigen generated app API',
        endpointConfiguration: {
          types: ['REGIONAL'],
        },
        tags: {
          Project: this.prefix,
          ManagedBy: 'mobigen',
        },
      })
    );

    return response;
  }

  /**
   * Get the root resource of the API
   */
  private async getRootResource(apiId: string): Promise<Resource> {
    const response = await this.client.send(
      new GetResourcesCommand({ restApiId: apiId })
    );

    const rootResource = response.items?.find((r) => r.path === '/');
    if (!rootResource) {
      throw new Error('Root resource not found');
    }

    return rootResource;
  }

  /**
   * Create routes for an entity (e.g., /products, /products/{id})
   */
  private async createEntityRoutes(
    apiId: string,
    parentId: string,
    entityName: string,
    lambdaArn: string
  ): Promise<void> {
    console.log(`[API Gateway] Creating routes for: ${entityName}`);

    // Create collection resource: /entityName
    const collectionResource = await this.client.send(
      new CreateResourceCommand({
        restApiId: apiId,
        parentId,
        pathPart: entityName,
      })
    );

    // Create item resource: /entityName/{id}
    const itemResource = await this.client.send(
      new CreateResourceCommand({
        restApiId: apiId,
        parentId: collectionResource.id!,
        pathPart: '{id}',
      })
    );

    // Add methods to collection resource (GET for list, POST for create)
    await this.addMethod(apiId, collectionResource.id!, 'GET', lambdaArn);
    await this.addMethod(apiId, collectionResource.id!, 'POST', lambdaArn);
    await this.addMethod(apiId, collectionResource.id!, 'OPTIONS', lambdaArn, true);

    // Add methods to item resource (GET, PUT, DELETE)
    await this.addMethod(apiId, itemResource.id!, 'GET', lambdaArn);
    await this.addMethod(apiId, itemResource.id!, 'PUT', lambdaArn);
    await this.addMethod(apiId, itemResource.id!, 'DELETE', lambdaArn);
    await this.addMethod(apiId, itemResource.id!, 'OPTIONS', lambdaArn, true);
  }

  /**
   * Add an HTTP method to a resource
   */
  private async addMethod(
    apiId: string,
    resourceId: string,
    httpMethod: string,
    lambdaArn: string,
    isCors: boolean = false
  ): Promise<void> {
    // Create method
    await this.client.send(
      new PutMethodCommand({
        restApiId: apiId,
        resourceId,
        httpMethod,
        authorizationType: isCors ? 'NONE' : 'NONE', // API Key validation happens in Lambda
        apiKeyRequired: !isCors,
        requestParameters: httpMethod === 'GET' ? {
          'method.request.querystring.limit': false,
          'method.request.querystring.startKey': false,
        } : undefined,
      })
    );

    // Create Lambda integration
    const integrationUri = `arn:aws:apigateway:${this.region}:lambda:path/2015-03-31/functions/${lambdaArn}/invocations`;

    if (isCors) {
      // CORS preflight - use MOCK integration
      await this.client.send(
        new PutIntegrationCommand({
          restApiId: apiId,
          resourceId,
          httpMethod,
          type: 'MOCK',
          requestTemplates: {
            'application/json': '{"statusCode": 200}',
          },
        })
      );
    } else {
      // Lambda proxy integration
      await this.client.send(
        new PutIntegrationCommand({
          restApiId: apiId,
          resourceId,
          httpMethod,
          type: 'AWS_PROXY',
          integrationHttpMethod: 'POST',
          uri: integrationUri,
        })
      );
    }

    // Add method response
    await this.client.send(
      new PutMethodResponseCommand({
        restApiId: apiId,
        resourceId,
        httpMethod,
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Headers': true,
          'method.response.header.Access-Control-Allow-Methods': true,
          'method.response.header.Access-Control-Allow-Origin': true,
        },
        responseModels: {
          'application/json': 'Empty',
        },
      })
    );

    if (isCors) {
      // Add integration response for CORS
      await this.client.send(
        new PutIntegrationResponseCommand({
          restApiId: apiId,
          resourceId,
          httpMethod,
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Headers':
              "'Content-Type,X-Api-Key,Authorization'",
            'method.response.header.Access-Control-Allow-Methods':
              "'GET,POST,PUT,DELETE,OPTIONS'",
            'method.response.header.Access-Control-Allow-Origin': "'*'",
          },
          responseTemplates: {
            'application/json': '',
          },
        })
      );
    }
  }

  /**
   * Deploy the API to a stage
   */
  private async deployApi(apiId: string, stageName: string): Promise<void> {
    // Create deployment
    const deployment = await this.client.send(
      new CreateDeploymentCommand({
        restApiId: apiId,
        description: 'Initial deployment',
      })
    );

    // Create stage
    await this.client.send(
      new CreateStageCommand({
        restApiId: apiId,
        stageName,
        deploymentId: deployment.id!,
        description: 'Production stage',
        tags: {
          Project: this.prefix,
          ManagedBy: 'mobigen',
        },
      })
    );

    console.log(`[API Gateway] Deployed to stage: ${stageName}`);
  }

  /**
   * Create an API key and usage plan
   */
  private async createApiKey(
    apiId: string,
    stageName: string
  ): Promise<{ apiKey: string; apiKeyId: string }> {
    const keyName = `${this.prefix}-key`;

    // Create the API key
    const apiKeyResponse = await this.client.send(
      new CreateApiKeyCommand({
        name: keyName,
        description: 'API key for Mobigen generated app',
        enabled: true,
        tags: {
          Project: this.prefix,
          ManagedBy: 'mobigen',
        },
      })
    );

    // Create a usage plan
    const usagePlan = await this.client.send(
      new CreateUsagePlanCommand({
        name: `${this.prefix}-plan`,
        description: 'Usage plan for Mobigen generated app',
        throttle: {
          burstLimit: 100,
          rateLimit: 50,
        },
        quota: {
          limit: 10000,
          period: 'DAY',
        },
        apiStages: [
          {
            apiId,
            stage: stageName,
          },
        ],
        tags: {
          Project: this.prefix,
          ManagedBy: 'mobigen',
        },
      })
    );

    // Associate API key with usage plan
    await this.client.send(
      new CreateUsagePlanKeyCommand({
        usagePlanId: usagePlan.id!,
        keyId: apiKeyResponse.id!,
        keyType: 'API_KEY',
      })
    );

    console.log(`[API Gateway] Created API key: ${keyName}`);

    return {
      apiKey: apiKeyResponse.value!,
      apiKeyId: apiKeyResponse.id!,
    };
  }

  /**
   * Delete API and associated resources
   */
  async deleteApi(): Promise<void> {
    const apiName = `${this.prefix}-api`;

    // Find the API
    const apisResponse = await this.client.send(new GetRestApisCommand({}));
    const api = apisResponse.items?.find((a) => a.name === apiName);

    if (!api) {
      console.log('[API Gateway] No API found to delete');
      return;
    }

    // Delete API keys
    const keysResponse = await this.client.send(new GetApiKeysCommand({}));
    const keys = keysResponse.items?.filter((k) => k.name?.startsWith(this.prefix)) || [];

    for (const key of keys) {
      try {
        await this.client.send(new DeleteApiKeyCommand({ apiKey: key.id! }));
        console.log(`[API Gateway] Deleted API key: ${key.name}`);
      } catch (error) {
        console.error('[API Gateway] Failed to delete API key:', error);
      }
    }

    // Delete usage plans
    const plansResponse = await this.client.send(new GetUsagePlansCommand({}));
    const plans = plansResponse.items?.filter((p) => p.name?.startsWith(this.prefix)) || [];

    for (const plan of plans) {
      try {
        await this.client.send(new DeleteUsagePlanCommand({ usagePlanId: plan.id! }));
        console.log(`[API Gateway] Deleted usage plan: ${plan.name}`);
      } catch (error) {
        console.error('[API Gateway] Failed to delete usage plan:', error);
      }
    }

    // Delete the REST API
    try {
      await this.client.send(new DeleteRestApiCommand({ restApiId: api.id! }));
      console.log(`[API Gateway] Deleted API: ${apiName}`);
    } catch (error) {
      console.error('[API Gateway] Failed to delete API:', error);
    }
  }

  /**
   * Get the invocation URL for the API
   */
  getApiUrl(apiId: string, stageName: string): string {
    return `https://${apiId}.execute-api.${this.region}.amazonaws.com/${stageName}`;
  }
}
