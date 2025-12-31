import express, { Express } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import archiver from 'archiver';
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
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// Store active project connections
const projectSockets = new Map<string, Set<string>>();

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('subscribe', (projectId: string) => {
    socket.join(`project:${projectId}`);
    const sockets = projectSockets.get(projectId) || new Set();
    sockets.add(socket.id);
    projectSockets.set(projectId, sockets);
    console.log(`Socket ${socket.id} subscribed to project ${projectId}`);
  });

  socket.on('unsubscribe', (projectId: string) => {
    socket.leave(`project:${projectId}`);
    const sockets = projectSockets.get(projectId);
    if (sockets) {
      sockets.delete(socket.id);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    // Clean up from all project subscriptions
    projectSockets.forEach((sockets, projectId) => {
      sockets.delete(socket.id);
    });
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

// Download project as ZIP
app.get('/api/projects/:projectId/download', async (req, res) => {
  const { projectId } = req.params;
  const projectPath = getProjectPath(projectId);

  if (!fs.existsSync(projectPath)) {
    return res.status(404).json({
      success: false,
      error: 'Project not found',
      projectId,
      path: projectPath,
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

export { app, httpServer, io };
