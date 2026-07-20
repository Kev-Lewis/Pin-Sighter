import { describe, it, expect } from "vitest";
import type { FrameEntry, SavedGameRecord } from "../types";
import {
  getBakerEntryStatCounts,
  summarizeBakerEntries,
  calculateBakerTeamSummaryRows,
  calculateBakerPositionRows,
  calculateBakerBowlerRows,
  getEntryResultLabel,
} from "./baker";

function entry(
  o: Partial<FrameEntry> & { frameNumber: number; bowlerName: string }
): FrameEntry {
  return {
    ballUsed: "IQ Tour",
    footBoard: "",
    targetArrow: "",
    targetBreakpoint: "",
    actualArrow: "",
    actualBreakpoint: "",
    firstShotKnockedPins: [],
    secondShotKnockedPins: [],
    thirdShotKnockedPins: [],
    isComplete: true,
    ...o,
  };
}
const ALL = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const strike = entry({ frameNumber: 1, bowlerName: "A", firstShotKnockedPins: ALL });
const spare = entry({
  frameNumber: 2,
  bowlerName: "B",
  firstShotKnockedPins: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  secondShotKnockedPins: [10],
});
const open = entry({
  frameNumber: 3,
  bowlerName: "C",
  firstShotKnockedPins: [1, 2, 3, 4, 5, 6, 7],
  secondShotKnockedPins: [8, 9],
});

// A 10-frame Baker game, all strikes, three bowlers rotating A/B/C.
const bakerGame: SavedGameRecord = {
  id: "bg1",
  sessionId: "s1",
  savedAt: "2026-07-01T12:00:00.000Z",
  competitionType: "Tournament",
  format: "Baker",
  bowlersPerTeam: 3,
  centerName: "Titan Bowl",
  patternName: "Custom",
  eventLogKey: "",
  eventId: null,
  eventName: "Tournament",
  eventStageLabel: "Finals",
  gameNumber: 1,
  laneLabel: "5",
  bowlerNames: ["A", "B", "C"],
  scores: [{ label: "Baker Team", score: 300 }],
  entries: Array.from({ length: 10 }, (_, i) =>
    entry({ frameNumber: i + 1, bowlerName: ["A", "B", "C"][i % 3], firstShotKnockedPins: ALL })
  ),
};

describe("getEntryResultLabel", () => {
  it("labels a frame by outcome", () => {
    expect(getEntryResultLabel(strike)).toBe("Strike");
    expect(getEntryResultLabel(spare)).toBe("Spare");
    expect(getEntryResultLabel(open)).toBe("Open");
  });
});

describe("getBakerEntryStatCounts", () => {
  it("counts a single strike frame", () => {
    expect(getBakerEntryStatCounts(strike)).toEqual({
      strikes: 1,
      spares: 0,
      opens: 0,
      splits: 0,
      cleanFrames: 1,
    });
  });
});

describe("summarizeBakerEntries", () => {
  it("sums counts across entries", () => {
    expect(summarizeBakerEntries([strike, spare, open])).toEqual({
      strikes: 1,
      spares: 1,
      opens: 1,
      splits: 0,
      cleanFrames: 2,
    });
  });
});

describe("calculateBakerTeamSummaryRows", () => {
  it("summarizes a perfect Baker game", () => {
    const rows = calculateBakerTeamSummaryRows([bakerGame]);
    expect(rows).toEqual([
      {
        teamName: "Baker Team: A, B, C",
        games: 1,
        average: 300,
        highGame: 300,
        frames: 10,
        strikes: 10,
        spares: 0,
        opens: 0,
        splits: 0,
        cleanRate: 100,
        cleanGames: 1,
      },
    ]);
  });
});

describe("calculateBakerPositionRows", () => {
  it("splits frames across the rotation positions", () => {
    const rows = calculateBakerPositionRows([bakerGame], "All", "All");
    expect(rows).toHaveLength(3);
    expect(rows[0]).toEqual({
      position: 1,
      bowlers: "A",
      frames: 4,
      strikes: 4,
      spares: 0,
      opens: 0,
      splits: 0,
      cleanRate: 100,
    });
  });
});

describe("calculateBakerBowlerRows", () => {
  it("rolls up each bowler's frames", () => {
    const rows = calculateBakerBowlerRows([bakerGame]);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toEqual({
      bowlerName: "A",
      frames: 4,
      strikes: 4,
      spares: 0,
      opens: 0,
      splits: 0,
      cleanRate: 100,
      balls: "IQ Tour",
    });
  });
});
