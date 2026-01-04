import * as React from 'react';
import { cn } from '../utils/cn';
import { Button, type ButtonProps } from '../components/Button';

export interface ConnectGitHubButtonProps extends Omit<ButtonProps, 'onClick'> {
  onConnect: () => void | Promise<void>;
  isConnected?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const ConnectGitHubButton = React.forwardRef<HTMLButtonElement, ConnectGitHubButtonProps>(
  (
    {
      className,
      onConnect,
      isConnected = false,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      isLoading,
      children,
      ...props
    },
    ref
  ) => {
    const [internalLoading, setInternalLoading] = React.useState(false);

    const handleClick = async () => {
      try {
        setInternalLoading(true);
        await onConnect();
      } catch (error) {
        console.error('GitHub connection error:', error);
      } finally {
        setInternalLoading(false);
      }
    };

    const loading = isLoading || internalLoading;

    if (isConnected) {
      return (
        <Button
          ref={ref}
          variant="secondary"
          size={size}
          className={cn(fullWidth && 'w-full', className)}
          disabled
          {...props}
        >
          <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          Connected to GitHub
        </Button>
      );
    }

    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        onClick={handleClick}
        isLoading={loading}
        className={cn(
          fullWidth && 'w-full',
          variant === 'primary' && 'bg-gray-900 hover:bg-gray-800 focus-visible:ring-gray-900',
          className
        )}
        {...props}
      >
        {!loading && (
          <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path
              fillRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              clipRule="evenodd"
            />
          </svg>
        )}
        {children || 'Connect GitHub'}
      </Button>
    );
  }
);

ConnectGitHubButton.displayName = 'ConnectGitHubButton';
