/**
 * Calculate percentile rank (0-100) for a value within an array of values.
 * Higher values get higher percentiles by default.
 * Set invert=true for metrics where lower is better (e.g. contamination).
 *
 * Accepts a pre-sorted array for performance (avoids re-sorting on every call).
 */
export function percentileRank(
  value: number,
  sortedValues: number[],
  invert = false
): number {
  if (sortedValues.length === 0) return 50;

  // Binary search for count of values below this one
  let lo = 0;
  let hi = sortedValues.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (sortedValues[mid] < value) lo = mid + 1;
    else hi = mid;
  }

  const rank = (lo / sortedValues.length) * 100;
  return invert ? 100 - rank : rank;
}

/**
 * Pre-sort an array of numbers for use with percentileRank.
 */
export function sortForPercentile(values: number[]): number[] {
  return [...values].sort((a, b) => a - b);
}

/**
 * Normalize a per-capita metric across all cities.
 * Accepts pre-sorted per-capita values for performance.
 */
export function perCapitaPercentile(
  count: number,
  population: number,
  allPerCapitaSorted: number[],
  invert = false
): number {
  if (population === 0) return 50;
  const perCapita = (count / population) * 1000;
  return percentileRank(perCapita, allPerCapitaSorted, invert);
}
