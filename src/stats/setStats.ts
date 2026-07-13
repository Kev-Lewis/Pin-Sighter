// Set / session stats — the set filter option list, team-set summary rows, and
// the per-set stat cards for one bowler. Extracted from App.tsx (stats
// decomposition). Builds on sessions, the frame classifiers, the detailed
// calculator (for its stats shape), the shared formatters, and stat types.

import type { SavedGameRecord, FrameEntry } from "../types";
import { buildSessionGroups } from "../lib/sessions";
import type { SessionGroup } from "../lib/sessions";
import {
  isStrikeEntry,
  isSpareEntry,
  isCleanFrame,
  isSplitEntry,
  isCleanGameForEntries,
} from "./frames";
import {
  formatSetSavedDateTime,
  formatDetailedPercent,
  formatStatRatio,
} from "./format";
import type { SetStatDetailRow, DetailedStatDetail } from "./types";
import { calculateDetailedBowlerStats } from "./detailed";

export function buildSetFilterOptions(games: SavedGameRecord[]) {
  return buildSessionGroups(games).map((group) => {
    const firstGame = group.games[0];
    const gameCount = group.games.length;
    const savedDateTime = firstGame
      ? formatSetSavedDateTime(firstGame.savedAt)
      : "";

    return {
      key: group.sessionKey,
      label: [
        `${gameCount} game${gameCount === 1 ? "" : "s"}`,
        firstGame?.centerName,
        savedDateTime,
      ]
        .filter(Boolean)
        .join(" • "),
    };
  });
}

export function calculateTeamSetRows(sessionGroups: SessionGroup[]) {
  return sessionGroups.map((group) => {
    const teamGameScores = group.games.map((game) =>
      game.scores.reduce((sum, score) => sum + score.score, 0)
    );
    const individualScores = group.games.flatMap((game) =>
      game.scores.map((score) => score.score)
    );
    const entries = group.games.flatMap((game) => game.entries);
    const strikes = entries.filter(isStrikeEntry).length;
    const spares = entries.filter(isSpareEntry).length;
    const opens = entries.length - strikes - spares;
    const cleanFrames = entries.filter(isCleanFrame).length;
    const splits = entries.filter(isSplitEntry).length;
    const bowlerNames = Array.from(
      new Set(group.games.flatMap((game) => game.bowlerNames))
    ).sort((a, b) => a.localeCompare(b));
    const cleanTeamGames = group.games.filter((game) => {
      if (game.format === "Baker") {
        return isCleanGameForEntries(game.entries);
      }

      const entriesByBowler = new Map<string, FrameEntry[]>();

      game.entries.forEach((entry) => {
        const currentEntries = entriesByBowler.get(entry.bowlerName) ?? [];
        entriesByBowler.set(entry.bowlerName, [...currentEntries, entry]);
      });

      const bowlerFrameSets = Array.from(entriesByBowler.values());

      return (
        bowlerFrameSets.length > 0 &&
        bowlerFrameSets.every((bowlerEntries) =>
          isCleanGameForEntries(bowlerEntries)
        )
      );
    }).length;

    const teamSetTotal = teamGameScores.reduce((sum, score) => sum + score, 0);
    const teamGameAverage =
      teamGameScores.length > 0 ? teamSetTotal / teamGameScores.length : 0;
    const trackedBowlerAverage =
      individualScores.length > 0
        ? individualScores.reduce((sum, score) => sum + score, 0) /
          individualScores.length
        : 0;

    return {
      sessionKey: group.sessionKey,
      title: group.title,
      games: group.games.length,
      bowlers: bowlerNames.join(", ") || "Team",
      teamSetTotal,
      teamGameAverage,
      trackedBowlerAverage,
      highTeamGame: teamGameScores.length > 0 ? Math.max(...teamGameScores) : 0,
      frames: entries.length,
      strikes,
      spares,
      opens,
      cleanRate: entries.length > 0 ? (cleanFrames / entries.length) * 100 : 0,
      splitRate: entries.length > 0 ? (splits / entries.length) * 100 : 0,
      cleanTeamGames,
    };
  });
}

export function getSetScoreRows(
  games: SavedGameRecord[],
  bowlerName: string
): SetStatDetailRow[] {
  return games.flatMap((game) => {
    const score = game.scores.find(
      (currentScore) => currentScore.label === bowlerName
    );

    if (!score) {
      return [];
    }

    const eventLabel = [
      game.eventName || game.competitionType,
      game.eventStageLabel,
      game.centerName,
    ]
      .filter(Boolean)
      .join(" • ");

    return [
      {
        id: `${game.id}:${score.label}`,
        score: score.score,
        gameNumber: game.gameNumber,
        laneLabel: game.laneLabel,
        savedAt: game.savedAt,
        eventLabel,
      },
    ];
  });
}

export function formatSetScoreDetailRows(rows: SetStatDetailRow[]) {
  if (rows.length === 0) {
    return [{ label: "Scores", value: "No matching games tracked" }];
  }

  return rows.map((row, index) => ({
    label: `Game ${index + 1}`,
    value: `${row.score} — Game ${row.gameNumber}, ${
      row.laneLabel || "No lane"
    }, ${row.eventLabel || "Saved Set"}, ${formatSetSavedDateTime(row.savedAt)}`,
  }));
}

export function buildSetStatCards({
  stats,
  selectedBowler,
  selectedBall,
  games,
}: {
  stats: ReturnType<typeof calculateDetailedBowlerStats>;
  selectedBowler: string;
  selectedBall: string;
  games: SavedGameRecord[];
}): DetailedStatDetail[] {
  const scoreRows = getSetScoreRows(games, selectedBowler);
  const ballFilterNote =
    selectedBall === "All"
      ? undefined
      : "A ball filter is active. Frame-based stats use only frames matching that ball, while score-based stats use saved game scores in the current set.";

  return [
    {
      title: "Set Games",
      label: "Games",
      value: String(stats.numGames),
      description:
        "The number of saved non-Baker games counted for this bowler in this set.",
      formula: "Count of matching saved game scores.",
      detailRows: [
        { label: "Games Counted", value: stats.numGames.toLocaleString() },
        { label: "Total Pins", value: stats.totalPins.toLocaleString() },
        ...formatSetScoreDetailRows(scoreRows),
      ],
      note: ballFilterNote,
    },
    {
      title: "Set Average",
      label: "Average",
      value: stats.average.toFixed(1),
      description:
        "Average score for this bowler in this set.",
      formula: "Total pins ÷ games counted.",
      detailRows: [
        { label: "Total Pins", value: stats.totalPins.toLocaleString() },
        { label: "Games Counted", value: stats.numGames.toLocaleString() },
        {
          label: "Calculation",
          value:
            stats.numGames > 0
              ? `${stats.totalPins} ÷ ${stats.numGames} = ${stats.average.toFixed(1)}`
              : "No matching games tracked",
        },
        ...formatSetScoreDetailRows(scoreRows),
      ],
      note: ballFilterNote,
    },
    {
      title: "Set Pocket Percentage",
      label: "Pocket %",
      value: formatDetailedPercent(stats.pocketPercentage),
      description:
        "How often this bowler's first ball hit the pocket in this set.",
      formula:
        "Pocket hits ÷ first-ball shots. Right-handed pocket hits count pins 1 and 3; left-handed pocket hits count pins 1 and 2.",
      detailRows: [
        { label: "Pocket Hits", value: stats.pocketHits.toLocaleString() },
        { label: "First-Ball Shots", value: stats.firstShots.toLocaleString() },
        {
          label: "Calculation",
          value:
            stats.firstShots > 0
              ? `${formatStatRatio(stats.pocketHits, stats.firstShots)} = ${formatDetailedPercent(stats.pocketPercentage)}`
              : "No first-ball shots tracked",
        },
      ],
    },
    {
      title: "Set Carry Percentage",
      label: "Carry %",
      value: formatDetailedPercent(stats.carryPercentage),
      description:
        "How often pocket hits carried for strikes in this set.",
      formula: "Pocket strikes ÷ pocket hits.",
      detailRows: [
        { label: "Pocket Strikes", value: stats.pocketStrikes.toLocaleString() },
        { label: "Pocket Hits", value: stats.pocketHits.toLocaleString() },
        {
          label: "Calculation",
          value:
            stats.pocketHits > 0
              ? `${formatStatRatio(stats.pocketStrikes, stats.pocketHits)} = ${formatDetailedPercent(stats.carryPercentage)}`
              : "No pocket hits tracked",
        },
      ],
    },
    {
      title: "Set Double Percentage",
      label: "Double %",
      value: formatDetailedPercent(stats.doublePercentage),
      description:
        "How often a pocket strike followed a previous-frame strike in this set.",
      formula: "Pocket strikes after a previous strike ÷ pocket strikes.",
      detailRows: [
        {
          label: "Pocket Strikes After Strike",
          value: stats.pocketStrikesAfterStrike.toLocaleString(),
        },
        { label: "Pocket Strikes", value: stats.pocketStrikes.toLocaleString() },
        {
          label: "Calculation",
          value:
            stats.pocketStrikes > 0
              ? `${formatStatRatio(stats.pocketStrikesAfterStrike, stats.pocketStrikes)} = ${formatDetailedPercent(stats.doublePercentage)}`
              : "No pocket strikes tracked",
        },
      ],
    },
    {
      title: "Set Makeable Spare Percentage",
      label: "Makeable Spare %",
      value: formatDetailedPercent(stats.makeableSpareConversion),
      description:
        "How often makeable spare attempts were converted in this set.",
      formula: "Converted makeable spares ÷ makeable spare attempts.",
      detailRows: [
        {
          label: "Converted Makeable Spares",
          value: stats.convertedMakeableSpares.toLocaleString(),
        },
        {
          label: "Makeable Spare Attempts",
          value: stats.makeableAttempts.toLocaleString(),
        },
        {
          label: "Calculation",
          value:
            stats.makeableAttempts > 0
              ? `${formatStatRatio(stats.convertedMakeableSpares, stats.makeableAttempts)} = ${formatDetailedPercent(stats.makeableSpareConversion)}`
              : "No makeable spare attempts tracked",
        },
      ],
    },
    {
      title: "Set Clean Percentage",
      label: "Clean %",
      value: formatDetailedPercent(stats.cleanPercentage),
      description:
        "How often this bowler avoided open frames in this set.",
      formula: "Clean frames ÷ tracked frames.",
      detailRows: [
        { label: "Clean Frames", value: stats.cleanFrames.toLocaleString() },
        { label: "Tracked Frames", value: stats.firstShots.toLocaleString() },
        {
          label: "Calculation",
          value:
            stats.firstShots > 0
              ? `${formatStatRatio(stats.cleanFrames, stats.firstShots)} = ${formatDetailedPercent(stats.cleanPercentage)}`
              : "No frames tracked",
        },
      ],
    },
    {
      title: "Set Split Percentage",
      label: "Split %",
      value: formatDetailedPercent(stats.splitPercentage),
      description:
        "How often this bowler left a split on the first ball in this set.",
      formula: "Split frames ÷ tracked frames.",
      detailRows: [
        { label: "Split Frames", value: stats.splits.toLocaleString() },
        { label: "Tracked Frames", value: stats.firstShots.toLocaleString() },
        {
          label: "Calculation",
          value:
            stats.firstShots > 0
              ? `${formatStatRatio(stats.splits, stats.firstShots)} = ${formatDetailedPercent(stats.splitPercentage)}`
              : "No frames tracked",
        },
      ],
    },
    {
      title: "Set Clean Games",
      label: "Clean Games",
      value: String(stats.cleanGames),
      description:
        "The number of games in this set where this bowler had no open frames.",
      formula: "Count of matching games where every completed frame was clean.",
      detailRows: [
        { label: "Clean Games", value: stats.cleanGames.toLocaleString() },
        { label: "Games Counted", value: stats.numGames.toLocaleString() },
      ],
      note: ballFilterNote,
    },
  ];
}
