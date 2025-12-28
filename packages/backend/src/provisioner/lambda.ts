/**
 * Lambda Function Deployer
 *
 * Deploys and manages Lambda functions for generated apps
 */

import {
  LambdaClient,
  CreateFunctionCommand,
  UpdateFunctionCodeCommand,
  UpdateFunctionConfigurationCommand,
  DeleteFunctionCommand,
  GetFunctionCommand,
  AddPermissionCommand,
  waitUntilFunctionActive,
  waitUntilFunctionUpdated,
  type FunctionConfiguration,
} from '@aws-sdk/client-lambda';
import {
  IAMClient,
  CreateRoleCommand,
  DeleteRoleCommand,
  AttachRolePolicyCommand,
  DetachRolePolicyCommand,
  GetRoleCommand,
} from '@aws-sdk/client-iam';
import * as fs from 'fs';
import * as path from 'path';
import archiver from 'archiver';

export interface LambdaDeployerConfig {
  region: string;
  functionPrefix: string;
  accountId: string;
}

export interface DeployedFunction {
  functionName: string;
  functionArn: string;
  roleArn: string;
}

export class LambdaDeployer {
  private lambda: LambdaClient;
  private iam: IAMClient;
  private prefix: string;
  private accountId: string;
  private region: string;

  constructor(config: LambdaDeployerConfig) {
    this.lambda = new LambdaClient({ region: config.region });
    this.iam = new IAMClient({ region: config.region });
    this.prefix = config.functionPrefix;
    this.accountId = config.accountId;
    this.region = config.region;
  }

  /**
   * Deploy the CRUD handler Lambda function
   */
  async deployFunction(tablePrefix: string): Promise<DeployedFunction> {
    const functionName = `${this.prefix}-crud-handler`;
    const roleName = `${this.prefix}-lambda-role`;

    console.log(`[Lambda] Deploying function: ${functionName}`);

    // 1. Create/get IAM role for Lambda
    const roleArn = await this.ensureRole(roleName, tablePrefix);

    // 2. Bundle the Lambda code
    const zipBuffer = await this.bundleLambdaCode();

    // 3. Check if function exists
    const existingFunction = await this.getFunctionIfExists(functionName);

    let functionArn: string;

    if (existingFunction) {
      // Update existing function
      console.log('[Lambda] Updating existing function...');
      await this.updateFunction(functionName, zipBuffer, tablePrefix);
      functionArn = existingFunction.FunctionArn!;
    } else {
      // Create new function
      console.log('[Lambda] Creating new function...');
      functionArn = await this.createFunction(
        functionName,
        roleArn,
        zipBuffer,
        tablePrefix
      );
    }

    console.log(`[Lambda] Function deployed: ${functionArn}`);

    return {
      functionName,
      functionArn,
      roleArn,
    };
  }

  /**
   * Ensure IAM role exists with proper permissions
   */
  private async ensureRole(roleName: string, tablePrefix: string): Promise<string> {
    try {
      const response = await this.iam.send(
        new GetRoleCommand({ RoleName: roleName })
      );
      console.log('[Lambda] Using existing IAM role');
      return response.Role!.Arn!;
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'NoSuchEntityException') {
        console.log('[Lambda] Creating IAM role...');
        return this.createRole(roleName, tablePrefix);
      }
      throw error;
    }
  }

  /**
   * Create IAM role for Lambda execution
   */
  private async createRole(roleName: string, tablePrefix: string): Promise<string> {
    // Trust policy for Lambda
    const assumeRolePolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: {
            Service: 'lambda.amazonaws.com',
          },
          Action: 'sts:AssumeRole',
        },
      ],
    };

    // Create the role
    const createResponse = await this.iam.send(
      new CreateRoleCommand({
        RoleName: roleName,
        AssumeRolePolicyDocument: JSON.stringify(assumeRolePolicy),
        Description: 'Lambda execution role for Mobigen CRUD handler',
        Tags: [
          { Key: 'Project', Value: this.prefix },
          { Key: 'ManagedBy', Value: 'mobigen' },
        ],
      })
    );

    const roleArn = createResponse.Role!.Arn!;

    // Attach basic Lambda execution policy
    await this.iam.send(
      new AttachRolePolicyCommand({
        RoleName: roleName,
        PolicyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      })
    );

    // Attach DynamoDB access policy
    await this.iam.send(
      new AttachRolePolicyCommand({
        RoleName: roleName,
        PolicyArn: 'arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess',
      })
    );

    // Wait for role to propagate (IAM is eventually consistent)
    console.log('[Lambda] Waiting for IAM role to propagate...');
    await new Promise((resolve) => setTimeout(resolve, 10000));

    return roleArn;
  }

  /**
   * Bundle Lambda code into a zip file
   */
  private async bundleLambdaCode(): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];

      const archive = archiver('zip', { zlib: { level: 9 } });

      archive.on('data', (chunk: Buffer) => chunks.push(chunk));
      archive.on('end', () => resolve(Buffer.concat(chunks)));
      archive.on('error', reject);

      // Get the handler code
      const handlerCode = this.getHandlerCode();

      // Add handler file
      archive.append(handlerCode, { name: 'index.js' });

      archive.finalize();
    });
  }

  /**
   * Get the compiled handler code as a string
   * In production, this would be built/bundled from TypeScript
   */
  private getHandlerCode(): string {
    // This is a simplified version of the handler for Lambda deployment
    // In production, we'd use esbuild to bundle the TypeScript code
    return `
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, DeleteCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_PREFIX = process.env.TABLE_PREFIX;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Api-Key, Authorization',
  'Content-Type': 'application/json',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  try {
    const pathParts = event.path.split('/').filter(Boolean);
    const entity = pathParts[0];
    const id = event.pathParameters?.id || pathParts[1];

    if (!entity) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Entity name required' }) };
    }

    const tableName = TABLE_PREFIX + '-' + entity;
    let result;

    switch (event.httpMethod) {
      case 'GET':
        if (id) {
          result = await getItem(tableName, entity, id);
        } else {
          result = await listItems(tableName, event.queryStringParameters);
        }
        break;
      case 'POST':
        result = await createItem(tableName, entity, JSON.parse(event.body || '{}'));
        break;
      case 'PUT':
        if (!id) return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'ID required' }) };
        result = await updateItem(tableName, entity, id, JSON.parse(event.body || '{}'));
        break;
      case 'DELETE':
        if (!id) return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'ID required' }) };
        result = await deleteItem(tableName, entity, id);
        break;
      default:
        return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify(result) };
  } catch (error) {
    console.error('Handler error:', error);
    const statusCode = error.name === 'NotFoundError' ? 404 : error.name === 'ValidationError' ? 400 : 500;
    return { statusCode, headers: corsHeaders, body: JSON.stringify({ error: error.message || 'Internal error' }) };
  }
};

function generatePK(entity, id) {
  const singular = entity.endsWith('ies') ? entity.slice(0, -3) + 'y' : entity.endsWith('s') ? entity.slice(0, -1) : entity;
  return singular.toUpperCase() + '#' + id;
}

async function getItem(tableName, entity, id) {
  const pk = generatePK(entity, id);
  const response = await docClient.send(new GetCommand({ TableName: tableName, Key: { pk, sk: 'META' } }));
  if (!response.Item) {
    const error = new Error(entity + ' not found');
    error.name = 'NotFoundError';
    throw error;
  }
  const { pk: _pk, sk: _sk, ...item } = response.Item;
  return item;
}

async function listItems(tableName, queryParams) {
  const limit = Math.min(parseInt(queryParams?.limit || '50', 10), 100);
  const startKey = queryParams?.startKey;

  const response = await docClient.send(new ScanCommand({
    TableName: tableName,
    Limit: limit,
    FilterExpression: 'sk = :sk',
    ExpressionAttributeValues: { ':sk': 'META' },
    ExclusiveStartKey: startKey ? JSON.parse(Buffer.from(startKey, 'base64').toString()) : undefined,
  }));

  const items = (response.Items || []).map(item => {
    const { pk, sk, ...rest } = item;
    return rest;
  });

  return {
    items,
    count: response.Count || 0,
    lastKey: response.LastEvaluatedKey ? Buffer.from(JSON.stringify(response.LastEvaluatedKey)).toString('base64') : undefined,
  };
}

async function createItem(tableName, entity, data) {
  const id = data.id || require('crypto').randomUUID();
  const pk = generatePK(entity, id);
  const now = new Date().toISOString();

  const item = { ...data, pk, sk: 'META', id, createdAt: now, updatedAt: now };

  await docClient.send(new PutCommand({
    TableName: tableName,
    Item: item,
    ConditionExpression: 'attribute_not_exists(pk)',
  }));

  const { pk: _pk, sk: _sk, ...result } = item;
  return result;
}

async function updateItem(tableName, entity, id, data) {
  const pk = generatePK(entity, id);
  const now = new Date().toISOString();

  const updateExpressions = ['#updatedAt = :updatedAt'];
  const expressionValues = { ':updatedAt': now };
  const expressionNames = { '#updatedAt': 'updatedAt' };
  const reservedKeys = ['pk', 'sk', 'id', 'createdAt', 'updatedAt'];

  Object.entries(data).forEach(([key, value]) => {
    if (!reservedKeys.includes(key)) {
      updateExpressions.push('#' + key + ' = :' + key);
      expressionValues[':' + key] = value;
      expressionNames['#' + key] = key;
    }
  });

  const response = await docClient.send(new UpdateCommand({
    TableName: tableName,
    Key: { pk, sk: 'META' },
    UpdateExpression: 'SET ' + updateExpressions.join(', '),
    ExpressionAttributeValues: expressionValues,
    ExpressionAttributeNames: expressionNames,
    ConditionExpression: 'attribute_exists(pk)',
    ReturnValues: 'ALL_NEW',
  }));

  if (!response.Attributes) {
    const error = new Error(entity + ' not found');
    error.name = 'NotFoundError';
    throw error;
  }

  const { pk: _pk, sk: _sk, ...result } = response.Attributes;
  return result;
}

async function deleteItem(tableName, entity, id) {
  const pk = generatePK(entity, id);
  await docClient.send(new DeleteCommand({
    TableName: tableName,
    Key: { pk, sk: 'META' },
    ConditionExpression: 'attribute_exists(pk)',
  }));
  return { deleted: true, id };
}
`;
  }

  /**
   * Create a new Lambda function
   */
  private async createFunction(
    functionName: string,
    roleArn: string,
    zipBuffer: Buffer,
    tablePrefix: string
  ): Promise<string> {
    const response = await this.lambda.send(
      new CreateFunctionCommand({
        FunctionName: functionName,
        Runtime: 'nodejs20.x',
        Role: roleArn,
        Handler: 'index.handler',
        Code: { ZipFile: zipBuffer },
        Description: 'Mobigen CRUD handler for generated app',
        Timeout: 30,
        MemorySize: 256,
        Environment: {
          Variables: {
            TABLE_PREFIX: tablePrefix,
          },
        },
        Tags: {
          Project: this.prefix,
          ManagedBy: 'mobigen',
        },
      })
    );

    // Wait for function to be active
    await waitUntilFunctionActive(
      { client: this.lambda, maxWaitTime: 60 },
      { FunctionName: functionName }
    );

    return response.FunctionArn!;
  }

  /**
   * Update existing Lambda function
   */
  private async updateFunction(
    functionName: string,
    zipBuffer: Buffer,
    tablePrefix: string
  ): Promise<void> {
    // Update code
    await this.lambda.send(
      new UpdateFunctionCodeCommand({
        FunctionName: functionName,
        ZipFile: zipBuffer,
      })
    );

    // Wait for update to complete
    await waitUntilFunctionUpdated(
      { client: this.lambda, maxWaitTime: 60 },
      { FunctionName: functionName }
    );

    // Update configuration
    await this.lambda.send(
      new UpdateFunctionConfigurationCommand({
        FunctionName: functionName,
        Environment: {
          Variables: {
            TABLE_PREFIX: tablePrefix,
          },
        },
      })
    );

    // Wait for config update to complete
    await waitUntilFunctionUpdated(
      { client: this.lambda, maxWaitTime: 60 },
      { FunctionName: functionName }
    );
  }

  /**
   * Get existing function if it exists
   */
  private async getFunctionIfExists(
    functionName: string
  ): Promise<FunctionConfiguration | null> {
    try {
      const response = await this.lambda.send(
        new GetFunctionCommand({ FunctionName: functionName })
      );
      return response.Configuration || null;
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'ResourceNotFoundException') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Add permission for API Gateway to invoke Lambda
   */
  async addApiGatewayPermission(
    functionName: string,
    apiId: string,
    stageName: string
  ): Promise<void> {
    try {
      await this.lambda.send(
        new AddPermissionCommand({
          FunctionName: functionName,
          StatementId: `apigateway-${apiId}-${stageName}`,
          Action: 'lambda:InvokeFunction',
          Principal: 'apigateway.amazonaws.com',
          SourceArn: `arn:aws:execute-api:${this.region}:${this.accountId}:${apiId}/*/*/*`,
        })
      );
    } catch (error: unknown) {
      // Permission may already exist
      if (error instanceof Error && error.name === 'ResourceConflictException') {
        console.log('[Lambda] Permission already exists');
        return;
      }
      throw error;
    }
  }

  /**
   * Delete Lambda function and associated role
   */
  async deleteFunction(): Promise<void> {
    const functionName = `${this.prefix}-crud-handler`;
    const roleName = `${this.prefix}-lambda-role`;

    // Delete Lambda function
    try {
      await this.lambda.send(
        new DeleteFunctionCommand({ FunctionName: functionName })
      );
      console.log(`[Lambda] Deleted function: ${functionName}`);
    } catch (error: unknown) {
      if (error instanceof Error && error.name !== 'ResourceNotFoundException') {
        throw error;
      }
    }

    // Detach policies and delete role
    try {
      await this.iam.send(
        new DetachRolePolicyCommand({
          RoleName: roleName,
          PolicyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
        })
      );
      await this.iam.send(
        new DetachRolePolicyCommand({
          RoleName: roleName,
          PolicyArn: 'arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess',
        })
      );
      await this.iam.send(new DeleteRoleCommand({ RoleName: roleName }));
      console.log(`[Lambda] Deleted role: ${roleName}`);
    } catch (error: unknown) {
      if (error instanceof Error && error.name !== 'NoSuchEntityException') {
        console.error('[Lambda] Failed to delete role:', error);
      }
    }
  }
}
