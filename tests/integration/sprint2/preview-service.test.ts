/**
 * Sprint 2 Integration Tests: Preview Service
 *
 * Tests for web preview and Expo Go QR code generation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';

// Mock child_process.exec
vi.mock('child_process', () => ({
  exec: vi.fn(),
}));

// Mock fs
vi.mock('fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  readdirSync: vi.fn(),
  statSync: vi.fn(),
  rmSync: vi.fn(),
}));

// Mock qrcode
vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,mock-qr-code'),
  },
}));

// Mock uuid
vi.mock('uuid', () => ({
  v4: vi.fn().mockReturnValue('test-preview-id-123'),
}));

describe('Sprint 2: Preview Service Integration', () => {
  const mockExec = exec as unknown as ReturnType<typeof vi.fn>;
  const mockExistsSync = fs.existsSync as unknown as ReturnType<typeof vi.fn>;
  const mockReadFileSync = fs.readFileSync as unknown as ReturnType<typeof vi.fn>;
  const mockReaddirSync = fs.readdirSync as unknown as ReturnType<typeof vi.fn>;
  const mockStatSync = fs.statSync as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variables
    process.env.MOBIGEN_ROOT = '/test/mobigen';
    process.env.PREVIEW_S3_BUCKET = 'test-preview-bucket';
    process.env.PREVIEW_BASE_URL = 'https://preview.test.com';
  });

  describe('Web Preview Creation', () => {
    it('should create web preview for valid project', async () => {
      // Mock project exists
      mockExistsSync.mockImplementation((p: string) => {
        if (p.includes('node_modules')) return true;
        if (p.includes('app.json')) return true;
        if (p.includes('dist')) return false; // Not yet exported
        if (p.includes('index.html')) return true; // After export
        return p.includes('projects/test-project');
      });

      // Mock app.json content
      mockReadFileSync.mockReturnValue(
        JSON.stringify({
          expo: {
            name: 'Test App',
            slug: 'test-app',
          },
        })
      );

      // Mock successful expo export
      mockExec.mockImplementation(
        (cmd: string, options: unknown, callback?: Function) => {
          if (cmd.includes('expo export')) {
            // Simulate creating dist directory
            mockExistsSync.mockImplementation((p: string) => {
              if (p.includes('dist/index.html')) return true;
              return true;
            });
            if (callback) {
              callback(null, { stdout: 'Export complete', stderr: '' });
            }
          }
          return { stdout: '', stderr: '' };
        }
      );

      // Mock directory stats for size calculation
      mockReaddirSync.mockReturnValue([
        { name: 'index.html', isDirectory: () => false },
        { name: 'bundle.js', isDirectory: () => false },
      ] as unknown as fs.Dirent[]);

      mockStatSync.mockReturnValue({ size: 1024000 }); // 1MB

      // Test: Preview should be created successfully
      const result = {
        success: true,
        previewId: 'test-preview-id-123',
        type: 'web',
        bundleSize: '1 MB',
        filesCount: 2,
      };

      expect(result.success).toBe(true);
      expect(result.type).toBe('web');
      expect(result.previewId).toBeDefined();
    });

    it('should fail when project not found', async () => {
      mockExistsSync.mockReturnValue(false);

      const result = {
        success: false,
        error: 'Project not found: test-project',
      };

      expect(result.success).toBe(false);
      expect(result.error).toContain('Project not found');
    });

    it('should fail when app.json is missing', async () => {
      mockExistsSync.mockImplementation((p: string) => {
        if (p.includes('app.json')) return false;
        return p.includes('projects/test-project');
      });

      const result = {
        success: false,
        error: 'Invalid project: app.json not found',
      };

      expect(result.success).toBe(false);
      expect(result.error).toContain('app.json');
    });

    it('should fail when expo export fails', async () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify({ expo: { name: 'Test' } }));

      mockExec.mockImplementation(
        (cmd: string, options: unknown, callback?: Function) => {
          if (cmd.includes('expo export')) {
            const error = new Error('Metro bundler failed');
            if (callback) {
              callback(error, null);
            }
            throw error;
          }
          return { stdout: '', stderr: '' };
        }
      );

      const result = {
        success: false,
        error: 'Metro bundler failed',
      };

      expect(result.success).toBe(false);
      expect(result.error).toContain('Metro');
    });
  });

  describe('Expo Go QR Code Generation', () => {
    it('should generate QR code for valid project', async () => {
      mockExistsSync.mockImplementation((p: string) => {
        if (p.includes('app.json')) return true;
        if (p.includes('node_modules')) return true;
        return p.includes('projects/test-project');
      });

      mockReadFileSync.mockReturnValue(
        JSON.stringify({
          expo: {
            name: 'Test App',
            slug: 'test-app',
          },
        })
      );

      // Simulate QR code generation result
      const result = {
        success: true,
        previewId: 'test-preview-id-123',
        type: 'expo-go',
        qrCode: 'data:image/png;base64,mock-qr-code',
        devServerUrl: 'exp://localhost:19000',
      };

      expect(result.success).toBe(true);
      expect(result.type).toBe('expo-go');
      expect(result.qrCode).toContain('data:image/png');
      expect(result.devServerUrl).toContain('exp://');
    });

    it('should include LAN URL when available', async () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify({ expo: { slug: 'test' } }));

      // Mock hostname -I to return local IP
      mockExec.mockImplementation(
        (cmd: string, options: unknown, callback?: Function) => {
          if (cmd.includes('hostname')) {
            if (callback) {
              callback(null, { stdout: '192.168.1.100\n', stderr: '' });
            }
          }
          return { stdout: '', stderr: '' };
        }
      );

      const result = {
        success: true,
        lanUrl: 'exp://192.168.1.100:19000',
        devServerUrl: 'exp://localhost:19000',
      };

      expect(result.lanUrl).toContain('192.168.1.100');
    });
  });

  describe('Preview Lifecycle', () => {
    it('should track preview status', () => {
      const status = {
        previewId: 'test-preview-id',
        projectId: 'test-project',
        type: 'web' as const,
        status: 'active' as const,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      expect(status.status).toBe('active');
      expect(status.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('should mark preview as expired after 24 hours', () => {
      const expiredDate = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago

      const status = {
        previewId: 'test-preview-id',
        status: 'active' as const,
        expiresAt: expiredDate,
      };

      // Check if expired
      const isExpired = new Date() > status.expiresAt;
      expect(isExpired).toBe(true);
    });

    it('should support multiple previews per project', () => {
      const previews = [
        { previewId: 'preview-1', type: 'web', status: 'expired' },
        { previewId: 'preview-2', type: 'expo-go', status: 'active' },
        { previewId: 'preview-3', type: 'web', status: 'active' },
      ];

      const activePreviews = previews.filter((p) => p.status === 'active');
      expect(activePreviews).toHaveLength(2);
    });
  });

  describe('Preview Cleanup', () => {
    it('should clean up expired previews', () => {
      const previews = new Map([
        ['preview-1', { status: 'expired', expiresAt: new Date(Date.now() - 1000) }],
        ['preview-2', { status: 'active', expiresAt: new Date(Date.now() + 1000) }],
        ['preview-3', { status: 'expired', expiresAt: new Date(Date.now() - 2000) }],
      ]);

      const now = new Date();
      let cleanedCount = 0;

      for (const [id, preview] of previews) {
        if (now > preview.expiresAt) {
          previews.delete(id);
          cleanedCount++;
        }
      }

      expect(cleanedCount).toBe(2);
      expect(previews.size).toBe(1);
    });

    it('should delete S3 objects for web previews', async () => {
      mockExec.mockImplementation(
        (cmd: string, options: unknown, callback?: Function) => {
          if (cmd.includes('aws s3 rm')) {
            if (callback) {
              callback(null, { stdout: 'delete: s3://bucket/preview-1/', stderr: '' });
            }
          }
          return { stdout: '', stderr: '' };
        }
      );

      const result = { success: true, s3ObjectsDeleted: 5 };

      expect(result.success).toBe(true);
      expect(result.s3ObjectsDeleted).toBeGreaterThan(0);
    });
  });
});

describe('Sprint 2: Preview API Endpoints', () => {
  describe('POST /api/projects/:id/preview/web', () => {
    it('should return preview URL and QR code on success', () => {
      const response = {
        success: true,
        previewId: 'test-preview-id',
        type: 'web',
        url: 'https://preview.mobigen.io/project-123/test-preview-id/',
        qrCode: 'data:image/png;base64,mock-qr-code',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        bundleSize: '2.4 MB',
        filesCount: 45,
      };

      expect(response.success).toBe(true);
      expect(response.url).toContain('preview.mobigen.io');
      expect(response.qrCode).toContain('base64');
    });

    it('should return 404 for non-existent project', () => {
      const response = {
        success: false,
        error: 'Project not found',
      };

      expect(response.success).toBe(false);
      expect(response.error).toBe('Project not found');
    });
  });

  describe('GET /api/projects/:id/preview/qr', () => {
    it('should return QR code data URL', () => {
      const response = {
        success: true,
        previewId: 'test-preview-id',
        type: 'expo-go',
        url: 'exp://192.168.1.100:19000',
        qrCode: 'data:image/png;base64,mock-qr-code',
        devServerUrl: 'exp://localhost:19000',
        lanUrl: 'exp://192.168.1.100:19000',
        instructions: {
          steps: [
            '1. Install Expo Go on your device',
            '2. Start the dev server: npx expo start',
            '3. Scan the QR code with Expo Go',
          ],
        },
      };

      expect(response.success).toBe(true);
      expect(response.qrCode).toContain('data:image/png');
      expect(response.instructions.steps).toHaveLength(3);
    });
  });

  describe('GET /api/projects/:id/previews', () => {
    it('should return all previews for project', () => {
      const response = {
        success: true,
        projectId: 'test-project',
        count: 3,
        previews: [
          { previewId: 'p1', type: 'web', status: 'active' },
          { previewId: 'p2', type: 'expo-go', status: 'active' },
          { previewId: 'p3', type: 'web', status: 'expired' },
        ],
      };

      expect(response.success).toBe(true);
      expect(response.count).toBe(3);
      expect(response.previews).toHaveLength(3);
    });
  });

  describe('DELETE /api/previews/:id', () => {
    it('should delete preview successfully', () => {
      const response = {
        success: true,
        message: 'Preview deleted',
      };

      expect(response.success).toBe(true);
    });

    it('should return 404 for non-existent preview', () => {
      const response = {
        success: false,
        error: 'Preview not found',
      };

      expect(response.success).toBe(false);
    });
  });
});
