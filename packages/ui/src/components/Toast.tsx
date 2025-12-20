import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils/cn';

const toastVariants = cva(
  'pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-lg border p-4 shadow-lg transition-all',
  {
    variants: {
      variant: {
        default: 'bg-white border-gray-200',
        success: 'bg-green-50 border-green-200',
        error: 'bg-red-50 border-red-200',
        warning: 'bg-yellow-50 border-yellow-200',
        info: 'bg-blue-50 border-blue-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

export interface ToastProps extends VariantProps<typeof toastVariants> {
  title: string;
  description?: string;
  onClose?: () => void;
}

export function Toast({ title, description, variant, onClose }: ToastProps) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(toastVariants({ variant }))}
    >
      <div className="flex-1">
        <div className="font-semibold text-gray-900">{title}</div>
        {description && (
          <div className="mt-1 text-sm text-gray-600">{description}</div>
        )}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="flex-shrink-0 rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400"
          aria-label="Close"
        >
          <svg
            className="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

// Toast Container and Provider for managing multiple toasts
export interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="pointer-events-none fixed top-0 right-0 z-50 flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:flex-col md:max-w-[420px]">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          title={toast.title}
          description={toast.description}
          variant={toast.variant}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  );
}

// Hook for managing toasts
export function useToast() {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: Toast = { ...toast, id };
      setToasts((prev) => [...prev, newToast]);

      const duration = toast.duration || 5000;
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);

      return id;
    },
    []
  );

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}
