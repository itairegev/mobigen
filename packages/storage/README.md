# @mobigen/storage

S3 and Git storage utilities for Mobigen.

## Overview

This package provides storage abstractions for Mobigen, including S3-compatible object storage and Git repository management for template versioning.

## Tech Stack

- **Object Storage**: AWS S3 / MinIO
- **Version Control**: Simple-git
- **Language**: TypeScript (ESM)

## Installation

```bash
pnpm add @mobigen/storage
```

## Features

- S3-compatible object storage client
- Git repository management
- Template manager for cloning and customization
- File upload/download utilities
- Signed URL generation

## Directory Structure

```
src/
├── index.ts              # Main exports
├── s3/                   # S3 client
│   ├── client.ts         # S3 client wrapper
│   ├── upload.ts         # Upload utilities
│   └── download.ts       # Download utilities
├── git/                  # Git utilities
│   ├── client.ts         # Git client wrapper
│   ├── clone.ts          # Clone operations
│   └── commit.ts         # Commit operations
└── templates/            # Template management
    ├── manager.ts        # Template manager
    └── types.ts          # Template types
```

## Usage

### S3 Client

```typescript
import { S3Client, uploadFile, downloadFile } from '@mobigen/storage';

// Create client
const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_SECRET_KEY,
  region: process.env.S3_REGION || 'us-east-1',
});

// Upload file
await s3.upload({
  bucket: 'mobigen-projects',
  key: 'project-id/app.zip',
  body: fileBuffer,
  contentType: 'application/zip',
});

// Download file
const data = await s3.download({
  bucket: 'mobigen-projects',
  key: 'project-id/app.zip',
});

// Generate signed URL
const url = await s3.getSignedUrl({
  bucket: 'mobigen-artifacts',
  key: 'build-id/app.apk',
  expiresIn: 3600, // 1 hour
});
```

### Git Client

```typescript
import { GitClient } from '@mobigen/storage';

// Create client
const git = new GitClient('/path/to/repo');

// Initialize repository
await git.init();

// Clone from template
await git.clone('file:///path/to/template.git');

// Stage and commit
await git.add('.');
await git.commit('Add new feature');

// Get history
const log = await git.log();
```

### Template Manager

```typescript
import { TemplateManager } from '@mobigen/storage';

// Create manager
const templates = new TemplateManager({
  templatesDir: '/app/templates',
  bareReposDir: '/app/templates-bare',
  projectsDir: '/app/projects',
});

// List available templates
const available = await templates.list();
// ['base', 'ecommerce', 'loyalty', 'news', 'ai-assistant']

// Get template info
const info = await templates.getInfo('ecommerce');
// { name: 'ecommerce', description: '...', features: [...] }

// Clone template for new project
const projectPath = await templates.cloneForProject({
  templateId: 'ecommerce',
  projectId: 'project-123',
});

// Get template context (for AI agents)
const context = await templates.getContext('ecommerce');
// { screens: [...], components: [...], hooks: [...] }
```

## S3 Operations

### Upload

```typescript
// Upload buffer
await s3.upload({
  bucket: 'bucket-name',
  key: 'path/to/file.txt',
  body: Buffer.from('content'),
});

// Upload stream
await s3.uploadStream({
  bucket: 'bucket-name',
  key: 'path/to/large-file.zip',
  stream: readableStream,
});

// Multipart upload
const upload = await s3.createMultipartUpload({
  bucket: 'bucket-name',
  key: 'path/to/huge-file.zip',
});
// ... upload parts
await s3.completeMultipartUpload(upload);
```

### Download

```typescript
// Download to buffer
const buffer = await s3.download({
  bucket: 'bucket-name',
  key: 'path/to/file.txt',
});

// Download as stream
const stream = await s3.downloadStream({
  bucket: 'bucket-name',
  key: 'path/to/large-file.zip',
});
```

### List Objects

```typescript
// List objects with prefix
const objects = await s3.list({
  bucket: 'bucket-name',
  prefix: 'project-id/',
});
// [{ key: 'project-id/file1.txt', size: 100, ... }, ...]
```

### Delete

```typescript
// Delete single object
await s3.delete({
  bucket: 'bucket-name',
  key: 'path/to/file.txt',
});

// Delete multiple objects
await s3.deleteMany({
  bucket: 'bucket-name',
  keys: ['file1.txt', 'file2.txt'],
});
```

## Git Operations

### Repository Management

```typescript
// Check if directory is a git repo
const isRepo = await git.isRepo();

// Get current branch
const branch = await git.currentBranch();

// Get status
const status = await git.status();
// { modified: [...], added: [...], deleted: [...] }
```

### Commits

```typescript
// Stage specific files
await git.add(['src/App.tsx', 'src/components/Button.tsx']);

// Stage all changes
await git.add('.');

// Commit with message
await git.commit('feat: add login screen');

// Get commit history
const history = await git.log({ maxCount: 10 });
```

### Diff

```typescript
// Get diff for uncommitted changes
const diff = await git.diff();

// Get diff between commits
const commitDiff = await git.diff('abc123', 'def456');
```

## Configuration

### Environment Variables

```env
# S3 Configuration
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minio_admin
S3_SECRET_KEY=minio_password
S3_REGION=us-east-1

# Bucket Names
S3_BUCKET=mobigen-projects
ARTIFACTS_BUCKET=mobigen-artifacts
SCREENSHOTS_BUCKET=mobigen-screenshots

# Paths
TEMPLATES_DIR=/app/templates
TEMPLATES_BARE_DIR=/app/templates-bare
PROJECTS_DIR=/app/projects
```

## Building

```bash
# Build package
pnpm --filter @mobigen/storage build

# Type checking
pnpm --filter @mobigen/storage typecheck

# Clean build artifacts
pnpm --filter @mobigen/storage clean
```

## Related Documentation

- [AWS S3 SDK](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [MinIO Documentation](https://min.io/docs/)
- [Main README](../../README.md)
