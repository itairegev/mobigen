/**
 * Analytics Event Ingestion Service
 *
 * Handles incoming events from generated mobile apps:
 * - Validation
 * - Rate limiting
 * - Event enrichment (geo, device)
 * - Batch processing
 */

import { z } from 'zod';
import type Redis from 'ioredis';
import type {
  AnalyticsEvent,
  EventBatch,
  EnrichedEvent,
  IngestionResult,
  RateLimitInfo,
  GeoInfo,
} from './types';

// Validation schemas
const deviceInfoSchema = z.object({
  platform: z.enum(['ios', 'android', 'web']),
  osVersion: z.string().optional(),
  appVersion: z.string().optional(),
  model: z.string().optional(),
  screenWidth: z.number().optional(),
  screenHeight: z.number().optional(),
  locale: z.string().optional(),
  timezone: z.string().optional(),
  networkType: z.enum(['wifi', 'cellular', 'none', 'unknown']).optional(),
});

const baseEventSchema = z.object({
  type: z.string(),
  eventId: z.string(),
  userId: z.string().optional(),
  sessionId: z.string(),
  projectId: z.string(),
  timestamp: z.string(),
  properties: z.record(z.unknown()).optional(),
  device: deviceInfoSchema.optional(),
});

const eventBatchSchema = z.object({
  batchId: z.string(),
  projectId: z.string(),
  events: z.array(baseEventSchema),
  createdAt: z.string(),
  sdkVersion: z.string().optional(),
});

export interface IngestionConfig {
  /** Redis client for rate limiting and buffering */
  redis: Redis;
  /** Events per project per minute */
  rateLimitPerMinute?: number;
  /** Max events per batch */
  maxBatchSize?: number;
  /** Enable geo enrichment */
  enableGeoEnrichment?: boolean;
  /** Buffer size before flushing to storage */
  bufferSize?: number;
}

export class IngestionService {
  private redis: Redis;
  private rateLimitPerMinute: number;
  private maxBatchSize: number;
  private enableGeoEnrichment: boolean;
  private bufferSize: number;
  private eventBuffer: Map<string, EnrichedEvent[]> = new Map();

  // Storage adapter (injected)
  private storageAdapter?: {
    writeEvents(events: EnrichedEvent[]): Promise<void>;
  };

  constructor(config: IngestionConfig) {
    this.redis = config.redis;
    this.rateLimitPerMinute = config.rateLimitPerMinute || 1000;
    this.maxBatchSize = config.maxBatchSize || 100;
    this.enableGeoEnrichment = config.enableGeoEnrichment ?? true;
    this.bufferSize = config.bufferSize || 500;
  }

  /**
   * Set storage adapter for persisting events
   */
  setStorageAdapter(adapter: { writeEvents(events: EnrichedEvent[]): Promise<void> }) {
    this.storageAdapter = adapter;
  }

  /**
   * Ingest a batch of events
   */
  async ingestBatch(batch: EventBatch, ip?: string): Promise<IngestionResult> {
    // Validate batch structure
    const validationResult = eventBatchSchema.safeParse(batch);
    if (!validationResult.success) {
      return {
        success: false,
        accepted: 0,
        rejected: batch.events.length,
        errors: [
          {
            eventId: 'batch',
            reason: `Invalid batch structure: ${validationResult.error.message}`,
          },
        ],
      };
    }

    // Check batch size
    if (batch.events.length > this.maxBatchSize) {
      return {
        success: false,
        accepted: 0,
        rejected: batch.events.length,
        errors: [
          {
            eventId: 'batch',
            reason: `Batch size ${batch.events.length} exceeds maximum ${this.maxBatchSize}`,
          },
        ],
      };
    }

    // Check rate limit
    const rateLimitInfo = await this.checkRateLimit(batch.projectId, batch.events.length);
    if (rateLimitInfo.exceeded) {
      return {
        success: false,
        accepted: 0,
        rejected: batch.events.length,
        rateLimit: rateLimitInfo,
        errors: [
          {
            eventId: 'batch',
            reason: `Rate limit exceeded: ${rateLimitInfo.count}/${rateLimitInfo.limit} events per minute`,
          },
        ],
      };
    }

    // Process each event
    const enrichedEvents: EnrichedEvent[] = [];
    const errors: Array<{ eventId: string; reason: string }> = [];

    for (const event of batch.events) {
      try {
        // Validate individual event
        const eventValidation = baseEventSchema.safeParse(event);
        if (!eventValidation.success) {
          errors.push({
            eventId: event.eventId,
            reason: `Invalid event: ${eventValidation.error.message}`,
          });
          continue;
        }

        // Enrich event
        const enriched = await this.enrichEvent(event as AnalyticsEvent, ip);
        enrichedEvents.push(enriched);
      } catch (error) {
        errors.push({
          eventId: event.eventId,
          reason: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Buffer events for batch writing
    await this.bufferEvents(batch.projectId, enrichedEvents);

    // Increment rate limit counter
    await this.incrementRateLimit(batch.projectId, enrichedEvents.length);

    return {
      success: true,
      accepted: enrichedEvents.length,
      rejected: errors.length,
      errors: errors.length > 0 ? errors : undefined,
      rateLimit: rateLimitInfo,
    };
  }

  /**
   * Ingest a single event
   */
  async ingestEvent(event: AnalyticsEvent, ip?: string): Promise<IngestionResult> {
    return this.ingestBatch(
      {
        batchId: `single-${event.eventId}`,
        projectId: event.projectId,
        events: [event],
        createdAt: new Date().toISOString(),
      },
      ip
    );
  }

  /**
   * Enrich event with server-side data
   */
  private async enrichEvent(event: AnalyticsEvent, ip?: string): Promise<EnrichedEvent> {
    const enriched: EnrichedEvent = {
      ...event,
      receivedAt: new Date().toISOString(),
      geo: {},
      _meta: {
        version: '1.0',
        enriched: false,
      },
    };

    // Geo enrichment
    if (this.enableGeoEnrichment && ip) {
      try {
        enriched.geo = await this.enrichGeo(ip);
        enriched._meta.enriched = true;
      } catch (error) {
        // Log but don't fail if geo enrichment fails
        console.warn(`Geo enrichment failed for IP ${ip}:`, error);
        enriched._meta.errors = enriched._meta.errors || [];
        enriched._meta.errors.push('geo_enrichment_failed');
      }
    }

    return enriched;
  }

  /**
   * Enrich event with geo data from IP address
   * In production, use a service like MaxMind GeoIP2 or ipapi.co
   */
  private async enrichGeo(ip: string): Promise<GeoInfo> {
    // Skip private/local IPs
    if (this.isPrivateIP(ip)) {
      return {};
    }

    // TODO: Implement actual geo lookup
    // For now, return empty object (stub)
    // In production, integrate with MaxMind GeoIP2 or similar:
    //
    // import { Reader } from '@maxmind/geoip2-node';
    // const reader = await Reader.open('/path/to/GeoLite2-City.mmdb');
    // const response = reader.city(ip);
    // return {
    //   country: response.country?.isoCode,
    //   region: response.subdivisions?.[0]?.name,
    //   city: response.city?.name,
    //   lat: response.location?.latitude,
    //   lon: response.location?.longitude,
    // };

    return {};
  }

  /**
   * Check if IP is private/local
   */
  private isPrivateIP(ip: string): boolean {
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4) return true; // Invalid IP

    // 127.0.0.0/8 (localhost)
    if (parts[0] === 127) return true;

    // 10.0.0.0/8 (private)
    if (parts[0] === 10) return true;

    // 172.16.0.0/12 (private)
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;

    // 192.168.0.0/16 (private)
    if (parts[0] === 192 && parts[1] === 168) return true;

    return false;
  }

  /**
   * Check rate limit for a project
   */
  private async checkRateLimit(projectId: string, eventCount: number): Promise<RateLimitInfo> {
    const key = `ratelimit:${projectId}:${this.getCurrentMinute()}`;
    const count = await this.redis.get(key);
    const currentCount = count ? parseInt(count, 10) : 0;

    const now = new Date();
    const resetAt = new Date(now);
    resetAt.setSeconds(0, 0);
    resetAt.setMinutes(resetAt.getMinutes() + 1);

    return {
      projectId,
      count: currentCount,
      limit: this.rateLimitPerMinute,
      windowSeconds: 60,
      resetAt,
      exceeded: currentCount + eventCount > this.rateLimitPerMinute,
    };
  }

  /**
   * Increment rate limit counter
   */
  private async incrementRateLimit(projectId: string, eventCount: number): Promise<void> {
    const key = `ratelimit:${projectId}:${this.getCurrentMinute()}`;
    const pipeline = this.redis.pipeline();
    pipeline.incrby(key, eventCount);
    pipeline.expire(key, 120); // Keep for 2 minutes
    await pipeline.exec();
  }

  /**
   * Get current minute as string (for rate limit bucketing)
   */
  private getCurrentMinute(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
  }

  /**
   * Buffer events for batch writing
   */
  private async bufferEvents(projectId: string, events: EnrichedEvent[]): Promise<void> {
    if (!this.eventBuffer.has(projectId)) {
      this.eventBuffer.set(projectId, []);
    }

    const buffer = this.eventBuffer.get(projectId)!;
    buffer.push(...events);

    // Flush if buffer is full
    if (buffer.length >= this.bufferSize) {
      await this.flushBuffer(projectId);
    }
  }

  /**
   * Flush event buffer to storage
   */
  async flushBuffer(projectId?: string): Promise<void> {
    if (projectId) {
      // Flush specific project
      const buffer = this.eventBuffer.get(projectId);
      if (buffer && buffer.length > 0) {
        await this.writeToStorage(buffer);
        this.eventBuffer.set(projectId, []);
      }
    } else {
      // Flush all buffers
      for (const [pid, buffer] of this.eventBuffer.entries()) {
        if (buffer.length > 0) {
          await this.writeToStorage(buffer);
          this.eventBuffer.set(pid, []);
        }
      }
    }
  }

  /**
   * Write events to storage adapter
   */
  private async writeToStorage(events: EnrichedEvent[]): Promise<void> {
    if (!this.storageAdapter) {
      console.warn('No storage adapter configured, events will be lost');
      return;
    }

    try {
      await this.storageAdapter.writeEvents(events);
    } catch (error) {
      console.error('Failed to write events to storage:', error);
      // In production, implement retry logic or dead letter queue
      throw error;
    }
  }

  /**
   * Get buffer statistics
   */
  getBufferStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    for (const [projectId, buffer] of this.eventBuffer.entries()) {
      stats[projectId] = buffer.length;
    }
    return stats;
  }

  /**
   * Graceful shutdown - flush all buffers
   */
  async shutdown(): Promise<void> {
    console.log('Flushing event buffers before shutdown...');
    await this.flushBuffer();
    console.log('Event buffers flushed');
  }
}
