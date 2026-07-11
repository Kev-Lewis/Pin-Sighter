import { describe, it, expect } from "vitest";
import {
  ALL_PINS,
  getPinsStanding,
  isSplitLeave,
  getFrameResult,
  getFrameRolls,
  scoreBowlingFrames,
  getCumulativeFrameScores,
  calculateScoresForGame,
  formatPinfallMark,
  getFrameMarks,
  parseLeaveKeyPins,
  type ScoringFrame,
} from "./scoring";

// --- helpers -----------------------------------------------------------------
const pins = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

/** Build a frame from roll pin-counts (content doesn't matter for scoring). */
function frame(
  frameNumber: number,
  first: number,
  second = 0,
  third = 0,
  bowlerName = "Kevin"
): ScoringFrame {
  return {
    frameNumber,
    bowlerName,
    firstShotKnockedPins: pins(first),
    secondShotKnockedPins: pins(second),
    thirdShotKnockedPins: pins(third),
  };
}

/** Ten frames from a compact [first, second, third?] spec per frame. */
function game(specs: Array<[number, number?, number?]>): ScoringFrame[] {
  return specs.map(([f, s = 0, t = 0], i) => frame(i + 1, f, s, t));
}

// --- scoreBowlingFrames: the whole-game cases --------------------------------
describe("scoreBowlingFrames", () => {
  it("gutter game scores 0", () => {
    expect(scoreBowlingFrames(game(Array(10).fill([0, 0])))).toBe(0);
  });

  it("perfect game scores 300", () => {
    const perfect: ScoringFrame[] = [
      ...Array.from({ length: 9 }, (_, i) => frame(i + 1, 10)),
      frame(10, 10, 10, 10),
    ];
    expect(scoreBowlingFrames(perfect)).toBe(300);
  });

  it("all nine-spares scores 190", () => {
    const spares: ScoringFrame[] = [
      ...Array.from({ length: 9 }, (_, i) => frame(i + 1, 9, 1)),
      frame(10, 9, 1, 9),
    ];
    expect(scoreBowlingFrames(spares)).toBe(190);
  });

  it("all open nines scores 90", () => {
    expect(scoreBowlingFrames(game(Array(10).fill([9, 0])))).toBe(90);
  });

  it("strike then spare then blanks scores 30", () => {
    const g = game([
      [10],
      [9, 1],
      [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0],
    ]);
    expect(scoreBowlingFrames(g)).toBe(30);
  });

  it("10th-frame strike + two fill balls scores the fill correctly", () => {
    const g = game([
      [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0],
      [10, 5, 3],
    ]);
    expect(scoreBowlingFrames(g)).toBe(18); // 10 + 5 + 3
  });

  it("10th-frame spare + one fill ball scores the fill correctly", () => {
    const g = game([
      [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0],
      [5, 5, 7],
    ]);
    expect(scoreBowlingFrames(g)).toBe(17); // 5 + 5 + 7
  });

  it("is order-independent (unsorted frames score the same)", () => {
    const ordered = game(Array(10).fill([9, 0]));
    const shuffled = [...ordered].reverse();
    expect(scoreBowlingFrames(shuffled)).toBe(90);
  });
});

// --- getFrameRolls -----------------------------------------------------------
describe("getFrameRolls", () => {
  it("collapses a non-10th strike to a single roll", () => {
    expect(getFrameRolls(frame(3, 10))).toEqual([10]);
  });
  it("returns both balls for an open frame", () => {
    expect(getFrameRolls(frame(3, 7, 2))).toEqual([7, 2]);
  });
  it("includes the fill ball on a 10th-frame strike", () => {
    expect(getFrameRolls(frame(10, 10, 5, 3))).toEqual([10, 5, 3]);
  });
  it("includes the fill ball on a 10th-frame spare", () => {
    expect(getFrameRolls(frame(10, 7, 3, 8))).toEqual([7, 3, 8]);
  });
  it("omits a fill ball on an open 10th frame", () => {
    expect(getFrameRolls(frame(10, 4, 3))).toEqual([4, 3]);
  });
});

// --- getCumulativeFrameScores ------------------------------------------------
describe("getCumulativeFrameScores", () => {
  it("runs the total forward on a completed open game", () => {
    expect(getCumulativeFrameScores(game(Array(10).fill([9, 0])))).toEqual([
      9, 18, 27, 36, 45, 54, 63, 72, 81, 90,
    ]);
  });
  it("ends at 300 for a perfect game", () => {
    const perfect: ScoringFrame[] = [
      ...Array.from({ length: 9 }, (_, i) => frame(i + 1, 10)),
      frame(10, 10, 10, 10),
    ];
    const cumulative = getCumulativeFrameScores(perfect);
    expect(cumulative[cumulative.length - 1]).toBe(300);
  });
  it("shows blank for a strike whose bonus isn't known yet", () => {
    expect(getCumulativeFrameScores([frame(1, 10)])).toEqual([""]);
  });
});

// --- getPinsStanding ---------------------------------------------------------
describe("getPinsStanding", () => {
  it("returns all pins when nothing is knocked down", () => {
    expect(getPinsStanding([])).toEqual(ALL_PINS);
  });
  it("returns nothing on a strike", () => {
    expect(getPinsStanding(ALL_PINS)).toEqual([]);
  });
  it("returns the complement of the knocked pins", () => {
    expect(getPinsStanding([1, 2, 3])).toEqual([4, 5, 6, 7, 8, 9, 10]);
  });
});

// --- isSplitLeave ------------------------------------------------------------
describe("isSplitLeave", () => {
  it("flags the 7-10 split", () => {
    // first ball leaves 7 and 10 standing
    expect(isSplitLeave([1, 2, 3, 4, 5, 6, 8, 9])).toBe(true);
  });
  it("does not flag an adjacent cluster (8-9-10)", () => {
    expect(isSplitLeave([1, 2, 3, 4, 5, 6, 7])).toBe(false);
  });
  it("is not a split when the head pin is still standing", () => {
    // 1 not in knocked → head pin up → not a split by this definition
    expect(isSplitLeave([2, 3, 4, 5, 6, 7, 8, 9, 10])).toBe(false);
  });
  it("is not a split with fewer than two pins standing", () => {
    expect(isSplitLeave([1, 2, 3, 4, 5, 6, 7, 8, 9])).toBe(false);
  });
});

// --- getFrameResult ----------------------------------------------------------
describe("getFrameResult", () => {
  it("reports a strike", () => {
    expect(getFrameResult(true, [7, 10])).toBe("Strike");
  });
  it("reports a spare when nothing is left standing", () => {
    expect(getFrameResult(false, [])).toBe("Spare");
  });
  it("reports an open when pins remain", () => {
    expect(getFrameResult(false, [7, 10])).toBe("Open");
  });
  it("honors an explicit spare flag", () => {
    expect(getFrameResult(false, [7, 10], true)).toBe("Spare");
  });
});

// --- calculateScoresForGame --------------------------------------------------
describe("calculateScoresForGame", () => {
  it("scores a Baker game as one shared team line", () => {
    const perfectTeam: ScoringFrame[] = [
      ...Array.from({ length: 9 }, (_, i) => frame(i + 1, 10, 0, 0, "Team")),
      frame(10, 10, 10, 10, "Team"),
    ];
    const result = calculateScoresForGame(perfectTeam, ["A", "B"], "Baker");
    expect(result).toEqual([{ label: "Baker Team", score: 300 }]);
  });

  it("scores each bowler independently in a singles game", () => {
    const kevin = game(Array(10).fill([9, 0])); // 90
    const alex = [
      ...Array.from({ length: 9 }, (_, i) => frame(i + 1, 10, 0, 0, "Alex")),
      frame(10, 10, 10, 10, "Alex"),
    ]; // 300
    const entries = [...kevin, ...alex];
    const result = calculateScoresForGame(entries, ["Kevin", "Alex"], "Singles");
    expect(result).toEqual([
      { label: "Kevin", score: 90 },
      { label: "Alex", score: 300 },
    ]);
  });

  it("only counts a bowler's first ten frames", () => {
    const eleven = [
      ...game(Array(10).fill([9, 0])),
      frame(11, 10, 10, 10), // stray extra frame must be ignored
    ];
    const result = calculateScoresForGame(eleven, ["Kevin"], "Singles");
    expect(result).toEqual([{ label: "Kevin", score: 90 }]);
  });
});

// --- roll marks + leave parsing (extracted presentation helpers) -------------
function markFrame(
  frameNumber: number,
  first: number[],
  second: number[] = [],
  third: number[] = []
): ScoringFrame {
  return {
    frameNumber,
    bowlerName: "x",
    firstShotKnockedPins: first,
    secondShotKnockedPins: second,
    thirdShotKnockedPins: third,
  };
}
const all = () => ALL_PINS.slice();

describe("formatPinfallMark", () => {
  it("renders a miss as '-', a gutter-strike option, and counts otherwise", () => {
    expect(formatPinfallMark(0)).toBe("-");
    expect(formatPinfallMark(7)).toBe("7");
    expect(formatPinfallMark(10, { isStrikeShot: true })).toBe("X");
    expect(formatPinfallMark(10)).toBe("10");
  });
});

describe("getFrameMarks", () => {
  it("marks a strike as ['', 'X'] for frames 1-9", () => {
    expect(getFrameMarks(markFrame(3, all())).map((m) => m.value)).toEqual(["", "X"]);
  });
  it("marks a spare with '/'", () => {
    const marks = getFrameMarks(markFrame(3, [1, 2, 3, 4, 5, 6, 7], [8, 9, 10]));
    expect(marks.map((m) => m.value)).toEqual(["7", "/"]);
  });
  it("marks an open frame with both counts", () => {
    const marks = getFrameMarks(markFrame(3, [1, 2, 3, 4, 5], [6, 7]));
    expect(marks.map((m) => m.value)).toEqual(["5", "2"]);
  });
  it("flags a split leave on the first shot", () => {
    // 7-10 split
    const marks = getFrameMarks(markFrame(3, ALL_PINS.filter((p) => p !== 7 && p !== 10)));
    expect(marks[0].isSplit).toBe(true);
  });
  it("handles a 10th-frame turkey as three X marks", () => {
    const marks = getFrameMarks(markFrame(10, all(), all(), all()));
    expect(marks.map((m) => m.value)).toEqual(["X", "X", "X"]);
  });
});

describe("parseLeaveKeyPins", () => {
  it("returns [] for 'None'", () => {
    expect(parseLeaveKeyPins("None")).toEqual([]);
  });
  it("parses and sorts a dashed leave key", () => {
    expect(parseLeaveKeyPins("10-3-6")).toEqual([3, 6, 10]);
  });
});
