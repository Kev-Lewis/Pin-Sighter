import { describe, it, expect } from "vitest";
import type { FrameEntry, SavedGameRecord } from "../types";
import type { SessionGroup } from "../lib/sessions";
import {
  getScoreBinLabel,
  getSeriesBinLabel,
  getScoredFrameValues,
  calculateAverageFrameScoreRows,
  calculateAverageByGameRows,
  getGameScoreItems,
  getThreeGameSeriesTotals,
  calculateScoreDistribution,
} from "./distribution";

// For distribution/averages, only roll COUNTS matter (scoring uses lengths), so
// count-based fixtures are fine here (unlike the classifier tests).
const pins = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

function frameEntry(frameNumber: number, first: number, second = 0): FrameEntry {
  return {
    ballUsed: "",
    footBoard: "",
    targetArrow: "",
    targetBreakpoint: "",
    actualArrow: "",
    actualBreakpoint: "",
    bowlerName: "Kevin",
    firstShotKnockedPins: pins(first),
    secondShotKnockedPins: pins(second),
    thirdShotKnockedPins: [],
    isComplete: true,
    frameNumber,
  };
}

// A full game of open nines → scores 90.
const openNineEntries = Array.from({ length: 10 }, (_, i) => frameEntry(i + 1, 9, 0));

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
    eventName: "",
    eventStageLabel: "",
    gameNumber: 1,
    laneLabel: "1",
    bowlerNames: ["Kevin"],
    scores: [],
    ...o,
  };
}

function scoredGame(gameNumber: number, score: number): SavedGameRecord {
  return game({ gameNumber, entries: [], scores: [{ label: "Kevin", score }] });
}

describe("getScoreBinLabel", () => {
  it("maps game scores to 25-wide bins", () => {
    expect(getScoreBinLabel(0)).toBe("U/100");
    expect(getScoreBinLabel(99)).toBe("U/100");
    expect(getScoreBinLabel(100)).toBe("100-124");
    expect(getScoreBinLabel(124)).toBe("100-124");
    expect(getScoreBinLabel(199)).toBe("175-199");
    expect(getScoreBinLabel(200)).toBe("200-224");
    expect(getScoreBinLabel(299)).toBe("275-299");
    expect(getScoreBinLabel(300)).toBe("300");
  });
});

describe("getSeriesBinLabel", () => {
  it("maps series totals to 50-wide bins", () => {
    expect(getSeriesBinLabel(399)).toBe("U/400");
    expect(getSeriesBinLabel(400)).toBe("400-449");
    expect(getSeriesBinLabel(749)).toBe("700-749");
    expect(getSeriesBinLabel(799)).toBe("750-799");
    expect(getSeriesBinLabel(800)).toBe("800-900");
  });
});

describe("getScoredFrameValues", () => {
  it("returns the incremental score for each frame", () => {
    const rows = getScoredFrameValues(openNineEntries);
    expect(rows).toHaveLength(10);
    expect(rows.every((r) => r.frameScore === 9)).toBe(true);
    expect(rows[0].frameNumber).toBe(1);
  });
});

describe("getGameScoreItems", () => {
  it("scores each of the bowler's games", () => {
    const items = getGameScoreItems([game({ entries: openNineEntries })], "Kevin", "All");
    expect(items).toEqual([{ gameNumber: 1, score: 90 }]);
  });
  it("skips games the bowler didn't play", () => {
    const items = getGameScoreItems([game({ entries: openNineEntries })], "Nobody", "All");
    expect(items).toEqual([]);
  });
});

describe("calculateAverageByGameRows", () => {
  it("rolls up average/high/low per game number", () => {
    const rows = calculateAverageByGameRows([game({ entries: openNineEntries })], "Kevin", "All");
    expect(rows).toEqual([
      { gameNumber: 1, count: 1, average: 90, high: 90, low: 90 },
    ]);
  });
});

describe("calculateAverageFrameScoreRows", () => {
  it("averages each frame position across games", () => {
    const rows = calculateAverageFrameScoreRows([game({ entries: openNineEntries })], "Kevin", "All");
    expect(rows).toHaveLength(10);
    expect(rows[0]).toEqual({ frameNumber: 1, average: 9, count: 1 });
  });
});

describe("getThreeGameSeriesTotals", () => {
  it("sums each sliding 3-game window of a bowler's scores", () => {
    const session: SessionGroup = {
      sessionKey: "s",
      title: "League — Singles",
      centerName: "Titan Bowl",
      patternName: "Custom",
      games: [scoredGame(1, 200), scoredGame(2, 200), scoredGame(3, 200)],
    };
    expect(getThreeGameSeriesTotals([session], "Kevin")).toEqual([600]);
  });
  it("ignores sessions shorter than three games", () => {
    const session: SessionGroup = {
      sessionKey: "s",
      title: "",
      centerName: "",
      patternName: "",
      games: [scoredGame(1, 200), scoredGame(2, 200)],
    };
    expect(getThreeGameSeriesTotals([session], "Kevin")).toEqual([]);
  });
});

describe("calculateScoreDistribution", () => {
  it("bins a bowler's game scores", () => {
    const result = calculateScoreDistribution(
      [game({ entries: openNineEntries })],
      [],
      "Kevin",
      "All"
    );
    const underHundred = result.gameRows.find((r) => r.label === "U/100")!;
    expect(underHundred.total).toBe(1);
    expect(underHundred.percentage).toBe(100);
    // every other bin is empty
    const others = result.gameRows.filter((r) => r.label !== "U/100");
    expect(others.every((r) => r.total === 0)).toBe(true);
  });
});
