import * as React from 'react';
import { cn } from '../utils/cn';

export interface LastSyncInfoProps extends React.HTMLAttributes<HTMLDivElement> {
  lastSyncAt: Date | null;
  commitSha?: string | null;
  branch?: string | null;
  repoUrl?: string;
  size?: 'sm' | 'md';
}

export const LastSyncInfo = React.forwardRef<HTMLDivElement, LastSyncInfoProps>(
  ({ className, lastSyncAt, commitSha, branch, repoUrl, size = 'md', ...props }, ref) => {
    const formatTimeAgo = (date: Date): string => {
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'just now';
      if (diffMins === 1) return '1 minute ago';
      if (diffMins < 60) return `${diffMins} minutes ago`;
      if (diffHours === 1) return '1 hour ago';
      if (diffHours < 24) return `${diffHours} hours ago`;
      if (diffDays === 1) return '1 day ago';
      if (diffDays < 7) return `${diffDays} days ago`;

      return date.toLocaleDateString();
    };

    const formatCommitSha = (sha: string): string => {
      return sha.substring(0, 7);
    };

    const sizeClasses = {
      sm: 'text-xs',
      md: 'text-sm',
    };

    if (!lastSyncAt) {
      return (
        <div
          ref={ref}
          className={cn('text-gray-500', sizeClasses[size], className)}
          {...props}
        >
          Never synced
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn('flex flex-col gap-1', sizeClasses[size], className)}
        {...props}
      >
        <div className="flex items-center gap-2 text-gray-600">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>Last synced {formatTimeAgo(lastSyncAt)}</span>
        </div>

        {(commitSha || branch) && (
          <div className="flex items-center gap-3 text-gray-500 ml-6">
            {branch && (
              <div className="flex items-center gap-1">
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 16 16">
                  <path
                    fillRule="evenodd"
                    d="M11.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122V6A2.5 2.5 0 0110 8.5H6a1 1 0 00-1 1v1.128a2.251 2.251 0 11-1.5 0V5.372a2.25 2.25 0 111.5 0v1.836A2.492 2.492 0 016 7h4a1 1 0 001-1v-.628A2.25 2.25 0 019.5 3.25zM4.25 12a.75.75 0 100 1.5.75.75 0 000-1.5zM3.5 3.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0z"
                  />
                </svg>
                <code className="font-mono">{branch}</code>
              </div>
            )}

            {commitSha && (
              <div className="flex items-center gap-1">
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 16 16">
                  <path
                    fillRule="evenodd"
                    d="M10.5 7.75a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zm1.43.75a4.002 4.002 0 01-7.86 0H.75a.75.75 0 110-1.5h3.32a4.001 4.001 0 017.86 0h3.32a.75.75 0 110 1.5h-3.32z"
                  />
                </svg>
                {repoUrl ? (
                  <a
                    href={`${repoUrl}/commit/${commitSha}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono hover:text-blue-600 hover:underline"
                  >
                    {formatCommitSha(commitSha)}
                  </a>
                ) : (
                  <code className="font-mono">{formatCommitSha(commitSha)}</code>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

LastSyncInfo.displayName = 'LastSyncInfo';
