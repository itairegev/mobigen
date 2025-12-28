/**
 * Generic CRUD Lambda Handler
 *
 * This Lambda function handles CRUD operations for all entities
 * based on the schema defined in environment variables.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_PREFIX = process.env.TABLE_PREFIX!;

interface APIGatewayEvent {
  httpMethod: string;
  path: string;
  pathParameters?: Record<string, string>;
  queryStringParameters?: Record<string, string>;
  body?: string;
  headers: Record<string, string>;
}

interface APIGatewayResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Api-Key, Authorization',
  'Content-Type': 'application/json',
};

/**
 * Main Lambda handler
 */
export async function handler(event: APIGatewayEvent): Promise<APIGatewayResponse> {
  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  try {
    // Parse path: /entity or /entity/{id}
    const pathParts = event.path.split('/').filter(Boolean);
    const entity = pathParts[0];
    const id = event.pathParameters?.id || pathParts[1];

    if (!entity) {
      throw new ValidationError('Entity name is required in path');
    }

    const tableName = `${TABLE_PREFIX}-${entity}`;

    let result: unknown;

    switch (event.httpMethod) {
      case 'GET':
        if (id) {
          result = await getItem(tableName, entity, id);
        } else {
          result = await listItems(tableName, event.queryStringParameters);
        }
        break;

      case 'POST':
        result = await createItem(tableName, entity, parseBody(event.body));
        break;

      case 'PUT':
        if (!id) throw new ValidationError('ID is required for update');
        result = await updateItem(tableName, entity, id, parseBody(event.body));
        break;

      case 'DELETE':
        if (!id) throw new ValidationError('ID is required for delete');
        result = await deleteItem(tableName, entity, id);
        break;

      default:
        throw new ValidationError(`Unsupported HTTP method: ${event.httpMethod}`);
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('Handler error:', error);

    let statusCode = 500;
    let message = 'Internal server error';

    if (error instanceof NotFoundError) {
      statusCode = 404;
      message = error.message;
    } else if (error instanceof ValidationError) {
      statusCode = 400;
      message = error.message;
    } else if (error instanceof Error) {
      message = error.message;
    }

    return {
      statusCode,
      headers: corsHeaders,
      body: JSON.stringify({ error: message }),
    };
  }
}

/**
 * Parse request body
 */
function parseBody(body?: string): Record<string, unknown> {
  if (!body) {
    return {};
  }

  try {
    return JSON.parse(body);
  } catch {
    throw new ValidationError('Invalid JSON in request body');
  }
}

/**
 * Generate partition key for entity
 */
function generatePK(entity: string, id: string): string {
  const singular = entity.endsWith('ies')
    ? entity.slice(0, -3) + 'y'
    : entity.endsWith('s')
      ? entity.slice(0, -1)
      : entity;

  return `${singular.toUpperCase()}#${id}`;
}

/**
 * Get a single item by ID
 */
async function getItem(
  tableName: string,
  entity: string,
  id: string
): Promise<Record<string, unknown>> {
  const pk = generatePK(entity, id);

  const response = await docClient.send(
    new GetCommand({
      TableName: tableName,
      Key: { pk, sk: 'META' },
    })
  );

  if (!response.Item) {
    throw new NotFoundError(`${entity} with id '${id}' not found`);
  }

  // Remove internal keys from response
  const { pk: _pk, sk: _sk, ...item } = response.Item;
  return item;
}

/**
 * List items with optional filtering and pagination
 */
async function listItems(
  tableName: string,
  queryParams?: Record<string, string>
): Promise<{ items: Record<string, unknown>[]; count: number; lastKey?: string }> {
  const limit = Math.min(parseInt(queryParams?.limit || '50', 10), 100);
  const startKey = queryParams?.startKey;

  const response = await docClient.send(
    new ScanCommand({
      TableName: tableName,
      Limit: limit,
      FilterExpression: 'sk = :sk',
      ExpressionAttributeValues: { ':sk': 'META' },
      ExclusiveStartKey: startKey
        ? JSON.parse(Buffer.from(startKey, 'base64').toString())
        : undefined,
    })
  );

  // Remove internal keys from items
  const items = (response.Items || []).map((item) => {
    const { pk, sk, ...rest } = item;
    return rest;
  });

  return {
    items,
    count: response.Count || 0,
    lastKey: response.LastEvaluatedKey
      ? Buffer.from(JSON.stringify(response.LastEvaluatedKey)).toString('base64')
      : undefined,
  };
}

/**
 * Create a new item
 */
async function createItem(
  tableName: string,
  entity: string,
  data: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const id = (data.id as string) || crypto.randomUUID();
  const pk = generatePK(entity, id);
  const now = new Date().toISOString();

  const item = {
    ...data,
    pk,
    sk: 'META',
    id,
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: tableName,
      Item: item,
      ConditionExpression: 'attribute_not_exists(pk)',
    })
  );

  // Remove internal keys from response
  const { pk: _pk, sk: _sk, ...result } = item;
  return result;
}

/**
 * Update an existing item
 */
async function updateItem(
  tableName: string,
  entity: string,
  id: string,
  data: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const pk = generatePK(entity, id);
  const now = new Date().toISOString();

  // Build update expression dynamically
  const updateExpressions: string[] = ['#updatedAt = :updatedAt'];
  const expressionValues: Record<string, unknown> = { ':updatedAt': now };
  const expressionNames: Record<string, string> = { '#updatedAt': 'updatedAt' };

  // Filter out keys that shouldn't be updated
  const reservedKeys = ['pk', 'sk', 'id', 'createdAt', 'updatedAt'];

  Object.entries(data).forEach(([key, value]) => {
    if (!reservedKeys.includes(key)) {
      updateExpressions.push(`#${key} = :${key}`);
      expressionValues[`:${key}`] = value;
      expressionNames[`#${key}`] = key;
    }
  });

  const response = await docClient.send(
    new UpdateCommand({
      TableName: tableName,
      Key: { pk, sk: 'META' },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeValues: expressionValues,
      ExpressionAttributeNames: expressionNames,
      ConditionExpression: 'attribute_exists(pk)',
      ReturnValues: 'ALL_NEW',
    })
  );

  if (!response.Attributes) {
    throw new NotFoundError(`${entity} with id '${id}' not found`);
  }

  // Remove internal keys from response
  const { pk: _pk, sk: _sk, ...result } = response.Attributes;
  return result;
}

/**
 * Delete an item
 */
async function deleteItem(
  tableName: string,
  entity: string,
  id: string
): Promise<{ deleted: boolean; id: string }> {
  const pk = generatePK(entity, id);

  await docClient.send(
    new DeleteCommand({
      TableName: tableName,
      Key: { pk, sk: 'META' },
      ConditionExpression: 'attribute_exists(pk)',
    })
  );

  return { deleted: true, id };
}

/**
 * Query items by GSI
 */
async function queryByIndex(
  tableName: string,
  indexName: string,
  keyValue: string,
  queryParams?: Record<string, string>
): Promise<{ items: Record<string, unknown>[]; count: number }> {
  const limit = Math.min(parseInt(queryParams?.limit || '50', 10), 100);

  const response = await docClient.send(
    new QueryCommand({
      TableName: tableName,
      IndexName: indexName,
      KeyConditionExpression: '#pk = :pk',
      ExpressionAttributeNames: { '#pk': indexName.split('-')[1] || 'pk' },
      ExpressionAttributeValues: { ':pk': keyValue },
      Limit: limit,
      ScanIndexForward: queryParams?.order !== 'desc',
    })
  );

  const items = (response.Items || []).map((item) => {
    const { pk, sk, ...rest } = item;
    return rest;
  });

  return {
    items,
    count: response.Count || 0,
  };
}
