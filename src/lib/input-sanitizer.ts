import DOMPurify from 'dompurify';
import validator from 'validator';

// Initialize DOMPurify for both server and client environments
let purify: any;

if (typeof window !== 'undefined') {
  // Client-side: use the global window object
  purify = DOMPurify(window);
} else {
  // Server-side: create a minimal DOM environment
  // We'll use a simpler approach without jsdom for now
  purify = DOMPurify();
}

/**
 * Input Sanitization Utility for Energiaykkönen Calculator
 *
 * This module provides comprehensive input sanitization to prevent:
 * - XSS (Cross-Site Scripting) attacks
 * - HTML injection
 * - Script injection
 * - SQL injection (additional protection beyond Supabase ORM)
 */

export interface SanitizationOptions {
  allowHTML?: boolean;
  maxLength?: number;
  trimWhitespace?: boolean;
  normalizeEmail?: boolean;
  escapeSQL?: boolean;
}

export interface SanitizedResult<T = string> {
  value: T;
  wasModified: boolean;
  originalLength: number;
  finalLength: number;
}

/**
 * Sanitize a single string input
 */
export function sanitizeString(
  input: string | null | undefined,
  options: SanitizationOptions = {}
): SanitizedResult<string> {
  if (input === null || input === undefined) {
    return {
      value: '',
      wasModified: false,
      originalLength: 0,
      finalLength: 0,
    };
  }

  const originalValue = String(input);
  const originalLength = originalValue.length;
  let sanitized = originalValue;
  let wasModified = false;

  // Trim whitespace
  if (options.trimWhitespace !== false) {
    const trimmed = sanitized.trim();
    if (trimmed !== sanitized) {
      sanitized = trimmed;
      wasModified = true;
    }
  }

  // Remove/escape HTML content
  if (!options.allowHTML) {
    const htmlCleaned = purify.sanitize(sanitized, { ALLOWED_TAGS: [] });
    if (htmlCleaned !== sanitized) {
      sanitized = htmlCleaned;
      wasModified = true;
    }
  }

  // Normalize email if specified
  if (options.normalizeEmail && validator.isEmail(sanitized)) {
    const normalized = validator.normalizeEmail(sanitized) || sanitized;
    if (normalized !== sanitized) {
      sanitized = normalized;
      wasModified = true;
    }
  }

  // Escape potential SQL injection characters (extra protection)
  if (options.escapeSQL) {
    const sqlEscaped = sanitized
      .replace(/'/g, "''") // Escape single quotes
      .replace(/;/g, '\\;') // Escape semicolons
      .replace(/--/g, '\\--') // Escape SQL comments
      .replace(/\/\*/g, '\\/\\*') // Escape SQL block comments
      .replace(/\*\//g, '\\*\\/');

    if (sqlEscaped !== sanitized) {
      sanitized = sqlEscaped;
      wasModified = true;
    }
  }

  // Apply length limit
  if (options.maxLength && sanitized.length > options.maxLength) {
    sanitized = sanitized.substring(0, options.maxLength);
    wasModified = true;
  }

  return {
    value: sanitized,
    wasModified,
    originalLength,
    finalLength: sanitized.length,
  };
}

/**
 * Sanitize an object with string properties
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  fieldOptions: Partial<Record<keyof T, SanitizationOptions>> = {}
): {
  sanitized: T;
  modificationReport: Record<keyof T, SanitizedResult>;
} {
  const sanitized = { ...obj } as T;
  const modificationReport = {} as Record<keyof T, SanitizedResult>;

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      const options = fieldOptions[key as keyof T] || {};
      const result = sanitizeString(value, options);

      sanitized[key as keyof T] = result.value as T[keyof T];
      modificationReport[key as keyof T] = result;
    }
  }

  return { sanitized, modificationReport };
}

/**
 * Pre-configured sanitization for common input types
 */
export const sanitizers = {
  /**
   * For name fields (firstName, lastName)
   */
  name: (input: string) =>
    sanitizeString(input, {
      maxLength: 50,
      trimWhitespace: true,
      allowHTML: false,
    }),

  /**
   * For email fields
   */
  email: (input: string) =>
    sanitizeString(input, {
      maxLength: 255,
      trimWhitespace: true,
      allowHTML: false,
      normalizeEmail: true,
    }),

  /**
   * For phone numbers
   */
  phone: (input: string) =>
    sanitizeString(input, {
      maxLength: 20,
      trimWhitespace: true,
      allowHTML: false,
    }),

  /**
   * For address fields
   */
  address: (input: string) =>
    sanitizeString(input, {
      maxLength: 255,
      trimWhitespace: true,
      allowHTML: false,
    }),

  /**
   * For message/comment fields
   */
  message: (input: string) =>
    sanitizeString(input, {
      maxLength: 1000,
      trimWhitespace: true,
      allowHTML: false,
    }),

  /**
   * For general text fields
   */
  text: (input: string) =>
    sanitizeString(input, {
      maxLength: 100,
      trimWhitespace: true,
      allowHTML: false,
    }),

  /**
   * For numeric string fields
   */
  numeric: (input: string) => {
    const result = sanitizeString(input, {
      trimWhitespace: true,
      allowHTML: false,
    });

    // Additional validation for numeric content
    const numericOnly = result.value.replace(/[^\d.,+-]/g, '');

    return {
      ...result,
      value: numericOnly,
      wasModified: result.wasModified || numericOnly !== result.value,
    };
  },
};

/**
 * Validate that a string doesn't contain potentially dangerous patterns
 */
export function detectSuspiciousPatterns(input: string): {
  isSuspicious: boolean;
  patterns: string[];
  severity: 'low' | 'medium' | 'high';
} {
  const dangerousPatterns = [
    // XSS patterns
    {
      pattern: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      severity: 'high' as const,
      name: 'script_tag',
    },
    {
      pattern: /javascript:/gi,
      severity: 'high' as const,
      name: 'javascript_protocol',
    },
    {
      pattern: /on\w+\s*=/gi,
      severity: 'medium' as const,
      name: 'event_handler',
    },
    {
      pattern: /<iframe\b[^>]*>/gi,
      severity: 'high' as const,
      name: 'iframe_tag',
    },
    {
      pattern: /<object\b[^>]*>/gi,
      severity: 'high' as const,
      name: 'object_tag',
    },
    {
      pattern: /<embed\b[^>]*>/gi,
      severity: 'high' as const,
      name: 'embed_tag',
    },

    // SQL injection patterns
    {
      pattern:
        /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b)/gi,
      severity: 'high' as const,
      name: 'sql_keyword',
    },
    {
      pattern: /('\s*(OR|AND)\s*')|('\s*;\s*)/gi,
      severity: 'medium' as const,
      name: 'sql_injection',
    },

    // Command injection
    {
      pattern: /(\||&|;|\$\(|\`)/g,
      severity: 'medium' as const,
      name: 'command_injection',
    },

    // Path traversal
    { pattern: /\.\.\//g, severity: 'medium' as const, name: 'path_traversal' },
  ];

  const foundPatterns: string[] = [];
  let maxSeverity: 'low' | 'medium' | 'high' = 'low';

  for (const { pattern, severity, name } of dangerousPatterns) {
    if (pattern.test(input)) {
      foundPatterns.push(name);
      if (
        severity === 'high' ||
        (severity === 'medium' && maxSeverity === 'low')
      ) {
        maxSeverity = severity;
      }
    }
  }

  return {
    isSuspicious: foundPatterns.length > 0,
    patterns: foundPatterns,
    severity: maxSeverity,
  };
}

/**
 * Enhanced rate limiting helper
 */
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipIf?: (ip: string) => boolean;
}

export class RateLimiter {
  private store = new Map<string, { count: number; resetTime: number }>();

  constructor(private config: RateLimitConfig) {}

  check(identifier: string): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
  } {
    const now = Date.now();
    const key = identifier;

    if (this.config.skipIf?.(identifier)) {
      return {
        allowed: true,
        remaining: this.config.maxRequests,
        resetTime: now + this.config.windowMs,
      };
    }

    const current = this.store.get(key);

    if (!current || now > current.resetTime) {
      // First request or window expired
      const newEntry = { count: 1, resetTime: now + this.config.windowMs };
      this.store.set(key, newEntry);
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: newEntry.resetTime,
      };
    }

    if (current.count >= this.config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: current.resetTime,
      };
    }

    // Increment count
    current.count++;
    this.store.set(key, current);

    return {
      allowed: true,
      remaining: this.config.maxRequests - current.count,
      resetTime: current.resetTime,
    };
  }

  reset(identifier: string): void {
    this.store.delete(identifier);
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.store.entries()) {
      if (now > value.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

/**
 * Security audit logging
 */
export interface SecurityEvent {
  type: 'suspicious_input' | 'rate_limit_exceeded' | 'validation_failed';
  severity: 'low' | 'medium' | 'high';
  ip: string;
  userAgent?: string;
  timestamp: Date;
  details: Record<string, any>;
}

export class SecurityLogger {
  private events: SecurityEvent[] = [];

  log(event: Omit<SecurityEvent, 'timestamp'>): void {
    this.events.push({
      ...event,
      timestamp: new Date(),
    });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn(`🚨 Security Event [${event.severity}]:`, event);
    }

    // In production, you'd want to send this to a logging service
    // like Sentry, LogRocket, or a custom security monitoring system
  }

  getEvents(since?: Date): SecurityEvent[] {
    if (!since) {
      return [...this.events];
    }
    return this.events.filter(event => event.timestamp >= since);
  }

  clearEvents(): void {
    this.events = [];
  }
}

// Export singleton instances
export const securityLogger = new SecurityLogger();
export const defaultRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10,
});
