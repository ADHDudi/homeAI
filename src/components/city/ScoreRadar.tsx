"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useTranslations } from "next-intl";
import type { ScoreBreakdown } from "@/types/city";

const KEYS: (keyof Omit<ScoreBreakdown, "overall">)[] = [
  "development",
  "demand",
  "price",
  "infrastructure",
  "municipal",
  "environment",
];

export function ScoreRadar({ breakdown }: { breakdown: ScoreBreakdown }) {
  const t = useTranslations("scores");
  const tc = useTranslations("common");
  const data = KEYS.map((key) => ({
    metric: t(key),
    score: breakdown[key] ?? 0, // Use 0 for chart rendering when N/A
    isNA: breakdown[key] === null,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
        <PolarGrid />
        <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
        <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
        <Tooltip formatter={(value, _name, props) => {
          const entry = props?.payload;
          if (entry?.isNA) return [tc("na"), t("investmentScore")];
          return [`${value}`, t("investmentScore")];
        }} />
        <Radar
          dataKey="score"
          stroke="#2563eb"
          fill="#2563eb"
          fillOpacity={0.25}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
