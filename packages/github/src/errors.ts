/**
 * GitHub Integration Error Classes
 */

/**
 * Base error class for GitHub operations
 */
export class GitHubError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'GitHubError';
  }
}

/**
 * Authentication error (invalid or expired token)
 */
export class GitHubAuthError extends GitHubError {
  constructor(message: string = 'GitHub authentication failed') {
    super(message, 'AUTH_ERROR', 401, false);
    this.name = 'GitHubAuthError';
  }
}

/**
 * Rate limit error (too many requests)
 */
export class GitHubRateLimitError extends GitHubError {
  constructor(public resetAt: Date) {
    super(
      `GitHub rate limit exceeded. Resets at ${resetAt.toISOString()}`,
      'RATE_LIMIT',
      429,
      true
    );
    this.name = 'GitHubRateLimitError';
  }
}

/**
 * Resource not found error
 */
export class GitHubNotFoundError extends GitHubError {
  constructor(resource: string) {
    super(`GitHub resource not found: ${resource}`, 'NOT_FOUND', 404, false);
    this.name = 'GitHubNotFoundError';
  }
}

/**
 * Conflict error (e.g., branch already exists)
 */
export class GitHubConflictError extends GitHubError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409, false);
    this.name = 'GitHubConflictError';
  }
}

/**
 * Permission denied error
 */
export class GitHubPermissionError extends GitHubError {
  constructor(message: string = 'Permission denied') {
    super(message, 'PERMISSION_DENIED', 403, false);
    this.name = 'GitHubPermissionError';
  }
}

/**
 * Invalid OAuth state error
 */
export class GitHubOAuthError extends GitHubError {
  constructor(message: string) {
    super(message, 'OAUTH_ERROR', 400, false);
    this.name = 'GitHubOAuthError';
  }
}

/**
 * Sync configuration error
 */
export class GitHubSyncConfigError extends GitHubError {
  constructor(message: string) {
    super(message, 'SYNC_CONFIG_ERROR', 400, false);
    this.name = 'GitHubSyncConfigError';
  }
}

/**
 * Convert Octokit error to GitHubError
 */
export function toGitHubError(error: unknown): GitHubError {
  if (error instanceof GitHubError) {
    return error;
  }

  // Handle Octokit RequestError
  const octokitError = error as {
    status?: number;
    message?: string;
    response?: {
      headers?: {
        'x-ratelimit-reset'?: string;
      };
    };
  };

  if (octokitError.status) {
    switch (octokitError.status) {
      case 401:
        return new GitHubAuthError(octokitError.message);
      case 403:
        // Check if it's a rate limit error
        if (octokitError.message?.includes('rate limit')) {
          const resetHeader = octokitError.response?.headers?.['x-ratelimit-reset'];
          const resetAt = resetHeader
            ? new Date(parseInt(resetHeader, 10) * 1000)
            : new Date(Date.now() + 60000);
          return new GitHubRateLimitError(resetAt);
        }
        return new GitHubPermissionError(octokitError.message);
      case 404:
        return new GitHubNotFoundError(octokitError.message || 'Unknown resource');
      case 409:
      case 422:
        return new GitHubConflictError(octokitError.message || 'Resource conflict');
      case 429:
        return new GitHubRateLimitError(new Date(Date.now() + 60000));
      default:
        return new GitHubError(
          octokitError.message || 'Unknown GitHub error',
          'UNKNOWN',
          octokitError.status,
          octokitError.status >= 500
        );
    }
  }

  // Generic error
  const message = error instanceof Error ? error.message : String(error);
  return new GitHubError(message, 'UNKNOWN', undefined, false);
}
