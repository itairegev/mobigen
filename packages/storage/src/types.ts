export interface StorageConfig {
  s3Bucket: string;
  s3Region: string;
  s3Prefix?: string;
}

export interface ProjectStorageConfig {
  projectId: string;
  bucket: string;
  prefix: string;
}

export interface FileInfo {
  path: string;
  size: number;
  lastModified: Date;
  etag?: string;
}

export interface UploadResult {
  key: string;
  etag: string;
  versionId?: string;
}

export interface DownloadResult {
  data: Buffer;
  contentType?: string;
  lastModified?: Date;
}

export interface GitCommit {
  hash: string;
  message: string;
  author: string;
  date: Date;
  files: string[];
}

export interface ProjectSnapshot {
  version: number;
  timestamp: Date;
  s3Key: string;
  gitCommit?: string;
  files: FileInfo[];
}
