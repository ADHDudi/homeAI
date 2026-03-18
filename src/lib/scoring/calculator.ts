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
import { percentileRank, perCapitaPercentile } from "./percentile";

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

  // Pre-compute arrays for percentile ranking (only from cities WITH data)
  const pops = profiles.map((p) => p.population);

  // Development arrays - only from cities with development data
  const devProfiles = profiles.filter((p) => p.hasDevelopmentData);
  const renewalCounts = devProfiles.map((p) => p.urbanRenewalProjects);
  const additionalUnits = devProfiles.map((p) => p.urbanRenewalUnitsAdditional);
  const constructionCounts = devProfiles.map((p) => p.constructionSites);
  const housingUnits = devProfiles.map((p) => p.housingInventoryUnits);
  const devPops = devProfiles.map((p) => p.population);

  const subscriberRatios = profiles
    .map((p) => p.subscriberToWinnerRatio)
    .filter((r): r is number => r !== null);
  const youngRatios = profiles.map((p) => p.youngAdultRatio);
  const prices = profiles
    .map((p) => p.mechirLaMishtakenAvgPricePerMeter)
    .filter((p): p is number => p !== null);

  // Infrastructure arrays - only from cities with data
  const infraProfiles = profiles.filter((p) => p.hasInfrastructureData);
  const bankCounts = infraProfiles.map((p) => p.bankBranchCount);
  const busCounts = infraProfiles.map((p) => p.busStopCount);
  const greenCounts = infraProfiles.map((p) => p.greenBuildingCount);
  const infraPops = infraProfiles.map((p) => p.population);

  // Environment arrays - use all cities (0 contaminated sites = clean city, not missing data)
  const contaminatedCounts = profiles.map((p) => p.contaminatedSiteCount);

  // Municipal finance arrays (only for cities with data)
  const citiesWithFinance = profiles.filter(
    (p) => p.municipalTotalIncome !== null && p.municipalTotalIncome > 0
  );
  const balanceRatios = citiesWithFinance.map(
    (p) => (p.municipalBudgetSurplus ?? 0) / p.municipalTotalIncome!
  );
  const debtRatios = citiesWithFinance.map(
    (p) => (p.municipalLoanBurden ?? 0) / p.municipalTotalIncome!
  );
  const incomePerCapitas = citiesWithFinance.map(
    (p) => p.municipalTotalIncome! / Math.max(p.population, 1)
  );

  return profiles.map((city) => {
    // --- Development Momentum (25%) ---
    let development: number | null = null;
    if (city.hasDevelopmentData) {
      const renewalPerCapita = perCapitaPercentile(
        city.urbanRenewalProjects, city.population, renewalCounts, devPops
      );
      const additionalPerCapita = perCapitaPercentile(
        city.urbanRenewalUnitsAdditional, city.population, additionalUnits, devPops
      );
      const constructionPerCapita = perCapitaPercentile(
        city.constructionSites, city.population, constructionCounts, devPops
      );
      const housingPerCapita = perCapitaPercentile(
        city.housingInventoryUnits, city.population, housingUnits, devPops
      );
      development =
        renewalPerCapita * 0.3 +
        additionalPerCapita * 0.25 +
        constructionPerCapita * 0.25 +
        housingPerCapita * 0.2;
    }

    // --- Demand Signal (20%) ---
    // Demand always has population data so it's always available
    const subscriberScore = city.subscriberToWinnerRatio !== null
      ? percentileRank(city.subscriberToWinnerRatio, subscriberRatios)
      : 50;
    const youngAdultScore = percentileRank(city.youngAdultRatio, youngRatios);
    const growthProxy = city.ageDistribution.age_65_plus > 0
      ? percentileRank(
          city.ageDistribution.age_0_5 / city.ageDistribution.age_65_plus,
          profiles.map((p) =>
            p.ageDistribution.age_65_plus > 0
              ? p.ageDistribution.age_0_5 / p.ageDistribution.age_65_plus
              : 0
          )
        )
      : 50;
    const demand =
      subscriberScore * 0.4 +
      youngAdultScore * 0.35 +
      growthProxy * 0.25;

    // --- Price Attractiveness (20%) ---
    let price: number | null = null;
    if (city.mechirLaMishtakenAvgPricePerMeter !== null) {
      price = percentileRank(city.mechirLaMishtakenAvgPricePerMeter, prices, true);
    }

    // --- Infrastructure Quality (15%) ---
    let infrastructure: number | null = null;
    if (city.hasInfrastructureData) {
      const bankPerCapita = perCapitaPercentile(
        city.bankBranchCount, city.population, bankCounts, infraPops
      );
      const busPerCapita = perCapitaPercentile(
        city.busStopCount, city.population, busCounts, infraPops
      );
      const greenScore = perCapitaPercentile(
        city.greenBuildingCount, city.population, greenCounts, infraPops
      );
      infrastructure =
        busPerCapita * 0.4 +
        bankPerCapita * 0.3 +
        greenScore * 0.3;
    }

    // --- Municipal Health (10%) ---
    let municipal: number | null = null;
    if (city.municipalTotalIncome !== null && city.municipalTotalIncome > 0) {
      const balanceRatio = (city.municipalBudgetSurplus ?? 0) / city.municipalTotalIncome;
      const balanceScore = percentileRank(balanceRatio, balanceRatios);

      const debtRatio = (city.municipalLoanBurden ?? 0) / city.municipalTotalIncome;
      const debtScore = percentileRank(debtRatio, debtRatios, true);

      const incomePerCapita = city.municipalTotalIncome / Math.max(city.population, 1);
      const incomeScore = percentileRank(incomePerCapita, incomePerCapitas);

      municipal = balanceScore * 0.4 + debtScore * 0.3 + incomeScore * 0.3;
    }

    // --- Environment (10%) ---
    // 0 contaminated sites = clean city (best score), not missing data
    const environment = perCapitaPercentile(
      city.contaminatedSiteCount, city.population, contaminatedCounts, pops, true
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
