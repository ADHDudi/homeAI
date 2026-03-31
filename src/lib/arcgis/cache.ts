import fs from "fs";
import path from "path";
import type { ArcGISCompound } from "./types";
import { fetchUpcomingProjects } from "./client";

const CACHE_TTL = 15 * 60 * 1000; // 15 minutes
const DISK_CACHE_DIR = path.join(process.cwd(), ".data-cache");
const DISK_CACHE_FILE = path.join(DISK_CACHE_DIR, "arcgis-upcoming.json");

interface CachePayload {
  ts: number;
  compounds: ArcGISCompound[];
}

let memCache: CachePayload | null = null;
let inflightPromise: Promise<ArcGISCompound[]> | null = null;

function writeDiskCache(payload: CachePayload) {
  try {
    if (!fs.existsSync(DISK_CACHE_DIR)) {
      fs.mkdirSync(DISK_CACHE_DIR, { recursive: true, mode: 0o700 });
    }
    fs.writeFileSync(DISK_CACHE_FILE, JSON.stringify(payload), {
      mode: 0o600,
    });
    console.log(
      `[arcgis-cache] Saved ${payload.compounds.length} compounds to disk`
    );
  } catch (err) {
    console.warn(
      "[arcgis-cache] Failed to write disk cache:",
      (err as Error).message
    );
  }
}

function readDiskCache(): CachePayload | null {
  try {
    if (!fs.existsSync(DISK_CACHE_FILE)) return null;
    const raw = fs.readFileSync(DISK_CACHE_FILE, "utf-8");
    const parsed = JSON.parse(raw) as CachePayload;
    if (parsed.compounds?.length > 0) return parsed;
    return null;
  } catch {
    return null;
  }
}

async function fetchAndCache(): Promise<ArcGISCompound[]> {
  try {
    const compounds = await fetchUpcomingProjects();
    const payload: CachePayload = { ts: Date.now(), compounds };
    memCache = payload;
    writeDiskCache(payload);
    return compounds;
  } catch (err) {
    console.warn(
      "[arcgis-cache] API fetch failed, trying disk cache:",
      (err as Error).message
    );
    const disk = readDiskCache();
    if (disk) {
      console.log(
        `[arcgis-cache] Serving ${disk.compounds.length} compounds from stale disk cache`
      );
      memCache = disk;
      return disk.compounds;
    }
    throw err;
  }
}

export async function getArcGISUpcoming(): Promise<ArcGISCompound[]> {
  if (memCache && Date.now() - memCache.ts < CACHE_TTL) {
    return memCache.compounds;
  }

  const disk = readDiskCache();
  if (disk && Date.now() - disk.ts < CACHE_TTL) {
    memCache = disk;
    return disk.compounds;
  }

  if (inflightPromise) return inflightPromise;

  inflightPromise = fetchAndCache().finally(() => {
    inflightPromise = null;
  });

  return inflightPromise;
}

export async function getArcGISUpcomingSafe(): Promise<ArcGISCompound[]> {
  try {
    return await getArcGISUpcoming();
  } catch (err) {
    console.error("[arcgis-cache] Total failure:", (err as Error).message);
    return [];
  }
}
