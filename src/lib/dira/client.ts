/**
 * @module dira/client
 *
 * HTTP client for the dira.moch.gov.il Mechir LaMishtaken API.
 * Mirrors the CKAN client pattern: pure fetch with retries, timeouts.
 * The API is a public GET endpoint — no auth or session required.
 */

import { fetchWithRetry } from "@/lib/utils/fetchWithRetry";
import type { DiraApiResponse, DiraProject } from "./types";

const DIRA_BASE = "https://dira.moch.gov.il/api/Invoker";
const TIMEOUT = 30_000; // 30s — dira.moch.gov.il can be slow
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1_500;
const PAGE_SIZE = 200;

/**
 * Makes a single GET request to the Dira API with timeout and retries.
 */
async function diraRequest(
  method: string,
  param: string
): Promise<DiraApiResponse> {
  const url = `${DIRA_BASE}?method=${encodeURIComponent(method)}&param=${encodeURIComponent(param)}`;

  const response = await fetchWithRetry(url, {
    headers: {
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    next: { revalidate: 900 }, // 15-min revalidation to match cache TTL
    timeout: TIMEOUT,
    maxRetries: MAX_RETRIES,
    retryDelayMs: RETRY_DELAY_MS,
    // Only retry on 5xx; 4xx errors (400/404) are not retryable
    isRetryableStatus: (s) => s >= 500,
  });

  if (!response.ok) {
    throw new Error(`Dira API error (${response.status}): ${response.statusText}`);
  }

  return (await response.json()) as DiraApiResponse;
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

    // First page tells us the total; guard against NaN/undefined/non-finite values
    if (page === 1) {
      if (!Number.isFinite(data.NumOfRecords) || data.NumOfRecords <= 0) {
        console.warn(
          `[dira] Invalid NumOfRecords (${data.NumOfRecords}) on page 1 — stopping pagination`
        );
        break;
      }
      total = data.NumOfRecords;
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
