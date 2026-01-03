export interface ApiError extends Error {
  status?: number;
  code?: string;
  details?: Record<string, unknown>;
}

export interface NetworkError extends Error {
  isNetworkError: true;
  timeout?: boolean;
}

export interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  backoffMultiplier?: number;
  retryCondition?: (error: any) => boolean;
}

export class ErrorHandler {
  static createApiError(
    message: string,
    status?: number,
    code?: string,
    details?: Record<string, unknown>
  ): ApiError {
    const error = new Error(message) as ApiError;
    error.status = status;
    error.code = code;
    error.details = details;
    return error;
  }

  static createNetworkError(message: string, timeout = false): NetworkError {
    const error = new Error(message) as NetworkError;
    error.isNetworkError = true;
    error.timeout = timeout;
    return error;
  }

  static isNetworkError(error: any): error is NetworkError {
    return error && error.isNetworkError === true;
  }

  static isApiError(error: any): error is ApiError {
    return error && typeof error.status === 'number';
  }

  static isRetryableError(error: any): boolean {
    // Network errors are retryable
    if (this.isNetworkError(error)) {
      return true;
    }

    // Server errors (5xx) are retryable
    if (this.isApiError(error) && error.status) {
      return error.status >= 500 && error.status < 600;
    }

    // Rate limiting (429) is retryable
    if (this.isApiError(error) && error.status === 429) {
      return true;
    }

    return false;
  }

  static getErrorMessage(error: any): string {
    if (this.isNetworkError(error)) {
      return error.timeout 
        ? 'Request timed out. Please check your connection.'
        : 'Network error. Please check your internet connection.';
    }

    if (this.isApiError(error)) {
      switch (error.status) {
        case 400:
          return 'Invalid request. Please try again.';
        case 401:
          return 'Authentication required. Please log in.';
        case 403:
          return 'Access denied. You don\'t have permission.';
        case 404:
          return 'Content not found.';
        case 429:
          return 'Too many requests. Please wait a moment.';
        case 500:
          return 'Server error. Please try again later.';
        case 503:
          return 'Service unavailable. Please try again later.';
        default:
          return error.message || 'An error occurred. Please try again.';
      }
    }

    return error?.message || 'An unexpected error occurred.';
  }

  static async withRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      retryDelay = 1000,
      backoffMultiplier = 1.5,
      retryCondition = this.isRetryableError.bind(this),
    } = options;

    let lastError: any;
    let delay = retryDelay;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        // Don't retry on last attempt or if error is not retryable
        if (attempt === maxRetries || !retryCondition(error)) {
          break;
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= backoffMultiplier;
      }
    }

    throw lastError;
  }

  static logError(error: any, context?: string): void {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
    };

    if (this.isApiError(error)) {
      errorInfo['status'] = error.status;
      errorInfo['code'] = error.code;
      errorInfo['details'] = error.details;
    }

    if (this.isNetworkError(error)) {
      errorInfo['networkError'] = true;
      errorInfo['timeout'] = error.timeout;
    }

    console.error('Error logged:', errorInfo);

    // In production, you might want to send this to a logging service
    // if (__DEV__) {
    //   console.error('Error details:', errorInfo);
    // } else {
    //   // Send to analytics/logging service
    //   AnalyticsService.logError(errorInfo);
    // }
  }

  static handleApiResponse(response: Response): Response {
    if (!response.ok) {
      throw this.createApiError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        response.status.toString()
      );
    }
    return response;
  }

  static async safeJsonParse<T>(response: Response): Promise<T> {
    try {
      return await response.json();
    } catch (error) {
      throw this.createApiError(
        'Invalid JSON response',
        response.status,
        'INVALID_JSON'
      );
    }
  }
}

// Utility functions for common error handling patterns
export const handleError = (error: any, context?: string): never => {
  ErrorHandler.logError(error, context);
  throw error;
};

export const withErrorLogging = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: string
) => {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      ErrorHandler.logError(error, context);
      throw error;
    }
  };
};

export const isRetryableError = ErrorHandler.isRetryableError.bind(ErrorHandler);
export const getErrorMessage = ErrorHandler.getErrorMessage.bind(ErrorHandler);
export const withRetry = ErrorHandler.withRetry.bind(ErrorHandler);

export default ErrorHandler;