// =============================================================================
// Pin-Sighter domain model — the persisted data types shared across the app,
// the pure `lib/` modules, and the UI components. Kept dependency-free so any
// layer can import these without reaching back into App.tsx.
// =============================================================================

export type CompetitionType = "Open" | "League" | "Tournament";

export type BowlingFormat =
  | "Singles"
  | "Doubles"
  | "Trios"
  | "Fours"
  | "Fives"
  | "Baker";

export type Handedness = "Right" | "Left";

export type BowlingBall = {
  id: number;
  name: string;
  brand: string;
  surface: string;
  layout: string;
  notes: string;
};

export type Bowler = {
  id: number;
  name: string;
  handedness: Handedness;
  notes: string;
  arsenal: BowlingBall[];
};

export type Center = {
  id: number;
  name: string;
  laneCount: number;
  notes: string;
};

export type Pattern = {
  id: number;
  name: string;
  length: string;
  volume: string;
  ratio: string;
  dropBrush: string;
  source: string;
  notes: string;
  isDuelPattern?: boolean;
  firstPatternId?: number;
  secondPatternId?: number;
  firstPatternName?: string;
  secondPatternName?: string;
};

export type EventScheduleUnit = "Weeks" | "Days";

export type EventSetup = {
  id: number;
  name: string;
  eventType: "League" | "Tournament";
  format: BowlingFormat;
  seriesGameCount: number;
  bowlersPerPair: number;
  scheduleUnit: EventScheduleUnit;
  scheduleCount: number;
  startDate: string;
  endDate: string;
  centerId: number;
  dashboardUrl?: string;
  standingsUrl?: string;
  notes: string;
};

export type CarryoverFields = {
  ballUsed: string;
  footBoard: string;
  targetArrow: string;
  targetBreakpoint: string;
  actualArrow: string;
  actualBreakpoint: string;
};

export type FrameEntry = CarryoverFields & {
  frameNumber: number;
  bowlerName: string;
  firstShotKnockedPins: number[];
  secondShotKnockedPins: number[];
  thirdShotKnockedPins: number[];
  isComplete: boolean;
};

export type CompletedGameScore = {
  label: string;
  score: number;
};

export type SavedEventLog = {
  key: string;
  eventId: number;
  eventName: string;
  eventType: "League" | "Tournament";
  stageLabel: string;
};

export type SavedGameRecord = {
  id: string;
  sessionId: string;
  createdAt?: string;
  savedAt: string;
  competitionType: CompetitionType;
  format: BowlingFormat;
  bowlersPerTeam: number;
  centerName: string;
  patternName: string;
  eventLogKey: string;
  eventId: number | null;
  eventName: string;
  eventStageLabel: string;
  gameNumber: number;
  laneLabel: string;
  setNotes?: string;
  gameNotes?: string;
  ballReactionNotes?: string;
  laneTransitionNotes?: string;
  adjustmentNotes?: string;
  bowlerNames: string[];
  scores: CompletedGameScore[];
  entries: FrameEntry[];
};
