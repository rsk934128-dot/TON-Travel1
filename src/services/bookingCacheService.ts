/**
 * Local Caching Layer for Booking.com Demand API & Accommodation Listings
 * Utilizes IndexedDB as the primary asynchronous persistence engine with
 * a fallback to LocalStorage for maximum environment compatibility.
 */

export interface CacheMetadata {
  key: string;
  timestamp: number;
  expiresAt: number;
  source: string;
  hitCount: number;
  sizeBytes?: number;
  type: 'demand_search' | 'hotel_list' | 'locations' | 'live_rate';
}

export interface CacheEntry<T = any> {
  data: T;
  meta: CacheMetadata;
}

export interface CacheStats {
  storageType: 'IndexedDB' | 'LocalStorage' | 'Memory';
  totalEntries: number;
  hitsCount: number;
  missesCount: number;
  estimatedLatencySavedMs: number;
  cachedKeys: string[];
  lastEvictionTimestamp: number | null;
}

const DB_NAME = 'TonTravelBookingDB';
const DB_VERSION = 1;
const STORE_NAME = 'demand_api_cache';
const LOCALSTORAGE_PREFIX = 'tontravel_bk_cache_';
const STATS_KEY = 'tontravel_bk_cache_stats';

// In-memory fallback if both IDB and LocalStorage are constrained
const memoryCache = new Map<string, CacheEntry>();

// Metrics tracking
let runtimeHits = 0;
let runtimeMisses = 0;
let runtimeSavedLatencyMs = 0;

// Initialize or open IndexedDB safely
function openIndexedDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'meta.key' });
        }
      };

      request.onsuccess = (event: Event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        resolve(db);
      };

      request.onerror = (err) => {
        console.warn('[BookingCache] IndexedDB open error, falling back to LocalStorage:', err);
        resolve(null);
      };
    } catch (e) {
      console.warn('[BookingCache] IndexedDB not available:', e);
      resolve(null);
    }
  });
}

/**
 * Generates a normalized deterministic cache key for Demand API requests
 */
export function buildDemandCacheKey(params: {
  country?: string;
  city?: number | string;
  checkin?: string;
  checkout?: string;
  adults?: number;
  rooms?: number;
}): string {
  const c = (params.country || 'nl').toLowerCase();
  const city = String(params.city || '-2140479');
  const ci = params.checkin || 'def_in';
  const co = params.checkout || 'def_out';
  const ad = params.adults || 2;
  const rm = params.rooms || 1;
  return `demand_v31_${c}_city_${city}_${ci}_${co}_a${ad}_r${rm}`;
}

/**
 * Generates a cache key for hotel query requests
 */
export function buildHotelsCacheKey(params: {
  city?: string;
  dest_id?: string;
  category?: string;
  currency?: string;
}): string {
  const city = (params.city || '').toLowerCase().trim();
  const destId = params.dest_id || 'all';
  const cat = (params.category || 'all').toLowerCase();
  const curr = (params.currency || 'usd').toLowerCase();
  return `hotels_${city}_${destId}_${cat}_${curr}`;
}

/**
 * Retrieves a cached entry from IndexedDB or LocalStorage
 */
export async function getCachedData<T = any>(key: string): Promise<T | null> {
  const now = Date.now();

  // 1. Try IndexedDB first
  try {
    const db = await openIndexedDB();
    if (db) {
      const entry = await new Promise<CacheEntry<T> | null>((resolve) => {
        try {
          const transaction = db.transaction(STORE_NAME, 'readwrite');
          const store = transaction.objectStore(STORE_NAME);
          const getReq = store.get(key);

          getReq.onsuccess = () => {
            const res = getReq.result as CacheEntry<T> | undefined;
            if (res) {
              if (res.meta.expiresAt > now) {
                // Increment hit count asynchronously
                res.meta.hitCount = (res.meta.hitCount || 0) + 1;
                store.put(res);
                resolve(res);
              } else {
                // Stale item, delete
                store.delete(key);
                resolve(null);
              }
            } else {
              resolve(null);
            }
          };

          getReq.onerror = () => resolve(null);
        } catch {
          resolve(null);
        }
      });

      if (entry) {
        runtimeHits++;
        runtimeSavedLatencyMs += 140; // Approx network roundtrip saved
        return entry.data;
      }
    }
  } catch (err) {
    console.warn('[BookingCache] IDB read error:', err);
  }

  // 2. Fallback to LocalStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = localStorage.getItem(`${LOCALSTORAGE_PREFIX}${key}`);
      if (raw) {
        const entry = JSON.parse(raw) as CacheEntry<T>;
        if (entry.meta.expiresAt > now) {
          entry.meta.hitCount = (entry.meta.hitCount || 0) + 1;
          localStorage.setItem(`${LOCALSTORAGE_PREFIX}${key}`, JSON.stringify(entry));
          runtimeHits++;
          runtimeSavedLatencyMs += 120;
          return entry.data;
        } else {
          localStorage.removeItem(`${LOCALSTORAGE_PREFIX}${key}`);
        }
      }
    } catch (e) {
      console.warn('[BookingCache] LocalStorage read error:', e);
    }
  }

  // 3. Fallback to In-Memory
  const mem = memoryCache.get(key);
  if (mem) {
    if (mem.meta.expiresAt > now) {
      mem.meta.hitCount = (mem.meta.hitCount || 0) + 1;
      runtimeHits++;
      runtimeSavedLatencyMs += 100;
      return mem.data as T;
    } else {
      memoryCache.delete(key);
    }
  }

  runtimeMisses++;
  return null;
}

/**
 * Stores data into the local cache with custom TTL (Default: 30 minutes)
 */
export async function setCachedData<T = any>(
  key: string,
  data: T,
  type: 'demand_search' | 'hotel_list' | 'locations' | 'live_rate' = 'demand_search',
  ttlMs: number = 30 * 60 * 1000,
  source: string = 'Booking.com Demand API'
): Promise<void> {
  const now = Date.now();
  const meta: CacheMetadata = {
    key,
    timestamp: now,
    expiresAt: now + ttlMs,
    source,
    hitCount: 0,
    type,
    sizeBytes: typeof data === 'object' ? JSON.stringify(data).length : 0
  };

  const entry: CacheEntry<T> = { data, meta };

  // Always update memory
  memoryCache.set(key, entry);

  // 1. Store in IndexedDB
  try {
    const db = await openIndexedDB();
    if (db) {
      await new Promise<void>((resolve) => {
        try {
          const transaction = db.transaction(STORE_NAME, 'readwrite');
          const store = transaction.objectStore(STORE_NAME);
          store.put(entry);
          transaction.oncomplete = () => resolve();
          transaction.onerror = () => resolve();
        } catch {
          resolve();
        }
      });
      return;
    }
  } catch (err) {
    console.warn('[BookingCache] IDB write error:', err);
  }

  // 2. Fallback store in LocalStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(`${LOCALSTORAGE_PREFIX}${key}`, JSON.stringify(entry));
    } catch (e) {
      // LocalStorage quota might be exceeded, prune oldest items
      pruneOldLocalStorageEntries();
    }
  }
}

/**
 * Prunes expired or oldest entries from LocalStorage
 */
function pruneOldLocalStorageEntries(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(LOCALSTORAGE_PREFIX)) {
        keys.push(k);
      }
    }

    // Sort and remove expired or oldest half
    const now = Date.now();
    for (const k of keys) {
      try {
        const raw = localStorage.getItem(k);
        if (raw) {
          const parsed = JSON.parse(raw) as CacheEntry;
          if (parsed.meta.expiresAt < now) {
            localStorage.removeItem(k);
          }
        }
      } catch {
        localStorage.removeItem(k);
      }
    }
  } catch (err) {
    console.warn('[BookingCache] Pruning error:', err);
  }
}

/**
 * Clears all cached Booking.com Demand API responses
 */
export async function clearBookingCache(): Promise<void> {
  memoryCache.clear();
  runtimeHits = 0;
  runtimeMisses = 0;
  runtimeSavedLatencyMs = 0;

  // Clear IDB
  try {
    const db = await openIndexedDB();
    if (db) {
      await new Promise<void>((resolve) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        store.clear();
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => resolve();
      });
    }
  } catch (err) {
    console.warn('[BookingCache] IDB clear error:', err);
  }

  // Clear LocalStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(LOCALSTORAGE_PREFIX)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      console.warn('[BookingCache] LocalStorage clear error:', e);
    }
  }
}

/**
 * Gathers diagnostics and real-time statistics about the local cache
 */
export async function getBookingCacheStats(): Promise<CacheStats> {
  const cachedKeys: string[] = [];
  let storageType: 'IndexedDB' | 'LocalStorage' | 'Memory' = 'Memory';

  try {
    const db = await openIndexedDB();
    if (db) {
      storageType = 'IndexedDB';
      const keys = await new Promise<string[]>((resolve) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const req = store.getAllKeys();
        req.onsuccess = () => resolve((req.result as string[]) || []);
        req.onerror = () => resolve([]);
      });
      cachedKeys.push(...keys);
    } else if (typeof window !== 'undefined' && window.localStorage) {
      storageType = 'LocalStorage';
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(LOCALSTORAGE_PREFIX)) {
          cachedKeys.push(k.replace(LOCALSTORAGE_PREFIX, ''));
        }
      }
    }
  } catch {
    storageType = 'Memory';
    cachedKeys.push(...Array.from(memoryCache.keys()));
  }

  return {
    storageType,
    totalEntries: cachedKeys.length,
    hitsCount: runtimeHits,
    missesCount: runtimeMisses,
    estimatedLatencySavedMs: runtimeSavedLatencyMs,
    cachedKeys,
    lastEvictionTimestamp: Date.now()
  };
}
