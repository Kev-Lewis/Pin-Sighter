// useSavedSetEditing — the Saved Sets state machine lifted out of StatsPage
// (shell lift, stage 6): per-set + per-game metadata edit drafts, the
// frame-editor working state, and the set/game mutation handlers (save, delete,
// completion status). Extracted following the same pattern as useStatsExport —
// StatsPage passes the data + write callbacks in and consumes the returned API.
// continueSavedSet stays in StatsPage (it uses App-module-level lane helpers)
// and calls this hook's getSavedSetCompletionStatus.

import { useState, type Dispatch, type SetStateAction } from "react";
import type {
  SavedGameRecord,
  FrameEntry,
  EventSetup,
  SavedEventLog,
} from "../types";
import type { StatsFilters } from "../lib/statsFilters";
import { buildSessionGroups, type SessionGroup } from "../lib/sessions";
import { calculateScoresForGame } from "../lib/scoring";
import { cloneFrameEntryForEditing } from "../lib/frameEditing";
import { createGameMetadataDraft } from "./savedGames";
import { createSetMetadataDraft } from "./setMetadata";
import type { SetMetadataDraft, GameMetadataDraft } from "./types";

export type SavedSetEditingData = {
  savedGames: SavedGameRecord[];
  sessionGroups: SessionGroup[];
  events: EventSetup[];
  selectedGameNumber: string;
  setFilters: Dispatch<SetStateAction<StatsFilters>>;
  setSavedGames: Dispatch<SetStateAction<SavedGameRecord[]>>;
  setSavedEventLogs: Dispatch<SetStateAction<SavedEventLog[]>>;
  onToast: (message: string) => void;
};

export function useSavedSetEditing(data: SavedSetEditingData) {
  const {
    savedGames,
    sessionGroups,
    events,
    selectedGameNumber,
    setFilters,
    setSavedGames,
    setSavedEventLogs,
    onToast,
  } = data;

  const [setMetadataDrafts, setSetMetadataDrafts] = useState<
    Record<string, SetMetadataDraft>
  >({});
  const [editingSetMetadataKey, setEditingSetMetadataKey] = useState<
    string | null
  >(null);
  const [gameMetadataDrafts, setGameMetadataDrafts] = useState<
    Record<string, GameMetadataDraft>
  >({});
  const [editingGameMetadataId, setEditingGameMetadataId] = useState<
    string | null
  >(null);
  const [frameEditorGameId, setFrameEditorGameId] = useState<string | null>(
    null
  );
  const [frameEditorEntries, setFrameEditorEntries] = useState<FrameEntry[]>(
    []
  );
  const [frameEditorIndex, setFrameEditorIndex] = useState(0);

  const frameEditorGame =
    frameEditorGameId !== null
      ? savedGames.find((game) => game.id === frameEditorGameId) ?? null
      : null;

  function getSetMetadataDraft(
    session: ReturnType<typeof buildSessionGroups>[number]
  ) {
    return (
      setMetadataDrafts[session.sessionKey] ?? createSetMetadataDraft(session)
    );
  }

  function hasSetMetadataChanges(
    session: ReturnType<typeof buildSessionGroups>[number]
  ) {
    return (
      JSON.stringify(getSetMetadataDraft(session)) !==
      JSON.stringify(createSetMetadataDraft(session))
    );
  }

  function updateSetMetadataDraft(
    session: ReturnType<typeof buildSessionGroups>[number],
    field: keyof SetMetadataDraft,
    value: string
  ) {
    setSetMetadataDrafts((currentDrafts) => ({
      ...currentDrafts,
      [session.sessionKey]: {
        ...getSetMetadataDraft(session),
        [field]: value,
      },
    }));
  }

  function updateSetGameLaneDraft(
    session: ReturnType<typeof buildSessionGroups>[number],
    gameId: string,
    laneLabel: string
  ) {
    setSetMetadataDrafts((currentDrafts) => {
      const currentDraft = getSetMetadataDraft(session);

      return {
        ...currentDrafts,
        [session.sessionKey]: {
          ...currentDraft,
          gameLaneLabels: {
            ...currentDraft.gameLaneLabels,
            [gameId]: laneLabel,
          },
        },
      };
    });
  }

  function resetSetMetadataDraft(
    session: ReturnType<typeof buildSessionGroups>[number]
  ) {
    setSetMetadataDrafts((currentDrafts) => {
      const updatedDrafts = { ...currentDrafts };

      delete updatedDrafts[session.sessionKey];

      return updatedDrafts;
    });
  }

  function saveSetMetadata(
    session: ReturnType<typeof buildSessionGroups>[number]
  ) {
    const draft = getSetMetadataDraft(session);
    const gameIds = new Set(session.games.map((game) => game.id));
    const hasMissingLaneLabel = session.games.some(
      (game) => !draft.gameLaneLabels[game.id]?.trim()
    );

    if (!draft.centerName.trim() || !draft.patternName.trim() || hasMissingLaneLabel) {
      window.alert("Choose a bowling center, pattern, and lane/pair for each game before saving set data.");
      return;
    }

    setSavedGames((currentGames) =>
      currentGames.map((game) =>
        gameIds.has(game.id)
          ? {
              ...game,
              centerName: draft.centerName.trim() || game.centerName,
              patternName: draft.patternName.trim() || game.patternName,
              laneLabel:
                draft.gameLaneLabels[game.id]?.trim() || game.laneLabel,
              setNotes: draft.setNotes.trim(),
            }
          : game
      )
    );

    resetSetMetadataDraft(session);
    setEditingSetMetadataKey(null);
    onToast("Set data saved.");
  }

  function getGameMetadataDraft(game: SavedGameRecord) {
    return gameMetadataDrafts[game.id] ?? createGameMetadataDraft(game);
  }

  function hasGameNotesChanges(game: SavedGameRecord) {
    return (
      JSON.stringify(getGameMetadataDraft(game)) !==
      JSON.stringify(createGameMetadataDraft(game))
    );
  }

  function updateGameNotesDraft(
    game: SavedGameRecord,
    field: keyof GameMetadataDraft,
    value: string
  ) {
    setGameMetadataDrafts((currentDrafts) => ({
      ...currentDrafts,
      [game.id]: {
        ...getGameMetadataDraft(game),
        [field]: value,
      },
    }));
  }

  function resetGameMetadataDraft(game: SavedGameRecord) {
    setGameMetadataDrafts((currentDrafts) => {
      const updatedDrafts = { ...currentDrafts };

      delete updatedDrafts[game.id];

      return updatedDrafts;
    });
  }

  function saveGameMetadata(gameToUpdate: SavedGameRecord) {
    const draft = getGameMetadataDraft(gameToUpdate);

    setSavedGames((currentGames) =>
      currentGames.map((game) =>
        game.id === gameToUpdate.id
          ? {
              ...game,
              gameNotes: draft.gameNotes.trim(),
              ballReactionNotes: draft.ballReactionNotes.trim(),
              laneTransitionNotes: draft.laneTransitionNotes.trim(),
              adjustmentNotes: draft.adjustmentNotes.trim(),
            }
          : game
      )
    );

    resetGameMetadataDraft(gameToUpdate);
    setEditingGameMetadataId(null);
    onToast("Game notes saved.");
  }

  function openFrameEditor(game: SavedGameRecord) {
    setEditingGameMetadataId(null);
    setFrameEditorGameId(game.id);
    setFrameEditorEntries(
      game.entries.map((entry) => cloneFrameEntryForEditing(entry))
    );
    setFrameEditorIndex(0);
  }

  function closeFrameEditor() {
    setFrameEditorGameId(null);
    setFrameEditorEntries([]);
    setFrameEditorIndex(0);
  }

  function updateFrameEditorEntry(
    entryIndex: number,
    updatedFields: Partial<FrameEntry>
  ) {
    setFrameEditorEntries((currentEntries) =>
      currentEntries.map((entry, index) =>
        index === entryIndex ? { ...entry, ...updatedFields } : entry
      )
    );
  }

  function saveFrameEdits(gameToUpdate: SavedGameRecord) {
    const editedEntries = frameEditorEntries.map((entry) => ({
      ...entry,
      firstShotKnockedPins: [...entry.firstShotKnockedPins],
      secondShotKnockedPins: [...entry.secondShotKnockedPins],
      thirdShotKnockedPins: [...entry.thirdShotKnockedPins],
      isComplete: true,
    }));
    const recalculatedScores = calculateScoresForGame(
      editedEntries,
      gameToUpdate.bowlerNames,
      gameToUpdate.format
    );

    setSavedGames((currentGames) =>
      currentGames.map((game) =>
        game.id === gameToUpdate.id
          ? {
              ...game,
              entries: editedEntries,
              scores: recalculatedScores,
            }
          : game
      )
    );
    resetGameMetadataDraft(gameToUpdate);
    closeFrameEditor();
    onToast("Frame edits saved.");
  }

  function deleteSavedSet(sessionKey: string) {
    const session = sessionGroups.find((group) => group.sessionKey === sessionKey);

    if (!session) {
      return;
    }

    const shouldDelete = window.confirm(
      `Delete saved set: ${session.title}?`
    );

    if (!shouldDelete) {
      return;
    }

    const idsToDelete = new Set(session.games.map((game) => game.id));
    const eventKeysToCheck = Array.from(
      new Set(session.games.map((game) => game.eventLogKey).filter(Boolean))
    );

    const remainingGames = savedGames.filter((game) => !idsToDelete.has(game.id));

    setSavedGames(remainingGames);
    onToast("Saved set deleted.");

    eventKeysToCheck.forEach((eventLogKey) => {
      const stillHasEventLogRecords = remainingGames.some(
        (game) => game.eventLogKey === eventLogKey
      );

      if (!stillHasEventLogRecords) {
        setSavedEventLogs((currentLogs) =>
          currentLogs.filter((log) => log.key !== eventLogKey)
        );
      }
    });
  }

  function deleteSavedGame(
    session: ReturnType<typeof buildSessionGroups>[number],
    gameToDelete: SavedGameRecord
  ) {
    const shouldDelete = window.confirm(
      `Delete Game ${gameToDelete.gameNumber} from this saved set?`
    );

    if (!shouldDelete) {
      return;
    }

    const remainingGames = savedGames.filter(
      (game) => game.id !== gameToDelete.id
    );
    const remainingSessionGames = remainingGames.filter(
      (game) => game.sessionId === session.sessionKey
    );

    setSavedGames(remainingGames);
    onToast("Game deleted.");
    setSetMetadataDrafts((currentDrafts) => {
      const currentDraft = currentDrafts[session.sessionKey];

      if (!currentDraft) {
        return currentDrafts;
      }

      const updatedDrafts = { ...currentDrafts };
      const updatedGameLaneLabels = { ...currentDraft.gameLaneLabels };

      delete updatedGameLaneLabels[gameToDelete.id];

      if (remainingSessionGames.length === 0) {
        delete updatedDrafts[session.sessionKey];
      } else {
        updatedDrafts[session.sessionKey] = {
          ...currentDraft,
          gameLaneLabels: updatedGameLaneLabels,
        };
      }

      return updatedDrafts;
    });
    setGameMetadataDrafts((currentDrafts) => {
      const updatedDrafts = { ...currentDrafts };

      delete updatedDrafts[gameToDelete.id];

      return updatedDrafts;
    });

    if (editingGameMetadataId === gameToDelete.id) {
      setEditingGameMetadataId(null);
    }

    if (frameEditorGameId === gameToDelete.id) {
      closeFrameEditor();
    }

    if (selectedGameNumber === String(gameToDelete.gameNumber)) {
      setFilters((previous) => ({ ...previous, game: "All" }));
    }

    if (remainingSessionGames.length === 0) {
      setFilters((previous) => ({ ...previous, set: "All", game: "All" }));
      setEditingSetMetadataKey(null);
    }

    if (gameToDelete.eventLogKey) {
      const stillHasEventLogRecords = remainingGames.some(
        (game) => game.eventLogKey === gameToDelete.eventLogKey
      );

      if (!stillHasEventLogRecords) {
        setSavedEventLogs((currentLogs) =>
          currentLogs.filter((log) => log.key !== gameToDelete.eventLogKey)
        );
      }
    }
  }



  function getSavedSetCompletionStatus(
    session: ReturnType<typeof buildSessionGroups>[number]
  ) {
    const firstGame = session.games[0];

    if (!firstGame) {
      return {
        canContinue: false,
        label: "No games in this set",
      };
    }

    const highestGameNumber = Math.max(
      ...session.games.map((game) => game.gameNumber)
    );

    if (firstGame.competitionType === "Open") {
      return {
        canContinue: true,
        label: "Add another open bowling game",
      };
    }

    const event = events.find((currentEvent) => currentEvent.id === firstGame.eventId);
    const seriesGameCount = event?.seriesGameCount ?? null;

    if (seriesGameCount === null) {
      return {
        canContinue: false,
        label: "Series length unavailable",
      };
    }

    const gamesRemaining = Math.max(0, seriesGameCount - highestGameNumber);

    return {
      canContinue: gamesRemaining > 0,
      label:
        gamesRemaining > 0
          ? `Add ${gamesRemaining} remaining game${gamesRemaining === 1 ? "" : "s"}`
          : "Set complete",
    };
  }

  return {
    editingSetMetadataKey,
    setEditingSetMetadataKey,
    editingGameMetadataId,
    setEditingGameMetadataId,
    frameEditorEntries,
    frameEditorIndex,
    setFrameEditorIndex,
    frameEditorGame,
    getSetMetadataDraft,
    hasSetMetadataChanges,
    updateSetMetadataDraft,
    updateSetGameLaneDraft,
    resetSetMetadataDraft,
    saveSetMetadata,
    getGameMetadataDraft,
    hasGameNotesChanges,
    updateGameNotesDraft,
    resetGameMetadataDraft,
    saveGameMetadata,
    openFrameEditor,
    closeFrameEditor,
    updateFrameEditorEntry,
    saveFrameEdits,
    deleteSavedSet,
    deleteSavedGame,
    getSavedSetCompletionStatus,
  };
}
