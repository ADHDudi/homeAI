"use client";

import { useState, useMemo, useCallback, Fragment } from "react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { ChevronUp, ChevronDown, ExternalLink, X, MapPin, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScoreBadge } from "@/components/shared/ScoreBadge";
import { Link } from "@/i18n/routing";
import { DISTRICTS } from "@/config/datasets";
import type { EnrichedProjectRow } from "@/app/[locale]/projects/page";

const ProjectMiniCharts = dynamic(
  () => import("./ProjectMiniCharts"),
  {
    ssr: false,
    loading: () => (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-pulse">
        <div className="border rounded-lg p-4 h-[140px] bg-muted" />
        <div className="border rounded-lg p-4 h-[140px] bg-muted" />
        <div className="border rounded-lg p-4 h-[140px] bg-muted" />
        <div className="border rounded-lg p-4 h-[140px] bg-muted" />
      </div>
    ),
  }
);

type SortKey = "score" | "growth" | "additional" | "city" | "complex" | "status" | "existing" | "track";
type SortDir = "asc" | "desc";
type StatusFilter = "all" | "execution" | "planned";

function SortIcon({ column, activeColumn, dir }: { column: SortKey; activeColumn: SortKey; dir: SortDir }) {
  if (column !== activeColumn) return <ChevronDown className="inline w-3 h-3 opacity-30" />;
  return dir === "asc"
    ? <ChevronUp className="inline w-3 h-3" />
    : <ChevronDown className="inline w-3 h-3" />;
}

function GrowthBadge({ ratio }: { ratio: number }) {
  if (ratio === 0) return <span className="text-muted-foreground">—</span>;
  const color = ratio >= 2 ? "text-emerald-600" : ratio >= 1 ? "text-amber-600" : "text-red-600";
  return <span className={`font-medium ${color}`}>×{ratio}</span>;
}

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value || value === "—") return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function DetailLink({ label, url, icon }: { label: string; url: string; icon: React.ReactNode }) {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
      onClick={(e) => e.stopPropagation()}
    >
      {icon}
      {label}
      <ExternalLink className="w-3 h-3" />
    </a>
  );
}

function ProjectDetailPanel({ row, onClose }: { row: EnrichedProjectRow; onClose: () => void }) {
  const t = useTranslations("projects");
  return (
    <div className="px-4 py-4 md:px-6 md:py-5 space-y-4 border-t border-b border-border/50">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold">{row.complexName || "—"}</h3>
          <p className="text-sm text-muted-foreground">
            {row.cityName} · {row.district} {row.district && DISTRICTS[row.district] ? `(${DISTRICTS[row.district]})` : ""}
          </p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="p-1 rounded-md hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Detail grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-3">
        <DetailField label={t("scoreHeader")} value={<ScoreBadge score={row.investmentScore} size="sm" />} />
        <DetailField label={t("statusHeader")} value={
          row.inExecution
            ? <Badge className="bg-emerald-600 text-xs w-fit">{t("inExecution")}</Badge>
            : <Badge variant="secondary" className="text-xs w-fit">{t("planned")}</Badge>
        } />
        <DetailField label={t("trackHeader")} value={row.track || "—"} />
        <DetailField label={t("detail_status")} value={row.status || "—"} />
        <DetailField label={t("existingUnitsCol")} value={row.existingUnits.toLocaleString()} />
        <DetailField label={t("additionalUnitsCol")} value={`+${row.additionalUnits.toLocaleString()}`} />
        <DetailField label={t("growthRatioHeader")} value={<GrowthBadge ratio={row.unitGrowthRatio} />} />
        {row.proposedUnits > 0 && (
          <DetailField label={t("detail_proposedUnits")} value={row.proposedUnits.toLocaleString()} />
        )}
        {row.totalPermits && (
          <DetailField label={t("detail_totalPermits")} value={row.totalPermits} />
        )}
        {row.projectNumber && (
          <DetailField label={t("detail_projectNumber")} value={row.projectNumber} />
        )}
        {row.planNumber && (
          <DetailField label={t("detail_planNumber")} value={row.planNumber} />
        )}
        {row.authorizationDate && (
          <DetailField label={t("detail_authDate")} value={row.authorizationDate} />
        )}
        {row.validityYear && (
          <DetailField label={t("detail_validityYear")} value={row.validityYear} />
        )}
        <DetailField label={t("detail_population")} value={row.population.toLocaleString()} />
      </div>

      {/* Links */}
      {(row.mapLink || row.planLink) && (
        <div className="flex flex-wrap gap-4 pt-2 border-t border-border/50">
          <DetailLink label={t("detail_viewOnMap")} url={row.mapLink} icon={<MapPin className="w-4 h-4" />} />
          <DetailLink label={t("detail_viewPlan")} url={row.planLink} icon={<FileText className="w-4 h-4" />} />
        </div>
      )}
    </div>
  );
}

export function ProjectsTableClient({ rows }: { rows: EnrichedProjectRow[] }) {
  const t = useTranslations("projects");
  const td = useTranslations("dashboard");

  const [search, setSearch] = useState("");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortKey>("score");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleExpand = useCallback((index: number) => {
    setExpandedIndex((prev) => (prev === index ? null : index));
  }, []);

  const districts = useMemo(() => {
    return [...new Set(rows.map((r) => r.district))].filter(Boolean).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    let result = rows;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.cityName.includes(search) ||
          r.cityName.toLowerCase().includes(q) ||
          r.complexName.includes(search) ||
          r.complexName.toLowerCase().includes(q)
      );
    }

    if (districtFilter !== "all") {
      result = result.filter((r) => r.district === districtFilter);
    }

    if (statusFilter === "execution") {
      result = result.filter((r) => r.inExecution);
    } else if (statusFilter === "planned") {
      result = result.filter((r) => !r.inExecution);
    }

    const sorted = [...result];
    const dir = sortDir === "asc" ? 1 : -1;

    sorted.sort((a, b) => {
      switch (sortBy) {
        case "score": return (a.investmentScore - b.investmentScore) * dir;
        case "growth": return (a.unitGrowthRatio - b.unitGrowthRatio) * dir;
        case "additional": return (a.additionalUnits - b.additionalUnits) * dir;
        case "existing": return (a.existingUnits - b.existingUnits) * dir;
        case "city": return a.cityName.localeCompare(b.cityName, "he") * dir;
        case "complex": return a.complexName.localeCompare(b.complexName, "he") * dir;
        case "track": return a.track.localeCompare(b.track, "he") * dir;
        case "status": return ((a.inExecution ? 1 : 0) - (b.inExecution ? 1 : 0)) * dir;
        default: return 0;
      }
    });

    return sorted;
  }, [rows, search, districtFilter, statusFilter, sortBy, sortDir]);

  // Chart data
  const chartData = useMemo(() => {
    const inExec = filtered.filter((r) => r.inExecution).length;
    const planned = filtered.length - inExec;
    const totalUnits = filtered.reduce((s, r) => s + r.additionalUnits, 0);
    const avgScore = filtered.length > 0
      ? Math.round(filtered.reduce((s, r) => s + r.investmentScore, 0) / filtered.length)
      : 0;

    const districtCounts: Record<string, { count: number; totalScore: number }> = {};
    for (const r of filtered) {
      if (!r.district) continue;
      if (!districtCounts[r.district]) districtCounts[r.district] = { count: 0, totalScore: 0 };
      districtCounts[r.district].count++;
      districtCounts[r.district].totalScore += r.investmentScore;
    }
    const districtData = Object.entries(districtCounts)
      .map(([name, d]) => ({ name, count: d.count, avgScore: Math.round(d.totalScore / d.count) }))
      .sort((a, b) => b.count - a.count);

    return { inExec, planned, totalUnits, avgScore, districtData };
  }, [filtered]);

  function toggleSort(column: SortKey) {
    if (sortBy === column) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortDir(column === "city" || column === "complex" ? "asc" : "desc");
    }
  }

  const thClass = "cursor-pointer select-none hover:text-foreground transition-colors";

  return (
    <div className="space-y-4">
      {/* Filter controls */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
        <Input
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-xs"
        />
        <Select value={districtFilter} onValueChange={(v) => v && setDistrictFilter(v)}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <span>{districtFilter === "all" ? td("allDistricts") : `${districtFilter}${DISTRICTS[districtFilter] ? ` (${DISTRICTS[districtFilter]})` : ""}`}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{td("allDistricts")}</SelectItem>
            {districts.map((d) => (
              <SelectItem key={d} value={d}>
                {d} {DISTRICTS[d] ? `(${DISTRICTS[d]})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <span>{t(`statusFilter_${statusFilter}`)}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("statusFilter_all")}</SelectItem>
            <SelectItem value="execution">{t("statusFilter_execution")}</SelectItem>
            <SelectItem value="planned">{t("statusFilter_planned")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Mini charts */}
      <ProjectMiniCharts
        inExec={chartData.inExec}
        planned={chartData.planned}
        totalUnits={chartData.totalUnits}
        avgScore={chartData.avgScore}
        districtData={chartData.districtData}
      />

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {t("showing", { shown: filtered.length, total: rows.length })}
      </p>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className={thClass} onClick={() => toggleSort("complex")}>
              {t("complexNameHeader")} <SortIcon column="complex" activeColumn={sortBy} dir={sortDir} />
            </TableHead>
            <TableHead className={thClass} onClick={() => toggleSort("city")}>
              {t("cityHeader")} <SortIcon column="city" activeColumn={sortBy} dir={sortDir} />
            </TableHead>
            <TableHead className={thClass} onClick={() => toggleSort("score")}>
              {t("scoreHeader")} <SortIcon column="score" activeColumn={sortBy} dir={sortDir} />
            </TableHead>
            <TableHead className={`hidden md:table-cell ${thClass}`} onClick={() => toggleSort("existing")}>
              {t("existingUnitsCol")} <SortIcon column="existing" activeColumn={sortBy} dir={sortDir} />
            </TableHead>
            <TableHead className={thClass} onClick={() => toggleSort("additional")}>
              {t("additionalUnitsCol")} <SortIcon column="additional" activeColumn={sortBy} dir={sortDir} />
            </TableHead>
            <TableHead className={`hidden md:table-cell ${thClass}`} onClick={() => toggleSort("growth")}>
              {t("growthRatioHeader")} <SortIcon column="growth" activeColumn={sortBy} dir={sortDir} />
            </TableHead>
            <TableHead className={`hidden md:table-cell ${thClass}`} onClick={() => toggleSort("track")}>
              {t("trackHeader")} <SortIcon column="track" activeColumn={sortBy} dir={sortDir} />
            </TableHead>
            <TableHead className={thClass} onClick={() => toggleSort("status")}>
              {t("statusHeader")} <SortIcon column="status" activeColumn={sortBy} dir={sortDir} />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((row, i) => {
            const isExpanded = expandedIndex === i;
            return (
              <Fragment key={`${row.cityCode}-${row.complexName}-${i}`}>
                <TableRow
                  className={`cursor-pointer hover:bg-muted/50 ${isExpanded ? "bg-muted/30 border-b-0" : ""}`}
                  onClick={() => toggleExpand(i)}
                >
                  <TableCell className="font-medium max-w-[200px] truncate">
                    {row.complexName || "—"}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/city-view?city=${row.cityCode}`}
                      className="text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {row.cityName}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <ScoreBadge score={row.investmentScore} size="sm" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {row.existingUnits.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-emerald-600 font-medium">
                    +{row.additionalUnits.toLocaleString()}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <GrowthBadge ratio={row.unitGrowthRatio} />
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {row.track || "—"}
                  </TableCell>
                  <TableCell>
                    {row.inExecution ? (
                      <Badge className="bg-emerald-600 text-xs">{t("inExecution")}</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">{t("planned")}</Badge>
                    )}
                  </TableCell>
                </TableRow>
                {isExpanded && (
                  <TableRow className="bg-muted/20 hover:bg-muted/20">
                    <TableCell colSpan={8} className="p-0">
                      <ProjectDetailPanel row={row} onClose={() => setExpandedIndex(null)} />
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          {t("noResults")}
        </div>
      )}
    </div>
  );
}
