/**
 * Server-side geocoding via Nominatim (OpenStreetMap).
 * Used to resolve Hebrew street addresses to lat/lng for map markers.
 */

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "HomeAI-Investment-App/1.0.0";
const TIMEOUT_MS = 4000;
const MAX_SITES_PER_CITY = 15;
const DELAY_MS = 1100; // Nominatim requires max 1 req/sec

const cache = new Map<string, { lat: number; lng: number } | null>();

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
    return result;
  } catch {
    cache.set(cacheKey, null);
    return null;
  }
}

/**
 * Batch-geocode an array of addresses for a given city.
 * Returns a parallel array of {lat, lng} | null.
 * Capped at MAX_SITES_PER_CITY to limit latency.
 */
export async function batchGeocode(
  addresses: string[],
  cityName: string,
): Promise<(({ lat: number; lng: number }) | null)[]> {
  const results: (({ lat: number; lng: number }) | null)[] = [];
  const toProcess = addresses.slice(0, MAX_SITES_PER_CITY);

  for (let i = 0; i < toProcess.length; i++) {
    const cacheKey = `${toProcess[i]}|${cityName}`;
    if (!cache.has(cacheKey) && i > 0) {
      await delay(DELAY_MS);
    }
    results.push(await geocodeAddress(toProcess[i], cityName));
  }

  // Fill remaining with null if addresses were capped
  for (let i = toProcess.length; i < addresses.length; i++) {
    results.push(null);
  }

  return results;
}
