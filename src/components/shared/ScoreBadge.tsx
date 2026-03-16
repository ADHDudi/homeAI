"use client";

import { cn } from "@/lib/utils";

/** Returns Tailwind color classes based on score tier. */
function getScoreColor(score: number) {
  if (score >= 75) return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (score >= 60) return "bg-blue-100 text-blue-800 border-blue-200";
  if (score >= 45) return "bg-amber-100 text-amber-800 border-amber-200";
  return "bg-red-100 text-red-800 border-red-200";
}

/** Returns a human-readable label for a score tier. */
function getScoreLabel(score: number) {
  if (score >= 75) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 45) return "Fair";
  return "Low";
}

/**
 * Displays an investment score as a color-coded pill badge.
 *
 * @param props.score - Numeric score (0-100).
 * @param props.size - Badge size variant.
 * @param props.showLabel - Whether to display a text label (e.g. "Excellent") alongside the number.
 */
export function ScoreBadge({
  score,
  size = "md",
  showLabel = false,
}: {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}) {
  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2 py-1",
    lg: "text-lg px-3 py-1.5 font-bold",
  };

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
        <span className="text-[0.7em] opacity-75">{getScoreLabel(score)}</span>
      )}
    </span>
  );
}
