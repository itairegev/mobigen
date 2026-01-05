'use client';

import { useRef, useCallback } from 'react';
import { useVisualEditor } from '../../hooks/useVisualEditor';
import { SelectionOverlay } from './SelectionOverlay';
import { StyleControls } from './StyleControls';
import { TextEditor } from './TextEditor';
import { ImageUpload } from './ImageUpload';
import { PreviewSync } from './PreviewSync';
import { DesignModeToggle } from './DesignModeToggle';

interface VisualEditorPanelProps {
  projectId: string;
  previewUrl: string | null;
  onApplyChanges: (changes: Array<{ property: string; value: string }>) => Promise<void>;
  onSaveText: (newText: string) => Promise<void>;
  onUploadImage: (file: File) => Promise<string>;
  onSwapImage: (newUrl: string) => Promise<void>;
}

/**
 * Visual Editor Panel - main container for the visual design mode
 * Integrates preview iframe with selection overlay and style controls
 */
export function VisualEditorPanel({
  projectId,
  previewUrl,
  onApplyChanges,
  onSaveText,
  onUploadImage,
  onSwapImage,
}: VisualEditorPanelProps) {
  const { isDesignMode, selectedElement, isSyncing } = useVisualEditor();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleElementSelect = useCallback(() => {
    // Could add analytics or other side effects here
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Header with mode toggle */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Preview</h2>
          {isSyncing && (
            <span className="text-sm text-slate-500 animate-pulse">Syncing...</span>
          )}
        </div>
        <DesignModeToggle />
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Preview pane */}
        <div className="flex-1 relative" ref={containerRef}>
          {previewUrl ? (
            <>
              {/* Preview iframe */}
              <iframe
                ref={iframeRef}
                src={previewUrl}
                className={`w-full h-full border-0 ${isDesignMode ? 'pointer-events-auto' : ''}`}
                title="App Preview"
              />

              {/* Selection overlay */}
              {isDesignMode && <SelectionOverlay containerRef={containerRef} />}

              {/* Preview sync handler */}
              <PreviewSync
                projectId={projectId}
                iframeRef={iframeRef}
                onElementSelect={handleElementSelect}
              />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-slate-900">
              <div className="text-center">
                <div className="text-6xl mb-4">📱</div>
                <p className="text-slate-600 dark:text-slate-400 mb-2">No preview available</p>
                <p className="text-sm text-slate-500">Generate your app to see the preview</p>
              </div>
            </div>
          )}
        </div>

        {/* Style controls sidebar (only in design mode) */}
        {isDesignMode && (
          <div className="w-80 border-l border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 overflow-y-auto">
            <div className="p-4 space-y-4">
              {/* Style controls */}
              <StyleControls projectId={projectId} onApplyChanges={onApplyChanges} />

              {/* Text editor (only for text elements) */}
              {selectedElement?.type === 'text' && <TextEditor onSave={onSaveText} />}

              {/* Image upload (only for image elements) */}
              {selectedElement?.type === 'image' && (
                <ImageUpload
                  projectId={projectId}
                  onUpload={onUploadImage}
                  onSwap={onSwapImage}
                />
              )}

              {/* Element info */}
              {selectedElement && (
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4">
                  <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    Element Info
                  </h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Type</dt>
                      <dd className="text-slate-900 dark:text-white font-medium">
                        {selectedElement.type}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-500">ID</dt>
                      <dd className="text-slate-900 dark:text-white font-mono text-xs">
                        {selectedElement.id.slice(0, 12)}...
                      </dd>
                    </div>
                    {selectedElement.path && (
                      <div>
                        <dt className="text-slate-500 mb-1">Path</dt>
                        <dd className="text-slate-900 dark:text-white font-mono text-xs break-all">
                          {selectedElement.path}:{selectedElement.line}
                        </dd>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Size</dt>
                      <dd className="text-slate-900 dark:text-white font-mono">
                        {Math.round(selectedElement.bounds.width)} ×{' '}
                        {Math.round(selectedElement.bounds.height)}
                      </dd>
                    </div>
                  </dl>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default VisualEditorPanel;
