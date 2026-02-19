/**
 * In-memory rate limiter for API protection
 * Limits requests based on IP address and endpoint
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
  blockedUntil?: number;
}

class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private readonly blockDurationMs: number;

  constructor(maxRequests: number = 5, windowMs: number = 60000, blockDurationMs: number = 300000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.blockDurationMs = blockDurationMs;

    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Check if a request should be rate limited
   * @param identifier - Unique identifier (IP address, userId, etc.)
   * @returns Object with allowed status and retry info
   */
  check(identifier: string): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    const entry = this.store.get(identifier);

    // Check if currently blocked
    if (entry?.blockedUntil && entry.blockedUntil > now) {
      return {
        allowed: false,
        retryAfter: Math.ceil((entry.blockedUntil - now) / 1000)
      };
    }

    // Reset window if expired
    if (!entry || now > entry.resetTime) {
      this.store.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return { allowed: true };
    }

    // Increment counter
    entry.count++;

    // Check if limit exceeded
    if (entry.count > this.maxRequests) {
      // Block for specified duration
      entry.blockedUntil = now + this.blockDurationMs;
      this.store.set(identifier, entry);

      return {
        allowed: false,
        retryAfter: Math.ceil(this.blockDurationMs / 1000)
      };
    }

    this.store.set(identifier, entry);
    return { allowed: true };
  }

  /**
   * Reset rate limit for a specific identifier
   */
  reset(identifier: string): void {
    this.store.delete(identifier);
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime && (!entry.blockedUntil || now > entry.blockedUntil)) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Get current limit status (for monitoring)
   */
  getStatus(identifier: string): { remaining: number; resetTime: number } {
    const entry = this.store.get(identifier);
    if (!entry) {
      return {
        remaining: this.maxRequests,
        resetTime: Date.now() + this.windowMs
      };
    }

    return {
      remaining: Math.max(0, this.maxRequests - entry.count),
      resetTime: entry.resetTime
    };
  }
}

// Export singleton instances for different use cases
export const submitInterestLimiter = new RateLimiter(
  5,  // 5 requests
  60000,  // per minute
  300000  // block for 5 minutes
);

export const aggressiveLimiter = new RateLimiter(
  3,
  60000,
  900000  // block for 15 minutes
);

export default RateLimiter;
