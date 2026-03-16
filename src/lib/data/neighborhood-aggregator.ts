import { fetchRawData, type RawCityData } from "./aggregator";
import { safeNumber, safeTrim, normalizeCityName } from "./normalizers";
import { itmToWgs84 } from "@/lib/utils/coordinates";
import type {
  CityNeighborhoodData,
  MechirProject,
  NeighborhoodPricing,
  RenewalProject,
  ConstructionSite,
  GreenBuilding,
  PointOfInterest,
  ContaminatedSite,
  HousingPlan,
} from "@/types/neighborhood";

function extractMechirProjects(records: Record<string, unknown>[]): MechirProject[] {
  return records.map((r) => ({
    name: safeTrim(r["ProjectName"]),
    neighborhood: safeTrim(r["Neighborhood"]),
    pricePerMeter: safeNumber(r["PriceForMeter"]),
    units: safeNumber(r["LotteryHousingUnits"]),
    subscribers: safeNumber(r["Subscribers"]),
    winners: safeNumber(r["Winners"]),
    status: safeTrim(r["ProjectStatus"]),
  }));
}

function groupByNeighborhood(projects: MechirProject[]): NeighborhoodPricing[] {
  const groups = new Map<string, MechirProject[]>();
  for (const p of projects) {
    const key = p.neighborhood || "Unknown";
    const arr = groups.get(key) || [];
    arr.push(p);
    groups.set(key, arr);
  }

  return Array.from(groups.entries())
    .map(([neighborhood, projs]) => {
      const prices = projs.map((p) => p.pricePerMeter).filter((p) => p > 0);
      const avgPricePerMeter =
        prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;

      const totalUnits = projs.reduce((sum, p) => sum + p.units, 0);
      const totalSubs = projs.reduce((sum, p) => sum + p.subscribers, 0);
      const totalWins = projs.reduce((sum, p) => sum + p.winners, 0);
      const avgSubscriberRatio = totalWins > 0 ? totalSubs / totalWins : null;

      return { neighborhood, projects: projs, avgPricePerMeter, totalUnits, avgSubscriberRatio };
    })
    .sort((a, b) => b.avgPricePerMeter - a.avgPricePerMeter);
}

function extractRenewalProjects(records: Record<string, unknown>[]): RenewalProject[] {
  return records.map((r) => ({
    complexName: safeTrim(r["ShemMitcham"]) || safeTrim(r["ProjectName"]) || "Unknown",
    existingUnits: safeNumber(r["YachadKayam"]),
    additionalUnits: safeNumber(r["YachadTosafti"]),
    inExecution: safeTrim(r["Bebitzua"]) === "כן",
  }));
}

function extractConstructionSites(records: Record<string, unknown>[]): ConstructionSite[] {
  return records.map((r) => ({
    address: safeTrim(r["site_name"]),
    buildTypes: safeTrim(r["build_types"]),
    executor: safeTrim(r["executor_name"]),
    hasCranes: safeTrim(r["has_cranes"]) === "כן" || safeTrim(r["has_cranes"]) === "yes",
  }));
}

function extractGreenBuildings(records: Record<string, unknown>[]): GreenBuilding[] {
  const results: GreenBuilding[] = [];
  for (const r of records) {
    const x = safeNumber(r["X"]);
    const y = safeNumber(r["Y"]);
    const coords = x > 0 && y > 0 ? itmToWgs84(x, y) : null;
    if (!coords) continue;

    results.push({
      street: safeTrim(r["building_street"]),
      number: safeTrim(r["building_address_number"]),
      lat: coords.lat,
      lng: coords.lng,
      floors: safeNumber(r["floors_above_ground"]),
      units: safeNumber(r["residential_units"]),
      score: safeNumber(r["certificate_score_a"]),
    });
  }
  return results;
}

function extractBusStops(records: Record<string, unknown>[]): PointOfInterest[] {
  const results: PointOfInterest[] = [];
  for (const r of records) {
    const lat = safeNumber(r["Lat"]);
    const lng = safeNumber(r["Long"]);
    if (lat === 0 || lng === 0) continue;

    results.push({
      name: safeTrim(r["StopName"]) || "Bus Stop",
      type: "bus_stop",
      lat,
      lng,
      details: safeTrim(r["StationTypeName"]),
    });
  }
  return results;
}

function extractBankBranches(records: Record<string, unknown>[]): PointOfInterest[] {
  const results: PointOfInterest[] = [];
  for (const r of records) {
    const x = safeNumber(r["X_Coordinate"]);
    const y = safeNumber(r["Y_Coordinate"]);
    const coords = x > 0 && y > 0 ? itmToWgs84(x, y) : null;

    const bankName = safeTrim(r["Bank_Name"]);
    const branchName = safeTrim(r["Branch_Name"]);
    const name = branchName ? `${bankName} - ${branchName}` : bankName;

    if (coords) {
      results.push({
        name,
        type: "bank_branch",
        lat: coords.lat,
        lng: coords.lng,
        details: safeTrim(r["Branch_Address"]),
      });
    }
  }
  return results;
}

function extractContaminatedSites(records: Record<string, unknown>[]): ContaminatedSite[] {
  return records.map((r) => ({
    name: safeTrim(r["שם האתר"]),
    address: safeTrim(r["כתובת"]),
    level: safeTrim(r["דרגת זיהום"]),
    source: safeTrim(r["מקור הזיהום"]),
  }));
}

function extractHousingPlans(records: Record<string, unknown>[]): HousingPlan[] {
  return records.map((r) => ({
    planName: safeTrim(r["שם תוכנית"]),
    planNumber: safeTrim(r["מספר תוכנית"]),
    potentialUnits: safeNumber(r["יחד פוטנציאל לשיווק"]),
  }));
}

export async function getCityNeighborhoodData(
  cityName: string
): Promise<CityNeighborhoodData> {
  const raw: RawCityData = await fetchRawData();
  const normalized = normalizeCityName(cityName);

  // Extract from pre-grouped Maps - only processes this city's records
  const mechirRecords = raw.mechir.get(normalized) || [];
  const renewalRecords = raw.urbanRenewal.get(normalized) || [];
  const constructionRecords = raw.construction.get(normalized) || [];
  const greenBuildingRecords = raw.greenBuildings.get(normalized) || [];
  const busStopRecords = raw.busStops.get(normalized) || [];
  const bankRecords = raw.banks.get(normalized) || [];
  const contaminatedRecords = raw.contaminated.get(normalized) || [];
  const housingRecords = raw.housing.get(normalized) || [];

  // Extract and transform
  const mechirProjects = extractMechirProjects(mechirRecords);
  const neighborhoodPricing = groupByNeighborhood(mechirProjects);

  return {
    neighborhoodPricing,
    renewalProjects: extractRenewalProjects(renewalRecords),
    constructionSites: extractConstructionSites(constructionRecords),
    greenBuildings: extractGreenBuildings(greenBuildingRecords),
    busStops: extractBusStops(busStopRecords),
    bankBranches: extractBankBranches(bankRecords),
    contaminatedSites: extractContaminatedSites(contaminatedRecords),
    housingPlans: extractHousingPlans(housingRecords),
  };
}
