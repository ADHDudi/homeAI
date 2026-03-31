import type { CompetitionLevel } from "@/app/[locale]/mechir/page";
import { useTranslations } from "next-intl";

const LEVEL_STYLES: Record<CompetitionLevel, string> = {
  low: "text-emerald-600",
  medium: "text-blue-600",
  high: "text-amber-600",
  veryHigh: "text-red-600",
  na: "text-muted-foreground",
};

const LEVEL_KEYS: Record<CompetitionLevel, string> = {
  low: "competitionLow",
  medium: "competitionMedium",
  high: "competitionHigh",
  veryHigh: "competitionVeryHigh",
  na: "competitionNA",
};

export function CompetitionBadge({
  ratio,
  level,
  showLabel = false,
}: {
  ratio: number;
  level: CompetitionLevel;
  showLabel?: boolean;
}) {
  const t = useTranslations("mechir");

  if (level === "na") {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <span className={`font-medium ${LEVEL_STYLES[level]}`}>
      {ratio.toFixed(1)}:1
      {showLabel && (
        <span className="text-xs ms-1 opacity-75">({t(LEVEL_KEYS[level])})</span>
      )}
    </span>
  );
}
