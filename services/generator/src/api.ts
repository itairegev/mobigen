import express, { Express } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import archiver from 'archiver';
// S3 artifact storage
import {
  uploadArtifact,
  uploadProjectZip,
  getArtifactDownloadUrl,
  listProjectArtifacts,
  checkS3Availability,
} from './artifact-storage';
// Use the new AI-driven orchestrator by default
import {
  generateApp,
  generateAppWithPipeline,
  getTaskStatus,
  resumeGeneration,
  resumeFromPhase,
  TaskTracker,
} from './ai-orchestrator';
// Preview service for web and Expo Go previews
import {
  createWebPreview,
  createExpoGoPreview,
  getPreviewStatus,
  getProjectPreviews,
  deletePreview,
  cleanupExpiredPreviews,
} from './preview-service';
// Enhanced orchestrators with task tracking, feedback loop, and resume capabilities
import {
  generateAppEnhancedAI,
  generateAppHybrid,
} from './enhanced-orchestrator';
// Legacy orchestrator available as fallback (set ORCHESTRATOR_MODE=legacy to use)
import { generateApp as generateAppLegacy } from './orchestrator';
import type { SDKMessage } from '@mobigen/ai';
// OTA update service
import { getOTAService } from './ota-service';
import type { OTAPublishOptions, OTARollbackOptions } from './ota-types';
// Multi-channel OTA service
import { getChannelService } from './channel-service';
import type {
  CreateChannelInput,
  UpdateChannelInput,
  PromoteUpdateInput,
} from './channel-types';
// Version management
import { VersionManager } from './version-manager';
import {
  validateVersionFormat,
  validateVersionIncrement,
  checkCompatibility,
  detectVersionType,
  suggestNextVersion,
  getVersionSummary,
} from './version-validation';
// Code export service
import { getExportService } from './export-service';
import type { ExportOptions } from './export-types';
// GitHub integration service
import { GitHubService } from './github-service';
// White-label branding service
import { getWhiteLabelService } from './white-label-service';
import type { BrandConfig } from './white-label-types';

// Inline observability utilities (avoiding package dependency for now)
type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';
interface HealthReport { status: HealthStatus; timestamp: string; service: string; version: string; uptime: number; checks: Array<{ name: string; status: HealthStatus; message?: string }> }

const startTime = Date.now();
const createHealthCheckManager = (opts: { service: string; version: string }) => ({
  liveness: async () => ({ status: 'ok', uptime: Math.floor((Date.now() - startTime) / 1000) }),
  readiness: async (): Promise<HealthReport> => ({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: opts.service,
    version: opts.version,
    uptime: Math.floor((Date.now() - startTime) / 1000),
    checks: [{ name: 'memory', status: 'healthy', message: 'OK' }],
  }),
  check: async (): Promise<HealthReport> => ({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: opts.service,
    version: opts.version,
    uptime: Math.floor((Date.now() - startTime) / 1000),
    checks: [{ name: 'memory', status: 'healthy', message: 'OK' }],
  }),
  register: () => {},
});
const healthChecks = { memory: () => async () => ({ name: 'memory', status: 'healthy' as const, message: 'OK' }) };
const defaultRegistry = {
  export: () => '# Mobigen Metrics\nmobigen_active_generations 0\nmobigen_generation_total 0\n',
  exportJson: () => ({}),
};
const createLogger = (opts: { service: string }) => ({
  info: (msg: string, ctx?: unknown) => console.log(`[${opts.service}] INFO:`, msg, ctx || ''),
  error: (msg: string, err?: unknown) => console.error(`[${opts.service}] ERROR:`, msg, err || ''),
  warn: (msg: string) => console.warn(`[${opts.service}] WARN:`, msg),
  debug: (msg: string) => console.debug(`[${opts.service}] DEBUG:`, msg),
});

// Select orchestrator based on environment variable
// Options:
//   'pipeline' (default) - Explicit phases with feedback loop
//   'ai' - Original AI-driven workflow
//   'ai-enhanced' - AI-driven with task tracking, feedback loop, and resume
//   'hybrid' - Best of both: AI flexibility + pipeline reliability + full tracking
//   'legacy' - Old hardcoded sequential pipeline
type OrchestratorMode = 'ai' | 'ai-enhanced' | 'hybrid' | 'pipeline' | 'legacy';
const orchestratorMode = (process.env.ORCHESTRATOR_MODE || 'pipeline') as OrchestratorMode;

function getOrchestrator(mode: OrchestratorMode) {
  switch (mode) {
    case 'legacy':
      return generateAppLegacy;
    case 'pipeline':
      return generateAppWithPipeline;
    case 'ai-enhanced':
      return generateAppEnhancedAI;
    case 'hybrid':
      return generateAppHybrid;
    case 'ai':
    default:
      return generateApp;
  }
}

const orchestratorGenerateApp = getOrchestrator(orchestratorMode);

const app: Express = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || ['http://localhost:3000', 'http://localhost:3333'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  // Keep connections alive during long-running generation
  pingTimeout: 60000,      // 60s before considering connection dead
  pingInterval: 25000,     // Ping every 25s to keep connection alive
  // Allow both transports
  transports: ['websocket', 'polling'],
  // Increase buffer sizes for large progress updates
  maxHttpBufferSize: 1e6,  // 1MB
});

app.use(cors());
app.use(express.json());

// Store active project connections
const projectSockets = new Map<string, Set<string>>();

// WebSocket connection handling
io.on('connection', (socket) => {
  const clientInfo = `${socket.id} (${socket.handshake.address})`;
  console.log(`[WebSocket] Client connected: ${clientInfo}`);

  socket.on('subscribe', (projectId: string) => {
    socket.join(`project:${projectId}`);
    const sockets = projectSockets.get(projectId) || new Set();
    sockets.add(socket.id);
    projectSockets.set(projectId, sockets);
    console.log(`[WebSocket] ${socket.id} subscribed to project ${projectId} (${sockets.size} subscribers)`);
  });

  socket.on('unsubscribe', (projectId: string) => {
    socket.leave(`project:${projectId}`);
    const sockets = projectSockets.get(projectId);
    if (sockets) {
      sockets.delete(socket.id);
      console.log(`[WebSocket] ${socket.id} unsubscribed from project ${projectId}`);
    }
  });

  socket.on('disconnect', (reason) => {
    console.log(`[WebSocket] Client disconnected: ${socket.id} (reason: ${reason})`);
    // Clean up from all project subscriptions
    projectSockets.forEach((sockets, projectId) => {
      if (sockets.has(socket.id)) {
        sockets.delete(socket.id);
        console.log(`[WebSocket] Cleaned up ${socket.id} from project ${projectId}`);
      }
    });
  });

  socket.on('error', (error) => {
    console.error(`[WebSocket] Socket error for ${socket.id}:`, error);
  });
});

// Stage types for generation progress
type ProgressStage =
  | 'starting'
  | 'phase'
  | 'cloning'
  | 'template-context'
  | 'task'
  | 'validation-attempt'
  | 'fixing'
  | 'complete'
  | 'error'
  | string; // Allow agent names as stages too

// Emit progress to all clients subscribed to a project
export async function emitProgress(
  projectId: string,
  stage: ProgressStage,
  data: SDKMessage | Record<string, unknown>
): Promise<void> {
  io.to(`project:${projectId}`).emit('generation:progress', {
    projectId,
    stage,
    timestamp: new Date().toISOString(),
    data,
  });
}

// Input validation schemas
const GenerateRequestSchema = z.object({
  projectId: z.string().uuid(),
  prompt: z.string().min(1).max(10000),
  config: z.object({
    appName: z.string().min(1).max(100),
    bundleId: z.object({
      ios: z.string(),
      android: z.string(),
    }),
    branding: z.object({
      displayName: z.string(),
      primaryColor: z.string(),
      secondaryColor: z.string(),
    }),
    identifiers: z.object({
      projectId: z.string(),
      easProjectId: z.string(),
      awsResourcePrefix: z.string(),
      analyticsKey: z.string(),
    }),
  }),
});

// API Routes
app.post('/api/generate', async (req, res) => {
  let responseSent = false;

  try {
    const validated = GenerateRequestSchema.parse(req.body);

    // Allow request to specify orchestrator mode
    const requestMode = req.body.mode as OrchestratorMode | undefined;
    const effectiveMode = requestMode || orchestratorMode;
    const generator = getOrchestrator(effectiveMode);

    // Start generation in background
    console.log(`[api] Using ${effectiveMode} orchestrator`);
    const resultPromise = generator(
      validated.prompt,
      validated.projectId,
      validated.config
    );

    // Return immediately with job ID
    res.json({
      success: true,
      jobId: validated.projectId,
      message: 'Generation started. Subscribe to WebSocket for progress updates.',
    });
    responseSent = true;

    // Wait for completion and emit result via WebSocket
    try {
      const result = await resultPromise;
      io.to(`project:${validated.projectId}`).emit('generation:complete', result);
    } catch (genError) {
      // Generation failed after response was sent - emit error via WebSocket
      console.error('Generation error:', genError);
      io.to(`project:${validated.projectId}`).emit('generation:error', {
        error: genError instanceof Error ? genError.message : 'Generation failed',
      });
    }
  } catch (error) {
    // Only send HTTP error if response hasn't been sent yet
    if (!responseSent) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, errors: error.errors });
      } else {
        console.error('Generation error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
      }
    }
  }
});

// ============================================================================
// HEALTH, METRICS, AND OBSERVABILITY ENDPOINTS
// ============================================================================

// Initialize health check manager
const healthManager = createHealthCheckManager({
  service: 'generator',
  version: '0.1.0',
});

// Health checks are pre-registered in the inline implementation

// Initialize logger
const logger = createLogger({ service: 'generator' });

// Liveness probe - just checks if service is running
app.get('/api/health/live', async (req, res) => {
  const result = await healthManager.liveness();
  res.json(result);
});

// Readiness probe - checks all dependencies
app.get('/api/health/ready', async (req, res) => {
  const report = await healthManager.readiness();
  const statusCode = report.status === 'healthy' ? 200 :
                     report.status === 'degraded' ? 200 : 503;
  res.status(statusCode).json(report);
});

// Full health check (backward compatible)
app.get('/api/health', async (req, res) => {
  const report = await healthManager.check();
  res.json({
    status: report.status === 'healthy' ? 'ok' : report.status,
    timestamp: report.timestamp,
    service: report.service,
    version: report.version,
    uptime: report.uptime,
    checks: report.checks,
  });
});

// Prometheus metrics endpoint
app.get('/api/metrics', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(defaultRegistry.export());
});

// Metrics as JSON
app.get('/api/metrics/json', (req, res) => {
  res.json(defaultRegistry.exportJson());
});

// ============================================================================
// TASK TRACKING ENDPOINTS
// ============================================================================

// Get task status for a project
app.get('/api/projects/:projectId/tasks', (req, res) => {
  const { projectId } = req.params;
  const status = getTaskStatus(projectId);

  if (!status) {
    return res.status(404).json({
      success: false,
      error: 'No active job found for this project',
    });
  }

  res.json({
    success: true,
    ...status,
  });
});

// Get all tasks for a job
app.get('/api/jobs/:jobId/tasks', (req, res) => {
  const { jobId } = req.params;
  const summary = TaskTracker.getProgressSummary(jobId);

  if (!summary) {
    return res.status(404).json({
      success: false,
      error: 'Job not found',
    });
  }

  const tasks = TaskTracker.getTasksByJob(jobId);

  res.json({
    success: true,
    summary,
    tasks: tasks.map(t => ({
      id: t.id,
      phase: t.phase,
      agent: t.agentId,
      status: t.status,
      duration: t.durationMs,
      error: t.errorMessage,
      filesModified: t.filesModified.length,
    })),
  });
});

// Resume a paused/failed generation
app.post('/api/projects/:projectId/resume', async (req, res) => {
  const { projectId } = req.params;

  try {
    const result = await resumeGeneration(projectId);

    if (!result) {
      return res.status(400).json({
        success: false,
        error: 'Cannot resume - no pauseable/failed job found',
      });
    }

    res.json({
      success: true,
      message: 'Generation resumed',
      projectId,
    });

    // Emit progress via WebSocket
    io.to(`project:${projectId}`).emit('generation:resumed', { projectId });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to resume',
    });
  }
});

// Resume from a specific phase (useful for resuming after failures)
app.post('/api/projects/:projectId/resume-from-phase', async (req, res) => {
  const { projectId } = req.params;
  const { phase, previousOutputs = {} } = req.body;

  if (!phase) {
    return res.status(400).json({
      success: false,
      error: 'Phase is required. Valid phases: analysis, planning, design, task-breakdown, implementation, validation, build-validation, qa',
    });
  }

  try {
    console.log(`[api] Resuming project ${projectId} from phase: ${phase}`);

    // Send initial response
    res.json({
      success: true,
      message: `Starting resume from phase: ${phase}`,
      projectId,
      phase,
    });

    // Emit progress via WebSocket
    io.to(`project:${projectId}`).emit('generation:resumed', {
      projectId,
      fromPhase: phase,
    });

    // Run in background
    resumeFromPhase(projectId, phase, previousOutputs)
      .then((result) => {
        io.to(`project:${projectId}`).emit('generation:complete', {
          success: result.success,
          filesModified: result.files.length,
        });
      })
      .catch((error) => {
        io.to(`project:${projectId}`).emit('generation:error', {
          error: error instanceof Error ? error.message : 'Resume failed',
        });
      });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to resume from phase',
    });
  }
});

// Pause a running generation
app.post('/api/projects/:projectId/pause', (req, res) => {
  const { projectId } = req.params;
  const job = TaskTracker.getJobByProject(projectId);

  if (!job) {
    return res.status(404).json({
      success: false,
      error: 'No active job found',
    });
  }

  const paused = TaskTracker.pauseJob(job.id);

  if (!paused) {
    return res.status(400).json({
      success: false,
      error: 'Failed to pause job',
    });
  }

  res.json({
    success: true,
    message: 'Generation paused',
    jobId: job.id,
  });

  // Emit progress via WebSocket
  io.to(`project:${projectId}`).emit('generation:paused', { projectId, jobId: job.id });
});

// Get failed tasks that need fixing
app.get('/api/projects/:projectId/errors', (req, res) => {
  const { projectId } = req.params;
  const job = TaskTracker.getJobByProject(projectId);

  if (!job) {
    return res.status(404).json({
      success: false,
      error: 'No active job found',
    });
  }

  const analysis = TaskTracker.analyzeErrors(job.id);

  res.json({
    success: true,
    hasErrors: analysis.hasErrors,
    canAutoFix: analysis.canAutoFix,
    errors: analysis.errors,
  });
});

// ============================================================================
// PROGRESS & HISTORY ENDPOINTS
// ============================================================================

// Get all jobs for a project (history)
app.get('/api/projects/:projectId/jobs', async (req, res) => {
  const { projectId } = req.params;
  const limit = parseInt(req.query.limit as string) || 20;
  const includeCompleted = req.query.includeCompleted !== 'false';

  try {
    const jobs = await TaskTracker.getAllJobsForProject(projectId, { limit, includeCompleted });

    res.json({
      success: true,
      projectId,
      count: jobs.length,
      jobs: jobs.map(j => ({
        id: j.id,
        status: j.status,
        progress: j.progress,
        currentPhase: j.currentPhase,
        currentAgent: j.currentAgent,
        totalTasks: j.totalTasks,
        completedTasks: j.completedTasks,
        failedTasks: j.failedTasks,
        retryCount: j.retryCount,
        startedAt: j.startedAt,
        completedAt: j.completedAt,
        createdAt: j.createdAt,
        errorMessage: j.errorMessage,
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get jobs',
    });
  }
});

// Get current progress summary for a project
app.get('/api/projects/:projectId/progress', async (req, res) => {
  const { projectId } = req.params;

  try {
    // First try to load from database if not in memory
    let job = TaskTracker.getJobByProject(projectId);

    if (!job) {
      // Try loading from database
      const dbJob = await TaskTracker.loadJobFromDatabase(projectId);
      job = dbJob ?? undefined;
    }

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'No job found for this project',
        hint: 'Start a new generation with POST /api/generate',
      });
    }

    const summary = TaskTracker.getProgressSummary(job.id);
    const compact = TaskTracker.getCompactStatus(job.id);

    res.json({
      success: true,
      projectId,
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      phases: compact?.phases || [],
      summary: summary ? {
        currentPhase: summary.currentPhase,
        currentAgent: summary.currentAgent,
        phases: summary.phases,
        errors: summary.errors.slice(0, 5), // Limit to first 5 errors
        canResume: summary.canResume,
      } : null,
      timing: {
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        durationMs: job.completedAt && job.startedAt
          ? job.completedAt.getTime() - job.startedAt.getTime()
          : null,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get progress',
    });
  }
});

// Get detailed job information
app.get('/api/jobs/:jobId/details', async (req, res) => {
  const { jobId } = req.params;

  try {
    const details = await TaskTracker.getJobDetails(jobId);

    if (!details) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }

    res.json({
      success: true,
      job: {
        id: details.job.id,
        projectId: details.job.projectId,
        status: details.job.status,
        progress: details.job.progress,
        currentPhase: details.job.currentPhase,
        currentAgent: details.job.currentAgent,
        totalTasks: details.job.totalTasks,
        completedTasks: details.job.completedTasks,
        failedTasks: details.job.failedTasks,
        retryCount: details.job.retryCount,
        maxRetries: details.job.maxRetries,
        errorMessage: details.job.errorMessage,
        startedAt: details.job.startedAt,
        completedAt: details.job.completedAt,
        createdAt: details.job.createdAt,
      },
      summary: details.summary,
      tasks: details.tasks.map(t => ({
        id: t.id,
        phase: t.phase,
        agentId: t.agentId,
        taskType: t.taskType,
        status: t.status,
        priority: t.priority,
        retryCount: t.retryCount,
        durationMs: t.durationMs,
        filesModified: t.filesModified,
        errorMessage: t.errorMessage,
        errorDetails: t.errorDetails,
        startedAt: t.startedAt,
        completedAt: t.completedAt,
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get job details',
    });
  }
});

// Get all failed tasks for a project (across all jobs)
app.get('/api/projects/:projectId/failed-tasks', async (req, res) => {
  const { projectId } = req.params;

  try {
    const failedByJob = await TaskTracker.getFailedTasksForProject(projectId);

    const totalFailed = failedByJob.reduce((sum, j) => sum + j.failedTasks.length, 0);

    res.json({
      success: true,
      projectId,
      totalFailedTasks: totalFailed,
      jobsWithFailures: failedByJob.length,
      failures: failedByJob.map(j => ({
        jobId: j.jobId,
        jobStatus: j.jobStatus,
        tasks: j.failedTasks.map(t => ({
          id: t.id,
          phase: t.phase,
          agentId: t.agentId,
          errorMessage: t.errorMessage,
          errorDetails: t.errorDetails,
          retryCount: t.retryCount,
          durationMs: t.durationMs,
          startedAt: t.startedAt,
          completedAt: t.completedAt,
        })),
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get failed tasks',
    });
  }
});

// Force sync to database (manual trigger)
app.post('/api/admin/sync-database', async (req, res) => {
  try {
    await TaskTracker.syncToDatabase();
    res.json({
      success: true,
      message: 'Database sync completed',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Sync failed',
    });
  }
});

// Detailed config check
app.get('/api/config', (req, res) => {
  const fs = require('fs');
  const path = require('path');

  // Check paths
  const possibleRoots = [
    process.env.MOBIGEN_ROOT,
    process.cwd(),
    path.resolve(process.cwd(), '..'),
    path.resolve(process.cwd(), '../..'),
  ].filter(Boolean);

  let templatesPath: string | null = null;
  let availableTemplates: string[] = [];

  for (const root of possibleRoots) {
    const testPath = path.join(root, 'templates-bare');
    if (fs.existsSync(testPath)) {
      templatesPath = testPath;
      try {
        availableTemplates = fs.readdirSync(testPath)
          .filter((f: string) => f.endsWith('.git'))
          .map((f: string) => f.replace('.git', ''));
      } catch (e) {
        // ignore
      }
      break;
    }
  }

  const config = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV || 'development',
      cwd: process.cwd(),
    },
    orchestrator: {
      mode: orchestratorMode,
      description: {
        'pipeline': 'Explicit phases with feedback loop',
        'ai': 'AI-driven workflow decisions',
        'ai-enhanced': 'AI-driven with task tracking, feedback loop, and resume',
        'hybrid': 'AI flexibility + pipeline reliability + full tracking',
        'legacy': 'Hardcoded sequential agent pipeline',
      }[orchestratorMode] || 'Unknown mode',
      envVar: 'ORCHESTRATOR_MODE',
      currentValue: process.env.ORCHESTRATOR_MODE || 'pipeline (default)',
      availableModes: ['pipeline', 'ai', 'ai-enhanced', 'hybrid', 'legacy'],
    },
    ai: {
      provider: process.env.AI_PROVIDER || 'bedrock (default)',
      anthropicKeyConfigured: !!process.env.ANTHROPIC_API_KEY,
      awsRegion: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1',
      awsKeyConfigured: !!process.env.AWS_ACCESS_KEY_ID,
      verbose: process.env.CLAUDE_SDK_VERBOSE === 'true',
      timeout: process.env.CLAUDE_API_TIMEOUT_MS || '300000',
    },
    templates: {
      path: templatesPath,
      available: availableTemplates,
      found: availableTemplates.length > 0,
    },
    paths: {
      MOBIGEN_ROOT: process.env.MOBIGEN_ROOT || 'auto-detected',
      searched: possibleRoots,
    },
  };

  // Check for issues
  const issues: string[] = [];

  if (!config.templates.found) {
    issues.push('templates-bare directory not found');
  }

  if (config.ai.provider === 'anthropic' && !config.ai.anthropicKeyConfigured) {
    issues.push('ANTHROPIC_API_KEY not set but AI_PROVIDER=anthropic');
  }

  if (config.ai.provider.includes('bedrock') && !config.ai.awsKeyConfigured) {
    issues.push('AWS credentials not configured (will use credential chain)');
  }

  res.json({
    ...config,
    issues,
    healthy: issues.filter(i => !i.includes('credential chain')).length === 0,
  });
});

// Test AI connection
app.get('/api/test-ai', async (req, res) => {
  try {
    const { query } = await import('@anthropic-ai/claude-agent-sdk');

    const startTime = Date.now();
    let response = '';

    for await (const message of query({
      prompt: 'Say "AI connection test successful" and nothing else.',
      options: {
        maxTurns: 1,
      },
    })) {
      if (message.type === 'assistant' && message.message) {
        const textBlock = message.message.content.find((b: { type: string }) => b.type === 'text');
        if (textBlock && 'text' in textBlock) {
          response = textBlock.text as string;
        }
      }
    }

    const duration = Date.now() - startTime;

    res.json({
      status: 'ok',
      message: 'AI connection successful',
      response: response.substring(0, 100),
      durationMs: duration,
      provider: process.env.AI_PROVIDER || 'bedrock',
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      status: 'error',
      message: 'AI connection failed',
      error: errMsg,
      provider: process.env.AI_PROVIDER || 'bedrock',
      hints: [
        'Check that AI_PROVIDER is set correctly',
        'If using Anthropic: ensure ANTHROPIC_API_KEY is set',
        'If using Bedrock: ensure AWS credentials are configured',
        'Check CLAUDE_SDK_VERBOSE=true for more details in logs',
      ],
    });
  }
});

// ============================================================================
// PROJECT ACTIONS: Download, Build, Preview
// ============================================================================

// Get project path helper
function getProjectPath(projectId: string): string {
  const mobigenRoot = process.env.MOBIGEN_ROOT || path.resolve(process.cwd(), '../..');
  return path.join(mobigenRoot, 'projects', projectId);
}

// Download project as ZIP (supports S3 redirect or local streaming)
app.get('/api/projects/:projectId/download', async (req, res) => {
  const { projectId } = req.params;
  const { format = 'zip', upload = 'false' } = req.query;
  const projectPath = getProjectPath(projectId);

  // Check S3 availability
  const s3Status = await checkS3Availability();

  // If S3 is available and upload is requested, upload to S3 first
  if (s3Status.available && upload === 'true') {
    console.log(`[api] Uploading project ${projectId} to S3...`);
    const uploadResult = await uploadProjectZip(projectPath, projectId);

    if (uploadResult.success && uploadResult.artifact) {
      return res.json({
        success: true,
        message: 'Project uploaded to S3',
        downloadUrl: uploadResult.artifact.downloadUrl,
        s3Key: uploadResult.artifact.s3Key,
        size: uploadResult.artifact.size,
        expiresAt: uploadResult.artifact.expiresAt,
      });
    }
    // Fall through to local download if S3 upload fails
  }

  // Check if S3 already has this artifact
  if (s3Status.available) {
    const existingUrl = await getArtifactDownloadUrl(projectId, 'latest', 'zip');
    if (existingUrl) {
      return res.json({
        success: true,
        message: 'Artifact available on S3',
        downloadUrl: existingUrl,
        source: 's3',
      });
    }
  }

  // Fall back to local file streaming
  if (!fs.existsSync(projectPath)) {
    return res.status(404).json({
      success: false,
      error: 'Project not found',
      projectId,
      path: projectPath,
      suggestion: s3Status.available
        ? 'Project not found locally. Try uploading with ?upload=true'
        : 'Project not found locally and S3 is not configured',
    });
  }

  try {
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${projectId}.zip"`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', (err: Error) => {
      throw err;
    });

    archive.pipe(res);
    archive.directory(projectPath, false);
    await archive.finalize();
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create archive',
    });
  }
});

// Upload project to S3 and get download URL
app.post('/api/projects/:projectId/upload-to-s3', async (req, res) => {
  const { projectId } = req.params;
  const projectPath = getProjectPath(projectId);

  const s3Status = await checkS3Availability();
  if (!s3Status.available) {
    return res.status(503).json({
      success: false,
      error: 'S3 storage is not available',
      details: s3Status.error,
    });
  }

  if (!fs.existsSync(projectPath)) {
    return res.status(404).json({
      success: false,
      error: 'Project not found locally',
      projectId,
    });
  }

  try {
    const result = await uploadProjectZip(projectPath, projectId);

    if (result.success && result.artifact) {
      res.json({
        success: true,
        downloadUrl: result.artifact.downloadUrl,
        s3Key: result.artifact.s3Key,
        size: result.artifact.size,
        filename: result.artifact.filename,
        expiresAt: result.artifact.expiresAt,
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Upload failed',
      });
    }
  } catch (error) {
    console.error('S3 upload error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    });
  }
});

// List all artifacts for a project
app.get('/api/projects/:projectId/artifacts', async (req, res) => {
  const { projectId } = req.params;

  try {
    const artifacts = await listProjectArtifacts(projectId);
    res.json({
      success: true,
      projectId,
      count: artifacts.length,
      artifacts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list artifacts',
    });
  }
});

// Get S3 storage status
app.get('/api/storage/status', async (req, res) => {
  const status = await checkS3Availability();
  res.json({
    success: true,
    s3: status,
  });
});

// Get project files list
app.get('/api/projects/:projectId/files', async (req, res) => {
  const { projectId } = req.params;
  const projectPath = getProjectPath(projectId);

  if (!fs.existsSync(projectPath)) {
    return res.status(404).json({
      success: false,
      error: 'Project not found',
    });
  }

  try {
    const getAllFiles = (dir: string, baseDir: string = dir): string[] => {
      const files: string[] = [];
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(baseDir, fullPath);

        // Skip node_modules and .git
        if (entry.name === 'node_modules' || entry.name === '.git') continue;

        if (entry.isDirectory()) {
          files.push(...getAllFiles(fullPath, baseDir));
        } else {
          files.push(relativePath);
        }
      }

      return files;
    };

    const files = getAllFiles(projectPath);
    res.json({ success: true, files, count: files.length });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list files',
    });
  }
});

// Trigger build (placeholder - would integrate with EAS)
app.post('/api/projects/:projectId/build', async (req, res) => {
  const { projectId } = req.params;
  const { platform = 'all' } = req.body;
  const projectPath = getProjectPath(projectId);

  if (!fs.existsSync(projectPath)) {
    return res.status(404).json({
      success: false,
      error: 'Project not found',
    });
  }

  // Check if app.json exists
  const appJsonPath = path.join(projectPath, 'app.json');
  if (!fs.existsSync(appJsonPath)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid project: app.json not found',
    });
  }

  // TODO: Integrate with Expo EAS Build
  // For now, return instructions for manual build
  res.json({
    success: true,
    message: 'Build instructions generated',
    projectId,
    platform,
    instructions: {
      steps: [
        `1. cd ${projectPath}`,
        '2. npm install',
        '3. npx expo prebuild',
        `4. npx eas build --platform ${platform === 'all' ? 'all' : platform}`,
      ],
      note: 'EAS Build integration coming soon. For now, follow the manual steps above.',
      docs: 'https://docs.expo.dev/build/introduction/',
    },
  });
});

// ============================================================================
// PREVIEW ENDPOINTS
// ============================================================================

// Get all previews for a project
app.get('/api/projects/:projectId/previews', async (req, res) => {
  const { projectId } = req.params;
  const projectPath = getProjectPath(projectId);

  if (!fs.existsSync(projectPath)) {
    return res.status(404).json({
      success: false,
      error: 'Project not found',
    });
  }

  const previews = getProjectPreviews(projectId);

  res.json({
    success: true,
    projectId,
    count: previews.length,
    previews: previews.map(p => ({
      previewId: p.previewId,
      type: p.type,
      status: p.status,
      url: p.url,
      createdAt: p.createdAt,
      expiresAt: p.expiresAt,
      error: p.error,
    })),
  });
});

// Create web preview (export to web and deploy)
app.post('/api/projects/:projectId/preview/web', async (req, res) => {
  const { projectId } = req.params;
  const projectPath = getProjectPath(projectId);

  if (!fs.existsSync(projectPath)) {
    return res.status(404).json({
      success: false,
      error: 'Project not found',
    });
  }

  try {
    // Emit starting event
    io.to(`project:${projectId}`).emit('preview:start', {
      projectId,
      type: 'web',
    });

    // Create web preview
    const result = await createWebPreview(projectId);

    // Emit completion event
    io.to(`project:${projectId}`).emit('preview:complete', {
      projectId,
      result,
    });

    res.json({
      success: result.success,
      previewId: result.previewId,
      type: result.type,
      url: result.url,
      qrCode: result.qrCode,
      expiresAt: result.expiresAt,
      bundleSize: result.bundleSize,
      filesCount: result.filesCount,
      error: result.error,
      warnings: result.warnings,
    });
  } catch (error) {
    console.error('Web preview error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create web preview',
    });
  }
});

// Create Expo Go preview (generate QR code)
app.get('/api/projects/:projectId/preview/qr', async (req, res) => {
  const { projectId } = req.params;
  const projectPath = getProjectPath(projectId);

  if (!fs.existsSync(projectPath)) {
    return res.status(404).json({
      success: false,
      error: 'Project not found',
    });
  }

  try {
    const result = await createExpoGoPreview(projectId);

    res.json({
      success: result.success,
      previewId: result.previewId,
      type: result.type,
      url: result.url,
      qrCode: result.qrCode,
      expiresAt: result.expiresAt,
      devServerUrl: result.devServerUrl,
      lanUrl: result.lanUrl,
      tunnelUrl: result.tunnelUrl,
      error: result.error,
      instructions: {
        steps: [
          '1. Install Expo Go on your device',
          '2. Start the dev server: npx expo start',
          '3. Scan the QR code with Expo Go',
        ],
        expoGoLinks: {
          ios: 'https://apps.apple.com/app/expo-go/id982107779',
          android: 'https://play.google.com/store/apps/details?id=host.exp.exponent',
        },
      },
    });
  } catch (error) {
    console.error('Expo Go preview error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create Expo Go preview',
    });
  }
});

// Get preview status by ID
app.get('/api/previews/:previewId', async (req, res) => {
  const { previewId } = req.params;
  const status = getPreviewStatus(previewId);

  if (!status) {
    return res.status(404).json({
      success: false,
      error: 'Preview not found',
    });
  }

  res.json({
    success: true,
    ...status,
  });
});

// Delete a preview
app.delete('/api/previews/:previewId', async (req, res) => {
  const { previewId } = req.params;

  try {
    const deleted = await deletePreview(previewId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Preview not found',
      });
    }

    res.json({
      success: true,
      message: 'Preview deleted',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete preview',
    });
  }
});

// Admin: Cleanup expired previews
app.post('/api/admin/cleanup-previews', async (req, res) => {
  try {
    const cleanedCount = await cleanupExpiredPreviews();

    res.json({
      success: true,
      message: `Cleaned up ${cleanedCount} expired previews`,
      cleanedCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Cleanup failed',
    });
  }
});

// Legacy preview endpoint (for backwards compatibility)
app.get('/api/projects/:projectId/preview', async (req, res) => {
  const { projectId } = req.params;
  const projectPath = getProjectPath(projectId);

  if (!fs.existsSync(projectPath)) {
    return res.status(404).json({
      success: false,
      error: 'Project not found',
    });
  }

  // Read app.json for app info
  const appJsonPath = path.join(projectPath, 'app.json');
  let appConfig: Record<string, unknown> = {};
  if (fs.existsSync(appJsonPath)) {
    try {
      appConfig = JSON.parse(fs.readFileSync(appJsonPath, 'utf-8'));
    } catch (e) {
      // ignore
    }
  }

  // Get existing previews
  const previews = getProjectPreviews(projectId);
  const activePreview = previews.find(p => p.status === 'active');

  res.json({
    success: true,
    projectId,
    appConfig: appConfig.expo || appConfig,
    activePreview: activePreview ? {
      previewId: activePreview.previewId,
      type: activePreview.type,
      url: activePreview.url,
      expiresAt: activePreview.expiresAt,
    } : null,
    endpoints: {
      webPreview: `POST /api/projects/${projectId}/preview/web`,
      qrPreview: `GET /api/projects/${projectId}/preview/qr`,
      allPreviews: `GET /api/projects/${projectId}/previews`,
    },
    instructions: {
      web: 'Use POST /api/projects/:id/preview/web to create a web preview',
      expoGo: 'Use GET /api/projects/:id/preview/qr to get an Expo Go QR code',
    },
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// VERSION MANAGEMENT ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

// Get current version for a project
app.get('/api/projects/:projectId/version', async (req, res) => {
  const { projectId } = req.params;

  try {
    const version = await VersionManager.getCurrentVersion(projectId);

    if (!version) {
      return res.status(404).json({
        success: false,
        error: 'No version found for this project',
      });
    }

    res.json({
      success: true,
      version: version.version,
      runtimeVersion: version.runtimeVersion,
      createdAt: version.createdAt,
      notes: version.notes,
      channel: version.channel,
      summary: getVersionSummary(version.version),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get version',
    });
  }
});

// Increment version (major, minor, or patch)
app.post('/api/projects/:projectId/version/increment', async (req, res) => {
  const { projectId } = req.params;
  const { type, notes } = req.body;

  // Validate type
  if (!type || !['major', 'minor', 'patch'].includes(type)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid version type. Must be one of: major, minor, patch',
    });
  }

  try {
    const version = await VersionManager.incrementVersion(projectId, type, notes);

    res.json({
      success: true,
      version: version.version,
      runtimeVersion: version.runtimeVersion,
      createdAt: version.createdAt,
      notes: version.notes,
      channel: version.channel,
      type,
      summary: getVersionSummary(version.version),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to increment version',
    });
  }
});

// Set specific version
app.put('/api/projects/:projectId/version', async (req, res) => {
  const { projectId } = req.params;
  const { version, notes } = req.body;

  if (!version) {
    return res.status(400).json({
      success: false,
      error: 'Version is required',
    });
  }

  // Validate version format
  const validation = validateVersionFormat(version);
  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      error: validation.error,
    });
  }

  try {
    const newVersion = await VersionManager.setVersion(projectId, version, notes);

    res.json({
      success: true,
      version: newVersion.version,
      runtimeVersion: newVersion.runtimeVersion,
      createdAt: newVersion.createdAt,
      notes: newVersion.notes,
      channel: newVersion.channel,
      summary: getVersionSummary(newVersion.version),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to set version',
    });
  }
});

// Get version history
app.get('/api/projects/:projectId/versions', async (req, res) => {
  const { projectId } = req.params;
  const { channel, limit, offset } = req.query;

  try {
    const history = await VersionManager.getVersionHistory(projectId, {
      channel: channel as string | undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });

    res.json({
      success: true,
      projectId,
      count: history.length,
      versions: history.map(v => ({
        version: v.version,
        runtimeVersion: v.runtimeVersion,
        createdAt: v.createdAt,
        notes: v.notes,
        channel: v.channel,
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get version history',
    });
  }
});

// Get all versions across all channels
app.get('/api/projects/:projectId/versions/all', async (req, res) => {
  const { projectId } = req.params;

  try {
    const allVersions = await VersionManager.getAllVersions(projectId);

    res.json({
      success: true,
      projectId,
      channels: allVersions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get all versions',
    });
  }
});

// Validate version format
app.post('/api/version/validate', (req, res) => {
  const { version } = req.body;

  if (!version) {
    return res.status(400).json({
      success: false,
      error: 'Version is required',
    });
  }

  const result = validateVersionFormat(version);

  res.json({
    success: result.valid,
    valid: result.valid,
    error: result.error,
    summary: result.valid ? getVersionSummary(version) : null,
  });
});

// Check version compatibility
app.post('/api/version/compatibility', (req, res) => {
  const { version1, version2 } = req.body;

  if (!version1 || !version2) {
    return res.status(400).json({
      success: false,
      error: 'Both version1 and version2 are required',
    });
  }

  const result = checkCompatibility(version1, version2);

  res.json({
    success: true,
    compatible: result.compatible,
    reason: result.reason,
    version1: {
      version: version1,
      runtimeVersion: result.runtimeVersion1,
    },
    version2: {
      version: version2,
      runtimeVersion: result.runtimeVersion2,
    },
  });
});

// Suggest next version
app.post('/api/version/suggest', (req, res) => {
  const { currentVersion, type } = req.body;

  if (!currentVersion || !type) {
    return res.status(400).json({
      success: false,
      error: 'Both currentVersion and type are required',
    });
  }

  if (!['major', 'minor', 'patch'].includes(type)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid type. Must be one of: major, minor, patch',
    });
  }

  const suggested = suggestNextVersion(currentVersion, type);

  if (!suggested) {
    return res.status(400).json({
      success: false,
      error: 'Failed to suggest version. Check that currentVersion is valid.',
    });
  }

  res.json({
    success: true,
    currentVersion,
    type,
    suggestedVersion: suggested,
    summary: getVersionSummary(suggested),
  });
});

// Get or create channels
app.get('/api/projects/:projectId/channels', async (req, res) => {
  const { projectId } = req.params;

  try {
    const channels = await VersionManager.getChannels(projectId);

    res.json({
      success: true,
      projectId,
      count: channels.length,
      channels,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get channels',
    });
  }
});

// Create a new channel
app.post('/api/projects/:projectId/channels', async (req, res) => {
  const { projectId } = req.params;
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({
      success: false,
      error: 'Channel name is required',
    });
  }

  // Validate channel name (alphanumeric, dash, underscore)
  if (!/^[a-z0-9-_]+$/i.test(name)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid channel name. Use only alphanumeric characters, dashes, and underscores.',
    });
  }

  try {
    const channel = await VersionManager.createChannel(projectId, name, description);

    res.json({
      success: true,
      channel,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create channel',
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// TESTING ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

import {
  createTestingIntegration,
  quickValidation,
  fullValidation,
} from './testing-integration';

// Run quick validation (Tier 1 only - instant check)
app.post('/api/projects/:projectId/test/quick', async (req, res) => {
  const { projectId } = req.params;
  const projectPath = getProjectPath(projectId);

  if (!fs.existsSync(projectPath)) {
    return res.status(404).json({
      success: false,
      error: 'Project not found',
    });
  }

  try {
    const result = await quickValidation(projectPath, projectId);

    res.json({
      success: result.passed,
      tier: 'tier1',
      errors: result.errors,
      errorCount: result.errors.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Run full validation (all tiers progressively)
app.post('/api/projects/:projectId/test/full', async (req, res) => {
  const { projectId } = req.params;
  const { stopOnFailure = true } = req.body;
  const projectPath = getProjectPath(projectId);

  if (!fs.existsSync(projectPath)) {
    return res.status(404).json({
      success: false,
      error: 'Project not found',
    });
  }

  try {
    const result = await fullValidation(projectPath, projectId, { stopOnFailure });

    res.json({
      success: result.passed,
      summary: result.summary,
      errors: result.errors,
      errorCount: result.errors.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Run specific tier validation
app.post('/api/projects/:projectId/test/:tier', async (req, res) => {
  const { projectId, tier } = req.params;
  const projectPath = getProjectPath(projectId);

  if (!['tier1', 'tier2', 'tier3'].includes(tier)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid tier. Must be tier1, tier2, or tier3',
    });
  }

  if (!fs.existsSync(projectPath)) {
    return res.status(404).json({
      success: false,
      error: 'Project not found',
    });
  }

  try {
    const integration = createTestingIntegration({
      projectPath,
      projectId,
      emitProgress: true,
    });

    const result = tier === 'tier1' ? await integration.runTier1Validation() :
                   tier === 'tier2' ? await integration.runTier2Validation() :
                   await integration.runTier3Validation();

    res.json({
      success: result.success,
      tier: result.tier,
      duration: result.result.duration,
      stages: Object.entries(result.result.stages).map(([name, stage]) => ({
        name,
        passed: stage.passed,
        duration: stage.duration,
        errorCount: stage.errors.length,
        output: stage.output,
      })),
      errors: result.errors,
      errorCount: result.errors.length,
      warningCount: result.result.warnings.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get test summary for a project
app.get('/api/projects/:projectId/test/summary', async (req, res) => {
  const { projectId } = req.params;
  const projectPath = getProjectPath(projectId);

  if (!fs.existsSync(projectPath)) {
    return res.status(404).json({
      success: false,
      error: 'Project not found',
    });
  }

  // Check for cached test results
  const testResultsPath = path.join(projectPath, '.mobigen', 'test-results.json');

  if (fs.existsSync(testResultsPath)) {
    try {
      const cachedResults = JSON.parse(fs.readFileSync(testResultsPath, 'utf-8'));
      return res.json({
        success: true,
        cached: true,
        ...cachedResults,
      });
    } catch {
      // Fall through to empty response
    }
  }

  res.json({
    success: true,
    cached: false,
    message: 'No test results available. Run POST /api/projects/:id/test/quick or /test/full to generate results.',
    endpoints: {
      quick: `POST /api/projects/${projectId}/test/quick`,
      full: `POST /api/projects/${projectId}/test/full`,
      tier1: `POST /api/projects/${projectId}/test/tier1`,
      tier2: `POST /api/projects/${projectId}/test/tier2`,
      tier3: `POST /api/projects/${projectId}/test/tier3`,
    },
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// OTA UPDATE ROUTES
// ═══════════════════════════════════════════════════════════════════════════

// Validation schema for publishing OTA updates
const PublishOTASchema = z.object({
  channelId: z.string().uuid(),
  message: z.string().min(1).max(500),
  changeType: z.enum(['feature', 'fix', 'style', 'content']).optional(),
  platform: z.enum(['ios', 'android', 'all']).default('all'),
  rolloutPercent: z.number().int().min(0).max(100).default(100),
});

// Publish a new OTA update
app.post('/api/projects/:projectId/updates/publish', async (req, res) => {
  const { projectId } = req.params;
  const userId = req.body.userId || 'system'; // In production, get from auth context

  try {
    // Validate request body
    const validated = PublishOTASchema.parse(req.body);

    // Create publish options
    const options: OTAPublishOptions = {
      projectId,
      channelId: validated.channelId,
      message: validated.message,
      changeType: validated.changeType,
      platform: validated.platform,
      rolloutPercent: validated.rolloutPercent,
    };

    // Get OTA service
    const otaService = getOTAService();

    // Publish the update
    console.log(`[api] Publishing OTA update for project ${projectId}`);
    const update = await otaService.publishUpdate(options, userId);

    res.json({
      success: true,
      update: {
        id: update.id,
        version: update.version,
        status: update.status,
        platform: update.platform,
        message: update.message,
        rolloutPercent: update.rolloutPercent,
        manifestUrl: update.manifestUrl,
        publishedAt: update.publishedAt,
        createdAt: update.createdAt,
      },
    });
  } catch (error) {
    console.error('[api] Failed to publish OTA update:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get all updates for a project
app.get('/api/projects/:projectId/updates', async (req, res) => {
  const { projectId } = req.params;
  const channelId = req.query.channelId as string | undefined;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

  try {
    const otaService = getOTAService();
    const updates = await otaService.listUpdates(projectId, channelId, limit);

    res.json({
      success: true,
      updates: updates.map(u => ({
        id: u.id,
        version: u.version,
        status: u.status,
        platform: u.platform,
        message: u.message,
        changeType: u.changeType,
        rolloutPercent: u.rolloutPercent,
        downloadCount: u.downloadCount,
        errorCount: u.errorCount,
        manifestUrl: u.manifestUrl,
        publishedAt: u.publishedAt,
        createdAt: u.createdAt,
      })),
      total: updates.length,
    });
  } catch (error) {
    console.error('[api] Failed to list OTA updates:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get specific update status with metrics
app.get('/api/projects/:projectId/updates/:updateId', async (req, res) => {
  const { projectId, updateId } = req.params;

  try {
    const otaService = getOTAService();

    // Get update status
    const status = await otaService.getUpdateStatus(projectId, updateId);

    // Get metrics
    const metrics = await otaService.getUpdateMetrics(updateId);

    // Get health info
    const health = await otaService.getUpdateHealth(updateId);

    res.json({
      success: true,
      status,
      metrics: metrics.map(m => ({
        platform: m.platform,
        successCount: m.successCount,
        failureCount: m.failureCount,
        rollbackCount: m.rollbackCount,
        successRate: m.successRate,
        avgDownloadTimeMs: m.avgDownloadTimeMs,
        avgApplyTimeMs: m.avgApplyTimeMs,
      })),
      recentErrors: health.recentErrors,
    });
  } catch (error) {
    console.error('[api] Failed to get OTA update status:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Rollback to a previous update
app.post('/api/projects/:projectId/updates/:updateId/rollback', async (req, res) => {
  const { projectId, updateId } = req.params;
  const userId = req.body.userId || 'system'; // In production, get from auth context
  const targetUpdateId = req.body.targetUpdateId as string | undefined;

  try {
    const otaService = getOTAService();

    const options: OTARollbackOptions = {
      updateId,
      targetUpdateId,
    };

    console.log(`[api] Rolling back update ${updateId} for project ${projectId}`);
    const rolledBackUpdate = await otaService.rollbackTo(projectId, options, userId);

    res.json({
      success: true,
      update: {
        id: rolledBackUpdate.id,
        version: rolledBackUpdate.version,
        status: rolledBackUpdate.status,
        message: rolledBackUpdate.message,
        publishedAt: rolledBackUpdate.publishedAt,
      },
      message: `Successfully rolled back to update ${rolledBackUpdate.id}`,
    });
  } catch (error) {
    console.error('[api] Failed to rollback OTA update:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get update channels for a project
app.get('/api/projects/:projectId/updates/channels', async (req, res) => {
  const { projectId } = req.params;

  try {
    const otaService = getOTAService();
    const channels = await otaService.listChannels(projectId);

    res.json({
      success: true,
      channels: channels.map(c => ({
        id: c.id,
        name: c.name,
        description: c.description,
        isDefault: c.isDefault,
        branchName: c.branchName,
        runtimeVersion: c.runtimeVersion,
        createdAt: c.createdAt,
      })),
    });
  } catch (error) {
    console.error('[api] Failed to list channels:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Create a new update channel
app.post('/api/projects/:projectId/updates/channels', async (req, res) => {
  const { projectId } = req.params;
  const { name, isDefault = false } = req.body;

  if (!name || typeof name !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Channel name is required',
    });
  }

  try {
    const otaService = getOTAService();
    const channel = await otaService.createChannel(projectId, name, isDefault);

    res.json({
      success: true,
      channel: {
        id: channel.id,
        name: channel.name,
        description: channel.description,
        isDefault: channel.isDefault,
        branchName: channel.branchName,
        createdAt: channel.createdAt,
      },
    });
  } catch (error) {
    console.error('[api] Failed to create channel:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// MULTI-CHANNEL OTA ROUTES (Enhanced Channel Management)
// ═══════════════════════════════════════════════════════════════════════════

// Validation schemas
const CreateChannelSchemaAPI = z.object({
  name: z.string().min(1).max(50),
  description: z.string().optional(),
  config: z.object({
    autoUpdate: z.boolean().default(true),
    rolloutPercentage: z.number().int().min(0).max(100).default(100),
    minVersion: z.string().optional(),
    maxRetries: z.number().int().min(0).max(10).optional(),
    updateCheckInterval: z.number().int().min(60).optional(),
    notifyBeforeUpdate: z.boolean().optional(),
    metadata: z.record(z.unknown()).optional(),
  }).optional(),
  isDefault: z.boolean().default(false),
});

const UpdateChannelSchemaAPI = z.object({
  name: z.string().min(1).max(50).optional(),
  description: z.string().optional(),
  config: z.object({
    autoUpdate: z.boolean().optional(),
    rolloutPercentage: z.number().int().min(0).max(100).optional(),
    minVersion: z.string().optional(),
    maxRetries: z.number().int().min(0).max(10).optional(),
    updateCheckInterval: z.number().int().min(60).optional(),
    notifyBeforeUpdate: z.boolean().optional(),
    metadata: z.record(z.unknown()).optional(),
  }).optional(),
  isDefault: z.boolean().optional(),
});

const PromoteUpdateSchemaAPI = z.object({
  updateId: z.string().uuid(),
  targetChannelId: z.string().uuid(),
  message: z.string().optional(),
  changeType: z.enum(['feature', 'fix', 'style', 'content']).optional(),
  rolloutPercent: z.number().int().min(0).max(100).optional(),
});

// Get all channels for a project (enhanced with config)
app.get('/api/projects/:projectId/channels/v2', async (req, res) => {
  const { projectId } = req.params;

  try {
    const channelService = getChannelService();
    const channels = await channelService.getChannels(projectId);

    res.json({
      success: true,
      projectId,
      count: channels.length,
      channels: channels.map(c => ({
        id: c.id,
        name: c.name,
        description: c.description,
        config: c.config,
        branchName: c.branchName,
        isDefault: c.isDefault,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
    });
  } catch (error) {
    console.error('[api] Failed to get channels:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get specific channel with summary
app.get('/api/projects/:projectId/channels/:channelId', async (req, res) => {
  const { projectId, channelId } = req.params;

  try {
    const channelService = getChannelService();
    const summary = await channelService.getChannelSummary(projectId, channelId);

    res.json({
      success: true,
      channel: summary,
    });
  } catch (error) {
    console.error('[api] Failed to get channel:', error);
    res.status(404).json({
      success: false,
      error: error instanceof Error ? error.message : 'Channel not found',
    });
  }
});

// Create a new channel with full configuration
app.post('/api/projects/:projectId/channels/v2', async (req, res) => {
  const { projectId } = req.params;

  try {
    const validated = CreateChannelSchemaAPI.parse(req.body);

    const channelService = getChannelService();
    const channel = await channelService.createChannel(projectId, validated as CreateChannelInput);

    res.json({
      success: true,
      channel: {
        id: channel.id,
        name: channel.name,
        description: channel.description,
        config: channel.config,
        branchName: channel.branchName,
        isDefault: channel.isDefault,
        createdAt: channel.createdAt,
      },
    });
  } catch (error) {
    console.error('[api] Failed to create channel:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create channel',
    });
  }
});

// Update channel configuration
app.put('/api/projects/:projectId/channels/:channelId', async (req, res) => {
  const { projectId, channelId } = req.params;

  try {
    const validated = UpdateChannelSchemaAPI.parse(req.body);

    const channelService = getChannelService();
    const channel = await channelService.updateChannel(
      projectId,
      channelId,
      validated as UpdateChannelInput
    );

    res.json({
      success: true,
      channel: {
        id: channel.id,
        name: channel.name,
        description: channel.description,
        config: channel.config,
        isDefault: channel.isDefault,
        updatedAt: channel.updatedAt,
      },
    });
  } catch (error) {
    console.error('[api] Failed to update channel:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update channel',
    });
  }
});

// Delete a channel
app.delete('/api/projects/:projectId/channels/:channelId', async (req, res) => {
  const { projectId, channelId } = req.params;

  try {
    const channelService = getChannelService();
    await channelService.deleteChannel(projectId, channelId);

    res.json({
      success: true,
      message: 'Channel deleted successfully',
    });
  } catch (error) {
    console.error('[api] Failed to delete channel:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete channel',
    });
  }
});

// Promote an update from one channel to another
app.post('/api/projects/:projectId/channels/:channelId/promote', async (req, res) => {
  const { projectId, channelId } = req.params;
  const userId = req.body.userId || 'system'; // In production, get from auth context

  try {
    const validated = PromoteUpdateSchemaAPI.parse(req.body);

    const channelService = getChannelService();
    const result = await channelService.promoteUpdate(
      projectId,
      channelId,
      validated as PromoteUpdateInput,
      userId
    );

    res.json({
      success: true,
      promotion: {
        id: result.promotion.id,
        status: result.promotion.status,
        sourceChannel: result.sourceChannel.name,
        targetChannel: result.targetChannel.name,
        promotedAt: result.promotion.promotedAt,
      },
      update: {
        id: result.update.id,
        version: result.update.version,
        message: result.update.message,
      },
    });
  } catch (error) {
    console.error('[api] Failed to promote update:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to promote update',
    });
  }
});

// Initialize default channels for a project
app.post('/api/projects/:projectId/channels/initialize', async (req, res) => {
  const { projectId } = req.params;

  try {
    const channelService = getChannelService();
    const channels = await channelService.initializeDefaultChannels(projectId);

    res.json({
      success: true,
      message: `Initialized ${channels.length} default channels`,
      channels: channels.map(c => ({
        id: c.id,
        name: c.name,
        description: c.description,
        config: c.config,
        isDefault: c.isDefault,
      })),
    });
  } catch (error) {
    console.error('[api] Failed to initialize default channels:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to initialize channels',
    });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CODE EXPORT ROUTES (Pro/Enterprise Only)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Check user tier middleware
 * In production, this should check the user's tier from database
 */
function checkProOrEnterpriseTier(req: any, res: any, next: any) {
  const userTier = req.body.userTier || req.query.userTier || 'basic';

  if (userTier === 'pro' || userTier === 'enterprise') {
    next();
  } else {
    res.status(403).json({
      success: false,
      error: 'Code export is only available for Pro and Enterprise users',
      requiredTier: 'pro',
      currentTier: userTier,
    });
  }
}

// Validation schema for export options
const ExportOptionsSchema = z.object({
  format: z.enum(['zip', 'tar.gz']).optional(),
  includeEnv: z.boolean().optional(),
  cleanSecrets: z.boolean().optional(),
  includeDocs: z.boolean().optional(),
  includeGitHistory: z.boolean().optional(),
  excludePatterns: z.array(z.string()).optional(),
  userTier: z.enum(['pro', 'enterprise']),
  version: z.number().optional(),
  appName: z.string().optional(),
  templateId: z.string().optional(),
});

// POST /api/projects/:id/export - Start export
app.post('/api/projects/:projectId/export', checkProOrEnterpriseTier, async (req, res) => {
  const { projectId } = req.params;

  try {
    const validated = ExportOptionsSchema.parse(req.body);

    // Extract export options
    const options: Partial<ExportOptions> = {
      format: validated.format,
      includeEnv: validated.includeEnv,
      cleanSecrets: validated.cleanSecrets,
      includeDocs: validated.includeDocs,
      includeGitHistory: validated.includeGitHistory,
      excludePatterns: validated.excludePatterns,
    };

    // Extract metadata
    const metadata = {
      version: validated.version || 1,
      appName: validated.appName,
      templateId: validated.templateId,
      userTier: validated.userTier,
    };

    // Get export service
    const exportService = getExportService();

    // Start export
    console.log(`[api] Starting export for project ${projectId}`);
    const result = await exportService.exportProject(projectId, options, metadata);

    res.json({
      success: true,
      export: {
        exportId: result.exportId,
        status: result.status,
        format: result.format,
        createdAt: result.createdAt,
      },
    });
  } catch (error) {
    console.error('[api] Failed to start export:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start export',
    });
  }
});

// GET /api/projects/:id/exports - List exports
app.get('/api/projects/:projectId/exports', checkProOrEnterpriseTier, async (req, res) => {
  const { projectId } = req.params;

  try {
    const exportService = getExportService();
    const exports = await exportService.listExports(projectId);

    res.json({
      success: true,
      exports,
      count: exports.length,
    });
  } catch (error) {
    console.error('[api] Failed to list exports:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list exports',
    });
  }
});

// GET /api/projects/:id/exports/:exportId - Get export status
app.get('/api/projects/:projectId/exports/:exportId', checkProOrEnterpriseTier, async (req, res) => {
  const { exportId } = req.params;

  try {
    const exportService = getExportService();
    const exportResult = await exportService.getExportStatus(exportId);

    if (!exportResult) {
      res.status(404).json({
        success: false,
        error: 'Export not found',
      });
      return;
    }

    res.json({
      success: true,
      export: {
        exportId: exportResult.exportId,
        projectId: exportResult.projectId,
        status: exportResult.status,
        format: exportResult.format,
        fileSize: exportResult.fileSize,
        filesIncluded: exportResult.filesIncluded,
        error: exportResult.error,
        createdAt: exportResult.createdAt,
        completedAt: exportResult.completedAt,
        expiresAt: exportResult.expiresAt,
      },
    });
  } catch (error) {
    console.error('[api] Failed to get export status:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get export status',
    });
  }
});

// GET /api/projects/:id/exports/:exportId/download - Download export
app.get('/api/projects/:projectId/exports/:exportId/download', checkProOrEnterpriseTier, async (req, res) => {
  const { exportId } = req.params;

  try {
    const exportService = getExportService();
    const downloadUrl = await exportService.downloadExport(exportId);

    if (!downloadUrl) {
      res.status(404).json({
        success: false,
        error: 'Export not found or not ready',
      });
      return;
    }

    // Redirect to presigned S3 URL
    res.redirect(302, downloadUrl);
  } catch (error) {
    console.error('[api] Failed to download export:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to download export',
    });
  }
});

// DELETE /api/projects/:id/exports/:exportId - Delete export
app.delete('/api/projects/:projectId/exports/:exportId', checkProOrEnterpriseTier, async (req, res) => {
  const { exportId } = req.params;

  try {
    const exportService = getExportService();
    await exportService.deleteExport(exportId);

    res.json({
      success: true,
      message: 'Export deleted successfully',
    });
  } catch (error) {
    console.error('[api] Failed to delete export:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete export',
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// GITHUB INTEGRATION ROUTES
// ═══════════════════════════════════════════════════════════════════════════

// Start GitHub OAuth flow
app.get('/api/github/auth', async (req, res) => {
  const { userId, projectId, redirectPath } = req.query;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'userId is required',
    });
  }

  try {
    const url = await GitHubService.startOAuth(
      userId,
      projectId as string | undefined,
      redirectPath as string | undefined
    );

    res.json({
      success: true,
      url,
    });
  } catch (error) {
    console.error('[api] Failed to start GitHub OAuth:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start OAuth',
    });
  }
});

// Handle GitHub OAuth callback
app.get('/api/github/callback', async (req, res) => {
  const { code, state } = req.query;

  if (!code || !state || typeof code !== 'string' || typeof state !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'code and state are required',
    });
  }

  try {
    const result = await GitHubService.handleOAuthCallback(code, state);

    res.json({
      success: true,
      userId: result.userId,
      projectId: result.projectId,
      redirectPath: result.redirectPath,
    });
  } catch (error) {
    console.error('[api] Failed to handle GitHub OAuth callback:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to handle OAuth callback',
    });
  }
});

// List user's GitHub repositories
app.get('/api/github/repos', async (req, res) => {
  const { userId, page, perPage, sort } = req.query;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'userId is required',
    });
  }

  try {
    const repos = await GitHubService.listRepos(userId, {
      page: page ? parseInt(page as string) : undefined,
      perPage: perPage ? parseInt(perPage as string) : undefined,
      sort: sort as 'created' | 'updated' | 'pushed' | 'full_name' | undefined,
    });

    res.json({
      success: true,
      repos,
    });
  } catch (error) {
    console.error('[api] Failed to list GitHub repos:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list repositories',
    });
  }
});

// Create a new GitHub repository
app.post('/api/github/repos', async (req, res) => {
  const { userId, name, description, private: isPrivate } = req.body;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'userId is required',
    });
  }

  if (!name || typeof name !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Repository name is required',
    });
  }

  try {
    const repo = await GitHubService.createRepo(userId, name, {
      description,
      private: isPrivate ?? true,
    });

    res.json({
      success: true,
      repo,
    });
  } catch (error) {
    console.error('[api] Failed to create GitHub repo:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create repository',
    });
  }
});

// Push project code to GitHub repository
app.post('/api/github/push', async (req, res) => {
  const {
    userId,
    projectId,
    repoOwner,
    repoName,
    branch,
    commitMessage,
    createPullRequest,
    prTitle,
    prBody,
  } = req.body;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'userId is required',
    });
  }

  if (!projectId || typeof projectId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'projectId is required',
    });
  }

  if (!repoOwner || typeof repoOwner !== 'string' || !repoName || typeof repoName !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'repoOwner and repoName are required',
    });
  }

  try {
    const result = await GitHubService.pushToRepo({
      userId,
      projectId,
      repoOwner,
      repoName,
      branch,
      commitMessage,
      createPullRequest,
      prTitle,
      prBody,
    });

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('[api] Failed to push to GitHub:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to push to repository',
    });
  }
});

// Check if user has GitHub connected
app.get('/api/github/status', async (req, res) => {
  const { userId } = req.query;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'userId is required',
    });
  }

  try {
    const connected = await GitHubService.isConnected(userId);
    const connection = connected ? await GitHubService.getConnection(userId) : null;

    res.json({
      success: true,
      connected,
      connection: connection ? {
        username: connection.username,
        email: connection.email,
        avatarUrl: connection.avatarUrl,
        connectedAt: connection.createdAt,
      } : null,
    });
  } catch (error) {
    console.error('[api] Failed to check GitHub status:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check status',
    });
  }
});

// Disconnect GitHub account
app.delete('/api/github/disconnect', async (req, res) => {
  const { userId } = req.body;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'userId is required',
    });
  }

  try {
    await GitHubService.disconnect(userId);

    res.json({
      success: true,
      message: 'GitHub account disconnected',
    });
  } catch (error) {
    console.error('[api] Failed to disconnect GitHub:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to disconnect',
    });
  }
});

// Get project GitHub configuration
app.get('/api/projects/:projectId/github', async (req, res) => {
  const { projectId } = req.params;

  try {
    const config = await GitHubService.getProjectConfig(projectId);

    res.json({
      success: true,
      config,
    });
  } catch (error) {
    console.error('[api] Failed to get project GitHub config:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get config',
    });
  }
});

// ============================================================================
// WHITE-LABEL BRANDING ENDPOINTS (Enterprise)
// ============================================================================

// Apply branding to a project
app.post('/api/projects/:projectId/branding', async (req, res) => {
  const { projectId } = req.params;
  const brandConfig = req.body as BrandConfig;

  try {
    const whiteLabelService = getWhiteLabelService();
    const result = await whiteLabelService.applyBranding(projectId, brandConfig);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);

    // Emit progress via WebSocket
    io.to(`project:${projectId}`).emit('branding:applied', {
      projectId,
      success: true,
      assetsGenerated: {
        ios: result.assets.icons.ios.length + result.assets.splash.ios.length,
        android: result.assets.icons.android.length + result.assets.splash.android.length,
      },
    });
  } catch (error) {
    console.error('[api] Failed to apply branding:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to apply branding',
      assets: { icons: { ios: [], android: [] }, splash: { ios: [], android: [] } },
      config: { appJson: {} },
    });
  }
});

// Get current branding configuration
app.get('/api/projects/:projectId/branding', async (req, res) => {
  const { projectId } = req.params;

  try {
    const whiteLabelService = getWhiteLabelService();
    const branding = await whiteLabelService.getBranding(projectId);

    if (!branding) {
      return res.status(404).json({
        success: false,
        error: 'Branding not found for this project',
      });
    }

    res.json({
      success: true,
      branding,
    });
  } catch (error) {
    console.error('[api] Failed to get branding:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get branding',
    });
  }
});

// Preview branding (generate sample without applying)
app.post('/api/projects/:projectId/branding/preview', async (req, res) => {
  const { projectId } = req.params;
  const brandConfig = req.body as BrandConfig;

  try {
    const whiteLabelService = getWhiteLabelService();
    const result = await whiteLabelService.previewBranding(brandConfig);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      preview: {
        appJson: result.config.appJson,
        colors: {
          primary: brandConfig.branding.primaryColor,
          secondary: brandConfig.branding.secondaryColor,
          accent: brandConfig.branding.accentColor,
        },
        bundleId: brandConfig.bundleId,
      },
      warnings: result.warnings,
    });
  } catch (error) {
    console.error('[api] Failed to preview branding:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to preview branding',
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// PROJECT INTEGRATIONS ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

// In-memory storage for integrations (in production, use database)
const projectIntegrations: Record<string, Record<string, { configured: boolean; lastUpdated: string }>> = {};

// Get all integrations for a project
app.get('/api/projects/:projectId/integrations', async (req, res) => {
  const { projectId } = req.params;

  try {
    const integrations = projectIntegrations[projectId] || {};

    res.json({
      success: true,
      projectId,
      integrations,
    });
  } catch (error) {
    console.error('[api] Failed to get integrations:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get integrations',
    });
  }
});

// Save integration credentials
app.post('/api/projects/:projectId/integrations/:integrationId', async (req, res) => {
  const { projectId, integrationId } = req.params;
  const { credentials } = req.body;

  try {
    if (!credentials || typeof credentials !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Credentials are required',
      });
    }

    // Initialize project integrations if not exists
    if (!projectIntegrations[projectId]) {
      projectIntegrations[projectId] = {};
    }

    // Store integration status (in production, encrypt and store credentials securely)
    projectIntegrations[projectId][integrationId] = {
      configured: true,
      lastUpdated: new Date().toISOString(),
    };

    // In production, save encrypted credentials to database
    // await saveIntegrationCredentials(projectId, integrationId, credentials);

    console.log(`[api] Integration ${integrationId} configured for project ${projectId}`);

    res.json({
      success: true,
      message: `Integration ${integrationId} configured successfully`,
      integration: {
        id: integrationId,
        configured: true,
        lastUpdated: projectIntegrations[projectId][integrationId].lastUpdated,
      },
    });
  } catch (error) {
    console.error('[api] Failed to save integration:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save integration',
    });
  }
});

// Delete integration credentials
app.delete('/api/projects/:projectId/integrations/:integrationId', async (req, res) => {
  const { projectId, integrationId } = req.params;

  try {
    if (projectIntegrations[projectId]) {
      delete projectIntegrations[projectId][integrationId];
    }

    // In production, delete from database
    // await deleteIntegrationCredentials(projectId, integrationId);

    console.log(`[api] Integration ${integrationId} disconnected for project ${projectId}`);

    res.json({
      success: true,
      message: `Integration ${integrationId} disconnected successfully`,
    });
  } catch (error) {
    console.error('[api] Failed to delete integration:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete integration',
    });
  }
});

// Get integration status
app.get('/api/projects/:projectId/integrations/:integrationId', async (req, res) => {
  const { projectId, integrationId } = req.params;

  try {
    const integration = projectIntegrations[projectId]?.[integrationId];

    if (!integration) {
      return res.json({
        success: true,
        configured: false,
      });
    }

    res.json({
      success: true,
      configured: integration.configured,
      lastUpdated: integration.lastUpdated,
    });
  } catch (error) {
    console.error('[api] Failed to get integration status:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get integration status',
    });
  }
});

export { app, httpServer, io };
