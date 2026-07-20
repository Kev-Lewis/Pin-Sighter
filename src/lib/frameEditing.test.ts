import { describe, it, expect } from "vitest";
import type { FrameEntry } from "../types";
import {
  cloneFrameEntryForEditing,
  frameEntriesHaveChanges,
} from "./frameEditing";

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

describe("cloneFrameEntryForEditing", () => {
  it("deep-copies the three pin arrays so edits don't mutate the original", () => {
    const original = entry({ frameNumber: 1, firstShotKnockedPins: [1, 2, 3] });
    const clone = cloneFrameEntryForEditing(original);
    clone.firstShotKnockedPins.push(4);
    expect(original.firstShotKnockedPins).toEqual([1, 2, 3]);
    expect(clone.firstShotKnockedPins).toEqual([1, 2, 3, 4]);
    expect(clone.secondShotKnockedPins).not.toBe(original.secondShotKnockedPins);
  });
});

describe("frameEntriesHaveChanges", () => {
  it("is false for identical entry lists", () => {
    const a = [entry({ frameNumber: 1, firstShotKnockedPins: [1, 2] })];
    const b = [entry({ frameNumber: 1, firstShotKnockedPins: [1, 2] })];
    expect(frameEntriesHaveChanges(a, b)).toBe(false);
  });

  it("ignores pin ordering within a shot", () => {
    const a = [entry({ frameNumber: 1, firstShotKnockedPins: [3, 1, 2] })];
    const b = [entry({ frameNumber: 1, firstShotKnockedPins: [1, 2, 3] })];
    expect(frameEntriesHaveChanges(a, b)).toBe(false);
  });

  it("detects an actual pinfall change", () => {
    const a = [entry({ frameNumber: 1, firstShotKnockedPins: [1, 2, 3] })];
    const b = [entry({ frameNumber: 1, firstShotKnockedPins: [1, 2] })];
    expect(frameEntriesHaveChanges(a, b)).toBe(true);
  });

  it("detects a non-pin field change such as the ball used", () => {
    const a = [entry({ frameNumber: 1, ballUsed: "Zen" })];
    const b = [entry({ frameNumber: 1, ballUsed: "IQ Tour" })];
    expect(frameEntriesHaveChanges(a, b)).toBe(true);
  });
});
