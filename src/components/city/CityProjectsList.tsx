"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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

export function CityProjectsList({
  renewalProjects,
  constructionSites,
  housingPlans,
  contaminatedSites,
}: Props) {
  const t = useTranslations("projects");

  const TAB_CONFIG: { key: Tab; labelKey: string; emoji: string }[] = [
    { key: "renewal", labelKey: "tabRenewal", emoji: "🏗️" },
    { key: "construction", labelKey: "tabConstruction", emoji: "🏢" },
    { key: "housing", labelKey: "tabHousing", emoji: "📋" },
    { key: "contaminated", labelKey: "tabContaminated", emoji: "⚠️" },
  ];

  const counts: Record<Tab, number> = {
    renewal: renewalProjects.length,
    construction: constructionSites.length,
    housing: housingPlans.length,
    contaminated: contaminatedSites.length,
  };

  // Default to first tab with data
  const firstWithData = TAB_CONFIG.find((tab) => counts[tab.key] > 0)?.key || "renewal";
  const [activeTab, setActiveTab] = useState<Tab>(firstWithData);

  const totalItems = Object.values(counts).reduce((a, b) => a + b, 0);
  if (totalItems === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground text-sm">
        {t("noProjectData")}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t("tabRenewal")}</CardTitle>
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
              {tab.emoji} {t(tab.labelKey)}
              {counts[tab.key] > 0 && (
                <span className="ms-1 text-xs text-muted-foreground">({counts[tab.key]})</span>
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
  const t = useTranslations("projects");
  if (items.length === 0) return <EmptyState />;
  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-start px-3 py-2 font-medium">{t("complexNeighborhood")}</th>
            <th className="text-end px-3 py-2 font-medium">{t("existingUnitsHeader")}</th>
            <th className="text-end px-3 py-2 font-medium">{t("additionalUnitsHeader")}</th>
            <th className="text-center px-3 py-2 font-medium">{t("statusHeader")}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} className="border-b last:border-0">
              <td className="px-3 py-2" style={{ direction: "rtl" }}>{item.complexName}</td>
              <td className="text-end px-3 py-2">{item.existingUnits.toLocaleString()}</td>
              <td className="text-end px-3 py-2 font-medium text-emerald-600">
                +{item.additionalUnits.toLocaleString()}
              </td>
              <td className="text-center px-3 py-2">
                {item.inExecution ? (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                    {t("inExecution")}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                    {t("planned")}
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
  const t = useTranslations("projects");
  if (items.length === 0) return <EmptyState />;
  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-start px-3 py-2 font-medium">{t("address")}</th>
            <th className="text-start px-3 py-2 font-medium">{t("buildType")}</th>
            <th className="text-start px-3 py-2 font-medium">{t("executor")}</th>
            <th className="text-center px-3 py-2 font-medium">{t("cranes")}</th>
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
  const t = useTranslations("projects");
  if (items.length === 0) return <EmptyState />;
  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-start px-3 py-2 font-medium">{t("planName")}</th>
            <th className="text-start px-3 py-2 font-medium">{t("planNumber")}</th>
            <th className="text-end px-3 py-2 font-medium">{t("potentialUnits")}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} className="border-b last:border-0">
              <td className="px-3 py-2" style={{ direction: "rtl" }}>{item.planName || "—"}</td>
              <td className="px-3 py-2">{item.planNumber || "—"}</td>
              <td className="text-end px-3 py-2 font-medium">
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
  const t = useTranslations("projects");
  if (items.length === 0) return <EmptyState />;
  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-start px-3 py-2 font-medium">{t("siteName")}</th>
            <th className="text-start px-3 py-2 font-medium">{t("address")}</th>
            <th className="text-center px-3 py-2 font-medium">{t("level")}</th>
            <th className="text-start px-3 py-2 font-medium">{t("source")}</th>
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
  const t = useTranslations("projects");
  return (
    <div className="text-center py-6 text-muted-foreground text-sm">
      {t("noCategoryData")}
    </div>
  );
}
