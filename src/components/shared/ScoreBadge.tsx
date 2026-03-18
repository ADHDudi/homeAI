"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/** Returns Tailwind color classes based on score tier. */
function getScoreColor(score: number) {
  if (score >= 75) return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (score >= 60) return "bg-blue-100 text-blue-800 border-blue-200";
  if (score >= 45) return "bg-amber-100 text-amber-800 border-amber-200";
  return "bg-red-100 text-red-800 border-red-200";
}

/** Returns the translation key for a score tier. */
function getScoreLabelKey(score: number): string {
  if (score >= 75) return "excellent";
  if (score >= 60) return "good";
  if (score >= 45) return "fair";
  return "low";
}

/**
 * Displays an investment score as a color-coded pill badge.
 * When score is null, displays "N/A" in a neutral grey style.
 *
 * @param props.score - Numeric score (0-100), or null for unavailable.
 * @param props.size - Badge size variant.
 * @param props.showLabel - Whether to display a text label alongside the number.
 */
export function ScoreBadge({
  score,
  size = "md",
  showLabel = false,
}: {
  score: number | null;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}) {
  const t = useTranslations("scores");
  const tc = useTranslations("common");

  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2 py-1",
    lg: "text-lg px-3 py-1.5 font-bold",
  };

  // N/A state for null scores
  if (score === null) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full border font-medium",
          "bg-gray-100 text-gray-500 border-gray-200",
          sizeClasses[size]
        )}
      >
        {tc("na")}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-medium",
        getScoreColor(score),
        sizeClasses[size]
      )}
    >
      {score}
      {showLabel && (
        <span className="text-[0.7em] opacity-75">{t(getScoreLabelKey(score))}</span>
      )}
    </span>
  );
}
