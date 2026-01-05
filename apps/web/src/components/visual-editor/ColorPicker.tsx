'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

const PRESET_COLORS = [
  '#000000', '#FFFFFF', '#F3F4F6', '#E5E7EB', '#9CA3AF', '#6B7280', '#374151', '#1F2937',
  '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#22C55E', '#10B981', '#14B8A6',
  '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF', '#EC4899',
];

/**
 * Color Picker component with preset colors and custom color input
 */
export function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customColor, setCustomColor] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Update custom color when value changes externally
  useEffect(() => {
    setCustomColor(value);
  }, [value]);

  const handleCustomColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setCustomColor(newColor);
    onChange(newColor);
  }, [onChange]);

  const handlePresetClick = useCallback((color: string) => {
    setCustomColor(color);
    onChange(color);
    setIsOpen(false);
  }, [onChange]);

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
          {label}
        </label>
      )}

      {/* Color button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-slate-300 dark:hover:border-slate-600 transition-colors w-full"
      >
        <div
          className="w-6 h-6 rounded border border-slate-200 dark:border-slate-600"
          style={{ backgroundColor: value }}
        />
        <span className="font-mono text-sm text-slate-700 dark:text-slate-300 uppercase">
          {value}
        </span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 p-3 z-50">
          {/* Preset colors */}
          <div className="grid grid-cols-8 gap-1 mb-3">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => handlePresetClick(color)}
                className={`w-6 h-6 rounded border transition-transform hover:scale-110 ${
                  value === color
                    ? 'border-primary-500 ring-2 ring-primary-500/50'
                    : 'border-slate-200 dark:border-slate-600'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>

          {/* Custom color input */}
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={customColor}
              onChange={handleCustomColorChange}
              className="w-10 h-10 rounded cursor-pointer border-none"
            />
            <input
              type="text"
              value={customColor}
              onChange={(e) => {
                const newValue = e.target.value;
                if (/^#[0-9A-Fa-f]{0,6}$/.test(newValue)) {
                  setCustomColor(newValue);
                  if (newValue.length === 7) {
                    onChange(newValue);
                  }
                }
              }}
              className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-sm uppercase bg-white dark:bg-slate-900"
              placeholder="#000000"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default ColorPicker;
