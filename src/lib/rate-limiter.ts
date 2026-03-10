/**
 * In-memory rate limiter using sliding window counter.
 * Tracks requests per IP within a time window.
 */

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

class RateLimiter {
    private store = new Map<string, RateLimitEntry>();
    private cleanupInterval: NodeJS.Timeout | null = null;

    constructor() {
        // Cleanup expired entries every 60 seconds
        if (typeof setInterval !== 'undefined') {
            this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
        }
    }

    /**
     * Check if a request is allowed.
     * @param key Unique identifier (e.g., IP address or IP:route)
     * @param maxRequests Maximum requests allowed in the window
     * @param windowMs Time window in milliseconds
     * @returns { allowed, remaining, resetIn }
     */
    check(key: string, maxRequests: number, windowMs: number): {
        allowed: boolean;
        remaining: number;
        resetIn: number;
    } {
        const now = Date.now();
        const entry = this.store.get(key);

        if (!entry || now > entry.resetAt) {
            this.store.set(key, { count: 1, resetAt: now + windowMs });
            return { allowed: true, remaining: maxRequests - 1, resetIn: windowMs };
        }

        entry.count++;
        const remaining = Math.max(0, maxRequests - entry.count);
        const resetIn = entry.resetAt - now;

        return {
            allowed: entry.count <= maxRequests,
            remaining,
            resetIn,
        };
    }

    private cleanup() {
        const now = Date.now();
        for (const [key, entry] of this.store.entries()) {
            if (now > entry.resetAt) {
                this.store.delete(key);
            }
        }
    }
}

// Singleton instance
const rateLimiter = new RateLimiter();
export default rateLimiter;

// Preset limits
export const RATE_LIMITS = {
    // General API: 60 requests per minute
    API: { maxRequests: 60, windowMs: 60 * 1000 },
    // Auth/Login: 10 attempts per minute (stricter)
    AUTH: { maxRequests: 10, windowMs: 60 * 1000 },
    // File upload: 10 uploads per minute
    UPLOAD: { maxRequests: 10, windowMs: 60 * 1000 },
    // Write operations (POST/PUT/DELETE): 30 per minute
    WRITE: { maxRequests: 30, windowMs: 60 * 1000 },
} as const;
