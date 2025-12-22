import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { z } from 'zod';
import { generateApp } from './orchestrator';
import type { SDKMessage } from '@mobigen/ai';

const app = express();
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

    // Start generation in background
    const resultPromise = generateApp(
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

export { app, httpServer, io };
