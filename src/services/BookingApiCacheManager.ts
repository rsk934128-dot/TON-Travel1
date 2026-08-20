/**
 * BookingApiCacheManager
 * 
 * High-performance client-side cache manager utilizing localStorage for 
 * Booking.com Demand API responses. Implements a 24-hour Time-To-Live (TTL)
 * expiration policy, automatic stale data eviction, payload size tracking,
 * and transparent caching wrappers to minimize network calls and boost performance.
 */

export interface CachedApiResponse<T = any> {
  data: T;
  timestamp: number;
  expiresAt: number;
  ttlMs: number;
  key: string;
  hitCount: number;
  sizeBytes: number;
  metadata?: Record<string, any>;
}

export interface BookingCacheManagerStats {
  storageType: 'localStorage' | 'in-memory-fallback';
  totalEntries: number;
  hitsCount: number;
  missesCount: number;
  hitRatePercentage: number;
  totalSizeBytes: number;
  estimatedLatencySavedMs: number;
  defaultTtlHours: number;
  entries: Array<{
    key: string;
    cachedAt: string;
    expiresAt: string;
    remainingMinutes: number;
    hitCount: number;
    sizeKb: string;
  }>;
}

class BookingApiCacheManagerService {
  private readonly storagePrefix = 'tontravel_bk_demand_v31_';
  private readonly defaultTtlMs = 24 * 60 * 60 * 1000; // 24 Hours Default TTL
  private memoryFallback = new Map<string, string>();
  private runtimeHits = 0;
  private runtimeMisses = 0;

  constructor() {
    // Automatically prune expired entries on instantiation
    if (typeof window !== 'undefined') {
      try {
        this.pruneExpired();
      } catch (e) {
        console.warn('[BookingApiCacheManager] Initial prune error:', e);
      }
    }
  }

  /**
   * Generates a deterministic normalized cache key from endpoint and parameters
   */
  public generateKey(endpoint: string, params: Record<string, any> = {}): string {
    const cleanEndpoint = endpoint.replace(/^\/+|\/+$/g, '').toLowerCase();
    const sortedKeys = Object.keys(params).sort();
    const paramString = sortedKeys
      .map((k) => {
        const val = params[k];
        if (typeof val === 'object' && val !== null) {
          return `${k}=${JSON.stringify(val)}`;
        }
        return `${k}=${String(val)}`;
      })
      .join('&');

    return `${this.storagePrefix}${cleanEndpoint}_${paramString || 'default'}`;
  }

  /**
   * Stores an API response in localStorage with a 24-hour TTL
   */
  public set<T = any>(
    key: string,
    data: T,
    customTtlMs: number = this.defaultTtlMs,
    metadata?: Record<string, any>
  ): boolean {
    const fullKey = key.startsWith(this.storagePrefix) ? key : `${this.storagePrefix}${key}`;
    const now = Date.now();
    const ttl = customTtlMs > 0 ? customTtlMs : this.defaultTtlMs;
    const jsonString = JSON.stringify(data);
    const sizeBytes = new Blob([jsonString]).size || jsonString.length;

    const cacheEntry: CachedApiResponse<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttl,
      ttlMs: ttl,
      key: fullKey,
      hitCount: 0,
      sizeBytes,
      metadata
    };

    const entrySerialized = JSON.stringify(cacheEntry);

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(fullKey, entrySerialized);
        return true;
      }
    } catch (err: any) {
      console.warn('[BookingApiCacheManager] LocalStorage write error (quota?), attempting eviction:', err);
      // Quota exceeded: prune expired or oldest items and retry
      this.pruneExpired();
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem(fullKey, entrySerialized);
          return true;
        }
      } catch {
        // Fallback to memory
      }
    }

    // Memory fallback
    this.memoryFallback.set(fullKey, entrySerialized);
    return true;
  }

  /**
   * Retrieves cached API response. If TTL is expired (24h+), purges it and returns null.
   */
  public get<T = any>(key: string): T | null {
    const fullKey = key.startsWith(this.storagePrefix) ? key : `${this.storagePrefix}${key}`;
    const now = Date.now();
    let raw: string | null = null;

    // 1. Read from localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        raw = localStorage.getItem(fullKey);
      } catch (e) {
        console.warn('[BookingApiCacheManager] LocalStorage read error:', e);
      }
    }

    // 2. Read from memory fallback if not in localStorage
    if (!raw && this.memoryFallback.has(fullKey)) {
      raw = this.memoryFallback.get(fullKey) || null;
    }

    if (!raw) {
      this.runtimeMisses++;
      return null;
    }

    try {
      const entry: CachedApiResponse<T> = JSON.parse(raw);

      // Check 24-hour TTL Expiration
      if (entry.expiresAt && entry.expiresAt < now) {
        // Expired! Invalidate & remove from storage
        this.remove(fullKey);
        this.runtimeMisses++;
        return null;
      }

      // Valid Hit: Update hit count
      entry.hitCount = (entry.hitCount || 0) + 1;
      this.runtimeHits++;

      // Asynchronously update hit count without blocking
      this.updateEntryHitCount(fullKey, entry);

      return entry.data;
    } catch (parseErr) {
      console.warn('[BookingApiCacheManager] Parse error for key:', fullKey, parseErr);
      this.remove(fullKey);
      this.runtimeMisses++;
      return null;
    }
  }

  /**
   * Checks if an unexpired cache entry exists for the given key
   */
  public has(key: string): boolean {
    const fullKey = key.startsWith(this.storagePrefix) ? key : `${this.storagePrefix}${key}`;
    const now = Date.now();
    let raw: string | null = null;

    if (typeof window !== 'undefined' && window.localStorage) {
      raw = localStorage.getItem(fullKey);
    }
    if (!raw) {
      raw = this.memoryFallback.get(fullKey) || null;
    }

    if (!raw) return false;

    try {
      const entry = JSON.parse(raw);
      return entry.expiresAt > now;
    } catch {
      return false;
    }
  }

  /**
   * Returns remaining TTL in milliseconds, or 0 if expired/not found
   */
  public getRemainingTtl(key: string): number {
    const fullKey = key.startsWith(this.storagePrefix) ? key : `${this.storagePrefix}${key}`;
    const now = Date.now();
    let raw: string | null = null;

    if (typeof window !== 'undefined' && window.localStorage) {
      raw = localStorage.getItem(fullKey);
    }
    if (!raw) {
      raw = this.memoryFallback.get(fullKey) || null;
    }

    if (!raw) return 0;

    try {
      const entry = JSON.parse(raw);
      return Math.max(0, (entry.expiresAt || 0) - now);
    } catch {
      return 0;
    }
  }

  /**
   * Transparent fetch wrapper: Checks localStorage first (24h TTL), or executes fetcher and caches
   */
  public async wrap<T = any>(
    endpoint: string,
    params: Record<string, any>,
    fetcher: () => Promise<T>,
    customTtlMs: number = this.defaultTtlMs,
    forceRefresh: boolean = false
  ): Promise<{ data: T; fromCache: boolean; remainingTtlMs: number }> {
    const key = this.generateKey(endpoint, params);

    if (!forceRefresh) {
      const cached = this.get<T>(key);
      if (cached !== null) {
        return {
          data: cached,
          fromCache: true,
          remainingTtlMs: this.getRemainingTtl(key)
        };
      }
    }

    // Cache miss or force refresh: execute fetcher
    const freshData = await fetcher();
    this.set(key, freshData, customTtlMs, { endpoint, params });

    return {
      data: freshData,
      fromCache: false,
      remainingTtlMs: customTtlMs
    };
  }

  /**
   * Deletes a specific cache key
   */
  public remove(key: string): void {
    const fullKey = key.startsWith(this.storagePrefix) ? key : `${this.storagePrefix}${key}`;
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.removeItem(fullKey);
      } catch (e) {
        console.warn('[BookingApiCacheManager] LocalStorage removeItem error:', e);
      }
    }
    this.memoryFallback.delete(fullKey);
  }

  /**
   * Clears all Booking Demand API cache entries
   */
  public clear(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(this.storagePrefix)) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      } catch (e) {
        console.warn('[BookingApiCacheManager] Clear error:', e);
      }
    }
    this.memoryFallback.clear();
    this.runtimeHits = 0;
    this.runtimeMisses = 0;
  }

  /**
   * Scans and prunes all expired entries (older than 24 hours)
   */
  public pruneExpired(): number {
    let prunedCount = 0;
    const now = Date.now();

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const keysToCheck: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(this.storagePrefix)) {
            keysToCheck.push(k);
          }
        }

        for (const k of keysToCheck) {
          const raw = localStorage.getItem(k);
          if (raw) {
            try {
              const entry = JSON.parse(raw);
              if (entry.expiresAt && entry.expiresAt < now) {
                localStorage.removeItem(k);
                prunedCount++;
              }
            } catch {
              localStorage.removeItem(k);
              prunedCount++;
            }
          }
        }
      } catch (e) {
        console.warn('[BookingApiCacheManager] Prune error:', e);
      }
    }

    // Also prune memory fallback
    for (const [k, raw] of this.memoryFallback.entries()) {
      try {
        const entry = JSON.parse(raw);
        if (entry.expiresAt && entry.expiresAt < now) {
          this.memoryFallback.delete(k);
          prunedCount++;
        }
      } catch {
        this.memoryFallback.delete(k);
        prunedCount++;
      }
    }

    return prunedCount;
  }

  /**
   * Returns complete diagnostics, entries list, and performance metrics
   */
  public getStats(): BookingCacheManagerStats {
    const now = Date.now();
    const entriesList: BookingCacheManagerStats['entries'] = [];
    let totalSizeBytes = 0;
    let isLocalStorageAvailable = false;

    if (typeof window !== 'undefined' && window.localStorage) {
      isLocalStorageAvailable = true;
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(this.storagePrefix)) {
            const raw = localStorage.getItem(k);
            if (raw) {
              try {
                const entry: CachedApiResponse = JSON.parse(raw);
                const remainingMinutes = Math.max(0, Math.round(((entry.expiresAt || 0) - now) / 60000));
                const sizeBytes = entry.sizeBytes || raw.length;
                totalSizeBytes += sizeBytes;

                entriesList.push({
                  key: k.replace(this.storagePrefix, ''),
                  cachedAt: new Date(entry.timestamp).toLocaleTimeString(),
                  expiresAt: new Date(entry.expiresAt).toLocaleTimeString(),
                  remainingMinutes,
                  hitCount: entry.hitCount || 0,
                  sizeKb: `${(sizeBytes / 1024).toFixed(1)} KB`
                });
              } catch {
                // Invalid JSON, skip
              }
            }
          }
        }
      } catch (e) {
        console.warn('[BookingApiCacheManager] Stats compilation error:', e);
      }
    }

    // Add memory fallback entries
    for (const [k, raw] of this.memoryFallback.entries()) {
      try {
        const entry: CachedApiResponse = JSON.parse(raw);
        const remainingMinutes = Math.max(0, Math.round(((entry.expiresAt || 0) - now) / 60000));
        const sizeBytes = entry.sizeBytes || raw.length;
        totalSizeBytes += sizeBytes;

        entriesList.push({
          key: `[mem] ${k.replace(this.storagePrefix, '')}`,
          cachedAt: new Date(entry.timestamp).toLocaleTimeString(),
          expiresAt: new Date(entry.expiresAt).toLocaleTimeString(),
          remainingMinutes,
          hitCount: entry.hitCount || 0,
          sizeKb: `${(sizeBytes / 1024).toFixed(1)} KB`
        });
      } catch {}
    }

    const totalRequests = this.runtimeHits + this.runtimeMisses;
    const hitRatePercentage = totalRequests > 0 ? Math.round((this.runtimeHits / totalRequests) * 100) : 0;
    const estimatedLatencySavedMs = this.runtimeHits * 150; // ~150ms saved per cache hit

    return {
      storageType: isLocalStorageAvailable ? 'localStorage' : 'in-memory-fallback',
      totalEntries: entriesList.length,
      hitsCount: this.runtimeHits,
      missesCount: this.runtimeMisses,
      hitRatePercentage,
      totalSizeBytes,
      estimatedLatencySavedMs,
      defaultTtlHours: 24,
      entries: entriesList
    };
  }

  private updateEntryHitCount(key: string, entry: CachedApiResponse): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(key, JSON.stringify(entry));
      } else {
        this.memoryFallback.set(key, JSON.stringify(entry));
      }
    } catch {}
  }
}

// Export singleton instance
export const BookingApiCacheManager = new BookingApiCacheManagerService();
export default BookingApiCacheManager;
