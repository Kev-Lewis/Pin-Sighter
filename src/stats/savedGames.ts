// Saved-game summary helpers — small pure formatters/derivations for a single
// SavedGameRecord (ball summary, score summary, notes presence) plus the
// game-metadata draft factory. Extracted from App.tsx (stats decomposition);
// shared by StatsPage and the SavedGameNotesEditor.

import type { SavedGameRecord } from "../types";
import type { GameMetadataDraft } from "./types";

export function getSavedGameBallSummary(game: SavedGameRecord) {
  const uniqueBalls = Array.from(
    new Set(game.entries.map((entry) => entry.ballUsed).filter(Boolean))
  );

  if (uniqueBalls.length === 0) {
    return "No ball logged";
  }

  if (uniqueBalls.length <= 2) {
    return uniqueBalls.join(", ");
  }

  return `${uniqueBalls.slice(0, 2).join(", ")} +${uniqueBalls.length - 2} more`;
}

export function getSavedGameScoreSummary(game: SavedGameRecord) {
  return game.scores.map((score) => `${score.label}: ${score.score}`).join(" • ");
}

export function hasSavedGameNotes(game: SavedGameRecord) {
  return Boolean(
    game.gameNotes ||
      game.ballReactionNotes ||
      game.laneTransitionNotes ||
      game.adjustmentNotes
  );
}

export function createGameMetadataDraft(game: SavedGameRecord): GameMetadataDraft {
  return {
    gameNotes: game.gameNotes ?? "",
    ballReactionNotes: game.ballReactionNotes ?? "",
    laneTransitionNotes: game.laneTransitionNotes ?? "",
    adjustmentNotes: game.adjustmentNotes ?? "",
  };
}
