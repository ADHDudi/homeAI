"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { CityScoreRow } from "@/types/city";
import { getCityCoordinates } from "@/data/cityCoordinates";
import { ScoreBadge } from "@/components/shared/ScoreBadge";

function getScoreColor(score: number): string {
  if (score >= 75) return "#059669";
  if (score >= 60) return "#2563eb";
  if (score >= 45) return "#d97706";
  return "#dc2626";
}

function getRadius(population: number): number {
  if (population > 200000) return 18;
  if (population > 100000) return 14;
  if (population > 50000) return 11;
  if (population > 20000) return 8;
  return 6;
}

interface CityMapProps {
  cities: CityScoreRow[];
  layer: "score" | "renewal" | "construction" | "price";
}

export function CityMap({ cities, layer }: CityMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const [selectedCity, setSelectedCity] = useState<CityScoreRow | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = L.map(mapContainer.current, {
      center: [31.5, 34.9],
      zoom: 8,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    markersRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers when cities or layer changes
  useEffect(() => {
    if (!mapRef.current || !markersRef.current) return;

    markersRef.current.clearLayers();

    for (const city of cities) {
      const coords = getCityCoordinates(city.cityName);
      if (!coords) continue;

      let value: number;
      let color: string;
      let label: string;

      switch (layer) {
        case "score":
          value = city.investmentScore;
          color = getScoreColor(value);
          label = `Score: ${value}`;
          break;
        case "renewal":
          value = city.urbanRenewalProjects;
          color = value > 10 ? "#059669" : value > 3 ? "#2563eb" : value > 0 ? "#d97706" : "#94a3b8";
          label = `Renewal: ${value} projects`;
          break;
        case "construction":
          value = city.constructionSites;
          color = value > 50 ? "#059669" : value > 20 ? "#2563eb" : value > 0 ? "#d97706" : "#94a3b8";
          label = `Construction: ${value} sites`;
          break;
        case "price":
          value = city.mechirLaMishtakenAvgPricePerMeter ?? 0;
          color = value === 0 ? "#94a3b8" : value < 15000 ? "#059669" : value < 25000 ? "#2563eb" : value < 35000 ? "#d97706" : "#dc2626";
          label = value > 0 ? `₪${Math.round(value).toLocaleString()}/m²` : "No data";
          break;
      }

      const radius = getRadius(city.population);

      const marker = L.circleMarker([coords.lat, coords.lng], {
        radius,
        fillColor: color,
        color: "#fff",
        weight: 2,
        opacity: 0.9,
        fillOpacity: 0.7,
      });

      marker.bindTooltip(
        `<div style="direction:rtl;text-align:right;">
          <strong>${city.cityName}</strong><br/>
          ${label}<br/>
          Pop: ${city.population.toLocaleString()}
        </div>`,
        { direction: "top", offset: [0, -radius] }
      );

      marker.on("click", () => setSelectedCity(city));
      marker.addTo(markersRef.current!);
    }
  }, [cities, layer]);

  return (
    <div className="relative">
      <div ref={mapContainer} className="w-full h-[350px] md:h-[450px] lg:h-[600px] rounded-lg border" />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur border rounded-lg p-3 text-xs z-[1000]">
        {layer === "score" && (
          <div className="space-y-1">
            <div className="font-medium mb-1">Investment Score</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#059669] inline-block" /> 75-100 Excellent</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#2563eb] inline-block" /> 60-74 Good</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#d97706] inline-block" /> 45-59 Fair</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#dc2626] inline-block" /> 0-44 Low</div>
          </div>
        )}
        {layer === "renewal" && (
          <div className="space-y-1">
            <div className="font-medium mb-1">Urban Renewal Projects</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#059669] inline-block" /> 10+ projects</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#2563eb] inline-block" /> 4-10 projects</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#d97706] inline-block" /> 1-3 projects</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#94a3b8] inline-block" /> None</div>
          </div>
        )}
        {layer === "construction" && (
          <div className="space-y-1">
            <div className="font-medium mb-1">Construction Sites</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#059669] inline-block" /> 50+ sites</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#2563eb] inline-block" /> 20-50 sites</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#d97706] inline-block" /> 1-19 sites</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#94a3b8] inline-block" /> None</div>
          </div>
        )}
        {layer === "price" && (
          <div className="space-y-1">
            <div className="font-medium mb-1">Avg Price / m²</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#059669] inline-block" /> Under ₪15K</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#2563eb] inline-block" /> ₪15K-25K</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#d97706] inline-block" /> ₪25K-35K</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#dc2626] inline-block" /> Over ₪35K</div>
          </div>
        )}
        <div className="mt-2 text-muted-foreground">Circle size = population</div>
      </div>

      {/* City info popup */}
      {selectedCity && (
        <div className="absolute bottom-2 left-2 right-2 sm:top-4 sm:right-4 sm:left-auto sm:bottom-auto bg-background/95 backdrop-blur border rounded-lg p-4 w-[calc(100vw-2rem)] sm:w-72 z-[1000]">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-lg">{selectedCity.cityName}</h3>
              <p className="text-sm text-muted-foreground">{selectedCity.district}</p>
            </div>
            <button
              onClick={() => setSelectedCity(null)}
              className="text-muted-foreground hover:text-foreground text-lg leading-none min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              x
            </button>
          </div>
          <div className="mt-3 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Score</span>
              <ScoreBadge score={selectedCity.investmentScore} />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Population</span>
              <span className="font-medium">{selectedCity.population.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Renewal Projects</span>
              <span className="font-medium">{selectedCity.urbanRenewalProjects}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Construction Sites</span>
              <span className="font-medium">{selectedCity.constructionSites}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Avg ₪/m²</span>
              <span className="font-medium">
                {selectedCity.mechirLaMishtakenAvgPricePerMeter
                  ? `₪${Math.round(selectedCity.mechirLaMishtakenAvgPricePerMeter).toLocaleString()}`
                  : "—"}
              </span>
            </div>
            <a
              href={`/city-view?city=${selectedCity.cityCode}`}
              className="block mt-2 text-center text-sm text-primary hover:underline font-medium"
            >
              View in City Tab →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
