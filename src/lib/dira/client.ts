/**
 * @module dira/client
 *
 * HTTP client for the dira.moch.gov.il Mechir LaMishtaken API.
 * Mirrors the CKAN client pattern: pure fetch with retries, timeouts.
 * The API is a public GET endpoint — no auth or session required.
 */

import type { DiraApiResponse, DiraProject } from "./types";

const DIRA_BASE = "https://dira.moch.gov.il/api/Invoker";
const TIMEOUT = 30_000; // 30s — dira.moch.gov.il can be slow
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1_500;
const PAGE_SIZE = 200;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Makes a single GET request to the Dira API with timeout and retries.
 */
async function diraRequest(
  method: string,
  param: string
): Promise<DiraApiResponse> {
  const url = `${DIRA_BASE}?method=${encodeURIComponent(method)}&param=${encodeURIComponent(param)}`;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await sleep(RETRY_DELAY_MS * attempt);
    }

    let timeoutId!: ReturnType<typeof setTimeout>;
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error(`Dira API timeout after ${TIMEOUT}ms`)),
          TIMEOUT
        );
      });

      const response = await Promise.race([
        fetch(url, {
          headers: {
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          next: { revalidate: 900 }, // 15-min revalidation to match cache TTL
        }),
        timeoutPromise,
      ]);
      clearTimeout(timeoutId);

      if (!response.ok) {
        lastError = new Error(
          `Dira API error (${response.status}): ${response.statusText}`
        );
        if (response.status >= 500 && attempt < MAX_RETRIES - 1) continue;
        throw lastError;
      }

      const data = (await response.json()) as DiraApiResponse;
      return data;
    } catch (err) {
      clearTimeout(timeoutId);
      lastError = err instanceof Error ? err : new Error(String(err));
      const isRetryable =
        lastError.message.includes("timeout") ||
        lastError.message.includes("Dira API error");
      if (isRetryable && attempt < MAX_RETRIES - 1) continue;
      throw lastError;
    }
  }

  throw lastError || new Error("Dira request failed after retries");
}

/**
 * Fetches all Dira lottery projects, paginating through results.
 * Uses ProjectStatus=1 (All) and Entitlement=1 (All) to get everything.
 */
export async function fetchAllDiraProjects(): Promise<DiraProject[]> {
  const allProjects: DiraProject[] = [];
  let page = 1;
  let total = Infinity;

  while (allProjects.length < total) {
    const param = `?firstApplicantIdentityNumber=&secondApplicantIdentityNumber=&ProjectStatus=1&Entitlement=1&PageNumber=${page}&PageSize=${PAGE_SIZE}&IsInit=${page === 1 ? "true" : "false"}&`;
    const data = await diraRequest("Projects", param);

    // ActionStatus !== 0 means the API returned an error envelope.
    // Use ?? 0 so that a missing field is treated as success (not an error).
    if ((data.ActionStatus ?? 0) !== 0) {
      const msg = data.Messages?.join(", ") || `ActionStatus ${data.ActionStatus}`;
      throw new Error(`[dira] API error on page ${page}: ${msg}`);
    }

    if (data.ProjectItems) {
      allProjects.push(...data.ProjectItems);
    }

    // First page tells us the total; treat 0 as a signal that something is wrong
    if (page === 1) {
      total = data.NumOfRecords;
      if (total === 0) {
        console.warn("[dira] NumOfRecords=0 on page 1 — API may have returned empty data");
        break;
      }
    }

    // If API returned all at once (IsAll=true) or no more items, stop
    if (data.IsAll || !data.ProjectItems?.length) break;

    page++;
  }

  console.log(
    `[dira] Fetched ${allProjects.length} projects (open: ${allProjects[0]?.OpenLotteriesCount ?? 0})`
  );
  return allProjects;
}
