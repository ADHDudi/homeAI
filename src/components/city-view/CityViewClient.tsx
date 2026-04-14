"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import dynamic from "next/dynamic";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScoreBadge } from "@/components/shared/ScoreBadge";
import { StatCard } from "@/components/shared/StatCard";
// Lazy-load heavy below-fold components to reduce initial bundle
const ScoreRadar = dynamic(
  () => import("@/components/city/ScoreRadar").then((m) => m.ScoreRadar),
  { ssr: false, loading: () => <div className="h-[300px] bg-muted rounded animate-pulse" /> }
);
const NeighborhoodPricing = dynamic(
  () => import("@/components/city/NeighborhoodPricing").then((m) => m.NeighborhoodPricing),
  { ssr: false, loading: () => <div className="h-[200px] bg-muted rounded animate-pulse" /> }
);
const CityProjectsList = dynamic(
  () => import("@/components/city/CityProjectsList").then((m) => m.CityProjectsList),
  { ssr: false, loading: () => <div className="h-[200px] bg-muted rounded animate-pulse" /> }
);
import { SubScoreInfoIcon } from "@/components/shared/SubScoreInfo";
import { DISTRICTS } from "@/config/datasets";
import { getCityCoordinates } from "@/data/cityCoordinates";
import type { CityProfile } from "@/types/city";
import type { CityNeighborhoodData } from "@/types/neighborhood";

const NeighborhoodMap = dynamic(
  () => import("@/components/city/NeighborhoodMap").then((m) => m.NeighborhoodMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[300px] md:h-[400px] lg:h-[500px] rounded-lg border bg-muted animate-pulse" />
    ),
  }
);

function CitySelector({
  cities,
  selectedCode,
  onSelect,
  selectedCity,
}: {
  cities: CityProfile[];
  selectedCode: string;
  onSelect: (code: string) => void;
  selectedCity: CityProfile | null;
}) {
  const t = useTranslations("cityView");
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState(!!selectedCode);

  const filtered = useMemo(() => {
    if (!search) return cities;
    const q = search.toLowerCase();
    return cities.filter(
      (c) => c.cityName.includes(search) || c.cityName.toLowerCase().includes(q)
    );
  }, [cities, search]);

  const handleSelect = (code: string) => {
    onSelect(code);
    setCollapsed(true);
    setSearch("");
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t("selectCity")}
            {selectedCity && (
              <span className="ms-2 text-foreground font-semibold text-base">
                {selectedCity.cityName}
              </span>
            )}
          </CardTitle>
          {selectedCity && (
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="text-xs text-primary hover:underline"
            >
              {collapsed ? t("change") : t("collapse")}
            </button>
          )}
        </div>
      </CardHeader>
      {!collapsed && (
        <CardContent className="space-y-2">
          <div className="relative">
            <Search className="absolute start-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-8"
            />
          </div>
          <div className="max-h-[280px] overflow-y-auto rounded-md border divide-y">
            {filtered.map((c, i) => (
              <button
                key={c.cityCode}
                onClick={() => handleSelect(String(c.cityCode))}
                onMouseEnter={() => import("@/components/city/NeighborhoodMap")}
                className={`w-full flex items-center gap-3 px-3 py-2 text-start text-sm transition-colors hover:bg-muted/50 ${
                  c.cityCode === Number(selectedCode)
                    ? "bg-primary/10 font-medium"
                    : ""
                }`}
              >
                <span className="text-xs text-muted-foreground w-5 text-end shrink-0">
                  {i + 1}
                </span>
                <span className="flex-1 truncate">{c.cityName}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {c.district}
                </span>
                <ScoreBadge score={c.investmentScore} />
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                {t("noCitiesFound")}
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export function CityViewClient({ cities }: { cities: CityProfile[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations("cityView");
  const ts = useTranslations("stats");
  const tsc = useTranslations("scores");
  const locale = useLocale();

  // Initialise from ?city=CODE query param (enables deep-linking)
  const [selectedCode, setSelectedCode] = useState(
    () => searchParams.get("city") ?? ""
  );
  const [neighborhoodData, setNeighborhoodData] =
    useState<CityNeighborhoodData | null>(null);
  // Start as true if a city is already selected (deep-link) so skeleton shows immediately
  const [neighborhoodLoading, setNeighborhoodLoading] = useState(
    () => !!(searchParams.get("city"))
  );
  const [neighborhoodError, setNeighborhoodError] = useState(false);

  // Sync selection to URL so the link is shareable
  const selectCity = useCallback(
    (code: string) => {
      setSelectedCode(code);
      router.replace(`/${locale}/city-view?city=${code}`, { scroll: false });
    },
    [router, locale]
  );

  const city = useMemo(
    () =>
      selectedCode
        ? cities.find((c) => c.cityCode === Number(selectedCode)) ?? null
        : null,
    [cities, selectedCode]
  );

  const cityCenter = useMemo(
    () => (city ? getCityCoordinates(city.cityName, city.district) : null),
    [city]
  );

  // Fetch neighborhood data when city changes
  useEffect(() => {
    if (!selectedCode) {
      setNeighborhoodData(null);
      return;
    }

    // Validate city code is a positive integer before fetching
    const code = Number(selectedCode);
    if (!Number.isInteger(code) || code < 0 || code > 99999) {
      setNeighborhoodData(null);
      return;
    }

    let cancelled = false;
    setNeighborhoodLoading(true);
    setNeighborhoodData(null);
    setNeighborhoodError(false);

    fetch(`/api/city/${code}/neighborhood`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`${res.status}`))))
      .then((data) => {
        if (!cancelled) setNeighborhoodData(data);
      })
      .catch(() => {
        if (!cancelled) setNeighborhoodError(true);
      })
      .finally(() => {
        if (!cancelled) setNeighborhoodLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCode]);

  // Count data points — separate geo-located (for map) from total
  const geoCount = neighborhoodData
    ? neighborhoodData.greenBuildings.length +
      neighborhoodData.busStops.length +
      neighborhoodData.bankBranches.length +
      neighborhoodData.constructionSites.filter((s) => s.lat != null && s.lng != null).length +
      neighborhoodData.renewalProjects.length
    : 0;

  const neighborhoodCount = neighborhoodData
    ? geoCount +
      neighborhoodData.neighborhoodPricing.length +
      neighborhoodData.renewalProjects.length +
      neighborhoodData.constructionSites.length +
      neighborhoodData.contaminatedSites.length +
      neighborhoodData.housingPlans.length
    : 0;

  return (
    <div className="space-y-6">
      {/* City Selector */}
      <CitySelector
        cities={cities}
        selectedCode={selectedCode}
        onSelect={selectCity}
        selectedCity={city}
      />

      {/* Empty State */}
      {!city && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🏙️</div>
          <h2 className="text-xl font-semibold mb-2">
            {t("selectCityToExplore")}
          </h2>
          <p className="text-muted-foreground mb-6">
            {t("viewInvestmentProfile")}
          </p>

          {/* Quick picks */}
          <div className="flex flex-wrap justify-center gap-2">
            {cities.slice(0, 5).map((c) => (
              <button
                key={c.cityCode}
                onClick={() => selectCity(String(c.cityCode))}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-muted transition-colors"
              >
                {c.cityName}
                <span className="ms-1 text-muted-foreground">
                  ({c.investmentScore})
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* City Content */}
      {city && (
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                {city.cityName}
              </h2>
              <p className="text-muted-foreground mt-1">
                {city.district}
                {DISTRICTS[city.district] && ` (${DISTRICTS[city.district]})`}
                {" · "}
                {ts("population")}: {city.population.toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <ScoreBadge score={city.investmentScore} size="lg" showLabel />
              <p className="text-xs text-muted-foreground mt-1">
                {tsc("investmentScore")}
              </p>
            </div>
          </div>

          {/* Section Navigation */}
          <div className="flex gap-2 sticky top-0 z-10 bg-background/95 backdrop-blur py-2 -mx-1 px-1 overflow-x-auto scrollbar-hide">
            <a
              href="#overview"
              className="px-4 py-2 rounded-lg text-xs sm:text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {t("overview")}
            </a>
            {!neighborhoodLoading && neighborhoodCount > 0 && (
              <a
                href="#neighborhood"
                className="px-4 py-2 rounded-lg text-xs sm:text-sm font-medium bg-muted hover:bg-muted/80 transition-colors flex items-center gap-2"
              >
                {t("neighborhoodDetail")}
                <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
                  {t("dataPoints", { count: neighborhoodCount.toLocaleString() })}
                </span>
              </a>
            )}
          </div>

          <div id="overview" />
          <Separator />

          {/* Map (hero) */}
          {cityCenter && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{t("cityMap")}</CardTitle>
                  {neighborhoodLoading && (
                    <span className="text-xs text-muted-foreground animate-pulse">
                      {t("loadingMapData")}
                    </span>
                  )}
                  {!neighborhoodLoading && geoCount > 0 && (
                    <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
                      {t("mapMarkers", { count: geoCount.toLocaleString() })}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {/* Render map immediately on city select; markers populate when API responds */}
                <NeighborhoodMap
                  key={selectedCode}
                  center={cityCenter}
                  greenBuildings={neighborhoodData?.greenBuildings ?? []}
                  busStops={neighborhoodData?.busStops ?? []}
                  bankBranches={neighborhoodData?.bankBranches ?? []}
                  constructionSites={neighborhoodData?.constructionSites ?? []}
                  renewalProjects={neighborhoodData?.renewalProjects ?? []}
                />
              </CardContent>
            </Card>
          )}

          {/* Score Breakdown */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{tsc("scoreBreakdown")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ScoreRadar breakdown={city.scoreBreakdown} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{tsc("subScores")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: tsc("development"), score: city.scoreBreakdown.development, weight: tsc("developmentWeight") },
                  { label: tsc("demand"), score: city.scoreBreakdown.demand, weight: tsc("demandWeight") },
                  { label: tsc("price"), score: city.scoreBreakdown.price, weight: tsc("priceWeight") },
                  { label: tsc("infrastructure"), score: city.scoreBreakdown.infrastructure, weight: tsc("infrastructureWeight") },
                  { label: tsc("municipal"), score: city.scoreBreakdown.municipal, weight: tsc("municipalWeight") },
                  { label: tsc("environment"), score: city.scoreBreakdown.environment, weight: tsc("environmentWeight") },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-sm font-medium">{item.label}</span>
                      <span className="text-xs text-muted-foreground ms-2">({item.weight})</span>
                      <SubScoreInfoIcon label={item.label} />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        {item.score !== null && (
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${item.score}%` }}
                          />
                        )}
                      </div>
                      <ScoreBadge score={item.score} size="sm" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Stat Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label={ts("urbanRenewalProjects")}
              value={city.urbanRenewalProjects}
              subtitle={ts("inExecution", { count: city.urbanRenewalInExecution })}
            />
            <StatCard
              label={ts("additionalUnits")}
              value={city.urbanRenewalUnitsAdditional.toLocaleString()}
              subtitle={ts("fromExisting", { count: city.urbanRenewalUnitsExisting.toLocaleString() })}
            />
            <StatCard
              label={ts("constructionSites")}
              value={city.constructionSites}
              subtitle={ts("withActiveCranes", { count: city.constructionWithCranes })}
            />
            <StatCard
              label={ts("housingPipeline")}
              value={city.housingInventoryUnits.toLocaleString()}
              subtitle={ts("potentialUnits")}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label={ts("avgPricePerMeter")}
              value={
                city.mechirLaMishtakenAvgPricePerMeter
                  ? `₪${Math.round(city.mechirLaMishtakenAvgPricePerMeter).toLocaleString()}`
                  : "N/A"
              }
              subtitle={ts("projects", { count: city.mechirLaMishtakenProjects })}
            />
            <StatCard
              label={ts("subscriberWinnerRatio")}
              value={
                city.subscriberToWinnerRatio
                  ? `${city.subscriberToWinnerRatio.toFixed(1)}x`
                  : "N/A"
              }
              subtitle={ts("demandIndicator")}
            />
            <StatCard
              label={ts("busStops")}
              value={city.busStopCount || "N/A"}
              subtitle={ts("transitAccessibility")}
            />
            <StatCard
              label={ts("bankBranches")}
              value={city.bankBranchCount || "N/A"}
              subtitle={ts("financialInfrastructure")}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label={ts("greenBuildings")}
              value={city.greenBuildingCount || "N/A"}
              subtitle={
                city.greenBuildingAvgScore
                  ? ts("avgScore", { score: city.greenBuildingAvgScore.toFixed(1) })
                  : undefined
              }
            />
            <StatCard
              label={ts("contaminatedSites")}
              value={city.contaminatedSiteCount || "N/A"}
              subtitle={city.contaminatedSiteCount ? ts("remediated", { count: city.contaminatedSitesRemediated }) : undefined}
            />
            <StatCard
              label={ts("youngAdultRatio")}
              value={city.youngAdultRatio ? `${(city.youngAdultRatio * 100).toFixed(1)}%` : "N/A"}
              subtitle={ts("age1945")}
            />
            <StatCard
              label={ts("population")}
              value={city.population.toLocaleString()}
              subtitle={city.district}
            />
          </div>

          {/* Municipal Finances */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label={ts("budgetBalance")}
              value={city.municipalBudgetSurplus != null ? `₪${city.municipalBudgetSurplus.toLocaleString()}K` : "N/A"}
              subtitle={ts("accumulatedSurplus")}
            />
            <StatCard
              label={ts("annualIncome")}
              value={city.municipalTotalIncome != null ? `₪${city.municipalTotalIncome.toLocaleString()}K` : "N/A"}
              subtitle={ts("regularBudget")}
            />
            <StatCard
              label={ts("annualExpenses")}
              value={city.municipalTotalExpenses != null ? `₪${city.municipalTotalExpenses.toLocaleString()}K` : "N/A"}
              subtitle={ts("regularBudget")}
            />
            <StatCard
              label={ts("loanBurden")}
              value={city.municipalLoanBurden != null ? `₪${city.municipalLoanBurden.toLocaleString()}K` : "N/A"}
              subtitle={ts("outstandingLoans")}
            />
          </div>

          {/* Age Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>{t("ageDistribution")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[
                  { label: "0-5", value: city.ageDistribution.age_0_5 },
                  { label: "6-18", value: city.ageDistribution.age_6_18 },
                  { label: "19-45", value: city.ageDistribution.age_19_45 },
                  { label: "46-55", value: city.ageDistribution.age_46_55 },
                  { label: "56-64", value: city.ageDistribution.age_56_64 },
                  { label: "65+", value: city.ageDistribution.age_65_plus },
                ].map((group) => {
                  const pct =
                    city.population > 0
                      ? (group.value / city.population) * 100
                      : 0;
                  return (
                    <div key={group.label} className="text-center">
                      <div className="relative h-24 sm:h-32 bg-muted rounded-t-md overflow-hidden">
                        <div
                          className="absolute bottom-0 w-full bg-primary/70 rounded-t-md transition-all"
                          style={{ height: `${pct}%` }}
                        />
                      </div>
                      <div className="text-xs font-medium mt-1">
                        {group.label}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {pct.toFixed(0)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Neighborhood Detail Section */}
          {neighborhoodLoading && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="h-8 w-64 bg-muted rounded animate-pulse" />
                <div className="h-64 bg-muted rounded-lg animate-pulse" />
              </div>
            </>
          )}

          {!neighborhoodLoading && neighborhoodError && (
            <>
              <Separator />
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center space-y-3">
                <p className="text-sm text-muted-foreground">{t("neighborhoodLoadError")}</p>
                <button
                  onClick={() => {
                    const code = Number(selectedCode);
                    setNeighborhoodLoading(true);
                    setNeighborhoodError(false);
                    fetch(`/api/city/${code}/neighborhood`)
                      .then((res) => (res.ok ? res.json() : Promise.reject()))
                      .then((data) => setNeighborhoodData(data))
                      .catch(() => setNeighborhoodError(true))
                      .finally(() => setNeighborhoodLoading(false));
                  }}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  {t("retry")}
                </button>
              </div>
            </>
          )}

          {!neighborhoodLoading && neighborhoodData && neighborhoodCount > 0 && (
            <>
              <Separator />

              <div id="neighborhood" className="scroll-mt-16">
                <h2 className="text-2xl font-bold tracking-tight">
                  {t("neighborhoodDetail")}
                </h2>
                <p className="text-muted-foreground mt-1">
                  {t("subCityData")}
                </p>
              </div>

              {/* Neighborhood Pricing */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    {t("pricingByNeighborhood")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <NeighborhoodPricing
                    neighborhoods={neighborhoodData.neighborhoodPricing}
                  />
                </CardContent>
              </Card>

              {/* Projects & Sites */}
              <CityProjectsList
                renewalProjects={neighborhoodData.renewalProjects}
                constructionSites={neighborhoodData.constructionSites}
                housingPlans={neighborhoodData.housingPlans}
                contaminatedSites={neighborhoodData.contaminatedSites}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
