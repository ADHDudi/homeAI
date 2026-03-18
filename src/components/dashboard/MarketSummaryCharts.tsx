"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CityScoreRow } from "@/types/city";

const SCORE_COLORS = {
  excellent: "#059669",
  good: "#2563eb",
  fair: "#d97706",
  low: "#dc2626",
};

function getBarColor(score: number) {
  if (score >= 75) return SCORE_COLORS.excellent;
  if (score >= 60) return SCORE_COLORS.good;
  if (score >= 45) return SCORE_COLORS.fair;
  return SCORE_COLORS.low;
}

export function MarketSummaryCharts({ cities }: { cities: CityScoreRow[] }) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("stats");
  const ts = useTranslations("scores");
  const td = useTranslations("dashboard");

  // Top 15 cities by score
  const top15 = cities.slice(0, 15).map((c) => ({
    name: c.cityName,
    score: c.investmentScore,
    cityCode: c.cityCode,
  }));

  // Score distribution
  const distribution = [
    { range: "75-100", label: ts("excellent"), count: cities.filter((c) => c.investmentScore >= 75).length, color: SCORE_COLORS.excellent },
    { range: "60-74", label: ts("good"), count: cities.filter((c) => c.investmentScore >= 60 && c.investmentScore < 75).length, color: SCORE_COLORS.good },
    { range: "45-59", label: ts("fair"), count: cities.filter((c) => c.investmentScore >= 45 && c.investmentScore < 60).length, color: SCORE_COLORS.fair },
    { range: "0-44", label: ts("low"), count: cities.filter((c) => c.investmentScore < 45).length, color: SCORE_COLORS.low },
  ];

  // Stats
  const avgScore = cities.length > 0
    ? Math.round(cities.reduce((s, c) => s + c.investmentScore, 0) / cities.length)
    : 0;
  const withRenewal = cities.filter((c) => c.urbanRenewalProjects > 0).length;
  const withPricing = cities.filter((c) => c.mechirLaMishtakenAvgPricePerMeter !== null).length;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Stats cards */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t("citiesAnalyzed")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xl md:text-2xl font-bold">{cities.length}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {t("citiesAnalyzedSub")}
          </p>
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
          <p className="text-xs text-muted-foreground mt-1">
            {t("averageScoreSub")}
          </p>
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
          <p className="text-xs text-muted-foreground mt-1">
            {t("urbanRenewalSub")}
          </p>
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
          <p className="text-xs text-muted-foreground mt-1">
            {t("priceDataSub")}
          </p>
        </CardContent>
      </Card>

      {/* Top cities chart */}
      <Card className="md:col-span-2 lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">{td("cityRankings")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] md:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={top15}
              layout="vertical"
              margin={{ left: 40 }}
              onClick={(state: Record<string, unknown> | null) => {
                const payload = (state as { activePayload?: { payload?: { cityCode?: number } }[] })?.activePayload?.[0]?.payload;
                if (payload?.cityCode) {
                  router.push(`/${locale}/city-view?city=${payload.cityCode}`);
                }
              }}
              style={{ cursor: "pointer" }}
            >
              <XAxis type="number" domain={[0, 100]} />
              <YAxis type="category" dataKey="name" width={50} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value) => [`${value}`, "Score"]}
                labelStyle={{ direction: "rtl" }}
              />
              <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                {top15.map((entry, index) => (
                  <Cell key={index} fill={getBarColor(entry.score)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Distribution chart */}
      <Card className="md:col-span-2 lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">{ts("scoreBreakdown")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] md:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={distribution}>
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value} cities`, "Count"]} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {distribution.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
