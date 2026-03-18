"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreBadge } from "@/components/shared/ScoreBadge";
import { SubScoreInfoIcon } from "@/components/shared/SubScoreInfo";
import type { ScoreBreakdown } from "@/types/city";

interface CompareCity {
  cityName: string;
  cityCode: number;
  district: string;
  population: number;
  investmentScore: number;
  scoreBreakdown: ScoreBreakdown;
  urbanRenewalProjects: number;
  urbanRenewalUnitsAdditional: number;
  urbanRenewalInExecution: number;
  constructionSites: number;
  constructionWithCranes: number;
  housingInventoryUnits: number;
  mechirLaMishtakenAvgPricePerMeter: number | null;
  mechirLaMishtakenProjects: number;
  subscriberToWinnerRatio: number | null;
  busStopCount: number;
  bankBranchCount: number;
  greenBuildingCount: number;
  contaminatedSiteCount: number;
  youngAdultRatio: number;
  municipalBudgetSurplus: number | null;
  municipalTotalIncome: number | null;
  municipalTotalExpenses: number | null;
  municipalLoanBurden: number | null;
}

function CompareRow({
  label,
  valueA,
  valueB,
  higherIsBetter = true,
  infoLabel,
  naLabel = "N/A",
}: {
  label: string;
  valueA: string | number | null;
  valueB: string | number | null;
  higherIsBetter?: boolean;
  infoLabel?: string;
  naLabel?: string;
}) {
  const numA = valueA === null ? NaN : typeof valueA === "number" ? valueA : parseFloat(String(valueA).replace(/[^0-9.-]/g, ""));
  const numB = valueB === null ? NaN : typeof valueB === "number" ? valueB : parseFloat(String(valueB).replace(/[^0-9.-]/g, ""));
  const hasComparison = !isNaN(numA) && !isNaN(numB) && numA !== numB;
  const aWins = higherIsBetter ? numA > numB : numA < numB;

  const displayA = valueA === null ? naLabel : typeof valueA === "number" ? valueA.toLocaleString() : valueA;
  const displayB = valueB === null ? naLabel : typeof valueB === "number" ? valueB.toLocaleString() : valueB;
  const aWinClass = hasComparison && aWins ? "text-emerald-600" : "";
  const bWinClass = hasComparison && !aWins ? "text-emerald-600" : "";

  return (
    <>
      {/* Mobile stacked */}
      <div className="sm:hidden rounded-lg border p-3 space-y-1">
        <div className="text-xs font-medium text-muted-foreground text-center flex items-center justify-center">{label}{infoLabel && <SubScoreInfoIcon label={infoLabel} />}</div>
        <div className="flex justify-between">
          <span className={`font-medium ${aWinClass}`}>{displayA}</span>
          <span className={`font-medium ${bWinClass}`}>{displayB}</span>
        </div>
      </div>
      {/* Desktop 3-col */}
      <div className="hidden sm:grid grid-cols-3 gap-4 py-3 border-b last:border-0">
        <div className={`text-end font-medium ${aWinClass}`}>
          {displayA}
        </div>
        <div className="text-center text-sm text-muted-foreground flex items-center justify-center">{label}{infoLabel && <SubScoreInfoIcon label={infoLabel} />}</div>
        <div className={`text-start font-medium ${bWinClass}`}>
          {displayB}
        </div>
      </div>
    </>
  );
}

function CityPicker({
  label,
  cities,
  selectedCode,
  onSelect,
}: {
  label: string;
  cities: CompareCity[];
  selectedCode: string;
  onSelect: (code: string) => void;
}) {
  const t = useTranslations("cityView");
  const [search, setSearch] = useState("");
  const selected = cities.find((c) => c.cityCode === Number(selectedCode));

  const filtered = useMemo(() => {
    if (!search) return cities;
    const q = search.toLowerCase();
    return cities.filter(
      (c) => c.cityName.includes(search) || c.cityName.toLowerCase().includes(q)
    );
  }, [cities, search]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
          {selected && (
            <span className="ms-2 text-foreground font-semibold text-base">
              {selected.cityName}
            </span>
          )}
        </CardTitle>
      </CardHeader>
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
        <div className="max-h-[240px] overflow-y-auto rounded-md border divide-y">
          {filtered.map((c, i) => (
            <button
              key={c.cityCode}
              onClick={() => onSelect(String(c.cityCode))}
              className={`w-full flex items-center gap-3 px-3 py-2 text-start text-sm transition-colors hover:bg-muted/50 ${
                c.cityCode === Number(selectedCode) ? "bg-primary/10 font-medium" : ""
              }`}
            >
              <span className="text-xs text-muted-foreground w-5 text-end shrink-0">{i + 1}</span>
              <span className="flex-1 truncate">{c.cityName}</span>
              <span className="text-xs text-muted-foreground shrink-0">{c.district}</span>
              <ScoreBadge score={c.investmentScore} />
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="px-3 py-4 text-center text-sm text-muted-foreground">{t("noCitiesFound")}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function CompareClient({ cities }: { cities: CompareCity[] }) {
  const t = useTranslations("compare");
  const ts = useTranslations("scores");
  const [codeA, setCodeA] = useState("");
  const [codeB, setCodeB] = useState("");

  const cityA = useMemo(() => codeA ? cities.find((c) => c.cityCode === Number(codeA)) ?? null : null, [cities, codeA]);
  const cityB = useMemo(() => codeB ? cities.find((c) => c.cityCode === Number(codeB)) ?? null : null, [cities, codeB]);

  return (
    <div className="space-y-6">
      {/* City selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <CityPicker label={t("cityA")} cities={cities} selectedCode={codeA} onSelect={setCodeA} />
        <CityPicker label={t("cityB")} cities={cities} selectedCode={codeB} onSelect={setCodeB} />
      </div>

      {/* Quick picks */}
      {!cityA && !cityB && (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">{t("selectTwoCities")}</p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { a: cities[0], b: cities[1] },
              { a: cities[0], b: cities[5] },
              { a: cities[2], b: cities[4] },
            ]
              .filter((pair) => pair.a && pair.b)
              .map((pair, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setCodeA(String(pair.a.cityCode));
                    setCodeB(String(pair.b.cityCode));
                  }}
                  className="px-3 py-1.5 text-sm border rounded-lg hover:bg-muted transition-colors"
                >
                  {pair.a.cityName} {t("vs")} {pair.b.cityName}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Comparison */}
      {cityA && cityB && (
        <div className="space-y-6">
          {/* Header */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="text-center">
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold">{cityA.cityName}</h2>
                <p className="text-sm text-muted-foreground">{cityA.district}</p>
                <div className="mt-3">
                  <ScoreBadge score={cityA.investmentScore} size="lg" showLabel />
                </div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold">{cityB.cityName}</h2>
                <p className="text-sm text-muted-foreground">{cityB.district}</p>
                <div className="mt-3">
                  <ScoreBadge score={cityB.investmentScore} size="lg" showLabel />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sub-scores */}
          <Card>
            <CardHeader>
              <CardTitle>{t("scoreBreakdown")}</CardTitle>
            </CardHeader>
            <CardContent>
              <CompareRow label={t("overallScore")} valueA={cityA.investmentScore} valueB={cityB.investmentScore} />
              <CompareRow label={`${ts("development")} (${ts("developmentWeight")})`} infoLabel="Development Momentum" valueA={cityA.scoreBreakdown.development} valueB={cityB.scoreBreakdown.development} />
              <CompareRow label={`${ts("demand")} (${ts("demandWeight")})`} infoLabel="Demand Signal" valueA={cityA.scoreBreakdown.demand} valueB={cityB.scoreBreakdown.demand} />
              <CompareRow label={`${ts("price")} (${ts("priceWeight")})`} infoLabel="Price Attractiveness" valueA={cityA.scoreBreakdown.price} valueB={cityB.scoreBreakdown.price} />
              <CompareRow label={`${ts("infrastructure")} (${ts("infrastructureWeight")})`} infoLabel="Infrastructure" valueA={cityA.scoreBreakdown.infrastructure} valueB={cityB.scoreBreakdown.infrastructure} />
              <CompareRow label={`${ts("municipal")} (${ts("municipalWeight")})`} infoLabel="Municipal Health" valueA={cityA.scoreBreakdown.municipal} valueB={cityB.scoreBreakdown.municipal} />
              <CompareRow label={`${ts("environment")} (${ts("environmentWeight")})`} infoLabel="Environment" valueA={cityA.scoreBreakdown.environment} valueB={cityB.scoreBreakdown.environment} />
            </CardContent>
          </Card>

          {/* Development */}
          <Card>
            <CardHeader>
              <CardTitle>{t("development")}</CardTitle>
            </CardHeader>
            <CardContent>
              <CompareRow label={t("renewalProjects")} valueA={cityA.urbanRenewalProjects} valueB={cityB.urbanRenewalProjects} />
              <CompareRow label={t("inExecution")} valueA={cityA.urbanRenewalInExecution} valueB={cityB.urbanRenewalInExecution} />
              <CompareRow label={t("additionalUnits")} valueA={cityA.urbanRenewalUnitsAdditional} valueB={cityB.urbanRenewalUnitsAdditional} />
              <CompareRow label={t("constructionSites")} valueA={cityA.constructionSites} valueB={cityB.constructionSites} />
              <CompareRow label={t("activeCranes")} valueA={cityA.constructionWithCranes} valueB={cityB.constructionWithCranes} />
              <CompareRow label={t("housingPipeline")} valueA={cityA.housingInventoryUnits} valueB={cityB.housingInventoryUnits} />
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>{t("pricingDemand")}</CardTitle>
            </CardHeader>
            <CardContent>
              <CompareRow
                label={t("avgPricePerMeter")}
                valueA={cityA.mechirLaMishtakenAvgPricePerMeter ? `₪${Math.round(cityA.mechirLaMishtakenAvgPricePerMeter).toLocaleString()}` : "N/A"}
                valueB={cityB.mechirLaMishtakenAvgPricePerMeter ? `₪${Math.round(cityB.mechirLaMishtakenAvgPricePerMeter).toLocaleString()}` : "N/A"}
                higherIsBetter={false}
              />
              <CompareRow
                label={t("subscriberWinner")}
                valueA={cityA.subscriberToWinnerRatio ? `${cityA.subscriberToWinnerRatio.toFixed(1)}x` : "N/A"}
                valueB={cityB.subscriberToWinnerRatio ? `${cityB.subscriberToWinnerRatio.toFixed(1)}x` : "N/A"}
              />
              <CompareRow label={t("mechirProjects")} valueA={cityA.mechirLaMishtakenProjects} valueB={cityB.mechirLaMishtakenProjects} />
            </CardContent>
          </Card>

          {/* Infrastructure & Demographics */}
          <Card>
            <CardHeader>
              <CardTitle>{t("infraDemographics")}</CardTitle>
            </CardHeader>
            <CardContent>
              <CompareRow label={t("population")} valueA={cityA.population} valueB={cityB.population} />
              <CompareRow label={t("youngAdults")} valueA={cityA.youngAdultRatio ? `${(cityA.youngAdultRatio * 100).toFixed(1)}%` : "N/A"} valueB={cityB.youngAdultRatio ? `${(cityB.youngAdultRatio * 100).toFixed(1)}%` : "N/A"} />
              <CompareRow label={t("busStops")} valueA={cityA.busStopCount || "N/A"} valueB={cityB.busStopCount || "N/A"} />
              <CompareRow label={t("bankBranches")} valueA={cityA.bankBranchCount || "N/A"} valueB={cityB.bankBranchCount || "N/A"} />
              <CompareRow label={t("greenBuildings")} valueA={cityA.greenBuildingCount || "N/A"} valueB={cityB.greenBuildingCount || "N/A"} />
              <CompareRow
                label={t("contaminatedSites")}
                valueA={cityA.contaminatedSiteCount || "N/A"}
                valueB={cityB.contaminatedSiteCount || "N/A"}
                higherIsBetter={false}
              />
            </CardContent>
          </Card>

          {/* Municipal Finances */}
          <Card>
            <CardHeader>
              <CardTitle>{t("municipalFinances")}</CardTitle>
            </CardHeader>
            <CardContent>
              <CompareRow label={t("budgetBalance")} valueA={cityA.municipalBudgetSurplus != null ? `₪${cityA.municipalBudgetSurplus.toLocaleString()}K` : "N/A"} valueB={cityB.municipalBudgetSurplus != null ? `₪${cityB.municipalBudgetSurplus.toLocaleString()}K` : "N/A"} />
              <CompareRow label={t("annualIncome")} valueA={cityA.municipalTotalIncome != null ? `₪${cityA.municipalTotalIncome.toLocaleString()}K` : "N/A"} valueB={cityB.municipalTotalIncome != null ? `₪${cityB.municipalTotalIncome.toLocaleString()}K` : "N/A"} />
              <CompareRow label={t("annualExpenses")} valueA={cityA.municipalTotalExpenses != null ? `₪${cityA.municipalTotalExpenses.toLocaleString()}K` : "N/A"} valueB={cityB.municipalTotalExpenses != null ? `₪${cityB.municipalTotalExpenses.toLocaleString()}K` : "N/A"} />
              <CompareRow label={t("loanBurden")} valueA={cityA.municipalLoanBurden != null ? `₪${cityA.municipalLoanBurden.toLocaleString()}K` : "N/A"} valueB={cityB.municipalLoanBurden != null ? `₪${cityB.municipalLoanBurden.toLocaleString()}K` : "N/A"} higherIsBetter={false} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
