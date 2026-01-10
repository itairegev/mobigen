/**
 * ResourceForm Component
 *
 * Auto-generates forms from resource definition.
 * Groups fields by section and handles validation display.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type {
  ResourceFormProps,
  ContentAttribute,
  ContentItem,
} from './types';
import { FieldRenderer } from './FieldRenderer';

export const ResourceForm: React.FC<ResourceFormProps> = ({
  resource,
  item,
  mode,
  onSubmit,
  onCancel,
  isSubmitting = false,
  errors = {},
  className = '',
}) => {
  // Initialize form data from item or defaults
  const [formData, setFormData] = useState<Record<string, unknown>>(() => {
    if (item) {
      return { ...item };
    }
    // Initialize with default values
    const defaults: Record<string, unknown> = {};
    resource.attributes.forEach((attr) => {
      if (attr.type === 'boolean') {
        defaults[attr.name] = false;
      } else if (attr.type === 'list') {
        defaults[attr.name] = [];
      } else if (attr.type === 'map') {
        defaults[attr.name] = {};
      }
    });
    return defaults;
  });

  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());

  // Update form data when item changes (for edit mode)
  useEffect(() => {
    if (item) {
      setFormData({ ...item });
    }
  }, [item]);

  // Group attributes by section
  const sections = useMemo(() => {
    const grouped = new Map<string, ContentAttribute[]>();

    resource.attributes
      .filter((attr) => !attr.hidden && attr.uiComponent !== 'hidden')
      .sort((a, b) => (a.order ?? 100) - (b.order ?? 100))
      .forEach((attr) => {
        const section = attr.section || 'General';
        if (!grouped.has(section)) {
          grouped.set(section, []);
        }
        grouped.get(section)!.push(attr);
      });

    return grouped;
  }, [resource.attributes]);

  // Handle field change
  const handleFieldChange = useCallback((name: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setTouched((prev) => new Set(prev).add(name));

    // Clear local error when field is modified
    if (localErrors[name]) {
      setLocalErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  }, [localErrors]);

  // Validate a single field
  const validateField = useCallback((attr: ContentAttribute, value: unknown): string | null => {
    // Required check
    if (attr.required && (value === undefined || value === null || value === '')) {
      return `${attr.displayName || attr.name} is required`;
    }

    // Skip validation for empty optional fields
    if (value === undefined || value === null || value === '') {
      return null;
    }

    const validation = attr.validation;
    if (!validation) return null;

    // String validations
    if (typeof value === 'string') {
      if (validation.minLength && value.length < validation.minLength) {
        return `Minimum ${validation.minLength} characters required`;
      }
      if (validation.maxLength && value.length > validation.maxLength) {
        return `Maximum ${validation.maxLength} characters allowed`;
      }
      if (validation.pattern) {
        const regex = new RegExp(validation.pattern);
        if (!regex.test(value)) {
          return validation.patternMessage || 'Invalid format';
        }
      }
    }

    // Number validations
    if (typeof value === 'number') {
      if (validation.min !== undefined && value < validation.min) {
        return `Minimum value is ${validation.min}`;
      }
      if (validation.max !== undefined && value > validation.max) {
        return `Maximum value is ${validation.max}`;
      }
    }

    return null;
  }, []);

  // Validate entire form
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    resource.attributes.forEach((attr) => {
      if (attr.hidden || attr.readOnly) return;

      const error = validateField(attr, formData[attr.name]);
      if (error) {
        newErrors[attr.name] = error;
      }
    });

    setLocalErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [resource.attributes, formData, validateField]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'view' || !onSubmit) return;

    // Mark all fields as touched
    setTouched(new Set(resource.attributes.map((a) => a.name)));

    // Validate
    if (!validateForm()) {
      return;
    }

    // Extract only data fields (remove id and metadata for create)
    const submitData: Record<string, unknown> = {};
    resource.attributes.forEach((attr) => {
      if (!attr.readOnly && !attr.hidden) {
        submitData[attr.name] = formData[attr.name];
      }
    });

    await onSubmit(submitData);
  };

  // Merge local and server errors
  const allErrors = useMemo(() => {
    return { ...localErrors, ...errors };
  }, [localErrors, errors]);

  // Get field error (only show if touched)
  const getFieldError = (name: string): string | undefined => {
    if (!touched.has(name) && !errors[name]) return undefined;
    return allErrors[name];
  };

  const isViewMode = mode === 'view';

  return (
    <form onSubmit={handleSubmit} className={`space-y-8 ${className}`}>
      {Array.from(sections.entries()).map(([sectionName, attrs]) => (
        <div key={sectionName} className="space-y-6">
          {/* Section header */}
          {sections.size > 1 && (
            <div className="border-b border-gray-200 dark:border-gray-700 pb-2">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {sectionName}
              </h3>
            </div>
          )}

          {/* Section fields */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {attrs.map((attr) => {
              // Determine column span
              const isFullWidth =
                attr.uiComponent === 'textarea' ||
                attr.uiComponent === 'richtext' ||
                attr.uiComponent === 'json' ||
                attr.uiComponent === 'multiselect';

              return (
                <div
                  key={attr.name}
                  className={isFullWidth ? 'sm:col-span-2' : ''}
                >
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {attr.displayName || formatDisplayName(attr.name)}
                    {attr.required && !isViewMode && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </label>

                  <FieldRenderer
                    attribute={attr}
                    value={formData[attr.name]}
                    onChange={(value) => handleFieldChange(attr.name, value)}
                    error={getFieldError(attr.name)}
                    disabled={isViewMode || isSubmitting}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Form actions */}
      {!isViewMode && (
        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="
                px-4 py-2 text-sm font-medium
                text-gray-700 dark:text-gray-300
                bg-white dark:bg-gray-800
                border border-gray-300 dark:border-gray-600
                rounded-md shadow-sm
                hover:bg-gray-50 dark:hover:bg-gray-700
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="
              px-4 py-2 text-sm font-medium
              text-white
              bg-blue-600 hover:bg-blue-700
              border border-transparent
              rounded-md shadow-sm
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center space-x-2
            "
          >
            {isSubmitting && <Spinner />}
            <span>
              {isSubmitting
                ? 'Saving...'
                : mode === 'create'
                ? `Create ${resource.singularName}`
                : 'Save Changes'}
            </span>
          </button>
        </div>
      )}
    </form>
  );
};

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

const Spinner: React.FC = () => (
  <svg
    className="animate-spin h-4 w-4"
    xmlns="http://www.w3.org/2000/svg"
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

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatDisplayName(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}
