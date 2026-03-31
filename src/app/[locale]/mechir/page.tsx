import { getAllCityProfiles } from "@/lib/data/aggregator";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MechirTableClient } from "@/components/mechir/MechirTableClient";
import type { CityProfile } from "@/types/city";
import { getDiraProjectsSafe } from "@/lib/dira/cache";
import { mapDiraToMechirRows } from "@/lib/dira/mapper";
import { getArcGISUpcomingSafe } from "@/lib/arcgis/cache";
import { mapArcGISToMechirRows } from "@/lib/arcgis/mapper";

export const dynamic = "force-dynamic";
export const revalidate = 300;

export type CompetitionLevel = "low" | "medium" | "high" | "veryHigh" | "na";

export interface EnrichedMechirRow {
  // Identity
  projectName: string;
  projectId: string;
  lotteryId: string;
  neighborhood: string;
  providerName: string;

  // Pricing & Units
  pricePerMeter: number;
  lotteryHousingUnits: number;
  nativeHousingUnits: number;

  // Lottery info
  lotteryStatusValue: string;
  lotteryExecutionDate: string;
  lotteryEndSignupDate: string;
  lotteryType: string;
  eligibility: string;
  constructionPermitName: string;
  centralizationType: string;
  projectStatus: string;

  // Demand data
  subscribers: number;
  winners: number;
  subscribersSeriesA: number;
  subscribersSeriesB: number;
  subscribersSeriesC: number;
  winnersSeriesA: number;
  winnersSeriesB: number;
  winnersSeriesC: number;
  subscribersBneyMakom: number;
  subscribersDisabled: number;

  // Joined from CityProfile
  cityName: string;
  cityCode: number;
  district: string;
  investmentScore: number;

  // Computed
  competitionRatio: number;
  competitionLevel: CompetitionLevel;

  // Dira-specific fields
  source: "ckan" | "dira" | "arcgis";
  grantAmount: number;
  isOpen: boolean;
  reservistSubscribers: number;
  combatReservistSubscribers: number;
}

export default async function MechirPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("mechir");

  let error: string | null = null;
  let rows: EnrichedMechirRow[] = [];

  try {
    const [profiles, diraProjects, arcgisCompounds] = await Promise.all([
      getAllCityProfiles(),
      getDiraProjectsSafe(),
      getArcGISUpcomingSafe(),
    ]);

    // Build O(1) lookup by city name
    const profileMap = new Map<string, CityProfile>();
    for (const p of profiles) {
      profileMap.set(p.cityName, p);
    }

    // Map both sources to EnrichedMechirRow
    const diraRows = mapDiraToMechirRows(diraProjects, profileMap);
    const arcgisRows = mapArcGISToMechirRows(arcgisCompounds, profileMap);

    // Deduplicate: prefer Dira (richer data) over ArcGIS
    const diraIds = new Set(diraRows.map((r) => r.projectId));
    const uniqueArcgis = arcgisRows.filter((r) => !diraIds.has(r.projectId));
    rows = [...diraRows, ...uniqueArcgis];

    // Default sort: open first, then upcoming, then completed
    rows.sort((a, b) => {
      // Open lotteries always first
      if (a.isOpen && !b.isOpen) return -1;
      if (!a.isOpen && b.isOpen) return 1;
      // Upcoming (arcgis) next
      const aUpcoming = a.source === "arcgis";
      const bUpcoming = b.source === "arcgis";
      if (aUpcoming && !bUpcoming) return -1;
      if (!aUpcoming && bUpcoming) return 1;
      // Then by competition level (na at end)
      if (a.competitionLevel === "na" && b.competitionLevel !== "na") return 1;
      if (b.competitionLevel === "na" && a.competitionLevel !== "na") return -1;
      return a.competitionRatio - b.competitionRatio;
    });
  } catch (e) {
    error = e instanceof Error ? e.message : t("failedToLoad");
  }

  const openCount = rows.filter((r) => r.isOpen).length;

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("subtitle", { count: rows.length })}
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="font-medium text-destructive">{error}</p>
        </div>
      ) : (
        <MechirTableClient rows={rows} openCount={openCount} />
      )}
    </div>
  );
}
