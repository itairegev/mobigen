'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useVisualEditor } from '../../hooks/useVisualEditor';

interface TextEditorProps {
  onSave: (newText: string) => Promise<void>;
}

/**
 * Direct Text Editor - inline editing for text elements
 */
export function TextEditor({ onSave }: TextEditorProps) {
  const { selectedElement, applyChange, isDesignMode } = useVisualEditor();
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset when element changes
  useEffect(() => {
    if (selectedElement?.type === 'text') {
      setEditText(selectedElement.content);
      setIsEditing(false);
    }
  }, [selectedElement]);

  // Focus textarea when editing starts
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = useCallback(() => {
    if (selectedElement?.type === 'text') {
      setIsEditing(true);
      setEditText(selectedElement.content);
    }
  }, [selectedElement]);

  const handleSave = useCallback(async () => {
    if (!selectedElement || editText === selectedElement.content) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      // Record the change
      applyChange({
        type: 'text',
        elementId: selectedElement.id,
        elementPath: selectedElement.path,
        before: { content: selectedElement.content },
        after: { content: editText },
        description: `Changed text from "${selectedElement.content.slice(0, 20)}..." to "${editText.slice(0, 20)}..."`,
      });

      await onSave(editText);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save text:', error);
    } finally {
      setIsSaving(false);
    }
  }, [selectedElement, editText, applyChange, onSave]);

  const handleCancel = useCallback(() => {
    if (selectedElement) {
      setEditText(selectedElement.content);
    }
    setIsEditing(false);
  }, [selectedElement]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Escape') {
        handleCancel();
      }
    },
    [handleSave, handleCancel]
  );

  if (!isDesignMode || selectedElement?.type !== 'text') {
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Text Content
          </h3>
          {!isEditing && (
            <button
              onClick={handleStartEdit}
              className="px-3 py-1 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded text-sm"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      <div className="p-4">
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              ref={textareaRef}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full h-32 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter text content..."
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Cmd/Ctrl + Enter to save, Esc to cancel
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded text-sm hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-3 py-1.5 bg-primary-500 text-white rounded text-sm hover:bg-primary-600 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            onClick={handleStartEdit}
            className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
              {selectedElement.content || '(empty)'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default TextEditor;
