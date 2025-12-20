import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
  CopyObjectCommand,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'stream';
import type {
  StorageConfig,
  FileInfo,
  UploadResult,
  DownloadResult,
} from './types.js';

export class S3Storage {
  private client: S3Client;
  private bucket: string;
  private prefix: string;

  constructor(config: StorageConfig) {
    this.client = new S3Client({ region: config.s3Region });
    this.bucket = config.s3Bucket;
    this.prefix = config.s3Prefix || '';
  }

  private getFullKey(key: string): string {
    return this.prefix ? `${this.prefix}/${key}` : key;
  }

  async upload(key: string, data: Buffer | Readable, contentType?: string): Promise<UploadResult> {
    const fullKey = this.getFullKey(key);

    if (data instanceof Buffer && data.length < 5 * 1024 * 1024) {
      // Small file - use simple upload
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: fullKey,
        Body: data,
        ContentType: contentType,
      });
      const result = await this.client.send(command);
      return {
        key: fullKey,
        etag: result.ETag || '',
        versionId: result.VersionId,
      };
    }

    // Large file - use multipart upload
    const upload = new Upload({
      client: this.client,
      params: {
        Bucket: this.bucket,
        Key: fullKey,
        Body: data,
        ContentType: contentType,
      },
    });

    const result = await upload.done();
    return {
      key: fullKey,
      etag: result.ETag || '',
      versionId: result.VersionId,
    };
  }

  async download(key: string): Promise<DownloadResult> {
    const fullKey = this.getFullKey(key);
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: fullKey,
    });

    const response = await this.client.send(command);
    const chunks: Buffer[] = [];

    for await (const chunk of response.Body as AsyncIterable<Buffer>) {
      chunks.push(chunk);
    }

    return {
      data: Buffer.concat(chunks),
      contentType: response.ContentType,
      lastModified: response.LastModified,
    };
  }

  async delete(key: string): Promise<void> {
    const fullKey = this.getFullKey(key);
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: fullKey,
    });
    await this.client.send(command);
  }

  async list(prefix?: string): Promise<FileInfo[]> {
    const fullPrefix = prefix ? this.getFullKey(prefix) : this.prefix;
    const files: FileInfo[] = [];
    let continuationToken: string | undefined;

    do {
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: fullPrefix,
        ContinuationToken: continuationToken,
      });

      const response = await this.client.send(command);

      for (const object of response.Contents || []) {
        files.push({
          path: object.Key || '',
          size: object.Size || 0,
          lastModified: object.LastModified || new Date(),
          etag: object.ETag,
        });
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    return files;
  }

  async exists(key: string): Promise<boolean> {
    try {
      const fullKey = this.getFullKey(key);
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: fullKey,
      });
      await this.client.send(command);
      return true;
    } catch {
      return false;
    }
  }

  async copy(sourceKey: string, destKey: string): Promise<UploadResult> {
    const fullSourceKey = this.getFullKey(sourceKey);
    const fullDestKey = this.getFullKey(destKey);

    const command = new CopyObjectCommand({
      Bucket: this.bucket,
      CopySource: `${this.bucket}/${fullSourceKey}`,
      Key: fullDestKey,
    });

    const result = await this.client.send(command);
    return {
      key: fullDestKey,
      etag: result.CopyObjectResult?.ETag || '',
      versionId: result.VersionId,
    };
  }
}
