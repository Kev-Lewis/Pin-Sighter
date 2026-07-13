import { describe, it, expect } from "vitest";
import type { FrameEntry } from "../types";
import {
  getSpareLeavePins,
  getSpareLeaveKey,
  calculateSpareLeaveSummary,
  calculateSpareLeaveRows,
} from "./spareLeaves";

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

const ALL = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const strike = entry({ frameNumber: 1, firstShotKnockedPins: ALL });
// single 10-pin leave, made
const tenPinMade = entry({
  frameNumber: 1,
  firstShotKnockedPins: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  secondShotKnockedPins: [10],
});
// single 10-pin leave, missed
const tenPinMiss = entry({
  frameNumber: 2,
  firstShotKnockedPins: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  secondShotKnockedPins: [],
});
// 7-10 split leave, missed
const splitMiss = entry({
  frameNumber: 3,
  firstShotKnockedPins: [1, 2, 3, 4, 5, 6, 8, 9],
  secondShotKnockedPins: [],
});
// open (leaves 8-9-10), missed → multi-pin, non-split
const multiMiss = entry({
  frameNumber: 4,
  firstShotKnockedPins: [1, 2, 3, 4, 5, 6, 7],
  secondShotKnockedPins: [],
});

describe("getSpareLeavePins", () => {
  it("returns the standing pins for a spare attempt", () => {
    expect(getSpareLeavePins(tenPinMade)).toEqual([10]);
    expect(getSpareLeavePins(multiMiss)).toEqual([8, 9, 10]);
  });
  it("returns nothing for a strike", () => {
    expect(getSpareLeavePins(strike)).toEqual([]);
  });
});

describe("getSpareLeaveKey", () => {
  it("joins the leave pins, or 'None' for a strike", () => {
    expect(getSpareLeaveKey(tenPinMade)).toBe("10");
    expect(getSpareLeaveKey(multiMiss)).toBe("8-9-10");
    expect(getSpareLeaveKey(splitMiss)).toBe("7-10");
    expect(getSpareLeaveKey(strike)).toBe("None");
  });
});

describe("calculateSpareLeaveSummary", () => {
  it("buckets attempts/conversions and computes percentages", () => {
    const summary = calculateSpareLeaveSummary([tenPinMade, tenPinMiss]);
    // both are single-pin, makeable; one converted
    expect(summary.singlePin.attempts).toBe(2);
    expect(summary.singlePin.conversions).toBe(1);
    expect(summary.singlePin.percentage).toBe(50);
    expect(summary.makeable.attempts).toBe(2);
    expect(summary.makeable.conversions).toBe(1);
    expect(summary.makeable.percentage).toBe(50);
    expect(summary.multiPin.attempts).toBe(0);
    expect(summary.split.attempts).toBe(0);
  });

  it("counts splits and multi-pin leaves in their buckets", () => {
    const summary = calculateSpareLeaveSummary([splitMiss, multiMiss]);
    expect(summary.split.attempts).toBe(1);
    expect(summary.multiPin.attempts).toBe(2); // both leave >1 pin
    expect(summary.split.conversions).toBe(0);
  });

  it("ignores strikes entirely", () => {
    const summary = calculateSpareLeaveSummary([strike]);
    expect(summary.singlePin.attempts).toBe(0);
    expect(summary.makeable.attempts).toBe(0);
  });
});

describe("calculateSpareLeaveRows", () => {
  it("aggregates per leave, tracks conversions/misses, sorts by attempts", () => {
    const rows = calculateSpareLeaveRows([
      tenPinMade,
      tenPinMiss,
      splitMiss,
    ]);
    // "10" seen twice, "7-10" once → "10" sorts first
    expect(rows.map((r) => r.leave)).toEqual(["10", "7-10"]);

    const tenRow = rows.find((r) => r.leave === "10")!;
    expect(tenRow.attempts).toBe(2);
    expect(tenRow.conversions).toBe(1);
    expect(tenRow.misses).toBe(1);
    expect(tenRow.conversionPercentage).toBe(50);

    const splitRow = rows.find((r) => r.leave === "7-10")!;
    expect(splitRow.attempts).toBe(1);
    expect(splitRow.conversions).toBe(0);
    expect(splitRow.misses).toBe(1);
  });
});
