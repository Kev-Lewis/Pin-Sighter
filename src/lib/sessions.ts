// =============================================================================
// Session / series aggregation — extracted from App.tsx. Pure logic that
// depends only on the domain model in types.ts. Groups saved games into
// sessions ("sets") and finds the best 3/4-game and full-session series for an
// individual bowler or a team. Used by StatsPage and the Home dashboard.
// =============================================================================

import type { SavedGameRecord } from "../types";

export type SessionGroup = {
  sessionKey: string;
  title: string;
  centerName: string;
  patternName: string;
  games: SavedGameRecord[];
};

export type HighSeriesGameDetail = {
  gameNumber: number;
  score: number;
  laneLabel: string;
  savedAt: string;
};

export type HighSeriesDetail = {
  total: number;
  eventLabel: string;
  games: HighSeriesGameDetail[];
};

// Group saved games into sessions/sets. A session key prefers an explicit
// sessionId, then an event log key, then a composite of when/where/format.
export function buildSessionGroups(games: SavedGameRecord[]): SessionGroup[] {
  const groups = new Map<string, SessionGroup>();

  games.forEach((game) => {
    const sessionKey =
      game.sessionId ||
      game.eventLogKey ||
      `${game.savedAt}-${game.centerName}-${game.patternName}-${game.format}`;

    const titleParts = [
      game.eventName || game.competitionType,
      game.eventStageLabel,
      game.format,
    ].filter(Boolean);

    if (!groups.has(sessionKey)) {
      groups.set(sessionKey, {
        sessionKey,
        title: titleParts.join(" — "),
        centerName: game.centerName,
        patternName: game.patternName,
        games: [],
      });
    }

    groups.get(sessionKey)?.games.push(game);
  });

  return Array.from(groups.values()).map((group) => ({
    ...group,
    games: group.games.sort((a, b) => a.gameNumber - b.gameNumber),
  }));
}

// Best consecutive `seriesLength`-game series for one bowler across sessions.
// Excludes Open-play games (only league/tournament count toward high series).
export function getHighSeriesDetail(
  sessionGroups: SessionGroup[],
  bowlerName: string,
  seriesLength: number
): HighSeriesDetail | null {
  let highSeries = 0;
  let highSeriesDetail: HighSeriesDetail | null = null;

  sessionGroups.forEach((session) => {
    const scoredGames = session.games
      .filter((game) => game.competitionType !== "Open")
      .slice()
      .sort((a, b) => a.gameNumber - b.gameNumber)
      .map((game) => {
        const score = game.scores.find(
          (currentScore) => currentScore.label === bowlerName
        );

        if (!score) {
          return null;
        }

        return {
          game,
          score: score.score,
        };
      })
      .filter(
        (gameScore): gameScore is { game: SavedGameRecord; score: number } =>
          gameScore !== null
      );

    if (scoredGames.length < seriesLength) {
      return;
    }

    for (let index = 0; index <= scoredGames.length - seriesLength; index += 1) {
      const seriesGames = scoredGames.slice(index, index + seriesLength);
      const seriesTotal = seriesGames.reduce(
        (sum, currentGame) => sum + currentGame.score,
        0
      );

      if (seriesTotal <= highSeries) {
        continue;
      }

      const firstGame = seriesGames[0].game;
      const eventLabel = [
        firstGame.eventName,
        firstGame.eventStageLabel,
        firstGame.centerName,
      ]
        .filter(Boolean)
        .join(" • ");

      highSeries = seriesTotal;
      highSeriesDetail = {
        total: seriesTotal,
        eventLabel: eventLabel || "Saved Set",
        games: seriesGames.map(({ game, score }) => ({
          gameNumber: game.gameNumber,
          score,
          laneLabel: game.laneLabel,
          savedAt: game.savedAt,
        })),
      };
    }
  });

  return highSeriesDetail;
}

// Highest full-session total for one bowler (sums every game in the session).
export function getHighFullSeries(
  sessionGroups: SessionGroup[],
  bowlerName: string
) {
  let highSeries = 0;

  sessionGroups.forEach((session) => {
    const seriesTotal = session.games.reduce((sum, game) => {
      const score = game.scores.find(
        (currentScore) => currentScore.label === bowlerName
      );

      return sum + (score?.score ?? 0);
    }, 0);

    highSeries = Math.max(highSeries, seriesTotal);
  });

  return highSeries;
}

// Best consecutive `seriesLength`-game team series (sums all bowlers per game).
export function getHighTeamSeriesDetail(
  sessionGroups: SessionGroup[],
  seriesLength: number
): HighSeriesDetail | null {
  let highSeries = 0;
  let highSeriesDetail: HighSeriesDetail | null = null;

  sessionGroups.forEach((session) => {
    const scoredGames = session.games
      .filter((game) => game.competitionType !== "Open")
      .slice()
      .sort((a, b) => a.gameNumber - b.gameNumber)
      .map((game) => ({
        game,
        score: game.scores.reduce((sum, score) => sum + score.score, 0),
      }));

    if (scoredGames.length < seriesLength) {
      return;
    }

    for (let index = 0; index <= scoredGames.length - seriesLength; index += 1) {
      const seriesGames = scoredGames.slice(index, index + seriesLength);
      const seriesTotal = seriesGames.reduce(
        (sum, currentGame) => sum + currentGame.score,
        0
      );

      if (seriesTotal <= highSeries) {
        continue;
      }

      const firstGame = seriesGames[0].game;
      const eventLabel = [
        firstGame.eventName,
        firstGame.eventStageLabel,
        firstGame.centerName,
      ]
        .filter(Boolean)
        .join(" • ");

      highSeries = seriesTotal;
      highSeriesDetail = {
        total: seriesTotal,
        eventLabel: eventLabel || "Saved Set",
        games: seriesGames.map(({ game, score }) => ({
          gameNumber: game.gameNumber,
          score,
          laneLabel: game.laneLabel,
          savedAt: game.savedAt,
        })),
      };
    }
  });

  return highSeriesDetail;
}
