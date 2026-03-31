/**
 * @module dira/cache
 *
 * Three-tier caching for Dira API data:
 * 1. In-memory cache (15-min TTL)
 * 2. Disk cache (.data-cache/dira-projects.json)
 * 3. Live API fallback
 *
 * Mirrors the aggregator.ts caching pattern.
 */

import fs from "fs";
import path from "path";
import type { DiraProject } from "./types";
import { fetchAllDiraProjects } from "./client";

const CACHE_TTL = 15 * 60 * 1000; // 15 minutes
const DISK_CACHE_DIR = path.join(process.cwd(), ".data-cache");
const DISK_CACHE_FILE = path.join(DISK_CACHE_DIR, "dira-projects.json");

interface CachePayload {
  ts: number;
  projects: DiraProject[];
}

// In-memory cache
let memCache: CachePayload | null = null;

// Inflight dedup: coalesce concurrent fetches
let inflightPromise: Promise<DiraProject[]> | null = null;

function writeDiskCache(payload: CachePayload) {
  try {
    if (!fs.existsSync(DISK_CACHE_DIR)) {
      fs.mkdirSync(DISK_CACHE_DIR, { recursive: true, mode: 0o700 });
    }
    fs.writeFileSync(DISK_CACHE_FILE, JSON.stringify(payload), {
      mode: 0o600,
    });
    console.log(
      `[dira-cache] Saved ${payload.projects.length} projects to disk`
    );
  } catch (err) {
    console.warn(
      "[dira-cache] Failed to write disk cache:",
      (err as Error).message
    );
  }
}

function readDiskCache(): CachePayload | null {
  try {
    if (!fs.existsSync(DISK_CACHE_FILE)) return null;
    const raw = fs.readFileSync(DISK_CACHE_FILE, "utf-8");
    const parsed = JSON.parse(raw) as CachePayload;
    if (parsed.projects?.length > 0) return parsed;
    return null;
  } catch {
    return null;
  }
}

async function fetchAndCache(): Promise<DiraProject[]> {
  try {
    const projects = await fetchAllDiraProjects();
    const payload: CachePayload = { ts: Date.now(), projects };
    memCache = payload;
    writeDiskCache(payload);
    return projects;
  } catch (err) {
    console.warn(
      "[dira-cache] API fetch failed, trying disk cache:",
      (err as Error).message
    );
    // Fallback to disk cache (any age)
    const disk = readDiskCache();
    if (disk) {
      console.log(
        `[dira-cache] Serving ${disk.projects.length} projects from stale disk cache`
      );
      memCache = disk;
      return disk.projects;
    }
    throw err;
  }
}

/**
 * Returns all Dira lottery projects from cache or API.
 * Returns empty array on total failure (never throws to caller).
 */
export async function getDiraProjects(): Promise<DiraProject[]> {
  // 1. Check memory cache
  if (memCache && Date.now() - memCache.ts < CACHE_TTL) {
    return memCache.projects;
  }

  // 2. Check disk cache freshness
  const disk = readDiskCache();
  if (disk && Date.now() - disk.ts < CACHE_TTL) {
    memCache = disk;
    return disk.projects;
  }

  // 3. Inflight dedup
  if (inflightPromise) return inflightPromise;

  inflightPromise = fetchAndCache().finally(() => {
    inflightPromise = null;
  });

  return inflightPromise;
}

/**
 * Safe wrapper that returns [] on failure — for use in server components
 * where we don't want the entire page to error.
 */
export async function getDiraProjectsSafe(): Promise<DiraProject[]> {
  try {
    return await getDiraProjects();
  } catch (err) {
    console.error("[dira-cache] Total failure:", (err as Error).message);
    return [];
  }
}
