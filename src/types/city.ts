/**
 * @module types/city
 *
 * Core domain types for city investment profiles and scoring.
 */

/** Breakdown of investment sub-scores (0-100 each). */
export interface ScoreBreakdown {
  overall: number;
  development: number;
  demand: number;
  price: number;
  infrastructure: number;
  municipal: number;
  environment: number;
}

/** Population counts by age bracket, sourced from CBS. */
export interface AgeDistribution {
  age_0_5: number;
  age_6_18: number;
  age_19_45: number;
  age_46_55: number;
  age_56_64: number;
  age_65_plus: number;
}

/** Full city profile aggregating demographics, development, pricing, infrastructure, environment, finances, and scores. */
export interface CityProfile {
  cityName: string;
  cityCode: number;
  district: string;

  // Demographics
  population: number;
  ageDistribution: AgeDistribution;
  youngAdultRatio: number;

  // Development
  urbanRenewalProjects: number;
  urbanRenewalUnitsExisting: number;
  urbanRenewalUnitsAdditional: number;
  urbanRenewalInExecution: number;
  constructionSites: number;
  constructionWithCranes: number;
  housingInventoryUnits: number;

  // Pricing
  mechirLaMishtakenAvgPricePerMeter: number | null;
  mechirLaMishtakenProjects: number;
  subscriberToWinnerRatio: number | null;

  // Infrastructure
  bankBranchCount: number;
  busStopCount: number;
  greenBuildingCount: number;
  greenBuildingAvgScore: number | null;

  // Environment
  contaminatedSiteCount: number;
  contaminatedSitesRemediated: number;

  // Municipal finances (thousands ₪, from Ministry of Interior)
  municipalBudgetSurplus: number | null;
  municipalTotalIncome: number | null;
  municipalTotalExpenses: number | null;
  municipalLoanBurden: number | null;

  // Scores
  investmentScore: number;
  scoreBreakdown: ScoreBreakdown;
}

/** Lightweight projection of {@link CityProfile} used by the scores API and ranking table. */
export interface CityScoreRow {
  cityName: string;
  cityCode: number;
  district: string;
  population: number;
  investmentScore: number;
  scoreBreakdown: ScoreBreakdown;
  urbanRenewalProjects: number;
  constructionSites: number;
  mechirLaMishtakenAvgPricePerMeter: number | null;
}
