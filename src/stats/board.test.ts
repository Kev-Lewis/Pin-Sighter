import { describe, it, expect } from "vitest";
import type { FrameEntry, SavedGameRecord } from "../types";
import {
  parseBoardValue,
  averageValues,
  calculateMiss,
  formatMaybeNumber,
  formatSignedNumber,
  formatPercentValue,
  calculateBoardHitRate,
  createBoardShotRow,
  hasBoardData,
  summarizeBoardRows,
  calculateBoardStats,
  calculateBoardProgressionRows,
} from "./board";

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

// A frame with full board data: arrow miss +2, breakpoint miss +1.
const boardEntry = entry({
  frameNumber: 1,
  ballUsed: "IQ Tour",
  footBoard: "20",
  targetArrow: "15",
  actualArrow: "17",
  targetBreakpoint: "8",
  actualBreakpoint: "9",
});

function game(o: Partial<SavedGameRecord> & { entries: FrameEntry[] }): SavedGameRecord {
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
    eventName: "Winter League",
    eventStageLabel: "Week 1",
    gameNumber: 1,
    laneLabel: "5",
    bowlerNames: ["Kevin"],
    scores: [],
    ...o,
  };
}

describe("parseBoardValue", () => {
  it("parses numbers and rejects non-numeric junk", () => {
    expect(parseBoardValue("15")).toBe(15);
    expect(parseBoardValue("abc")).toBe(null);
    // NOTE: current behavior — Number("") === 0, so an empty field parses to 0,
    // not null. (Documents existing behavior; see the empty-board caveat.)
    expect(parseBoardValue("")).toBe(0);
  });
});

// A frame whose board fields are non-numeric → all null (the only way a row has
// no board data, since "" parses to 0).
const noBoardEntry = entry({
  frameNumber: 2,
  footBoard: "-",
  targetArrow: "-",
  actualArrow: "-",
  targetBreakpoint: "-",
  actualBreakpoint: "-",
});

describe("averageValues", () => {
  it("averages present values, ignoring nulls", () => {
    expect(averageValues([10, 20, null])).toBe(15);
    expect(averageValues([null])).toBe(null);
    expect(averageValues([])).toBe(null);
  });
});

describe("calculateMiss", () => {
  it("is actual minus target, or null if either is missing", () => {
    expect(calculateMiss(17, 15)).toBe(2);
    expect(calculateMiss(null, 15)).toBe(null);
    expect(calculateMiss(17, null)).toBe(null);
  });
});

describe("formatters", () => {
  it("formatMaybeNumber", () => {
    expect(formatMaybeNumber(null)).toBe("—");
    expect(formatMaybeNumber(12.34)).toBe("12.3");
  });
  it("formatSignedNumber", () => {
    expect(formatSignedNumber(null)).toBe("—");
    expect(formatSignedNumber(2)).toBe("+2.0");
    expect(formatSignedNumber(-1.5)).toBe("-1.5");
    expect(formatSignedNumber(0)).toBe("0.0");
  });
  it("formatPercentValue", () => {
    expect(formatPercentValue(null)).toBe("—");
    expect(formatPercentValue(50)).toBe("50.0%");
  });
});

describe("calculateBoardHitRate", () => {
  it("percentage within tolerance of target (0 miss)", () => {
    expect(calculateBoardHitRate([0, 1])).toBe(100); // both within 1
    expect(calculateBoardHitRate([0, 2])).toBe(50); // only the 0 is within 1
    expect(calculateBoardHitRate([null])).toBe(null);
  });
});

describe("createBoardShotRow / hasBoardData", () => {
  it("derives misses and flags rows with data", () => {
    const row = createBoardShotRow(boardEntry);
    expect(row.footBoard).toBe(20);
    expect(row.arrowMiss).toBe(2);
    expect(row.breakpointMiss).toBe(1);
    expect(hasBoardData(row)).toBe(true);
    expect(hasBoardData(createBoardShotRow(noBoardEntry))).toBe(false);
  });
});

describe("summarizeBoardRows", () => {
  it("summarizes a single row into averages + hit rates", () => {
    const summary = summarizeBoardRows([createBoardShotRow(boardEntry)]);
    expect(summary.averageTargetArrow).toBe(15);
    expect(summary.averageArrowMiss).toBe(2);
    expect(summary.averageAbsoluteArrowMiss).toBe(2);
    expect(summary.arrowHitRate).toBe(0); // miss of 2 is outside tolerance 1
    expect(summary.breakpointHitRate).toBe(100); // miss of 1 is within tolerance
  });
});

describe("calculateBoardStats", () => {
  it("counts tracked shots and groups by ball", () => {
    const stats = calculateBoardStats([boardEntry]);
    expect(stats.trackedShots).toBe(1);
    expect(stats.byBallRows).toHaveLength(1);
    expect(stats.byBallRows[0].ball).toBe("IQ Tour");
    expect(stats.recentRows).toHaveLength(1);
  });
  it("is empty when no board data is present", () => {
    const stats = calculateBoardStats([noBoardEntry]);
    expect(stats.trackedShots).toBe(0);
    expect(stats.byBallRows).toHaveLength(0);
  });
});

describe("calculateBoardProgressionRows", () => {
  it("builds one row per game that has board data", () => {
    const rows = calculateBoardProgressionRows(
      [game({ entries: [boardEntry] })],
      "All",
      "All"
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].gameNumber).toBe(1);
    expect(rows[0].laneLabel).toBe("5");
    expect(rows[0].shots).toBe(1);
    expect(rows[0].sessionTitle).toBe("Winter League — Week 1");
  });
  it("drops games with no board data", () => {
    const rows = calculateBoardProgressionRows(
      [game({ entries: [noBoardEntry] })],
      "All",
      "All"
    );
    expect(rows).toHaveLength(0);
  });
});
