// Frame-editing helpers — deep-cloning a frame entry for editing and detecting
// whether an edited set of entries differs from the original (order-independent
// per shot). Extracted from App.tsx; cloneFrameEntryForEditing is shared by
// GameEntryPage, CompletedGamesList, and StatsPage; the change-detection pair
// is used by the SavedFrameEditModal.

import type { FrameEntry } from "../types";

export function cloneFrameEntryForEditing(entry: FrameEntry): FrameEntry {
  return {
    ...entry,
    firstShotKnockedPins: [...entry.firstShotKnockedPins],
    secondShotKnockedPins: [...entry.secondShotKnockedPins],
    thirdShotKnockedPins: [...entry.thirdShotKnockedPins],
  };
}

export function normalizeFrameEntryForComparison(entry: FrameEntry) {
  return {
    ...entry,
    firstShotKnockedPins: [...entry.firstShotKnockedPins].sort((a, b) => a - b),
    secondShotKnockedPins: [...entry.secondShotKnockedPins].sort(
      (a, b) => a - b
    ),
    thirdShotKnockedPins: [...entry.thirdShotKnockedPins].sort((a, b) => a - b),
  };
}

export function frameEntriesHaveChanges(
  editedEntries: FrameEntry[],
  originalEntries: FrameEntry[]
) {
  return (
    JSON.stringify(editedEntries.map(normalizeFrameEntryForComparison)) !==
    JSON.stringify(originalEntries.map(normalizeFrameEntryForComparison))
  );
}
