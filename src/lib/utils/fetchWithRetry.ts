/**
 * @module utils/fetchWithRetry
 *
 * Shared fetch wrapper with Promise.race-based timeout and exponential-backoff
 * retries. Extracted from ckan/client, arcgis/client, and dira/client which all
 * had verbatim copies of this pattern.
 *
 * Why Promise.race instead of AbortController: AbortController.abort() triggers
 * an internal Node.js error (controller[kState].transformAlgorithm) in some
 * versions, which silently swallows the abort and lets fetches hang indefinitely.
 */

export interface FetchRetryOptions extends Omit<RequestInit, "signal"> {
  /** Request timeout in milliseconds. Default: 15 000 */
  timeout?: number;
  /** Maximum number of attempts (1 = no retry). Default: 2 */
  maxRetries?: number;
  /** Base delay between retries (multiplied by attempt index). Default: 1 500 */
  retryDelayMs?: number;
  /**
   * Called with an HTTP error status to decide if the request should be
   * retried. Only invoked when response.ok is false.
   * Default: retries on 5xx only.
   */
  isRetryableStatus?: (status: number) => boolean;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * fetch() with timeout (via Promise.race) and exponential-backoff retries.
 *
 * - Timeouts and network errors are retried automatically.
 * - HTTP errors are retried only when `isRetryableStatus` returns true.
 * - Non-retryable HTTP responses are returned as-is; callers must check `response.ok`.
 */
export async function fetchWithRetry(
  url: string,
  {
    timeout = 15_000,
    maxRetries = 2,
    retryDelayMs = 1_500,
    isRetryableStatus = (s) => s >= 500,
    ...init
  }: FetchRetryOptions = {}
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) await sleep(retryDelayMs * attempt);

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error(`Request timeout after ${timeout}ms`)),
          timeout
        );
      });

      const response = await Promise.race([fetch(url, init), timeoutPromise]);
      clearTimeout(timeoutId);

      if (!response.ok && isRetryableStatus(response.status) && attempt < maxRetries - 1) {
        lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
        continue;
      }

      return response;
    } catch (err) {
      if (timeoutId !== undefined) clearTimeout(timeoutId);
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxRetries - 1) continue;
      throw lastError;
    }
  }

  throw lastError ?? new Error("Request failed after retries");
}
