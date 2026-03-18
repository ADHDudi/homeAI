"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Info } from "lucide-react";

/**
 * Maps the short compare-page labels (e.g. "Development (25%)") to
 * the canonical sub-score key used for info popover lookup.
 */
export function resolveSubScoreKey(label: string): string | null {
  const KNOWN_KEYS = [
    "Development Momentum",
    "Demand Signal",
    "Price Attractiveness",
    "Infrastructure",
    "Municipal Health",
    "Environment",
  ];
  // Exact match
  if (KNOWN_KEYS.includes(label)) return label;
  // Strip weight suffix: "Development (25%)" → "Development"
  const stripped = label.replace(/\s*\(\d+%\)\s*$/, "").trim();
  if (KNOWN_KEYS.includes(stripped)) return stripped;
  // Partial match
  for (const key of KNOWN_KEYS) {
    if (key.toLowerCase().startsWith(stripped.toLowerCase())) return key;
  }
  return null;
}

/** Mapping from canonical key to translation namespace keys */
const SUB_SCORE_KEYS: Record<string, { descKey: string; metricKeys: string[] }> = {
  "Development Momentum": {
    descKey: "developmentDesc",
    metricKeys: ["developmentMetric1", "developmentMetric2", "developmentMetric3", "developmentMetric4"],
  },
  "Demand Signal": {
    descKey: "demandDesc",
    metricKeys: ["demandMetric1", "demandMetric2", "demandMetric3"],
  },
  "Price Attractiveness": {
    descKey: "priceDesc",
    metricKeys: ["priceMetric1", "priceMetric2", "priceMetric3"],
  },
  Infrastructure: {
    descKey: "infrastructureDesc",
    metricKeys: ["infrastructureMetric1", "infrastructureMetric2", "infrastructureMetric3"],
  },
  "Municipal Health": {
    descKey: "municipalDesc",
    metricKeys: ["municipalMetric1", "municipalMetric2", "municipalMetric3", "municipalMetric4"],
  },
  Environment: {
    descKey: "environmentDesc",
    metricKeys: ["environmentMetric1", "environmentMetric2"],
  },
};

/** Mapping from canonical key to translation key for the name */
const NAME_KEYS: Record<string, string> = {
  "Development Momentum": "development",
  "Demand Signal": "demand",
  "Price Attractiveness": "price",
  Infrastructure: "infrastructure",
  "Municipal Health": "municipal",
  Environment: "environment",
};

/**
 * Info icon that shows a popover with sub-score description and metrics.
 * Click to toggle; auto-closes when clicking outside.
 */
export function SubScoreInfoIcon({ label }: { label: string }) {
  const key = resolveSubScoreKey(label);
  const config = key ? SUB_SCORE_KEYS[key] : null;
  const t = useTranslations("scores");
  const tm = useTranslations("methodology");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (!config || !key) return null;

  const nameKey = NAME_KEYS[key];
  const name = nameKey ? t(nameKey) : key;

  return (
    <div className="relative inline-flex" ref={ref}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors duration-150 ms-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label={name}
      >
        <Info className="size-3.5" />
      </button>

      {open && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 sm:w-72 rounded-lg border bg-popover text-popover-foreground shadow-lg p-3 animate-in fade-in-0 zoom-in-95">
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-0 h-0 border-x-[6px] border-x-transparent border-t-[6px] border-t-border" />
          <p className="text-sm font-semibold mb-1">{name}</p>
          <p className="text-xs text-muted-foreground leading-relaxed mb-2">
            {tm(config.descKey)}
          </p>
          <div className="space-y-0.5">
            {config.metricKeys.map((mk) => (
              <p key={mk} className="text-xs text-muted-foreground flex items-start gap-1.5">
                <span className="shrink-0 mt-1 size-1 rounded-full bg-primary" />
                {tm(mk)}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
