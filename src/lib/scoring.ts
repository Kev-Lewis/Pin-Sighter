// =============================================================================
// Scoring engine — pure, framework-free bowling math.
//
// Extracted from App.tsx so it can be unit-tested in isolation (see
// scoring.test.ts). Nothing here touches React, the DOM, or app state; every
// function is a pure function of its inputs. The app's richer `FrameEntry`
// type is structurally a superset of `ScoringFrame`, so App.tsx passes its
// frames straight in with no adapter.
// =============================================================================

/** The ten pins, in number order. */
export const ALL_PINS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export type BowlingFormat =
  | "Singles"
  | "Doubles"
  | "Trios"
  | "Fours"
  | "Fives"
  | "Baker";

export type CompletedGameScore = { label: string; score: number };

/**
 * The minimal per-frame shape the scoring engine needs. The app's `FrameEntry`
 * has more fields (lane, ball, targeting, isComplete…) but is structurally
 * assignable to this.
 */
export type ScoringFrame = {
  frameNumber: number;
  bowlerName: string;
  firstShotKnockedPins: number[];
  secondShotKnockedPins: number[];
  thirdShotKnockedPins: number[];
};

/** Pins left standing given the pins that were knocked down. */
export function getPinsStanding(knockedPins: number[]): number[] {
  return ALL_PINS.filter((pin) => !knockedPins.includes(pin));
}

/**
 * True when the leave is a split: the head pin (1) is down and the standing
 * pins form two or more non-adjacent groups.
 */
export function isSplitLeave(knockedPins: number[]): boolean {
  const standingPins = getPinsStanding(knockedPins);

  if (!knockedPins.includes(1) || standingPins.length < 2) {
    return false;
  }

  const adjacency: Record<number, number[]> = {
    1: [2, 3],
    2: [1, 3, 4, 5],
    3: [1, 2, 5, 6],
    4: [2, 5, 7, 8],
    5: [2, 3, 4, 6, 8, 9],
    6: [3, 5, 9, 10],
    7: [4, 8],
    8: [4, 5, 7, 9],
    9: [5, 6, 8, 10],
    10: [6, 9],
  };

  const unvisited = new Set(standingPins);
  let groups = 0;

  while (unvisited.size > 0) {
    groups += 1;

    const firstPin = Array.from(unvisited)[0];
    const stack = [firstPin];
    unvisited.delete(firstPin);

    while (stack.length > 0) {
      const currentPin = stack.pop();

      if (currentPin === undefined) {
        continue;
      }

      adjacency[currentPin]
        .filter((neighbor) => unvisited.has(neighbor))
        .forEach((neighbor) => {
          unvisited.delete(neighbor);
          stack.push(neighbor);
        });
    }
  }

  return groups > 1;
}

/** Classify a frame outcome from its strike/spare state. */
export function getFrameResult(
  isStrike: boolean,
  pinsStandingAfterFrame: number[],
  isSpare = false
): "Strike" | "Spare" | "Open" {
  if (isStrike) {
    return "Strike";
  }

  if (isSpare || pinsStandingAfterFrame.length === 0) {
    return "Spare";
  }

  return "Open";
}

/** The individual roll pinfalls for a frame (handles the 10th-frame fill balls). */
export function getFrameRolls(frame: ScoringFrame): number[] {
  const firstShot = frame.firstShotKnockedPins.length;
  const secondShot = frame.secondShotKnockedPins.length;
  const thirdShot = frame.thirdShotKnockedPins.length;

  if (frame.frameNumber === 10) {
    if (firstShot === 10 || firstShot + secondShot === 10) {
      return [firstShot, secondShot, thirdShot];
    }

    return [firstShot, secondShot];
  }

  if (firstShot === 10) {
    return [10];
  }

  return [firstShot, secondShot];
}

/** Total score for a set of frames (standard 10-pin scoring with bonuses). */
export function scoreBowlingFrames(frames: ScoringFrame[]): number {
  const sortedFrames = [...frames].sort(
    (a, b) => a.frameNumber - b.frameNumber
  );
  const rolls = sortedFrames.flatMap(getFrameRolls);

  let score = 0;
  let rollIndex = 0;

  for (let frame = 0; frame < 10; frame += 1) {
    const firstRoll = rolls[rollIndex] ?? 0;
    const secondRoll = rolls[rollIndex + 1] ?? 0;
    const thirdRoll = rolls[rollIndex + 2] ?? 0;

    if (firstRoll === 10) {
      score += 10 + secondRoll + thirdRoll;
      rollIndex += 1;
    } else if (firstRoll + secondRoll === 10) {
      score += 10 + thirdRoll;
      rollIndex += 2;
    } else {
      score += firstRoll + secondRoll;
      rollIndex += 2;
    }
  }

  return score;
}

/**
 * Running cumulative score after each frame. Frames whose bonus isn't yet known
 * (an unfilled strike/spare) get "" until the bonus rolls exist.
 */
export function getCumulativeFrameScores(
  frames: ScoringFrame[]
): (number | "")[] {
  const sortedFrames = [...frames].sort(
    (a, b) => a.frameNumber - b.frameNumber
  );
  const rolls = sortedFrames.flatMap(getFrameRolls);
  const cumulativeScores: (number | "")[] = [];

  let score = 0;
  let rollIndex = 0;

  for (let frameIndex = 0; frameIndex < sortedFrames.length; frameIndex += 1) {
    const frame = sortedFrames[frameIndex];
    const firstRoll = rolls[rollIndex];
    const secondRoll = rolls[rollIndex + 1];
    const thirdRoll = rolls[rollIndex + 2];

    if (firstRoll === undefined) {
      cumulativeScores.push("");
      break;
    }

    if (frame.frameNumber === 10) {
      score += getFrameRolls(frame).reduce((sum, roll) => sum + roll, 0);
      cumulativeScores.push(score);
      break;
    }

    if (firstRoll === 10) {
      if (secondRoll === undefined || thirdRoll === undefined) {
        cumulativeScores.push("");
      } else {
        score += 10 + secondRoll + thirdRoll;
        cumulativeScores.push(score);
      }

      rollIndex += 1;
    } else if (secondRoll !== undefined && firstRoll + secondRoll === 10) {
      if (thirdRoll === undefined) {
        cumulativeScores.push("");
      } else {
        score += 10 + thirdRoll;
        cumulativeScores.push(score);
      }

      rollIndex += 2;
    } else {
      score += firstRoll + (secondRoll ?? 0);
      cumulativeScores.push(score);
      rollIndex += 2;
    }
  }

  return cumulativeScores;
}

/**
 * Final scores for a completed game. Baker games score the team's shared frames
 * as one line; every other format scores each bowler's own ten frames.
 */
export function calculateScoresForGame(
  entries: ScoringFrame[],
  bowlerNames: string[],
  format: BowlingFormat
): CompletedGameScore[] {
  if (format === "Baker") {
    return [
      {
        label: "Baker Team",
        score: scoreBowlingFrames(entries),
      },
    ];
  }

  return bowlerNames.map((bowlerName) => {
    const bowlerFrames = entries
      .filter((entry) => entry.bowlerName === bowlerName)
      .sort((a, b) => a.frameNumber - b.frameNumber)
      .slice(0, 10);

    return {
      label: bowlerName,
      score: scoreBowlingFrames(bowlerFrames),
    };
  });
}
