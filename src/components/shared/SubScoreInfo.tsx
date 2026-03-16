"use client";

import { useState, useRef, useEffect } from "react";
import { Info } from "lucide-react";

/** Sub-score metadata keyed by the short label used in score breakdowns. */
export const SUB_SCORE_INFO: Record<
  string,
  { name: string; description: string; metrics: string[] }
> = {
  "Development Momentum": {
    name: "Development Momentum",
    description:
      "Measures active construction and urban renewal activity — cities with more building momentum tend to appreciate faster.",
    metrics: [
      "Urban renewal projects per capita",
      "Housing units from renewal programs",
      "Active construction sites",
      "Housing pipeline (inventory units)",
    ],
  },
  "Demand Signal": {
    name: "Demand Signal",
    description:
      "Indicates market demand for housing in the city — high subscriber-to-winner ratios signal unmet demand.",
    metrics: [
      "Subscriber-to-winner ratio (Mechir LaMishtaken)",
      "Young adult ratio (ages 20-34)",
      "Population size",
    ],
  },
  "Price Attractiveness": {
    name: "Price Attractiveness",
    description:
      "Lower prices relative to national and district medians score higher — identifies undervalued markets with upside potential.",
    metrics: ["Avg price per m² (inverted — lower is better)"],
  },
  Infrastructure: {
    name: "Infrastructure",
    description:
      "Quality of transit, financial services, and sustainable building — signals a city's livability and growth readiness.",
    metrics: [
      "Bus stops per capita",
      "Bank branches per capita",
      "Green building certifications",
    ],
  },
  "Municipal Health": {
    name: "Municipal Health",
    description:
      "Financial health based on budget balance, debt levels, and fiscal capacity — sourced from Ministry of Interior municipal finance reports.",
    metrics: [
      "Budget surplus/deficit ratio (40%)",
      "Debt-to-income ratio — inverted (30%)",
      "Per-capita municipal income (30%)",
    ],
  },
  Environment: {
    name: "Environment",
    description:
      "Environmental risk assessment — fewer contaminated sites and more remediation indicate lower investment risk.",
    metrics: ["Contaminated sites count", "Remediation progress"],
  },
};

/**
 * Maps the short compare-page labels (e.g. "Development (25%)") to
 * the canonical SUB_SCORE_INFO keys.
 */
export function resolveSubScoreKey(label: string): string | null {
  // Exact match
  if (SUB_SCORE_INFO[label]) return label;
  // Strip weight suffix: "Development (25%)" → "Development"
  const stripped = label.replace(/\s*\(\d+%\)\s*$/, "").trim();
  if (SUB_SCORE_INFO[stripped]) return stripped;
  // Partial match
  for (const key of Object.keys(SUB_SCORE_INFO)) {
    if (key.toLowerCase().startsWith(stripped.toLowerCase())) return key;
  }
  return null;
}

/**
 * Info icon that shows a popover with sub-score description and metrics.
 * Click to toggle; auto-closes when clicking outside.
 */
export function SubScoreInfoIcon({ label }: { label: string }) {
  const key = resolveSubScoreKey(label);
  const info = key ? SUB_SCORE_INFO[key] : null;
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

  if (!info) return null;

  return (
    <div className="relative inline-flex" ref={ref}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors duration-150 ml-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label={`Info about ${info.name}`}
      >
        <Info className="size-3.5" />
      </button>

      {open && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 sm:w-72 rounded-lg border bg-popover text-popover-foreground shadow-lg p-3 animate-in fade-in-0 zoom-in-95">
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-0 h-0 border-x-[6px] border-x-transparent border-t-[6px] border-t-border" />
          <p className="text-sm font-semibold mb-1">{info.name}</p>
          <p className="text-xs text-muted-foreground leading-relaxed mb-2">
            {info.description}
          </p>
          <div className="space-y-0.5">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Metrics
            </p>
            {info.metrics.map((m) => (
              <p key={m} className="text-xs text-muted-foreground flex items-start gap-1.5">
                <span className="shrink-0 mt-1 size-1 rounded-full bg-primary" />
                {m}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
