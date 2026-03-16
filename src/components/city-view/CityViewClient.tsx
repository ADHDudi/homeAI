"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScoreBadge } from "@/components/shared/ScoreBadge";
import { StatCard } from "@/components/shared/StatCard";
import { ScoreRadar } from "@/components/city/ScoreRadar";
import { NeighborhoodPricing } from "@/components/city/NeighborhoodPricing";
import { CityProjectsList } from "@/components/city/CityProjectsList";
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
            Select City
            {selectedCity && (
              <span className="ml-2 text-foreground font-semibold text-base">
                {selectedCity.cityName}
              </span>
            )}
          </CardTitle>
          {selectedCity && (
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="text-xs text-primary hover:underline"
            >
              {collapsed ? "Change" : "Collapse"}
            </button>
          )}
        </div>
      </CardHeader>
      {!collapsed && (
        <CardContent className="space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search city / חיפוש עיר..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="max-h-[280px] overflow-y-auto rounded-md border divide-y">
            {filtered.map((c, i) => (
              <button
                key={c.cityCode}
                onClick={() => handleSelect(String(c.cityCode))}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50 ${
                  c.cityCode === Number(selectedCode)
                    ? "bg-primary/10 font-medium"
                    : ""
                }`}
              >
                <span className="text-xs text-muted-foreground w-5 text-right shrink-0">
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
                No cities found
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

  // Initialise from ?city=CODE query param (enables deep-linking)
  const [selectedCode, setSelectedCode] = useState(
    () => searchParams.get("city") ?? ""
  );
  const [neighborhoodData, setNeighborhoodData] =
    useState<CityNeighborhoodData | null>(null);
  const [neighborhoodLoading, setNeighborhoodLoading] = useState(false);

  // Sync selection to URL so the link is shareable
  const selectCity = useCallback(
    (code: string) => {
      setSelectedCode(code);
      router.replace(`/city-view?city=${code}`, { scroll: false });
    },
    [router]
  );

  const city = useMemo(
    () =>
      selectedCode
        ? cities.find((c) => c.cityCode === Number(selectedCode)) ?? null
        : null,
    [cities, selectedCode]
  );

  const cityCenter = useMemo(
    () => (city ? getCityCoordinates(city.cityName) : null),
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

    fetch(`/api/city/${code}/neighborhood`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setNeighborhoodData(data);
      })
      .catch(() => {
        if (!cancelled) setNeighborhoodData(null);
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
      neighborhoodData.bankBranches.length
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
            Select a city to explore
          </h2>
          <p className="text-muted-foreground mb-6">
            View investment profile, neighborhood map, and detailed data
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
                <span className="ml-1 text-muted-foreground">
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
                Population: {city.population.toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <ScoreBadge score={city.investmentScore} size="lg" showLabel />
              <p className="text-xs text-muted-foreground mt-1">
                Investment Score
              </p>
            </div>
          </div>

          {/* Section Navigation */}
          <div className="flex gap-2 sticky top-0 z-10 bg-background/95 backdrop-blur py-2 -mx-1 px-1 overflow-x-auto scrollbar-hide">
            <a
              href="#overview"
              className="px-4 py-2 rounded-lg text-xs sm:text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Overview
            </a>
            {!neighborhoodLoading && neighborhoodCount > 0 && (
              <a
                href="#neighborhood"
                className="px-4 py-2 rounded-lg text-xs sm:text-sm font-medium bg-muted hover:bg-muted/80 transition-colors flex items-center gap-2"
              >
                Neighborhood Detail
                <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
                  {neighborhoodCount.toLocaleString()} data points
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
                  <CardTitle>City Map — Points of Interest</CardTitle>
                  {neighborhoodLoading && (
                    <span className="text-xs text-muted-foreground animate-pulse">
                      Loading map data...
                    </span>
                  )}
                  {!neighborhoodLoading && geoCount > 0 && (
                    <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
                      {geoCount.toLocaleString()} map markers
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {neighborhoodLoading ? (
                  <div className="w-full h-[300px] md:h-[400px] lg:h-[500px] rounded-lg border bg-muted animate-pulse" />
                ) : neighborhoodData ? (
                  <NeighborhoodMap
                    key={selectedCode}
                    center={cityCenter}
                    greenBuildings={neighborhoodData.greenBuildings}
                    busStops={neighborhoodData.busStops}
                    bankBranches={neighborhoodData.bankBranches}
                  />
                ) : null}
              </CardContent>
            </Card>
          )}

          {/* Score Breakdown */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Score Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ScoreRadar breakdown={city.scoreBreakdown} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sub-Scores</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Development Momentum", score: city.scoreBreakdown.development, weight: "25%" },
                  { label: "Demand Signal", score: city.scoreBreakdown.demand, weight: "20%" },
                  { label: "Price Attractiveness", score: city.scoreBreakdown.price, weight: "20%" },
                  { label: "Infrastructure", score: city.scoreBreakdown.infrastructure, weight: "15%" },
                  { label: "Municipal Health", score: city.scoreBreakdown.municipal, weight: "10%" },
                  { label: "Environment", score: city.scoreBreakdown.environment, weight: "10%" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-sm font-medium">{item.label}</span>
                      <span className="text-xs text-muted-foreground ml-2">({item.weight})</span>
                      <SubScoreInfoIcon label={item.label} />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${item.score}%` }}
                        />
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
              label="Urban Renewal Projects"
              value={city.urbanRenewalProjects}
              subtitle={`${city.urbanRenewalInExecution} in execution`}
            />
            <StatCard
              label="Additional Units (Renewal)"
              value={city.urbanRenewalUnitsAdditional.toLocaleString()}
              subtitle={`from ${city.urbanRenewalUnitsExisting.toLocaleString()} existing`}
            />
            <StatCard
              label="Construction Sites"
              value={city.constructionSites}
              subtitle={`${city.constructionWithCranes} with active cranes`}
            />
            <StatCard
              label="Housing Pipeline"
              value={city.housingInventoryUnits.toLocaleString()}
              subtitle="potential units"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Avg Price/m² (Mechir LaMishtaken)"
              value={
                city.mechirLaMishtakenAvgPricePerMeter
                  ? `₪${Math.round(city.mechirLaMishtakenAvgPricePerMeter).toLocaleString()}`
                  : "N/A"
              }
              subtitle={`${city.mechirLaMishtakenProjects} projects`}
            />
            <StatCard
              label="Subscriber/Winner Ratio"
              value={
                city.subscriberToWinnerRatio
                  ? `${city.subscriberToWinnerRatio.toFixed(1)}x`
                  : "N/A"
              }
              subtitle="Demand indicator"
            />
            <StatCard
              label="Bus Stops"
              value={city.busStopCount || "N/A"}
              subtitle="Transit accessibility"
            />
            <StatCard
              label="Bank Branches"
              value={city.bankBranchCount || "N/A"}
              subtitle="Financial infrastructure"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Green Buildings"
              value={city.greenBuildingCount || "N/A"}
              subtitle={
                city.greenBuildingAvgScore
                  ? `Avg score: ${city.greenBuildingAvgScore.toFixed(1)}`
                  : undefined
              }
            />
            <StatCard
              label="Contaminated Sites"
              value={city.contaminatedSiteCount || "N/A"}
              subtitle={city.contaminatedSiteCount ? `${city.contaminatedSitesRemediated} remediated` : undefined}
            />
            <StatCard
              label="Young Adult Ratio"
              value={city.youngAdultRatio ? `${(city.youngAdultRatio * 100).toFixed(1)}%` : "N/A"}
              subtitle="Age 19-45"
            />
            <StatCard
              label="Population"
              value={city.population.toLocaleString()}
              subtitle={city.district}
            />
          </div>

          {/* Municipal Finances */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Budget Balance"
              value={city.municipalBudgetSurplus != null ? `₪${city.municipalBudgetSurplus.toLocaleString()}K` : "N/A"}
              subtitle="Accumulated surplus/deficit"
            />
            <StatCard
              label="Annual Income"
              value={city.municipalTotalIncome != null ? `₪${city.municipalTotalIncome.toLocaleString()}K` : "N/A"}
              subtitle="Regular budget"
            />
            <StatCard
              label="Annual Expenses"
              value={city.municipalTotalExpenses != null ? `₪${city.municipalTotalExpenses.toLocaleString()}K` : "N/A"}
              subtitle="Regular budget"
            />
            <StatCard
              label="Loan Burden"
              value={city.municipalLoanBurden != null ? `₪${city.municipalLoanBurden.toLocaleString()}K` : "N/A"}
              subtitle="Outstanding loans"
            />
          </div>

          {/* Age Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Age Distribution</CardTitle>
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

          {!neighborhoodLoading && neighborhoodData && neighborhoodCount > 0 && (
            <>
              <Separator />

              <div id="neighborhood" className="scroll-mt-16">
                <h2 className="text-2xl font-bold tracking-tight">
                  Neighborhood Detail
                </h2>
                <p className="text-muted-foreground mt-1">
                  Sub-city level data from government datasets
                </p>
              </div>

              {/* Neighborhood Pricing */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    Pricing by Neighborhood (Mechir LaMishtaken)
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
