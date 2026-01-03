/**
 * Unit tests for CodeFormatter
 */

import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { CodeFormatter } from '../src/code-formatter';
import { shouldFormatFile, getFormatterForFile } from '../src/formatter-config';

describe('CodeFormatter', () => {
  let formatter: CodeFormatter;
  let tempDir: string;

  beforeEach(async () => {
    formatter = new CodeFormatter();
    // Create a temporary directory for tests
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'formatter-test-'));
  });

  afterEach(async () => {
    // Cleanup temporary directory
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  describe('formatFile', () => {
    it('should format a TypeScript file with Prettier', async () => {
      const filePath = path.join(tempDir, 'test.ts');
      const unformattedCode = `const  x   =   1;
const y=2;`;

      await fs.writeFile(filePath, unformattedCode);

      const wasFormatted = await formatter.formatFile(filePath);

      expect(wasFormatted).toBe(true);

      const formattedContent = await fs.readFile(filePath, 'utf-8');
      expect(formattedContent).toContain('const x = 1');
      expect(formattedContent).toContain('const y = 2');
    });

    it('should format a JSON file', async () => {
      const filePath = path.join(tempDir, 'test.json');
      const unformattedJson = `{"name":"test","value":123}`;

      await fs.writeFile(filePath, unformattedJson);

      const wasFormatted = await formatter.formatFile(filePath);

      expect(wasFormatted).toBe(true);

      const formattedContent = await fs.readFile(filePath, 'utf-8');
      expect(formattedContent).toContain('"name": "test"');
      expect(formattedContent).toContain('"value": 123');
    });

    it('should skip formatting for unsupported file types', async () => {
      const filePath = path.join(tempDir, 'test.png');
      const binaryData = Buffer.from([0x89, 0x50, 0x4e, 0x47]); // PNG header

      await fs.writeFile(filePath, binaryData);

      const wasFormatted = await formatter.formatFile(filePath);

      expect(wasFormatted).toBe(false);
    });

    it('should handle React/JSX files', async () => {
      const filePath = path.join(tempDir, 'Component.tsx');
      const unformattedCode = `export default function Component(){return <div><p>Hello</p></div>}`;

      await fs.writeFile(filePath, unformattedCode);

      const wasFormatted = await formatter.formatFile(filePath);

      expect(wasFormatted).toBe(true);

      const formattedContent = await fs.readFile(filePath, 'utf-8');
      expect(formattedContent).toContain('export default function Component()');
      expect(formattedContent).toContain('<div>');
    });
  });

  describe('formatProject', () => {
    beforeEach(async () => {
      // Create a mock project structure
      await fs.mkdir(path.join(tempDir, 'src'));
      await fs.mkdir(path.join(tempDir, 'node_modules'), { recursive: true });
    });

    it('should format all TypeScript files in a project', async () => {
      const file1 = path.join(tempDir, 'src', 'index.ts');
      const file2 = path.join(tempDir, 'src', 'utils.ts');

      await fs.writeFile(file1, `const  x  =  1;`);
      await fs.writeFile(file2, `function  test(){return  true;}`);

      const result = await formatter.formatProject(tempDir);

      expect(result.success).toBe(true);
      expect(result.filesFormatted).toBeGreaterThanOrEqual(2);
      expect(result.errors).toHaveLength(0);

      const content1 = await fs.readFile(file1, 'utf-8');
      const content2 = await fs.readFile(file2, 'utf-8');

      expect(content1).toContain('const x = 1');
      expect(content2).toContain('function test()');
    });

    it('should skip node_modules directory', async () => {
      const srcFile = path.join(tempDir, 'src', 'index.ts');
      const nodeModulesFile = path.join(tempDir, 'node_modules', 'package', 'index.js');

      await fs.mkdir(path.join(tempDir, 'node_modules', 'package'), { recursive: true });
      await fs.writeFile(srcFile, `const  x  =  1;`);
      await fs.writeFile(nodeModulesFile, `const  y  =  2;`);

      const result = await formatter.formatProject(tempDir);

      expect(result.success).toBe(true);

      // src file should be formatted
      const srcContent = await fs.readFile(srcFile, 'utf-8');
      expect(srcContent).toContain('const x = 1');

      // node_modules file should NOT be formatted
      const nmContent = await fs.readFile(nodeModulesFile, 'utf-8');
      expect(nmContent).toBe('const  y  =  2;');
    });

    it('should continue on error when continueOnError is true', async () => {
      const goodFile = path.join(tempDir, 'src', 'good.ts');
      const badFile = path.join(tempDir, 'src', 'bad.ts');

      await fs.writeFile(goodFile, `const x = 1;`);
      await fs.writeFile(badFile, `const x = {{{{{`); // Invalid syntax

      const result = await formatter.formatProject(tempDir, { continueOnError: true });

      expect(result.filesFormatted).toBeGreaterThanOrEqual(0);
      // Should have completed despite errors
    });

    it('should validate formatting when requested', async () => {
      const file = path.join(tempDir, 'src', 'index.ts');
      await fs.writeFile(file, `const x = 1;`);

      const result = await formatter.formatProject(tempDir, { skipValidation: false });

      expect(result.success).toBe(true);
    });
  });

  describe('validateFormatting', () => {
    it('should return true for properly formatted code', async () => {
      const file = path.join(tempDir, 'test.ts');
      await fs.writeFile(file, `const x = 1;\n`);

      // Format it first
      await formatter.formatFile(file);

      const isValid = await formatter.validateFormatting(tempDir);

      expect(isValid).toBe(true);
    });

    it('should return false for improperly formatted code', async () => {
      const file = path.join(tempDir, 'test.ts');
      await fs.writeFile(file, `const  x  =  1;`); // Unformatted

      const isValid = await formatter.validateFormatting(tempDir);

      expect(isValid).toBe(false);
    });
  });

  describe('createFormattedCopy', () => {
    let sourceDir: string;
    let destDir: string;

    beforeEach(async () => {
      sourceDir = await fs.mkdtemp(path.join(os.tmpdir(), 'source-'));
      destDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dest-'));

      // Create source files
      await fs.mkdir(path.join(sourceDir, 'src'));
      await fs.writeFile(path.join(sourceDir, 'src', 'index.ts'), `const  x  =  1;`);
    });

    afterEach(async () => {
      if (sourceDir) await fs.rm(sourceDir, { recursive: true, force: true });
      if (destDir) await fs.rm(destDir, { recursive: true, force: true });
    });

    it('should create a formatted copy of a project', async () => {
      const result = await formatter.createFormattedCopy(sourceDir, destDir);

      expect(result.success).toBe(true);

      // Check that destination has formatted file
      const destFile = path.join(destDir, 'src', 'index.ts');
      const exists = await fs.access(destFile).then(() => true).catch(() => false);
      expect(exists).toBe(true);

      const content = await fs.readFile(destFile, 'utf-8');
      expect(content).toContain('const x = 1');

      // Source should remain unchanged
      const sourceContent = await fs.readFile(
        path.join(sourceDir, 'src', 'index.ts'),
        'utf-8'
      );
      expect(sourceContent).toBe('const  x  =  1;');
    });
  });
});

describe('Formatter Config', () => {
  describe('shouldFormatFile', () => {
    it('should return true for TypeScript files', () => {
      expect(shouldFormatFile('src/index.ts')).toBe(true);
      expect(shouldFormatFile('src/Component.tsx')).toBe(true);
    });

    it('should return true for JavaScript files', () => {
      expect(shouldFormatFile('src/index.js')).toBe(true);
      expect(shouldFormatFile('src/Component.jsx')).toBe(true);
    });

    it('should return true for JSON files', () => {
      expect(shouldFormatFile('package.json')).toBe(true);
      expect(shouldFormatFile('tsconfig.json')).toBe(true);
    });

    it('should return true for Markdown files', () => {
      expect(shouldFormatFile('README.md')).toBe(true);
    });

    it('should return false for node_modules files', () => {
      expect(shouldFormatFile('node_modules/package/index.js')).toBe(false);
    });

    it('should return false for build artifacts', () => {
      expect(shouldFormatFile('dist/bundle.js')).toBe(false);
      expect(shouldFormatFile('build/app.js')).toBe(false);
    });

    it('should return false for binary files', () => {
      expect(shouldFormatFile('image.png')).toBe(false);
      expect(shouldFormatFile('icon.ico')).toBe(false);
    });

    it('should return false for lock files', () => {
      expect(shouldFormatFile('package-lock.json')).toBe(false);
      expect(shouldFormatFile('yarn.lock')).toBe(false);
    });
  });

  describe('getFormatterForFile', () => {
    it('should return "both" for TypeScript files', () => {
      expect(getFormatterForFile('test.ts')).toBe('both');
      expect(getFormatterForFile('test.tsx')).toBe('both');
    });

    it('should return "both" for JavaScript files', () => {
      expect(getFormatterForFile('test.js')).toBe('both');
      expect(getFormatterForFile('test.jsx')).toBe('both');
    });

    it('should return "prettier" for JSON files', () => {
      expect(getFormatterForFile('package.json')).toBe('prettier');
    });

    it('should return "prettier" for Markdown files', () => {
      expect(getFormatterForFile('README.md')).toBe('prettier');
    });

    it('should return "none" for binary files', () => {
      expect(getFormatterForFile('image.png')).toBe('none');
      expect(getFormatterForFile('font.ttf')).toBe('none');
    });

    it('should return "none" for unknown file types', () => {
      expect(getFormatterForFile('random.xyz')).toBe('none');
    });
  });
});
