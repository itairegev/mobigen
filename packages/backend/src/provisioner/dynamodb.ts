/**
 * DynamoDB Table Provisioner
 *
 * Creates and manages DynamoDB tables based on template schemas
 */

import {
  DynamoDBClient,
  CreateTableCommand,
  DeleteTableCommand,
  DescribeTableCommand,
  ListTablesCommand,
  waitUntilTableExists,
  waitUntilTableNotExists,
  type KeySchemaElement,
  type AttributeDefinition as DDBAttributeDefinition,
  type GlobalSecondaryIndex as DDBGlobalSecondaryIndex,
} from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
} from '@aws-sdk/lib-dynamodb';
import type { TemplateSchema, TableSchema } from '../schemas/types';

export interface DynamoDBProvisionerConfig {
  region: string;
  tablePrefix: string;
}

export class DynamoDBProvisioner {
  private client: DynamoDBClient;
  private docClient: DynamoDBDocumentClient;
  private prefix: string;

  constructor(config: DynamoDBProvisionerConfig) {
    this.client = new DynamoDBClient({ region: config.region });
    this.docClient = DynamoDBDocumentClient.from(this.client);
    this.prefix = config.tablePrefix;
  }

  /**
   * Create all tables defined in the schema
   */
  async createTables(schema: TemplateSchema): Promise<string[]> {
    const tableNames: string[] = [];

    for (const table of schema.tables) {
      const tableName = this.getTableName(table.name);
      console.log(`[DynamoDB] Creating table: ${tableName}`);

      await this.createTable(table, tableName);
      tableNames.push(tableName);
    }

    // Wait for all tables to be active
    await this.waitForTablesActive(tableNames);

    return tableNames;
  }

  /**
   * Create a single DynamoDB table
   */
  private async createTable(table: TableSchema, tableName: string): Promise<void> {
    // Build key schema
    const keySchema: KeySchemaElement[] = [
      { AttributeName: table.partitionKey.name, KeyType: 'HASH' },
    ];

    if (table.sortKey) {
      keySchema.push({ AttributeName: table.sortKey.name, KeyType: 'RANGE' });
    }

    // Build attribute definitions (only for keys)
    const attributeDefinitions: DDBAttributeDefinition[] = [
      { AttributeName: table.partitionKey.name, AttributeType: table.partitionKey.type },
    ];

    if (table.sortKey) {
      attributeDefinitions.push({
        AttributeName: table.sortKey.name,
        AttributeType: table.sortKey.type,
      });
    }

    // Build GSI definitions
    let globalSecondaryIndexes: DDBGlobalSecondaryIndex[] | undefined;

    if (table.gsi && table.gsi.length > 0) {
      globalSecondaryIndexes = table.gsi.map((gsi) => {
        // Add GSI key attributes to attribute definitions if not already present
        if (!attributeDefinitions.find((a) => a.AttributeName === gsi.partitionKey.name)) {
          attributeDefinitions.push({
            AttributeName: gsi.partitionKey.name,
            AttributeType: gsi.partitionKey.type,
          });
        }

        if (gsi.sortKey && !attributeDefinitions.find((a) => a.AttributeName === gsi.sortKey!.name)) {
          attributeDefinitions.push({
            AttributeName: gsi.sortKey.name,
            AttributeType: gsi.sortKey.type,
          });
        }

        const gsiKeySchema: KeySchemaElement[] = [
          { AttributeName: gsi.partitionKey.name, KeyType: 'HASH' },
        ];

        if (gsi.sortKey) {
          gsiKeySchema.push({ AttributeName: gsi.sortKey.name, KeyType: 'RANGE' });
        }

        return {
          IndexName: gsi.name,
          KeySchema: gsiKeySchema,
          Projection: { ProjectionType: 'ALL' as const },
        };
      });
    }

    await this.client.send(
      new CreateTableCommand({
        TableName: tableName,
        KeySchema: keySchema,
        AttributeDefinitions: attributeDefinitions,
        BillingMode: 'PAY_PER_REQUEST',
        GlobalSecondaryIndexes: globalSecondaryIndexes,
        Tags: [
          { Key: 'Project', Value: this.prefix },
          { Key: 'ManagedBy', Value: 'mobigen' },
          { Key: 'CreatedAt', Value: new Date().toISOString() },
        ],
      })
    );
  }

  /**
   * Wait for tables to become active
   */
  private async waitForTablesActive(tableNames: string[]): Promise<void> {
    console.log(`[DynamoDB] Waiting for ${tableNames.length} tables to become active...`);

    await Promise.all(
      tableNames.map((tableName) =>
        waitUntilTableExists(
          { client: this.client, maxWaitTime: 120, minDelay: 2, maxDelay: 10 },
          { TableName: tableName }
        )
      )
    );

    console.log('[DynamoDB] All tables are now active');
  }

  /**
   * Seed initial data into tables
   */
  async seedData(schema: TemplateSchema): Promise<void> {
    if (!schema.seedData) {
      return;
    }

    for (const [tableName, items] of Object.entries(schema.seedData)) {
      const fullTableName = this.getTableName(tableName);
      console.log(`[DynamoDB] Seeding ${items.length} items into ${fullTableName}`);

      for (const item of items) {
        const pk = this.generatePK(tableName, item.id as string);

        await this.docClient.send(
          new PutCommand({
            TableName: fullTableName,
            Item: {
              ...item,
              pk,
              sk: 'META',
              createdAt: new Date().toISOString(),
            },
          })
        );
      }
    }
  }

  /**
   * Delete all tables for a project
   */
  async deleteTables(): Promise<void> {
    // List all tables with our prefix
    const tableNames = await this.listProjectTables();

    if (tableNames.length === 0) {
      console.log('[DynamoDB] No tables to delete');
      return;
    }

    console.log(`[DynamoDB] Deleting ${tableNames.length} tables...`);

    // Delete tables in parallel
    await Promise.all(
      tableNames.map(async (tableName) => {
        try {
          await this.client.send(new DeleteTableCommand({ TableName: tableName }));
          console.log(`[DynamoDB] Deleted table: ${tableName}`);
        } catch (error) {
          console.error(`[DynamoDB] Failed to delete table ${tableName}:`, error);
        }
      })
    );

    // Wait for tables to be deleted
    await Promise.all(
      tableNames.map((tableName) =>
        waitUntilTableNotExists(
          { client: this.client, maxWaitTime: 120, minDelay: 2, maxDelay: 10 },
          { TableName: tableName }
        ).catch(() => {
          // Table might already be deleted
        })
      )
    );

    console.log('[DynamoDB] All tables deleted');
  }

  /**
   * List all tables for this project
   */
  async listProjectTables(): Promise<string[]> {
    const tables: string[] = [];
    let lastEvaluatedTableName: string | undefined;

    do {
      const response = await this.client.send(
        new ListTablesCommand({
          ExclusiveStartTableName: lastEvaluatedTableName,
        })
      );

      const projectTables = (response.TableNames || []).filter((name) =>
        name.startsWith(this.prefix)
      );

      tables.push(...projectTables);
      lastEvaluatedTableName = response.LastEvaluatedTableName;
    } while (lastEvaluatedTableName);

    return tables;
  }

  /**
   * Check if tables exist for this project
   */
  async tablesExist(): Promise<boolean> {
    const tables = await this.listProjectTables();
    return tables.length > 0;
  }

  /**
   * Get table status
   */
  async getTableStatus(tableName: string): Promise<string | undefined> {
    try {
      const response = await this.client.send(
        new DescribeTableCommand({ TableName: this.getTableName(tableName) })
      );
      return response.Table?.TableStatus;
    } catch {
      return undefined;
    }
  }

  /**
   * Get full table name with prefix
   */
  private getTableName(baseName: string): string {
    return `${this.prefix}-${baseName}`;
  }

  /**
   * Generate partition key for an entity
   */
  private generatePK(entityType: string, id: string): string {
    // Convert plural to singular for PK prefix
    const singular = entityType.endsWith('ies')
      ? entityType.slice(0, -3) + 'y'
      : entityType.endsWith('s')
        ? entityType.slice(0, -1)
        : entityType;

    return `${singular.toUpperCase()}#${id}`;
  }
}
