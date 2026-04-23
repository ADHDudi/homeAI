/**
 * @module dira/cache
 *
 * Three-tier caching for Dira API data:
 * 1. In-memory cache (15-min TTL)
 * 2. Disk cache (.data-cache/dira-projects.json)
 * 3. Live API fallback
 */

import path from "path";
import { createDiskCache } from "@/lib/utils/diskCache";
import type { DiraProject } from "./types";
import { fetchAllDiraProjects } from "./client";

const CACHE_TTL = 15 * 60 * 1000; // 15 minutes
const DISK_CACHE_DIR = path.join(process.cwd(), ".data-cache");
const DISK_CACHE_FILE = path.join(DISK_CACHE_DIR, "dira-projects.json");

const cache = createDiskCache<DiraProject>({
  cacheDir: DISK_CACHE_DIR,
  cacheFile: DISK_CACHE_FILE,
  ttlMs: CACHE_TTL,
  fetchFn: fetchAllDiraProjects,
  logPrefix: "dira-cache",
});

/**
 * Returns all Dira lottery projects from cache or API.
 * Throws on total failure.
 */
export const getDiraProjects = cache.get;

/**
 * Safe wrapper that returns [] on failure — for use in server components
 * where we don't want the entire page to error.
 */
export const getDiraProjectsSafe = cache.getSafe;
