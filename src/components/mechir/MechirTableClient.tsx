"use client";

import { useState, useMemo, useCallback, Fragment } from "react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { ChevronUp, ChevronDown, X } from "lucide-react";
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
import { CompetitionBadge } from "@/components/mechir/CompetitionBadge";
import { Link } from "@/i18n/routing";
import { DISTRICTS } from "@/config/datasets";
import type { EnrichedMechirRow, CompetitionLevel } from "@/app/[locale]/mechir/page";

const MechirMiniCharts = dynamic(() => import("./MechirMiniCharts"), {
  ssr: false,
  loading: () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-pulse">
      <div className="border rounded-lg p-4 h-[140px] bg-muted" />
      <div className="border rounded-lg p-4 h-[140px] bg-muted" />
      <div className="border rounded-lg p-4 h-[140px] bg-muted" />
      <div className="border rounded-lg p-4 h-[140px] bg-muted" />
    </div>
  ),
});

type SortKey =
  | "project"
  | "city"
  | "price"
  | "units"
  | "competition"
  | "status"
  | "date";
type SortDir = "asc" | "desc";
type StatusFilter = "all" | "open" | "upcoming" | "completed";
type CompetitionFilter = "all" | "low" | "medium" | "high" | "veryHigh";

function SortIcon({
  column,
  activeColumn,
  dir,
}: {
  column: SortKey;
  activeColumn: SortKey;
  dir: SortDir;
}) {
  if (column !== activeColumn)
    return <ChevronDown className="inline w-3 h-3 opacity-30" />;
  return dir === "asc" ? (
    <ChevronUp className="inline w-3 h-3" />
  ) : (
    <ChevronDown className="inline w-3 h-3" />
  );
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("he-IL", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function MechirDetailPanel({
  row,
  onClose,
}: {
  row: EnrichedMechirRow;
  onClose: () => void;
}) {
  const t = useTranslations("mechir");
  return (
    <div className="px-4 py-4 md:px-6 md:py-5 space-y-4 border-t border-b border-border/50">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold">
            {row.projectName || "—"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {row.cityName}
            {row.neighborhood ? ` · ${row.neighborhood}` : ""}
            {row.district
              ? ` · ${row.district}${DISTRICTS[row.district] ? ` (${DISTRICTS[row.district]})` : ""}`
              : ""}
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="p-1 rounded-md hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Detail grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-3">
        <DetailField
          label={t("competitionHeader")}
          value={
            <CompetitionBadge
              ratio={row.competitionRatio}
              level={row.competitionLevel}
              showLabel
            />
          }
        />
        {row.cityCode > 0 && (
          <DetailField
            label={t("cityScore")}
            value={<ScoreBadge score={row.investmentScore} size="sm" />}
          />
        )}
        <DetailField
          label={t("pricePerMeterHeader")}
          value={
            row.pricePerMeter > 0
              ? `₪${row.pricePerMeter.toLocaleString()}`
              : "—"
          }
        />
        <DetailField
          label={t("unitsHeader")}
          value={row.lotteryHousingUnits.toLocaleString()}
        />
        {row.nativeHousingUnits > 0 && (
          <DetailField
            label={t("nativeUnits")}
            value={row.nativeHousingUnits.toLocaleString()}
          />
        )}
        <DetailField
          label={t("statusHeader")}
          value={row.lotteryStatusValue || row.projectStatus || "—"}
        />
        {row.projectStatus && row.lotteryStatusValue && (
          <DetailField label={t("projectType")} value={row.projectStatus} />
        )}
        <DetailField label={t("providerHeader")} value={row.providerName} />
        <DetailField label={t("eligibility")} value={row.eligibility} />
        <DetailField label={t("permit")} value={row.constructionPermitName} />
        <DetailField label={t("lotteryType")} value={row.lotteryType} />
        <DetailField
          label={t("centralizationType")}
          value={row.centralizationType}
        />
        {row.grantAmount > 0 && (
          <DetailField
            label={t("grantAmount")}
            value={`₪${row.grantAmount.toLocaleString()}`}
          />
        )}
        <DetailField
          label={t("signupDeadline")}
          value={formatDate(row.lotteryEndSignupDate)}
        />
        <DetailField
          label={t("lotteryDateHeader")}
          value={formatDate(row.lotteryExecutionDate)}
        />
      </div>

      {/* Series breakdown */}
      {(row.subscribersSeriesA > 0 ||
        row.subscribersSeriesB > 0 ||
        row.subscribersSeriesC > 0) && (
        <div className="pt-2 border-t border-border/50">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            {t("seriesBreakdown")}
          </p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center border rounded p-2">
              <div className="font-medium">{t("seriesA")}</div>
              <div>
                {t("subscribersLabel")}:{" "}
                {row.subscribersSeriesA.toLocaleString()}
              </div>
              <div>
                {t("winnersLabel")}: {row.winnersSeriesA.toLocaleString()}
              </div>
            </div>
            {row.subscribersSeriesB > 0 && (
              <div className="text-center border rounded p-2">
                <div className="font-medium">{t("seriesB")}</div>
                <div>
                  {t("subscribersLabel")}:{" "}
                  {row.subscribersSeriesB.toLocaleString()}
                </div>
                <div>
                  {t("winnersLabel")}: {row.winnersSeriesB.toLocaleString()}
                </div>
              </div>
            )}
            {row.subscribersSeriesC > 0 && (
              <div className="text-center border rounded p-2">
                <div className="font-medium">{t("seriesC")}</div>
                <div>
                  {t("subscribersLabel")}:{" "}
                  {row.subscribersSeriesC.toLocaleString()}
                </div>
                <div>
                  {t("winnersLabel")}: {row.winnersSeriesC.toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Special categories */}
      {(row.subscribersBneyMakom > 0 ||
        row.subscribersDisabled > 0 ||
        row.reservistSubscribers > 0 ||
        row.combatReservistSubscribers > 0) && (
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          {row.subscribersBneyMakom > 0 && (
            <span>
              {t("bneyMakom")}: {row.subscribersBneyMakom.toLocaleString()}
            </span>
          )}
          {row.subscribersDisabled > 0 && (
            <span>
              {t("disabled")}: {row.subscribersDisabled.toLocaleString()}
            </span>
          )}
          {row.reservistSubscribers > 0 && (
            <span>
              {t("reservists")}: {row.reservistSubscribers.toLocaleString()}
            </span>
          )}
          {row.combatReservistSubscribers > 0 && (
            <span>
              {t("combatReservists")}: {row.combatReservistSubscribers.toLocaleString()}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function DetailField({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  if (!value || value === "—" || value === "") return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

export function MechirTableClient({
  rows,
  openCount = 0,
}: {
  rows: EnrichedMechirRow[];
  openCount?: number;
}) {
  const t = useTranslations("mechir");
  const td = useTranslations("dashboard");

  const [search, setSearch] = useState("");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [competitionFilter, setCompetitionFilter] =
    useState<CompetitionFilter>("all");
  const [sortBy, setSortBy] = useState<SortKey>("competition");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [showActiveOnly, setShowActiveOnly] = useState(true);

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
          r.projectName.includes(search) ||
          r.projectName.toLowerCase().includes(q) ||
          r.cityName.includes(search) ||
          r.cityName.toLowerCase().includes(q) ||
          r.providerName.includes(search) ||
          r.providerName.toLowerCase().includes(q) ||
          r.neighborhood.includes(search) ||
          r.neighborhood.toLowerCase().includes(q)
      );
    }

    if (districtFilter !== "all") {
      result = result.filter((r) => r.district === districtFilter);
    }

    if (showActiveOnly) {
      result = result.filter((r) => r.isOpen || r.source === "arcgis");
    }

    if (statusFilter === "open") {
      result = result.filter((r) => r.isOpen);
    } else if (statusFilter === "upcoming") {
      result = result.filter((r) => r.source === "arcgis");
    } else if (statusFilter === "completed") {
      result = result.filter((r) => !r.isOpen && r.source !== "arcgis");
    }

    if (competitionFilter !== "all") {
      result = result.filter(
        (r) => r.competitionLevel === competitionFilter
      );
    }

    const sorted = [...result];
    const dir = sortDir === "asc" ? 1 : -1;

    sorted.sort((a, b) => {
      switch (sortBy) {
        case "competition":
          // Keep "na" at the end regardless of direction
          if (a.competitionLevel === "na" && b.competitionLevel !== "na")
            return 1;
          if (b.competitionLevel === "na" && a.competitionLevel !== "na")
            return -1;
          return (a.competitionRatio - b.competitionRatio) * dir;
        case "price":
          return (a.pricePerMeter - b.pricePerMeter) * dir;
        case "units":
          return (a.lotteryHousingUnits - b.lotteryHousingUnits) * dir;
        case "city":
          return a.cityName.localeCompare(b.cityName, "he") * dir;
        case "project":
          return a.projectName.localeCompare(b.projectName, "he") * dir;
        case "status":
          return a.lotteryStatusValue.localeCompare(
            b.lotteryStatusValue,
            "he"
          ) * dir;
        case "date":
          return a.lotteryExecutionDate.localeCompare(
            b.lotteryExecutionDate
          ) * dir;
        default:
          return 0;
      }
    });

    return sorted;
  }, [rows, search, districtFilter, statusFilter, competitionFilter, sortBy, sortDir, showActiveOnly]);

  // Chart data
  const chartData = useMemo(() => {
    // Status distribution
    const statusMap: Record<string, number> = {};
    for (const r of filtered) {
      const status = r.lotteryStatusValue || r.projectStatus || "Other";
      statusMap[status] = (statusMap[status] || 0) + 1;
    }
    const topStatuses = Object.entries(statusMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
    const statusColors = ["#059669", "#2563eb", "#d97706", "#cbd5e1"];
    const statusCounts = topStatuses.map(([name, value], i) => ({
      name,
      value,
      color: statusColors[i] || "#cbd5e1",
    }));

    const totalUnits = filtered.reduce(
      (s, r) => s + r.lotteryHousingUnits,
      0
    );
    const withPrice = filtered.filter((r) => r.pricePerMeter > 0);
    const avgPrice =
      withPrice.length > 0
        ? Math.round(
            withPrice.reduce((s, r) => s + r.pricePerMeter, 0) /
              withPrice.length
          )
        : 0;

    return { statusCounts, totalUnits, avgPrice };
  }, [filtered, t]);

  function toggleSort(column: SortKey) {
    if (sortBy === column) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortDir(
        column === "city" || column === "project" || column === "date"
          ? "asc"
          : "desc"
      );
    }
  }

  const thClass =
    "cursor-pointer select-none hover:text-foreground transition-colors";

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
        <Select
          value={districtFilter}
          onValueChange={(v) => v && setDistrictFilter(v)}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <span>
              {districtFilter === "all"
                ? td("allDistricts")
                : `${districtFilter}${DISTRICTS[districtFilter] ? ` (${DISTRICTS[districtFilter]})` : ""}`}
            </span>
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
        <Select
          value={statusFilter}
          onValueChange={(v) => v && setStatusFilter(v as StatusFilter)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <span>{t(`statusFilter_${statusFilter}`)}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("statusFilter_all")}</SelectItem>
            <SelectItem value="open">{t("statusFilter_open")}</SelectItem>
            <SelectItem value="upcoming">
              {t("statusFilter_upcoming")}
            </SelectItem>
            <SelectItem value="completed">
              {t("statusFilter_completed")}
            </SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={competitionFilter}
          onValueChange={(v) =>
            v && setCompetitionFilter(v as CompetitionFilter)
          }
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <span>{t(`competitionFilter_${competitionFilter}`)}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t("competitionFilter_all")}
            </SelectItem>
            <SelectItem value="low">
              {t("competitionFilter_low")}
            </SelectItem>
            <SelectItem value="medium">
              {t("competitionFilter_medium")}
            </SelectItem>
            <SelectItem value="high">
              {t("competitionFilter_high")}
            </SelectItem>
            <SelectItem value="veryHigh">
              {t("competitionFilter_veryHigh")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Active projects checkbox */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="activeOnly"
          checked={showActiveOnly}
          onChange={(e) => setShowActiveOnly(e.target.checked)}
          className="w-4 h-4 rounded border border-input cursor-pointer"
          suppressHydrationWarning
        />
        <label htmlFor="activeOnly" className="cursor-pointer text-sm font-medium">
          {t("activeProjectsOnly")}
        </label>
      </div>

      {/* Live lottery banner */}
      {openCount > 0 && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 p-3">
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
            {t("openBanner", { count: openCount })}
            {" · "}
            <a
              href="https://dira.moch.gov.il"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:no-underline"
            >
              {t("registerAt")}
            </a>
          </p>
        </div>
      )}

      {/* Mini charts */}
      <MechirMiniCharts
        statusCounts={chartData.statusCounts}
        totalUnits={chartData.totalUnits}
        avgPrice={chartData.avgPrice}
      />

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {t("showing", { shown: filtered.length, total: rows.length })}
      </p>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              className={thClass}
              onClick={() => toggleSort("project")}
            >
              {t("projectNameHeader")}{" "}
              <SortIcon
                column="project"
                activeColumn={sortBy}
                dir={sortDir}
              />
            </TableHead>
            <TableHead
              className={thClass}
              onClick={() => toggleSort("city")}
            >
              {t("cityHeader")}{" "}
              <SortIcon column="city" activeColumn={sortBy} dir={sortDir} />
            </TableHead>
            <TableHead className="hidden md:table-cell">
              {t("neighborhoodHeader")}
            </TableHead>
            <TableHead
              className={thClass}
              onClick={() => toggleSort("price")}
            >
              {t("pricePerMeterHeader")}{" "}
              <SortIcon
                column="price"
                activeColumn={sortBy}
                dir={sortDir}
              />
            </TableHead>
            <TableHead
              className={`hidden md:table-cell ${thClass}`}
              onClick={() => toggleSort("units")}
            >
              {t("unitsHeader")}{" "}
              <SortIcon
                column="units"
                activeColumn={sortBy}
                dir={sortDir}
              />
            </TableHead>
            <TableHead
              className={thClass}
              onClick={() => toggleSort("competition")}
            >
              {t("competitionHeader")}{" "}
              <SortIcon
                column="competition"
                activeColumn={sortBy}
                dir={sortDir}
              />
            </TableHead>
            <TableHead
              className={thClass}
              onClick={() => toggleSort("status")}
            >
              {t("statusHeader")}{" "}
              <SortIcon
                column="status"
                activeColumn={sortBy}
                dir={sortDir}
              />
            </TableHead>
            <TableHead
              className={`hidden md:table-cell ${thClass}`}
              onClick={() => toggleSort("date")}
            >
              {t("lotteryDateHeader")}{" "}
              <SortIcon column="date" activeColumn={sortBy} dir={sortDir} />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((row, i) => {
            const isExpanded = expandedIndex === i;
            return (
              <Fragment key={`${row.lotteryId}-${row.projectId}-${i}`}>
                <TableRow
                  className={`cursor-pointer hover:bg-muted/50 ${isExpanded ? "bg-muted/30 border-b-0" : ""} ${row.isOpen ? "border-l-2 border-l-emerald-500" : row.source === "arcgis" ? "border-l-2 border-l-blue-500" : ""}`}
                  onClick={() => toggleExpand(i)}
                >
                  <TableCell className="font-medium max-w-[200px] truncate">
                    {row.projectName || "—"}
                  </TableCell>
                  <TableCell>
                    {row.cityCode > 0 ? (
                      <Link
                        href={`/city-view?city=${row.cityCode}`}
                        className="text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {row.cityName}
                      </Link>
                    ) : (
                      <span>{row.cityName}</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {row.neighborhood || "—"}
                  </TableCell>
                  <TableCell>
                    {row.pricePerMeter > 0
                      ? `₪${row.pricePerMeter.toLocaleString()}`
                      : "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {row.lotteryHousingUnits.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <CompetitionBadge
                      ratio={row.competitionRatio}
                      level={row.competitionLevel}
                    />
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={row.isOpen ? "default" : row.source === "arcgis" ? "outline" : "secondary"}
                      className={`text-xs max-w-[120px] truncate ${row.isOpen ? "bg-emerald-600 hover:bg-emerald-600" : row.source === "arcgis" ? "border-blue-500 text-blue-600 dark:text-blue-400" : ""}`}
                    >
                      {row.lotteryStatusValue || row.projectStatus || "—"}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {formatDate(row.lotteryExecutionDate)}
                  </TableCell>
                </TableRow>
                {isExpanded && (
                  <TableRow className="bg-muted/20 hover:bg-muted/20">
                    <TableCell colSpan={8} className="p-0">
                      <MechirDetailPanel
                        row={row}
                        onClose={() => setExpandedIndex(null)}
                      />
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
