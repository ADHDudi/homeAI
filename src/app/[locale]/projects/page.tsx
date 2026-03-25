import { getAllCityProfiles, fetchRawData } from "@/lib/data/aggregator";
import { safeNumber, safeTrim } from "@/lib/data/normalizers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ProjectsTableClient } from "@/components/projects/ProjectsTableClient";
import type { CityProfile } from "@/types/city";

export const revalidate = 300;

export interface EnrichedProjectRow {
  complexName: string;
  cityName: string;
  existingUnits: number;
  additionalUnits: number;
  inExecution: boolean;
  status: string;
  track: string;
  unitGrowthRatio: number;
  cityCode: number;
  district: string;
  investmentScore: number;
  population: number;
  // Additional raw CKAN fields
  projectNumber: string;
  planNumber: string;
  totalPermits: string;
  proposedUnits: number;
  authorizationDate: string;
  validityYear: string;
  mapLink: string;
  planLink: string;
}

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("projects");

  let error: string | null = null;
  let rows: EnrichedProjectRow[] = [];

  try {
    const [profiles, rawData] = await Promise.all([
      getAllCityProfiles(),
      fetchRawData(),
    ]);

    // Build O(1) lookup by city name
    const profileMap = new Map<string, CityProfile>();
    for (const p of profiles) {
      profileMap.set(p.cityName, p);
    }

    // Flatten and enrich raw urban renewal records
    for (const [cityName, records] of rawData.urbanRenewal) {
      const profile = profileMap.get(cityName);
      if (!profile) continue; // skip cities without profile (pop < 5,000)

      for (const r of records) {
        const existing = safeNumber(r["YachadKayam"]);
        const additional = safeNumber(r["YachadTosafti"]);
        rows.push({
          complexName: safeTrim(r["ShemMitcham"]) || safeTrim(r["ProjectName"]) || "",
          cityName,
          existingUnits: existing,
          additionalUnits: additional,
          inExecution: safeTrim(r["Bebitzua"]) === "כן",
          status: safeTrim(r["Status"]) || "",
          track: safeTrim(r["Maslul"]) || "",
          unitGrowthRatio: existing > 0 ? Math.round((additional / existing) * 10) / 10 : 0,
          cityCode: profile.cityCode,
          district: profile.district,
          investmentScore: profile.investmentScore,
          population: profile.population,
          projectNumber: safeTrim(r["MisparMitham"]) || "",
          planNumber: safeTrim(r["MisparTochnit"]) || "",
          totalPermits: safeTrim(r["SachHeterim"]) || "",
          proposedUnits: safeNumber(r["YachadMutza"]),
          authorizationDate: safeTrim(r["TaarichHachraza"]) || "",
          validityYear: safeTrim(r["ShnatMatanTokef"]) || "",
          mapLink: safeTrim(r["KishurLaMapa"]) || "",
          planLink: safeTrim(r["KishurLatar"]) || "",
        });
      }
    }

    // Default sort by investment score descending
    rows.sort((a, b) => b.investmentScore - a.investmentScore);
  } catch (e) {
    error = e instanceof Error ? e.message : t("failedToLoad");
  }

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
        <ProjectsTableClient rows={rows} />
      )}
    </div>
  );
}
