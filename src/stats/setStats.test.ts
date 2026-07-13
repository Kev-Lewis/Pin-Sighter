import { describe, it, expect } from "vitest";
import type { FrameEntry, SavedGameRecord, Handedness } from "../types";
import { buildSessionGroups } from "../lib/sessions";
import { calculateDetailedBowlerStats } from "./detailed";
import {
  buildSetFilterOptions,
  calculateTeamSetRows,
  buildSetStatCards,
} from "./setStats";

function entry(o: Partial<FrameEntry> & { frameNumber: number }): FrameEntry {
  return {
    ballUsed: "IQ Tour",
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

const perfectGame: SavedGameRecord = {
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
  eventName: "League",
  eventStageLabel: "Week 1",
  gameNumber: 1,
  laneLabel: "5",
  bowlerNames: ["Kevin"],
  scores: [{ label: "Kevin", score: 300 }],
  entries: Array.from({ length: 10 }, (_, i) =>
    entry({ frameNumber: i + 1, firstShotKnockedPins: ALL })
  ),
};

describe("calculateTeamSetRows", () => {
  it("summarizes a one-game set", () => {
    const rows = calculateTeamSetRows(buildSessionGroups([perfectGame]));
    expect(rows).toHaveLength(1);
    const r = rows[0];
    expect(r.games).toBe(1);
    expect(r.teamSetTotal).toBe(300);
    expect(r.teamGameAverage).toBe(300);
    expect(r.highTeamGame).toBe(300);
    expect(r.frames).toBe(10);
    expect(r.strikes).toBe(10);
    expect(r.spares).toBe(0);
    expect(r.opens).toBe(0);
    expect(r.cleanRate).toBe(100);
    expect(r.splitRate).toBe(0);
    expect(r.cleanTeamGames).toBe(1);
  });
});

describe("buildSetFilterOptions", () => {
  it("labels each set with game count and center", () => {
    const opts = buildSetFilterOptions([perfectGame]);
    expect(opts).toHaveLength(1);
    expect(opts[0].label).toContain("1 game");
    expect(opts[0].label).toContain("Titan Bowl");
  });
});

describe("buildSetStatCards", () => {
  it("builds well-formed per-set stat cards for a bowler", () => {
    const stats = calculateDetailedBowlerStats(
      "Kevin",
      "All",
      [perfectGame],
      buildSessionGroups([perfectGame]),
      new Map<string, Handedness>([["Kevin", "Right"]])
    );
    const cards = buildSetStatCards({
      stats,
      selectedBowler: "Kevin",
      selectedBall: "All",
      games: [perfectGame],
    });
    expect(cards.length).toBeGreaterThan(0);
    cards.forEach((card) => {
      expect(typeof card.title).toBe("string");
      expect(typeof card.value).toBe("string");
    });
  });
});
