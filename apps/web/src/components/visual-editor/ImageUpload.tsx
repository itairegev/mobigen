'use client';

import { useState, useCallback, useRef } from 'react';
import { useVisualEditor } from '../../hooks/useVisualEditor';

interface ImageUploadProps {
  projectId: string;
  onUpload: (file: File) => Promise<string>; // Returns the new image URL
  onSwap: (newUrl: string) => Promise<void>;
}

const ACCEPTED_FORMATS = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Image Upload/Swap component for replacing images in the app
 */
export function ImageUpload({ projectId, onUpload, onSwap }: ImageUploadProps) {
  const { selectedElement, applyChange, isDesignMode } = useVisualEditor();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (!ACCEPTED_FORMATS.includes(file.type)) {
      return 'Invalid file format. Please use JPEG, PNG, GIF, WebP, or SVG.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File too large. Maximum size is 5MB.';
    }
    return null;
  }, []);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !selectedElement) return;

      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setError(null);
      setIsUploading(true);

      // Create local preview
      const localPreview = URL.createObjectURL(file);
      setPreviewUrl(localPreview);

      try {
        const newUrl = await onUpload(file);

        // Record the change
        applyChange({
          type: 'image',
          elementId: selectedElement.id,
          elementPath: selectedElement.path,
          before: { src: selectedElement.content },
          after: { src: newUrl },
          description: `Replaced image with ${file.name}`,
        });

        await onSwap(newUrl);
        setPreviewUrl(newUrl);
      } catch (error) {
        console.error('Failed to upload image:', error);
        setError('Failed to upload image. Please try again.');
        setPreviewUrl(null);
      } finally {
        setIsUploading(false);
        // Clean up local preview URL
        URL.revokeObjectURL(localPreview);
      }
    },
    [selectedElement, validateFile, onUpload, onSwap, applyChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const file = e.dataTransfer.files?.[0];
      if (file && fileInputRef.current) {
        // Create a new FileList with the dropped file
        const dt = new DataTransfer();
        dt.items.add(file);
        fileInputRef.current.files = dt.files;

        // Trigger the change event
        const event = new Event('change', { bubbles: true });
        fileInputRef.current.dispatchEvent(event);
      }
    },
    []
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  if (!isDesignMode || selectedElement?.type !== 'image') {
    return null;
  }

  const currentImageUrl = previewUrl || selectedElement.content;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Image
        </h3>
      </div>

      <div className="p-4 space-y-4">
        {/* Current image preview */}
        <div className="relative aspect-video bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden">
          {currentImageUrl ? (
            <img
              src={currentImageUrl}
              alt="Selected image"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              No image
            </div>
          )}

          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-white text-sm">Uploading...</div>
            </div>
          )}
        </div>

        {/* Upload area */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-6 text-center hover:border-primary-500 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_FORMATS.join(',')}
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="text-3xl mb-2">📷</div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
            {isUploading ? 'Uploading...' : 'Click or drag to replace image'}
          </p>
          <p className="text-xs text-slate-400">
            JPEG, PNG, GIF, WebP, SVG • Max 5MB
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* URL input for external images */}
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
            Or enter image URL
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="https://example.com/image.png"
              className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900"
              onKeyDown={async (e) => {
                if (e.key === 'Enter') {
                  const input = e.currentTarget;
                  const url = input.value.trim();
                  if (url) {
                    setIsUploading(true);
                    try {
                      applyChange({
                        type: 'image',
                        elementId: selectedElement.id,
                        elementPath: selectedElement.path,
                        before: { src: selectedElement.content },
                        after: { src: url },
                        description: `Changed image URL`,
                      });
                      await onSwap(url);
                      setPreviewUrl(url);
                      input.value = '';
                    } catch (error) {
                      setError('Failed to update image URL');
                    } finally {
                      setIsUploading(false);
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImageUpload;
