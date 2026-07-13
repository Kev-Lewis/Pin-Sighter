// Targeting / board-progression stats — parses per-shot board values (foot,
// arrow, breakpoint), computes miss/hit-rate summaries per ball and per game.
// Extracted from App.tsx (stats decomposition, phase 1). Pure functions over
// FrameEntry; no lib or app dependencies. The DetailedStatDetail-based card
// builders stay in App for now (they move with the shared stat-card layer).

import type { FrameEntry, SavedGameRecord } from "../types";

export type BoardStatRow = {
  ball: string;
  shots: number;
  averageFootBoard: number | null;
  averageTargetArrow: number | null;
  averageActualArrow: number | null;
  averageArrowMiss: number | null;
  averageAbsoluteArrowMiss: number | null;
  arrowHitRate: number | null;
  averageTargetBreakpoint: number | null;
  averageActualBreakpoint: number | null;
  averageBreakpointMiss: number | null;
  averageAbsoluteBreakpointMiss: number | null;
  breakpointHitRate: number | null;
};

export type BoardShotRow = {
  bowlerName: string;
  frameNumber: number;
  ballUsed: string;
  footBoard: number | null;
  targetArrow: number | null;
  actualArrow: number | null;
  arrowMiss: number | null;
  targetBreakpoint: number | null;
  actualBreakpoint: number | null;
  breakpointMiss: number | null;
};

export function parseBoardValue(value: string) {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

export function averageValues(values: Array<number | null>) {
  const validValues = values.filter((value): value is number => value !== null);

  if (validValues.length === 0) {
    return null;
  }

  return validValues.reduce((sum, value) => sum + value, 0) / validValues.length;
}

export function calculateMiss(actual: number | null, target: number | null) {
  if (actual === null || target === null) {
    return null;
  }

  return actual - target;
}

export function formatMaybeNumber(value: number | null) {
  return value === null ? "—" : value.toFixed(1);
}

export function formatSignedNumber(value: number | null) {
  if (value === null) {
    return "—";
  }

  if (value > 0) {
    return `+${value.toFixed(1)}`;
  }

  return value.toFixed(1);
}

export function formatPercentValue(value: number | null) {
  return value === null ? "—" : `${value.toFixed(1)}%`;
}

export function calculateBoardHitRate(values: Array<number | null>, tolerance = 1) {
  const validValues = values.filter((value): value is number => value !== null);

  if (validValues.length === 0) {
    return null;
  }

  const hits = validValues.filter((value) => Math.abs(value) <= tolerance).length;

  return (hits / validValues.length) * 100;
}

export function createBoardShotRow(entry: FrameEntry): BoardShotRow {
  const footBoard = parseBoardValue(entry.footBoard);
  const targetArrow = parseBoardValue(entry.targetArrow);
  const actualArrow = parseBoardValue(entry.actualArrow);
  const targetBreakpoint = parseBoardValue(entry.targetBreakpoint);
  const actualBreakpoint = parseBoardValue(entry.actualBreakpoint);

  return {
    bowlerName: entry.bowlerName,
    frameNumber: entry.frameNumber,
    ballUsed: entry.ballUsed,
    footBoard,
    targetArrow,
    actualArrow,
    arrowMiss: calculateMiss(actualArrow, targetArrow),
    targetBreakpoint,
    actualBreakpoint,
    breakpointMiss: calculateMiss(actualBreakpoint, targetBreakpoint),
  };
}

export function hasBoardData(row: BoardShotRow) {
  return (
    row.footBoard !== null ||
    row.targetArrow !== null ||
    row.actualArrow !== null ||
    row.targetBreakpoint !== null ||
    row.actualBreakpoint !== null
  );
}

export function summarizeBoardRows(rows: BoardShotRow[]): Omit<BoardStatRow, "ball" | "shots"> {
  return {
    averageFootBoard: averageValues(rows.map((row) => row.footBoard)),
    averageTargetArrow: averageValues(rows.map((row) => row.targetArrow)),
    averageActualArrow: averageValues(rows.map((row) => row.actualArrow)),
    averageArrowMiss: averageValues(rows.map((row) => row.arrowMiss)),
    averageAbsoluteArrowMiss: averageValues(
      rows.map((row) =>
        row.arrowMiss === null ? null : Math.abs(row.arrowMiss)
      )
    ),
    arrowHitRate: calculateBoardHitRate(rows.map((row) => row.arrowMiss)),
    averageTargetBreakpoint: averageValues(
      rows.map((row) => row.targetBreakpoint)
    ),
    averageActualBreakpoint: averageValues(
      rows.map((row) => row.actualBreakpoint)
    ),
    averageBreakpointMiss: averageValues(
      rows.map((row) => row.breakpointMiss)
    ),
    averageAbsoluteBreakpointMiss: averageValues(
      rows.map((row) =>
        row.breakpointMiss === null ? null : Math.abs(row.breakpointMiss)
      )
    ),
    breakpointHitRate: calculateBoardHitRate(
      rows.map((row) => row.breakpointMiss)
    ),
  };
}

export function calculateBoardStats(entries: FrameEntry[]) {
  const boardRows = entries.map(createBoardShotRow).filter(hasBoardData);
  const overall = summarizeBoardRows(boardRows);
  const rowsByBall = new Map<string, BoardShotRow[]>();

  boardRows.forEach((row) => {
    const ballName = row.ballUsed || "No ball";
    const currentRows = rowsByBall.get(ballName) ?? [];
    rowsByBall.set(ballName, [...currentRows, row]);
  });

  const byBallRows: BoardStatRow[] = Array.from(rowsByBall.entries())
    .map(([ball, rows]) => ({
      ball,
      shots: rows.length,
      ...summarizeBoardRows(rows),
    }))
    .sort((a, b) => b.shots - a.shots || a.ball.localeCompare(b.ball));

  return {
    trackedShots: boardRows.length,
    ...overall,
    byBallRows,
    recentRows: boardRows.slice(-12).reverse(),
  };
}

export function calculateBoardProgressionRows(
  games: SavedGameRecord[],
  selectedBowler: string,
  selectedBall: string
) {
  return games
    .map((game) => {
      const boardRows = game.entries
        .filter((entry) => {
          const matchesBowler =
            selectedBowler === "All" || entry.bowlerName === selectedBowler;
          const matchesBall =
            selectedBall === "All" || entry.ballUsed === selectedBall;

          return matchesBowler && matchesBall;
        })
        .map(createBoardShotRow)
        .filter(hasBoardData);

      if (boardRows.length === 0) {
        return null;
      }

      const sessionTitle = [
        game.eventName || game.competitionType,
        game.eventStageLabel,
      ]
        .filter(Boolean)
        .join(" — ");

      return {
        sessionTitle,
        gameNumber: game.gameNumber,
        laneLabel: game.laneLabel,
        shots: boardRows.length,
        ...summarizeBoardRows(boardRows),
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);
}
