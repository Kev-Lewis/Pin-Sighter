// Baker stats calculators — per-entry counts, team/position/bowler summary rows,
// and the frame result label. Extracted from App.tsx (stats decomposition). Pure
// data functions; the Baker sub-components (BakerStatsSection / BakerSetBreakdown
// / BakerFrameTable) stay in App for now and import these back.

import type { FrameEntry, SavedGameRecord } from "../types";
import { getFrameRolls } from "../lib/scoring";
import { bakerTeamLabelFromNames } from "../lib/statsFilters";
import {
  isStrikeEntry,
  isSpareEntry,
  isSplitEntry,
  isCleanFrame,
  isCleanGameForEntries,
} from "./frames";

export function getBakerEntryStatCounts(entry: FrameEntry) {
  const rolls = getFrameRolls(entry);
  let strikes = 0;
  let spares = 0;

  if (entry.frameNumber === 10) {
    rolls.forEach((roll) => {
      if (roll === 10) {
        strikes += 1;
      }
    });

    if ((rolls[0] ?? 0) !== 10 && (rolls[0] ?? 0) + (rolls[1] ?? 0) === 10) {
      spares += 1;
    }

    if (
      (rolls[0] ?? 0) === 10 &&
      (rolls[1] ?? 0) !== 10 &&
      (rolls[1] ?? 0) + (rolls[2] ?? 0) === 10
    ) {
      spares += 1;
    }
  } else if ((rolls[0] ?? 0) === 10) {
    strikes += 1;
  } else if ((rolls[0] ?? 0) + (rolls[1] ?? 0) === 10) {
    spares += 1;
  }

  return {
    strikes,
    spares,
    opens: isCleanFrame(entry) ? 0 : 1,
    splits: isSplitEntry(entry) ? 1 : 0,
    cleanFrames: isCleanFrame(entry) ? 1 : 0,
  };
}

export function summarizeBakerEntries(entries: FrameEntry[]) {
  return entries.reduce(
    (summary, entry) => {
      const entryStats = getBakerEntryStatCounts(entry);

      return {
        strikes: summary.strikes + entryStats.strikes,
        spares: summary.spares + entryStats.spares,
        opens: summary.opens + entryStats.opens,
        splits: summary.splits + entryStats.splits,
        cleanFrames: summary.cleanFrames + entryStats.cleanFrames,
      };
    },
    {
      strikes: 0,
      spares: 0,
      opens: 0,
      splits: 0,
      cleanFrames: 0,
    }
  );
}

export function calculateBakerTeamSummaryRows(games: SavedGameRecord[]) {
  const gamesByTeam = new Map<string, SavedGameRecord[]>();

  games.forEach((game) => {
    const teamName = bakerTeamLabelFromNames(game.bowlerNames);
    const currentGames = gamesByTeam.get(teamName) ?? [];
    gamesByTeam.set(teamName, [...currentGames, game]);
  });

  return Array.from(gamesByTeam.entries()).map(([teamName, teamGames]) => {
    const scores = teamGames.flatMap((game) =>
      game.scores.map((score) => score.score)
    );
    const entries = teamGames.flatMap((game) => game.entries);
    const bakerStats = summarizeBakerEntries(entries);

    return {
      teamName,
      games: teamGames.length,
      average:
        scores.length > 0
          ? scores.reduce((sum, score) => sum + score, 0) / scores.length
          : 0,
      highGame: scores.length > 0 ? Math.max(...scores) : 0,
      frames: entries.length,
      strikes: bakerStats.strikes,
      spares: bakerStats.spares,
      opens: bakerStats.opens,
      splits: bakerStats.splits,
      cleanRate:
        entries.length > 0 ? (bakerStats.cleanFrames / entries.length) * 100 : 0,
      cleanGames: teamGames.filter((game) => isCleanGameForEntries(game.entries))
        .length,
    };
  });
}

export function calculateBakerPositionRows(
  games: SavedGameRecord[],
  selectedBakerBowler: string,
  selectedBall: string
) {
  const rowsByPosition = new Map<
    number,
    {
      position: number;
      bowlerNames: Set<string>;
      entries: FrameEntry[];
    }
  >();

  games.forEach((game) => {
    game.entries.forEach((entry) => {
      const matchesBakerBowler =
        selectedBakerBowler === "All" ||
        entry.bowlerName === selectedBakerBowler;
      const matchesBall = selectedBall === "All" || entry.ballUsed === selectedBall;

      if (!matchesBakerBowler || !matchesBall) {
        return;
      }

      const position = ((entry.frameNumber - 1) % Math.max(1, game.bowlersPerTeam)) + 1;
      const currentRow =
        rowsByPosition.get(position) ?? {
          position,
          bowlerNames: new Set<string>(),
          entries: [],
        };

      currentRow.bowlerNames.add(entry.bowlerName);
      currentRow.entries.push(entry);
      rowsByPosition.set(position, currentRow);
    });
  });

  return Array.from(rowsByPosition.values())
    .map((row) => {
      const bakerStats = summarizeBakerEntries(row.entries);

      return {
        position: row.position,
        bowlers: Array.from(row.bowlerNames).sort().join(", "),
        frames: row.entries.length,
        strikes: bakerStats.strikes,
        spares: bakerStats.spares,
        opens: bakerStats.opens,
        splits: bakerStats.splits,
        cleanRate:
          row.entries.length > 0
            ? (bakerStats.cleanFrames / row.entries.length) * 100
            : 0,
      };
    })
    .sort((a, b) => a.position - b.position);
}

export function calculateBakerBowlerRows(games: SavedGameRecord[]) {
  const entryMap = new Map<string, FrameEntry[]>();

  games
    .filter((game) => game.format === "Baker")
    .flatMap((game) => game.entries)
    .forEach((entry) => {
      const currentEntries = entryMap.get(entry.bowlerName) ?? [];
      entryMap.set(entry.bowlerName, [...currentEntries, entry]);
    });

  return Array.from(entryMap.entries())
    .map(([bowlerName, entries]) => {
      const bakerStats = summarizeBakerEntries(entries);
      const balls = Array.from(
        new Set(entries.map((entry) => entry.ballUsed).filter(Boolean))
      ).join(", ");

      return {
        bowlerName,
        frames: entries.length,
        strikes: bakerStats.strikes,
        spares: bakerStats.spares,
        opens: bakerStats.opens,
        splits: bakerStats.splits,
        cleanRate:
          entries.length > 0
            ? (bakerStats.cleanFrames / entries.length) * 100
            : 0,
        balls: balls || "No ball",
      };
    })
    .sort((a, b) => a.bowlerName.localeCompare(b.bowlerName));
}

export function getEntryResultLabel(entry: FrameEntry) {
  if (isStrikeEntry(entry)) {
    return "Strike";
  }

  if (isSpareEntry(entry)) {
    return "Spare";
  }

  return "Open";
}
