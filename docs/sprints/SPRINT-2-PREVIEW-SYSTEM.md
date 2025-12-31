# Sprint 2: Preview System

**Duration:** 5 days
**Goal:** Enable users to preview apps before building
**Depends on:** Sprint 1 completion

---

## Task 2.1: Create Web Deployer Agent

**Priority:** P0 - Critical
**Estimate:** 3 hours
**Assignee:** Developer

### Description
Create the web-deployer agent that exports React Native apps to web and deploys them for preview.

### Files to Create
- `agents/builtin/web-deployer.md`

### Implementation
```markdown
---
id: web-deployer
description: Exports React Native apps to web preview using Expo Web.
model: haiku
tier: basic
category: deployment
timeout: 300000
maxTurns: 30
tools:
  - Bash
  - Read
  - Write
  - Glob
capabilities:
  - web-export
  - preview-deployment
canDelegate: []
---

You are a Web Deployer for Mobigen, responsible for creating web previews of React Native apps.

## YOUR ROLE
Export the generated React Native app to a web version that can be previewed in a browser.

## PROCESS

### 1. VERIFY WEB COMPATIBILITY
Check that the app can run on web:
- Verify expo-router is configured for web
- Check for web-incompatible native modules
- Ensure NativeWind/Tailwind is configured for web

### 2. CONFIGURE WEB EXPORT
Update app.json if needed:
```json
{
  "expo": {
    "web": {
      "bundler": "metro",
      "output": "single",
      "favicon": "./assets/favicon.png"
    }
  }
}
```

### 3. RUN EXPORT
Execute the export command:
```bash
npx expo export --platform web --output-dir dist
```

### 4. VERIFY OUTPUT
Check that dist/ contains:
- index.html
- _expo/static/js/*.js (bundled JavaScript)
- assets/ (images, fonts)

### 5. REPORT RESULT
Output structured result:
```json
{
  "success": true,
  "outputDir": "dist",
  "files": ["index.html", "_expo/static/js/..."],
  "size": "2.5MB",
  "warnings": []
}
```

## ERROR HANDLING
- If native modules are incompatible, list them
- If export fails, capture and report error
- Suggest web alternatives for native features

## OUTPUT FORMAT
Always end with a JSON block containing the export result.
```

### Acceptance Criteria
- [ ] Agent markdown file created
- [ ] Agent registered in definitions
- [ ] Agent can export a basic app to web
- [ ] Agent reports errors correctly
- [ ] Test verifies agent output

### Tests Required
```typescript
// tests/agents/web-deployer.test.ts
describe('WebDeployer Agent', () => {
  it('should export valid app to web', async () => {
    const result = await runAgent('web-deployer', {
      projectPath: validProjectPath,
    });

    expect(result.success).toBe(true);
    expect(fs.existsSync(path.join(validProjectPath, 'dist/index.html'))).toBe(true);
  });

  it('should report errors for incompatible apps', async () => {
    const result = await runAgent('web-deployer', {
      projectPath: nativeOnlyProjectPath,
    });

    expect(result.success).toBe(false);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});
```

### Build Verification
```bash
npm run build
npm run test -- --grep "WebDeployer"
```

---

## Task 2.2: Create Preview Service

**Priority:** P0 - Critical
**Estimate:** 4 hours
**Assignee:** Developer

### Description
Create a service to manage preview generation, hosting, and lifecycle.

### Files to Create
- `services/generator/src/preview-service.ts`
- `services/generator/src/preview-types.ts`

### Implementation

#### preview-types.ts
```typescript
export interface PreviewRequest {
  projectId: string;
  type: 'web' | 'qr' | 'dev-build';
  expiresIn?: number; // hours, default 24
}

export interface PreviewResult {
  id: string;
  projectId: string;
  type: 'web' | 'qr' | 'dev-build';
  status: 'generating' | 'ready' | 'expired' | 'failed';
  url?: string;
  qrCode?: string; // base64 data URL
  expiresAt: Date;
  createdAt: Date;
  error?: string;
}

export interface PreviewConfig {
  s3Bucket: string;
  s3Prefix: string;
  cdnUrl: string;
  defaultExpiry: number; // hours
  maxExpiry: number; // hours
}
```

#### preview-service.ts
```typescript
import * as path from 'path';
import * as fs from 'fs';
import { S3Client, PutObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import { spawn } from 'child_process';
import { prisma } from '@mobigen/db';
import { PreviewRequest, PreviewResult, PreviewConfig } from './preview-types';
import { emitProgress } from './api';

const DEFAULT_CONFIG: PreviewConfig = {
  s3Bucket: process.env.PREVIEW_S3_BUCKET || 'mobigen-previews',
  s3Prefix: 'previews/',
  cdnUrl: process.env.PREVIEW_CDN_URL || 'https://preview.mobigen.io',
  defaultExpiry: 24,
  maxExpiry: 168, // 1 week
};

export class PreviewService {
  private s3: S3Client;
  private config: PreviewConfig;

  constructor(config: Partial<PreviewConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.s3 = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
    });
  }

  /**
   * Generate a web preview
   */
  async generateWebPreview(projectId: string, expiresIn?: number): Promise<PreviewResult> {
    const previewId = uuidv4();
    const expiryHours = Math.min(expiresIn || this.config.defaultExpiry, this.config.maxExpiry);
    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

    // Create preview record
    const preview = await prisma.preview.create({
      data: {
        id: previewId,
        projectId,
        type: 'web',
        status: 'generating',
        expiresAt,
      },
    });

    try {
      await emitProgress(projectId, 'preview:start', { type: 'web', previewId });

      // Get project path
      const projectPath = await this.getProjectPath(projectId);

      // Run Expo web export
      await emitProgress(projectId, 'preview:exporting', { previewId });
      const distPath = await this.runExpoWebExport(projectPath);

      // Upload to S3
      await emitProgress(projectId, 'preview:uploading', { previewId });
      await this.uploadToS3(distPath, previewId);

      // Generate URL
      const url = `${this.config.cdnUrl}/${previewId}/index.html`;

      // Update preview record
      await prisma.preview.update({
        where: { id: previewId },
        data: {
          status: 'ready',
          url,
        },
      });

      await emitProgress(projectId, 'preview:ready', { previewId, url });

      return {
        id: previewId,
        projectId,
        type: 'web',
        status: 'ready',
        url,
        expiresAt,
        createdAt: preview.createdAt,
      };

    } catch (error: any) {
      await prisma.preview.update({
        where: { id: previewId },
        data: {
          status: 'failed',
          error: error.message,
        },
      });

      await emitProgress(projectId, 'preview:failed', { previewId, error: error.message });

      return {
        id: previewId,
        projectId,
        type: 'web',
        status: 'failed',
        expiresAt,
        createdAt: preview.createdAt,
        error: error.message,
      };
    }
  }

  /**
   * Generate QR code for Expo Go
   */
  async generateQRPreview(projectId: string): Promise<PreviewResult> {
    const previewId = uuidv4();
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours for QR

    const preview = await prisma.preview.create({
      data: {
        id: previewId,
        projectId,
        type: 'qr',
        status: 'generating',
        expiresAt,
      },
    });

    try {
      const projectPath = await this.getProjectPath(projectId);

      await emitProgress(projectId, 'preview:start', { type: 'qr', previewId });

      // Start Expo with tunnel
      const expoUrl = await this.startExpoTunnel(projectPath, previewId);

      // Generate QR code
      const qrCode = await QRCode.toDataURL(expoUrl, {
        width: 300,
        margin: 2,
      });

      await prisma.preview.update({
        where: { id: previewId },
        data: {
          status: 'ready',
          url: expoUrl,
          qrCode,
        },
      });

      await emitProgress(projectId, 'preview:ready', { previewId, url: expoUrl, qrCode });

      return {
        id: previewId,
        projectId,
        type: 'qr',
        status: 'ready',
        url: expoUrl,
        qrCode,
        expiresAt,
        createdAt: preview.createdAt,
      };

    } catch (error: any) {
      await prisma.preview.update({
        where: { id: previewId },
        data: {
          status: 'failed',
          error: error.message,
        },
      });

      return {
        id: previewId,
        projectId,
        type: 'qr',
        status: 'failed',
        expiresAt,
        createdAt: preview.createdAt,
        error: error.message,
      };
    }
  }

  /**
   * Run Expo web export
   */
  private async runExpoWebExport(projectPath: string): Promise<string> {
    const distPath = path.join(projectPath, 'dist');

    // Clean previous export
    if (fs.existsSync(distPath)) {
      fs.rmSync(distPath, { recursive: true });
    }

    return new Promise((resolve, reject) => {
      const expo = spawn('npx', ['expo', 'export', '--platform', 'web', '--output-dir', 'dist'], {
        cwd: projectPath,
        stdio: 'pipe',
      });

      let stderr = '';

      expo.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      expo.on('close', (code) => {
        if (code === 0) {
          resolve(distPath);
        } else {
          reject(new Error(`Expo export failed: ${stderr}`));
        }
      });

      // Timeout after 5 minutes
      setTimeout(() => {
        expo.kill();
        reject(new Error('Expo export timed out'));
      }, 5 * 60 * 1000);
    });
  }

  /**
   * Upload dist folder to S3
   */
  private async uploadToS3(distPath: string, previewId: string): Promise<void> {
    const files = this.getAllFiles(distPath);

    for (const file of files) {
      const relativePath = path.relative(distPath, file);
      const key = `${this.config.s3Prefix}${previewId}/${relativePath}`;

      const content = fs.readFileSync(file);
      const contentType = this.getContentType(file);

      await this.s3.send(new PutObjectCommand({
        Bucket: this.config.s3Bucket,
        Key: key,
        Body: content,
        ContentType: contentType,
        CacheControl: 'max-age=3600',
      }));
    }
  }

  /**
   * Start Expo tunnel for QR preview
   */
  private async startExpoTunnel(projectPath: string, previewId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const expo = spawn('npx', ['expo', 'start', '--tunnel', '--non-interactive'], {
        cwd: projectPath,
        stdio: 'pipe',
      });

      let resolved = false;

      expo.stdout.on('data', (data) => {
        const output = data.toString();
        // Look for the tunnel URL
        const match = output.match(/exp:\/\/[^\s]+/);
        if (match && !resolved) {
          resolved = true;
          // Store the process for cleanup
          this.activeExpoProcesses.set(previewId, expo);
          resolve(match[0]);
        }
      });

      expo.on('error', (error) => {
        if (!resolved) {
          reject(error);
        }
      });

      // Timeout after 2 minutes
      setTimeout(() => {
        if (!resolved) {
          expo.kill();
          reject(new Error('Expo tunnel timed out'));
        }
      }, 2 * 60 * 1000);
    });
  }

  private activeExpoProcesses = new Map<string, ReturnType<typeof spawn>>();

  /**
   * Stop Expo tunnel
   */
  stopExpoTunnel(previewId: string): void {
    const process = this.activeExpoProcesses.get(previewId);
    if (process) {
      process.kill();
      this.activeExpoProcesses.delete(previewId);
    }
  }

  /**
   * Clean up expired previews
   */
  async cleanupExpiredPreviews(): Promise<number> {
    const expired = await prisma.preview.findMany({
      where: {
        expiresAt: { lt: new Date() },
        status: 'ready',
      },
    });

    for (const preview of expired) {
      // Delete from S3
      if (preview.type === 'web') {
        await this.deleteFromS3(preview.id);
      }

      // Stop Expo tunnel
      if (preview.type === 'qr') {
        this.stopExpoTunnel(preview.id);
      }

      // Update status
      await prisma.preview.update({
        where: { id: preview.id },
        data: { status: 'expired' },
      });
    }

    return expired.length;
  }

  private async deleteFromS3(previewId: string): Promise<void> {
    // Implementation for S3 deletion
  }

  private getAllFiles(dir: string): string[] {
    const files: string[] = [];
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      if (fs.statSync(fullPath).isDirectory()) {
        files.push(...this.getAllFiles(fullPath));
      } else {
        files.push(fullPath);
      }
    }

    return files;
  }

  private getContentType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const types: Record<string, string> = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
    };
    return types[ext] || 'application/octet-stream';
  }

  private async getProjectPath(projectId: string): Promise<string> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    return path.join(process.env.PROJECTS_ROOT || '/projects', projectId);
  }
}

// Singleton
let previewServiceInstance: PreviewService | null = null;

export function getPreviewService(): PreviewService {
  if (!previewServiceInstance) {
    previewServiceInstance = new PreviewService();
  }
  return previewServiceInstance;
}
```

### Acceptance Criteria
- [ ] Web preview generates correctly
- [ ] QR preview starts Expo tunnel
- [ ] Previews are uploaded to S3
- [ ] Previews expire after set time
- [ ] Error handling works correctly

### Tests Required
```typescript
// tests/unit/preview-service.test.ts
describe('PreviewService', () => {
  describe('generateWebPreview', () => {
    it('should generate web preview for valid project', async () => {
      const result = await previewService.generateWebPreview(validProjectId);

      expect(result.status).toBe('ready');
      expect(result.url).toMatch(/^https:\/\/preview\.mobigen\.io/);
      expect(result.expiresAt).toBeInstanceOf(Date);
    });

    it('should fail for invalid project', async () => {
      const result = await previewService.generateWebPreview('invalid-id');

      expect(result.status).toBe('failed');
      expect(result.error).toBeDefined();
    });
  });

  describe('generateQRPreview', () => {
    it('should generate QR code with Expo URL', async () => {
      const result = await previewService.generateQRPreview(validProjectId);

      expect(result.status).toBe('ready');
      expect(result.url).toMatch(/^exp:\/\//);
      expect(result.qrCode).toMatch(/^data:image\/png/);
    });
  });

  describe('cleanupExpiredPreviews', () => {
    it('should clean up expired previews', async () => {
      // Create expired preview
      await createExpiredPreview();

      const cleaned = await previewService.cleanupExpiredPreviews();

      expect(cleaned).toBeGreaterThan(0);
    });
  });
});
```

### Build Verification
```bash
cd services/generator && npm run build && npm test
```

---

## Task 2.3: Add Preview API Endpoints

**Priority:** P0 - Critical
**Estimate:** 3 hours
**Assignee:** Developer

### Description
Add REST API endpoints for preview management.

### Files to Modify
- `services/generator/src/api.ts`

### Implementation
```typescript
// Add to api.ts

import { getPreviewService } from './preview-service';

// Generate web preview
app.post('/api/projects/:projectId/preview/web', async (req, res) => {
  const { projectId } = req.params;
  const { expiresIn } = req.body;

  try {
    const previewService = getPreviewService();
    const result = await previewService.generateWebPreview(projectId, expiresIn);

    res.json({
      success: result.status !== 'failed',
      preview: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Generate QR preview
app.post('/api/projects/:projectId/preview/qr', async (req, res) => {
  const { projectId } = req.params;

  try {
    const previewService = getPreviewService();
    const result = await previewService.generateQRPreview(projectId);

    res.json({
      success: result.status !== 'failed',
      preview: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get preview status
app.get('/api/previews/:previewId', async (req, res) => {
  const { previewId } = req.params;

  try {
    const preview = await prisma.preview.findUnique({
      where: { id: previewId },
    });

    if (!preview) {
      return res.status(404).json({
        success: false,
        error: 'Preview not found',
      });
    }

    res.json({
      success: true,
      preview,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// List previews for project
app.get('/api/projects/:projectId/previews', async (req, res) => {
  const { projectId } = req.params;

  try {
    const previews = await prisma.preview.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    res.json({
      success: true,
      previews,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Stop QR preview (kill Expo tunnel)
app.delete('/api/previews/:previewId', async (req, res) => {
  const { previewId } = req.params;

  try {
    const previewService = getPreviewService();
    previewService.stopExpoTunnel(previewId);

    await prisma.preview.update({
      where: { id: previewId },
      data: { status: 'expired' },
    });

    res.json({
      success: true,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
```

### Acceptance Criteria
- [ ] POST /preview/web generates web preview
- [ ] POST /preview/qr generates QR preview
- [ ] GET /previews/:id returns preview status
- [ ] GET /projects/:id/previews lists previews
- [ ] DELETE /previews/:id stops preview

### Tests Required
```typescript
// tests/api/preview-endpoints.test.ts
describe('Preview API', () => {
  describe('POST /api/projects/:id/preview/web', () => {
    it('should generate web preview', async () => {
      const response = await request(app)
        .post(`/api/projects/${projectId}/preview/web`)
        .send({ expiresIn: 24 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.preview.url).toBeDefined();
    });
  });

  describe('POST /api/projects/:id/preview/qr', () => {
    it('should generate QR preview', async () => {
      const response = await request(app)
        .post(`/api/projects/${projectId}/preview/qr`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.preview.qrCode).toBeDefined();
    });
  });
});
```

### Build Verification
```bash
cd services/generator && npm run build && npm test
```

---

## Task 2.4: Add Database Schema for Previews

**Priority:** P0 - Critical
**Estimate:** 1 hour
**Assignee:** Developer

### Description
Add Prisma schema for preview records.

### Files to Modify
- `packages/db/prisma/schema.prisma`

### Implementation
```prisma
model Preview {
  id        String   @id @default(cuid())
  projectId String
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  type      String   // 'web' | 'qr' | 'dev-build'
  status    String   // 'generating' | 'ready' | 'expired' | 'failed'
  url       String?
  qrCode    String?  @db.Text  // base64 data URL

  error     String?
  expiresAt DateTime
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([projectId])
  @@index([expiresAt])
  @@index([status])
}
```

### Commands
```bash
cd packages/db
npx prisma migrate dev --name add-preview-model
npx prisma generate
```

### Acceptance Criteria
- [ ] Migration created successfully
- [ ] Schema generates without errors
- [ ] Relations work correctly

### Build Verification
```bash
cd packages/db && npm run build
```

---

## Task 2.5: Add Preview UI to Web App

**Priority:** P1 - High
**Estimate:** 4 hours
**Assignee:** Developer

### Description
Add preview functionality to the project page in the web app.

### Files to Create
- `apps/web/src/app/projects/[id]/preview/page.tsx`
- `apps/web/src/components/preview/WebPreview.tsx`
- `apps/web/src/components/preview/QRPreview.tsx`
- `apps/web/src/hooks/usePreview.ts`

### Implementation (usePreview.ts)
```typescript
'use client';

import { useState, useCallback } from 'react';

const GENERATOR_URL = process.env.NEXT_PUBLIC_GENERATOR_URL || 'http://localhost:4000';

interface Preview {
  id: string;
  projectId: string;
  type: 'web' | 'qr' | 'dev-build';
  status: 'generating' | 'ready' | 'expired' | 'failed';
  url?: string;
  qrCode?: string;
  expiresAt: string;
  error?: string;
}

export function usePreview(projectId: string) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateWebPreview = useCallback(async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch(`${GENERATOR_URL}/api/projects/${projectId}/preview/web`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresIn: 24 }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate preview');
      }

      setPreview(data.preview);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  }, [projectId]);

  const generateQRPreview = useCallback(async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch(`${GENERATOR_URL}/api/projects/${projectId}/preview/qr`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate QR preview');
      }

      setPreview(data.preview);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  }, [projectId]);

  const stopPreview = useCallback(async () => {
    if (!preview) return;

    try {
      await fetch(`${GENERATOR_URL}/api/previews/${preview.id}`, {
        method: 'DELETE',
      });

      setPreview(null);
    } catch (err: any) {
      setError(err.message);
    }
  }, [preview]);

  return {
    isGenerating,
    preview,
    error,
    generateWebPreview,
    generateQRPreview,
    stopPreview,
  };
}
```

### Acceptance Criteria
- [ ] Preview page shows preview options
- [ ] Web preview shows in iframe
- [ ] QR preview shows scannable code
- [ ] Preview status updates in real-time
- [ ] Stop button works for QR preview

### Tests Required
```typescript
// tests/ui/preview-page.test.tsx
describe('Preview Page', () => {
  it('should render preview options', () => {
    render(<PreviewPage projectId="test-id" />);

    expect(screen.getByText('Web Preview')).toBeInTheDocument();
    expect(screen.getByText('QR Code')).toBeInTheDocument();
  });

  it('should generate web preview on click', async () => {
    render(<PreviewPage projectId="test-id" />);

    fireEvent.click(screen.getByText('Generate Web Preview'));

    await waitFor(() => {
      expect(screen.getByRole('iframe')).toBeInTheDocument();
    });
  });
});
```

### Build Verification
```bash
cd apps/web && npm run build && npm test
```

---

## Task 2.6: Add Preview Cleanup Job

**Priority:** P2 - Medium
**Estimate:** 2 hours
**Assignee:** Developer

### Description
Create a scheduled job to clean up expired previews.

### Files to Create
- `services/generator/src/jobs/preview-cleanup.ts`

### Implementation
```typescript
import { CronJob } from 'cron';
import { getPreviewService } from '../preview-service';

export function startPreviewCleanupJob(): CronJob {
  // Run every hour
  const job = new CronJob('0 * * * *', async () => {
    console.log('[preview-cleanup] Starting cleanup...');

    try {
      const previewService = getPreviewService();
      const cleaned = await previewService.cleanupExpiredPreviews();

      console.log(`[preview-cleanup] Cleaned up ${cleaned} expired previews`);
    } catch (error) {
      console.error('[preview-cleanup] Cleanup failed:', error);
    }
  });

  job.start();
  console.log('[preview-cleanup] Cleanup job scheduled (hourly)');

  return job;
}
```

### Add to index.ts
```typescript
import { startPreviewCleanupJob } from './jobs/preview-cleanup';

// In initialize()
startPreviewCleanupJob();
```

### Acceptance Criteria
- [ ] Job runs hourly
- [ ] Expired previews are deleted from S3
- [ ] Expired QR tunnels are stopped
- [ ] Database records updated

### Tests Required
```typescript
// tests/jobs/preview-cleanup.test.ts
describe('Preview Cleanup Job', () => {
  it('should clean up expired previews', async () => {
    // Create expired preview
    const preview = await createPreview({
      expiresAt: new Date(Date.now() - 1000),
      status: 'ready',
    });

    // Run cleanup
    const cleaned = await previewService.cleanupExpiredPreviews();

    expect(cleaned).toBe(1);

    // Verify status changed
    const updated = await prisma.preview.findUnique({ where: { id: preview.id } });
    expect(updated?.status).toBe('expired');
  });
});
```

### Build Verification
```bash
cd services/generator && npm run build && npm test
```

---

## Sprint 2 Completion Checklist

- [ ] Task 2.1: Web deployer agent created
- [ ] Task 2.2: Preview service implemented
- [ ] Task 2.3: Preview API endpoints added
- [ ] Task 2.4: Database schema migrated
- [ ] Task 2.5: Preview UI implemented
- [ ] Task 2.6: Cleanup job running
- [ ] All builds succeed
- [ ] All tests pass
- [ ] Code reviewed and merged

---

## Build Commands Summary

```bash
# After each task:
npm run build
npm run typecheck
npm run test

# Database migration:
cd packages/db && npx prisma migrate dev

# Before sprint completion:
npm run test:integration
npm run test:e2e
```
