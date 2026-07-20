import { describe, it, expect } from "vitest";
import type { Center, FrameEntry, SavedGameRecord } from "../types";
import { buildSessionGroups } from "../lib/sessions";
import {
  createSetMetadataDraft,
  getUniqueMetadataOptions,
  buildMetadataLaneOptions,
} from "./setMetadata";

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

function game(o: Partial<SavedGameRecord> = {}): SavedGameRecord {
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
    eventName: "League",
    eventStageLabel: "Week 1",
    gameNumber: 1,
    laneLabel: "Pair 5/6",
    bowlerNames: ["Kevin"],
    scores: [{ label: "Kevin", score: 210 }],
    entries: [entry({ frameNumber: 1 })],
    setNotes: "",
    ...o,
  };
}

const center: Center = { id: 1, name: "Titan Bowl", laneCount: 8, notes: "" };

describe("getUniqueMetadataOptions", () => {
  it("dedupes, drops blanks, and sorts alphabetically", () => {
    expect(getUniqueMetadataOptions("", ["Zen", "", "Ace", "Zen"])).toEqual([
      "Ace",
      "Zen",
    ]);
  });

  it("prepends the current value when it isn't already an option", () => {
    expect(getUniqueMetadataOptions("Custom", ["Ace", "Zen"])).toEqual([
      "Custom",
      "Ace",
      "Zen",
    ]);
  });

  it("does not duplicate the current value when already present", () => {
    expect(getUniqueMetadataOptions("Ace", ["Ace", "Zen"])).toEqual([
      "Ace",
      "Zen",
    ]);
  });
});

describe("createSetMetadataDraft", () => {
  it("pulls center/pattern/notes from the first game and maps lane labels by game id", () => {
    const session = buildSessionGroups([game()])[0];
    const draft = createSetMetadataDraft(session);
    expect(draft.centerName).toBe("Titan Bowl");
    expect(draft.patternName).toBe("Custom");
    expect(draft.setNotes).toBe("");
    expect(draft.gameLaneLabels).toEqual({ g1: "Pair 5/6" });
  });

  it("spreads a comma-joined lane label across games one-to-one", () => {
    const games = [
      game({ id: "g1", gameNumber: 1, laneLabel: "Pair 5/6, Pair 7/8" }),
      game({ id: "g2", gameNumber: 2, laneLabel: "Pair 5/6, Pair 7/8" }),
    ];
    const session = buildSessionGroups(games)[0];
    const draft = createSetMetadataDraft(session);
    expect(draft.gameLaneLabels).toEqual({ g1: "Pair 5/6", g2: "Pair 7/8" });
  });
});

describe("buildMetadataLaneOptions", () => {
  it("generates pair options for the center and sorts them numerically", () => {
    const session = buildSessionGroups([game({ laneLabel: "Pair 5/6" })])[0];
    const options = buildMetadataLaneOptions("Titan Bowl", [center], session, [
      "Pair 5/6",
    ]);
    expect(options).toEqual([
      "Pair 1/2",
      "Pair 3/4",
      "Pair 5/6",
      "Pair 7/8",
    ]);
  });

  it("switches to single-lane options when the set was logged by lane", () => {
    const session = buildSessionGroups([game({ laneLabel: "Lane 3" })])[0];
    const options = buildMetadataLaneOptions("Titan Bowl", [center], session, [
      "Lane 3",
    ]);
    expect(options).toEqual([
      "Lane 1",
      "Lane 2",
      "Lane 3",
      "Lane 4",
      "Lane 5",
      "Lane 6",
      "Lane 7",
      "Lane 8",
    ]);
  });
});
