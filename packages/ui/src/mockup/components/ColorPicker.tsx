import React, { useState, useCallback } from 'react';
import { cn } from '../../utils/cn';

export interface ColorPickerProps {
  label?: string;
  value: string;
  onChange: (color: string) => void;
  presetColors?: string[];
  disabled?: boolean;
  className?: string;
}

const DEFAULT_PRESETS = [
  '#0EA5E9', '#22C55E', '#F97316', '#8B5CF6', '#EC4899',
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1',
];

function isValidHex(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

export function ColorPicker({
  label,
  value,
  onChange,
  presetColors = DEFAULT_PRESETS,
  disabled = false,
  className,
}: ColorPickerProps) {
  const [inputValue, setInputValue] = useState(value);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    if (isValidHex(newValue)) {
      onChange(newValue);
    }
  }, [onChange]);

  const handleColorPickerChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.toUpperCase();
    setInputValue(newValue);
    onChange(newValue);
  }, [onChange]);

  const handlePresetClick = useCallback((color: string) => {
    if (!disabled) {
      setInputValue(color);
      onChange(color);
    }
  }, [disabled, onChange]);

  return (
    <div className={cn('color-picker space-y-2', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">{label}</label>
      )}

      <div className="flex items-center gap-3">
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={handleColorPickerChange}
            disabled={disabled}
            className={cn(
              'w-10 h-10 rounded-lg cursor-pointer border-2 border-gray-200',
              'hover:border-gray-300 transition-colors',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            aria-label={label || 'Color picker'}
          />
        </div>

        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          disabled={disabled}
          placeholder="#000000"
          className={cn(
            'flex-1 px-3 py-2 border border-gray-300 rounded-md',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            'font-mono text-sm uppercase',
            disabled && 'bg-gray-100 cursor-not-allowed'
          )}
          aria-label={`${label || 'Color'} hex value`}
        />

        <div
          className="w-10 h-10 rounded-lg border-2 border-gray-200"
          style={{ backgroundColor: isValidHex(inputValue) ? inputValue : value }}
          aria-label="Color preview"
        />
      </div>

      {presetColors.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {presetColors.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => handlePresetClick(color)}
              disabled={disabled}
              className={cn(
                'w-6 h-6 rounded-md border-2 transition-all',
                color === value ? 'border-gray-900 scale-110' : 'border-gray-200 hover:border-gray-400',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
              style={{ backgroundColor: color }}
              aria-label={`Select color ${color}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
