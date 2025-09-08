/**
 * Simple in-memory rate limiter for API endpoints
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private readonly windowMs: number;
  private readonly maxRequests: number;
  
  constructor(windowMs: number = 60000, maxRequests: number = 10) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    
    // Cleanup expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }
  
  /**
   * Check if request is allowed
   */
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const entry = this.limits.get(identifier);
    
    if (!entry || entry.resetTime < now) {
      // Create new entry or reset expired one
      this.limits.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return true;
    }
    
    if (entry.count >= this.maxRequests) {
      return false;
    }
    
    entry.count++;
    return true;
  }
  
  /**
   * Get remaining requests for identifier
   */
  getRemaining(identifier: string): number {
    const entry = this.limits.get(identifier);
    if (!entry || entry.resetTime < Date.now()) {
      return this.maxRequests;
    }
    return Math.max(0, this.maxRequests - entry.count);
  }
  
  /**
   * Get reset time for identifier
   */
  getResetTime(identifier: string): number {
    const entry = this.limits.get(identifier);
    if (!entry || entry.resetTime < Date.now()) {
      return Date.now() + this.windowMs;
    }
    return entry.resetTime;
  }
  
  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (entry.resetTime < now) {
        this.limits.delete(key);
      }
    }
  }
}

// Export singleton instances for different endpoints
export const widgetBundleRateLimiter = new RateLimiter(
  parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute
  parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '10')  // 10 requests per minute
);

export const submitLeadRateLimiter = new RateLimiter(
  parseInt(process.env.SUBMIT_RATE_LIMIT_WINDOW_MS || '300000'), // 5 minutes
  parseInt(process.env.SUBMIT_RATE_LIMIT_MAX_REQUESTS || '5')     // 5 submissions per 5 minutes
);