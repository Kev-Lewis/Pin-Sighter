import { describe, it, expect } from "vitest";
import type { HighSeriesDetail } from "../lib/sessions";
import {
  formatSetSavedDateTime,
  formatStatRatio,
  formatDetailedPercent,
  formatHighSeriesDetailRows,
} from "./format";

describe("formatStatRatio", () => {
  it("joins with a slash and thousands separators", () => {
    expect(formatStatRatio(3, 10)).toBe("3 / 10");
    expect(formatStatRatio(1500, 3000)).toBe("1,500 / 3,000");
  });
});

describe("formatDetailedPercent", () => {
  it("fixes to one decimal with a percent sign", () => {
    expect(formatDetailedPercent(58.33)).toBe("58.3%");
    expect(formatDetailedPercent(100)).toBe("100.0%");
  });
});

describe("formatSetSavedDateTime", () => {
  it("returns the raw string when it isn't a valid date", () => {
    expect(formatSetSavedDateTime("not-a-date")).toBe("not-a-date");
  });
});

describe("formatHighSeriesDetailRows", () => {
  it("returns a placeholder row when there's no detail", () => {
    expect(formatHighSeriesDetailRows(null)).toEqual([
      { label: "Series Games", value: "Not enough games tracked" },
    ]);
  });

  it("lists the event and one row per game", () => {
    const detail: HighSeriesDetail = {
      total: 600,
      eventLabel: "Winter League",
      games: [
        { gameNumber: 1, score: 200, laneLabel: "5", savedAt: "2026-07-01T12:00:00.000Z" },
        { gameNumber: 2, score: 200, laneLabel: "5", savedAt: "2026-07-01T12:20:00.000Z" },
      ],
    };
    const rows = formatHighSeriesDetailRows(detail);
    // Series Date + Event/Set + one per game
    expect(rows).toHaveLength(4);
    expect(rows[1]).toEqual({ label: "Event / Set", value: "Winter League" });
    expect(rows[2].value).toBe("200 — Game 1, 5");
    expect(rows[3].value).toBe("200 — Game 2, 5");
  });
});
