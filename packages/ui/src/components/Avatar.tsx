import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils/cn';

const avatarVariants = cva(
  'inline-flex items-center justify-center rounded-full bg-gray-200 font-medium text-gray-600',
  {
    variants: {
      size: {
        sm: 'h-8 w-8 text-xs',
        md: 'h-10 w-10 text-sm',
        lg: 'h-12 w-12 text-base',
        xl: 'h-16 w-16 text-lg',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  src?: string;
  alt?: string;
  fallback?: string;
}

export function Avatar({ className, size, src, alt, fallback, ...props }: AvatarProps) {
  const [imageError, setImageError] = React.useState(false);

  const initials = React.useMemo(() => {
    if (fallback) return fallback;
    if (alt) {
      return alt
        .split(' ')
        .map((word) => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return '?';
  }, [fallback, alt]);

  return (
    <div
      className={cn(avatarVariants({ size }), className)}
      role="img"
      aria-label={alt || 'Avatar'}
      {...props}
    >
      {src && !imageError ? (
        <img
          src={src}
          alt={alt || 'Avatar'}
          className="h-full w-full rounded-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <span className="select-none">{initials}</span>
      )}
    </div>
  );
}
