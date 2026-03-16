import { getAllCityProfiles } from "@/lib/data/aggregator";
import { TopCitiesTable } from "@/components/dashboard/TopCitiesTable";
import { MarketSummaryCharts } from "@/components/dashboard/MarketSummaryCharts";
import type { CityScoreRow } from "@/types/city";

export const revalidate = 300;

export default async function DashboardPage() {
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
    error = e instanceof Error ? e.message : "Failed to load data";
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Israel Home Investment <span className="brand-gradient-text">Dashboard</span>
        </h1>
        <p className="text-muted-foreground mt-1">
          Identify the best investment opportunities based on Israeli government open data
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="font-medium text-destructive">Failed to load data</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
          <p className="text-xs text-muted-foreground mt-2">
            The app fetches live data from data.gov.il. Please try again later.
          </p>
        </div>
      ) : (
        <>
          <MarketSummaryCharts cities={cities} />

          <div>
            <h2 className="text-lg md:text-xl font-semibold mb-4">City Rankings</h2>
            <TopCitiesTable cities={cities} totalCount={cities.length} />
          </div>
        </>
      )}
    </div>
  );
}
