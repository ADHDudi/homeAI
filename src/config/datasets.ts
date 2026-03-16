/**
 * @module config/datasets
 *
 * Central configuration for all government datasets used by the investment
 * scoring engine. Contains CKAN resource IDs, API settings, field mappings,
 * and district name translations.
 */

export const CKAN_BASE_URL = "https://data.gov.il/api/3/action";
export const DEFAULT_TIMEOUT = 10000;
export const SEARCH_TIMEOUT = 15000;
export const USER_AGENT = "HomeAI-Investment-App/1.0.0";

/** CKAN resource UUIDs for each government dataset. */
export const RESOURCE_IDS = {
  /** Ministry of Housing – urban renewal (Pinui-Binui) projects */
  urbanRenewal: "f65a0daf-f737-49c5-9424-d378d52104f5",
  /** Ministry of Housing – active construction sites */
  constructionSites: "b072e36c-a53b-49e1-be08-4a608fcf4638",
  /** Ministry of Housing – housing inventory / marketing pipeline */
  housingInventory: "99aad98f-2b54-4eea-834d-650b56389bf3",
  /** Ministry of Housing – Mechir LaMishtaken (subsidized pricing) lottery data */
  mechirLaMishtaken: "7c8255d0-49ef-49db-8904-4cf917586031",
  /** Ministry of Housing – public housing stock */
  publicHousing: "ece87d7d-d79f-4278-8559-921218bc2b6a",
  /** CBS (Central Bureau of Statistics) – population by city and age group */
  population: "64edd0ee-3d5d-43ce-8562-c336c24dbc1f",
  /** Ministry of Interior – municipal financial reports */
  municipalFinances: "e5ff9ad0-6db2-4660-a94e-4499fce9475d",
  /** Bank of Israel – bank branch locations */
  bankBranches: "2202bada-4baf-45f5-aa61-8c5bad9646d3",
  /** Ministry of Environmental Protection – green building certifications */
  greenBuildings: "7f467a30-58cd-44b5-86f0-d570cc7d25ad",
  /** Ministry of Transport – bus stop locations */
  busStops: "e873e6a2-66c1-494f-a677-f5e77348edb0",
  /** Ministry of Environmental Protection – contaminated land registry */
  contaminatedLand: "54aa9ff1-2d89-4899-bb57-bf2a749ff4b3",
} as const;

// Hebrew-to-English field mappings for each dataset
export const FIELD_MAPS = {
  population: {
    "שם_ישוב": "cityName",
    "סמל_ישוב": "cityCode",
    "סהכ": "totalPopulation",
    "גיל_0_5": "age_0_5",
    "גיל_6_18": "age_6_18",
    "גיל_19_45": "age_19_45",
    "גיל_46_55": "age_46_55",
    "גיל_56_64": "age_56_64",
    "גיל_65_פלוס": "age_65_plus",
    "נפה": "district",
  },
  housingInventory: {
    "יישוב": "cityName",
    "סמל יישוב": "cityCode",
    "שלב תכנוני": "planningStage",
    "יזם תכנון": "planningInitiative",
    "יחד פוטנציאל לשיווק": "potentialUnits",
    "מספר תוכנית": "planNumber",
    "שם תוכנית": "planName",
  },
  contaminatedLand: {
    "רשות מקומית": "municipality",
    "דרגת זיהום": "contaminationLevel",
    "מקור הזיהום": "contaminationSource",
    "שנת סיום טיפול": "treatmentEndYear",
  },
} as const;

export const DISTRICTS: Record<string, string> = {
  "ירושלים": "Jerusalem",
  "צפון": "North",
  "חיפה": "Haifa",
  "מרכז": "Center",
  "תל אביב": "Tel Aviv",
  "דרום": "South",
  "יהודה ושומרון": "Judea & Samaria",
};
