import type { ArcGISCompound, ArcGISQueryResponse } from "./types";

const ARCGIS_URL =
  "https://services6.arcgis.com/I08Ekaykft5ELucH/arcgis/rest/services/GIS_Dira/FeatureServer/2/query";
const TIMEOUT = 30_000;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1_500;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetches upcoming (MarketingStatusId=2) projects from the ArcGIS Feature Service.
 * No pagination needed — typically ~79 records, well under the ArcGIS transfer limit.
 */
export async function fetchUpcomingProjects(): Promise<ArcGISCompound[]> {
  const url = `${ARCGIS_URL}?where=MarketingStatusId%3D2&outFields=*&f=json`;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await sleep(RETRY_DELAY_MS * attempt);
    }

    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`ArcGIS timeout after ${TIMEOUT}ms`)),
          TIMEOUT
        )
      );

      const response = await Promise.race([
        fetch(url, {
          headers: { Accept: "application/json" },
          next: { revalidate: 900 },
        }),
        timeoutPromise,
      ]);

      if (!response.ok) {
        lastError = new Error(
          `ArcGIS error (${response.status}): ${response.statusText}`
        );
        if (response.status >= 500 && attempt < MAX_RETRIES - 1) continue;
        throw lastError;
      }

      const data = (await response.json()) as ArcGISQueryResponse;

      if (data.exceededTransferLimit) {
        console.warn(
          "[arcgis] Transfer limit exceeded — some records may be missing"
        );
      }

      const compounds = (data.features || []).map((f) => f.attributes);
      console.log(`[arcgis] Fetched ${compounds.length} upcoming projects`);
      return compounds;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const isRetryable =
        lastError.message.includes("timeout") ||
        lastError.message.includes("ArcGIS error");
      if (isRetryable && attempt < MAX_RETRIES - 1) continue;
      throw lastError;
    }
  }

  throw lastError || new Error("ArcGIS request failed after retries");
}
