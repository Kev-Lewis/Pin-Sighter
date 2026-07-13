import { describe, it, expect } from "vitest";
import type { FrameEntry, Handedness, SavedGameRecord } from "../types";
import {
  isStrikeEntry,
  isSplitEntry,
  isCleanFrame,
  isCleanGameForEntries,
  countCleanGames,
  isSpareAttemptEntry,
  isSpareEntry,
  getBowlerHandedness,
  getPocketContactPins,
  isPocketHit,
  isPocketStrike,
  isMakeableSpareAttempt,
} from "./frames";

// --- fixtures ----------------------------------------------------------------
// Pin-accurate frames: the classifiers care about WHICH pins are knocked, not
// just how many, so we spell out real pin sets (unlike scoring.test.ts).
function entry(o: Partial<FrameEntry> & { frameNumber: number }): FrameEntry {
  return {
    ballUsed: "",
    footBoard: "",
    targetArrow: "",
    targetBreakpoint: "",
    actualArrow: "",
    actualBreakpoint: "",
    bowlerName: "Kevin",
    firstShotKnockedPins: [],
    secondShotKnockedPins: [],
    thirdShotKnockedPins: [],
    isComplete: true,
    ...o,
  };
}

const ALL = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const strike = (f = 1) => entry({ frameNumber: f, firstShotKnockedPins: ALL });
// leave the 10 pin, then convert it
const spare = (f = 1) =>
  entry({
    frameNumber: f,
    firstShotKnockedPins: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    secondShotKnockedPins: [10],
  });
// leave 8-9-10, knock 8-9 → 10 left standing (open, not a split)
const open = (f = 1) =>
  entry({
    frameNumber: f,
    firstShotKnockedPins: [1, 2, 3, 4, 5, 6, 7],
    secondShotKnockedPins: [8, 9],
  });
// classic 7-10 split leave (head pin down, two isolated corners)
const splitLeave = (f = 1) =>
  entry({ frameNumber: f, firstShotKnockedPins: [1, 2, 3, 4, 5, 6, 8, 9] });

function savedGame(
  o: Partial<SavedGameRecord> & { entries: FrameEntry[] }
): SavedGameRecord {
  return {
    id: "g1",
    sessionId: "s1",
    savedAt: "2026-07-01T12:00:00.000Z",
    competitionType: "League",
    format: "Singles",
    bowlersPerTeam: 1,
    centerName: "Titan Bowl",
    patternName: "Custom",
    eventLogKey: "",
    eventId: null,
    eventName: "",
    eventStageLabel: "",
    gameNumber: 1,
    laneLabel: "1",
    bowlerNames: ["Kevin"],
    scores: [],
    ...o,
  };
}

// --- tests -------------------------------------------------------------------
describe("isStrikeEntry", () => {
  it("is true only when all ten fall on the first ball", () => {
    expect(isStrikeEntry(strike())).toBe(true);
    expect(isStrikeEntry(spare())).toBe(false);
    expect(isStrikeEntry(open())).toBe(false);
  });
});

describe("isSpareAttemptEntry", () => {
  it("is any non-strike frame", () => {
    expect(isSpareAttemptEntry(strike())).toBe(false);
    expect(isSpareAttemptEntry(spare())).toBe(true);
    expect(isSpareAttemptEntry(open())).toBe(true);
  });
});

describe("isSpareEntry", () => {
  it("is true when the leave is cleared on the second ball", () => {
    expect(isSpareEntry(spare())).toBe(true);
    expect(isSpareEntry(open())).toBe(false);
    expect(isSpareEntry(strike())).toBe(false);
  });
});

describe("isSplitEntry", () => {
  it("is true for a split leave, false for strikes and connected leaves", () => {
    expect(isSplitEntry(splitLeave())).toBe(true);
    expect(isSplitEntry(strike())).toBe(false);
    expect(isSplitEntry(open())).toBe(false);
  });
});

describe("isCleanFrame", () => {
  it("is a strike or a spare", () => {
    expect(isCleanFrame(strike())).toBe(true);
    expect(isCleanFrame(spare())).toBe(true);
    expect(isCleanFrame(open())).toBe(false);
    expect(isCleanFrame(splitLeave())).toBe(false);
  });
});

describe("isCleanGameForEntries", () => {
  it("needs exactly ten clean frames", () => {
    const tenStrikes = Array.from({ length: 10 }, (_, i) => strike(i + 1));
    expect(isCleanGameForEntries(tenStrikes)).toBe(true);
  });
  it("is false with fewer than ten frames", () => {
    const nine = Array.from({ length: 9 }, (_, i) => strike(i + 1));
    expect(isCleanGameForEntries(nine)).toBe(false);
  });
  it("is false when any frame is open", () => {
    const withOpen = [
      ...Array.from({ length: 9 }, (_, i) => strike(i + 1)),
      open(10),
    ];
    expect(isCleanGameForEntries(withOpen)).toBe(false);
  });
});

describe("countCleanGames", () => {
  const tenStrikes = Array.from({ length: 10 }, (_, i) => strike(i + 1));
  it("counts a clean game for the selected bowler", () => {
    const games = [savedGame({ entries: tenStrikes })];
    expect(countCleanGames(games, "Kevin", "All")).toBe(1);
  });
  it("does not count a game with an open frame", () => {
    const dirty = [
      ...Array.from({ length: 9 }, (_, i) => strike(i + 1)),
      open(10),
    ];
    expect(countCleanGames([savedGame({ entries: dirty })], "Kevin", "All")).toBe(0);
  });
});

describe("getBowlerHandedness", () => {
  it("reads the map and defaults to Right", () => {
    const map = new Map<string, Handedness>([["Dana", "Left"]]);
    expect(getBowlerHandedness("Dana", map)).toBe("Left");
    expect(getBowlerHandedness("Kevin", map)).toBe("Right");
  });
});

describe("pocket helpers", () => {
  it("pocket pins differ by hand", () => {
    expect(getPocketContactPins("Right")).toEqual([1, 3]);
    expect(getPocketContactPins("Left")).toEqual([1, 2]);
  });
  it("isPocketHit needs both pocket pins on the first ball", () => {
    expect(isPocketHit(strike(), "Right")).toBe(true); // 1 & 3 both fall
    const misses = entry({ frameNumber: 1, firstShotKnockedPins: [2, 4, 5] });
    expect(isPocketHit(misses, "Right")).toBe(false);
  });
  it("isPocketStrike is a pocket hit that strikes", () => {
    expect(isPocketStrike(strike(), "Right")).toBe(true);
    // pocket contact (1 & 3 down) but not a strike
    const tap = entry({
      frameNumber: 1,
      firstShotKnockedPins: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    });
    expect(isPocketStrike(tap, "Right")).toBe(false);
  });
});

describe("isMakeableSpareAttempt", () => {
  it("is true when three or fewer pins remain", () => {
    expect(isMakeableSpareAttempt(spare())).toBe(true); // leaves 1
    expect(isMakeableSpareAttempt(open())).toBe(true); // leaves 3 (8-9-10)
  });
  it("is false for a big leave and for strikes", () => {
    const bigLeave = entry({ frameNumber: 1, firstShotKnockedPins: [1, 2, 3] }); // leaves 7
    expect(isMakeableSpareAttempt(bigLeave)).toBe(false);
    expect(isMakeableSpareAttempt(strike())).toBe(false);
  });
});
