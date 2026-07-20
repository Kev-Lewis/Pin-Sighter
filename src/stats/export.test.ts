import { describe, it, expect } from "vitest";
import type { FrameEntry } from "../types";
import { getFrameMarks } from "../lib/scoring";
import {
  formatScoreMarksForExport,
  formatScorecardFrameForExport,
  getUniqueBallSummary,
  buildStatsExportFileName,
} from "./export";

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

const baseFilters = {
  selectedBowler: "All",
  selectedBall: "All",
  selectedCompetition: "All",
  selectedEventName: "All",
  selectedCenter: "All",
  selectedLane: "All",
  selectedPattern: "All",
  selectedEventStage: "All",
  selectedSetKey: "All",
  selectedGameNumber: "All",
};

describe("formatScoreMarksForExport", () => {
  it("joins the non-empty mark values into one string", () => {
    expect(
      formatScoreMarksForExport([
        { value: "X" },
        { value: "" },
        { value: "9" },
      ] as ReturnType<typeof getFrameMarks>)
    ).toBe("X9");
  });

  it("returns an empty string when there are no marks", () => {
    expect(formatScoreMarksForExport([])).toBe("");
  });
});

describe("formatScorecardFrameForExport", () => {
  const strike = entry({ frameNumber: 1, firstShotKnockedPins: ALL });
  const markText = formatScoreMarksForExport(getFrameMarks(strike));

  it("returns an empty string when the frame is missing", () => {
    expect(formatScorecardFrameForExport(undefined, 30)).toBe("");
  });

  it("omits the score suffix when the cumulative score is undefined or blank", () => {
    expect(formatScorecardFrameForExport(strike, undefined)).toBe(markText);
    expect(formatScorecardFrameForExport(strike, "")).toBe(markText);
  });

  it("appends the cumulative score in parentheses when present", () => {
    expect(formatScorecardFrameForExport(strike, 30)).toBe(`${markText} (30)`);
  });
});

describe("getUniqueBallSummary", () => {
  it("lists distinct ball names in first-seen order", () => {
    const entries = [
      entry({ frameNumber: 1, ballUsed: "IQ Tour" }),
      entry({ frameNumber: 2, ballUsed: "Zen" }),
      entry({ frameNumber: 3, ballUsed: "IQ Tour" }),
    ];
    expect(getUniqueBallSummary(entries)).toBe("IQ Tour, Zen");
  });

  it("returns an empty string when no balls are logged", () => {
    expect(
      getUniqueBallSummary([entry({ frameNumber: 1, ballUsed: "" })])
    ).toBe("");
  });
});

describe("buildStatsExportFileName", () => {
  it("falls back to the base name with just the extension when nothing is filtered", () => {
    expect(buildStatsExportFileName(baseFilters, "csv")).toBe(
      "pin-sighter-stats.csv"
    );
  });

  it("slugifies active filters into the name and honors the extension", () => {
    expect(
      buildStatsExportFileName(
        { ...baseFilters, selectedBowler: "Kevin Lewis" },
        "html"
      )
    ).toBe("pin-sighter-stats_kevin-lewis.html");
  });

  it("encodes a selected game number and a selected set marker", () => {
    expect(
      buildStatsExportFileName(
        { ...baseFilters, selectedGameNumber: "3", selectedSetKey: "s1" },
        "xlsx"
      )
    ).toBe("pin-sighter-stats_selected-set_game-3.xlsx");
  });
});
