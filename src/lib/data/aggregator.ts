/**
 * @module data/aggregator
 *
 * Central data aggregation layer for the investment scoring pipeline.
 * Fetches 10 government datasets from data.gov.il via the CKAN API,
 * normalizes Hebrew field names, and assembles {@link CityProfile} objects.
 *
 * Caching strategy:
 * - In-memory cache with 30-minute TTL for fast repeated access.
 * - Persistent disk cache (`.data-cache/`) for resilience when data.gov.il is unavailable.
 */

import { fetchAllRecords } from "@/lib/ckan/client";
import { RESOURCE_IDS } from "@/config/datasets";
import { normalizeCityName, safeNumber, safeTrim, groupByCity } from "./normalizers";
import type { CityProfile, AgeDistribution, ScoreBreakdown } from "@/types/city";
import { calculateInvestmentScore } from "@/lib/scoring/calculator";
import fs from "fs";
import path from "path";

export interface RawCityData {
  population: Map<string, Record<string, unknown>>;
  urbanRenewal: Map<string, Record<string, unknown>[]>;
  construction: Map<string, Record<string, unknown>[]>;
  housing: Map<string, Record<string, unknown>[]>;
  mechir: Map<string, Record<string, unknown>[]>;
  banks: Map<string, Record<string, unknown>[]>;
  busStops: Map<string, Record<string, unknown>[]>;
  greenBuildings: Map<string, Record<string, unknown>[]>;
  contaminated: Map<string, Record<string, unknown>[]>;
  municipalFinances: Map<string, Record<string, unknown>[]>;
}

let cachedData: { data: RawCityData; timestamp: number } | null = null;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes (data fetches are expensive)

// Inflight dedup: coalesce concurrent cache-miss fetches into a single request
let inflightFetch: Promise<RawCityData> | null = null;

// Scored profiles cache: avoid re-running calculateInvestmentScore on same raw data
let cachedProfiles: { profiles: CityProfile[]; rawRef: RawCityData } | null = null;

// ── Persistent disk cache ──
// Saves successful API data to a JSON file so the app works even when
// data.gov.il is down. File lives alongside .next/ in the project root.
const DISK_CACHE_DIR = path.join(process.cwd(), ".data-cache");
const DISK_CACHE_FILE = path.join(DISK_CACHE_DIR, "raw-datasets.json");

interface DiskCachePayload {
  ts: number;
  datasets: {
    population: Array<Record<string, unknown>>;
    urbanRenewal: Array<Record<string, unknown>>;
    construction: Array<Record<string, unknown>>;
    housing: Array<Record<string, unknown>>;
    mechir: Array<Record<string, unknown>>;
    banks: Array<Record<string, unknown>>;
    busStops: Array<Record<string, unknown>>;
    greenBuildings: Array<Record<string, unknown>>;
    contaminated: Array<Record<string, unknown>>;
    municipalFinances: Array<Record<string, unknown>>;
  };
}

function writeDiskCache(payload: DiskCachePayload) {
  try {
    if (!fs.existsSync(DISK_CACHE_DIR)) {
      fs.mkdirSync(DISK_CACHE_DIR, { recursive: true, mode: 0o700 });
    }
    fs.writeFileSync(DISK_CACHE_FILE, JSON.stringify(payload), { mode: 0o600 });
    console.log(`[cache] Saved ${Object.values(payload.datasets).reduce((s, a) => s + a.length, 0)} records to disk cache`);
  } catch (err) {
    console.warn("[cache] Failed to write disk cache:", (err as Error).message);
  }
}

function readDiskCache(): DiskCachePayload | null {
  try {
    if (!fs.existsSync(DISK_CACHE_FILE)) return null;
    const raw = fs.readFileSync(DISK_CACHE_FILE, "utf-8");
    const payload = JSON.parse(raw) as DiskCachePayload;
    const ageHours = (Date.now() - payload.ts) / (1000 * 60 * 60);
    console.log(`[cache] Disk cache available (${ageHours.toFixed(1)}h old, ${payload.datasets.population.length} population records)`);
    return payload;
  } catch {
    return null;
  }
}

function buildRawFromArrays(
  populationRaw: Array<Record<string, unknown>>,
  urbanRenewalRaw: Array<Record<string, unknown>>,
  constructionRaw: Array<Record<string, unknown>>,
  housingRaw: Array<Record<string, unknown>>,
  mechirRaw: Array<Record<string, unknown>>,
  banksRaw: Array<Record<string, unknown>>,
  busStopsRaw: Array<Record<string, unknown>>,
  greenBuildingsRaw: Array<Record<string, unknown>>,
  contaminatedRaw: Array<Record<string, unknown>>,
  municipalFinancesRaw: Array<Record<string, unknown>> = []
): RawCityData {
  const populationMap = new Map<string, Record<string, unknown>>();
  for (const rec of populationRaw) {
    const name = normalizeCityName(String(rec["שם_ישוב"] ?? ""));
    if (name && safeNumber(rec["סהכ"]) > 0) {
      populationMap.set(name, rec);
    }
  }

  return {
    population: populationMap,
    urbanRenewal: groupByCity(urbanRenewalRaw, "Yeshuv"),
    construction: groupByCity(constructionRaw, "city_name"),
    housing: groupByCity(housingRaw, "יישוב"),
    mechir: groupByCity(mechirRaw, "LamasName"),
    banks: groupByCity(banksRaw, "City"),
    busStops: groupByCity(busStopsRaw, "CityName"),
    greenBuildings: groupByCity(greenBuildingsRaw, "municipality_name"),
    contaminated: groupByCity(contaminatedRaw, "רשות מקומית"),
    municipalFinances: groupByCity(municipalFinancesRaw, "שם_רשות"),
  };
}

/**
 * Fetches all 10 government datasets in parallel and returns grouped raw data.
 * Uses in-memory cache (30 min TTL), falls back to disk cache if the API is down.
 *
 * @returns Grouped raw records keyed by normalized city name.
 */
export async function fetchRawData(): Promise<RawCityData> {
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
    return cachedData.data;
  }

  // Coalesce concurrent requests: if a fetch is already in progress, share it
  if (inflightFetch) {
    return inflightFetch;
  }

  inflightFetch = fetchRawDataInternal();
  try {
    return await inflightFetch;
  } finally {
    inflightFetch = null;
  }
}

async function fetchRawDataInternal(): Promise<RawCityData> {
  // Fetch all datasets in parallel - gracefully handle individual failures
  const safeFetch = async (
    ...args: Parameters<typeof fetchAllRecords>
  ): Promise<Array<Record<string, unknown>>> => {
    try {
      return await fetchAllRecords(...args);
    } catch (err) {
      console.warn(`Failed to fetch dataset ${args[0]}:`, (err as Error).message);
      return [];
    }
  };

  const [
    populationRaw,
    urbanRenewalRaw,
    constructionRaw,
    housingRaw,
    mechirRaw,
    banksRaw,
    busStopsRaw,
    greenBuildingsRaw,
    contaminatedRaw,
    municipalFinancesRaw,
  ] = await Promise.all([
    safeFetch(RESOURCE_IDS.population),
    safeFetch(RESOURCE_IDS.urbanRenewal),
    safeFetch(RESOURCE_IDS.constructionSites),
    safeFetch(RESOURCE_IDS.housingInventory),
    safeFetch(RESOURCE_IDS.mechirLaMishtaken),
    safeFetch(RESOURCE_IDS.bankBranches),
    safeFetch(RESOURCE_IDS.busStops, undefined, [
      "CityName", "CityCode", "StationTypeName", "Lat", "Long", "StopName",
    ]),
    safeFetch(RESOURCE_IDS.greenBuildings, undefined, [
      "municipality_name", "municipality_id", "residential_units",
      "certificate_score_a", "certificate_stars_a", "main_use_name",
      "building_street", "building_address_number", "X", "Y", "floors_above_ground",
    ]),
    safeFetch(RESOURCE_IDS.contaminatedLand),
    safeFetch(RESOURCE_IDS.municipalFinances, { "עמודה": "שנה נוכחית" }, [
      "שם_רשות", "קוד_רשות", "קוד", "ערך", "שנת_נתונים",
    ]),
  ]);

  // If API returned population data → build from live data & persist to disk
  if (populationRaw.length > 0) {
    const data = buildRawFromArrays(
      populationRaw, urbanRenewalRaw, constructionRaw, housingRaw,
      mechirRaw, banksRaw, busStopsRaw, greenBuildingsRaw, contaminatedRaw,
      municipalFinancesRaw
    );

    cachedData = { data, timestamp: Date.now() };

    // Persist to disk for offline fallback
    writeDiskCache({
      ts: Date.now(),
      datasets: {
        population: populationRaw,
        urbanRenewal: urbanRenewalRaw,
        construction: constructionRaw,
        housing: housingRaw,
        mechir: mechirRaw,
        banks: banksRaw,
        busStops: busStopsRaw,
        greenBuildings: greenBuildingsRaw,
        contaminated: contaminatedRaw,
        municipalFinances: municipalFinancesRaw,
      },
    });

    return data;
  }

  // API is down – fall back to disk cache
  console.warn("[cache] API returned no population data – falling back to disk cache");
  const diskCache = readDiskCache();
  if (diskCache) {
    const d = diskCache.datasets;
    const data = buildRawFromArrays(
      d.population, d.urbanRenewal, d.construction, d.housing,
      d.mechir, d.banks, d.busStops, d.greenBuildings, d.contaminated,
      d.municipalFinances || []
    );
    // Use disk-cache timestamp so it refreshes when TTL expires
    cachedData = { data, timestamp: Date.now() };
    return data;
  }

  // No disk cache available – return empty data
  console.warn("[cache] No disk cache available – returning empty data");
  return buildRawFromArrays([], [], [], [], [], [], [], [], []);
}

/**
 * Assembles a single {@link CityProfile} from raw government data.
 * Extracts demographics, development, pricing, infrastructure, environment,
 * and municipal finance metrics. Scores are initialized to zero.
 *
 * @param cityName - Normalized Hebrew city name.
 * @param popRecord - Population record from the CBS dataset.
 * @param raw - All grouped raw datasets.
 * @returns A CityProfile with scores set to zero (scored later by calculator).
 */
function buildCityProfile(
  cityName: string,
  popRecord: Record<string, unknown>,
  raw: RawCityData
): CityProfile {
  const cityCode = safeNumber(popRecord["סמל_ישוב"]);
  const population = safeNumber(popRecord["סהכ"]);
  const district = safeTrim(popRecord["נפה"]);

  const ageDistribution: AgeDistribution = {
    age_0_5: safeNumber(popRecord["גיל_0_5"]),
    age_6_18: safeNumber(popRecord["גיל_6_18"]),
    age_19_45: safeNumber(popRecord["גיל_19_45"]),
    age_46_55: safeNumber(popRecord["גיל_46_55"]),
    age_56_64: safeNumber(popRecord["גיל_56_64"]),
    age_65_plus: safeNumber(popRecord["גיל_65_פלוס"]),
  };

  const youngAdultRatio = population > 0
    ? ageDistribution.age_19_45 / population
    : 0;

  // Urban renewal
  const renewalRecords = raw.urbanRenewal.get(cityName) || [];
  const urbanRenewalProjects = renewalRecords.length;
  const urbanRenewalUnitsExisting = renewalRecords.reduce(
    (sum, r) => sum + safeNumber(r["YachadKayam"]), 0
  );
  const urbanRenewalUnitsAdditional = renewalRecords.reduce(
    (sum, r) => sum + safeNumber(r["YachadTosafti"]), 0
  );
  const urbanRenewalInExecution = renewalRecords.filter(
    (r) => safeTrim(r["Bebitzua"]) === "כן"
  ).length;

  // Construction
  const constructionRecords = raw.construction.get(cityName) || [];
  const constructionSites = constructionRecords.length;
  const constructionWithCranes = constructionRecords.filter(
    (r) => { const v = safeTrim(r["has_cranes"]); return v === "כן" || v === "yes"; }
  ).length;

  // Housing inventory
  const housingRecords = raw.housing.get(cityName) || [];
  const housingInventoryUnits = housingRecords.reduce(
    (sum, r) => sum + safeNumber(r["יחד פוטנציאל לשיווק"]), 0
  );

  // Mechir LaMishtaken
  const mechirRecords = raw.mechir.get(cityName) || [];
  const mechirLaMishtakenProjects = mechirRecords.length;
  let mechirLaMishtakenAvgPricePerMeter: number | null = null;
  let subscriberToWinnerRatio: number | null = null;

  if (mechirRecords.length > 0) {
    const prices = mechirRecords
      .map((r) => safeNumber(r["PriceForMeter"]))
      .filter((p) => p > 0);
    if (prices.length > 0) {
      mechirLaMishtakenAvgPricePerMeter =
        prices.reduce((a, b) => a + b, 0) / prices.length;
    }

    const totalSubscribers = mechirRecords.reduce(
      (sum, r) => sum + safeNumber(r["Subscribers"]), 0
    );
    const totalWinners = mechirRecords.reduce(
      (sum, r) => sum + safeNumber(r["Winners"]), 0
    );
    if (totalWinners > 0) {
      subscriberToWinnerRatio = totalSubscribers / totalWinners;
    }
  }

  // Infrastructure
  const bankRecords = raw.banks.get(cityName) || [];
  const busStopRecords = raw.busStops.get(cityName) || [];
  const greenBuildingRecords = raw.greenBuildings.get(cityName) || [];

  const greenBuildingScores = greenBuildingRecords
    .map((r) => safeNumber(r["certificate_score_a"]))
    .filter((s) => s > 0);
  const greenBuildingAvgScore =
    greenBuildingScores.length > 0
      ? greenBuildingScores.reduce((a, b) => a + b, 0) / greenBuildingScores.length
      : null;

  // Environment
  const contaminatedRecords = raw.contaminated.get(cityName) || [];
  const contaminatedSitesRemediated = contaminatedRecords.filter(
    (r) => safeTrim(r["שנת סיום טיפול"]).length > 0
  ).length;

  // Municipal finances
  const financeRecords = raw.municipalFinances.get(cityName) || [];
  const getFinanceValue = (code: number): number | null => {
    const rec = financeRecords.find((r) => safeNumber(r["קוד"]) === code);
    return rec ? safeNumber(rec["ערך"]) : null;
  };
  const municipalBudgetSurplus = getFinanceValue(9);    // Accumulated surplus/deficit
  const municipalTotalIncome = getFinanceValue(2837);    // Total regular income
  const municipalTotalExpenses = getFinanceValue(2879);  // Total regular expenses
  const municipalLoanBurden = getFinanceValue(1299);     // Outstanding loan burden

  // Data availability: a city has infrastructure data if ANY of the 3 sources returned records
  const hasInfrastructureData = bankRecords.length > 0 || busStopRecords.length > 0 || greenBuildingRecords.length > 0;
  // Development data: any renewal, construction, or housing records
  const hasDevelopmentData = renewalRecords.length > 0 || constructionRecords.length > 0 || housingRecords.length > 0;
  // Environment: no contaminated sites listed = clean city (good score, not N/A).
  // Only mark N/A if the entire contaminated dataset failed to load (checked globally).
  const hasEnvironmentData = true;

  const profileWithoutScore: Omit<CityProfile, "investmentScore" | "scoreBreakdown"> = {
    cityName,
    cityCode,
    district,
    population,
    ageDistribution,
    youngAdultRatio,
    urbanRenewalProjects,
    urbanRenewalUnitsExisting,
    urbanRenewalUnitsAdditional,
    urbanRenewalInExecution,
    constructionSites,
    constructionWithCranes,
    housingInventoryUnits,
    mechirLaMishtakenAvgPricePerMeter,
    mechirLaMishtakenProjects,
    subscriberToWinnerRatio,
    bankBranchCount: bankRecords.length,
    busStopCount: busStopRecords.length,
    greenBuildingCount: greenBuildingRecords.length,
    greenBuildingAvgScore,
    contaminatedSiteCount: contaminatedRecords.length,
    contaminatedSitesRemediated,
    municipalBudgetSurplus,
    municipalTotalIncome,
    municipalTotalExpenses,
    municipalLoanBurden,
    hasInfrastructureData,
    hasDevelopmentData,
    hasEnvironmentData,
  };

  return {
    ...profileWithoutScore,
    investmentScore: 0,
    scoreBreakdown: { overall: 0, development: 0, demand: 0, price: 0, infrastructure: 0, municipal: 0, environment: 0 },
  };
}

/**
 * Returns scored {@link CityProfile}[] for all cities with population >= 5000.
 * Orchestrates data fetching, profile building, and investment scoring.
 */
export async function getAllCityProfiles(): Promise<CityProfile[]> {
  const raw = await fetchRawData();

  // Return cached scored profiles if raw data hasn't changed
  if (cachedProfiles && cachedProfiles.rawRef === raw) {
    return cachedProfiles.profiles;
  }

  // Build profiles for all cities with population > 5000
  const profiles: CityProfile[] = [];
  for (const [cityName, popRecord] of raw.population) {
    const pop = safeNumber(popRecord["סהכ"]);
    if (pop < 5000) continue; // Skip very small localities
    profiles.push(buildCityProfile(cityName, popRecord, raw));
  }

  // Calculate scores using percentile ranking
  const scored = calculateInvestmentScore(profiles);
  cachedProfiles = { profiles: scored, rawRef: raw };
  return scored;
}

export async function getCityProfile(cityCode: number): Promise<CityProfile | null> {
  const profiles = await getAllCityProfiles();
  return profiles.find((p) => p.cityCode === cityCode) ?? null;
}

/**
 * Lightweight city code → name resolver. Avoids triggering full scoring.
 */
export async function getCityNameByCode(cityCode: number): Promise<string | null> {
  const raw = await fetchRawData();
  for (const [name, rec] of raw.population) {
    if (safeNumber(rec["סמל_ישוב"]) === cityCode) return name;
  }
  return null;
}
