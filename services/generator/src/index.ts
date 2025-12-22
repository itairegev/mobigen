import dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load .env from mobigen root (two levels up from services/generator)
const envPath = path.resolve(__dirname, '../../../.env');
const envResult = dotenv.config({ path: envPath });

// Also try alternate paths
if (envResult.error) {
  dotenv.config({ path: '../../.env' });
  dotenv.config({ path: '../../../.env' });
  dotenv.config(); // Try default .env in cwd
}

import { httpServer } from './api';

const PORT = process.env.GENERATOR_PORT || process.env.PORT || 4000;

// Startup diagnostics
function printStartupDiagnostics(): void {
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║           MOBIGEN GENERATOR SERVICE - STARTUP                    ║');
  console.log('╠══════════════════════════════════════════════════════════════════╣');

  // Environment
  console.log('║ Environment:');
  console.log(`║   NODE_ENV:            ${process.env.NODE_ENV || 'development'}`);
  console.log(`║   CWD:                 ${process.cwd()}`);
  console.log(`║   __dirname:           ${__dirname}`);
  console.log(`║   .env path:           ${envPath}`);
  console.log(`║   .env exists:         ${fs.existsSync(envPath)}`);

  // AI Configuration
  console.log('╠──────────────────────────────────────────────────────────────────╣');
  console.log('║ AI Configuration:');
  const aiProvider = process.env.AI_PROVIDER || 'bedrock (default)';
  console.log(`║   AI_PROVIDER:         ${aiProvider}`);

  if (process.env.AI_PROVIDER === 'anthropic' || !process.env.AI_PROVIDER) {
    const hasKey = !!process.env.ANTHROPIC_API_KEY;
    const keyPreview = hasKey ? process.env.ANTHROPIC_API_KEY!.substring(0, 12) + '...' : 'NOT SET';
    console.log(`║   ANTHROPIC_API_KEY:   ${keyPreview}`);
    if (!hasKey && process.env.AI_PROVIDER === 'anthropic') {
      console.log('║   ⚠️  WARNING: ANTHROPIC_API_KEY required when AI_PROVIDER=anthropic');
    }
  }

  if (process.env.AI_PROVIDER === 'bedrock' || !process.env.AI_PROVIDER) {
    console.log(`║   AWS_REGION:          ${process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1 (default)'}`);
    console.log(`║   AWS_ACCESS_KEY_ID:   ${process.env.AWS_ACCESS_KEY_ID ? '***configured***' : 'NOT SET (using credential chain)'}`);
  }

  // Debug settings
  console.log('╠──────────────────────────────────────────────────────────────────╣');
  console.log('║ Debug Settings:');
  console.log(`║   CLAUDE_SDK_VERBOSE:  ${process.env.CLAUDE_SDK_VERBOSE || 'false'}`);
  console.log(`║   GENERATOR_DEBUG:     ${process.env.GENERATOR_DEBUG || 'false'}`);
  console.log(`║   LOG_LEVEL:           ${process.env.LOG_LEVEL || 'info'}`);

  // Template paths
  console.log('╠──────────────────────────────────────────────────────────────────╣');
  console.log('║ Paths:');
  console.log(`║   MOBIGEN_ROOT:        ${process.env.MOBIGEN_ROOT || 'auto-detected'}`);

  // Check for templates
  const possibleRoots = [
    process.env.MOBIGEN_ROOT,
    process.cwd(),
    path.resolve(process.cwd(), '..'),
    path.resolve(process.cwd(), '../..'),
  ].filter(Boolean) as string[];

  let foundTemplates = false;
  for (const root of possibleRoots) {
    const templatesPath = path.join(root, 'templates-bare');
    if (fs.existsSync(templatesPath)) {
      console.log(`║   Templates found at:  ${templatesPath}`);
      foundTemplates = true;

      // List available templates
      try {
        const templates = fs.readdirSync(templatesPath)
          .filter(f => f.endsWith('.git'))
          .map(f => f.replace('.git', ''));
        console.log(`║   Available templates: ${templates.join(', ')}`);
      } catch (e) {
        // ignore
      }
      break;
    }
  }

  if (!foundTemplates) {
    console.log('║   ⚠️  WARNING: templates-bare directory not found!');
    console.log('║   Searched in:', possibleRoots.join(', '));
  }

  console.log('╠──────────────────────────────────────────────────────────────────╣');
  console.log(`║ Service URL: http://localhost:${PORT}`);
  console.log(`║ Health check: http://localhost:${PORT}/api/health`);
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log('\n');
}

httpServer.listen(PORT, () => {
  printStartupDiagnostics();
  console.log(`Generator service running on port ${PORT}`);
  console.log(`WebSocket server ready for connections`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
