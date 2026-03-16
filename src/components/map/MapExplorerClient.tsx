"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreBadge } from "@/components/shared/ScoreBadge";
import type { CityScoreRow } from "@/types/city";
import { DISTRICTS } from "@/config/datasets";

// Dynamically import map to avoid SSR issues with Leaflet
const CityMap = dynamic(
  () => import("@/components/map/CityMap").then((mod) => mod.CityMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[350px] md:h-[450px] lg:h-[600px] rounded-lg border bg-muted/30 flex items-center justify-center">
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    ),
  }
);

type MapLayer = "score" | "renewal" | "construction" | "price";

const LAYER_LABELS: Record<MapLayer, string> = {
  score: "Layer: Investment Score",
  renewal: "Layer: Urban Renewal",
  construction: "Layer: Construction",
  price: "Layer: Price / m²",
};

const MIN_SCORE_LABELS: Record<string, string> = {
  "0": "Min Score: Any",
  "45": "Min Score: 45+",
  "60": "Min Score: 60+",
  "75": "Min Score: 75+",
};

export function MapExplorerClient({ cities }: { cities: CityScoreRow[] }) {
  const [layer, setLayer] = useState<MapLayer>("score");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [minScore, setMinScore] = useState(0);

  const districts = useMemo(() => {
    return [...new Set(cities.map((c) => c.district))].filter(Boolean).sort();
  }, [cities]);

  const filtered = useMemo(() => {
    let result = cities;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) => c.cityName.includes(search) || c.cityName.toLowerCase().includes(q)
      );
    }

    if (districtFilter !== "all") {
      result = result.filter((c) => c.district === districtFilter);
    }

    if (minScore > 0) {
      result = result.filter((c) => c.investmentScore >= minScore);
    }

    return result;
  }, [cities, search, districtFilter, minScore]);

  // Stats for current view
  const avgScore = filtered.length > 0
    ? Math.round(filtered.reduce((s, c) => s + c.investmentScore, 0) / filtered.length)
    : 0;
  const totalRenewal = filtered.reduce((s, c) => s + c.urbanRenewalProjects, 0);
  const totalConstruction = filtered.reduce((s, c) => s + c.constructionSites, 0);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
        <Input
          placeholder="Search city / חיפוש עיר..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-xs"
        />
        <Select value={layer} onValueChange={(v) => v && setLayer(v as MapLayer)}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <span>{LAYER_LABELS[layer]}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="score">Layer: Investment Score</SelectItem>
            <SelectItem value="renewal">Layer: Urban Renewal</SelectItem>
            <SelectItem value="construction">Layer: Construction</SelectItem>
            <SelectItem value="price">Layer: Price / m²</SelectItem>
          </SelectContent>
        </Select>
        <Select value={districtFilter} onValueChange={(v) => v && setDistrictFilter(v)}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <span>{districtFilter === "all" ? "All Districts" : `${districtFilter}${DISTRICTS[districtFilter] ? ` (${DISTRICTS[districtFilter]})` : ""}`}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Districts</SelectItem>
            {districts.map((d) => (
              <SelectItem key={d} value={d}>
                {d} {DISTRICTS[d] ? `(${DISTRICTS[d]})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={String(minScore)}
          onValueChange={(v) => v && setMinScore(Number(v))}
        >
          <SelectTrigger className="w-full sm:w-[170px]">
            <span>{MIN_SCORE_LABELS[String(minScore)]}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Min Score: Any</SelectItem>
            <SelectItem value="45">Min Score: 45+</SelectItem>
            <SelectItem value="60">Min Score: 60+</SelectItem>
            <SelectItem value="75">Min Score: 75+</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Cities on Map
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-2xl font-bold">{filtered.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Avg Score
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-2xl font-bold">{avgScore}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Renewal Projects
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-2xl font-bold">{totalRenewal}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Construction Sites
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-2xl font-bold">{totalConstruction.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Map */}
      <CityMap cities={filtered} layer={layer} />

      {/* Top cities sidebar */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Top Opportunities on Map</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {filtered.slice(0, 9).map((city) => (
                <a
                  key={city.cityCode}
                  href={`/city-view?city=${city.cityCode}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 hover:shadow-sm transition-all duration-150"
                >
                  <div>
                    <div className="font-medium">{city.cityName}</div>
                    <div className="text-xs text-muted-foreground">
                      {city.district} · Pop {city.population.toLocaleString()}
                    </div>
                  </div>
                  <ScoreBadge score={city.investmentScore} />
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
