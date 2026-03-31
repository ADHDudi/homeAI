import type { ArcGISCompound } from "./types";
import type { EnrichedMechirRow } from "@/app/[locale]/mechir/page";
import type { CityProfile } from "@/types/city";
import { normalizeCityName } from "@/lib/data/normalizers";

function formatEpochDate(epoch: number | null): string {
  if (!epoch) return "";
  try {
    const d = new Date(epoch);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("he-IL", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return "";
  }
}

export function mapArcGISToMechirRows(
  compounds: ArcGISCompound[],
  profileMap: Map<string, CityProfile>
): EnrichedMechirRow[] {
  const rows: EnrichedMechirRow[] = [];

  for (const c of compounds) {
    const cityName = normalizeCityName(c.LamasName || "");
    const profile = profileMap.get(cityName);

    rows.push({
      projectName: c.ProjectName || "",
      projectId: String(c.ActiveProjectId ?? c.OBJECTID),
      lotteryId: String(c.LotteryId ?? ""),
      neighborhood: c.Neighborhood || "",
      providerName: c.ProviderName || "",

      pricePerMeter: c.PriceForMeter || 0,
      lotteryHousingUnits: c.HousingUnits || 0,
      nativeHousingUnits: 0,

      lotteryStatusValue: c.MarketingStatus || "טרם נפתחה הרשמה",
      lotteryExecutionDate: "",
      lotteryEndSignupDate: formatEpochDate(c.EndSignupDate),
      lotteryType: c.IsRepeatLottery === 1 ? "הגרלת המשך" : "",
      eligibility: "",
      constructionPermitName: "",
      centralizationType: "",
      projectStatus: c.MarketingMethod || "",

      subscribers: 0,
      winners: 0,
      subscribersSeriesA: 0,
      subscribersSeriesB: 0,
      subscribersSeriesC: 0,
      winnersSeriesA: 0,
      winnersSeriesB: 0,
      winnersSeriesC: 0,
      subscribersBneyMakom: 0,
      subscribersDisabled: 0,

      cityName,
      cityCode: profile?.cityCode ?? 0,
      district: profile?.district ?? "",
      investmentScore: profile?.investmentScore ?? 0,

      competitionRatio: 0,
      competitionLevel: "na",

      source: "arcgis",
      grantAmount: c.GrantAmount || 0,
      isOpen: false,
      reservistSubscribers: 0,
      combatReservistSubscribers: 0,
    });
  }

  return rows;
}
