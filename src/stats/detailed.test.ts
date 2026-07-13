import { describe, it, expect } from "vitest";
import type { FrameEntry, SavedGameRecord, Handedness } from "../types";
import { buildSessionGroups } from "../lib/sessions";
import { calculateDetailedBowlerStats, buildDetailedStatCards } from "./detailed";

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

const handedness = new Map<string, Handedness>([["Kevin", "Right"]]);

describe("calculateDetailedBowlerStats", () => {
  const games = [perfectGame];
  const stats = calculateDetailedBowlerStats(
    "Kevin",
    "All",
    games,
    buildSessionGroups(games),
    handedness
  );

  it("counts games, frames, and total pins", () => {
    expect(stats.numGames).toBe(1);
    expect(stats.frames).toBe(10);
    expect(stats.firstShots).toBe(10);
    expect(stats.totalPins).toBe(300);
    expect(stats.average).toBe(300);
  });

  it("classifies every frame of a perfect game as a strike", () => {
    expect(stats.strikes).toBe(10);
    expect(stats.spares).toBe(0);
    expect(stats.opens).toBe(0);
    expect(stats.splits).toBe(0);
  });

  it("treats a perfect game as all pocket strikes and fully clean", () => {
    expect(stats.pocketHits).toBe(10);
    expect(stats.pocketStrikes).toBe(10);
    expect(stats.cleanFrames).toBe(10);
    expect(stats.cleanPercentage).toBe(100);
    expect(stats.cleanGames).toBe(1);
  });

  it("computes first-ball totals", () => {
    expect(stats.totalFirstBallPins).toBe(100);
    expect(stats.firstBallAverage).toBe(10);
  });
});

describe("buildDetailedStatCards", () => {
  it("builds a non-empty set of well-formed stat cards", () => {
    const games = [perfectGame];
    const stats = calculateDetailedBowlerStats(
      "Kevin",
      "All",
      games,
      buildSessionGroups(games),
      handedness
    );
    const cards = buildDetailedStatCards(stats, "All");
    expect(cards.length).toBeGreaterThan(0);
    cards.forEach((card) => {
      expect(typeof card.title).toBe("string");
      expect(typeof card.value).toBe("string");
      expect(Array.isArray(card.detailRows)).toBe(true);
    });
  });
});
