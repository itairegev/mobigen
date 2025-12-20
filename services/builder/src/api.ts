import express, { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { getBuildService } from './build-service';
import { getArtifactDownloadUrl, getBuildLogs } from './artifact-storage';
import { BuildRequest } from './types';

// Validation schemas
const triggerBuildSchema = z.object({
  projectId: z.string().uuid(),
  platform: z.enum(['ios', 'android']),
  version: z.number().int().positive(),
  profile: z.enum(['development', 'preview', 'production']).default('production'),
});

const buildIdSchema = z.object({
  id: z.string().uuid(),
});

// Create Express app
export function createAPI(): express.Application {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(requestLogger);

  // Health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      service: 'builder',
      timestamp: new Date().toISOString(),
    });
  });

  // Routes
  app.post('/builds', triggerBuild);
  app.get('/builds/:id', getBuildStatus);
  app.get('/builds/:id/logs', getBuildLogsHandler);
  app.get('/builds/:id/download', getDownloadUrl);

  // Error handler
  app.use(errorHandler);

  return app;
}

/**
 * POST /builds - Trigger a new build
 */
async function triggerBuild(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Validate request body
    const result = triggerBuildSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        error: 'Invalid request',
        details: result.error.errors,
      });
      return;
    }

    const buildRequest: BuildRequest = result.data;

    // Trigger build
    const buildService = getBuildService();
    const buildStatus = await buildService.triggerBuild(buildRequest);

    res.status(202).json({
      success: true,
      data: buildStatus,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /builds/:id - Get build status
 */
async function getBuildStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Validate build ID
    const result = buildIdSchema.safeParse({ id: req.params.id });

    if (!result.success) {
      res.status(400).json({
        error: 'Invalid build ID',
        details: result.error.errors,
      });
      return;
    }

    const { id } = result.data;

    // Get build status
    const buildService = getBuildService();
    const buildStatus = await buildService.getBuildStatus(id);

    if (!buildStatus) {
      res.status(404).json({
        error: 'Build not found',
        buildId: id,
      });
      return;
    }

    res.json({
      success: true,
      data: buildStatus,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /builds/:id/logs - Get build logs
 */
async function getBuildLogsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Validate build ID
    const result = buildIdSchema.safeParse({ id: req.params.id });

    if (!result.success) {
      res.status(400).json({
        error: 'Invalid build ID',
        details: result.error.errors,
      });
      return;
    }

    const { id } = result.data;

    // Get build status to check if it exists
    const buildService = getBuildService();
    const buildStatus = await buildService.getBuildStatus(id);

    if (!buildStatus) {
      res.status(404).json({
        error: 'Build not found',
        buildId: id,
      });
      return;
    }

    // Get logs from storage or database
    let logs: string;

    try {
      logs = await getBuildLogs(id);
    } catch (error: any) {
      // If logs not in storage, try from build status
      logs = buildStatus.logs || 'No logs available';
    }

    // Return as plain text or JSON based on Accept header
    const acceptsJson = req.accepts(['json', 'text']) === 'json';

    if (acceptsJson) {
      res.json({
        success: true,
        data: {
          buildId: id,
          logs,
          timestamp: buildStatus.completedAt || buildStatus.startedAt,
        },
      });
    } else {
      res.type('text/plain').send(logs);
    }
  } catch (error) {
    next(error);
  }
}

/**
 * GET /builds/:id/download - Get artifact download URL
 */
async function getDownloadUrl(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Validate build ID
    const result = buildIdSchema.safeParse({ id: req.params.id });

    if (!result.success) {
      res.status(400).json({
        error: 'Invalid build ID',
        details: result.error.errors,
      });
      return;
    }

    const { id } = result.data;

    // Get build status
    const buildService = getBuildService();
    const buildStatus = await buildService.getBuildStatus(id);

    if (!buildStatus) {
      res.status(404).json({
        error: 'Build not found',
        buildId: id,
      });
      return;
    }

    // Check if build is successful
    if (buildStatus.status !== 'success') {
      res.status(400).json({
        error: 'Build not successful',
        buildId: id,
        status: buildStatus.status,
      });
      return;
    }

    // Generate download URL
    const expiresIn = parseInt(req.query.expiresIn as string) || 3600;
    const downloadUrl = await getArtifactDownloadUrl(id, expiresIn);

    res.json({
      success: true,
      data: {
        buildId: id,
        downloadUrl,
        expiresIn,
        expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Request logging middleware
 */
function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `${req.method} ${req.path} ${res.statusCode} ${duration}ms`
    );
  });

  next();
}

/**
 * Error handling middleware
 */
function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('Error:', err);

  // Don't send error if response already sent
  if (res.headersSent) {
    return next(err);
  }

  // Determine status code
  let statusCode = 500;
  let message = 'Internal server error';

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  } else if (err.message.includes('not found')) {
    statusCode = 404;
    message = err.message;
  } else if (err.message.includes('unauthorized')) {
    statusCode = 401;
    message = 'Unauthorized';
  } else if (err.message.includes('forbidden')) {
    statusCode = 403;
    message = 'Forbidden';
  }

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err.message,
    }),
  });
}

/**
 * Start the API server
 */
export function startServer(port: number = 3000): express.Application {
  const app = createAPI();

  app.listen(port, () => {
    console.log(`Builder API listening on port ${port}`);
    console.log(`Health check: http://localhost:${port}/health`);
  });

  return app;
}
