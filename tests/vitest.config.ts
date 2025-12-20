import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    setupFiles: ['./setup.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: '../coverage',
      include: [
        '../packages/*/src/**/*.ts',
        '../services/*/src/**/*.ts',
      ],
      exclude: [
        '**/*.d.ts',
        '**/*.test.ts',
        '**/node_modules/**',
      ],
    },

    // Reporter configuration
    reporters: ['verbose'],

    // Alias for imports
    alias: {
      '@mobigen/api': path.resolve(__dirname, '../packages/api/src'),
      '@mobigen/db': path.resolve(__dirname, '../packages/db/src'),
      '@mobigen/ai': path.resolve(__dirname, '../packages/ai/src'),
      '@mobigen/storage': path.resolve(__dirname, '../packages/storage/src'),
      '@mobigen/testing': path.resolve(__dirname, '../packages/testing/src'),
    },
  },
});
