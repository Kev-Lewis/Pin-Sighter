// Spare-leave analysis — keys a frame by the pins it left, and rolls up
// conversion summaries/rows. Extracted from App.tsx (stats decomposition,
// phase 1). Builds on the frame classifiers in ./frames.

import type { FrameEntry } from "../types";
import { isSplitLeave, getPinsStanding } from "../lib/scoring";
import { isSpareAttemptEntry, isSpareEntry, isMakeableSpareAttempt } from "./frames";

export function getSpareLeavePins(entry: FrameEntry) {
  if (!isSpareAttemptEntry(entry)) {
    return [];
  }

  return getPinsStanding(entry.firstShotKnockedPins);
}

export function getSpareLeaveKey(entry: FrameEntry) {
  const leavePins = getSpareLeavePins(entry);

  return leavePins.length > 0 ? leavePins.join("-") : "None";
}

export function calculateSpareLeaveSummary(entries: FrameEntry[]) {
  const categories = {
    makeable: { attempts: 0, conversions: 0, percentage: 0 },
    singlePin: { attempts: 0, conversions: 0, percentage: 0 },
    multiPin: { attempts: 0, conversions: 0, percentage: 0 },
    split: { attempts: 0, conversions: 0, percentage: 0 },
  };

  entries.filter(isSpareAttemptEntry).forEach((entry) => {
    const leavePins = getSpareLeavePins(entry);
    const isConverted = isSpareEntry(entry);

    if (isMakeableSpareAttempt(entry)) {
      categories.makeable.attempts += 1;

      if (isConverted) {
        categories.makeable.conversions += 1;
      }
    }

    if (leavePins.length === 1) {
      categories.singlePin.attempts += 1;

      if (isConverted) {
        categories.singlePin.conversions += 1;
      }
    }

    if (leavePins.length > 1) {
      categories.multiPin.attempts += 1;

      if (isConverted) {
        categories.multiPin.conversions += 1;
      }
    }

    if (isSplitLeave(entry.firstShotKnockedPins)) {
      categories.split.attempts += 1;

      if (isConverted) {
        categories.split.conversions += 1;
      }
    }
  });

  Object.values(categories).forEach((category) => {
    category.percentage =
      category.attempts > 0
        ? (category.conversions / category.attempts) * 100
        : 0;
  });

  return categories;
}

export function calculateSpareLeaveRows(entries: FrameEntry[]) {
  const rowMap = new Map<
    string,
    {
      leave: string;
      attempts: number;
      conversions: number;
      misses: number;
      conversionPercentage: number;
    }
  >();

  entries
    .filter(isSpareAttemptEntry)
    .forEach((entry) => {
      const leave = getSpareLeaveKey(entry);
      const currentRow =
        rowMap.get(leave) ?? {
          leave,
          attempts: 0,
          conversions: 0,
          misses: 0,
          conversionPercentage: 0,
        };

      currentRow.attempts += 1;

      if (isSpareEntry(entry)) {
        currentRow.conversions += 1;
      } else {
        currentRow.misses += 1;
      }

      currentRow.conversionPercentage =
        currentRow.attempts > 0
          ? (currentRow.conversions / currentRow.attempts) * 100
          : 0;

      rowMap.set(leave, currentRow);
    });

  return Array.from(rowMap.values()).sort((a, b) => {
    if (b.attempts !== a.attempts) {
      return b.attempts - a.attempts;
    }

    return a.leave.localeCompare(b.leave, undefined, { numeric: true });
  });
}
