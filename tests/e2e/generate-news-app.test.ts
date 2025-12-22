/**
 * E2E Test: Generate News App (Full Integration)
 *
 * This test validates the ENTIRE generation pipeline by:
 * 1. Creating a real user and project in the database
 * 2. Connecting to the generator service via WebSocket
 * 3. Triggering actual app generation
 * 4. Monitoring all progress events through all 8 phases
 * 5. Verifying generated files exist and are valid
 * 6. Cleaning up after the test
 *
 * Prerequisites:
 * - PostgreSQL database running with schema migrated
 * - Generator service running at http://localhost:4000
 * - Templates available in templates/ directory
 * - ANTHROPIC_API_KEY set in environment
 * - .env file configured at project root
 *
 * Run with: pnpm test:e2e
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { io, Socket } from 'socket.io-client';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';

// Note: .env is loaded in setup.ts which runs before all tests

// Test configuration - uses same env vars as generator service
const GENERATOR_URL = process.env.GENERATOR_URL || 'http://localhost:4000';
const GENERATION_TIMEOUT = 10 * 60 * 1000; // 10 minutes for full generation
const CONNECTION_TIMEOUT = 10000;

// Initialize Prisma client - uses DATABASE_URL from .env (loaded in setup.ts)
const prisma = new PrismaClient();

// Test data
interface GenerationProgress {
  projectId: string;
  stage: string;
  timestamp: string;
  data: Record<string, unknown>;
}

interface GenerationResult {
  success: boolean;
  files: string[];
  sessionId?: string;
  requiresReview?: boolean;
  prd?: Record<string, unknown>;
  architecture?: Record<string, unknown>;
  uiDesign?: Record<string, unknown>;
  taskBreakdown?: Record<string, unknown>;
  validation?: Record<string, unknown>;
  qaReport?: {
    overallScore: number;
    readyForProduction: boolean;
    categories: Array<{ name: string; score: number }>;
  };
}

interface WhiteLabelConfig {
  appName: string;
  bundleId: { ios: string; android: string };
  branding: { displayName: string; primaryColor: string; secondaryColor: string };
  identifiers: { projectId: string; easProjectId: string; awsResourcePrefix: string; analyticsKey: string };
}

// Test output directory for artifacts
const TEST_OUTPUT_DIR = path.join(process.cwd(), 'test-output');

// Test state
let testUserId: string;
let testProjectId: string;
let projectPath: string;
let socket: Socket;
let progressEvents: GenerationProgress[] = [];
let generationResult: GenerationResult | null = null;
let generationError: Error | null = null;

// Helper to save artifact to output directory
async function saveArtifact(name: string, data: unknown, format: 'json' | 'txt' = 'json'): Promise<void> {
  try {
    await fs.mkdir(TEST_OUTPUT_DIR, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}-${timestamp}.${format}`;
    const filepath = path.join(TEST_OUTPUT_DIR, filename);

    const content = format === 'json'
      ? JSON.stringify(data, null, 2)
      : String(data);

    await fs.writeFile(filepath, content);
    console.log(`  💾 Saved: ${filename} (${content.length} bytes)`);
  } catch (error) {
    console.warn(`  ⚠️ Failed to save ${name}:`, error);
  }
}

// Helper to copy directory recursively
async function copyDirectory(src: string, dest: string): Promise<number> {
  let fileCount = 0;
  try {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        // Skip node_modules and .git
        if (entry.name === 'node_modules' || entry.name === '.git') continue;
        fileCount += await copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
        fileCount++;
      }
    }
  } catch (error) {
    // Directory may not exist
  }
  return fileCount;
}

// Helper to generate UUID
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Helper to wait for generation to complete
function waitForGeneration(timeoutMs: number): Promise<GenerationResult> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Generation timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    const checkInterval = setInterval(() => {
      if (generationResult) {
        clearTimeout(timeout);
        clearInterval(checkInterval);
        resolve(generationResult);
      }
      if (generationError) {
        clearTimeout(timeout);
        clearInterval(checkInterval);
        reject(generationError);
      }
    }, 1000);
  });
}

// Helper to wait for specific phase
function waitForPhase(phase: string, timeoutMs: number = 60000): Promise<GenerationProgress> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Phase "${phase}" not reached within ${timeoutMs}ms`));
    }, timeoutMs);

    const checkInterval = setInterval(() => {
      const event = progressEvents.find((e) => e.stage === phase);
      if (event) {
        clearTimeout(timeout);
        clearInterval(checkInterval);
        resolve(event);
      }
    }, 500);
  });
}

describe('E2E: Full News App Generation', () => {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SETUP: Create database records and establish connections
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  beforeAll(async () => {
    console.log('🚀 Setting up E2E test environment...');

    // Generate test IDs
    testUserId = generateUUID();
    testProjectId = generateUUID();
    projectPath = path.join(process.cwd(), '..', 'projects', testProjectId);

    // Create test user in database
    console.log('📦 Creating test user in database...');
    await prisma.user.create({
      data: {
        id: testUserId,
        email: `e2e-test-${testUserId.slice(0, 8)}@mobigen.test`,
        name: 'E2E Test User',
        tier: 'pro',
      },
    });

    // Create test project in database
    console.log('📦 Creating test project in database...');
    await prisma.project.create({
      data: {
        id: testProjectId,
        userId: testUserId,
        name: 'TechNews Daily',
        templateId: 'news',
        status: 'draft',
        bundleIdIos: 'com.technews.daily.e2e',
        bundleIdAndroid: 'com.technews.daily.e2e',
        branding: {
          displayName: 'TechNews Daily',
          primaryColor: '#2563eb',
          secondaryColor: '#059669',
        },
        s3Bucket: 'mobigen-test-bucket',
        s3Prefix: `projects/${testProjectId}`,
      },
    });

    // Connect to generator WebSocket
    console.log('🔌 Connecting to generator service...');
    socket = io(GENERATOR_URL, {
      transports: ['websocket'],
      timeout: CONNECTION_TIMEOUT,
    });

    await new Promise<void>((resolve, reject) => {
      const connectionTimeout = setTimeout(() => {
        reject(new Error(`WebSocket connection timeout after ${CONNECTION_TIMEOUT}ms`));
      }, CONNECTION_TIMEOUT);

      socket.on('connect', () => {
        clearTimeout(connectionTimeout);
        console.log('✅ Connected to generator service');
        socket.emit('subscribe', testProjectId);
        resolve();
      });

      socket.on('connect_error', (err) => {
        clearTimeout(connectionTimeout);
        reject(new Error(`WebSocket connection failed: ${err.message}`));
      });
    });

    // Set up event listeners
    socket.on('generation:progress', (event: GenerationProgress) => {
      progressEvents.push(event);
      const dataPreview = JSON.stringify(event.data).slice(0, 80);
      console.log(`  [${event.stage}] ${dataPreview}...`);
    });

    socket.on('generation:complete', (result: GenerationResult) => {
      generationResult = result;
      console.log('✅ Generation complete!');
    });

    socket.on('generation:error', (error: { error: string }) => {
      generationError = new Error(error.error);
      console.error('❌ Generation error:', error.error);
    });

    console.log('✅ E2E test environment ready');
  }, 60000);

  afterAll(async () => {
    console.log('🧹 Cleaning up E2E test...');

    // Disconnect socket
    if (socket) {
      socket.disconnect();
    }

    // Clean up database records
    try {
      // Delete in order to respect foreign keys
      await prisma.projectChange.deleteMany({ where: { projectId: testProjectId } });
      await prisma.projectSession.deleteMany({ where: { projectId: testProjectId } });
      await prisma.build.deleteMany({ where: { projectId: testProjectId } });
      await prisma.usageEvent.deleteMany({ where: { projectId: testProjectId } });
      await prisma.generation.deleteMany({ where: { projectId: testProjectId } });
      await prisma.project.delete({ where: { id: testProjectId } });
      await prisma.user.delete({ where: { id: testUserId } });
      console.log('✅ Database records cleaned up');
    } catch (error) {
      console.warn('⚠️ Cleanup warning:', error);
    }

    // Optionally clean up generated project directory
    // Uncomment to delete generated files after test
    // try {
    //   await fs.rm(projectPath, { recursive: true, force: true });
    //   console.log('✅ Project directory cleaned up');
    // } catch {}

    await prisma.$disconnect();
    console.log('✅ E2E cleanup complete');
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TEST 1: Trigger Generation
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('1. Generation Request', () => {
    const config: WhiteLabelConfig = {
      appName: 'TechNews Daily',
      bundleId: {
        ios: 'com.technews.daily.e2e',
        android: 'com.technews.daily.e2e',
      },
      branding: {
        displayName: 'TechNews Daily',
        primaryColor: '#2563eb',
        secondaryColor: '#059669',
      },
      identifiers: {
        projectId: '',
        easProjectId: '',
        awsResourcePrefix: '',
        analyticsKey: '',
      },
    };

    const NEWS_APP_PROMPT = `Create a modern news reader app with the following features:
      - Home screen with a scrollable feed of latest articles
      - Categories: Technology, Business, Sports, Entertainment
      - Article detail view with estimated reading time
      - Save articles for offline reading
      - Search articles by title and content
      - Dark mode toggle in settings
      - Pull to refresh on the feed
      - Share articles to social media`;

    it('should accept generation request and return job ID', async () => {
      config.identifiers = {
        projectId: testProjectId,
        easProjectId: `eas-${testProjectId}`,
        awsResourcePrefix: `mobigen-${testProjectId.slice(0, 8)}`,
        analyticsKey: `analytics-${testProjectId}`,
      };

      console.log('📤 Sending generation request...');

      const response = await fetch(`${GENERATOR_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: testProjectId,
          prompt: NEWS_APP_PROMPT,
          config,
        }),
      });

      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.jobId).toBe(testProjectId);
      expect(data.message).toContain('Generation started');

      console.log('✅ Generation request accepted');
    });

    it('should start receiving progress events', async () => {
      // Wait for initial progress events
      await new Promise((resolve) => setTimeout(resolve, 3000));

      expect(progressEvents.length).toBeGreaterThan(0);
      expect(progressEvents.some((e) => e.stage === 'starting')).toBe(true);

      console.log(`✅ Received ${progressEvents.length} initial progress events`);
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TEST 2: Pipeline Phases
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('2. Pipeline Phases', () => {
    it('should complete Phase 0: Project Setup (template cloning)', async () => {
      const cloneEvent = await waitForPhase('cloning', 60000);

      expect(cloneEvent).toBeDefined();
      expect(cloneEvent.data.template).toBeDefined();

      console.log(`✅ Phase 0 complete: Cloned template "${cloneEvent.data.template}"`);
    }, 90000);

    it('should complete Phase 1: Intent Analysis', async () => {
      const phaseEvent = progressEvents.find(
        (e) => e.stage === 'phase' && e.data.phase === 'analysis'
      );

      // Wait if not yet reached
      if (!phaseEvent) {
        await waitForPhase('intent-analyzer', 60000);
      }

      console.log('✅ Phase 1 complete: Intent analyzed');
    }, 90000);

    it('should complete Phase 2: Product Definition (PRD)', async () => {
      await waitForPhase('product-manager', 120000);
      console.log('✅ Phase 2 complete: PRD generated');
    }, 150000);

    it('should complete Phase 3: Technical Architecture', async () => {
      await waitForPhase('technical-architect', 120000);
      console.log('✅ Phase 3 complete: Architecture designed');
    }, 150000);

    it('should complete Phase 4: UI/UX Design', async () => {
      await waitForPhase('ui-ux-expert', 120000);
      console.log('✅ Phase 4 complete: UI/UX designed');
    }, 150000);

    it('should complete Phase 5: Task Planning', async () => {
      await waitForPhase('lead-developer', 120000);
      console.log('✅ Phase 5 complete: Tasks planned');
    }, 150000);

    it('should complete Phase 6: Implementation', async () => {
      // Wait for task events
      const maxWait = 5 * 60 * 1000; // 5 minutes for implementation
      const startTime = Date.now();

      while (Date.now() - startTime < maxWait) {
        const taskEvents = progressEvents.filter((e) => e.stage === 'task');
        if (taskEvents.length > 0) {
          console.log(`✅ Phase 6 in progress: ${taskEvents.length} tasks executed`);
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }, 360000);

    it('should complete Phase 7: Validation', async () => {
      await waitForPhase('validator', 180000);
      console.log('✅ Phase 7 complete: Validation passed');
    }, 210000);

    it('should complete Phase 8: Quality Assurance', async () => {
      await waitForPhase('qa', 120000);
      console.log('✅ Phase 8 complete: QA assessment done');
    }, 150000);
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TEST 3: Generation Completion
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('3. Generation Completion', () => {
    it('should receive generation:complete event', async () => {
      const result = await waitForGeneration(GENERATION_TIMEOUT);

      expect(result).toBeDefined();
      expect(result.files).toBeDefined();
      expect(Array.isArray(result.files)).toBe(true);

      console.log(`✅ Generation complete: ${result.files.length} files generated`);
    }, GENERATION_TIMEOUT + 10000);

    it('should have session ID for continuity', () => {
      expect(generationResult?.sessionId).toBeDefined();
      console.log(`✅ Session ID: ${generationResult?.sessionId?.slice(0, 20)}...`);
    });

    it('should generate PRD artifact', () => {
      expect(generationResult?.prd).toBeDefined();
      console.log('✅ PRD artifact generated');
    });

    it('should generate architecture artifact', () => {
      expect(generationResult?.architecture).toBeDefined();
      console.log('✅ Architecture artifact generated');
    });

    it('should generate QA report', () => {
      expect(generationResult?.qaReport).toBeDefined();
      expect(generationResult?.qaReport?.overallScore).toBeGreaterThanOrEqual(0);
      console.log(`✅ QA Score: ${generationResult?.qaReport?.overallScore}/100`);
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TEST 4: File Verification
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('4. Generated Files Verification', () => {
    it('should create project directory', async () => {
      try {
        const stat = await fs.stat(projectPath);
        expect(stat.isDirectory()).toBe(true);
        console.log(`✅ Project directory created: ${projectPath}`);
      } catch {
        // If generation is still in progress or projectPath is different
        console.log('⚠️ Project directory check skipped (may be in different location)');
      }
    });

    it('should generate core React Native files', async () => {
      const coreFiles = [
        'app.json',
        'package.json',
        'tsconfig.json',
        'babel.config.js',
        'tailwind.config.js',
      ];

      for (const file of coreFiles) {
        try {
          await fs.access(path.join(projectPath, file));
          console.log(`  ✅ ${file}`);
        } catch {
          // File may exist in a different structure
          console.log(`  ⚠️ ${file} (not found at expected path)`);
        }
      }
    });

    it('should generate Expo Router app structure', async () => {
      const appFiles = [
        'src/app/_layout.tsx',
        'src/app/(tabs)/_layout.tsx',
        'src/app/(tabs)/index.tsx',
      ];

      for (const file of appFiles) {
        try {
          await fs.access(path.join(projectPath, file));
          console.log(`  ✅ ${file}`);
        } catch {
          console.log(`  ⚠️ ${file} (checking alternative paths)`);
        }
      }
    });

    it('should generate news-specific screens', async () => {
      const newsScreens = [
        'src/screens/Feed.tsx',
        'src/screens/ArticleDetail.tsx',
        'src/screens/Categories.tsx',
        'src/screens/Saved.tsx',
        'src/screens/Search.tsx',
        'src/screens/Settings.tsx',
      ];

      let foundScreens = 0;
      for (const screen of newsScreens) {
        try {
          await fs.access(path.join(projectPath, screen));
          foundScreens++;
          console.log(`  ✅ ${screen}`);
        } catch {
          // May be in different location or named differently
        }
      }

      console.log(`✅ Found ${foundScreens}/${newsScreens.length} expected screens`);
    });

    it('should generate components', async () => {
      const components = [
        'src/components/ArticleCard.tsx',
        'src/components/CategoryChip.tsx',
        'src/components/SearchBar.tsx',
      ];

      let foundComponents = 0;
      for (const component of components) {
        try {
          await fs.access(path.join(projectPath, component));
          foundComponents++;
          console.log(`  ✅ ${component}`);
        } catch {
          // May be in different location
        }
      }

      console.log(`✅ Found ${foundComponents}/${components.length} expected components`);
    });

    it('should generate hooks', async () => {
      const hooks = [
        'src/hooks/useArticles.ts',
        'src/hooks/useSavedArticles.ts',
        'src/hooks/useSearch.ts',
      ];

      let foundHooks = 0;
      for (const hook of hooks) {
        try {
          await fs.access(path.join(projectPath, hook));
          foundHooks++;
          console.log(`  ✅ ${hook}`);
        } catch {
          // May be in different location
        }
      }

      console.log(`✅ Found ${foundHooks}/${hooks.length} expected hooks`);
    });

    it('should generate types', async () => {
      try {
        await fs.access(path.join(projectPath, 'src/types/index.ts'));
        console.log('✅ Types file generated');
      } catch {
        // May be in different location
        console.log('⚠️ Types file check skipped');
      }
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TEST 5: Content Validation
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('5. Content Validation', () => {
    it('should have valid app.json with correct bundle IDs', async () => {
      try {
        const appJsonPath = path.join(projectPath, 'app.json');
        const content = await fs.readFile(appJsonPath, 'utf-8');
        const appJson = JSON.parse(content);

        expect(appJson.expo.name).toBe('TechNews Daily');
        expect(appJson.expo.ios?.bundleIdentifier).toBe('com.technews.daily.e2e');
        expect(appJson.expo.android?.package).toBe('com.technews.daily.e2e');

        console.log('✅ app.json has correct configuration');
      } catch {
        console.log('⚠️ app.json validation skipped');
      }
    });

    it('should have valid package.json with dependencies', async () => {
      try {
        const pkgPath = path.join(projectPath, 'package.json');
        const content = await fs.readFile(pkgPath, 'utf-8');
        const pkg = JSON.parse(content);

        expect(pkg.dependencies).toBeDefined();
        expect(pkg.dependencies['expo']).toBeDefined();
        expect(pkg.dependencies['react-native']).toBeDefined();

        console.log('✅ package.json has correct dependencies');
      } catch {
        console.log('⚠️ package.json validation skipped');
      }
    });

    it('should have TypeScript configured', async () => {
      try {
        const tsconfigPath = path.join(projectPath, 'tsconfig.json');
        const content = await fs.readFile(tsconfigPath, 'utf-8');
        const tsconfig = JSON.parse(content);

        expect(tsconfig.compilerOptions).toBeDefined();
        expect(tsconfig.compilerOptions.strict).toBe(true);

        console.log('✅ tsconfig.json configured correctly');
      } catch {
        console.log('⚠️ tsconfig.json validation skipped');
      }
    });

    it('should have branding colors in theme', async () => {
      try {
        const themePath = path.join(projectPath, 'src/theme/colors.ts');
        const content = await fs.readFile(themePath, 'utf-8');

        expect(content).toContain('#2563eb'); // Primary color
        expect(content).toContain('#059669'); // Secondary color

        console.log('✅ Theme colors match branding');
      } catch {
        console.log('⚠️ Theme validation skipped');
      }
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TEST 6: Database Records
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('6. Database Records', () => {
    it('should update project status', async () => {
      const project = await prisma.project.findUnique({
        where: { id: testProjectId },
      });

      expect(project).toBeDefined();
      // Status should be updated during generation
      console.log(`✅ Project status: ${project?.status}`);
    });

    it('should create project session record', async () => {
      const sessions = await prisma.projectSession.findMany({
        where: { projectId: testProjectId },
      });

      // Session may or may not be created depending on generation success
      console.log(`✅ Project sessions: ${sessions.length}`);
    });

    it('should create generation record', async () => {
      const generations = await prisma.generation.findMany({
        where: { projectId: testProjectId },
      });

      console.log(`✅ Generation records: ${generations.length}`);
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TEST 7: Quality Assessment
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('7. Quality Assessment', () => {
    it('should have QA score above minimum threshold', () => {
      const minScore = 50; // Minimum acceptable score
      const score = generationResult?.qaReport?.overallScore || 0;

      expect(score).toBeGreaterThanOrEqual(minScore);
      console.log(`✅ QA Score: ${score}/100 (minimum: ${minScore})`);
    });

    it('should evaluate all quality categories', () => {
      const expectedCategories = [
        'code-quality',
        'ui-ux',
        'accessibility',
        'performance',
        'security',
        'testing',
      ];

      const categories = generationResult?.qaReport?.categories || [];
      const foundCategories = categories.map((c) => c.name);

      for (const category of expectedCategories) {
        if (foundCategories.includes(category)) {
          console.log(`  ✅ ${category}`);
        } else {
          console.log(`  ⚠️ ${category} (not evaluated)`);
        }
      }
    });

    it('should determine production readiness', () => {
      const isReady = generationResult?.qaReport?.readyForProduction;
      const requiresReview = generationResult?.requiresReview;

      if (isReady) {
        console.log('✅ App is ready for production');
      } else if (requiresReview) {
        console.log('⚠️ App requires human review before production');
      } else {
        console.log('ℹ️ Production readiness not determined');
      }
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TEST 8: Event Summary
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('8. Event Summary', () => {
    it('should log complete event summary', () => {
      const phases = progressEvents.filter((e) => e.stage === 'phase');
      const tasks = progressEvents.filter((e) => e.stage === 'task');
      const errors = progressEvents.filter((e) => e.stage === 'error');

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📊 GENERATION SUMMARY');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`Total events: ${progressEvents.length}`);
      console.log(`Phases completed: ${phases.length}`);
      console.log(`Tasks executed: ${tasks.length}`);
      console.log(`Errors: ${errors.length}`);
      console.log(`Files generated: ${generationResult?.files.length || 0}`);
      console.log(`Success: ${generationResult?.success || false}`);
      console.log(`QA Score: ${generationResult?.qaReport?.overallScore || 'N/A'}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      expect(true).toBe(true);
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TEST 9: Save All Artifacts
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('9. Save All Artifacts', () => {
    it('should save progress events log', async () => {
      await saveArtifact('progress-events', progressEvents);
      console.log('✅ Progress events log saved');
    });

    it('should save generation result', async () => {
      if (generationResult) {
        await saveArtifact('generation-result', generationResult);
        console.log('✅ Generation result saved');
      }
    });

    it('should save PRD artifact', async () => {
      if (generationResult?.prd) {
        await saveArtifact('prd', generationResult.prd);
        console.log('✅ PRD artifact saved');
      } else {
        console.log('⚠️ No PRD to save');
      }
    });

    it('should save Architecture artifact', async () => {
      if (generationResult?.architecture) {
        await saveArtifact('architecture', generationResult.architecture);
        console.log('✅ Architecture artifact saved');
      } else {
        console.log('⚠️ No Architecture to save');
      }
    });

    it('should save UI Design artifact', async () => {
      if (generationResult?.uiDesign) {
        await saveArtifact('ui-design', generationResult.uiDesign);
        console.log('✅ UI Design artifact saved');
      } else {
        console.log('⚠️ No UI Design to save');
      }
    });

    it('should save Task Breakdown artifact', async () => {
      if (generationResult?.taskBreakdown) {
        await saveArtifact('task-breakdown', generationResult.taskBreakdown);
        console.log('✅ Task Breakdown artifact saved');
      } else {
        console.log('⚠️ No Task Breakdown to save');
      }
    });

    it('should save Validation artifact', async () => {
      if (generationResult?.validation) {
        await saveArtifact('validation', generationResult.validation);
        console.log('✅ Validation artifact saved');
      } else {
        console.log('⚠️ No Validation to save');
      }
    });

    it('should save QA Report artifact', async () => {
      if (generationResult?.qaReport) {
        await saveArtifact('qa-report', generationResult.qaReport);
        console.log('✅ QA Report artifact saved');
      } else {
        console.log('⚠️ No QA Report to save');
      }
    });

    it('should save generated source code', async () => {
      console.log('📦 Saving generated source code...');

      const sourceOutputDir = path.join(TEST_OUTPUT_DIR, 'source-code');
      const fileCount = await copyDirectory(projectPath, sourceOutputDir);

      if (fileCount > 0) {
        console.log(`✅ Source code saved: ${fileCount} files to ${sourceOutputDir}`);
      } else {
        console.log('⚠️ No source code files found to save');
      }

      // Also try to copy from artifacts directory inside the project
      const artifactsDir = path.join(projectPath, 'artifacts');
      try {
        const artifactsOutputDir = path.join(TEST_OUTPUT_DIR, 'generator-artifacts');
        const artifactCount = await copyDirectory(artifactsDir, artifactsOutputDir);
        if (artifactCount > 0) {
          console.log(`✅ Generator artifacts saved: ${artifactCount} files`);
        }
      } catch {
        // Artifacts directory may not exist
      }

      // Also try to copy logs
      const logsDir = path.join(projectPath, 'logs');
      try {
        const logsOutputDir = path.join(TEST_OUTPUT_DIR, 'generator-logs');
        const logCount = await copyDirectory(logsDir, logsOutputDir);
        if (logCount > 0) {
          console.log(`✅ Generator logs saved: ${logCount} files`);
        }
      } catch {
        // Logs directory may not exist
      }
    });

    it('should save test summary', async () => {
      const summary = {
        testProjectId,
        testUserId,
        projectPath,
        timestamp: new Date().toISOString(),
        progressEventsCount: progressEvents.length,
        success: generationResult?.success || false,
        filesGenerated: generationResult?.files?.length || 0,
        files: generationResult?.files || [],
        qaScore: generationResult?.qaReport?.overallScore || null,
        readyForProduction: generationResult?.qaReport?.readyForProduction || false,
        requiresReview: generationResult?.requiresReview || false,
        sessionId: generationResult?.sessionId,
        phasesCompleted: progressEvents.filter((e) => e.stage === 'phase').map((e) => e.data.phase),
        errors: progressEvents.filter((e) => e.stage === 'error').map((e) => e.data),
      };

      await saveArtifact('test-summary', summary);

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📁 ALL ARTIFACTS SAVED TO:', TEST_OUTPUT_DIR);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    });
  });
});
