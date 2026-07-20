// Score & series distribution + per-frame / per-game averages. Extracted from
// App.tsx (stats decomposition, phase 1). Pure functions over saved games and
// session groups; depends only on the scoring engine and session types.

import type { FrameEntry, SavedGameRecord } from "../types";
import { getCumulativeFrameScores, scoreBowlingFrames } from "../lib/scoring";
import type { SessionGroup } from "../lib/sessions";

export function getScoredFrameValues(entries: FrameEntry[]) {
  const orderedFrames = [...entries].sort((a, b) => a.frameNumber - b.frameNumber);
  const cumulativeScores = getCumulativeFrameScores(orderedFrames);
  let previousScore = 0;

  return orderedFrames
    .map((entry, index) => {
      const cumulativeScore = cumulativeScores[index];

      if (typeof cumulativeScore !== "number") {
        return null;
      }

      const frameScore = cumulativeScore - previousScore;
      previousScore = cumulativeScore;

      return {
        frameNumber: entry.frameNumber,
        frameScore,
      };
    })
    .filter(
      (row): row is { frameNumber: number; frameScore: number } => row !== null
    );
}

export function calculateAverageFrameScoreRows(
  games: SavedGameRecord[],
  bowlerName: string,
  selectedBall: string
) {
  const rowsByFrame = new Map<number, number[]>();

  games.forEach((game) => {
    const gameEntries = game.entries
      .filter((entry) => {
        const matchesBowler = entry.bowlerName === bowlerName;
        const matchesBall =
          selectedBall === "All" || entry.ballUsed === selectedBall;

        return matchesBowler && matchesBall;
      })
      .sort((a, b) => a.frameNumber - b.frameNumber);

    getScoredFrameValues(gameEntries).forEach((row) => {
      const frameScores = rowsByFrame.get(row.frameNumber) ?? [];
      rowsByFrame.set(row.frameNumber, [...frameScores, row.frameScore]);
    });
  });

  return Array.from({ length: 10 }, (_, index) => {
    const frameNumber = index + 1;
    const frameScores = rowsByFrame.get(frameNumber) ?? [];
    const average =
      frameScores.length > 0
        ? frameScores.reduce((sum, score) => sum + score, 0) /
          frameScores.length
        : 0;

    return {
      frameNumber,
      average,
      count: frameScores.length,
    };
  });
}

export function calculateAverageByGameRows(
  games: SavedGameRecord[],
  bowlerName: string,
  selectedBall: string
) {
  const scoresByGameNumber = new Map<number, number[]>();

  games.forEach((game) => {
    const gameEntries = game.entries.filter((entry) => {
      const matchesBowler = entry.bowlerName === bowlerName;
      const matchesBall =
        selectedBall === "All" || entry.ballUsed === selectedBall;

      return matchesBowler && matchesBall;
    });

    if (gameEntries.length === 0) {
      return;
    }

    const score = scoreBowlingFrames(gameEntries);
    const gameScores = scoresByGameNumber.get(game.gameNumber) ?? [];
    scoresByGameNumber.set(game.gameNumber, [...gameScores, score]);
  });

  return Array.from(scoresByGameNumber.entries())
    .map(([gameNumber, scores]) => ({
      gameNumber,
      count: scores.length,
      average:
        scores.length > 0
          ? scores.reduce((sum, score) => sum + score, 0) / scores.length
          : 0,
      high: scores.length > 0 ? Math.max(...scores) : 0,
      low: scores.length > 0 ? Math.min(...scores) : 0,
    }))
    .sort((a, b) => a.gameNumber - b.gameNumber);
}

export function getScoreBinLabel(score: number) {
  if (score < 100) return "U/100";
  if (score < 125) return "100-124";
  if (score < 150) return "125-149";
  if (score < 175) return "150-174";
  if (score < 200) return "175-199";
  if (score < 225) return "200-224";
  if (score < 250) return "225-249";
  if (score < 275) return "250-274";
  if (score < 300) return "275-299";
  return "300";
}

export function getSeriesBinLabel(score: number) {
  if (score < 400) return "U/400";
  if (score < 450) return "400-449";
  if (score < 500) return "450-499";
  if (score < 550) return "500-549";
  if (score < 600) return "550-599";
  if (score < 650) return "600-649";
  if (score < 700) return "650-699";
  if (score < 750) return "700-749";
  if (score < 800) return "750-799";
  return "800-900";
}

export function getGameScoreItems(
  games: SavedGameRecord[],
  bowlerName: string,
  selectedBall: string
) {
  return games
    .map((game) => {
      const gameEntries = game.entries.filter((entry) => {
        const matchesBowler = entry.bowlerName === bowlerName;
        const matchesBall =
          selectedBall === "All" || entry.ballUsed === selectedBall;

        return matchesBowler && matchesBall;
      });

      if (gameEntries.length === 0) {
        return null;
      }

      return {
        gameNumber: game.gameNumber,
        score: scoreBowlingFrames(gameEntries),
      };
    })
    .filter(
      (item): item is { gameNumber: number; score: number } => item !== null
    );
}

export function getThreeGameSeriesTotals(
  sessionGroups: SessionGroup[],
  bowlerName: string
) {
  const seriesTotals: number[] = [];

  sessionGroups.forEach((session) => {
    const bowlerScores = session.games
      .sort((a, b) => a.gameNumber - b.gameNumber)
      .map((game) =>
        game.scores.find((score) => score.label === bowlerName)?.score ?? null
      )
      .filter((score): score is number => score !== null);

    if (bowlerScores.length < 3) {
      return;
    }

    for (let index = 0; index <= bowlerScores.length - 3; index += 1) {
      seriesTotals.push(
        bowlerScores
          .slice(index, index + 3)
          .reduce((sum, score) => sum + score, 0)
      );
    }
  });

  return seriesTotals;
}

export function calculateScoreDistribution(
  games: SavedGameRecord[],
  sessionGroups: SessionGroup[],
  bowlerName: string,
  selectedBall: string
) {
  const gameScoreItems = getGameScoreItems(games, bowlerName, selectedBall);
  const gameNumbers = Array.from(
    new Set(gameScoreItems.map((item) => item.gameNumber))
  ).sort((a, b) => a - b);
  const gameBinLabels = [
    "U/100",
    "100-124",
    "125-149",
    "150-174",
    "175-199",
    "200-224",
    "225-249",
    "250-274",
    "275-299",
    "300",
  ];
  const gameRows = gameBinLabels.map((label) => {
    const gameCounts: Record<number, number> = {};

    gameNumbers.forEach((gameNumber) => {
      gameCounts[gameNumber] = 0;
    });

    gameScoreItems.forEach((item) => {
      if (getScoreBinLabel(item.score) === label) {
        gameCounts[item.gameNumber] = (gameCounts[item.gameNumber] ?? 0) + 1;
      }
    });

    const total = Object.values(gameCounts).reduce(
      (sum, count) => sum + count,
      0
    );

    return {
      label,
      gameCounts,
      total,
      percentage:
        gameScoreItems.length > 0
          ? (total / gameScoreItems.length) * 100
          : 0,
    };
  });

  const seriesTotals = getThreeGameSeriesTotals(sessionGroups, bowlerName);
  const seriesBinLabels = [
    "U/400",
    "400-449",
    "450-499",
    "500-549",
    "550-599",
    "600-649",
    "650-699",
    "700-749",
    "750-799",
    "800-900",
  ];
  const seriesRows = seriesBinLabels.map((label) => {
    const total = seriesTotals.filter(
      (seriesTotal) => getSeriesBinLabel(seriesTotal) === label
    ).length;

    return {
      label,
      total,
      percentage:
        seriesTotals.length > 0 ? (total / seriesTotals.length) * 100 : 0,
    };
  });

  return {
    gameNumbers,
    gameRows,
    seriesRows,
  };
}
