'use client';

import { useState, useCallback } from 'react';
import { useVisualEditor } from '../../hooks/useVisualEditor';
import { ColorPicker } from './ColorPicker';

interface StyleControlsProps {
  projectId: string;
  onApplyChanges: (changes: StyleChange[]) => Promise<void>;
}

interface StyleChange {
  property: string;
  value: string;
}

const FONT_SIZES = ['12', '14', '16', '18', '20', '24', '28', '32', '36', '48', '64'];
const FONT_WEIGHTS = [
  { label: 'Light', value: '300' },
  { label: 'Normal', value: '400' },
  { label: 'Medium', value: '500' },
  { label: 'Semibold', value: '600' },
  { label: 'Bold', value: '700' },
];
const SPACING_OPTIONS = ['0', '4', '8', '12', '16', '20', '24', '32', '40', '48'];

/**
 * Style Controls Panel - edit styles of selected element
 */
export function StyleControls({ projectId, onApplyChanges }: StyleControlsProps) {
  const { selectedElement, applyChange, isDesignMode } = useVisualEditor();
  const [isApplying, setIsApplying] = useState(false);

  // Local style state for real-time preview
  const [localStyles, setLocalStyles] = useState<Record<string, string>>({});

  // Initialize local styles when element is selected
  const currentStyles = selectedElement
    ? { ...selectedElement.styles, ...localStyles }
    : {};

  const handleStyleChange = useCallback(
    (property: string, value: string) => {
      if (!selectedElement) return;

      setLocalStyles((prev) => ({ ...prev, [property]: value }));

      // Record the change for undo/redo
      applyChange({
        type: 'style',
        elementId: selectedElement.id,
        elementPath: selectedElement.path,
        before: { [property]: selectedElement.styles[property] || '' },
        after: { [property]: value },
        description: `Changed ${property} to ${value}`,
      });
    },
    [selectedElement, applyChange]
  );

  const handleApplyAll = useCallback(async () => {
    if (!selectedElement || Object.keys(localStyles).length === 0) return;

    setIsApplying(true);
    try {
      const changes = Object.entries(localStyles).map(([property, value]) => ({
        property,
        value,
      }));
      await onApplyChanges(changes);
      setLocalStyles({});
    } catch (error) {
      console.error('Failed to apply changes:', error);
    } finally {
      setIsApplying(false);
    }
  }, [selectedElement, localStyles, onApplyChanges]);

  if (!isDesignMode) return null;

  if (!selectedElement) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">
          Style Controls
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
          Click on an element to edit its styles
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Style Controls
          </h3>
          {Object.keys(localStyles).length > 0 && (
            <button
              onClick={handleApplyAll}
              disabled={isApplying}
              className="px-3 py-1 bg-primary-500 text-white text-sm rounded hover:bg-primary-600 disabled:opacity-50"
            >
              {isApplying ? 'Applying...' : 'Apply Changes'}
            </button>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-1 truncate" title={selectedElement.path}>
          {selectedElement.path}:{selectedElement.line}
        </p>
      </div>

      <div className="p-4 space-y-6 max-h-[500px] overflow-y-auto">
        {/* Typography Section */}
        {(selectedElement.type === 'text' || selectedElement.type === 'button') && (
          <section>
            <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-3">
              Typography
            </h4>
            <div className="space-y-3">
              {/* Font Size */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Font Size
                </label>
                <select
                  value={currentStyles.fontSize || '16'}
                  onChange={(e) => handleStyleChange('fontSize', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm"
                >
                  {FONT_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size}px
                    </option>
                  ))}
                </select>
              </div>

              {/* Font Weight */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Font Weight
                </label>
                <select
                  value={currentStyles.fontWeight || '400'}
                  onChange={(e) => handleStyleChange('fontWeight', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm"
                >
                  {FONT_WEIGHTS.map((weight) => (
                    <option key={weight.value} value={weight.value}>
                      {weight.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Text Color */}
              <ColorPicker
                label="Text Color"
                value={currentStyles.color || '#000000'}
                onChange={(color) => handleStyleChange('color', color)}
              />
            </div>
          </section>
        )}

        {/* Colors Section */}
        <section>
          <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-3">
            Colors
          </h4>
          <div className="space-y-3">
            <ColorPicker
              label="Background Color"
              value={currentStyles.backgroundColor || '#FFFFFF'}
              onChange={(color) => handleStyleChange('backgroundColor', color)}
            />

            {selectedElement.type !== 'text' && (
              <ColorPicker
                label="Border Color"
                value={currentStyles.borderColor || '#E5E7EB'}
                onChange={(color) => handleStyleChange('borderColor', color)}
              />
            )}
          </div>
        </section>

        {/* Spacing Section */}
        <section>
          <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-3">
            Spacing
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {/* Padding */}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Padding
              </label>
              <select
                value={currentStyles.padding || '16'}
                onChange={(e) => handleStyleChange('padding', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm"
              >
                {SPACING_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}px
                  </option>
                ))}
              </select>
            </div>

            {/* Margin */}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Margin
              </label>
              <select
                value={currentStyles.margin || '0'}
                onChange={(e) => handleStyleChange('margin', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm"
              >
                {SPACING_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}px
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Border Section */}
        <section>
          <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-3">
            Border
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {/* Border Width */}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Width
              </label>
              <select
                value={currentStyles.borderWidth || '0'}
                onChange={(e) => handleStyleChange('borderWidth', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm"
              >
                {['0', '1', '2', '3', '4'].map((size) => (
                  <option key={size} value={size}>
                    {size}px
                  </option>
                ))}
              </select>
            </div>

            {/* Border Radius */}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Radius
              </label>
              <select
                value={currentStyles.borderRadius || '0'}
                onChange={(e) => handleStyleChange('borderRadius', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm"
              >
                {['0', '4', '8', '12', '16', '24', '9999'].map((size) => (
                  <option key={size} value={size}>
                    {size === '9999' ? 'Full' : `${size}px`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default StyleControls;
