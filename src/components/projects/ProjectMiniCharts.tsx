"use client";

import { useTranslations } from "next-intl";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SCORE_COLORS: Record<string, string> = {
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

interface Props {
  inExec: number;
  planned: number;
  totalUnits: number;
  avgScore: number;
  districtData: { name: string; count: number; avgScore: number }[];
}

export default function ProjectMiniCharts({ inExec, planned, totalUnits, avgScore, districtData }: Props) {
  const t = useTranslations("projects");
  const ts = useTranslations("stats");

  const statusData = [
    { name: t("inExecution"), value: inExec, color: "#059669" },
    { name: t("planned"), value: planned, color: "#cbd5e1" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* Status distribution pie */}
      <Card>
        <CardHeader className="pb-1 pt-3 px-4">
          <CardTitle className="text-xs font-medium text-muted-foreground">
            {t("statusDistribution")}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="h-[100px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  innerRadius={25}
                  outerRadius={40}
                  strokeWidth={0}
                >
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-3 text-xs mt-1">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              {inExec}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-300" />
              {planned}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* District distribution bar */}
      <Card className="col-span-1 md:col-span-1">
        <CardHeader className="pb-1 pt-3 px-4">
          <CardTitle className="text-xs font-medium text-muted-foreground">
            {t("districtDistribution")}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={districtData.slice(0, 6)} layout="vertical" margin={{ left: 0, right: 5, top: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={50} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {districtData.slice(0, 6).map((d, i) => (
                    <Cell key={i} fill={getBarColor(d.avgScore)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Total additional units */}
      <Card>
        <CardHeader className="pb-1 pt-3 px-4">
          <CardTitle className="text-xs font-medium text-muted-foreground">
            {ts("additionalUnitsLabel")}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="text-2xl font-bold text-emerald-600">
            +{totalUnits.toLocaleString()}
          </div>
        </CardContent>
      </Card>

      {/* Average score */}
      <Card>
        <CardHeader className="pb-1 pt-3 px-4">
          <CardTitle className="text-xs font-medium text-muted-foreground">
            {t("avgScore")}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="text-2xl font-bold">{avgScore}</div>
        </CardContent>
      </Card>
    </div>
  );
}
