import * as React from 'react';
import { cn } from '../utils/cn';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/Card';
import { Avatar } from '../components/Avatar';
import { Badge } from '../components/Badge';
import type { GitHubConnectionData } from './types';

export interface GitHubConnectionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  connection: GitHubConnectionData | null;
  isLoading?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export const GitHubConnectionCard = React.forwardRef<HTMLDivElement, GitHubConnectionCardProps>(
  ({ className, connection, isLoading, onConnect, onDisconnect, ...props }, ref) => {
    const getStatusVariant = (status: GitHubConnectionData['status']) => {
      switch (status) {
        case 'active':
          return 'success';
        case 'expired':
          return 'warning';
        case 'revoked':
        case 'disconnected':
          return 'error';
        default:
          return 'default';
      }
    };

    const getStatusLabel = (status: GitHubConnectionData['status']) => {
      switch (status) {
        case 'active':
          return 'Connected';
        case 'expired':
          return 'Token Expired';
        case 'revoked':
          return 'Access Revoked';
        case 'disconnected':
          return 'Disconnected';
        default:
          return 'Unknown';
      }
    };

    return (
      <Card ref={ref} className={cn(className)} {...props}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <svg
                className="h-6 w-6 text-gray-700"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <CardTitle>GitHub</CardTitle>
                <CardDescription>
                  {connection ? 'Version control integration' : 'Connect to sync your project'}
                </CardDescription>
              </div>
            </div>
            {connection && (
              <Badge variant={getStatusVariant(connection.status)}>
                {getStatusLabel(connection.status)}
              </Badge>
            )}
          </div>
        </CardHeader>

        {connection ? (
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {connection.githubAvatarUrl && (
                  <Avatar
                    src={connection.githubAvatarUrl}
                    alt={connection.githubUsername}
                    size="md"
                  />
                )}
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">
                    @{connection.githubUsername}
                  </span>
                  {connection.githubEmail && (
                    <span className="text-xs text-gray-500">{connection.githubEmail}</span>
                  )}
                  <span className="text-xs text-gray-400 mt-1">
                    Connected {new Date(connection.connectedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              {onDisconnect && (
                <button
                  onClick={onDisconnect}
                  disabled={isLoading}
                  className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  Disconnect
                </button>
              )}
            </div>

            {connection.scopes.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-2">Permissions:</p>
                <div className="flex flex-wrap gap-1">
                  {connection.scopes.map((scope) => (
                    <Badge key={scope} variant="default" className="text-xs">
                      {scope}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        ) : (
          <CardContent>
            <div className="text-center py-4">
              <p className="text-sm text-gray-600 mb-4">
                Connect your GitHub account to enable automatic version control for your project.
              </p>
              {onConnect && (
                <button
                  onClick={onConnect}
                  disabled={isLoading}
                  className="inline-flex items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                      Connecting...
                    </>
                  ) : (
                    <>
                      <svg
                        className="-ml-1 mr-2 h-4 w-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Connect GitHub
                    </>
                  )}
                </button>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    );
  }
);

GitHubConnectionCard.displayName = 'GitHubConnectionCard';
