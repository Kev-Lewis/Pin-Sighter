// Shared stat formatters — small presentation helpers used by the stat-card
// builders (overview / set / detailed). Extracted from App.tsx (stats
// decomposition). Pure; only type dep is HighSeriesDetail from lib/sessions.

import type { HighSeriesDetail } from "../lib/sessions";

export function formatSetSavedDateTime(savedAt: string) {
  const savedDate = new Date(savedAt);

  if (Number.isNaN(savedDate.getTime())) {
    return savedAt;
  }

  return savedDate.toLocaleString([], {
    month: "numeric",
    day: "numeric",
    year: "2-digit",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatStatRatio(numerator: number, denominator: number) {
  return `${numerator.toLocaleString()} / ${denominator.toLocaleString()}`;
}

export function formatDetailedPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

export function formatHighSeriesDetailRows(
  detail: HighSeriesDetail | null
): { label: string; value: string }[] {
  if (!detail) {
    return [{ label: "Series Games", value: "Not enough games tracked" }];
  }

  return [
    {
      label: "Series Date",
      value: formatSetSavedDateTime(detail.games[0]?.savedAt ?? ""),
    },
    {
      label: "Event / Set",
      value: detail.eventLabel,
    },
    ...detail.games.map((game, index) => ({
      label: `Game ${index + 1}`,
      value: `${game.score} — Game ${game.gameNumber}, ${game.laneLabel}`,
    })),
  ];
}
