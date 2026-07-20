// Oil-pattern helpers — duel-pattern naming, dropdown labels, and base-option
// filtering. Extracted from App.tsx so both LogGamesPage (still in App) and the
// lifted PatternsPage can share them. Pure functions of their args.

import type { Pattern } from "../types";
import { isUnknownPattern } from "./backup";

export function isDuelPattern(pattern: Pattern | undefined) {
  return pattern?.isDuelPattern === true;
}

export function buildDuelPatternName(firstPatternName: string, secondPatternName: string) {
  return `${firstPatternName} / ${secondPatternName} (Duel Pattern)`;
}

export function getPatternNameById(
  patterns: Pattern[],
  patternId: number | undefined,
  fallbackName = ""
) {
  return (
    patterns.find((pattern) => pattern.id === patternId)?.name ||
    fallbackName ||
    "Unknown Pattern"
  );
}

export function formatPatternDropdownLabel(pattern: Pattern): string {
  if (isDuelPattern(pattern)) {
    return pattern.name;
  }

  const trimmedLength = pattern.length.trim();

  if (!trimmedLength) {
    return pattern.name;
  }

  const normalizedLength = trimmedLength
    .replace(/\s*(feet|foot|ft|')$/i, "")
    .trim();

  return `${pattern.name} - ${normalizedLength}'`;
}

export function getDuelPatternBaseOptions(
  patterns: Pattern[],
  currentPatternId?: number
) {
  return patterns.filter(
    (pattern) =>
      pattern.id !== currentPatternId &&
      !isUnknownPattern(pattern) &&
      !isDuelPattern(pattern)
  );
}
