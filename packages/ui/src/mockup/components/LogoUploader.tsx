import React, { useState, useRef, useCallback } from 'react';
import { cn } from '../../utils/cn';

export interface UploadedLogo {
  url: string;
  width: number;
  height: number;
  fileSize: number;
  format: string;
}

export interface LogoUploaderProps {
  value?: string;
  onChange: (logo: UploadedLogo | null) => void;
  onUploadStart?: () => void;
  onUploadComplete?: (result: { success: boolean; logo?: UploadedLogo; error?: string }) => void;
  onUploadError?: (error: Error) => void;
  maxFileSize?: number;
  acceptedFormats?: string[];
  disabled?: boolean;
  className?: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

export function LogoUploader({
  value,
  onChange,
  onUploadStart,
  onUploadComplete,
  onUploadError,
  maxFileSize = 5 * 1024 * 1024,
  acceptedFormats = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'],
  disabled = false,
  className,
}: LogoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (!acceptedFormats.includes(file.type)) {
      return `Invalid format. Accepted: ${acceptedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')}`;
    }
    if (file.size > maxFileSize) {
      return `File too large. Max: ${formatBytes(maxFileSize)}`;
    }
    return null;
  }, [acceptedFormats, maxFileSize]);

  const processFile = useCallback(async (file: File) => {
    setError(null);
    setUploadProgress(0);
    onUploadStart?.();

    const fileError = validateFile(file);
    if (fileError) {
      setError(fileError);
      onUploadError?.(new Error(fileError));
      return;
    }

    setUploadProgress(30);

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setUploadProgress(60);

      const img = new Image();
      img.onload = () => {
        setPreview(dataUrl);
        setUploadProgress(100);

        const uploadedLogo: UploadedLogo = {
          url: dataUrl,
          width: img.width,
          height: img.height,
          fileSize: file.size,
          format: file.type.split('/')[1],
        };

        onChange(uploadedLogo);
        onUploadComplete?.({ success: true, logo: uploadedLogo });
        setTimeout(() => setUploadProgress(null), 500);
      };
      img.onerror = () => {
        setError('Failed to load image');
        onUploadError?.(new Error('Failed to load image'));
        setUploadProgress(null);
      };
      img.src = dataUrl;
    };
    reader.onerror = () => {
      setError('Failed to read file');
      onUploadError?.(new Error('Failed to read file'));
      setUploadProgress(null);
    };
    reader.readAsDataURL(file);
  }, [validateFile, onChange, onUploadStart, onUploadComplete, onUploadError]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [disabled, processFile]);

  const handleClick = useCallback(() => {
    if (!disabled) fileInputRef.current?.click();
  }, [disabled]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleRemove = useCallback(() => {
    setPreview(null);
    setError(null);
    onChange(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [onChange]);

  return (
    <div className={cn('logo-uploader', className)}>
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer',
          isDragging && 'border-blue-500 bg-blue-50',
          error && 'border-red-500',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        {preview ? (
          <div className="relative inline-block">
            <img src={preview} alt="Logo preview" className="max-w-[200px] max-h-[200px] object-contain" />
            {!disabled && (
              <button
                onClick={(e) => { e.stopPropagation(); handleRemove(); }}
                className="absolute -top-2 -right-2 rounded-full bg-red-500 text-white w-6 h-6 flex items-center justify-center"
                aria-label="Remove logo"
              >
                ×
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <div className="text-sm text-gray-600">
              <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
            </div>
            <div className="text-xs text-gray-500">PNG, JPG, SVG or WebP (max {formatBytes(maxFileSize)})</div>
          </div>
        )}

        {uploadProgress !== null && (
          <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
            <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
          </div>
        )}

        {error && (
          <div className="mt-2 text-sm text-red-600 flex items-center justify-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(',')}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
        aria-label="Upload logo file"
      />
    </div>
  );
}
