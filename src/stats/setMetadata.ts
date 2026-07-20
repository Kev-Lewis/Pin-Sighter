// Set-metadata helpers — deriving lane labels, option lists, and the set-level
// metadata draft for a saved session. Extracted from App.tsx (stats
// decomposition). Shared by StatsPage, the SavedSetMetadataEditor, and (for
// getUniqueMetadataOptions) the SavedFrameEditModal.

import type { Center } from "../types";
import type { SessionGroup } from "../lib/sessions";
import type { SetMetadataDraft } from "./types";

function parseStoredLaneLabels(laneLabel: string) {
  return laneLabel
    .split(",")
    .map((label) => label.trim())
    .filter(Boolean);
}

function getSetLaneLabelsByGame(session: SessionGroup) {
  const firstStoredLabels = parseStoredLaneLabels(session.games[0]?.laneLabel ?? "");

  if (firstStoredLabels.length === session.games.length) {
    return Object.fromEntries(
      session.games.map((game, index) => [game.id, firstStoredLabels[index]])
    );
  }

  return Object.fromEntries(
    session.games.map((game) => {
      const parsedGameLabels = parseStoredLaneLabels(game.laneLabel);

      return [game.id, parsedGameLabels[0] ?? game.laneLabel];
    })
  );
}

export function createSetMetadataDraft(session: SessionGroup): SetMetadataDraft {
  const firstGame = session.games[0];

  return {
    centerName: firstGame?.centerName ?? "",
    patternName: firstGame?.patternName ?? "",
    gameLaneLabels: getSetLaneLabelsByGame(session),
    setNotes: firstGame?.setNotes ?? "",
  };
}

export function getUniqueMetadataOptions(currentValue: string, options: string[]) {
  const uniqueOptions = Array.from(new Set(options.filter(Boolean))).sort((a, b) =>
    a.localeCompare(b)
  );

  if (currentValue && !uniqueOptions.includes(currentValue)) {
    return [currentValue, ...uniqueOptions];
  }

  return uniqueOptions;
}

function getLaneLabelNumber(laneLabel: string) {
  const laneNumbers = laneLabel.match(/\d+/g)?.map(Number) ?? [];

  return laneNumbers[0] ?? Number.MAX_SAFE_INTEGER;
}

function sortLaneLabelsByNumber(a: string, b: string) {
  const aNumber = getLaneLabelNumber(a);
  const bNumber = getLaneLabelNumber(b);

  if (aNumber !== bNumber) {
    return aNumber - bNumber;
  }

  return a.localeCompare(b, undefined, { numeric: true });
}

function inferSetLaneMode(laneLabels: string[]) {
  const validLabels = laneLabels.filter(Boolean);
  const pairCount = validLabels.filter((label) =>
    label.trim().toLowerCase().startsWith("pair")
  ).length;
  const laneCount = validLabels.filter((label) =>
    label.trim().toLowerCase().startsWith("lane")
  ).length;

  if (laneCount > pairCount) {
    return "Single Lane";
  }

  return "Pair";
}

export function buildMetadataLaneOptions(
  centerName: string,
  centers: Center[],
  session: SessionGroup,
  currentLaneLabels: string[]
) {
  const selectedCenter = centers.find((center) => center.name === centerName);
  const parsedCurrentLabels = currentLaneLabels
    .flatMap(parseStoredLaneLabels)
    .filter(Boolean);
  const parsedSessionLabels = session.games
    .flatMap((game) => parseStoredLaneLabels(game.laneLabel))
    .filter(Boolean);
  const laneMode = inferSetLaneMode([...parsedCurrentLabels, ...parsedSessionLabels]);
  const generatedOptions: string[] = [];

  if (selectedCenter) {
    if (laneMode === "Single Lane") {
      Array.from({ length: selectedCenter.laneCount }, (_, index) => {
        generatedOptions.push(`Lane ${index + 1}`);
      });
    } else {
      Array.from(
        { length: Math.floor(selectedCenter.laneCount / 2) },
        (_, index) => {
          const leftLane = index * 2 + 1;
          const rightLane = leftLane + 1;

          generatedOptions.push(`Pair ${leftLane}/${rightLane}`);
        }
      );
    }
  }

  return Array.from(
    new Set([...parsedCurrentLabels, ...parsedSessionLabels, ...generatedOptions])
  )
    .filter((label) =>
      laneMode === "Single Lane"
        ? label.trim().toLowerCase().startsWith("lane")
        : label.trim().toLowerCase().startsWith("pair")
    )
    .sort(sortLaneLabelsByNumber);
}
