"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import type { CityScoreRow } from "@/types/city";

const CityRankingsChart = dynamic(() => import("./MarketCharts").then((m) => m.CityRankingsChart), {
  ssr: false,
  loading: () => (
    <div className="w-full border rounded-lg p-4 animate-pulse">
      <div className="h-5 bg-muted rounded w-48 mb-4" />
      <div className="h-[250px] bg-muted rounded" />
    </div>
  ),
});

function StatTile({ label, value, sub }: { label: string; value: string | number; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-3 rounded-xl bg-card ring-1 ring-foreground/10 min-w-0">
      <p className="text-[11px] sm:text-xs font-medium text-muted-foreground leading-tight mb-1 truncate w-full">{label}</p>
      <p className="text-lg sm:text-2xl font-bold leading-tight">{value}</p>
      <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 leading-tight truncate w-full">{sub}</p>
    </div>
  );
}

export function MarketSummaryCharts({ cities }: { cities: CityScoreRow[] }) {
  const t = useTranslations("stats");

  const withRenewal = cities.filter((c) => c.urbanRenewalProjects > 0).length;
  const withPricing = cities.filter((c) => c.mechirLaMishtakenAvgPricePerMeter !== null).length;

  return (
    <div className="space-y-4">
      {/* Stat tiles — always a single horizontal row */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <StatTile
          label={t("citiesAnalyzed")}
          value={cities.length}
          sub={t("citiesAnalyzedSub")}
        />
        <StatTile
          label={t("urbanRenewal")}
          value={withRenewal}
          sub={t("urbanRenewalSub")}
        />
        <StatTile
          label={t("priceData")}
          value={withPricing}
          sub={t("priceDataSub")}
        />
      </div>

      {/* City rankings chart */}
      <CityRankingsChart cities={cities} />
    </div>
  );
}
