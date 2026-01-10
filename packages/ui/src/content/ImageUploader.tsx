/**
 * ImageUploader Component
 *
 * Image upload and preview component for content forms.
 * Supports drag-and-drop and URL input.
 */

import React, { useState, useRef, useCallback } from 'react';

export interface ImageUploaderProps {
  value?: string;
  onChange: (url: string | null) => void;
  onUpload?: (file: File) => Promise<string>;
  disabled?: boolean;
  accept?: string;
  maxSize?: number; // in bytes
  placeholder?: string;
  className?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  onUpload,
  disabled = false,
  accept = 'image/*',
  maxSize = 5 * 1024 * 1024, // 5MB default
  placeholder = 'Drop an image here or click to upload',
  className = '',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFile = useCallback(
    async (file: File) => {
      setError(null);

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      // Validate file size
      if (file.size > maxSize) {
        setError(`File size must be less than ${formatFileSize(maxSize)}`);
        return;
      }

      // If we have an upload handler, use it
      if (onUpload) {
        setIsUploading(true);
        try {
          const url = await onUpload(file);
          onChange(url);
        } catch (err) {
          setError('Failed to upload image. Please try again.');
          console.error('Upload error:', err);
        } finally {
          setIsUploading(false);
        }
      } else {
        // Otherwise, create a local preview URL
        const url = URL.createObjectURL(file);
        onChange(url);
      }
    },
    [maxSize, onChange, onUpload]
  );

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [disabled, handleFile]
  );

  // Handle file input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  // Handle URL input
  const handleUrlSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (urlInput.trim()) {
        onChange(urlInput.trim());
        setShowUrlInput(false);
        setUrlInput('');
      }
    },
    [urlInput, onChange]
  );

  // Clear image
  const handleClear = useCallback(() => {
    onChange(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onChange]);

  // Click to select file
  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  return (
    <div className={className}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        disabled={disabled}
        className="hidden"
      />

      {value ? (
        // Image preview
        <div className="relative group">
          <img
            src={value}
            alt="Preview"
            className="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
            onError={() => setError('Failed to load image')}
          />

          {/* Overlay actions */}
          {!disabled && (
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
              <button
                type="button"
                onClick={handleClick}
                className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Remove
              </button>
            </div>
          )}

          {/* URL display */}
          <div className="mt-2 flex items-center space-x-2">
            <input
              type="text"
              value={value}
              readOnly
              className="
                flex-1 px-3 py-2 text-sm
                border border-gray-300 dark:border-gray-600
                rounded-md
                bg-gray-50 dark:bg-gray-800
                text-gray-700 dark:text-gray-300
                truncate
              "
            />
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(value)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              title="Copy URL"
            >
              <CopyIcon />
            </button>
          </div>
        </div>
      ) : showUrlInput ? (
        // URL input form
        <form onSubmit={handleUrlSubmit} className="space-y-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="
              w-full px-3 py-2
              border border-gray-300 dark:border-gray-600
              rounded-md
              bg-white dark:bg-gray-800
              text-gray-900 dark:text-white
              focus:outline-none focus:ring-2 focus:ring-blue-500
            "
            autoFocus
          />
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => {
                setShowUrlInput(false);
                setUrlInput('');
              }}
              className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!urlInput.trim()}
              className="
                px-3 py-1.5 text-sm font-medium
                text-white bg-blue-600
                rounded-md
                hover:bg-blue-700
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              Use URL
            </button>
          </div>
        </form>
      ) : (
        // Drop zone
        <div
          onClick={handleClick}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`
            relative
            border-2 border-dashed rounded-lg
            p-8
            text-center
            cursor-pointer
            transition-colors
            ${
              isDragging
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {isUploading ? (
            <div className="flex flex-col items-center">
              <Spinner className="w-8 h-8 text-blue-500" />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Uploading...
              </p>
            </div>
          ) : (
            <>
              <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {placeholder}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                Max size: {formatFileSize(maxSize)}
              </p>

              {/* Alternative: URL input */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowUrlInput(true);
                }}
                className="mt-3 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                or enter a URL
              </button>
            </>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ============================================================================
// ICON COMPONENTS
// ============================================================================

const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

const CopyIcon: React.FC = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
    />
  </svg>
);

const Spinner: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={`animate-spin ${className}`}
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);
