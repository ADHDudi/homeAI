"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import type { GreenBuilding, PointOfInterest } from "@/types/neighborhood";
import { escapeHtml } from "@/lib/utils/escapeHtml";

type LayerType = "greenBuildings" | "busStops" | "bankBranches";

interface NeighborhoodMapProps {
  center: { lat: number; lng: number };
  greenBuildings: GreenBuilding[];
  busStops: PointOfInterest[];
  bankBranches: PointOfInterest[];
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

const ICONS = {
  greenBuildings: createIcon("🌿", "#059669"),
  busStops: createIcon("🚌", "#2563eb"),
  bankBranches: createIcon("🏦", "#d97706"),
};

const LAYER_CONFIG: Record<LayerType, { label: string; emoji: string; color: string }> = {
  greenBuildings: { label: "Green Buildings", emoji: "🌿", color: "#059669" },
  busStops: { label: "Bus Stops", emoji: "🚌", color: "#2563eb" },
  bankBranches: { label: "Bank Branches", emoji: "🏦", color: "#d97706" },
};

export function NeighborhoodMap({
  center,
  greenBuildings,
  busStops,
  bankBranches,
}: NeighborhoodMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupsRef = useRef<Record<LayerType, L.MarkerClusterGroup | null>>({
    greenBuildings: null,
    busStops: null,
    bankBranches: null,
  });

  const [activeLayers, setActiveLayers] = useState<Record<LayerType, boolean>>({
    greenBuildings: true,
    busStops: true,
    bankBranches: true,
  });

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

    // Create cluster groups for each layer
    const createClusterGroup = (type: LayerType) => {
      const group = (L as unknown as { markerClusterGroup: (opts: Record<string, unknown>) => L.MarkerClusterGroup }).markerClusterGroup({
        maxClusterRadius: 40,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        disableClusteringAtZoom: 16,
      });
      group.addTo(map);
      return group;
    };

    layerGroupsRef.current.greenBuildings = createClusterGroup("greenBuildings");
    layerGroupsRef.current.busStops = createClusterGroup("busStops");
    layerGroupsRef.current.bankBranches = createClusterGroup("bankBranches");

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [center]);

  // Populate markers
  useEffect(() => {
    const groups = layerGroupsRef.current;
    if (!groups.greenBuildings || !groups.busStops || !groups.bankBranches) return;

    // Green buildings
    groups.greenBuildings.clearLayers();
    for (const gb of greenBuildings) {
      const marker = L.marker([gb.lat, gb.lng], { icon: ICONS.greenBuildings });
      marker.bindPopup(
        `<div style="direction:rtl;text-align:right;min-width:160px;">
          <strong>🌿 Green Building</strong><br/>
          ${escapeHtml(gb.street)} ${escapeHtml(gb.number)}<br/>
          ${gb.floors > 0 ? `${escapeHtml(gb.floors)} floors` : ""}
          ${gb.units > 0 ? ` · ${escapeHtml(gb.units)} units` : ""}
          ${gb.score > 0 ? `<br/>Score: ${escapeHtml(gb.score)}` : ""}
        </div>`
      );
      groups.greenBuildings.addLayer(marker);
    }

    // Bus stops
    groups.busStops.clearLayers();
    for (const bs of busStops) {
      const marker = L.marker([bs.lat, bs.lng], { icon: ICONS.busStops });
      marker.bindPopup(
        `<div style="direction:rtl;text-align:right;min-width:140px;">
          <strong>🚌 ${escapeHtml(bs.name)}</strong>
          ${bs.details ? `<br/>${escapeHtml(bs.details)}` : ""}
        </div>`
      );
      groups.busStops.addLayer(marker);
    }

    // Bank branches
    groups.bankBranches.clearLayers();
    for (const bb of bankBranches) {
      const marker = L.marker([bb.lat, bb.lng], { icon: ICONS.bankBranches });
      marker.bindPopup(
        `<div style="direction:rtl;text-align:right;min-width:160px;">
          <strong>🏦 ${escapeHtml(bb.name)}</strong>
          ${bb.details ? `<br/>${escapeHtml(bb.details)}` : ""}
        </div>`
      );
      groups.bankBranches.addLayer(marker);
    }
  }, [greenBuildings, busStops, bankBranches]);

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

  const totalPoints = greenBuildings.length + busStops.length + bankBranches.length;

  return (
    <div className="relative">
      <div ref={mapContainer} className="w-full h-[450px] rounded-lg border" />

      {/* Layer toggles / empty-state overlay */}
      {totalPoints > 0 ? (
        <div className="absolute top-3 right-3 bg-background/95 backdrop-blur border rounded-lg p-2 z-[1000] space-y-1">
          {(Object.keys(LAYER_CONFIG) as LayerType[]).map((key) => {
            const config = LAYER_CONFIG[key];
            const count =
              key === "greenBuildings" ? greenBuildings.length :
              key === "busStops" ? busStops.length :
              bankBranches.length;
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
          No geo-located markers available — map shows city location
        </div>
      )}
    </div>
  );
}
