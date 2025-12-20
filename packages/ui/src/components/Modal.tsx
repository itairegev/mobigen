import * as React from 'react';
import { cn } from '../utils/cn';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ open, onClose, children, className }: ModalProps) {
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div
        className={cn(
          'relative z-50 w-full max-w-lg rounded-lg bg-white p-6 shadow-xl',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export interface ModalHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export function ModalHeader({ className, ...props }: ModalHeaderProps) {
  return (
    <div
      className={cn('mb-4 flex flex-col space-y-1.5', className)}
      {...props}
    />
  );
}

export interface ModalTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export function ModalTitle({ className, ...props }: ModalTitleProps) {
  return (
    <h2
      className={cn('text-lg font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  );
}

export interface ModalDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export function ModalDescription({ className, ...props }: ModalDescriptionProps) {
  return (
    <p
      className={cn('text-sm text-gray-500', className)}
      {...props}
    />
  );
}

export interface ModalContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export function ModalContent({ className, ...props }: ModalContentProps) {
  return (
    <div
      className={cn('mb-4', className)}
      {...props}
    />
  );
}

export interface ModalFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export function ModalFooter({ className, ...props }: ModalFooterProps) {
  return (
    <div
      className={cn('flex justify-end space-x-2', className)}
      {...props}
    />
  );
}
