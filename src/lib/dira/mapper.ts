/**
 * @module dira/mapper
 *
 * Maps DiraProject records from the dira.moch.gov.il API
 * to the EnrichedMechirRow interface used by the Mechir tab UI.
 */

import type { DiraProject } from "./types";
import type { EnrichedMechirRow, CompetitionLevel } from "@/app/[locale]/mechir/page";
import type { CityProfile } from "@/types/city";
import { normalizeCityName } from "@/lib/data/normalizers";

function getCompetitionLevel(
  ratio: number,
  units: number
): CompetitionLevel {
  if (units === 0) return "na";
  if (ratio < 5) return "low";
  if (ratio < 15) return "medium";
  if (ratio < 50) return "high";
  return "veryHigh";
}

function formatIsoDate(iso: string | null): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
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

function deriveLotteryStatus(p: DiraProject): string {
  if (!p.IsLotteryHeld && p.ApplicationEndDate) {
    const endDate = new Date(p.ApplicationEndDate);
    if (endDate > new Date()) return "פתוח להרשמה";
  }
  if (!p.IsLotteryHeld) return "טרם נפתח";
  return "התקיימה הגרלה";
}

/**
 * Maps an array of DiraProject records to EnrichedMechirRow[].
 * Joins with CityProfile data for investment scores and district info.
 */
export function mapDiraToMechirRows(
  projects: DiraProject[],
  profileMap: Map<string, CityProfile>
): EnrichedMechirRow[] {
  const rows: EnrichedMechirRow[] = [];

  for (const p of projects) {
    const cityName = normalizeCityName(p.CityDescription || "");
    const profile = profileMap.get(cityName);

    const subs = p.TotalSubscribers || 0;
    const units = p.LotteryApparmentsNum || 0;
    const ratio = units > 0 ? Math.round((subs / units) * 10) / 10 : 0;

    const isOpen =
      !p.IsLotteryHeld &&
      !!p.ApplicationEndDate &&
      new Date(p.ApplicationEndDate) > new Date();

    rows.push({
      projectName: p.ProjectName || "",
      projectId: p.ProjectNumber || "",
      lotteryId: p.LotteryNumber || "",
      neighborhood: p.NeighborhoodName || "",
      providerName: p.ContractorDescription || "",

      pricePerMeter: p.PricePerUnit || 0,
      lotteryHousingUnits: units,
      nativeHousingUnits: p.LocalHousing || 0,

      lotteryStatusValue: deriveLotteryStatus(p),
      lotteryExecutionDate: formatIsoDate(p.LotteryDate),
      lotteryEndSignupDate: formatIsoDate(p.ApplicationEndDate),
      lotteryType: p.LotteryType === 3 ? "הגרלת המשך" : "הגרלה ראשונה",
      eligibility: p.Entitlement || p.EntitlementDescription || "",
      constructionPermitName: p.PermitStatus || "",
      centralizationType: p.ResponsibilityDescription || "",
      projectStatus: p.ProcessName || "",

      subscribers: subs,
      winners: units, // In Dira, LotteryApparmentsNum = units available (winners)
      subscribersSeriesA: p.TotalSubscribersStagesHomeless || 0,
      subscribersSeriesB: p.TotalSubscribersStagesImprovehousing || 0,
      subscribersSeriesC: 0,
      winnersSeriesA: 0,
      winnersSeriesB: 0,
      winnersSeriesC: 0,
      subscribersBneyMakom: p.TotalLocalSubscribers || 0,
      subscribersDisabled: p.TotalHandicappedSubscribers || 0,

      cityName,
      cityCode: profile?.cityCode ?? p.CityCode ?? 0,
      district: profile?.district ?? "",
      investmentScore: profile?.investmentScore ?? 0,

      competitionRatio: ratio,
      competitionLevel: getCompetitionLevel(ratio, units),

      // New fields
      source: "dira",
      grantAmount: p.GrantSize || 0,
      isOpen,
      reservistSubscribers: p.TotalReservedDutySubscribers || 0,
      combatReservistSubscribers: p.TotalCombatReservistSubscribers || 0,
    });
  }

  return rows;
}
