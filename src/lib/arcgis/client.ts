import { fetchWithRetry } from "@/lib/utils/fetchWithRetry";
import type { ArcGISCompound, ArcGISQueryResponse } from "./types";

const ARCGIS_URL =
  "https://services6.arcgis.com/I08Ekaykft5ELucH/arcgis/rest/services/GIS_Dira/FeatureServer/2/query";
const TIMEOUT = 30_000;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1_500;

/**
 * Fetches upcoming (MarketingStatusId=2) projects from the ArcGIS Feature Service.
 * No pagination needed — typically ~79 records, well under the ArcGIS transfer limit.
 */
export async function fetchUpcomingProjects(): Promise<ArcGISCompound[]> {
  const url = `${ARCGIS_URL}?where=MarketingStatusId%3D2&outFields=*&f=json`;

  const response = await fetchWithRetry(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 900 },
    timeout: TIMEOUT,
    maxRetries: MAX_RETRIES,
    retryDelayMs: RETRY_DELAY_MS,
  });

  if (!response.ok) {
    throw new Error(`ArcGIS error (${response.status}): ${response.statusText}`);
  }

  const data = (await response.json()) as ArcGISQueryResponse;

  if (data.exceededTransferLimit) {
    console.warn("[arcgis] Transfer limit exceeded — some records may be missing");
  }

  const compounds = (data.features || []).map((f) => f.attributes);
  console.log(`[arcgis] Fetched ${compounds.length} upcoming projects`);
  return compounds;
}
