import { getAllCityProfiles } from "@/lib/data/aggregator";
import type { CityScoreRow } from "@/types/city";
import { MapExplorerClient } from "@/components/map/MapExplorerClient";
import { getTranslations, setRequestLocale } from "next-intl/server";

export const revalidate = 300; // 5 min ISR

export default async function ExplorePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("map");

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
    <div className="space-y-4 md:space-y-6 lg:space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("subtitle")}
        </p>
      </div>
      <MapExplorerClient cities={cities} />
    </div>
  );
}
