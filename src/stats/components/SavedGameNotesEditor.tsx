// SavedGameNotesEditor — the modal for editing per-game notes (game, ball
// reaction, lane transition, adjustment). Extracted from App.tsx (stats
// decomposition). Rendered by StatsPage.

import { useEffect } from "react";
import type { GameMetadataDraft } from "../types";

export function SavedGameNotesEditor({
  draft,
  hasExistingNotes,
  hasChanges,
  onNotesChange,
  onSave,
  onReset,
  onClose,
}: {
  draft: GameMetadataDraft;
  hasExistingNotes: boolean;
  hasChanges: boolean;
  onNotesChange: (field: keyof GameMetadataDraft, value: string) => void;
  onSave: () => void;
  onReset: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    function handleEscape(keyEvent: KeyboardEvent) {
      if (keyEvent.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div className="ps-modal" role="dialog" aria-modal="true">
      <div className="ps-modal-backdrop" onClick={onClose} />
      <div className="ps-modal-panel">
        <button
          type="button"
          className="ps-modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <h3 className="ps-modal-title">
          {hasExistingNotes ? "Edit Game Notes" : "Add Game Notes"}
        </h3>
        <p>
          Add notes for this specific game. Use Edit Frames for score, pinfall,
          ball, and board corrections.
        </p>

        <div className="structured-notes-grid">
        <label>
          Game Notes
          <textarea
            rows={3}
            value={draft.gameNotes}
            placeholder="General notes for this specific game."
            onChange={(event) =>
              onNotesChange("gameNotes", event.target.value)
            }
          />
        </label>

        <label>
          Ball Reaction Notes
          <textarea
            rows={3}
            value={draft.ballReactionNotes}
            placeholder="Shape, read, carry, over/under, or ball reaction."
            onChange={(event) =>
              onNotesChange("ballReactionNotes", event.target.value)
            }
          />
        </label>

        <label>
          Lane Transition Notes
          <textarea
            rows={3}
            value={draft.laneTransitionNotes}
            placeholder="How the lane changed throughout the game."
            onChange={(event) =>
              onNotesChange("laneTransitionNotes", event.target.value)
            }
          />
        </label>

        <label>
          Adjustment Notes
          <textarea
            rows={3}
            value={draft.adjustmentNotes}
            placeholder="Moves, target changes, surface notes, or ball changes."
            onChange={(event) =>
              onNotesChange("adjustmentNotes", event.target.value)
            }
          />
        </label>
      </div>

        <div className="saved-game-actions-row">
          <button className="primary-button" onClick={onSave}>
            Save Notes
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
      </div>
    </div>
  );
}
