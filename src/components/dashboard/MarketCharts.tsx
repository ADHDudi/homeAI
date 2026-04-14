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
import { ScoreBadge } from "@/components/shared/ScoreBadge";
import type { CityScoreRow } from "@/types/city";

function getBarColor(score: number) {
  if (score >= 75) return "#059669";
  if (score >= 60) return "#2563eb";
  if (score >= 45) return "#d97706";
  return "#dc2626";
}

export function CityRankingsChart({ cities }: { cities: CityScoreRow[] }) {
  const router = useRouter();
  const locale = useLocale();
  const td = useTranslations("dashboard");

  const top10 = cities.slice(0, 10).map((c, i) => ({
    name: c.cityName,
    score: c.investmentScore,
    cityCode: c.cityCode,
    rank: i + 1,
  }));

  const top15 = cities.slice(0, 15).map((c) => ({
    name: c.cityName,
    score: c.investmentScore,
    cityCode: c.cityCode,
  }));

  const navigate = (cityCode: number) =>
    router.push(`/${locale}/city-view?city=${cityCode}`);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{td("cityRankings")}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Mobile: compact ranked list */}
        <div className="flex flex-col gap-1 md:hidden">
          {top10.map((c) => (
            <button
              key={c.cityCode}
              onClick={() => navigate(c.cityCode)}
              className="flex items-center gap-2 w-full text-sm hover:bg-muted/50 rounded-lg px-2 py-1.5 transition-colors"
            >
              <span className="text-xs text-muted-foreground w-5 text-center shrink-0">
                {c.rank}
              </span>
              <span className="flex-1 text-start truncate font-medium">{c.name}</span>
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${c.score}%`, backgroundColor: getBarColor(c.score) }}
                  />
                </div>
                <ScoreBadge score={c.score} size="sm" />
              </div>
            </button>
          ))}
        </div>

        {/* Desktop: horizontal bar chart */}
        <div className="hidden md:block h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={top15}
              layout="vertical"
              margin={{ left: 10, right: 16, top: 4, bottom: 4 }}
              onClick={(state: Record<string, unknown> | null) => {
                const payload = (state as { activePayload?: { payload?: { cityCode?: number } }[] })?.activePayload?.[0]?.payload;
                if (payload?.cityCode) navigate(payload.cityCode);
              }}
              style={{ cursor: "pointer" }}
            >
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="name"
                width={70}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                formatter={(value) => [`${value}`, "ציון"]}
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
  );
}

export default function MarketCharts({ cities }: { cities: CityScoreRow[] }) {
  return <CityRankingsChart cities={cities} />;
}
