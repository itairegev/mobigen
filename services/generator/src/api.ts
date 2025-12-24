import express, { Express } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import archiver from 'archiver';
// Use the new AI-driven orchestrator by default
import { generateApp } from './ai-orchestrator';
// Legacy orchestrator available as fallback (set ORCHESTRATOR_MODE=legacy to use)
import { generateApp as generateAppLegacy } from './orchestrator';
import type { SDKMessage } from '@mobigen/ai';

// Select orchestrator based on environment variable
const useAIOrchestrator = process.env.ORCHESTRATOR_MODE !== 'legacy';
const orchestratorGenerateApp = useAIOrchestrator ? generateApp : generateAppLegacy;

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

    // Start generation in background (uses AI orchestrator by default)
    console.log(`[api] Using ${useAIOrchestrator ? 'AI-driven' : 'legacy'} orchestrator`);
    const resultPromise = orchestratorGenerateApp(
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

// Simple health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
      mode: useAIOrchestrator ? 'ai-driven' : 'legacy',
      description: useAIOrchestrator
        ? 'Dynamic agent orchestration with Task tool'
        : 'Hardcoded sequential agent pipeline',
      envVar: 'ORCHESTRATOR_MODE',
      currentValue: process.env.ORCHESTRATOR_MODE || 'ai-driven (default)',
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
    archive.on('error', (err) => {
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

// Get preview URL (Expo Go QR code)
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

  // TODO: Start Expo dev server and return QR code URL
  // For now, return instructions for manual preview
  res.json({
    success: true,
    message: 'Preview instructions generated',
    projectId,
    appConfig: appConfig.expo || appConfig,
    instructions: {
      steps: [
        `1. cd ${projectPath}`,
        '2. npm install',
        '3. npx expo start',
        '4. Scan the QR code with Expo Go app',
      ],
      note: 'Automatic preview with QR code coming soon. For now, follow the manual steps above.',
      expoGoLinks: {
        ios: 'https://apps.apple.com/app/expo-go/id982107779',
        android: 'https://play.google.com/store/apps/details?id=host.exp.exponent',
      },
    },
  });
});

// Start Expo dev server for preview (background)
app.post('/api/projects/:projectId/preview/start', async (req, res) => {
  const { projectId } = req.params;
  const projectPath = getProjectPath(projectId);

  if (!fs.existsSync(projectPath)) {
    return res.status(404).json({
      success: false,
      error: 'Project not found',
    });
  }

  // TODO: Actually start Expo dev server
  res.json({
    success: true,
    message: 'Preview server starting...',
    projectId,
    status: 'pending',
    note: 'This feature is coming soon. Use manual preview for now.',
  });
});

export { app, httpServer, io };
