/**
 * TypeScript interfaces for the dira.moch.gov.il API responses.
 * Schema captured from live API: GET /api/Invoker?method=Projects
 */

export interface DiraProject {
  LotteryNumber: string;
  ProjectNumber: string;
  ProjectName: string;
  CityCode: number;
  CityDescription: string;
  NeighborhoodName: string;
  ContractorDescription: string;
  ContractorCode: number;

  // Dates (ISO format: "2025-12-08T00:00:00")
  ApplicationStartDate: string;
  ApplicationEndDate: string;
  LotteryDate: string | null;

  // Pricing
  PricePerUnit: number;
  GrantSize: number;

  // Units
  HousingUnits: number;
  TargetHousingUnits: number;
  LotteryApparmentsNum: number;
  LocalHousing: number;

  // Status
  IsLotteryHeld: boolean;
  StageCode: number;
  LotteryType: number;
  ProcessName: string;
  PermitStatus: string;

  // Eligibility
  EntitlementCode: number;
  EntitlementDescription: string;
  Entitlement: string;

  // Subscribers (total)
  TotalSubscribers: number;
  TotalLocalSubscribers: number;
  TotalHandicappedSubscribers: number;
  TotalReservedDutySubscribers: number;
  TotalCombatReservistSubscribers: number;

  // Subscribers by stage (homeless / חסרי דיור)
  TotalSubscribersStagesHomeless: number;
  TotalLocalSubscribersStagesHomeless: number;
  TotalHandicappedSubscribersStagesHomeless: number;
  TotalReservedDutySubscribersStagesHomeless: number;
  TotalCombatReservistSubscribersStagesHomeless: number;
  SeriesTypeOfStageHomeless: string;

  // Subscribers by stage (housing improvers / משפרי דיור)
  TotalSubscribersStagesImprovehousing: number;
  TotalLocalSubscribersStagesImprovehousing: number;
  TotalHandicappedSubscribersStagesImprovehousing: number;
  TotalReservedDutySubscribersStagesImprovehousing: number;
  TotalCombatReservistSubscribersStagesImprovehousing: number;
  SeriesTypeOfStageImprovehousing: string;

  // Admin
  ResponsibilityDescription: string;
  ControlCompanyDescription: string;
  RegulationsVersion: string;
  Notes: string | null;
  OriginalLottery: number;
  TenderName: string;

  // Preference
  IsPreferenceForHandicapped: boolean;
  HousingUnitsForHandicapped: number;
  HU_Reservists_L: number;
  HU_CombatReservist_L: number;

  // Aggregates (repeated per record from API)
  CountProjects: number;
  OpenLotteriesCount: number;
}

export interface DiraApiResponse {
  ProjectItems: DiraProject[];
  OpenLotteriesCount: number;
  NumOfRecords: number;
  PageSize: number;
  PageNumber: number;
  IsAll: boolean;
  ActionStatus: number;
  Messages: string[];
}
