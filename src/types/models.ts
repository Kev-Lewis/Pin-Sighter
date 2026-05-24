export type Handedness = "right" | "left";

export type CompetitionType = "open" | "league" | "tournament";

export type BowlingFormat =
  | "singles"
  | "doubles"
  | "trios"
  | "fours"
  | "fives"
  | "baker"
  | "practice";

export type LaneMode = "single" | "pair";

export interface Bowler {
  id: number;
  name: string;
  handedness: Handedness;
  notes?: string;
  isActive: boolean;
}

export interface Ball {
  id: number;
  bowlerId: number;
  name: string;
  brand?: string;
  weightLbs?: number;
  surface?: string;
  layoutNotes?: string;
  notes?: string;
  isActive: boolean;
}

export interface BowlingCenter {
  id: number;
  name: string;
  laneCount: number;
  surfaceType?: string;
  notes?: string;
}

export interface Pattern {
  id: number;
  name: string;
  lengthFt?: number;
  volumeMl?: number;
  ratio?: number;
  dropBrushFt?: number;
  oilType?: string;
  source?: string;
  difficulty?: string;
  notes?: string;
}

export interface BowlingEvent {
  id: number;
  name: string;
  eventType: CompetitionType;
  startDate?: string;
  endDate?: string;
  numberOfDays?: number;
  numberOfWeeks?: number;
  centerId?: number;
  patternId?: number;
  notes?: string;
}

export interface Session {
  id: number;
  eventId?: number;
  centerId: number;
  patternId?: number;
  sessionDate: string;
  competitionType: CompetitionType;
  format: BowlingFormat;
  laneMode: LaneMode;
  startingLane: number;
  endingLane?: number;
  notes?: string;
}

export interface Game {
  id: number;
  sessionId: number;
  bowlerId?: number;
  gameNumber: number;
  isBaker: boolean;
  teamName?: string;
  finalScore?: number;
  notes?: string;
}

export interface Shot {
  id: number;
  gameId: number;
  bowlerId: number;

  frameNumber: number;
  shotNumber: number;

  laneNumber?: number;
  ballId?: number;

  footBoard?: number;
  targetArrowBoard?: number;
  targetBreakpointBoard?: number;
  actualArrowBoard?: number;
  actualBreakpointBoard?: number;

  pinsBefore?: string;
  pinsLeft: string;
  pinCount: number;

  shotResult?: string;
  notes?: string;
}