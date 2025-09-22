/**
 * Sentry utility functions for client-side error tracking and user feedback
 */

import * as Sentry from '@sentry/nextjs';

/**
 * Capture an exception with additional context
 */
export function captureException(
  error: Error,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, any>;
    level?: 'error' | 'warning' | 'info';
    user?: {
      id?: string;
      email?: string;
      username?: string;
    };
  }
) {
  Sentry.withScope(scope => {
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    if (context?.level) {
      scope.setLevel(context.level);
    }

    if (context?.user) {
      scope.setUser(context.user);
    }

    Sentry.captureException(error);
  });
}

/**
 * Capture a message with context
 */
export function captureMessage(
  message: string,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, any>;
    level?: 'error' | 'warning' | 'info';
  }
) {
  Sentry.withScope(scope => {
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    const level = context?.level || 'info';
    scope.setLevel(level);

    Sentry.captureMessage(message, level);
  });
}

/**
 * Set user context for all future events
 */
export function setUser(user: {
  id?: string;
  email?: string;
  username?: string;
  [key: string]: any;
}) {
  Sentry.setUser(user);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  category?: string,
  level?: 'info' | 'debug' | 'warning' | 'error',
  data?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    message,
    category: category || 'custom',
    level: level || 'info',
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Track form submission errors
 */
export function trackFormError(
  formName: string,
  error: Error,
  formData?: Record<string, any>
) {
  captureException(error, {
    tags: {
      component: 'form',
      formName,
      errorType: 'form_submission',
    },
    extra: {
      formData: formData ? sanitizeFormData(formData) : undefined,
    },
  });
}

/**
 * Track API call errors
 */
export function trackApiError(
  endpoint: string,
  error: Error,
  requestData?: any,
  responseData?: any
) {
  captureException(error, {
    tags: {
      component: 'api-client',
      endpoint,
      errorType: 'api_call',
    },
    extra: {
      requestData: requestData ? sanitizeApiData(requestData) : undefined,
      responseData: responseData ? sanitizeApiData(responseData) : undefined,
    },
  });
}

/**
 * Track calculation errors
 */
export function trackCalculationError(
  calculationType: string,
  error: Error,
  inputData?: Record<string, any>
) {
  captureException(error, {
    tags: {
      component: 'calculation',
      calculationType,
      errorType: 'calculation_error',
    },
    extra: {
      inputData,
    },
  });
}

/**
 * Track PDF generation errors
 */
export function trackPdfError(error: Error, pdfData?: Record<string, any>) {
  captureException(error, {
    tags: {
      component: 'pdf-generation',
      errorType: 'pdf_error',
    },
    extra: {
      pdfData: pdfData ? sanitizePdfData(pdfData) : undefined,
    },
  });
}

/**
 * Sanitize form data to remove sensitive information
 */
function sanitizeFormData(data: Record<string, any>): Record<string, any> {
  const sanitized = { ...data };

  // Remove sensitive fields
  const sensitiveFields = ['password', 'ssn', 'creditCard', 'token'];
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });

  // Partially mask email and phone
  if (sanitized.sahkoposti || sanitized.email) {
    const email = sanitized.sahkoposti || sanitized.email;
    sanitized.email = email.substring(0, 3) + '***@' + email.split('@')[1];
  }

  if (sanitized.puhelinnumero || sanitized.phone) {
    const phone = sanitized.puhelinnumero || sanitized.phone;
    sanitized.phone =
      phone.substring(0, 3) + '***' + phone.substring(phone.length - 2);
  }

  return sanitized;
}

/**
 * Sanitize API data
 */
function sanitizeApiData(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeApiData);
  }

  const sanitized = { ...data };
  const sensitiveFields = ['password', 'token', 'key', 'secret'];

  Object.keys(sanitized).forEach(key => {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeApiData(sanitized[key]);
    }
  });

  return sanitized;
}

/**
 * Sanitize PDF data
 */
function sanitizePdfData(data: Record<string, any>): Record<string, any> {
  const sanitized = { ...data };

  // Keep calculation results but sanitize personal info
  if (sanitized.customerName) {
    sanitized.customerName = sanitized.customerName.substring(0, 3) + '***';
  }

  if (sanitized.customerEmail) {
    const email = sanitized.customerEmail;
    sanitized.customerEmail =
      email.substring(0, 3) + '***@' + email.split('@')[1];
  }

  return sanitized;
}
