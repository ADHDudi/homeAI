"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { ScoreBadge } from "@/components/shared/ScoreBadge";
import type { CityScoreRow } from "@/types/city";
import { DISTRICTS } from "@/config/datasets";

type SortKey = "score" | "population" | "price" | "renewal" | "construction";
type SortDir = "asc" | "desc";

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const width = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${width}%` }} />
      </div>
      <span className="text-xs text-muted-foreground">{value}</span>
    </div>
  );
}

function SortIcon({ column, activeColumn, dir }: { column: SortKey; activeColumn: SortKey; dir: SortDir }) {
  if (column !== activeColumn) return <ArrowUpDown className="inline ml-1 h-3 w-3 text-muted-foreground/50" />;
  return dir === "desc"
    ? <ArrowDown className="inline ml-1 h-3 w-3 text-primary" />
    : <ArrowUp className="inline ml-1 h-3 w-3 text-primary" />;
}

export function TopCitiesTable({ cities, totalCount }: { cities: CityScoreRow[]; totalCount?: number }) {
  const [search, setSearch] = useState("");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortKey>("score");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = (col: SortKey) => {
    if (sortBy === col) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortBy(col);
      // Default direction: desc for most, asc for price
      setSortDir(col === "price" ? "asc" : "desc");
    }
  };

  const districts = useMemo(() => {
    const unique = [...new Set(cities.map((c) => c.district))].filter(Boolean).sort();
    return unique;
  }, [cities]);

  const filtered = useMemo(() => {
    let result = cities;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((c) =>
        c.cityName.includes(search) || c.cityName.toLowerCase().includes(q)
      );
    }

    if (districtFilter !== "all") {
      result = result.filter((c) => c.district === districtFilter);
    }

    const dir = sortDir === "desc" ? -1 : 1;
    result = [...result].sort((a, b) => {
      let diff = 0;
      if (sortBy === "score") diff = a.investmentScore - b.investmentScore;
      else if (sortBy === "population") diff = a.population - b.population;
      else if (sortBy === "price") {
        diff = (a.mechirLaMishtakenAvgPricePerMeter ?? Infinity) - (b.mechirLaMishtakenAvgPricePerMeter ?? Infinity);
      }
      else if (sortBy === "renewal") diff = a.urbanRenewalProjects - b.urbanRenewalProjects;
      else if (sortBy === "construction") diff = a.constructionSites - b.constructionSites;
      return diff * dir;
    });

    return result;
  }, [cities, search, districtFilter, sortBy, sortDir]);

  const maxRenewal = Math.max(...cities.map((c) => c.urbanRenewalProjects), 1);
  const maxConstruction = Math.max(...cities.map((c) => c.constructionSites), 1);
  const displayTotal = totalCount ?? cities.length;

  const thClass = "whitespace-nowrap cursor-pointer select-none hover:text-foreground transition-colors";

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3">
        <Input
          placeholder="Search city / חיפוש עיר..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-xs"
        />
        <Select value={districtFilter} onValueChange={(v) => v && setDistrictFilter(v)}>
          <SelectTrigger className="w-[200px]">
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
        <span className="text-xs text-muted-foreground ml-auto">
          Showing {Math.min(filtered.length, 50)} of {displayTotal} cities (min. 5,000 pop.)
        </span>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 whitespace-nowrap">#</TableHead>
              <TableHead className="whitespace-nowrap">City</TableHead>
              <TableHead className="hidden md:table-cell whitespace-nowrap">District</TableHead>
              <TableHead className={`text-right ${thClass}`} onClick={() => handleSort("score")}>
                Score<SortIcon column="score" activeColumn={sortBy} dir={sortDir} />
              </TableHead>
              <TableHead className={`text-right ${thClass}`} onClick={() => handleSort("population")}>
                Population<SortIcon column="population" activeColumn={sortBy} dir={sortDir} />
              </TableHead>
              <TableHead className={`text-right ${thClass}`} onClick={() => handleSort("price")}>
                Avg ₪/m²<SortIcon column="price" activeColumn={sortBy} dir={sortDir} />
              </TableHead>
              <TableHead className={`hidden md:table-cell ${thClass}`} onClick={() => handleSort("renewal")}>
                Renewal<SortIcon column="renewal" activeColumn={sortBy} dir={sortDir} />
              </TableHead>
              <TableHead className={`hidden md:table-cell ${thClass}`} onClick={() => handleSort("construction")}>
                Construction<SortIcon column="construction" activeColumn={sortBy} dir={sortDir} />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.slice(0, 50).map((city, i) => (
              <TableRow key={city.cityCode} className="hover:bg-muted/50">
                <TableCell className="text-muted-foreground text-xs">{i + 1}</TableCell>
                <TableCell>
                  <Link
                    href={`/city-view?city=${city.cityCode}`}
                    className="font-medium hover:underline text-primary"
                  >
                    {city.cityName}
                  </Link>
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                  {city.district}
                  {DISTRICTS[city.district] && (
                    <span className="text-xs ml-1">({DISTRICTS[city.district]})</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <ScoreBadge score={city.investmentScore} />
                </TableCell>
                <TableCell className="text-right text-sm">
                  {city.population.toLocaleString()}
                </TableCell>
                <TableCell className="text-right text-sm">
                  {city.mechirLaMishtakenAvgPricePerMeter
                    ? `₪${Math.round(city.mechirLaMishtakenAvgPricePerMeter).toLocaleString()}`
                    : "—"}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <MiniBar
                    value={city.urbanRenewalProjects}
                    max={maxRenewal}
                    color="bg-blue-500"
                  />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <MiniBar
                    value={city.constructionSites}
                    max={maxConstruction}
                    color="bg-emerald-500"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
