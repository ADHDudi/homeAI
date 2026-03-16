/**
 * @module types/neighborhood
 *
 * Types for city-level neighborhood drill-down data (pricing, renewal, construction, etc.).
 */

/** A single Mechir LaMishtaken (subsidized housing) project listing. */
export interface MechirProject {
  name: string;
  neighborhood: string;
  pricePerMeter: number;
  units: number;
  subscribers: number;
  winners: number;
  status: string;
}

/** Aggregated pricing data for a single neighborhood. */
export interface NeighborhoodPricing {
  neighborhood: string;
  projects: MechirProject[];
  avgPricePerMeter: number;
  totalUnits: number;
  avgSubscriberRatio: number | null;
}

/** An urban renewal (Pinui-Binui) project within a city. */
export interface RenewalProject {
  complexName: string;
  existingUnits: number;
  additionalUnits: number;
  inExecution: boolean;
}

/** An active construction site in the city. */
export interface ConstructionSite {
  address: string;
  buildTypes: string;
  executor: string;
  hasCranes: boolean;
}

/** A building with a green certification (Israeli Standard 5281). */
export interface GreenBuilding {
  street: string;
  number: string;
  lat: number;
  lng: number;
  floors: number;
  units: number;
  score: number;
}

/** A geo-located point of interest (bus stop or bank branch). */
export interface PointOfInterest {
  name: string;
  type: "bus_stop" | "bank_branch";
  lat: number;
  lng: number;
  details?: string;
}

/** A site listed in the contaminated land registry. */
export interface ContaminatedSite {
  name: string;
  address: string;
  level: string;
  source: string;
}

/** A housing plan from the Ministry of Housing marketing pipeline. */
export interface HousingPlan {
  planName: string;
  planNumber: string;
  potentialUnits: number;
}

/** Complete neighborhood-level data for a single city, returned by the neighborhood API. */
export interface CityNeighborhoodData {
  neighborhoodPricing: NeighborhoodPricing[];
  renewalProjects: RenewalProject[];
  constructionSites: ConstructionSite[];
  greenBuildings: GreenBuilding[];
  busStops: PointOfInterest[];
  bankBranches: PointOfInterest[];
  contaminatedSites: ContaminatedSite[];
  housingPlans: HousingPlan[];
}
