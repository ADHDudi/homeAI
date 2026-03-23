"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CityScoreRow } from "@/types/city";

const MarketCharts = dynamic(() => import("./MarketCharts"), {
  ssr: false,
  loading: () => (
    <div className="md:col-span-2 lg:col-span-4 grid gap-4 md:grid-cols-2 animate-pulse">
      <div className="border rounded-lg p-4"><div className="h-5 bg-muted rounded w-48 mb-4" /><div className="h-[250px] bg-muted rounded" /></div>
      <div className="border rounded-lg p-4"><div className="h-5 bg-muted rounded w-48 mb-4" /><div className="h-[250px] bg-muted rounded" /></div>
    </div>
  ),
});

export function MarketSummaryCharts({ cities }: { cities: CityScoreRow[] }) {
  const t = useTranslations("stats");

  const avgScore = cities.length > 0
    ? Math.round(cities.reduce((s, c) => s + c.investmentScore, 0) / cities.length)
    : 0;
  const withRenewal = cities.filter((c) => c.urbanRenewalProjects > 0).length;
  const withPricing = cities.filter((c) => c.mechirLaMishtakenAvgPricePerMeter !== null).length;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t("citiesAnalyzed")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xl md:text-2xl font-bold">{cities.length}</div>
          <p className="text-xs text-muted-foreground mt-1">{t("citiesAnalyzedSub")}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t("averageScore")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xl md:text-2xl font-bold">{avgScore}</div>
          <p className="text-xs text-muted-foreground mt-1">{t("averageScoreSub")}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t("urbanRenewal")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xl md:text-2xl font-bold">{withRenewal}</div>
          <p className="text-xs text-muted-foreground mt-1">{t("urbanRenewalSub")}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t("priceData")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xl md:text-2xl font-bold">{withPricing}</div>
          <p className="text-xs text-muted-foreground mt-1">{t("priceDataSub")}</p>
        </CardContent>
      </Card>

      <MarketCharts cities={cities} />
    </div>
  );
}
