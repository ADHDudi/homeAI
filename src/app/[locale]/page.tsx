import { getAllCityProfiles } from "@/lib/data/aggregator";
import { TopCitiesTable } from "@/components/dashboard/TopCitiesTable";
import { MarketSummaryCharts } from "@/components/dashboard/MarketSummaryCharts";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { CityScoreRow } from "@/types/city";

export const revalidate = 300;

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("dashboard");

  let cities: CityScoreRow[] = [];
  let error: string | null = null;

  try {
    const profiles = await getAllCityProfiles();
    cities = profiles
      .map((p) => ({
        cityName: p.cityName,
        cityCode: p.cityCode,
        district: p.district,
        population: p.population,
        investmentScore: p.investmentScore,
        scoreBreakdown: p.scoreBreakdown,
        urbanRenewalProjects: p.urbanRenewalProjects,
        constructionSites: p.constructionSites,
        mechirLaMishtakenAvgPricePerMeter: p.mechirLaMishtakenAvgPricePerMeter,
      }))
      .sort((a, b) => b.investmentScore - a.investmentScore);
  } catch (e) {
    error = e instanceof Error ? e.message : t("failedToLoad");
  }

  return (
    <div className="space-y-4 md:space-y-6 lg:space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          {t("title")} <span className="brand-gradient-text">{t("titleHighlight")}</span>
        </h1>
        <p className="text-muted-foreground mt-1">
          {t("subtitle")}
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="font-medium text-destructive">{t("failedToLoad")}</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
          <p className="text-xs text-muted-foreground mt-2">
            {t("failedToLoadDesc")}
          </p>
        </div>
      ) : (
        <>
          <MarketSummaryCharts cities={cities} />

          <div>
            <h2 className="text-lg md:text-xl font-semibold mb-4">{t("cityRankings")}</h2>
            <TopCitiesTable cities={cities} totalCount={cities.length} />
          </div>
        </>
      )}
    </div>
  );
}
