/**
 * Calculate percentile rank (0-100) for a value within a sorted array.
 * Higher values get higher percentiles by default.
 * Set invert=true for metrics where lower is better (e.g. contamination).
 */
export function percentileRank(
  value: number,
  allValues: number[],
  invert = false
): number {
  if (allValues.length === 0) return 50;

  const sorted = [...allValues].sort((a, b) => a - b);
  // Count values below this one
  let below = 0;
  for (const v of sorted) {
    if (v < value) below++;
    else break;
  }

  const rank = (below / sorted.length) * 100;
  return invert ? 100 - rank : rank;
}

/**
 * Normalize a per-capita metric across all cities.
 */
export function perCapitaPercentile(
  count: number,
  population: number,
  allCounts: number[],
  allPops: number[],
  invert = false
): number {
  if (population === 0) return 50;

  const perCapita = (count / population) * 1000;
  const allPerCapita = allCounts.map((c, i) => {
    const p = allPops[i];
    return p > 0 ? (c / p) * 1000 : 0;
  });

  return percentileRank(perCapita, allPerCapita, invert);
}
