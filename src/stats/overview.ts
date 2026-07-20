// Overview stats — highest single game + the Overview stat cards (average /
// high game / high series). Extracted from App.tsx (stats decomposition).
// Depends on the session type and the shared stat formatters.

import type { HighSeriesDetail } from "../lib/sessions";
import { formatSetSavedDateTime, formatHighSeriesDetailRows } from "./format";

export type OverviewScoreDetail = {
  score: number;
  bowlerLabel: string;
  gameNumber: number;
  laneLabel: string;
  savedAt: string;
  eventLabel: string;
};

export function getHighGameDetail(scoreEntries: OverviewScoreDetail[]) {
  if (scoreEntries.length === 0) {
    return null;
  }

  return scoreEntries.reduce((highest, current) =>
    current.score > highest.score ? current : highest
  );
}

export function buildOverviewStatCards({
  average,
  totalPins,
  totalScores,
  highGameDetail,
  highSeriesDetail,
}: {
  average: number;
  totalPins: number;
  totalScores: number;
  highGameDetail: OverviewScoreDetail | null;
  highSeriesDetail: HighSeriesDetail | null;
}) {
  return {
    average: {
      title: "Average",
      label: "Average",
      value: totalScores > 0 ? average.toFixed(1) : "—",
      description:
        "Average score across the saved games that match the current filters.",
      formula: "Total pins ÷ total game scores.",
      detailRows: [
        { label: "Total Pins", value: totalPins.toLocaleString() },
        { label: "Scores Counted", value: totalScores.toLocaleString() },
        {
          label: "Calculation",
          value:
            totalScores > 0
              ? `${totalPins} ÷ ${totalScores} = ${average.toFixed(1)}`
              : "No scores match the current filters",
        },
      ],
    },
    highGame: {
      title: "High Game",
      label: "High Game",
      value: highGameDetail ? String(highGameDetail.score) : "—",
      description:
        "The highest single game score found under the current filters.",
      formula: "Highest score among matching saved game scores.",
      detailRows: highGameDetail
        ? [
            { label: "Score", value: String(highGameDetail.score) },
            { label: "Bowler / Team", value: highGameDetail.bowlerLabel },
            { label: "Game", value: `Game ${highGameDetail.gameNumber}` },
            { label: "Lane / Pair", value: highGameDetail.laneLabel || "—" },
            { label: "Event / Set", value: highGameDetail.eventLabel || "—" },
            {
              label: "Saved",
              value: formatSetSavedDateTime(highGameDetail.savedAt),
            },
          ]
        : [{ label: "High Game", value: "No scores match the current filters" }],
    },
    highSeries: {
      title: "High Series",
      label: "High Series (3-game)",
      value: highSeriesDetail ? String(highSeriesDetail.total) : "—",
      description:
        "The highest 3-game series found under the current filters.",
      formula:
        "Best total from three consecutive matching games in the same saved set.",
      detailRows: [
        {
          label: "Series Total",
          value: highSeriesDetail ? String(highSeriesDetail.total) : "—",
        },
        ...formatHighSeriesDetailRows(highSeriesDetail),
      ],
      note: "Open bowling games are not included in high series calculations.",
    },
  };
}
