/**
 * @module scoring/calculator
 *
 * Investment scoring engine for Israeli cities.
 * Calculates percentile-ranked sub-scores across 6 dimensions:
 * development momentum, demand signal, price attractiveness,
 * infrastructure quality, municipal health, and environment.
 *
 * Returns {@link CityProfile}[] with `investmentScore` and `scoreBreakdown` populated.
 */

import type { CityProfile, ScoreBreakdown } from "@/types/city";
import { percentileRank, perCapitaPercentile } from "./percentile";

/** Relative weight of each scoring dimension (sums to 1.0). */
const WEIGHTS = {
  development: 0.25,
  demand: 0.20,
  price: 0.20,
  infrastructure: 0.15,
  municipal: 0.10,
  environment: 0.10,
};

/**
 * Computes investment scores for all city profiles using percentile ranking.
 *
 * Each dimension score (0-100) is derived from percentile comparisons across
 * the full set, then combined via weighted average into an overall score.
 *
 * @param profiles - City profiles with raw data populated but scores at zero.
 * @returns A new array of profiles with `investmentScore` and `scoreBreakdown` set.
 */
export function calculateInvestmentScore(profiles: CityProfile[]): CityProfile[] {
  if (profiles.length === 0) return [];

  // Pre-compute arrays for percentile ranking
  const pops = profiles.map((p) => p.population);
  const renewalCounts = profiles.map((p) => p.urbanRenewalProjects);
  const additionalUnits = profiles.map((p) => p.urbanRenewalUnitsAdditional);
  const constructionCounts = profiles.map((p) => p.constructionSites);
  const housingUnits = profiles.map((p) => p.housingInventoryUnits);
  const subscriberRatios = profiles
    .map((p) => p.subscriberToWinnerRatio)
    .filter((r): r is number => r !== null);
  const youngRatios = profiles.map((p) => p.youngAdultRatio);
  const prices = profiles
    .map((p) => p.mechirLaMishtakenAvgPricePerMeter)
    .filter((p): p is number => p !== null);
  const bankCounts = profiles.map((p) => p.bankBranchCount);
  const busCounts = profiles.map((p) => p.busStopCount);
  const greenCounts = profiles.map((p) => p.greenBuildingCount);
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
    const renewalPerCapita = perCapitaPercentile(
      city.urbanRenewalProjects, city.population, renewalCounts, pops
    );
    const additionalPerCapita = perCapitaPercentile(
      city.urbanRenewalUnitsAdditional, city.population, additionalUnits, pops
    );
    const constructionPerCapita = perCapitaPercentile(
      city.constructionSites, city.population, constructionCounts, pops
    );
    const housingPerCapita = perCapitaPercentile(
      city.housingInventoryUnits, city.population, housingUnits, pops
    );
    const development =
      renewalPerCapita * 0.3 +
      additionalPerCapita * 0.25 +
      constructionPerCapita * 0.25 +
      housingPerCapita * 0.2;

    // --- Demand Signal (20%) ---
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
    // Lower price = better score (invert)
    let price = 50;
    if (city.mechirLaMishtakenAvgPricePerMeter !== null) {
      price = percentileRank(city.mechirLaMishtakenAvgPricePerMeter, prices, true);
    }

    // --- Infrastructure Quality (15%) ---
    const bankPerCapita = perCapitaPercentile(
      city.bankBranchCount, city.population, bankCounts, pops
    );
    const busPerCapita = perCapitaPercentile(
      city.busStopCount, city.population, busCounts, pops
    );
    const greenScore = perCapitaPercentile(
      city.greenBuildingCount, city.population, greenCounts, pops
    );
    const infrastructure =
      busPerCapita * 0.4 +
      bankPerCapita * 0.3 +
      greenScore * 0.3;

    // --- Municipal Health (10%) ---
    // Three signals: budget balance, debt ratio, per-capita income
    // Falls back to population proxy when finance data unavailable
    let municipal: number;
    if (city.municipalTotalIncome !== null && city.municipalTotalIncome > 0) {
      const balanceRatio = (city.municipalBudgetSurplus ?? 0) / city.municipalTotalIncome;
      const balanceScore = percentileRank(balanceRatio, balanceRatios);

      const debtRatio = (city.municipalLoanBurden ?? 0) / city.municipalTotalIncome;
      const debtScore = percentileRank(debtRatio, debtRatios, true); // inverted — lower debt = better

      const incomePerCapita = city.municipalTotalIncome / Math.max(city.population, 1);
      const incomeScore = percentileRank(incomePerCapita, incomePerCapitas);

      municipal = balanceScore * 0.4 + debtScore * 0.3 + incomeScore * 0.3;
    } else {
      // Fallback: population proxy (larger cities have more services)
      municipal = percentileRank(city.population, pops) * 0.5 + 50 * 0.5;
    }

    // --- Environment (10%) ---
    // Less contamination = better
    const contaminationScore = perCapitaPercentile(
      city.contaminatedSiteCount, city.population, contaminatedCounts, pops, true
    );
    const environment = contaminationScore;

    const overall =
      development * WEIGHTS.development +
      demand * WEIGHTS.demand +
      price * WEIGHTS.price +
      infrastructure * WEIGHTS.infrastructure +
      municipal * WEIGHTS.municipal +
      environment * WEIGHTS.environment;

    const scoreBreakdown: ScoreBreakdown = {
      overall: Math.round(overall),
      development: Math.round(development),
      demand: Math.round(demand),
      price: Math.round(price),
      infrastructure: Math.round(infrastructure),
      municipal: Math.round(municipal),
      environment: Math.round(environment),
    };

    return {
      ...city,
      investmentScore: scoreBreakdown.overall,
      scoreBreakdown,
    };
  });
}
