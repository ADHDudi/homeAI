"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import type { GreenBuilding, PointOfInterest, ConstructionSite, RenewalProject } from "@/types/neighborhood";
import { escapeHtml } from "@/lib/utils/escapeHtml";

type LayerType = "greenBuildings" | "busStops" | "bankBranches" | "constructionSites" | "renewalProjects";

interface NeighborhoodMapProps {
  center: { lat: number; lng: number };
  greenBuildings: GreenBuilding[];
  busStops: PointOfInterest[];
  bankBranches: PointOfInterest[];
  constructionSites: ConstructionSite[];
  renewalProjects: RenewalProject[];
}

function createIcon(emoji: string, bgColor: string): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="
      background:${bgColor};
      width:28px;height:28px;
      border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-size:14px;
      border:2px solid white;
      box-shadow:0 1px 4px rgba(0,0,0,0.3);
    ">${emoji}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

const ICONS: Record<LayerType, L.DivIcon> = {
  greenBuildings: createIcon("🌿", "#059669"),
  busStops: createIcon("🚌", "#2563eb"),
  bankBranches: createIcon("🏦", "#d97706"),
  constructionSites: createIcon("🏗️", "#dc2626"),
  renewalProjects: createIcon("🔄", "#7c3aed"),
};

export function NeighborhoodMap({
  center,
  greenBuildings,
  busStops,
  bankBranches,
  constructionSites,
  renewalProjects,
}: NeighborhoodMapProps) {
  const t = useTranslations("map");
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupsRef = useRef<Record<LayerType, L.MarkerClusterGroup | null>>({
    greenBuildings: null,
    busStops: null,
    bankBranches: null,
    constructionSites: null,
    renewalProjects: null,
  });

  const [activeLayers, setActiveLayers] = useState<Record<LayerType, boolean>>({
    greenBuildings: true,
    busStops: true,
    bankBranches: true,
    constructionSites: true,
    renewalProjects: true,
  });

  // Translated layer config
  const layerConfig: Record<LayerType, { label: string; emoji: string; color: string }> = useMemo(() => ({
    greenBuildings: { label: t("greenBuildings"), emoji: "🌿", color: "#059669" },
    busStops: { label: t("busStops"), emoji: "🚌", color: "#2563eb" },
    bankBranches: { label: t("bankBranches"), emoji: "🏦", color: "#d97706" },
    constructionSites: { label: t("construction"), emoji: "🏗️", color: "#dc2626" },
    renewalProjects: { label: t("urbanRenewal"), emoji: "🔄", color: "#7c3aed" },
  }), [t]);

  // Pre-translate popup strings for use in raw HTML
  const popupStrings = useMemo(() => ({
    greenBuilding: t("popupGreenBuilding"),
    constructionSite: t("popupConstructionSite"),
    activeCranes: t("popupActiveCranes"),
    urbanRenewal: t("popupUrbanRenewal"),
    inExecution: t("popupInExecution"),
    planned: t("popupPlanned"),
    viewGovMap: t("popupViewGovMap"),
  }), [t]);

  // Filter to only geocoded items
  const geoConstructionSites = useMemo(
    () => constructionSites.filter((s) => s.lat != null && s.lng != null),
    [constructionSites],
  );

  // Place renewal projects at city center with slight offset so they fan out
  const renewalWithCoords = useMemo(
    () => renewalProjects.map((p, i) => ({
      ...p,
      lat: center.lat + (Math.sin(i * 2.39996) * 0.002),
      lng: center.lng + (Math.cos(i * 2.39996) * 0.002),
    })),
    [renewalProjects, center.lat, center.lng],
  );

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = L.map(mapContainer.current, {
      center: [center.lat, center.lng],
      zoom: 13,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    const createClusterGroup = () => {
      const group = (L as unknown as { markerClusterGroup: (opts: Record<string, unknown>) => L.MarkerClusterGroup }).markerClusterGroup({
        maxClusterRadius: 40,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        disableClusteringAtZoom: 16,
      });
      group.addTo(map);
      return group;
    };

    layerGroupsRef.current.greenBuildings = createClusterGroup();
    layerGroupsRef.current.busStops = createClusterGroup();
    layerGroupsRef.current.bankBranches = createClusterGroup();
    layerGroupsRef.current.constructionSites = createClusterGroup();
    layerGroupsRef.current.renewalProjects = createClusterGroup();

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [center]);

  // Populate markers
  useEffect(() => {
    const groups = layerGroupsRef.current;
    if (!groups.greenBuildings) return;

    // Green buildings
    groups.greenBuildings!.clearLayers();
    for (const gb of greenBuildings) {
      const marker = L.marker([gb.lat, gb.lng], { icon: ICONS.greenBuildings });
      marker.bindPopup(
        `<div style="direction:rtl;text-align:right;min-width:160px;">
          <strong>🌿 ${escapeHtml(popupStrings.greenBuilding)}</strong><br/>
          ${escapeHtml(gb.street)} ${escapeHtml(gb.number)}<br/>
          ${gb.floors > 0 ? `${gb.floors} ${escapeHtml(t("popupFloors", { count: gb.floors }))}` : ""}
          ${gb.units > 0 ? ` · ${gb.units} ${escapeHtml(t("popupUnits", { count: gb.units }))}` : ""}
          ${gb.score > 0 ? `<br/>${escapeHtml(t("popupScore", { score: gb.score }))}` : ""}
        </div>`
      );
      groups.greenBuildings!.addLayer(marker);
    }

    // Bus stops
    groups.busStops!.clearLayers();
    for (const bs of busStops) {
      const marker = L.marker([bs.lat, bs.lng], { icon: ICONS.busStops });
      marker.bindPopup(
        `<div style="direction:rtl;text-align:right;min-width:140px;">
          <strong>🚌 ${escapeHtml(bs.name)}</strong>
          ${bs.details ? `<br/>${escapeHtml(bs.details)}` : ""}
        </div>`
      );
      groups.busStops!.addLayer(marker);
    }

    // Bank branches
    groups.bankBranches!.clearLayers();
    for (const bb of bankBranches) {
      const marker = L.marker([bb.lat, bb.lng], { icon: ICONS.bankBranches });
      marker.bindPopup(
        `<div style="direction:rtl;text-align:right;min-width:160px;">
          <strong>🏦 ${escapeHtml(bb.name)}</strong>
          ${bb.details ? `<br/>${escapeHtml(bb.details)}` : ""}
        </div>`
      );
      groups.bankBranches!.addLayer(marker);
    }

    // Construction sites (geocoded only)
    groups.constructionSites!.clearLayers();
    for (const cs of geoConstructionSites) {
      const marker = L.marker([cs.lat!, cs.lng!], { icon: ICONS.constructionSites });
      marker.bindPopup(
        `<div style="direction:rtl;text-align:right;min-width:180px;">
          <strong>🏗️ ${escapeHtml(popupStrings.constructionSite)}</strong><br/>
          ${escapeHtml(cs.address)}<br/>
          ${cs.buildTypes ? `${escapeHtml(t("popupType", { type: cs.buildTypes }))}<br/>` : ""}
          ${cs.executor ? `${escapeHtml(t("popupExecutor", { name: cs.executor }))}<br/>` : ""}
          ${cs.hasCranes ? `<span style="color:#dc2626;">● ${escapeHtml(popupStrings.activeCranes)}</span>` : ""}
        </div>`
      );
      groups.constructionSites!.addLayer(marker);
    }

    // Renewal projects (placed at city center area)
    groups.renewalProjects!.clearLayers();
    for (const rp of renewalWithCoords) {
      const marker = L.marker([rp.lat, rp.lng], { icon: ICONS.renewalProjects });
      const mapLinkHtml = rp.mapLink
        ? `<br/><a href="${escapeHtml(rp.mapLink)}" target="_blank" rel="noopener" style="color:#7c3aed;">${escapeHtml(popupStrings.viewGovMap)}</a>`
        : "";
      marker.bindPopup(
        `<div style="direction:rtl;text-align:right;min-width:200px;">
          <strong>🔄 ${escapeHtml(popupStrings.urbanRenewal)}</strong><br/>
          ${escapeHtml(rp.complexName)}<br/>
          ${escapeHtml(t("popupExisting", { existing: rp.existingUnits, additional: rp.additionalUnits }))}<br/>
          ${rp.inExecution
            ? `<span style="color:#059669;">● ${escapeHtml(popupStrings.inExecution)}</span>`
            : `<span style="color:#d97706;">○ ${escapeHtml(popupStrings.planned)}</span>`}
          ${rp.status ? `<br/>${escapeHtml(t("popupStatus", { status: rp.status }))}` : ""}
          ${mapLinkHtml}
        </div>`
      );
      groups.renewalProjects!.addLayer(marker);
    }
  }, [greenBuildings, busStops, bankBranches, geoConstructionSites, renewalWithCoords, popupStrings, t]);

  // Toggle layer visibility
  useEffect(() => {
    const map = mapRef.current;
    const groups = layerGroupsRef.current;
    if (!map) return;

    for (const key of Object.keys(activeLayers) as LayerType[]) {
      const group = groups[key];
      if (!group) continue;
      if (activeLayers[key] && !map.hasLayer(group)) {
        map.addLayer(group);
      } else if (!activeLayers[key] && map.hasLayer(group)) {
        map.removeLayer(group);
      }
    }
  }, [activeLayers]);

  const toggleLayer = (layer: LayerType) => {
    setActiveLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  const getLayerCount = (key: LayerType): number => {
    switch (key) {
      case "greenBuildings": return greenBuildings.length;
      case "busStops": return busStops.length;
      case "bankBranches": return bankBranches.length;
      case "constructionSites": return geoConstructionSites.length;
      case "renewalProjects": return renewalProjects.length;
    }
  };

  const totalPoints =
    greenBuildings.length + busStops.length + bankBranches.length +
    geoConstructionSites.length + renewalProjects.length;

  return (
    <div className="relative">
      <div ref={mapContainer} className="w-full h-[450px] rounded-lg border" />

      {/* Layer toggles / empty-state overlay */}
      {totalPoints > 0 ? (
        <div className="absolute top-3 end-3 bg-background/95 backdrop-blur border rounded-lg p-2 z-[1000] space-y-1">
          {(Object.keys(layerConfig) as LayerType[]).map((key) => {
            const config = layerConfig[key];
            const count = getLayerCount(key);
            if (count === 0) return null;

            return (
              <label
                key={key}
                className="flex items-center gap-2 cursor-pointer text-xs px-1 py-0.5"
              >
                <input
                  type="checkbox"
                  checked={activeLayers[key]}
                  onChange={() => toggleLayer(key)}
                  className="rounded"
                />
                <span>{config.emoji}</span>
                <span>{config.label}</span>
                <span className="text-muted-foreground">({count})</span>
              </label>
            );
          })}
        </div>
      ) : (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/90 backdrop-blur border rounded-lg px-4 py-2 z-[1000] text-xs text-muted-foreground">
          {t("noMarkers")}
        </div>
      )}
    </div>
  );
}
