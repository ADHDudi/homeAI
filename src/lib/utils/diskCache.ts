/**
 * @module utils/diskCache
 *
 * Generic factory for two-tier (memory + disk) caches with inflight deduplication.
 * Extracted from arcgis/cache.ts and dira/cache.ts which had near-identical
 * implementations differing only in type and log prefix.
 *
 * Cache file format: { ts: number; data: T[] }
 * Mode 0o600 (owner read/write only) to mitigate disk cache poisoning risk.
 */

import fs from "fs";

export interface DiskCacheConfig<T> {
  /** Absolute path to the cache directory (created automatically). */
  cacheDir: string;
  /** Absolute path to the JSON cache file. */
  cacheFile: string;
  /** Cache TTL in milliseconds. */
  ttlMs: number;
  /** Function that fetches fresh data. */
  fetchFn: () => Promise<T[]>;
  /** Log prefix for console messages, e.g. "dira-cache". */
  logPrefix: string;
}

interface CachePayload<T> {
  ts: number;
  data: T[];
}

function isValidPayload<T>(raw: unknown): raw is CachePayload<T> {
  if (typeof raw !== "object" || raw === null) return false;
  const p = raw as Record<string, unknown>;
  return typeof p.ts === "number" && Array.isArray(p.data) && (p.data as unknown[]).length > 0;
}

function writeDiskCache<T>(file: string, dir: string, payload: CachePayload<T>, logPrefix: string) {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    }
    fs.writeFileSync(file, JSON.stringify(payload), { mode: 0o600 });
    console.log(`[${logPrefix}] Saved ${payload.data.length} items to disk`);
  } catch (err) {
    console.warn(`[${logPrefix}] Failed to write disk cache:`, (err as Error).message);
  }
}

function readDiskCache<T>(file: string): CachePayload<T> | null {
  try {
    if (!fs.existsSync(file)) return null;
    const parsed: unknown = JSON.parse(fs.readFileSync(file, "utf-8"));
    return isValidPayload<T>(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export interface DiskCache<T> {
  /** Returns data from cache or fetches fresh. Throws on total failure. */
  get: () => Promise<T[]>;
  /** Returns data from cache or fetches fresh. Returns [] on total failure. */
  getSafe: () => Promise<T[]>;
}

/**
 * Creates a memory+disk backed cache with inflight deduplication.
 *
 * @example
 * const cache = createDiskCache({ cacheDir, cacheFile, ttlMs, fetchFn, logPrefix });
 * export const getData = cache.get;
 * export const getDataSafe = cache.getSafe;
 */
export function createDiskCache<T>(config: DiskCacheConfig<T>): DiskCache<T> {
  const { cacheDir, cacheFile, ttlMs, fetchFn, logPrefix } = config;

  let memCache: CachePayload<T> | null = null;
  let inflightPromise: Promise<T[]> | null = null;

  async function fetchAndCache(): Promise<T[]> {
    try {
      const data = await fetchFn();
      const payload: CachePayload<T> = { ts: Date.now(), data };
      memCache = payload;
      writeDiskCache(cacheFile, cacheDir, payload, logPrefix);
      return data;
    } catch (err) {
      console.warn(`[${logPrefix}] API fetch failed, trying disk cache:`, (err as Error).message);
      const disk = readDiskCache<T>(cacheFile);
      if (disk) {
        console.log(`[${logPrefix}] Serving ${disk.data.length} items from stale disk cache`);
        memCache = disk;
        return disk.data;
      }
      throw err;
    }
  }

  async function get(): Promise<T[]> {
    if (memCache && Date.now() - memCache.ts < ttlMs) return memCache.data;

    const disk = readDiskCache<T>(cacheFile);
    if (disk && Date.now() - disk.ts < ttlMs) {
      memCache = disk;
      return disk.data;
    }

    if (inflightPromise) return inflightPromise;

    inflightPromise = fetchAndCache().finally(() => {
      inflightPromise = null;
    });

    return inflightPromise;
  }

  async function getSafe(): Promise<T[]> {
    try {
      return await get();
    } catch (err) {
      console.error(`[${logPrefix}] Total failure:`, (err as Error).message);
      return [];
    }
  }

  return { get, getSafe };
}
