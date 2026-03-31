/**
 * @module ckan/client
 *
 * CKAN API client for Israel's data.gov.il open data portal.
 * Handles retries (with exponential back-off), request timeouts,
 * and automatic pagination for large datasets.
 */

import { CKAN_BASE_URL, USER_AGENT } from "@/config/datasets";
import type { CkanResponse, DatastoreSearchResult, SearchParams } from "./types";

const FETCH_TIMEOUT = 15000; // 15s – fail fast, don't block SSR
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1500;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Sends a single request to the CKAN API with automatic retries.
 *
 * @typeParam T - Expected shape of `result` in the CKAN response.
 * @param endpoint - CKAN action name (e.g. `"datastore_search"`).
 * @param params - Query-string parameters.
 * @param timeout - Request timeout in milliseconds.
 * @returns Parsed CKAN response.
 * @throws On non-retryable HTTP errors or exhausted retries.
 */
export async function ckanRequest<T>(
  endpoint: string,
  params: Record<string, string> = {},
  timeout = FETCH_TIMEOUT
): Promise<CkanResponse<T>> {
  const url = new URL(`${CKAN_BASE_URL}/${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await sleep(RETRY_DELAY_MS * attempt);
    }

    let timeoutId!: ReturnType<typeof setTimeout>;
    try {
      // Use Promise.race for timeout — AbortController.abort() throws an internal
      // Node.js error (controller[kState].transformAlgorithm) in some versions,
      // which silently swallows the abort and lets fetches hang indefinitely.
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(`Request timeout after ${timeout}ms`)), timeout);
      });

      const response = await Promise.race([
        fetch(url.toString(), {
          headers: { "User-Agent": USER_AGENT },
          cache: "no-store", // Skip Next.js cache (responses >2MB fail)
        }),
        timeoutPromise,
      ]);
      clearTimeout(timeoutId);

      if (!response.ok) {
        const isRetryable = response.status === 409 || response.status === 503 || response.status >= 500;
        lastError = new Error(`CKAN API error (${response.status}): ${response.statusText}`);
        if (isRetryable && attempt < MAX_RETRIES - 1) {
          continue;
        }
        throw lastError;
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error("CKAN API returned unsuccessful response");
      }

      return data as CkanResponse<T>;
    } catch (err) {
      clearTimeout(timeoutId);
      lastError = err instanceof Error ? err : new Error(String(err));
      const isTimeout = lastError.message.startsWith("Request timeout");
      if ((isTimeout || lastError.message.includes("CKAN API error")) && attempt < MAX_RETRIES - 1) {
        continue;
      }
      throw lastError;
    }
  }

  throw lastError || new Error("CKAN request failed after retries");
}

/**
 * Executes a single `datastore_search` call against a CKAN resource.
 *
 * @param searchParams - Search parameters including resource ID, filters, pagination, etc.
 * @returns The `result` portion of the CKAN datastore_search response.
 */
export async function searchRecords(
  searchParams: SearchParams
): Promise<DatastoreSearchResult> {
  const params: Record<string, string> = {
    resource_id: searchParams.resource_id,
  };

  if (searchParams.q) params.q = searchParams.q;
  if (searchParams.limit) params.limit = String(searchParams.limit);
  if (searchParams.offset) params.offset = String(searchParams.offset);
  if (searchParams.filters) params.filters = JSON.stringify(searchParams.filters);
  if (searchParams.fields) params.fields = searchParams.fields.join(",");
  if (searchParams.sort) params.sort = searchParams.sort.join(",");
  if (searchParams.include_total) params.include_total = "true";
  if (searchParams.distinct) params.distinct = searchParams.distinct;

  const response = await ckanRequest<DatastoreSearchResult>(
    "datastore_search",
    params
  );
  return response.result;
}

/**
 * Fetches all records from a CKAN resource, handling pagination automatically.
 * Pages through results in batches of 1000 until all records are retrieved.
 *
 * @param resourceId - CKAN resource UUID.
 * @param filters - Optional key-value filters applied server-side.
 * @param fields - Optional list of field names to retrieve (reduces payload).
 * @returns All matching records.
 */
export async function fetchAllRecords(
  resourceId: string,
  filters?: Record<string, unknown>,
  fields?: string[]
): Promise<Array<Record<string, unknown>>> {
  const allRecords: Array<Record<string, unknown>> = [];
  let offset = 0;
  const limit = 1000;

  while (true) {
    const result = await searchRecords({
      resource_id: resourceId,
      limit,
      offset,
      filters,
      fields,
      include_total: true,
    });

    allRecords.push(...result.records);

    if (!result.total || allRecords.length >= result.total) break;
    offset += limit;
  }

  return allRecords;
}
