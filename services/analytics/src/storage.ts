/**
 * Storage Adapters for Analytics Events
 *
 * Provides interfaces and implementations for storing events in:
 * - ClickHouse (preferred for time-series analytics)
 * - PostgreSQL (fallback/development)
 */

import type { EnrichedEvent } from './types';

/**
 * Storage adapter interface
 */
export interface StorageAdapter {
  /**
   * Write a batch of events to storage
   */
  writeEvents(events: EnrichedEvent[]): Promise<void>;

  /**
   * Health check
   */
  healthCheck(): Promise<boolean>;

  /**
   * Close connection
   */
  close(): Promise<void>;
}

/**
 * ClickHouse Storage Adapter
 *
 * ClickHouse is optimized for time-series analytics and provides:
 * - Fast ingestion (millions of events/second)
 * - Efficient compression
 * - Fast aggregation queries
 * - Horizontal scalability
 */
export class ClickHouseAdapter implements StorageAdapter {
  private client: any; // @clickhouse/client type
  private database: string;
  private table: string;

  constructor(config: {
    host: string;
    port?: number;
    database: string;
    table?: string;
    username?: string;
    password?: string;
  }) {
    this.database = config.database;
    this.table = config.table || 'events';

    // TODO: Implement actual ClickHouse client
    // For now, this is a stub implementation
    //
    // import { createClient } from '@clickhouse/client';
    // this.client = createClient({
    //   host: config.host,
    //   port: config.port || 8123,
    //   username: config.username || 'default',
    //   password: config.password,
    //   database: this.database,
    // });
  }

  async writeEvents(events: EnrichedEvent[]): Promise<void> {
    if (events.length === 0) return;

    // TODO: Implement actual ClickHouse insert
    // Example implementation:
    //
    // await this.client.insert({
    //   table: this.table,
    //   values: events.map(e => ({
    //     event_id: e.eventId,
    //     type: e.type,
    //     user_id: e.userId || '',
    //     session_id: e.sessionId,
    //     project_id: e.projectId,
    //     timestamp: new Date(e.timestamp),
    //     received_at: new Date(e.receivedAt),
    //     properties: JSON.stringify(e.properties || {}),
    //     device_platform: e.device?.platform || '',
    //     device_os_version: e.device?.osVersion || '',
    //     device_app_version: e.device?.appVersion || '',
    //     geo_country: e.geo?.country || '',
    //     geo_region: e.geo?.region || '',
    //     geo_city: e.geo?.city || '',
    //   })),
    //   format: 'JSONEachRow',
    // });

    // Stub: log for now
    console.log(`[ClickHouse Stub] Would insert ${events.length} events`);
  }

  async healthCheck(): Promise<boolean> {
    try {
      // TODO: Implement actual health check
      // await this.client.ping();
      return true;
    } catch (error) {
      console.error('ClickHouse health check failed:', error);
      return false;
    }
  }

  async close(): Promise<void> {
    // TODO: Close ClickHouse connection
    // await this.client.close();
  }

  /**
   * Create events table schema (run once during setup)
   */
  static async createSchema(client: any, database: string, table: string): Promise<void> {
    // Example ClickHouse schema:
    const schema = `
      CREATE TABLE IF NOT EXISTS ${database}.${table} (
        event_id String,
        type String,
        user_id String,
        session_id String,
        project_id String,
        timestamp DateTime64(3),
        received_at DateTime64(3),
        properties String,
        device_platform LowCardinality(String),
        device_os_version String,
        device_app_version String,
        device_model String,
        geo_country LowCardinality(String),
        geo_region String,
        geo_city String,
        _meta_version String,
        _meta_enriched UInt8
      )
      ENGINE = MergeTree()
      PARTITION BY toYYYYMM(timestamp)
      ORDER BY (project_id, timestamp, session_id)
      SETTINGS index_granularity = 8192;
    `;

    // TODO: Execute schema creation
    // await client.exec({ query: schema });
    console.log('Schema creation stub - would execute:', schema);
  }
}

/**
 * PostgreSQL Storage Adapter (Fallback)
 *
 * Uses PostgreSQL with TimescaleDB extension for time-series data.
 * Good for development or smaller deployments.
 */
export class PostgresAdapter implements StorageAdapter {
  private pool: any; // pg.Pool type
  private table: string;

  constructor(config: {
    connectionString: string;
    table?: string;
  }) {
    this.table = config.table || 'analytics_events';

    // TODO: Implement actual PostgreSQL client
    // For now, this is a stub implementation
    //
    // import { Pool } from 'pg';
    // this.pool = new Pool({
    //   connectionString: config.connectionString,
    // });
  }

  async writeEvents(events: EnrichedEvent[]): Promise<void> {
    if (events.length === 0) return;

    // TODO: Implement actual PostgreSQL insert
    // Example with batch insert:
    //
    // const values = events.map((e, i) => {
    //   const offset = i * 14;
    //   return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12}, $${offset + 13}, $${offset + 14})`;
    // }).join(', ');
    //
    // const params = events.flatMap(e => [
    //   e.eventId,
    //   e.type,
    //   e.userId || null,
    //   e.sessionId,
    //   e.projectId,
    //   new Date(e.timestamp),
    //   new Date(e.receivedAt),
    //   JSON.stringify(e.properties || {}),
    //   JSON.stringify(e.device || {}),
    //   e.geo?.country || null,
    //   e.geo?.region || null,
    //   e.geo?.city || null,
    //   e._meta.version,
    //   e._meta.enriched,
    // ]);
    //
    // await this.pool.query(`
    //   INSERT INTO ${this.table} (
    //     event_id, type, user_id, session_id, project_id,
    //     timestamp, received_at, properties, device,
    //     geo_country, geo_region, geo_city,
    //     meta_version, meta_enriched
    //   ) VALUES ${values}
    // `, params);

    // Stub: log for now
    console.log(`[Postgres Stub] Would insert ${events.length} events`);
  }

  async healthCheck(): Promise<boolean> {
    try {
      // TODO: Implement actual health check
      // await this.pool.query('SELECT 1');
      return true;
    } catch (error) {
      console.error('PostgreSQL health check failed:', error);
      return false;
    }
  }

  async close(): Promise<void> {
    // TODO: Close PostgreSQL connection
    // await this.pool.end();
  }

  /**
   * Create events table schema (run once during setup)
   */
  static async createSchema(pool: any, table: string): Promise<void> {
    // Example PostgreSQL + TimescaleDB schema:
    const schema = `
      CREATE TABLE IF NOT EXISTS ${table} (
        event_id VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL,
        user_id VARCHAR(255),
        session_id VARCHAR(255) NOT NULL,
        project_id VARCHAR(255) NOT NULL,
        timestamp TIMESTAMPTZ NOT NULL,
        received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        properties JSONB,
        device JSONB,
        geo_country VARCHAR(2),
        geo_region VARCHAR(255),
        geo_city VARCHAR(255),
        meta_version VARCHAR(50),
        meta_enriched BOOLEAN DEFAULT false,
        PRIMARY KEY (project_id, timestamp, event_id)
      );

      -- Create hypertable for time-series optimization (TimescaleDB)
      -- SELECT create_hypertable('${table}', 'timestamp', if_not_exists => TRUE);

      -- Indexes for common queries
      CREATE INDEX IF NOT EXISTS idx_${table}_project_time ON ${table} (project_id, timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_${table}_session ON ${table} (session_id, timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_${table}_user ON ${table} (user_id, timestamp DESC) WHERE user_id IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_${table}_type ON ${table} (project_id, type, timestamp DESC);
    `;

    // TODO: Execute schema creation
    // await pool.query(schema);
    console.log('Schema creation stub - would execute:', schema);
  }
}

/**
 * Event Buffer for local testing/development
 * Stores events in memory (not for production)
 */
export class InMemoryAdapter implements StorageAdapter {
  private events: EnrichedEvent[] = [];
  private maxSize: number;

  constructor(maxSize: number = 10000) {
    this.maxSize = maxSize;
  }

  async writeEvents(events: EnrichedEvent[]): Promise<void> {
    this.events.push(...events);

    // Keep only most recent events
    if (this.events.length > this.maxSize) {
      this.events = this.events.slice(-this.maxSize);
    }

    console.log(`[InMemory] Stored ${events.length} events (total: ${this.events.length})`);
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }

  async close(): Promise<void> {
    this.events = [];
  }

  /**
   * Get all stored events (for testing)
   */
  getEvents(): EnrichedEvent[] {
    return [...this.events];
  }

  /**
   * Get events for a specific project
   */
  getProjectEvents(projectId: string): EnrichedEvent[] {
    return this.events.filter(e => e.projectId === projectId);
  }

  /**
   * Clear all events
   */
  clear(): void {
    this.events = [];
  }
}

/**
 * Factory for creating storage adapters based on config
 */
export function createStorageAdapter(config: {
  type: 'clickhouse' | 'postgres' | 'memory';
  clickhouse?: {
    host: string;
    port?: number;
    database: string;
    table?: string;
    username?: string;
    password?: string;
  };
  postgres?: {
    connectionString: string;
    table?: string;
  };
  memory?: {
    maxSize?: number;
  };
}): StorageAdapter {
  switch (config.type) {
    case 'clickhouse':
      if (!config.clickhouse) {
        throw new Error('ClickHouse config required');
      }
      return new ClickHouseAdapter(config.clickhouse);

    case 'postgres':
      if (!config.postgres) {
        throw new Error('Postgres config required');
      }
      return new PostgresAdapter(config.postgres);

    case 'memory':
      return new InMemoryAdapter(config.memory?.maxSize);

    default:
      throw new Error(`Unknown storage adapter type: ${config.type}`);
  }
}
