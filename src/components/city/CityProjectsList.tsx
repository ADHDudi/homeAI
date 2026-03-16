"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  RenewalProject,
  ConstructionSite,
  HousingPlan,
  ContaminatedSite,
} from "@/types/neighborhood";

type Tab = "renewal" | "construction" | "housing" | "contaminated";

interface Props {
  renewalProjects: RenewalProject[];
  constructionSites: ConstructionSite[];
  housingPlans: HousingPlan[];
  contaminatedSites: ContaminatedSite[];
}

const TAB_CONFIG: { key: Tab; label: string; emoji: string }[] = [
  { key: "renewal", label: "Urban Renewal", emoji: "🏗️" },
  { key: "construction", label: "Construction", emoji: "🏢" },
  { key: "housing", label: "Housing Plans", emoji: "📋" },
  { key: "contaminated", label: "Contaminated", emoji: "⚠️" },
];

export function CityProjectsList({
  renewalProjects,
  constructionSites,
  housingPlans,
  contaminatedSites,
}: Props) {
  const counts: Record<Tab, number> = {
    renewal: renewalProjects.length,
    construction: constructionSites.length,
    housing: housingPlans.length,
    contaminated: contaminatedSites.length,
  };

  // Default to first tab with data
  const firstWithData = TAB_CONFIG.find((t) => counts[t.key] > 0)?.key || "renewal";
  const [activeTab, setActiveTab] = useState<Tab>(firstWithData);

  const totalItems = Object.values(counts).reduce((a, b) => a + b, 0);
  if (totalItems === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground text-sm">
        No project-level data available for this city.
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Projects & Sites</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Tab bar */}
        <div className="flex gap-1 mb-4 border-b">
          {TAB_CONFIG.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.emoji} {tab.label}
              {counts[tab.key] > 0 && (
                <span className="ml-1 text-xs text-muted-foreground">({counts[tab.key]})</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "renewal" && <RenewalTable items={renewalProjects} />}
        {activeTab === "construction" && <ConstructionTable items={constructionSites} />}
        {activeTab === "housing" && <HousingTable items={housingPlans} />}
        {activeTab === "contaminated" && <ContaminatedTable items={contaminatedSites} />}
      </CardContent>
    </Card>
  );
}

function RenewalTable({ items }: { items: RenewalProject[] }) {
  if (items.length === 0) return <EmptyState />;
  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left px-3 py-2 font-medium">Complex / Neighborhood</th>
            <th className="text-right px-3 py-2 font-medium">Existing Units</th>
            <th className="text-right px-3 py-2 font-medium">Additional Units</th>
            <th className="text-center px-3 py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} className="border-b last:border-0">
              <td className="px-3 py-2" style={{ direction: "rtl" }}>{item.complexName}</td>
              <td className="text-right px-3 py-2">{item.existingUnits.toLocaleString()}</td>
              <td className="text-right px-3 py-2 font-medium text-emerald-600">
                +{item.additionalUnits.toLocaleString()}
              </td>
              <td className="text-center px-3 py-2">
                {item.inExecution ? (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                    In Execution
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                    Planned
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ConstructionTable({ items }: { items: ConstructionSite[] }) {
  if (items.length === 0) return <EmptyState />;
  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left px-3 py-2 font-medium">Address</th>
            <th className="text-left px-3 py-2 font-medium">Build Type</th>
            <th className="text-left px-3 py-2 font-medium">Executor</th>
            <th className="text-center px-3 py-2 font-medium">Cranes</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} className="border-b last:border-0">
              <td className="px-3 py-2" style={{ direction: "rtl" }}>{item.address || "—"}</td>
              <td className="px-3 py-2" style={{ direction: "rtl" }}>{item.buildTypes || "—"}</td>
              <td className="px-3 py-2" style={{ direction: "rtl" }}>{item.executor || "—"}</td>
              <td className="text-center px-3 py-2">
                {item.hasCranes ? (
                  <span className="text-amber-500">🏗️</span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HousingTable({ items }: { items: HousingPlan[] }) {
  if (items.length === 0) return <EmptyState />;
  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left px-3 py-2 font-medium">Plan Name</th>
            <th className="text-left px-3 py-2 font-medium">Plan Number</th>
            <th className="text-right px-3 py-2 font-medium">Potential Units</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} className="border-b last:border-0">
              <td className="px-3 py-2" style={{ direction: "rtl" }}>{item.planName || "—"}</td>
              <td className="px-3 py-2">{item.planNumber || "—"}</td>
              <td className="text-right px-3 py-2 font-medium">
                {item.potentialUnits > 0 ? item.potentialUnits.toLocaleString() : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ContaminatedTable({ items }: { items: ContaminatedSite[] }) {
  if (items.length === 0) return <EmptyState />;
  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left px-3 py-2 font-medium">Site Name</th>
            <th className="text-left px-3 py-2 font-medium">Address</th>
            <th className="text-center px-3 py-2 font-medium">Level</th>
            <th className="text-left px-3 py-2 font-medium">Source</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} className="border-b last:border-0">
              <td className="px-3 py-2" style={{ direction: "rtl" }}>{item.name || "—"}</td>
              <td className="px-3 py-2" style={{ direction: "rtl" }}>{item.address || "—"}</td>
              <td className="text-center px-3 py-2">
                <ContaminationBadge level={item.level} />
              </td>
              <td className="px-3 py-2" style={{ direction: "rtl" }}>{item.source || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ContaminationBadge({ level }: { level: string }) {
  if (!level) return <span className="text-muted-foreground">—</span>;

  const isHigh = level.includes("גבוה") || level.includes("חמור");
  const isMedium = level.includes("בינוני");

  const colorClass = isHigh
    ? "bg-red-100 text-red-800"
    : isMedium
    ? "bg-amber-100 text-amber-800"
    : "bg-blue-100 text-blue-800";

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`} style={{ direction: "rtl" }}>
      {level}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-6 text-muted-foreground text-sm">
      No data available for this category.
    </div>
  );
}
