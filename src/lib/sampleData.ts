// Sample / demo data generators — seed a fresh install with a realistic set of
// games and event logs. Extracted from App.tsx. Pure functions of the scoring
// engine + the domain types; only the two entry points are used by App's state
// initializers, the rest are internal builders.

import { ALL_PINS, getPinsStanding, scoreBowlingFrames } from "./scoring";
import type {
  FrameEntry,
  SavedGameRecord,
  SavedEventLog,
  CompetitionType,
  BowlingFormat,
} from "../types";

function createSampleFrameEntry(
  frameNumber: number,
  bowlerName: string,
  rolls: number[],
  ballUsed: string
): FrameEntry {
  const firstShot = rolls[0] ?? 0;
  const secondShot = rolls[1] ?? 0;
  const thirdShot = rolls[2] ?? 0;
  const firstShotKnockedPins = ALL_PINS.slice(0, firstShot);
  const firstShotStandingPins = getPinsStanding(firstShotKnockedPins);

  let secondShotKnockedPins: number[] = [];
  let thirdShotKnockedPins: number[] = [];

  if (frameNumber === 10) {
    if (firstShot === 10) {
      secondShotKnockedPins = ALL_PINS.slice(0, secondShot);

      if (secondShot === 10) {
        thirdShotKnockedPins = ALL_PINS.slice(0, thirdShot);
      } else {
        const secondShotStandingPins = getPinsStanding(secondShotKnockedPins);
        thirdShotKnockedPins = secondShotStandingPins.slice(0, thirdShot);
      }
    } else {
      secondShotKnockedPins = firstShotStandingPins.slice(0, secondShot);

      if (firstShot + secondShot >= 10) {
        thirdShotKnockedPins = ALL_PINS.slice(0, thirdShot);
      }
    }
  } else if (firstShot < 10) {
    secondShotKnockedPins = firstShotStandingPins.slice(0, secondShot);
  }

  const baseFootBoard = ballUsed === "IQ Tour" ? 21 : 24;
  const baseTargetArrow = ballUsed === "IQ Tour" ? 11 : 13;
  const baseTargetBreakpoint = ballUsed === "IQ Tour" ? 7 : 9;
  const frameAdjustment = frameNumber > 6 ? 1 : 0;
  const missAdjustment = frameNumber % 3 === 0 ? 1 : frameNumber % 4 === 0 ? -1 : 0;

  return {
    frameNumber,
    bowlerName,
    firstShotKnockedPins,
    secondShotKnockedPins,
    thirdShotKnockedPins,
    isComplete: true,
    ballUsed,
    footBoard: String(baseFootBoard + frameAdjustment),
    targetArrow: String(baseTargetArrow + frameAdjustment),
    targetBreakpoint: String(baseTargetBreakpoint + frameAdjustment),
    actualArrow: String(baseTargetArrow + frameAdjustment + missAdjustment),
    actualBreakpoint: String(baseTargetBreakpoint + frameAdjustment + missAdjustment),
  };
}

function createSampleGameEntries(
  bowlerName: string,
  frameRolls: number[][],
  ballUsed: string
) {
  return frameRolls.map((rolls, index) =>
    createSampleFrameEntry(index + 1, bowlerName, rolls, ballUsed)
  );
}

function createSampleSavedGame(
  id: string,
  sessionId: string,
  savedAt: string,
  competitionType: CompetitionType,
  format: BowlingFormat,
  bowlersPerTeam: number,
  centerName: string,
  patternName: string,
  eventLogKey: string,
  eventId: number | null,
  eventName: string,
  eventStageLabel: string,
  gameNumber: number,
  laneLabel: string,
  bowlerName: string,
  frameRolls: number[][],
  ballUsed: string
): SavedGameRecord {
  const entries = createSampleGameEntries(bowlerName, frameRolls, ballUsed);
  const score = scoreBowlingFrames(entries);

  return {
    id,
    sessionId,
    createdAt: savedAt,
    savedAt,
    competitionType,
    format,
    bowlersPerTeam,
    centerName,
    patternName,
    eventLogKey,
    eventId,
    eventName,
    eventStageLabel,
    gameNumber,
    laneLabel,
    bowlerNames: [bowlerName],
    scores: [{ label: bowlerName, score }],
    entries,
  };
}

function createSampleBakerSavedGame(
  id: string,
  sessionId: string,
  savedAt: string,
  competitionType: CompetitionType,
  centerName: string,
  patternName: string,
  eventLogKey: string,
  eventId: number | null,
  eventName: string,
  eventStageLabel: string,
  gameNumber: number,
  laneLabel: string,
  bowlerNames: string[],
  frameRolls: number[][],
  ballUsedByFrame: string[]
): SavedGameRecord {
  const entries = frameRolls.map((rolls, index) => {
    const bowlerName = bowlerNames[index % bowlerNames.length];
    const ballUsed = ballUsedByFrame[index] ?? "House Ball";

    return createSampleFrameEntry(index + 1, bowlerName, rolls, ballUsed);
  });

  const score = scoreBowlingFrames(entries);

  return {
    id,
    sessionId,
    createdAt: savedAt,
    savedAt,
    competitionType,
    format: "Baker",
    bowlersPerTeam: bowlerNames.length,
    centerName,
    patternName,
    eventLogKey,
    eventId,
    eventName,
    eventStageLabel,
    gameNumber,
    laneLabel,
    bowlerNames,
    scores: [{ label: "Baker Team", score }],
    entries,
  };
}

export function createSampleSavedGames(): SavedGameRecord[] {
  const leagueSessionId = "sample-sport-shot-league-week-1";
  const bakerSessionId = "sample-baker-wolf-block-day-1";
  const openSessionId = "sample-open-practice";
  const savedAt = new Date().toISOString();
  const bakerBowlers = ["Kevin", "Bowler 2", "Bowler 3", "Bowler 4", "Bowler 5"];

  return [
    createSampleSavedGame(
      "sample-league-g1",
      leagueSessionId,
      savedAt,
      "League",
      "Singles",
      5,
      "Bowlero Fullerton",
      "Custom Pattern",
      "2:Weeks:1",
      2,
      "Sport Shot League",
      "Week 1",
      1,
      "Pair 1/2",
      "Kevin",
      [[10], [9, 1], [8, 1], [10], [10], [7, 2], [10], [9, 1], [8, 2], [10, 9, 1]],
      "Venom Shock"
    ),
    createSampleSavedGame(
      "sample-league-g2",
      leagueSessionId,
      savedAt,
      "League",
      "Singles",
      5,
      "Bowlero Fullerton",
      "Custom Pattern",
      "2:Weeks:1",
      2,
      "Sport Shot League",
      "Week 1",
      2,
      "Pair 3/4",
      "Kevin",
      [[9, 1], [10], [10], [8, 2], [9, 0], [10], [7, 3], [10], [10], [9, 1, 10]],
      "IQ Tour"
    ),
    createSampleSavedGame(
      "sample-league-g3",
      leagueSessionId,
      savedAt,
      "League",
      "Singles",
      5,
      "Bowlero Fullerton",
      "Custom Pattern",
      "2:Weeks:1",
      2,
      "Sport Shot League",
      "Week 1",
      3,
      "Pair 5/6",
      "Kevin",
      [[10], [10], [9, 1], [10], [8, 2], [10], [10], [10], [9, 1], [10, 10, 8]],
      "Venom Shock"
    ),
    createSampleBakerSavedGame(
      "sample-baker-g1",
      bakerSessionId,
      savedAt,
      "Tournament",
      "Bowlero Fullerton",
      "2025 PBA Wolf",
      "3:Days:1",
      3,
      "Wolf Qualifying Block",
      "Day 1",
      1,
      "Pair 7/8",
      bakerBowlers,
      [[10], [9, 1], [8, 2], [10], [7, 2], [10], [9, 0], [8, 2], [10], [9, 1, 10]],
      [
        "Venom Shock",
        "House Ball",
        "House Ball",
        "House Ball",
        "House Ball",
        "Venom Shock",
        "House Ball",
        "House Ball",
        "House Ball",
        "Venom Shock",
      ]
    ),
    createSampleBakerSavedGame(
      "sample-baker-g2",
      bakerSessionId,
      savedAt,
      "Tournament",
      "Bowlero Fullerton",
      "2025 PBA Wolf",
      "3:Days:1",
      3,
      "Wolf Qualifying Block",
      "Day 1",
      2,
      "Pair 9/10",
      bakerBowlers,
      [[9, 1], [10], [10], [8, 1], [10], [7, 3], [10], [9, 1], [10], [10, 8, 1]],
      [
        "IQ Tour",
        "House Ball",
        "House Ball",
        "House Ball",
        "House Ball",
        "IQ Tour",
        "House Ball",
        "House Ball",
        "House Ball",
        "IQ Tour",
      ]
    ),
    createSampleSavedGame(
      "sample-open-g1",
      openSessionId,
      savedAt,
      "Open",
      "Singles",
      1,
      "Titan Bowl",
      "Unknown / House Shot",
      "",
      null,
      "",
      "",
      1,
      "Pair 1/2",
      "Kevin",
      [[10], [10], [10], [10], [10], [10], [10], [10], [10], [10, 10, 10]],
      "Venom Shock"
    ),
  ];
}

export function createSampleSavedEventLogs(): SavedEventLog[] {
  return [
    {
      key: "2:Weeks:1",
      eventId: 2,
      eventName: "Sport Shot League",
      eventType: "League",
      stageLabel: "Week 1",
    },
    {
      key: "3:Days:1",
      eventId: 3,
      eventName: "Wolf Qualifying Block",
      eventType: "Tournament",
      stageLabel: "Day 1",
    },
  ];
}
