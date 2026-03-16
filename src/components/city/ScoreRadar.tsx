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
import type { ScoreBreakdown } from "@/types/city";

const LABELS: Record<string, string> = {
  development: "Development",
  demand: "Demand",
  price: "Price",
  infrastructure: "Infrastructure",
  municipal: "Municipal",
  environment: "Environment",
};

export function ScoreRadar({ breakdown }: { breakdown: ScoreBreakdown }) {
  const data = Object.entries(LABELS).map(([key, label]) => ({
    metric: label,
    score: breakdown[key as keyof ScoreBreakdown],
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
        <PolarGrid />
        <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
        <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
        <Tooltip formatter={(value) => [`${value}`, "Score"]} />
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
