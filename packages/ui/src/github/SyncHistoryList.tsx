import * as React from 'react';
import { cn } from '../utils/cn';
import { Badge } from '../components/Badge';
import type { SyncHistoryEntry } from './types';

export interface SyncHistoryListProps extends React.HTMLAttributes<HTMLDivElement> {
  entries: SyncHistoryEntry[];
  isLoading?: boolean;
  emptyMessage?: string;
  maxEntries?: number;
  onEntryClick?: (entry: SyncHistoryEntry) => void;
  repoUrl?: string;
}

export const SyncHistoryList = React.forwardRef<HTMLDivElement, SyncHistoryListProps>(
  (
    {
      className,
      entries,
      isLoading,
      emptyMessage = 'No sync history yet',
      maxEntries = 10,
      onEntryClick,
      repoUrl,
      ...props
    },
    ref
  ) => {
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

    const formatDuration = (ms: number): string => {
      if (ms < 1000) return `${ms}ms`;
      if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
      return `${(ms / 60000).toFixed(1)}m`;
    };

    const getPhaseIcon = (phase: string) => {
      switch (phase) {
        case 'design':
          return (
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          );
        case 'generation':
          return (
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          );
        case 'validation':
          return (
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          );
        case 'fix':
          return (
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          );
        case 'manual':
          return (
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                clipRule="evenodd"
              />
            </svg>
          );
        default:
          return (
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-7.536 5.879a1 1 0 001.415 0 3 3 0 014.242 0 1 1 0 001.415-1.415 5 5 0 00-7.072 0 1 1 0 000 1.415z"
                clipRule="evenodd"
              />
            </svg>
          );
      }
    };

    const displayEntries = entries.slice(0, maxEntries);

    if (isLoading) {
      return (
        <div ref={ref} className={cn('space-y-3', className)} {...props}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                <div className="h-4 w-4 bg-gray-200 rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (displayEntries.length === 0) {
      return (
        <div
          ref={ref}
          className={cn('text-center py-8 text-gray-500 text-sm', className)}
          {...props}
        >
          {emptyMessage}
        </div>
      );
    }

    return (
      <div ref={ref} className={cn('space-y-2', className)} {...props}>
        {displayEntries.map((entry) => {
          const totalFiles =
            entry.filesAdded.length + entry.filesModified.length + entry.filesDeleted.length;

          return (
            <div
              key={entry.id}
              onClick={() => onEntryClick?.(entry)}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors',
                onEntryClick && 'cursor-pointer'
              )}
            >
              <div
                className={cn(
                  'flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full',
                  entry.status === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                )}
              >
                {entry.status === 'success' ? (
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="default" className="text-xs capitalize">
                        {entry.phase}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(entry.createdAt)}
                      </span>
                    </div>

                    {entry.commitMessage && (
                      <p className="text-sm text-gray-900 line-clamp-2 mb-1">
                        {entry.commitMessage}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      {entry.branch && (
                        <div className="flex items-center gap-1">
                          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 16 16">
                            <path
                              fillRule="evenodd"
                              d="M11.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122V6A2.5 2.5 0 0110 8.5H6a1 1 0 00-1 1v1.128a2.251 2.251 0 11-1.5 0V5.372a2.25 2.25 0 111.5 0v1.836A2.492 2.492 0 016 7h4a1 1 0 001-1v-.628A2.25 2.25 0 019.5 3.25zM4.25 12a.75.75 0 100 1.5.75.75 0 000-1.5zM3.5 3.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0z"
                            />
                          </svg>
                          <code className="font-mono">{entry.branch}</code>
                        </div>
                      )}

                      {entry.commitSha && (
                        <div className="flex items-center gap-1">
                          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 16 16">
                            <path
                              fillRule="evenodd"
                              d="M10.5 7.75a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zm1.43.75a4.002 4.002 0 01-7.86 0H.75a.75.75 0 110-1.5h3.32a4.001 4.001 0 017.86 0h3.32a.75.75 0 110 1.5h-3.32z"
                            />
                          </svg>
                          {repoUrl ? (
                            <a
                              href={`${repoUrl}/commit/${entry.commitSha}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="font-mono hover:text-blue-600 hover:underline"
                            >
                              {formatCommitSha(entry.commitSha)}
                            </a>
                          ) : (
                            <code className="font-mono">{formatCommitSha(entry.commitSha)}</code>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-1">
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>{totalFiles} file{totalFiles !== 1 ? 's' : ''}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>{formatDuration(entry.durationMs)}</span>
                      </div>
                    </div>

                    {entry.status === 'failed' && entry.errorMessage && (
                      <p className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
                        {entry.errorMessage}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {entries.length > maxEntries && (
          <div className="text-center text-xs text-gray-500 pt-2">
            Showing {maxEntries} of {entries.length} entries
          </div>
        )}
      </div>
    );
  }
);

SyncHistoryList.displayName = 'SyncHistoryList';
