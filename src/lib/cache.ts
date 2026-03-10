/**
 * Simple in-memory cache with TTL support.
 * Suitable for single-instance Next.js deployments (RT system scale).
 */

interface CacheEntry<T> {
    data: T;
    expiresAt: number;
}

class MemoryCache {
    private store = new Map<string, CacheEntry<any>>();

    /**
     * Get cached value. Returns undefined if expired or not found.
     */
    get<T>(key: string): T | undefined {
        const entry = this.store.get(key);
        if (!entry) return undefined;

        if (Date.now() > entry.expiresAt) {
            this.store.delete(key);
            return undefined;
        }

        return entry.data as T;
    }

    /**
     * Set a value with TTL in milliseconds.
     */
    set<T>(key: string, data: T, ttlMs: number): void {
        this.store.set(key, {
            data,
            expiresAt: Date.now() + ttlMs,
        });
    }

    /**
     * Invalidate a specific key or keys matching a prefix.
     */
    invalidate(keyOrPrefix: string): void {
        if (this.store.has(keyOrPrefix)) {
            this.store.delete(keyOrPrefix);
        } else {
            // Prefix-based invalidation
            for (const key of this.store.keys()) {
                if (key.startsWith(keyOrPrefix)) {
                    this.store.delete(key);
                }
            }
        }
    }

    /**
     * Helper: get from cache or fetch and cache the result.
     */
    async getOrSet<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
        const cached = this.get<T>(key);
        if (cached !== undefined) return cached;

        const data = await fetcher();
        this.set(key, data, ttlMs);
        return data;
    }

    /**
     * Clear all cached entries.
     */
    clear(): void {
        this.store.clear();
    }
}

// Singleton instance
const cache = new MemoryCache();
export default cache;

// Common TTL constants
export const CACHE_TTL = {
    SETTINGS: 5 * 60 * 1000,    // 5 minutes
    STATS: 30 * 1000,            // 30 seconds
    PENGUMUMAN: 60 * 1000,       // 1 minute
} as const;
