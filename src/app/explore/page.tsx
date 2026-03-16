import { getAllCityProfiles } from "@/lib/data/aggregator";
import type { CityScoreRow } from "@/types/city";
import { MapExplorerClient } from "@/components/map/MapExplorerClient";

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  const profiles = await getAllCityProfiles();

  const cities: CityScoreRow[] = profiles
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Map Explorer</h1>
        <p className="text-muted-foreground mt-1">
          Interactive map with investment heatmap and project markers
        </p>
      </div>
      <MapExplorerClient cities={cities} />
    </div>
  );
}
