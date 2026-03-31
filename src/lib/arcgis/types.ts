export interface ArcGISCompound {
  OBJECTID: number;
  ActiveProjectId: number | null;
  ProjectName: string | null;
  MarketingMethod: string | null;
  Neighborhood: string | null;
  LamasName: string | null;
  ProviderName: string | null;
  HousingUnits: number | null;
  ProjectHousingUnits: number | null;
  PriceForMeter: number | null;
  GrantAmount: number | null;
  LotteryId: number | null;
  StartSignupDate: number | null; // epoch ms
  EndSignupDate: number | null; // epoch ms
  MarketingStatusId: number;
  MarketingStatus: string;
  ProviderId: number | null;
  IsRepeatLottery: number | null; // 0 or 1
}

export interface ArcGISQueryResponse {
  features: Array<{ attributes: ArcGISCompound }>;
  exceededTransferLimit?: boolean;
}
