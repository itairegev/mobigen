/**
 * Analytics Event Ingestion API
 *
 * Express routes for receiving events from generated mobile apps.
 */

import express, { Request, Response, NextFunction } from 'express';
import type { IngestionService } from './ingestion';
import type { EventBatch, AnalyticsEvent } from './types';

export interface ApiConfig {
  ingestionService: IngestionService;
  /** API key validation (project ID -> API key mapping) */
  validateApiKey?: (projectId: string, apiKey: string) => Promise<boolean>;
}

/**
 * Create Express router for analytics ingestion
 */
export function createAnalyticsRouter(config: ApiConfig): express.Router {
  const router = express.Router();
  const { ingestionService, validateApiKey } = config;

  /**
   * Middleware: Extract client IP
   */
  const extractClientIP = (req: Request, res: Response, next: NextFunction) => {
    // Get IP from X-Forwarded-For (if behind proxy) or direct connection
    const forwarded = req.headers['x-forwarded-for'];
    const ip = typeof forwarded === 'string'
      ? forwarded.split(',')[0].trim()
      : req.socket.remoteAddress || '';

    (req as any).clientIP = ip;
    next();
  };

  /**
   * Middleware: API Key authentication
   */
  const authenticateApiKey = async (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.headers['x-api-key'] as string;
    const projectId = req.body.projectId || req.body.events?.[0]?.projectId;

    if (!apiKey) {
      res.status(401).json({
        error: 'Missing API key',
        message: 'X-API-Key header is required',
      });
      return;
    }

    if (!projectId) {
      res.status(400).json({
        error: 'Missing project ID',
        message: 'Project ID is required in request body',
      });
      return;
    }

    // Validate API key
    if (validateApiKey) {
      try {
        const isValid = await validateApiKey(projectId, apiKey);
        if (!isValid) {
          res.status(403).json({
            error: 'Invalid API key',
            message: 'The provided API key is not valid for this project',
          });
          return;
        }
      } catch (error) {
        console.error('API key validation error:', error);
        res.status(500).json({
          error: 'Authentication error',
          message: 'Failed to validate API key',
        });
        return;
      }
    }

    next();
  };

  /**
   * Middleware: Request logging
   */
  const logRequest = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
    });
    next();
  };

  // Apply middleware
  router.use(extractClientIP);
  router.use(logRequest);

  /**
   * POST /api/events - Ingest batch of events
   */
  router.post('/events', authenticateApiKey, async (req: Request, res: Response) => {
    try {
      const batch = req.body as EventBatch;
      const clientIP = (req as any).clientIP;

      // Validate required fields
      if (!batch.batchId || !batch.projectId || !batch.events) {
        res.status(400).json({
          error: 'Invalid batch',
          message: 'batchId, projectId, and events are required',
        });
        return;
      }

      // Ingest batch
      const result = await ingestionService.ingestBatch(batch, clientIP);

      if (result.success) {
        res.status(200).json({
          success: true,
          accepted: result.accepted,
          rejected: result.rejected,
          errors: result.errors,
          rateLimit: result.rateLimit,
        });
      } else {
        res.status(400).json({
          success: false,
          accepted: result.accepted,
          rejected: result.rejected,
          errors: result.errors,
          rateLimit: result.rateLimit,
        });
      }
    } catch (error) {
      console.error('Batch ingestion error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /api/events/single - Ingest single event
   */
  router.post('/events/single', authenticateApiKey, async (req: Request, res: Response) => {
    try {
      const event = req.body as AnalyticsEvent;
      const clientIP = (req as any).clientIP;

      // Validate required fields
      if (!event.eventId || !event.projectId || !event.type) {
        res.status(400).json({
          error: 'Invalid event',
          message: 'eventId, projectId, and type are required',
        });
        return;
      }

      // Ingest event
      const result = await ingestionService.ingestEvent(event, clientIP);

      if (result.success) {
        res.status(200).json({
          success: true,
          accepted: result.accepted,
          rateLimit: result.rateLimit,
        });
      } else {
        res.status(400).json({
          success: false,
          errors: result.errors,
          rateLimit: result.rateLimit,
        });
      }
    } catch (error) {
      console.error('Event ingestion error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /api/events/health - Health check
   */
  router.get('/health', async (req: Request, res: Response) => {
    try {
      const bufferStats = ingestionService.getBufferStats();

      res.status(200).json({
        status: 'ok',
        service: 'analytics-ingestion',
        timestamp: new Date().toISOString(),
        buffers: bufferStats,
      });
    } catch (error) {
      console.error('Health check error:', error);
      res.status(503).json({
        status: 'error',
        service: 'analytics-ingestion',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /api/events/flush - Manual buffer flush (admin only)
   */
  router.post('/flush', async (req: Request, res: Response) => {
    try {
      const { projectId } = req.body;

      await ingestionService.flushBuffer(projectId);

      res.status(200).json({
        success: true,
        message: projectId
          ? `Flushed buffer for project ${projectId}`
          : 'Flushed all buffers',
      });
    } catch (error) {
      console.error('Buffer flush error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /api/events/stats - Get buffer statistics (admin only)
   */
  router.get('/stats', (req: Request, res: Response) => {
    try {
      const bufferStats = ingestionService.getBufferStats();
      const totalBuffered = Object.values(bufferStats).reduce((sum, count) => sum + count, 0);

      res.status(200).json({
        totalBuffered,
        byProject: bufferStats,
      });
    } catch (error) {
      console.error('Stats error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  return router;
}

/**
 * Error handler middleware
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('Unhandled error:', err);

  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred',
  });
}

/**
 * Not found handler
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`,
  });
}
