"use client";

import { useTranslations } from "next-intl";
import {
  PieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  statusCounts: { name: string; value: number; color: string }[];
  totalUnits: number;
  avgPrice: number;
}

export default function MechirMiniCharts({
  statusCounts,
  totalUnits,
  avgPrice,
}: Props) {
  const t = useTranslations("mechir");

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
                  data={statusCounts}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  innerRadius={25}
                  outerRadius={40}
                  strokeWidth={0}
                >
                  {statusCounts.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-2 text-[10px] mt-1">
            {statusCounts.map((s) => (
              <span key={s.name} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                {s.value}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Total lottery units */}
      <Card>
        <CardHeader className="pb-1 pt-3 px-4">
          <CardTitle className="text-xs font-medium text-muted-foreground">
            {t("totalUnits")}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="text-2xl font-bold text-primary">
            {totalUnits.toLocaleString()}
          </div>
        </CardContent>
      </Card>

      {/* Average price */}
      <Card>
        <CardHeader className="pb-1 pt-3 px-4">
          <CardTitle className="text-xs font-medium text-muted-foreground">
            {t("avgPrice")}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="text-2xl font-bold">
            {avgPrice > 0 ? `₪${avgPrice.toLocaleString()}` : "—"}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
