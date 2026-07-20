// Detailed bowler analysis — the big per-bowler stats calculator (strike/spare/
// pocket/carry/split/clean rates, series highs, per-frame & per-game averages,
// score distribution, lane-transition buckets) and the stat cards it feeds.
// Extracted from App.tsx (stats decomposition). getTransitionPhase is private.

import type { SavedGameRecord, Handedness, FrameEntry } from "../types";
import type { SessionGroup } from "../lib/sessions";
import { getHighSeriesDetail } from "../lib/sessions";
import {
  getBowlerHandedness,
  isPocketHit,
  isPocketStrike,
  isStrikeEntry,
  isSpareEntry,
  isCleanFrame,
  isSplitEntry,
  countCleanGames,
  isMakeableSpareAttempt,
} from "./frames";
import {
  calculateAverageFrameScoreRows,
  calculateAverageByGameRows,
  calculateScoreDistribution,
} from "./distribution";
import {
  formatDetailedPercent,
  formatStatRatio,
  formatHighSeriesDetailRows,
} from "./format";
import type { DetailedStatDetail } from "./types";

function getTransitionPhase(firstShotCount: number) {
  if (firstShotCount <= 55) {
    return "Fresh";
  }

  if (firstShotCount <= 110) {
    return "Early Transition";
  }

  if (firstShotCount <= 165) {
    return "Early Middle Transition";
  }

  if (firstShotCount <= 220) {
    return "Late Middle Transition";
  }

  if (firstShotCount <= 275) {
    return "Late Transition";
  }

  return "Burn";
}

export function calculateDetailedBowlerStats(
  bowlerName: string,
  selectedBall: string,
  games: SavedGameRecord[],
  sessionGroups: SessionGroup[],
  bowlerHandednessByName: Map<string, Handedness>
) {
  const bowlerHandedness = getBowlerHandedness(
    bowlerName,
    bowlerHandednessByName
  );
  const entries = games.flatMap((game) =>
    game.entries.filter((entry) => {
      const matchesBowler = entry.bowlerName === bowlerName;
      const matchesBall = selectedBall === "All" || entry.ballUsed === selectedBall;

      return matchesBowler && matchesBall;
    })
  );

  const scores = games.flatMap((game) =>
    game.scores
      .filter((score) => score.label === bowlerName)
      .map((score) => score.score)
  );

  const numGames = scores.length;
  const totalPins = scores.reduce((sum, score) => sum + score, 0);
  const average = scores.length > 0 ? totalPins / scores.length : 0;

  const highThreeGameSeriesDetail = getHighSeriesDetail(
    sessionGroups,
    bowlerName,
    3
  );
  const highFourGameSeriesDetail = getHighSeriesDetail(
    sessionGroups,
    bowlerName,
    4
  );
  const highThreeGameSeries = highThreeGameSeriesDetail?.total ?? 0;
  const highFourGameSeries = highFourGameSeriesDetail?.total ?? 0;

  const firstShots = entries.length;
  const pocketHits = entries.filter((entry) =>
    isPocketHit(entry, bowlerHandedness)
  ).length;
  const pocketStrikes = entries.filter((entry) =>
    isPocketStrike(entry, bowlerHandedness)
  ).length;
  const strikes = entries.filter(isStrikeEntry).length;
  const spares = entries.filter(isSpareEntry).length;
  const opens = entries.length - strikes - spares;
  const cleanFrames = entries.filter(isCleanFrame).length;
  const splits = entries.filter(isSplitEntry).length;
  const cleanGames = countCleanGames(games, bowlerName, selectedBall);
  const totalFirstBallPins = entries.reduce(
    (sum, entry) => sum + entry.firstShotKnockedPins.length,
    0
  );
  const firstBallAverage =
    entries.length > 0 ? totalFirstBallPins / entries.length : 0;
  const frameScoreRows = calculateAverageFrameScoreRows(
    games,
    bowlerName,
    selectedBall
  );
  const averageByGameRows = calculateAverageByGameRows(
    games,
    bowlerName,
    selectedBall
  );
  const scoreDistribution = calculateScoreDistribution(
    games,
    sessionGroups,
    bowlerName,
    selectedBall
  );

  let pocketStrikesAfterStrike = 0;
  let previousEntryWasStrike = false;

  entries.forEach((entry) => {
    if (previousEntryWasStrike && isPocketStrike(entry, bowlerHandedness)) {
      pocketStrikesAfterStrike += 1;
    }

    previousEntryWasStrike = isStrikeEntry(entry);
  });

  const makeableAttempts = entries.filter(isMakeableSpareAttempt);
  const convertedMakeableSpares = makeableAttempts.filter(isSpareEntry).length;
  const transitionBuckets = new Map<
    string,
    {
      phase: string;
      frames: number;
      strikes: number;
      spares: number;
      opens: number;
      splits: number;
      pocketHits: number;
      pocketStrikes: number;
    }
  >();

  const phaseOrder = [
    "Fresh",
    "Early Transition",
    "Early Middle Transition",
    "Late Middle Transition",
    "Late Transition",
    "Burn",
  ];

  phaseOrder.forEach((phase) => {
    transitionBuckets.set(phase, {
      phase,
      frames: 0,
      strikes: 0,
      spares: 0,
      opens: 0,
      splits: 0,
      pocketHits: 0,
      pocketStrikes: 0,
    });
  });

  let laneFrameCounter = 0;

  games.forEach((game) => {
    const entriesByFrame = new Map<number, FrameEntry[]>();

    game.entries.forEach((entry) => {
      const existingEntries = entriesByFrame.get(entry.frameNumber) ?? [];
      entriesByFrame.set(entry.frameNumber, [...existingEntries, entry]);
    });

    Array.from(entriesByFrame.entries())
      .sort(([frameA], [frameB]) => frameA - frameB)
      .forEach(([, frameEntries]) => {
        laneFrameCounter += Math.max(1, game.bowlersPerTeam ?? 1);

        frameEntries.forEach((entry) => {
          if (entry.bowlerName !== bowlerName) {
            return;
          }

          if (selectedBall !== "All" && entry.ballUsed !== selectedBall) {
            return;
          }

          const phase = getTransitionPhase(laneFrameCounter);
          const bucket = transitionBuckets.get(phase);

          if (!bucket) {
            return;
          }

          bucket.frames += 1;

          if (isStrikeEntry(entry)) {
            bucket.strikes += 1;
          } else if (isSpareEntry(entry)) {
            bucket.spares += 1;
          } else {
            bucket.opens += 1;
          }

          if (isSplitEntry(entry)) {
            bucket.splits += 1;
          }

          if (isPocketHit(entry, bowlerHandedness)) {
            bucket.pocketHits += 1;
          }

          if (isPocketStrike(entry, bowlerHandedness)) {
            bucket.pocketStrikes += 1;
          }
        });
      });
  });

  const transitionRows = Array.from(transitionBuckets.values()).map((bucket) => ({
    ...bucket,
    strikePercentage:
      bucket.frames > 0 ? (bucket.strikes / bucket.frames) * 100 : 0,
    cleanPercentage:
      bucket.frames > 0
        ? ((bucket.strikes + bucket.spares) / bucket.frames) * 100
        : 0,
  }));

  return {
    numGames,
    totalPins,
    average,
    highThreeGameSeries,
    highFourGameSeries,
    highThreeGameSeriesDetail,
    highFourGameSeriesDetail,
    frames: entries.length,
    firstShots,
    strikes,
    spares,
    opens,
    pocketHits,
    pocketStrikes,
    pocketStrikesAfterStrike,
    pocketPercentage:
      firstShots > 0 ? (pocketHits / firstShots) * 100 : 0,
    carryPercentage:
      pocketHits > 0 ? (pocketStrikes / pocketHits) * 100 : 0,
    doublePercentage:
      pocketStrikes > 0 ? (pocketStrikesAfterStrike / pocketStrikes) * 100 : 0,
    makeableAttempts: makeableAttempts.length,
    convertedMakeableSpares,
    makeableSpareConversion:
      makeableAttempts.length > 0
        ? (convertedMakeableSpares / makeableAttempts.length) * 100
        : 0,
    cleanFrames,
    fillFramesPercentage:
      firstShots > 0 ? (cleanFrames / firstShots) * 100 : 0,
    cleanPercentage:
      firstShots > 0 ? (cleanFrames / firstShots) * 100 : 0,
    splits,
    splitPercentage:
      firstShots > 0 ? (splits / firstShots) * 100 : 0,
    cleanGames,
    totalFirstBallPins,
    firstBallAverage,
    frameScoreRows,
    averageByGameRows,
    scoreDistribution,
    transitionRows,
  };
}

export function buildDetailedStatCards(
  stats: ReturnType<typeof calculateDetailedBowlerStats>,
  selectedBall: string
): DetailedStatDetail[] {
  const ballFilterNote =
    selectedBall === "All"
      ? undefined
      : "A ball filter is active. Frame-based stats use only matching frames for that ball, while game score stats use the saved game scores in the current filter set.";

  return [
    {
      title: "Total Games",
      label: "Total Games",
      value: String(stats.numGames),
      description:
        "The number of saved non-Baker games found for this bowler under the current Stats filters.",
      formula: "Count of matching saved game scores.",
      detailRows: [
        { label: "Games Counted", value: stats.numGames.toLocaleString() },
        { label: "Total Pins", value: stats.totalPins.toLocaleString() },
      ],
      note: ballFilterNote,
    },
    {
      title: "Average",
      label: "Average",
      value: stats.average.toFixed(1),
      description:
        "The bowler's average score across the matching saved games.",
      formula: "Total pins ÷ total games.",
      detailRows: [
        { label: "Total Pins", value: stats.totalPins.toLocaleString() },
        { label: "Total Games", value: stats.numGames.toLocaleString() },
        {
          label: "Calculation",
          value:
            stats.numGames > 0
              ? `${stats.totalPins} ÷ ${stats.numGames} = ${stats.average.toFixed(1)}`
              : "No games tracked",
        },
      ],
      note: ballFilterNote,
    },
    {
      title: "High 3-Game Series",
      label: "High 3-Game Series",
      value:
        stats.highThreeGameSeries > 0
          ? String(stats.highThreeGameSeries)
          : "—",
      description:
        "The highest 3-game league or tournament series found in a matching saved set.",
      formula: "Best total from three consecutive matching games in the same set.",
      detailRows: [
        {
          label: "Series Total",
          value:
            stats.highThreeGameSeries > 0
              ? String(stats.highThreeGameSeries)
              : "—",
        },
        ...formatHighSeriesDetailRows(stats.highThreeGameSeriesDetail),
      ],
      note: "Open bowling games are not included in high series calculations.",
    },
    {
      title: "High 4-Game Series",
      label: "High 4-Game Series",
      value:
        stats.highFourGameSeries > 0
          ? String(stats.highFourGameSeries)
          : "—",
      description:
        "The highest 4-game league or tournament series found in a matching saved set.",
      formula: "Best total from four consecutive matching games in the same set.",
      detailRows: [
        {
          label: "Series Total",
          value:
            stats.highFourGameSeries > 0
              ? String(stats.highFourGameSeries)
              : "—",
        },
        ...formatHighSeriesDetailRows(stats.highFourGameSeriesDetail),
      ],
      note: "Open bowling games are not included in high series calculations.",
    },
    {
      title: "Pocket Percentage",
      label: "Pocket Percentage",
      value: formatDetailedPercent(stats.pocketPercentage),
      description:
        "How often the first ball hit the pocket based on the bowler's handedness.",
      formula:
        "Pocket hits ÷ first-ball shots. Right-handed pocket hits count pins 1 and 3; left-handed pocket hits count pins 1 and 2.",
      detailRows: [
        { label: "Pocket Hits", value: stats.pocketHits.toLocaleString() },
        { label: "First-Ball Shots", value: stats.firstShots.toLocaleString() },
        {
          label: "Calculation",
          value:
            stats.firstShots > 0
              ? `${formatStatRatio(stats.pocketHits, stats.firstShots)} = ${formatDetailedPercent(stats.pocketPercentage)}`
              : "No first-ball shots tracked",
        },
      ],
    },
    {
      title: "Carry Percentage",
      label: "Carry Percentage",
      value: formatDetailedPercent(stats.carryPercentage),
      description:
        "How often pocket hits carried for strikes.",
      formula: "Pocket strikes ÷ pocket hits.",
      detailRows: [
        { label: "Pocket Strikes", value: stats.pocketStrikes.toLocaleString() },
        { label: "Pocket Hits", value: stats.pocketHits.toLocaleString() },
        {
          label: "Calculation",
          value:
            stats.pocketHits > 0
              ? `${formatStatRatio(stats.pocketStrikes, stats.pocketHits)} = ${formatDetailedPercent(stats.carryPercentage)}`
              : "No pocket hits tracked",
        },
      ],
    },
    {
      title: "Double Percentage",
      label: "Double Percentage",
      value: formatDetailedPercent(stats.doublePercentage),
      description:
        "How often a pocket strike happened after the previous frame was also a strike.",
      formula: "Pocket strikes after a previous strike ÷ pocket strikes.",
      detailRows: [
        {
          label: "Pocket Strikes After Strike",
          value: stats.pocketStrikesAfterStrike.toLocaleString(),
        },
        { label: "Pocket Strikes", value: stats.pocketStrikes.toLocaleString() },
        {
          label: "Calculation",
          value:
            stats.pocketStrikes > 0
              ? `${formatStatRatio(stats.pocketStrikesAfterStrike, stats.pocketStrikes)} = ${formatDetailedPercent(stats.doublePercentage)}`
              : "No pocket strikes tracked",
        },
      ],
    },
    {
      title: "Makeable Spare Conversion",
      label: "Makeable Spare Conversion",
      value: formatDetailedPercent(stats.makeableSpareConversion),
      description:
        "How often makeable spare attempts were converted.",
      formula: "Converted makeable spares ÷ makeable spare attempts.",
      detailRows: [
        {
          label: "Converted Makeable Spares",
          value: stats.convertedMakeableSpares.toLocaleString(),
        },
        {
          label: "Makeable Spare Attempts",
          value: stats.makeableAttempts.toLocaleString(),
        },
        {
          label: "Calculation",
          value:
            stats.makeableAttempts > 0
              ? `${formatStatRatio(stats.convertedMakeableSpares, stats.makeableAttempts)} = ${formatDetailedPercent(stats.makeableSpareConversion)}`
              : "No makeable spare attempts tracked",
        },
      ],
    },
    {
      title: "Clean Percentage",
      label: "Clean Percentage",
      value: formatDetailedPercent(stats.cleanPercentage),
      description:
        "How often the bowler avoided an open frame.",
      formula: "Clean frames ÷ tracked frames.",
      detailRows: [
        { label: "Clean Frames", value: stats.cleanFrames.toLocaleString() },
        { label: "Tracked Frames", value: stats.firstShots.toLocaleString() },
        {
          label: "Calculation",
          value:
            stats.firstShots > 0
              ? `${formatStatRatio(stats.cleanFrames, stats.firstShots)} = ${formatDetailedPercent(stats.cleanPercentage)}`
              : "No frames tracked",
        },
      ],
    },
    {
      title: "Split Percentage",
      label: "Split Percentage",
      value: formatDetailedPercent(stats.splitPercentage),
      description:
        "How often the first ball resulted in a split leave.",
      formula: "Split frames ÷ tracked frames.",
      detailRows: [
        { label: "Split Frames", value: stats.splits.toLocaleString() },
        { label: "Tracked Frames", value: stats.firstShots.toLocaleString() },
        {
          label: "Calculation",
          value:
            stats.firstShots > 0
              ? `${formatStatRatio(stats.splits, stats.firstShots)} = ${formatDetailedPercent(stats.splitPercentage)}`
              : "No frames tracked",
        },
      ],
    },
    {
      title: "Clean Games",
      label: "Clean Games",
      value: String(stats.cleanGames),
      description:
        "The number of matching games with no open frames for the selected bowler.",
      formula: "Count of games where every completed frame was clean.",
      detailRows: [
        { label: "Clean Games", value: stats.cleanGames.toLocaleString() },
        { label: "Total Games", value: stats.numGames.toLocaleString() },
      ],
      note: ballFilterNote,
    },
    {
      title: "First Ball Average",
      label: "First Ball Average",
      value: stats.firstBallAverage.toFixed(2),
      description:
        "Average pinfall on the first ball of each tracked frame.",
      formula: "Total first-ball pinfall ÷ tracked first-ball shots.",
      detailRows: [
        {
          label: "Total First-Ball Pinfall",
          value: stats.totalFirstBallPins.toLocaleString(),
        },
        { label: "First-Ball Shots", value: stats.firstShots.toLocaleString() },
        {
          label: "Calculation",
          value:
            stats.firstShots > 0
              ? `${stats.totalFirstBallPins} ÷ ${stats.firstShots} = ${stats.firstBallAverage.toFixed(2)}`
              : "No first-ball shots tracked",
        },
      ],
    },
  ];
}
