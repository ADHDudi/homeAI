"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { NeighborhoodPricing as NeighborhoodPricingType } from "@/types/neighborhood";

interface Props {
  neighborhoods: NeighborhoodPricingType[];
}

export function NeighborhoodPricing({ neighborhoods }: Props) {
  const t = useTranslations("pricing");
  const [expanded, setExpanded] = useState<string | null>(null);

  if (neighborhoods.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground text-sm">
        {t("noData")}
      </div>
    );
  }

  const chartData = neighborhoods
    .filter((n) => n.avgPricePerMeter > 0)
    .slice(0, 15)
    .map((n) => ({
      name: n.neighborhood.length > 15 ? n.neighborhood.slice(0, 15) + "..." : n.neighborhood,
      fullName: n.neighborhood,
      price: Math.round(n.avgPricePerMeter),
    }));

  return (
    <div className="space-y-4">
      {/* Bar chart comparison */}
      {chartData.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("priceByNeighborhood")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 36)}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis
                  type="number"
                  tickFormatter={(v: number) => `₪${(v / 1000).toFixed(0)}K`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={80}
                  tick={{ fontSize: 11 }}
                  style={{ direction: "rtl" }}
                />
                <Tooltip
                  formatter={(value) => [`₪${Number(value).toLocaleString()}`, t("priceHeader")]}
                  labelFormatter={(label) => {
                    const item = chartData.find((d) => d.name === String(label));
                    return item?.fullName || String(label);
                  }}
                />
                <Bar dataKey="price" fill="#2563eb" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Neighborhood cards */}
      <div className="space-y-2">
        {neighborhoods.map((n) => (
          <Card key={n.neighborhood}>
            <button
              onClick={() => setExpanded(expanded === n.neighborhood ? null : n.neighborhood)}
              className="w-full text-start"
            >
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-sm" style={{ direction: "rtl" }}>
                      {n.neighborhood}
                    </CardTitle>
                    <span className="text-xs text-muted-foreground">
                      {t("projectCount", { count: n.projects.length })}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    {n.avgPricePerMeter > 0 && (
                      <span className="font-medium">
                        ₪{Math.round(n.avgPricePerMeter).toLocaleString()}/m²
                      </span>
                    )}
                    <span className="text-muted-foreground">
                      {t("units", { count: n.totalUnits })}
                    </span>
                    {n.avgSubscriberRatio !== null && (
                      <span className="text-muted-foreground">
                        {t("demand", { ratio: n.avgSubscriberRatio.toFixed(1) })}
                      </span>
                    )}
                    <span className="text-muted-foreground text-lg">
                      {expanded === n.neighborhood ? "−" : "+"}
                    </span>
                  </div>
                </div>
              </CardHeader>
            </button>

            {expanded === n.neighborhood && (
              <CardContent className="pt-0">
                <div className="border rounded-lg overflow-x-auto">
                  <table className="w-full text-sm min-w-[400px]">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-start px-3 py-2 font-medium whitespace-nowrap">{t("project")}</th>
                        <th className="text-end px-3 py-2 font-medium whitespace-nowrap">{t("priceHeader")}</th>
                        <th className="text-end px-3 py-2 font-medium whitespace-nowrap">{t("unitsHeader")}</th>
                        <th className="text-end px-3 py-2 font-medium whitespace-nowrap">{t("subsWin")}</th>
                        <th className="text-start px-3 py-2 font-medium whitespace-nowrap">{t("statusHeader")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {n.projects.map((p, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="px-3 py-2" style={{ direction: "rtl" }}>
                            {p.name || "—"}
                          </td>
                          <td className="text-end px-3 py-2 font-medium">
                            {p.pricePerMeter > 0 ? `₪${Math.round(p.pricePerMeter).toLocaleString()}` : "—"}
                          </td>
                          <td className="text-end px-3 py-2">{p.units || "—"}</td>
                          <td className="text-end px-3 py-2">
                            {p.winners > 0 ? `${(p.subscribers / p.winners).toFixed(1)}x` : "—"}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground" style={{ direction: "rtl" }}>
                            {p.status || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
