/**
 * In-memory request cache with TTL and stale-while-revalidate.
 * Deduplicates concurrent requests and serves stale data while refreshing.
 */

interface CacheEntry<T> {
    data: T;
    expiresAt: number;
    staleAt: number; // after this time, serve stale but revalidate in background
}

const cache = new Map<string, CacheEntry<any>>();
const inflight = new Map<string, Promise<any>>();

const DEFAULT_TTL = 60_000; // 1 minute fresh
const DEFAULT_STALE_TTL = 5 * 60_000; // 5 minutes stale-while-revalidate

/**
 * Wrap an async fetcher with caching + deduplication + stale-while-revalidate.
 * - Same key within freshTTL → returns cached result instantly.
 * - Same key within staleTTL → returns stale data immediately, revalidates in background.
 * - Same key requested concurrently → shares the same in-flight promise.
 */
export async function cached<T>(
    key: string,
    fetcher: () => Promise<T>,
    freshTTL = DEFAULT_TTL,
    staleTTL = DEFAULT_STALE_TTL
): Promise<T> {
    const now = Date.now();
    const entry = cache.get(key);

    // Fresh cache hit — return immediately
    if (entry && entry.staleAt > now) {
        // If past fresh window but within stale window, revalidate in background
        if (entry.expiresAt <= now && !inflight.has(key)) {
            revalidate(key, fetcher, freshTTL, staleTTL);
        }
        return entry.data as T;
    }

    // Deduplicate concurrent requests
    const existing = inflight.get(key);
    if (existing) return existing as Promise<T>;

    return fetchAndCache(key, fetcher, freshTTL, staleTTL);
}

function fetchAndCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    freshTTL: number,
    staleTTL: number
): Promise<T> {
    const now = Date.now();
    const promise = fetcher()
        .then((data) => {
            cache.set(key, {
                data,
                expiresAt: now + freshTTL,
                staleAt: now + staleTTL,
            });
            inflight.delete(key);
            return data;
        })
        .catch((err) => {
            inflight.delete(key);
            // On error, return stale data if available
            const stale = cache.get(key);
            if (stale) return stale.data as T;
            throw err;
        });

    inflight.set(key, promise);
    return promise;
}

function revalidate<T>(
    key: string,
    fetcher: () => Promise<T>,
    freshTTL: number,
    staleTTL: number
): void {
    const now = Date.now();
    const promise = fetcher()
        .then((data) => {
            cache.set(key, {
                data,
                expiresAt: now + freshTTL,
                staleAt: now + staleTTL,
            });
            inflight.delete(key);
        })
        .catch(() => {
            inflight.delete(key);
            // Keep stale data on revalidation failure
        });
    inflight.set(key, promise);
}

/** Invalidate a specific cache key or all keys matching a prefix */
export function invalidateCache(keyOrPrefix?: string) {
    if (!keyOrPrefix) {
        cache.clear();
        return;
    }
    for (const key of cache.keys()) {
        if (key === keyOrPrefix || key.startsWith(keyOrPrefix + ':')) {
            cache.delete(key);
        }
    }
}

/** Prefetch a key into cache without awaiting — for predictive loading */
export function prefetch<T>(key: string, fetcher: () => Promise<T>, freshTTL = DEFAULT_TTL, staleTTL = DEFAULT_STALE_TTL): void {
    const entry = cache.get(key);
    if (entry && entry.expiresAt > Date.now()) return; // already fresh
    if (inflight.has(key)) return; // already fetching
    fetchAndCache(key, fetcher, freshTTL, staleTTL).catch(() => {}); // fire and forget
}
