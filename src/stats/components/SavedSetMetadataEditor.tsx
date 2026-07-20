// SavedSetMetadataEditor — the editor card for set-level metadata (center,
// pattern, per-game lane labels, set notes) without touching frame data.
// Extracted from App.tsx (stats decomposition). Rendered by StatsPage.

import type { Center, Pattern } from "../../types";
import type { SessionGroup } from "../../lib/sessions";
import type { SetMetadataDraft } from "../types";
import { getUniqueMetadataOptions, buildMetadataLaneOptions } from "../setMetadata";

export function SavedSetMetadataEditor({
  session,
  centers,
  patterns,
  draft,
  hasChanges,
  onChange,
  onLaneChange,
  onSave,
  onReset,
  onClose,
}: {
  session: SessionGroup;
  centers: Center[];
  patterns: Pattern[];
  draft: SetMetadataDraft;
  hasChanges: boolean;
  onChange: (field: keyof SetMetadataDraft, value: string) => void;
  onLaneChange: (gameId: string, laneLabel: string) => void;
  onSave: () => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const firstGame = session.games[0];
  const savedDate = firstGame
    ? new Date(firstGame.savedAt).toLocaleString()
    : "Unknown";
  const scoreLabels = Array.from(
    new Set(
      session.games.flatMap((game) =>
        game.scores.map((score) => score.label)
      )
    )
  ).join(", ");
  const centerOptions = getUniqueMetadataOptions(
    draft.centerName,
    centers.map((center) => center.name)
  );
  const patternOptions = getUniqueMetadataOptions(
    draft.patternName,
    patterns.map((pattern) => pattern.name)
  );
  const laneOptions = buildMetadataLaneOptions(
    draft.centerName,
    centers,
    session,
    Object.values(draft.gameLaneLabels)
  );

  return (
    <section className="set-metadata-card">
      <div className="set-metadata-header">
        <div>
          <h4>Edit Set Data</h4>
          <p>
            Edit set-level labels and notes without changing the actual frame
            data.
          </p>
        </div>
      </div>

      <div className="set-metadata-grid">
        <p>
          <strong>Saved:</strong> {savedDate}
        </p>
        <p>
          <strong>Competition:</strong>{" "}
          {firstGame?.eventName || firstGame?.competitionType || "Open"}
        </p>
        <p>
          <strong>Week/Day:</strong> {firstGame?.eventStageLabel || "N/A"}
        </p>
        <p>
          <strong>Format:</strong> {firstGame?.format ?? "Unknown"}
        </p>
        <p>
          <strong>Games:</strong> {session.games.length}
        </p>
        <p>
          <strong>Score Labels:</strong> {scoreLabels || "N/A"}
        </p>
      </div>

      <div className="form-grid set-metadata-form">
        <label>
          Bowling Center
          <select
            value={draft.centerName}
            onChange={(event) => onChange("centerName", event.target.value)}
          >
            {centerOptions.map((centerName) => (
              <option key={centerName} value={centerName}>
                {centerName}
              </option>
            ))}
          </select>
        </label>

        <label>
          Pattern
          <select
            value={draft.patternName}
            onChange={(event) => onChange("patternName", event.target.value)}
          >
            {patternOptions.map((patternName) => (
              <option key={patternName} value={patternName}>
                {patternName}
              </option>
            ))}
          </select>
        </label>

        <div className="metadata-game-lane-card full-width-field">
          <strong>Lane / Pair by Game</strong>
          <p className="helper-text">
            Choose the lane or pair for each saved game. Options are based on
            the saved set's center and whether the set was logged as pairs or
            single lanes.
          </p>

          <div className="metadata-game-lane-list">
            {session.games.map((game) => (
              <label key={game.id}>
                Game {game.gameNumber}
                <select
                  value={draft.gameLaneLabels[game.id] ?? game.laneLabel}
                  onChange={(event) =>
                    onLaneChange(game.id, event.target.value)
                  }
                >
                  {laneOptions.map((laneLabel) => (
                    <option key={laneLabel} value={laneLabel}>
                      {laneLabel}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </div>

        <label className="full-width-field">
          Set Notes
          <textarea
            rows={3}
            value={draft.setNotes}
            placeholder="Add notes about the pair, transition, ball choices, moves, or anything else from this set."
            onChange={(event) => onChange("setNotes", event.target.value)}
          />
        </label>
      </div>

      <div className="saved-set-actions-row">
        <button className="primary-button" onClick={onSave}>
          Save Set Data
        </button>
        <button
          className="secondary-button"
          disabled={!hasChanges}
          onClick={onReset}
        >
          Reset Changes
        </button>
        <button className="secondary-button" onClick={onClose}>
          Cancel
        </button>
      </div>
    </section>
  );
}
