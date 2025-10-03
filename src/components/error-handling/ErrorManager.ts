import { ErrorType, ErrorInfo } from './ErrorDisplay';

// Error detection patterns for automatic classification
const ERROR_PATTERNS: Array<{
  pattern: RegExp | string;
  type: ErrorType;
  code?: string;
  retryable: boolean;
}> = [
  // Network errors
  {
    pattern:
      /fetch.*failed|network.*error|connection.*refused|failed.*to.*fetch/i,
    type: 'network',
    retryable: true,
  },
  {
    pattern: /ECONNREFUSED|ENOTFOUND|ETIMEDOUT/i,
    type: 'network',
    retryable: true,
  },
  {
    pattern: /ERR_NETWORK|ERR_INTERNET_DISCONNECTED/i,
    type: 'network',
    retryable: true,
  },

  // Timeout errors
  { pattern: /timeout|timed.*out/i, type: 'timeout', retryable: true },
  {
    pattern: /request.*timeout|response.*timeout/i,
    type: 'timeout',
    retryable: true,
  },

  // Permission/CORS errors
  {
    pattern: /CORS|cross.*origin|blocked.*by.*CORS/i,
    type: 'permission',
    retryable: false,
  },
  {
    pattern: /403|forbidden|unauthorized|401/i,
    type: 'permission',
    retryable: false,
  },

  // Configuration errors
  {
    pattern: /config.*not.*found|invalid.*config|failed.*to.*load.*config/i,
    type: 'config',
    retryable: true,
  },
  {
    pattern: /JSON.*parse|syntax.*error.*unexpected/i,
    type: 'config',
    retryable: false,
  },
  {
    pattern: /config\.json.*404|config\.json.*not.*found/i,
    type: 'config',
    code: 'CONFIG_404',
    retryable: true,
  },

  // Dependency errors
  {
    pattern: /dependency.*not.*found|module.*not.*found|script.*not.*loaded/i,
    type: 'dependency',
    retryable: true,
  },
  {
    pattern: /404.*\.js|404.*\.css|resource.*not.*found/i,
    type: 'dependency',
    retryable: true,
  },

  // Validation errors
  {
    pattern: /validation.*failed|invalid.*data|schema.*error/i,
    type: 'validation',
    retryable: false,
  },
  {
    pattern: /cards.*not.*found|no.*cards.*available/i,
    type: 'validation',
    code: 'NO_CARDS',
    retryable: false,
  },
];

// HTTP status code to error type mapping
const HTTP_STATUS_ERRORS: Record<
  number,
  { type: ErrorType; retryable: boolean }
> = {
  400: { type: 'validation', retryable: false },
  401: { type: 'permission', retryable: false },
  403: { type: 'permission', retryable: false },
  404: { type: 'config', retryable: true },
  408: { type: 'timeout', retryable: true },
  429: { type: 'network', retryable: true },
  500: { type: 'network', retryable: true },
  502: { type: 'network', retryable: true },
  503: { type: 'network', retryable: true },
  504: { type: 'timeout', retryable: true },
};

// Retry configuration
export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2, // Double each time
  jitter: true, // Add randomness
};

// Error context for debugging
export interface ErrorContext {
  url?: string;
  method?: string;
  timestamp: Date;
  userAgent: string;
  widgetId?: string;
  isolationMode?: 'shadow' | 'namespace';
  retryAttempt?: number;
  previousErrors?: ErrorInfo[];
}

class ErrorManager {
  private retryConfig: RetryConfig;
  private errorHistory: ErrorInfo[] = [];
  private maxHistorySize = 50;

  constructor(retryConfig: Partial<RetryConfig> = {}) {
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  }

  // Classify error based on message and context
  classifyError(
    error: Error | string,
    context: Partial<ErrorContext> = {}
  ): ErrorInfo {
    const message = typeof error === 'string' ? error : error.message;
    const stack = typeof error === 'object' ? error.stack : undefined;

    // Check for HTTP status codes in fetch errors
    let httpStatus: number | undefined;
    const statusMatch = message.match(/(\d{3})/);
    if (statusMatch) {
      httpStatus = parseInt(statusMatch[1]);
    }

    // Classify by HTTP status first
    let errorType: ErrorType = 'unknown';
    let retryable = true;
    let code: string | undefined;

    if (httpStatus && HTTP_STATUS_ERRORS[httpStatus]) {
      const statusInfo = HTTP_STATUS_ERRORS[httpStatus];
      errorType = statusInfo.type;
      retryable = statusInfo.retryable;
      code = `HTTP_${httpStatus}`;
    } else {
      // Classify by error message patterns
      for (const pattern of ERROR_PATTERNS) {
        const regex =
          typeof pattern.pattern === 'string'
            ? new RegExp(pattern.pattern, 'i')
            : pattern.pattern;

        if (regex.test(message)) {
          errorType = pattern.type;
          retryable = pattern.retryable;
          code = pattern.code;
          break;
        }
      }
    }

    const errorInfo: ErrorInfo = {
      type: errorType,
      code,
      message,
      details: stack,
      retryable,
      timestamp: new Date(),
      context: {
        ...context,
        userAgent: navigator.userAgent,
        httpStatus,
      },
    };

    // Add to history
    this.addToHistory(errorInfo);

    return errorInfo;
  }

  // Calculate delay for exponential backoff with jitter
  calculateDelay(attempt: number): number {
    let delay =
      this.retryConfig.baseDelay *
      Math.pow(this.retryConfig.backoffMultiplier, attempt);
    delay = Math.min(delay, this.retryConfig.maxDelay);

    if (this.retryConfig.jitter) {
      // Add ±25% jitter to prevent thundering herd
      const jitterRange = delay * 0.25;
      delay += (Math.random() - 0.5) * 2 * jitterRange;
    }

    return Math.max(delay, 100); // Minimum 100ms delay
  }

  // Retry function with exponential backoff
  async retryOperation<T>(
    operation: () => Promise<T>,
    context: Partial<ErrorContext> = {}
  ): Promise<T> {
    let lastError: ErrorInfo | null = null;

    for (let attempt = 0; attempt < this.retryConfig.maxAttempts; attempt++) {
      try {
        // Add attempt info to context
        const attemptContext = {
          ...context,
          retryAttempt: attempt,
          previousErrors: lastError ? [lastError] : undefined,
        };

        console.log(
          `🔄 Attempt ${attempt + 1}/${this.retryConfig.maxAttempts}`,
          attemptContext
        );

        const result = await operation();

        if (attempt > 0) {
          console.log(`✅ Operation succeeded after ${attempt + 1} attempts`);
        }

        return result;
      } catch (error) {
        const errorInfo = this.classifyError(error as Error, context);
        errorInfo.retryCount = attempt;
        lastError = errorInfo;

        console.error(`❌ Attempt ${attempt + 1} failed:`, errorInfo);

        // If this is the last attempt or error is not retryable, throw
        if (
          attempt === this.retryConfig.maxAttempts - 1 ||
          !errorInfo.retryable
        ) {
          console.error(
            `🚨 Operation failed permanently after ${attempt + 1} attempts`
          );
          throw errorInfo;
        }

        // Wait before retrying
        const delay = this.calculateDelay(attempt);
        console.log(`⏳ Waiting ${delay}ms before retry ${attempt + 2}`);
        await this.sleep(delay);
      }
    }

    // This should never be reached, but TypeScript requires it
    throw lastError;
  }

  // Enhanced fetch with automatic retry
  async fetchWithRetry(
    url: string,
    options: RequestInit = {},
    context: Partial<ErrorContext> = {}
  ): Promise<Response> {
    const fetchContext: ErrorContext = {
      url,
      method: options.method || 'GET',
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      ...context,
    };

    return this.retryOperation(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Request timeout - server did not respond in time');
        }
        throw error;
      }
    }, fetchContext);
  }

  // Load JSON with retry
  async loadJSONWithRetry<T = any>(
    url: string,
    context: Partial<ErrorContext> = {}
  ): Promise<T> {
    const response = await this.fetchWithRetry(url, {}, context);

    try {
      const data = await response.json();
      console.log(`📦 Successfully loaded JSON from ${url}`);
      return data;
    } catch (error) {
      throw new Error(`Failed to parse JSON response from ${url}: ${error}`);
    }
  }

  // Load script/CSS with retry
  async loadResourceWithRetry(
    url: string,
    type: 'script' | 'css',
    context: Partial<ErrorContext> = {}
  ): Promise<void> {
    return this.retryOperation(
      () => {
        return new Promise((resolve, reject) => {
          let element: HTMLScriptElement | HTMLLinkElement;

          if (type === 'script') {
            element = document.createElement('script');
            element.src = url;
            element.async = true;
          } else {
            element = document.createElement('link');
            element.rel = 'stylesheet';
            element.href = url;
          }

          element.onload = () => {
            console.log(`✅ Successfully loaded ${type} from ${url}`);
            resolve();
          };

          element.onerror = () => {
            reject(new Error(`Failed to load ${type} resource: ${url}`));
          };

          document.head.appendChild(element);
        });
      },
      { ...context, url, method: 'GET' }
    );
  }

  // Add error to history
  private addToHistory(error: ErrorInfo) {
    this.errorHistory.unshift(error);
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(0, this.maxHistorySize);
    }
  }

  // Get error statistics
  getErrorStats() {
    const stats = {
      total: this.errorHistory.length,
      byType: {} as Record<ErrorType, number>,
      recentErrors: this.errorHistory.slice(0, 5),
      lastError: this.errorHistory[0] || null,
    };

    this.errorHistory.forEach(error => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
    });

    return stats;
  }

  // Clear error history
  clearHistory() {
    this.errorHistory = [];
  }

  // Sleep utility
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Debug logging for development
  enableDebugLogging() {
    const originalConsoleError = console.error;
    console.error = (...args) => {
      originalConsoleError.apply(console, args);

      // Store detailed error information for debugging
      if (
        args[0] &&
        typeof args[0] === 'string' &&
        args[0].includes('E1 Calculator')
      ) {
        const debugInfo = {
          timestamp: new Date().toISOString(),
          message: args[0],
          data: args.slice(1),
          stack: new Error().stack,
          errorHistory: this.getErrorStats(),
        };

        // Store in sessionStorage for debugging
        try {
          const { getSessionStorageSafe } = await import('@/lib/safe-storage');
          const ss = getSessionStorageSafe();
          const existingLogs = JSON.parse(ss.getItem('e1-debug-logs') || '[]');
          existingLogs.unshift(debugInfo);
          ss.setItem(
            'e1-debug-logs',
            JSON.stringify(existingLogs.slice(0, 20))
          );
        } catch {
          // Ignore storage errors
        }
      }
    };
  }
}

// Create singleton instance
export const errorManager = new ErrorManager();

// Utility functions for common use cases
export const withRetry = errorManager.retryOperation.bind(errorManager);
export const fetchWithRetry = errorManager.fetchWithRetry.bind(errorManager);
export const loadJSONWithRetry =
  errorManager.loadJSONWithRetry.bind(errorManager);
export const loadResourceWithRetry =
  errorManager.loadResourceWithRetry.bind(errorManager);

// Export for external configuration
export { ErrorManager };
