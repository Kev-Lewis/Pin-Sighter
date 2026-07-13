// Frame classifiers + pocket/handedness — pure predicates over a FrameEntry.
// Extracted from App.tsx (stats decomposition, phase 1). Depends only on the
// scoring engine and the domain types. Shared by StatsPage and the Home
// dashboard's strike-rate.

import type { FrameEntry, Handedness, SavedGameRecord } from "../types";
import { isSplitLeave, getPinsStanding } from "../lib/scoring";

export function isStrikeEntry(entry: FrameEntry) {
  return entry.firstShotKnockedPins.length === 10;
}

export function isSplitEntry(entry: FrameEntry) {
  return !isStrikeEntry(entry) && isSplitLeave(entry.firstShotKnockedPins);
}

export function isCleanGameForEntries(entries: FrameEntry[]) {
  const frames = entries.filter(
    (entry) => entry.frameNumber >= 1 && entry.frameNumber <= 10
  );

  return frames.length === 10 && frames.every(isCleanFrame);
}

export function countCleanGames(
  games: SavedGameRecord[],
  selectedBowler: string,
  selectedBall: string
) {
  return games.filter((game) => {
    const relevantEntries = game.entries.filter((entry) => {
      const matchesBowler =
        selectedBowler === "All" || entry.bowlerName === selectedBowler;
      const matchesBall =
        selectedBall === "All" || entry.ballUsed === selectedBall;

      return matchesBowler && matchesBall;
    });

    if (selectedBowler === "All") {
      if (game.format === "Baker") {
        return isCleanGameForEntries(relevantEntries);
      }

      const entriesByBowler = new Map<string, FrameEntry[]>();

      relevantEntries.forEach((entry) => {
        const currentEntries = entriesByBowler.get(entry.bowlerName) ?? [];
        entriesByBowler.set(entry.bowlerName, [...currentEntries, entry]);
      });

      return Array.from(entriesByBowler.values()).some(isCleanGameForEntries);
    }

    return isCleanGameForEntries(relevantEntries);
  }).length;
}

export function isSpareAttemptEntry(entry: FrameEntry) {
  return !isStrikeEntry(entry);
}

export function isSpareEntry(entry: FrameEntry) {
  if (isStrikeEntry(entry)) {
    return false;
  }

  const firstShotStandingPins = getPinsStanding(entry.firstShotKnockedPins);
  const pinsStandingAfterFrame = firstShotStandingPins.filter(
    (pin) => !entry.secondShotKnockedPins.includes(pin)
  );

  return pinsStandingAfterFrame.length === 0;
}

export function isCleanFrame(entry: FrameEntry) {
  return isStrikeEntry(entry) || isSpareEntry(entry);
}

export function getBowlerHandedness(
  bowlerName: string,
  bowlerHandednessByName: Map<string, Handedness>
) {
  return bowlerHandednessByName.get(bowlerName) ?? "Right";
}

export function getPocketContactPins(handedness: Handedness) {
  // LaneTalk-style pocket proxy:
  // right-handed pocket = 1/3 contact on first ball,
  // left-handed pocket = 1/2 contact on first ball.
  return handedness === "Left" ? [1, 2] : [1, 3];
}

export function isPocketHit(entry: FrameEntry, handedness: Handedness) {
  const pocketPins = getPocketContactPins(handedness);

  return pocketPins.every((pin) => entry.firstShotKnockedPins.includes(pin));
}

export function isPocketStrike(entry: FrameEntry, handedness: Handedness) {
  return isPocketHit(entry, handedness) && isStrikeEntry(entry);
}

export function isMakeableSpareAttempt(entry: FrameEntry) {
  if (isStrikeEntry(entry)) {
    return false;
  }

  const standingPins = getPinsStanding(entry.firstShotKnockedPins);

  return standingPins.length <= 3;
}
