/**
 * @module scoring/calculator
 *
 * Investment scoring engine for Israeli cities.
 * Calculates percentile-ranked sub-scores across 6 dimensions:
 * development momentum, demand signal, price attractiveness,
 * infrastructure quality, municipal health, and environment.
 *
 * Sub-scores are set to `null` when no source data was found for a city,
 * and the overall score is re-weighted across the available dimensions.
 *
 * Returns {@link CityProfile}[] with `investmentScore` and `scoreBreakdown` populated.
 */

import type { CityProfile, ScoreBreakdown } from "@/types/city";
import { percentileRank, perCapitaPercentile, sortForPercentile } from "./percentile";

/** Relative weight of each scoring dimension (sums to 1.0). */
const WEIGHTS: Record<string, number> = {
  development: 0.25,
  demand: 0.20,
  price: 0.20,
  infrastructure: 0.15,
  municipal: 0.10,
  environment: 0.10,
};

/** Minimum number of available sub-scores for a reliable overall rating. */
const MIN_DIMENSIONS = 3;

/**
 * Computes a weighted average from available (non-null) sub-scores,
 * redistributing weight from missing dimensions proportionally.
 *
 * If fewer than MIN_DIMENSIONS sub-scores are available, applies a
 * confidence penalty (available / MIN_DIMENSIONS) to prevent cities
 * with sparse data from getting inflated scores.
 */
function weightedAverage(
  scores: Record<string, number | null>,
): number {
  let totalWeight = 0;
  let weightedSum = 0;
  let availableCount = 0;

  for (const [key, score] of Object.entries(scores)) {
    if (score !== null && WEIGHTS[key] !== undefined) {
      totalWeight += WEIGHTS[key];
      weightedSum += score * WEIGHTS[key];
      availableCount++;
    }
  }

  if (totalWeight === 0) return 0;

  const raw = weightedSum / totalWeight;

  // Confidence penalty: if we have few data sources the score is unreliable
  if (availableCount < MIN_DIMENSIONS) {
    return raw * (availableCount / MIN_DIMENSIONS);
  }

  return raw;
}

/** Compute per-capita values and sort them for percentile ranking. */
function buildPerCapitaSorted(counts: number[], pops: number[]): number[] {
  const perCapita = counts.map((c, i) => {
    const p = pops[i];
    return p > 0 ? (c / p) * 1000 : 0;
  });
  return sortForPercentile(perCapita);
}

/**
 * Computes investment scores for all city profiles using percentile ranking.
 *
 * Each dimension score (0-100) is derived from percentile comparisons across
 * the full set, then combined via weighted average into an overall score.
 * Missing data results in null sub-scores displayed as N/A.
 *
 * @param profiles - City profiles with raw data populated but scores at zero.
 * @returns A new array of profiles with `investmentScore` and `scoreBreakdown` set.
 */
export function calculateInvestmentScore(profiles: CityProfile[]): CityProfile[] {
  if (profiles.length === 0) return [];

  // Pre-compute and pre-sort arrays for percentile ranking
  const pops = profiles.map((p) => p.population);

  // Development arrays - only from cities with development data
  const devProfiles = profiles.filter((p) => p.hasDevelopmentData);
  const devPops = devProfiles.map((p) => p.population);
  const renewalPerCapitaSorted = buildPerCapitaSorted(
    devProfiles.map((p) => p.urbanRenewalProjects), devPops
  );
  const additionalPerCapitaSorted = buildPerCapitaSorted(
    devProfiles.map((p) => p.urbanRenewalUnitsAdditional), devPops
  );
  const constructionPerCapitaSorted = buildPerCapitaSorted(
    devProfiles.map((p) => p.constructionSites), devPops
  );
  const housingPerCapitaSorted = buildPerCapitaSorted(
    devProfiles.map((p) => p.housingInventoryUnits), devPops
  );

  const subscriberRatiosSorted = sortForPercentile(
    profiles
      .map((p) => p.subscriberToWinnerRatio)
      .filter((r): r is number => r !== null)
  );
  const youngRatiosSorted = sortForPercentile(profiles.map((p) => p.youngAdultRatio));
  const pricesSorted = sortForPercentile(
    profiles
      .map((p) => p.mechirLaMishtakenAvgPricePerMeter)
      .filter((p): p is number => p !== null)
  );

  // Growth proxy array - pre-compute and sort once
  const growthProxyValues = profiles.map((p) =>
    p.ageDistribution.age_65_plus > 0
      ? p.ageDistribution.age_0_5 / p.ageDistribution.age_65_plus
      : 0
  );
  const growthProxySorted = sortForPercentile(growthProxyValues);

  // Infrastructure arrays - only from cities with data
  const infraProfiles = profiles.filter((p) => p.hasInfrastructureData);
  const infraPops = infraProfiles.map((p) => p.population);
  const bankPerCapitaSorted = buildPerCapitaSorted(
    infraProfiles.map((p) => p.bankBranchCount), infraPops
  );
  const busPerCapitaSorted = buildPerCapitaSorted(
    infraProfiles.map((p) => p.busStopCount), infraPops
  );
  const greenPerCapitaSorted = buildPerCapitaSorted(
    infraProfiles.map((p) => p.greenBuildingCount), infraPops
  );

  // Environment arrays
  const contaminatedPerCapitaSorted = buildPerCapitaSorted(
    profiles.map((p) => p.contaminatedSiteCount), pops
  );

  // Municipal finance arrays (only for cities with data)
  const citiesWithFinance = profiles.filter(
    (p) => p.municipalTotalIncome !== null && p.municipalTotalIncome > 0
  );
  const balanceRatiosSorted = sortForPercentile(
    citiesWithFinance.map((p) => (p.municipalBudgetSurplus ?? 0) / p.municipalTotalIncome!)
  );
  const debtRatiosSorted = sortForPercentile(
    citiesWithFinance.map((p) => (p.municipalLoanBurden ?? 0) / p.municipalTotalIncome!)
  );
  const incomePerCapitasSorted = sortForPercentile(
    citiesWithFinance.map((p) => p.municipalTotalIncome! / Math.max(p.population, 1))
  );

  return profiles.map((city, cityIdx) => {
    // --- Development Momentum (25%) ---
    let development: number | null = null;
    if (city.hasDevelopmentData) {
      const renewalPC = perCapitaPercentile(city.urbanRenewalProjects, city.population, renewalPerCapitaSorted);
      const additionalPC = perCapitaPercentile(city.urbanRenewalUnitsAdditional, city.population, additionalPerCapitaSorted);
      const constructionPC = perCapitaPercentile(city.constructionSites, city.population, constructionPerCapitaSorted);
      const housingPC = perCapitaPercentile(city.housingInventoryUnits, city.population, housingPerCapitaSorted);
      development =
        renewalPC * 0.3 +
        additionalPC * 0.25 +
        constructionPC * 0.25 +
        housingPC * 0.2;
    }

    // --- Demand Signal (20%) ---
    const subscriberScore = city.subscriberToWinnerRatio !== null
      ? percentileRank(city.subscriberToWinnerRatio, subscriberRatiosSorted)
      : 50;
    const youngAdultScore = percentileRank(city.youngAdultRatio, youngRatiosSorted);
    const growthProxy = city.ageDistribution.age_65_plus > 0
      ? percentileRank(growthProxyValues[cityIdx], growthProxySorted)
      : 50;
    const demand =
      subscriberScore * 0.4 +
      youngAdultScore * 0.35 +
      growthProxy * 0.25;

    // --- Price Attractiveness (20%) ---
    let price: number | null = null;
    if (city.mechirLaMishtakenAvgPricePerMeter !== null) {
      price = percentileRank(city.mechirLaMishtakenAvgPricePerMeter, pricesSorted, true);
    }

    // --- Infrastructure Quality (15%) ---
    let infrastructure: number | null = null;
    if (city.hasInfrastructureData) {
      const bankPC = perCapitaPercentile(city.bankBranchCount, city.population, bankPerCapitaSorted);
      const busPC = perCapitaPercentile(city.busStopCount, city.population, busPerCapitaSorted);
      const greenPC = perCapitaPercentile(city.greenBuildingCount, city.population, greenPerCapitaSorted);
      infrastructure =
        busPC * 0.4 +
        bankPC * 0.3 +
        greenPC * 0.3;
    }

    // --- Municipal Health (10%) ---
    let municipal: number | null = null;
    if (city.municipalTotalIncome !== null && city.municipalTotalIncome > 0) {
      const balanceRatio = (city.municipalBudgetSurplus ?? 0) / city.municipalTotalIncome;
      const balanceScore = percentileRank(balanceRatio, balanceRatiosSorted);

      const debtRatio = (city.municipalLoanBurden ?? 0) / city.municipalTotalIncome;
      const debtScore = percentileRank(debtRatio, debtRatiosSorted, true);

      const incomePerCapita = city.municipalTotalIncome / Math.max(city.population, 1);
      const incomeScore = percentileRank(incomePerCapita, incomePerCapitasSorted);

      municipal = balanceScore * 0.4 + debtScore * 0.3 + incomeScore * 0.3;
    }

    // --- Environment (10%) ---
    const environment = perCapitaPercentile(
      city.contaminatedSiteCount, city.population, contaminatedPerCapitaSorted, true
    );

    // Overall: weighted average of available sub-scores only
    const subScores = { development, demand, price, infrastructure, municipal, environment };
    const overall = weightedAverage(subScores);

    const scoreBreakdown: ScoreBreakdown = {
      overall: Math.round(overall),
      development: development !== null ? Math.round(development) : null,
      demand: Math.round(demand),
      price: price !== null ? Math.round(price) : null,
      infrastructure: infrastructure !== null ? Math.round(infrastructure) : null,
      municipal: municipal !== null ? Math.round(municipal) : null,
      environment: environment !== null ? Math.round(environment) : null,
    };

    return {
      ...city,
      investmentScore: scoreBreakdown.overall,
      scoreBreakdown,
    };
  });
}
