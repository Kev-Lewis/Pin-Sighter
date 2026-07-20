import { describe, it, expect } from "vitest";
import type { FrameEntry, SavedGameRecord } from "../types";
import {
  getSavedGameBallSummary,
  getSavedGameScoreSummary,
  hasSavedGameNotes,
  createGameMetadataDraft,
} from "./savedGames";

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
    laneLabel: "5",
    bowlerNames: ["Kevin"],
    scores: [{ label: "Kevin", score: 210 }],
    entries: [entry({ frameNumber: 1 })],
    ...o,
  };
}

describe("getSavedGameBallSummary", () => {
  it("reports when no ball was logged", () => {
    expect(
      getSavedGameBallSummary(game({ entries: [entry({ frameNumber: 1, ballUsed: "" })] }))
    ).toBe("No ball logged");
  });

  it("joins one or two distinct balls", () => {
    const g = game({
      entries: [
        entry({ frameNumber: 1, ballUsed: "IQ Tour" }),
        entry({ frameNumber: 2, ballUsed: "Zen" }),
        entry({ frameNumber: 3, ballUsed: "IQ Tour" }),
      ],
    });
    expect(getSavedGameBallSummary(g)).toBe("IQ Tour, Zen");
  });

  it("summarizes three or more distinct balls with a +N more suffix", () => {
    const g = game({
      entries: [
        entry({ frameNumber: 1, ballUsed: "IQ Tour" }),
        entry({ frameNumber: 2, ballUsed: "Zen" }),
        entry({ frameNumber: 3, ballUsed: "Phaze" }),
        entry({ frameNumber: 4, ballUsed: "Hustle" }),
      ],
    });
    expect(getSavedGameBallSummary(g)).toBe("IQ Tour, Zen +2 more");
  });
});

describe("getSavedGameScoreSummary", () => {
  it("joins each score label and value with bullets", () => {
    const g = game({
      scores: [
        { label: "Kevin", score: 210 },
        { label: "Sam", score: 185 },
      ],
    });
    expect(getSavedGameScoreSummary(g)).toBe("Kevin: 210 • Sam: 185");
  });
});

describe("hasSavedGameNotes", () => {
  it("is false when every note field is empty/absent", () => {
    expect(hasSavedGameNotes(game())).toBe(false);
  });

  it("is true when any note field is populated", () => {
    expect(hasSavedGameNotes(game({ ballReactionNotes: "over/under" }))).toBe(true);
  });
});

describe("createGameMetadataDraft", () => {
  it("defaults every field to an empty string when absent", () => {
    expect(createGameMetadataDraft(game())).toEqual({
      gameNotes: "",
      ballReactionNotes: "",
      laneTransitionNotes: "",
      adjustmentNotes: "",
    });
  });

  it("copies through populated note fields", () => {
    const draft = createGameMetadataDraft(
      game({
        gameNotes: "solid",
        ballReactionNotes: "clean",
        laneTransitionNotes: "dried up",
        adjustmentNotes: "moved left",
      })
    );
    expect(draft).toEqual({
      gameNotes: "solid",
      ballReactionNotes: "clean",
      laneTransitionNotes: "dried up",
      adjustmentNotes: "moved left",
    });
  });
});
