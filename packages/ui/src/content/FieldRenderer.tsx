/**
 * FieldRenderer Component
 *
 * Renders the appropriate input component based on attribute type and UI hints.
 * Maps attribute definitions to form inputs for content management.
 */

import React from 'react';
import type { FieldRendererProps, ContentAttribute } from './types';

export const FieldRenderer: React.FC<FieldRendererProps> = ({
  attribute,
  value,
  onChange,
  error,
  disabled = false,
  className = '',
}) => {
  const handleChange = (newValue: unknown) => {
    if (onChange && !disabled && !attribute.readOnly) {
      onChange(newValue);
    }
  };

  const baseInputClass = `
    w-full px-3 py-2
    border rounded-md
    bg-white dark:bg-gray-800
    text-gray-900 dark:text-white
    placeholder-gray-400 dark:placeholder-gray-500
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
    disabled:opacity-50 disabled:cursor-not-allowed
    ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
  `;

  const renderField = () => {
    const uiComponent = attribute.uiComponent || inferUIComponent(attribute);

    switch (uiComponent) {
      case 'text':
        return (
          <input
            type="text"
            value={String(value ?? '')}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={attribute.placeholder}
            disabled={disabled || attribute.readOnly}
            maxLength={attribute.validation?.maxLength}
            className={baseInputClass}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={String(value ?? '')}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={attribute.placeholder}
            disabled={disabled || attribute.readOnly}
            maxLength={attribute.validation?.maxLength}
            rows={4}
            className={`${baseInputClass} resize-y min-h-[100px]`}
          />
        );

      case 'richtext':
        return (
          <textarea
            value={String(value ?? '')}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={attribute.placeholder}
            disabled={disabled || attribute.readOnly}
            rows={8}
            className={`${baseInputClass} resize-y min-h-[200px] font-mono text-sm`}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value !== undefined && value !== null ? Number(value) : ''}
            onChange={(e) => handleChange(e.target.value ? Number(e.target.value) : null)}
            placeholder={attribute.placeholder}
            disabled={disabled || attribute.readOnly}
            min={attribute.validation?.min}
            max={attribute.validation?.max}
            className={baseInputClass}
          />
        );

      case 'currency':
        return (
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              value={value !== undefined && value !== null ? Number(value) : ''}
              onChange={(e) => handleChange(e.target.value ? Number(e.target.value) : null)}
              placeholder={attribute.placeholder || '0.00'}
              disabled={disabled || attribute.readOnly}
              min={0}
              step={0.01}
              className={`${baseInputClass} pl-7`}
            />
          </div>
        );

      case 'select':
        return (
          <select
            value={String(value ?? '')}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled || attribute.readOnly}
            className={baseInputClass}
          >
            <option value="">Select {attribute.displayName || attribute.name}...</option>
            {attribute.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'multiselect':
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2">
            {attribute.options?.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedValues.includes(opt.value)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      handleChange([...selectedValues, opt.value]);
                    } else {
                      handleChange(selectedValues.filter((v: string) => v !== opt.value));
                    }
                  }}
                  disabled={disabled || attribute.readOnly}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{opt.label}</span>
              </label>
            ))}
          </div>
        );

      case 'toggle':
        return (
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => handleChange(e.target.checked)}
              disabled={disabled || attribute.readOnly}
              className="sr-only peer"
            />
            <div className="
              w-11 h-6 rounded-full
              bg-gray-200 dark:bg-gray-700
              peer-checked:bg-blue-600
              peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800
              peer-disabled:opacity-50 peer-disabled:cursor-not-allowed
              after:content-[''] after:absolute after:top-0.5 after:left-[2px]
              after:bg-white after:border-gray-300 after:border after:rounded-full
              after:h-5 after:w-5 after:transition-all
              peer-checked:after:translate-x-full peer-checked:after:border-white
            " />
          </label>
        );

      case 'date':
        return (
          <input
            type="date"
            value={formatDateForInput(value as string)}
            onChange={(e) => handleChange(e.target.value ? new Date(e.target.value).toISOString() : null)}
            disabled={disabled || attribute.readOnly}
            className={baseInputClass}
          />
        );

      case 'datetime':
        return (
          <input
            type="datetime-local"
            value={formatDateTimeForInput(value as string)}
            onChange={(e) => handleChange(e.target.value ? new Date(e.target.value).toISOString() : null)}
            disabled={disabled || attribute.readOnly}
            className={baseInputClass}
          />
        );

      case 'image':
        return (
          <div className="space-y-2">
            <input
              type="url"
              value={String(value ?? '')}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={attribute.placeholder || 'https://example.com/image.jpg'}
              disabled={disabled || attribute.readOnly}
              className={baseInputClass}
            />
            {typeof value === 'string' && value.startsWith('http') && (
              <div className="mt-2">
                <img
                  src={value}
                  alt="Preview"
                  className="w-24 h-24 object-cover rounded-md border border-gray-200 dark:border-gray-700"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
        );

      case 'color':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="color"
              value={String(value ?? '#000000')}
              onChange={(e) => handleChange(e.target.value)}
              disabled={disabled || attribute.readOnly}
              className="w-10 h-10 rounded cursor-pointer"
            />
            <input
              type="text"
              value={String(value ?? '')}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="#000000"
              pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
              disabled={disabled || attribute.readOnly}
              className={`${baseInputClass} w-28 font-mono uppercase`}
            />
          </div>
        );

      case 'json':
        return (
          <textarea
            value={typeof value === 'string' ? value : JSON.stringify(value ?? {}, null, 2)}
            onChange={(e) => {
              try {
                handleChange(JSON.parse(e.target.value));
              } catch {
                // Allow invalid JSON during editing
                handleChange(e.target.value);
              }
            }}
            placeholder={attribute.placeholder || '{\n  \n}'}
            disabled={disabled || attribute.readOnly}
            rows={6}
            className={`${baseInputClass} font-mono text-sm`}
          />
        );

      case 'hidden':
        return null;

      default:
        return (
          <input
            type="text"
            value={String(value ?? '')}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={attribute.placeholder}
            disabled={disabled || attribute.readOnly}
            className={baseInputClass}
          />
        );
    }
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {renderField()}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {attribute.description && !error && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{attribute.description}</p>
      )}
    </div>
  );
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Infer UI component from attribute type and name
 */
function inferUIComponent(attr: ContentAttribute): string {
  // Check name patterns first
  const nameLower = attr.name.toLowerCase();

  if (nameLower.includes('password') || nameLower.includes('secret')) {
    return 'text'; // Would be 'password' if we had it
  }

  if (nameLower.includes('email')) {
    return 'text';
  }

  if (nameLower.includes('url') || nameLower.includes('link') || nameLower.includes('website')) {
    return 'text';
  }

  if (nameLower.includes('image') || nameLower.includes('photo') || nameLower.includes('avatar') || nameLower.includes('logo')) {
    return 'image';
  }

  if (nameLower.includes('color') || nameLower.includes('colour')) {
    return 'color';
  }

  if (nameLower.includes('description') || nameLower.includes('body') || nameLower.includes('content') || nameLower.includes('bio')) {
    return 'textarea';
  }

  if (nameLower.includes('price') || nameLower.includes('cost') || nameLower.includes('amount') || nameLower.includes('fee')) {
    return 'currency';
  }

  if (nameLower.endsWith('at') && (nameLower.includes('created') || nameLower.includes('updated') || nameLower.includes('deleted'))) {
    return 'datetime';
  }

  if (nameLower.includes('date')) {
    return 'date';
  }

  // Check type
  switch (attr.type) {
    case 'boolean':
      return 'toggle';
    case 'number':
      return 'number';
    case 'list':
      return attr.options ? 'multiselect' : 'json';
    case 'map':
      return 'json';
    default:
      return attr.options ? 'select' : 'text';
  }
}

/**
 * Format date for date input
 */
function formatDateForInput(isoString: string | undefined | null): string {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    return date.toISOString().split('T')[0];
  } catch {
    return '';
  }
}

/**
 * Format datetime for datetime-local input
 */
function formatDateTimeForInput(isoString: string | undefined | null): string {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    return date.toISOString().slice(0, 16);
  } catch {
    return '';
  }
}

// ============================================================================
// DISPLAY RENDERER (for read-only views)
// ============================================================================

export interface FieldDisplayProps {
  attribute: ContentAttribute;
  value: unknown;
  className?: string;
}

export const FieldDisplay: React.FC<FieldDisplayProps> = ({
  attribute,
  value,
  className = '',
}) => {
  const renderValue = () => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400 italic">Not set</span>;
    }

    const uiComponent = attribute.uiComponent || inferUIComponent(attribute);

    switch (uiComponent) {
      case 'toggle':
        return (
          <span className={`
            inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
            ${value ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}
          `}>
            {value ? 'Yes' : 'No'}
          </span>
        );

      case 'color':
        return (
          <div className="flex items-center space-x-2">
            <div
              className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600"
              style={{ backgroundColor: String(value) }}
            />
            <span className="font-mono text-sm">{String(value)}</span>
          </div>
        );

      case 'image':
        if (typeof value === 'string' && value.startsWith('http')) {
          return (
            <img
              src={value}
              alt={attribute.displayName || attribute.name}
              className="w-16 h-16 object-cover rounded"
            />
          );
        }
        return <span className="text-sm">{String(value)}</span>;

      case 'currency':
        return (
          <span className="font-medium">
            ${Number(value).toFixed(2)}
          </span>
        );

      case 'date':
      case 'datetime':
        try {
          const date = new Date(String(value));
          return (
            <span>
              {uiComponent === 'date'
                ? date.toLocaleDateString()
                : date.toLocaleString()}
            </span>
          );
        } catch {
          return <span>{String(value)}</span>;
        }

      case 'select':
        const option = attribute.options?.find((o) => o.value === value);
        return <span>{option?.label || String(value)}</span>;

      case 'multiselect':
        if (Array.isArray(value)) {
          return (
            <div className="flex flex-wrap gap-1">
              {value.map((v, i) => {
                const opt = attribute.options?.find((o) => o.value === v);
                return (
                  <span
                    key={i}
                    className="inline-flex px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-xs"
                  >
                    {opt?.label || v}
                  </span>
                );
              })}
            </div>
          );
        }
        return <span>{String(value)}</span>;

      case 'json':
        return (
          <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-2 rounded overflow-auto max-h-32">
            {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
          </pre>
        );

      case 'textarea':
      case 'richtext':
        return (
          <p className="text-sm whitespace-pre-wrap line-clamp-3">
            {String(value)}
          </p>
        );

      default:
        return <span>{String(value)}</span>;
    }
  };

  return <div className={className}>{renderValue()}</div>;
};
