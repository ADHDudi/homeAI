import path from "path";
import { createDiskCache } from "@/lib/utils/diskCache";
import type { ArcGISCompound } from "./types";
import { fetchUpcomingProjects } from "./client";

const CACHE_TTL = 15 * 60 * 1000; // 15 minutes
const DISK_CACHE_DIR = path.join(process.cwd(), ".data-cache");
const DISK_CACHE_FILE = path.join(DISK_CACHE_DIR, "arcgis-upcoming.json");

const cache = createDiskCache<ArcGISCompound>({
  cacheDir: DISK_CACHE_DIR,
  cacheFile: DISK_CACHE_FILE,
  ttlMs: CACHE_TTL,
  fetchFn: fetchUpcomingProjects,
  logPrefix: "arcgis-cache",
});

export const getArcGISUpcoming = cache.get;
export const getArcGISUpcomingSafe = cache.getSafe;
