/**
 * Server-side geocoding via Nominatim (OpenStreetMap).
 * Used to resolve Hebrew street addresses to lat/lng for map markers.
 *
 * Performance: disk-persisted cache + in-memory cache.
 * Cache hits resolve instantly; only cache misses hit Nominatim (rate-limited 1/sec).
 */

import fs from "fs";
import path from "path";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "HomeAI-Investment-App/1.0.0";
const TIMEOUT_MS = 4000;
const MAX_SITES_PER_CITY = 15;
const DELAY_MS = 1100; // Nominatim requires max 1 req/sec

const DISK_CACHE_DIR = path.join(process.cwd(), ".data-cache");
const DISK_CACHE_FILE = path.join(DISK_CACHE_DIR, "geocode-cache.json");

const cache = new Map<string, { lat: number; lng: number } | null>();
let diskCacheLoaded = false;
let diskWritePending = false;

function loadDiskCache() {
  if (diskCacheLoaded) return;
  diskCacheLoaded = true;
  try {
    if (!fs.existsSync(DISK_CACHE_FILE)) return;
    const raw = JSON.parse(fs.readFileSync(DISK_CACHE_FILE, "utf-8")) as Record<string, { lat: number; lng: number } | null>;
    for (const [key, val] of Object.entries(raw)) {
      cache.set(key, val);
    }
    console.log(`[geocode] Loaded ${cache.size} entries from disk cache`);
  } catch {
    // ignore corrupt cache
  }
}

function writeDiskCache() {
  if (diskWritePending) return;
  diskWritePending = true;
  // Debounce: write after 2 seconds
  setTimeout(() => {
    diskWritePending = false;
    try {
      if (!fs.existsSync(DISK_CACHE_DIR)) {
        fs.mkdirSync(DISK_CACHE_DIR, { recursive: true, mode: 0o700 });
      }
      const obj: Record<string, { lat: number; lng: number } | null> = {};
      for (const [k, v] of cache) {
        obj[k] = v;
      }
      fs.writeFileSync(DISK_CACHE_FILE, JSON.stringify(obj), { mode: 0o600 });
    } catch {
      // ignore write errors
    }
  }, 2000);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function geocodeAddress(
  address: string,
  cityName: string,
): Promise<{ lat: number; lng: number } | null> {
  if (!address || address.length < 3) return null;

  const cacheKey = `${address}|${cityName}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey) ?? null;

  try {
    const query = `${address}, ${cityName}, Israel`;
    const url = `${NOMINATIM_URL}?${new URLSearchParams({
      q: query,
      format: "json",
      limit: "1",
      countrycodes: "il",
    })}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT },
    });
    clearTimeout(timer);

    if (!res.ok) {
      cache.set(cacheKey, null);
      return null;
    }

    const data = (await res.json()) as { lat: string; lon: string }[];
    if (!data.length) {
      cache.set(cacheKey, null);
      return null;
    }

    const result = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    cache.set(cacheKey, result);
    writeDiskCache();
    return result;
  } catch {
    cache.set(cacheKey, null);
    return null;
  }
}

/**
 * Batch-geocode an array of addresses for a given city.
 * Returns a parallel array of {lat, lng} | null.
 * Cache hits resolve instantly; only misses hit Nominatim with rate limiting.
 */
export async function batchGeocode(
  addresses: string[],
  cityName: string,
): Promise<(({ lat: number; lng: number }) | null)[]> {
  loadDiskCache();

  const toProcess = addresses.slice(0, MAX_SITES_PER_CITY);
  const results: (({ lat: number; lng: number }) | null)[] = new Array(toProcess.length);

  // Pass 1: resolve cache hits instantly
  const missIndices: number[] = [];
  for (let i = 0; i < toProcess.length; i++) {
    const cacheKey = `${toProcess[i]}|${cityName}`;
    if (cache.has(cacheKey)) {
      results[i] = cache.get(cacheKey) ?? null;
    } else {
      missIndices.push(i);
    }
  }

  // Pass 2: rate-limited Nominatim calls for misses only
  for (let j = 0; j < missIndices.length; j++) {
    if (j > 0) await delay(DELAY_MS);
    const idx = missIndices[j];
    results[idx] = await geocodeAddress(toProcess[idx], cityName);
  }

  // Fill remaining with null if addresses were capped
  for (let i = toProcess.length; i < addresses.length; i++) {
    results.push(null);
  }

  return results;
}
