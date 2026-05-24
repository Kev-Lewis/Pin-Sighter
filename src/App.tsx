// Imports
// ==================

import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
} from "react";
import "./App.css";

// Types
// ==================

type Tab =
  | "home"
  | "log-games"
  | "stats"
  | "bowlers"
  | "centers"
  | "events"
  | "patterns"
  | "data";

type CompetitionType = "Open" | "League" | "Tournament";

type BowlingFormat =
  | "Singles"
  | "Doubles"
  | "Trios"
  | "Fours"
  | "Fives"
  | "Baker";

type Handedness = "Right" | "Left";

type BowlingBall = {
  id: number;
  name: string;
  brand: string;
  surface: string;
  layout: string;
  notes: string;
};

type Bowler = {
  id: number;
  name: string;
  handedness: Handedness;
  notes: string;
  arsenal: BowlingBall[];
};

type Center = {
  id: number;
  name: string;
  laneCount: number;
  notes: string;
};

type Pattern = {
  id: number;
  name: string;
  length: string;
  volume: string;
  ratio: string;
  dropBrush: string;
  source: string;
  notes: string;
};

type EventScheduleUnit = "Weeks" | "Days";

type EventSetup = {
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
  notes: string;
};

type CarryoverFields = {
  ballUsed: string;
  footBoard: string;
  targetArrow: string;
  targetBreakpoint: string;
  actualArrow: string;
  actualBreakpoint: string;
};

type FrameEntry = CarryoverFields & {
  frameNumber: number;
  bowlerName: string;
  firstShotKnockedPins: number[];
  secondShotKnockedPins: number[];
  thirdShotKnockedPins: number[];
  isComplete: boolean;
};

type LaneOption = {
  value: string;
  label: string;
};

type CompletedGameScore = {
  label: string;
  score: number;
};

type CompletedGameSummary = {
  gameNumber: number;
  laneLabel: string;
  scores: CompletedGameScore[];
  entries: FrameEntry[];
};

type SavedEventLog = {
  key: string;
  eventId: number;
  eventName: string;
  eventType: "League" | "Tournament";
  stageLabel: string;
};

type SavedGameRecord = {
  id: string;
  sessionId: string;
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
  bowlerNames: string[];
  scores: CompletedGameScore[];
  entries: FrameEntry[];
};

type LogGamesPageProps = {
  bowlers: Bowler[];
  centers: Center[];
  patterns: Pattern[];
  events: EventSetup[];
  savedEventLogs: SavedEventLog[];
  setSavedEventLogs: Dispatch<SetStateAction<SavedEventLog[]>>;
  setSavedGames: Dispatch<SetStateAction<SavedGameRecord[]>>;
};

type BowlersPageProps = {
  bowlers: Bowler[];
  setBowlers: Dispatch<SetStateAction<Bowler[]>>;
};

type CentersPageProps = {
  centers: Center[];
  setCenters: Dispatch<SetStateAction<Center[]>>;
};

type PatternsPageProps = {
  patterns: Pattern[];
  setPatterns: Dispatch<SetStateAction<Pattern[]>>;
};

type EventsPageProps = {
  events: EventSetup[];
  setEvents: Dispatch<SetStateAction<EventSetup[]>>;
  centers: Center[];
};

type StatsPageProps = {
  bowlers: Bowler[];
  centers: Center[];
  patterns: Pattern[];
  savedGames: SavedGameRecord[];
  setSavedGames: Dispatch<SetStateAction<SavedGameRecord[]>>;
  savedEventLogs: SavedEventLog[];
  setSavedEventLogs: Dispatch<SetStateAction<SavedEventLog[]>>;
};

type DataManagementPageProps = {
  bowlers: Bowler[];
  setBowlers: Dispatch<SetStateAction<Bowler[]>>;
  centers: Center[];
  setCenters: Dispatch<SetStateAction<Center[]>>;
  patterns: Pattern[];
  setPatterns: Dispatch<SetStateAction<Pattern[]>>;
  events: EventSetup[];
  setEvents: Dispatch<SetStateAction<EventSetup[]>>;
  savedEventLogs: SavedEventLog[];
  setSavedEventLogs: Dispatch<SetStateAction<SavedEventLog[]>>;
  savedGames: SavedGameRecord[];
  setSavedGames: Dispatch<SetStateAction<SavedGameRecord[]>>;
  backupData: PinSighterBackupData;
};

type PinSighterBackupData = {
  bowlers: Bowler[];
  centers: Center[];
  patterns: Pattern[];
  events: EventSetup[];
  savedEventLogs: SavedEventLog[];
  savedGames: SavedGameRecord[];
};

type PinSighterBackup = {
  appName: "Pin-Sighter";
  version: number;
  exportedAt: string;
  data: PinSighterBackupData;
};

type PinSighterImportResult = {
  data: PinSighterBackupData;
  warnings: string[];
};

type SetMetadataDraft = {
  centerName: string;
  patternName: string;
  gameLaneLabels: Record<string, string>;
  setNotes: string;
};

type GameMetadataDraft = {
  gameNotes: string;
};

type GameEntryPageProps = {
  bowlers: Bowler[];
  bowlerNames: string[];
  competitionType: CompetitionType;
  format: BowlingFormat;
  bowlersPerTeam: number;
  centerName: string;
  patternName: string;
  eventStageLabel: string;
  eventLogKey: string;
  eventName: string;
  eventId: number | null;
  laneMode: string;
  startingLaneOrPair: string;
  laneOptions: LaneOption[];
  seriesGameCount: number | null;
  onSavedEventLog: (savedLog: SavedEventLog) => void;
  onSaveCompletedGames: (savedGames: SavedGameRecord[]) => void;
  onBack: () => void;
};

type PinDeckProps = {
  knockedPins: number[];
  onChange: (knockedPins: number[]) => void;
  availablePins?: number[];
};

type BoardSelectProps = {
  label: string;
  value: string;
  options: number[];
  onChange: (value: string) => void;
};

type NewBallFormState = {
  name: string;
  brand: string;
  surface: string;
  layout: string;
  notes: string;
};

// Default Data
// ==================

const tabs: { id: Tab; label: string }[] = [
  { id: "log-games", label: "Log Games" },
  { id: "stats", label: "Stats" },
  { id: "bowlers", label: "Bowlers" },
  { id: "centers", label: "Bowling Centers" },
  { id: "events", label: "Tournaments / Leagues" },
  { id: "patterns", label: "Patterns" },
  { id: "data", label: "Data" },
];

const defaultCenters: Center[] = [
  { id: 1, name: "Titan Bowl", laneCount: 8, notes: "School bowling center" },
  { id: 2, name: "Bowlero Fullerton", laneCount: 40, notes: "" },
  { id: 3, name: "Temporary 24 Lane Center", laneCount: 24, notes: "" },
];

const defaultPatterns: Pattern[] = [
  {
    id: 0,
    name: "Unknown / House Shot",
    length: "",
    volume: "",
    ratio: "",
    dropBrush: "",
    source: "",
    notes: "Fallback pattern when the condition is unknown.",
  },
  {
    id: 1,
    name: "Custom Pattern",
    length: "",
    volume: "",
    ratio: "",
    dropBrush: "",
    source: "",
    notes: "",
  },
  {
    id: 2,
    name: "2025 PBA Wolf",
    length: "32",
    volume: "",
    ratio: "",
    dropBrush: "",
    source: "PBA",
    notes: "",
  },
];

const defaultEvents: EventSetup[] = [
  {
    id: 1,
    name: "Tuesday Night League",
    eventType: "League",
    format: "Singles",
    seriesGameCount: 3,
    bowlersPerPair: 10,
    scheduleUnit: "Weeks",
    scheduleCount: 12,
    startDate: "",
    endDate: "",
    centerId: 1,
    notes: "",
  },
  {
    id: 2,
    name: "Sport Shot League",
    eventType: "League",
    format: "Baker",
    seriesGameCount: 4,
    bowlersPerPair: 10,
    scheduleUnit: "Weeks",
    scheduleCount: 10,
    startDate: "",
    endDate: "",
    centerId: 2,
    notes: "",
  },
  {
    id: 3,
    name: "Wolf Qualifying Block",
    eventType: "Tournament",
    format: "Baker",
    seriesGameCount: 5,
    bowlersPerPair: 10,
    scheduleUnit: "Days",
    scheduleCount: 1,
    startDate: "",
    endDate: "",
    centerId: 2,
    notes: "",
  },
  {
    id: 4,
    name: "Scratch Sweeper",
    eventType: "Tournament",
    format: "Singles",
    seriesGameCount: 3,
    bowlersPerPair: 8,
    scheduleUnit: "Days",
    scheduleCount: 1,
    startDate: "",
    endDate: "",
    centerId: 3,
    notes: "",
  },
];

const defaultBowlers: Bowler[] = [
  {
    id: 1,
    name: "Kevin",
    handedness: "Right",
    notes: "",
    arsenal: [
      {
        id: 101,
        name: "Venom Shock",
        brand: "Motiv",
        surface: "2K",
        layout: "",
        notes: "Benchmark ball",
      },
      {
        id: 102,
        name: "IQ Tour",
        brand: "Storm",
        surface: "",
        layout: "",
        notes: "",
      },
      {
        id: 103,
        name: "Spare Ball",
        brand: "",
        surface: "",
        layout: "",
        notes: "",
      },
    ],
  },
  {
    id: 2,
    name: "Bowler 2",
    handedness: "Right",
    notes: "",
    arsenal: [
      {
        id: 201,
        name: "House Ball",
        brand: "",
        surface: "",
        layout: "",
        notes: "",
      },
    ],
  },
  {
    id: 3,
    name: "Bowler 3",
    handedness: "Right",
    notes: "",
    arsenal: [
      {
        id: 301,
        name: "House Ball",
        brand: "",
        surface: "",
        layout: "",
        notes: "",
      },
    ],
  },
  {
    id: 4,
    name: "Bowler 4",
    handedness: "Right",
    notes: "Sample Baker teammate",
    arsenal: [
      {
        id: 401,
        name: "House Ball",
        brand: "",
        surface: "",
        layout: "",
        notes: "",
      },
    ],
  },
  {
    id: 5,
    name: "Bowler 5",
    handedness: "Right",
    notes: "Sample Baker teammate",
    arsenal: [
      {
        id: 501,
        name: "House Ball",
        brand: "",
        surface: "",
        layout: "",
        notes: "",
      },
    ],
  },
];

const handednessOptions: Handedness[] = ["Right", "Left"];

const footBoardOptions = Array.from({ length: 81 }, (_, index) => index - 20);
const laneBoardOptions = Array.from({ length: 39 }, (_, index) => index + 1);
const ALL_PINS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const emptyBallForm: NewBallFormState = {
  name: "",
  brand: "",
  surface: "",
  layout: "",
  notes: "",
};

// Sample Data
// ==================

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

function createSampleSavedGames(): SavedGameRecord[] {
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

function createSampleSavedEventLogs(): SavedEventLog[] {
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


// Persistence Helpers
// ==================

const storageKeys = {
  bowlers: "pin-sighter:bowlers:v1",
  centers: "pin-sighter:centers:v1",
  patterns: "pin-sighter:patterns:v1",
  events: "pin-sighter:events:v1",
  savedEventLogs: "pin-sighter:saved-event-logs:v1",
  savedGames: "pin-sighter:saved-games:v1",
  appDataFileFallback: "pin-sighter:app-data-file-json:v1",
  temporaryBackup: "pin-sighter:temporary-backup-json:v1",
  setupComplete: "pin-sighter:setup-complete:v1",
};

const currentBackupVersion = 1;
const minimumSupportedBackupVersion = 1;
const dataFolderName = "data";
const backupFolderName = "back-ups";
const appDataFileName = "pin-sighter-data.json";
const temporaryBackupFileName = "pin-sighter-temporary-backup.json";

function loadFromLocalStorage<T>(key: string, fallbackValue: T): T {
  try {
    const storedValue = localStorage.getItem(key);

    if (!storedValue) {
      return fallbackValue;
    }

    return JSON.parse(storedValue) as T;
  } catch (error) {
    console.warn(`Unable to load ${key} from localStorage.`, error);
    return fallbackValue;
  }
}

function hasExistingPinSighterData() {
  return Object.entries(storageKeys).some(([storageName, key]) => {
    if (
      storageName === "temporaryBackup" ||
      storageName === "setupComplete" ||
      storageName === "appDataFileFallback"
    ) {
      return false;
    }

    return localStorage.getItem(key) !== null;
  });
}

function hasCompletedFirstLaunchSetup() {
  return (
    localStorage.getItem(storageKeys.setupComplete) === "true" ||
    hasExistingPinSighterData()
  );
}

function markFirstLaunchSetupComplete() {
  localStorage.setItem(storageKeys.setupComplete, "true");
}

function createEmptyBackupData(): PinSighterBackupData {
  return {
    bowlers: [],
    centers: [],
    patterns: [],
    events: [],
    savedEventLogs: [],
    savedGames: [],
  };
}

function createSampleBackupData(): PinSighterBackupData {
  return {
    bowlers: defaultBowlers,
    centers: defaultCenters,
    patterns: defaultPatterns,
    events: defaultEvents,
    savedEventLogs: createSampleSavedEventLogs(),
    savedGames: createSampleSavedGames(),
  };
}

function saveToLocalStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Unable to save ${key} to localStorage.`, error);
  }
}

function clearPinSighterLocalStorage() {
  Object.entries(storageKeys).forEach(([storageName, key]) => {
    if (storageName !== "temporaryBackup" && storageName !== "setupComplete") {
      localStorage.removeItem(key);
    }
  });
}

function createPinSighterBackup(data: PinSighterBackupData): PinSighterBackup {
  return {
    appName: "Pin-Sighter",
    version: currentBackupVersion,
    exportedAt: new Date().toISOString(),
    data,
  };
}

async function loadTauriFileSystem() {
  const dynamicImport = new Function(
    "specifier",
    "return import(specifier)"
  ) as (specifier: string) => Promise<Record<string, any>>;
  const pathApi = await dynamicImport("@tauri-apps/api/path");
  let fsApi: Record<string, any>;

  try {
    fsApi = await dynamicImport("@tauri-apps/plugin-fs");
  } catch {
    fsApi = await dynamicImport("@tauri-apps/api/fs");
  }

  return { pathApi, fsApi };
}

async function joinAppPath(pathApi: Record<string, any>, ...parts: string[]) {
  if (pathApi.join) {
    return pathApi.join(...parts);
  }

  return parts
    .map((part, index) =>
      index === 0 ? part.replace(/[\\/]$/, "") : part.replace(/^[\\/]/, "")
    )
    .join("/");
}

async function createTauriDirectory(fsApi: Record<string, any>, path: string) {
  if (fsApi.mkdir) {
    await fsApi.mkdir(path, { recursive: true });
    return;
  }

  if (fsApi.createDir) {
    await fsApi.createDir(path, { recursive: true });
  }
}

async function getAppStoragePaths() {
  const { pathApi, fsApi } = await loadTauriFileSystem();
  const appDataDir = await pathApi.appDataDir();
  const dataFolderPath = await joinAppPath(pathApi, appDataDir, dataFolderName);
  const backupFolderPath = await joinAppPath(
    pathApi,
    appDataDir,
    backupFolderName
  );

  return {
    fsApi,
    dataFolderPath,
    backupFolderPath,
    appDataFilePath: await joinAppPath(
      pathApi,
      dataFolderPath,
      appDataFileName
    ),
    temporaryBackupFilePath: await joinAppPath(
      pathApi,
      backupFolderPath,
      temporaryBackupFileName
    ),
  };
}

async function writeAppDataFile(backup: PinSighterBackup) {
  const backupJson = JSON.stringify(backup, null, 2);

  saveToLocalStorage(storageKeys.appDataFileFallback, backupJson);

  try {
    const storagePaths = await getAppStoragePaths();

    await createTauriDirectory(storagePaths.fsApi, storagePaths.dataFolderPath);
    await storagePaths.fsApi.writeTextFile(
      storagePaths.appDataFilePath,
      backupJson
    );

    return {
      ok: true,
      path: storagePaths.appDataFilePath,
      message: `App data saved to ${storagePaths.appDataFilePath}`,
    };
  } catch (error) {
    console.warn("Unable to write app data file.", error);

    return {
      ok: false,
      path: "localStorage fallback",
      message:
        "App data saved to localStorage fallback. File storage needs Tauri filesystem access.",
    };
  }
}

function createTimedOutAppDataResult() {
  return {
    ok: false,
    backup: null,
    path: "",
    message:
      "App data file check timed out. Continuing with localStorage or first-launch setup.",
  };
}

async function readAppDataFileWithTimeout(timeoutMs = 1500) {
  return Promise.race([
    readAppDataFile(),
    new Promise<Awaited<ReturnType<typeof readAppDataFile>>>((resolve) => {
      window.setTimeout(() => resolve(createTimedOutAppDataResult()), timeoutMs);
    }),
  ]);
}

async function readAppDataFile() {
  try {
    const storagePaths = await getAppStoragePaths();
    const backupJson = await storagePaths.fsApi.readTextFile(
      storagePaths.appDataFilePath
    );

    return {
      ok: true,
      backup: JSON.parse(backupJson) as PinSighterBackup,
      path: storagePaths.appDataFilePath,
      message: `App data loaded from ${storagePaths.appDataFilePath}`,
    };
  } catch (error) {
    console.warn("Unable to read app data file.", error);

    const fallbackJson = localStorage.getItem(storageKeys.appDataFileFallback);

    if (!fallbackJson) {
      return {
        ok: false,
        backup: null,
        path: "",
        message: "No app data file found.",
      };
    }

    try {
      return {
        ok: true,
        backup: JSON.parse(fallbackJson) as PinSighterBackup,
        path: "localStorage fallback",
        message: "App data loaded from localStorage fallback.",
      };
    } catch (fallbackError) {
      console.warn("Unable to read app data fallback.", fallbackError);

      return {
        ok: false,
        backup: null,
        path: "",
        message: "No valid app data file found.",
      };
    }
  }
}

async function writeTemporaryBackup(backup: PinSighterBackup) {
  const backupJson = JSON.stringify(backup, null, 2);

  saveToLocalStorage(storageKeys.temporaryBackup, backupJson);

  try {
    const storagePaths = await getAppStoragePaths();

    await createTauriDirectory(
      storagePaths.fsApi,
      storagePaths.backupFolderPath
    );
    await storagePaths.fsApi.writeTextFile(
      storagePaths.temporaryBackupFilePath,
      backupJson
    );

    return {
      ok: true,
      path: storagePaths.temporaryBackupFilePath,
      message: `Temporary backup saved to ${storagePaths.temporaryBackupFilePath}`,
    };
  } catch (error) {
    console.warn("Unable to write temporary backup file.", error);

    return {
      ok: false,
      path: "localStorage fallback",
      message:
        "Temporary backup saved to localStorage fallback. File backup needs Tauri filesystem access.",
    };
  }
}

// App Shell
// ==================

function App() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [hasCheckedAppDataFile, setHasCheckedAppDataFile] = useState(false);
  const [hasCompletedSetup, setHasCompletedSetup] = useState(() =>
    hasCompletedFirstLaunchSetup()
  );
  const [bowlers, setBowlers] = useState<Bowler[]>(() =>
    hasCompletedFirstLaunchSetup()
      ? loadFromLocalStorage(storageKeys.bowlers, defaultBowlers)
      : []
  );
  const [centers, setCenters] = useState<Center[]>(() =>
    hasCompletedFirstLaunchSetup()
      ? loadFromLocalStorage(storageKeys.centers, defaultCenters)
      : []
  );
  const [patterns, setPatterns] = useState<Pattern[]>(() =>
    hasCompletedFirstLaunchSetup()
      ? loadFromLocalStorage(storageKeys.patterns, defaultPatterns)
      : []
  );
  const [events, setEvents] = useState<EventSetup[]>(() =>
    hasCompletedFirstLaunchSetup()
      ? loadFromLocalStorage(storageKeys.events, defaultEvents)
      : []
  );
  const [savedEventLogs, setSavedEventLogs] = useState<SavedEventLog[]>(() =>
    hasCompletedFirstLaunchSetup()
      ? loadFromLocalStorage(storageKeys.savedEventLogs, createSampleSavedEventLogs())
      : []
  );
  const [savedGames, setSavedGames] = useState<SavedGameRecord[]>(() =>
    hasCompletedFirstLaunchSetup()
      ? loadFromLocalStorage(storageKeys.savedGames, createSampleSavedGames())
      : []
  );

  const backupData = useMemo(
    () => ({
      bowlers,
      centers,
      patterns,
      events,
      savedEventLogs,
      savedGames,
    }),
    [bowlers, centers, patterns, events, savedEventLogs, savedGames]
  );

  function applyBackupData(data: PinSighterBackupData) {
    setBowlers(data.bowlers);
    setCenters(data.centers);
    setPatterns(data.patterns);
    setEvents(data.events);
    setSavedEventLogs(data.savedEventLogs);
    setSavedGames(data.savedGames);
  }

  function completeSetup(data: PinSighterBackupData) {
    applyBackupData(data);
    markFirstLaunchSetupComplete();
    setHasCompletedSetup(true);
  }

  function handleStartEmpty() {
    completeSetup(createEmptyBackupData());
  }

  function handleStartWithSampleData() {
    completeSetup(createSampleBackupData());
  }

  useEffect(() => {
    let isMounted = true;

    async function loadSavedAppDataFile() {
      try {
        const appDataFileResult = await readAppDataFileWithTimeout();

        if (!isMounted) {
          return;
        }

        if (appDataFileResult.ok && appDataFileResult.backup) {
          const importResult = getImportedBackupData(appDataFileResult.backup);

          applyBackupData(importResult.data);
          markFirstLaunchSetupComplete();
          setHasCompletedSetup(true);
        }
      } catch (error) {
        console.warn("Unable to complete app data file check.", error);
      } finally {
        if (isMounted) {
          setHasCheckedAppDataFile(true);
        }
      }
    }

    loadSavedAppDataFile();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hasCompletedSetup || !hasCheckedAppDataFile) {
      return;
    }

    saveToLocalStorage(storageKeys.bowlers, bowlers);
  }, [hasCompletedSetup, hasCheckedAppDataFile, bowlers]);

  useEffect(() => {
    if (!hasCompletedSetup || !hasCheckedAppDataFile) {
      return;
    }

    saveToLocalStorage(storageKeys.centers, centers);
  }, [hasCompletedSetup, hasCheckedAppDataFile, centers]);

  useEffect(() => {
    if (!hasCompletedSetup || !hasCheckedAppDataFile) {
      return;
    }

    saveToLocalStorage(storageKeys.patterns, patterns);
  }, [hasCompletedSetup, hasCheckedAppDataFile, patterns]);

  useEffect(() => {
    if (!hasCompletedSetup || !hasCheckedAppDataFile) {
      return;
    }

    saveToLocalStorage(storageKeys.events, events);
  }, [hasCompletedSetup, hasCheckedAppDataFile, events]);

  useEffect(() => {
    if (!hasCompletedSetup || !hasCheckedAppDataFile) {
      return;
    }

    saveToLocalStorage(storageKeys.savedEventLogs, savedEventLogs);
  }, [hasCompletedSetup, hasCheckedAppDataFile, savedEventLogs]);

  useEffect(() => {
    if (!hasCompletedSetup || !hasCheckedAppDataFile) {
      return;
    }

    saveToLocalStorage(storageKeys.savedGames, savedGames);
  }, [hasCompletedSetup, hasCheckedAppDataFile, savedGames]);

  useEffect(() => {
    const handleBrowserUnload = () => {
      const backup = createPinSighterBackup(backupData);
      saveToLocalStorage(storageKeys.temporaryBackup, JSON.stringify(backup, null, 2));
    };

    if (!hasCompletedSetup) {
      return;
    }

    window.addEventListener("beforeunload", handleBrowserUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBrowserUnload);
    };
  }, [hasCompletedSetup, backupData]);

  useEffect(() => {
    if (!hasCompletedSetup || !hasCheckedAppDataFile) {
      return;
    }

    const appDataSaveDelay = window.setTimeout(() => {
      writeAppDataFile(createPinSighterBackup(backupData));
    }, 500);

    return () => {
      window.clearTimeout(appDataSaveDelay);
    };
  }, [hasCompletedSetup, hasCheckedAppDataFile, backupData]);

  useEffect(() => {
    if (!hasCompletedSetup || !hasCheckedAppDataFile) {
      return;
    }

    const autoBackupDelay = window.setTimeout(() => {
      writeTemporaryBackup(createPinSighterBackup(backupData));
    }, 1000);

    return () => {
      window.clearTimeout(autoBackupDelay);
    };
  }, [hasCompletedSetup, hasCheckedAppDataFile, backupData]);

  async function handleCloseApp() {
    const backup = createPinSighterBackup(backupData);

    await writeAppDataFile(backup);
    await writeTemporaryBackup(backup);

    try {
      const tauriWindowApi = (await import("@tauri-apps/api/window")) as {
        getCurrentWindow?: () => { close: () => Promise<void> };
        appWindow?: { close: () => Promise<void> };
      };
      const currentWindow =
        tauriWindowApi.getCurrentWindow?.() ?? tauriWindowApi.appWindow;

      if (currentWindow?.close) {
        await currentWindow.close();
        return;
      }
    } catch (error) {
      console.warn("Tauri close unavailable; using browser close fallback.", error);
    }

    window.close();
  }

  return (
    <main className="app-shell">
      <section className="logo-card" onClick={() => setActiveTab("home")}>
        <h1>Pin-Sighter</h1>
        <p>Bowling Game Logger, Shot Tracker, stats, and analytics</p>
      </section>

      {!hasCheckedAppDataFile ? (
        <section className="setup-card">
          <h2>Loading Pin-Sighter</h2>
          <p>Checking for a saved app data file. This should only take a moment.</p>
        </section>
      ) : !hasCompletedSetup ? (
        <section className="setup-card">
          <h2>Set Up Pin-Sighter</h2>
          <p>
            Choose how you want to start. You can load sample data for testing
            or start empty and build your own bowlers, centers, patterns, and
            saved sets from scratch.
          </p>

          <div className="setup-button-row">
            <button className="primary-button" onClick={handleStartWithSampleData}>
              Load Sample Data
            </button>
            <button className="secondary-button" onClick={handleStartEmpty}>
              Start Empty
            </button>
          </div>
        </section>
      ) : activeTab === "home" ? (
        <nav className="home-nav">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className="nav-button"
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}

          <button
            type="button"
            className="nav-button close-app-button"
            onClick={handleCloseApp}
          >
            Close
          </button>
        </nav>
      ) : (
        <section className="page-card">
          <button className="back-button" onClick={() => setActiveTab("home")}>
            ← Back
          </button>

          {activeTab === "log-games" && (
            <LogGamesPage
              bowlers={bowlers}
              centers={centers}
              patterns={patterns}
              events={events}
              savedEventLogs={savedEventLogs}
              setSavedEventLogs={setSavedEventLogs}
              setSavedGames={setSavedGames}
            />
          )}
          {activeTab === "stats" && (
            <StatsPage
              bowlers={bowlers}
              centers={centers}
              patterns={patterns}
              savedGames={savedGames}
              setSavedGames={setSavedGames}
              savedEventLogs={savedEventLogs}
              setSavedEventLogs={setSavedEventLogs}
            />
          )}
          {activeTab === "bowlers" && (
            <BowlersPage bowlers={bowlers} setBowlers={setBowlers} />
          )}
          {activeTab === "centers" && (
            <CentersPage centers={centers} setCenters={setCenters} />
          )}
          {activeTab === "events" && (
            <EventsPage
              events={events}
              setEvents={setEvents}
              centers={centers}
            />
          )}
          {activeTab === "patterns" && (
            <PatternsPage patterns={patterns} setPatterns={setPatterns} />
          )}
          {activeTab === "data" && (
            <DataManagementPage
              bowlers={bowlers}
              setBowlers={setBowlers}
              centers={centers}
              setCenters={setCenters}
              patterns={patterns}
              setPatterns={setPatterns}
              events={events}
              setEvents={setEvents}
              savedEventLogs={savedEventLogs}
              setSavedEventLogs={setSavedEventLogs}
              savedGames={savedGames}
              setSavedGames={setSavedGames}
              backupData={backupData}
            />
          )}
        </section>
      )}
    </main>
  );
}


// Data Management
// ==================

function DataManagementPage({
  bowlers,
  setBowlers,
  centers,
  setCenters,
  patterns,
  setPatterns,
  events,
  setEvents,
  savedEventLogs,
  setSavedEventLogs,
  savedGames,
  setSavedGames,
  backupData,
}: DataManagementPageProps) {
  const [dataMessage, setDataMessage] = useState("");

  function handleExportData() {
    const backup = createPinSighterBackup(backupData);

    downloadJsonBackup(
      `pin-sighter-backup-${formatBackupFileTimestamp()}.json`,
      backup
    );
    setDataMessage("Backup exported.");
  }

  async function handleSaveAppDataFile() {
    const saveResult = await writeAppDataFile(createPinSighterBackup(backupData));

    setDataMessage(saveResult.message);
  }

  async function handleCreateTemporaryBackup() {
    const backupResult = await writeTemporaryBackup(
      createPinSighterBackup(backupData)
    );

    setDataMessage(backupResult.message);
  }

  async function handleImportData(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const parsedBackup = JSON.parse(await file.text()) as
        | PinSighterBackup
        | PinSighterBackupData;
      const importResult = getImportedBackupData(parsedBackup);
      const importedData = importResult.data;

      setBowlers(importedData.bowlers);
      setCenters(importedData.centers);
      setPatterns(importedData.patterns);
      setEvents(importedData.events);
      setSavedEventLogs(importedData.savedEventLogs);
      setSavedGames(importedData.savedGames);
      markFirstLaunchSetupComplete();
      setDataMessage(
        importResult.warnings.length > 0
          ? `Backup imported with warnings: ${importResult.warnings.join(" ")}`
          : "Backup imported."
      );
    } catch (error) {
      console.error("Import failed.", error);
      setDataMessage("Import failed. Make sure the file is a Pin-Sighter JSON backup.");
    } finally {
      event.target.value = "";
    }
  }

  function handleResetToSampleData() {
    if (
      !window.confirm(
        "Reset everything to the sample/default Pin-Sighter data?"
      )
    ) {
      return;
    }

    clearPinSighterLocalStorage();
    loadSampleData();
    markFirstLaunchSetupComplete();
    setDataMessage("App data reset to sample/default data.");
  }

  function handleClearData() {
    if (
      !window.confirm(
        "Clear all Pin-Sighter data and start empty? This cannot be undone unless you have a backup."
      )
    ) {
      return;
    }

    clearPinSighterLocalStorage();
    const emptyData = createEmptyBackupData();
    setBowlers(emptyData.bowlers);
    setCenters(emptyData.centers);
    setPatterns(emptyData.patterns);
    setEvents(emptyData.events);
    setSavedEventLogs(emptyData.savedEventLogs);
    setSavedGames(emptyData.savedGames);
    markFirstLaunchSetupComplete();
    setDataMessage("All app data cleared.");
  }

  function handleLoadSampleData() {
    if (
      !window.confirm(
        "Load the sample/default data? This will replace the current app data."
      )
    ) {
      return;
    }

    loadSampleData();
    markFirstLaunchSetupComplete();
    setDataMessage("Sample/default data loaded.");
  }

  function loadSampleData() {
    const sampleData = createSampleBackupData();

    setBowlers(sampleData.bowlers);
    setCenters(sampleData.centers);
    setPatterns(sampleData.patterns);
    setEvents(sampleData.events);
    setSavedEventLogs(sampleData.savedEventLogs);
    setSavedGames(sampleData.savedGames);
  }

  return (
    <>
      <h2>Data</h2>
      <p>
        Back up, restore, reset, or clear the data stored on this device.
      </p>

      {dataMessage && <p className="success-text">{dataMessage}</p>}

      <section className="data-summary-grid">
        <article className="stat-card">
          <span>Bowlers</span>
          <strong>{bowlers.length}</strong>
        </article>
        <article className="stat-card">
          <span>Centers</span>
          <strong>{centers.length}</strong>
        </article>
        <article className="stat-card">
          <span>Patterns</span>
          <strong>{patterns.length}</strong>
        </article>
        <article className="stat-card">
          <span>Leagues / Tournaments</span>
          <strong>{events.length}</strong>
        </article>
        <article className="stat-card">
          <span>Saved Sets</span>
          <strong>{new Set(savedGames.map((game) => game.sessionId)).size}</strong>
        </article>
        <article className="stat-card">
          <span>Saved Games</span>
          <strong>{savedGames.length}</strong>
        </article>
        <article className="stat-card">
          <span>Backup Version</span>
          <strong>v{currentBackupVersion}</strong>
        </article>
      </section>

      <section className="data-card">
        <div>
          <h3>App Data File</h3>
          <p>
            Pin-Sighter automatically saves the main app data file to the app
            data folder under data/{appDataFileName}. localStorage is kept as a
            fallback.
          </p>
        </div>
        <button className="secondary-button" onClick={handleSaveAppDataFile}>
          Save App Data File Now
        </button>
      </section>

      <section className="data-card">
        <div>
          <h3>Backup</h3>
          <p>
            Export one JSON file with all bowlers, centers, patterns, events,
            saved sets, and saved games.
          </p>
        </div>
        <button className="primary-button" onClick={handleExportData}>
          Export All Data
        </button>
      </section>

      <section className="data-card">
        <div>
          <h3>Temporary Backup</h3>
          <p>
            The app automatically updates a temporary JSON backup shortly after
            data changes. In Tauri, this is saved in the app data folder under
            back-ups/{temporaryBackupFileName}. Browser mode keeps a
            localStorage fallback.
          </p>
        </div>
        <button className="secondary-button" onClick={handleCreateTemporaryBackup}>
          Create Temporary Backup
        </button>
      </section>

      <section className="data-card">
        <div>
          <h3>Restore</h3>
          <p>
            Import a Pin-Sighter JSON backup. This replaces the current app data.
          </p>
        </div>
        <label className="import-button">
          Import Data
          <input type="file" accept="application/json,.json" onChange={handleImportData} />
        </label>
      </section>

      <section className="data-card">
        <div>
          <h3>Sample / Reset</h3>
          <p>
            Reset to sample data, load sample data again, or clear everything
            and start empty.
          </p>
        </div>
        <div className="data-button-row">
          <button className="secondary-button" onClick={handleResetToSampleData}>
            Reset App Data
          </button>
          <button className="secondary-button" onClick={handleLoadSampleData}>
            Load Sample Data
          </button>
          <button className="danger-button" onClick={handleClearData}>
            Clear Sample Data
          </button>
        </div>
      </section>
    </>
  );
}

function getImportedBackupData(
  parsedBackup: PinSighterBackup | PinSighterBackupData
): PinSighterImportResult {
  const warnings: string[] = [];
  const hasBackupWrapper = "data" in parsedBackup;
  const backupVersion = hasBackupWrapper ? parsedBackup.version ?? 0 : 0;
  const importedData = hasBackupWrapper ? parsedBackup.data : parsedBackup;

  if (!hasBackupWrapper) {
    warnings.push("Legacy backup format detected.");
  } else if (backupVersion < minimumSupportedBackupVersion) {
    warnings.push(
      `Backup version ${backupVersion} is older than the supported version.`
    );
  } else if (backupVersion > currentBackupVersion) {
    warnings.push(
      `Backup version ${backupVersion} is newer than this app version, so newer fields may be ignored.`
    );
  }

  return {
    data: normalizeImportedBackupData(importedData, warnings),
    warnings,
  };
}

function normalizeImportedBackupData(
  importedData: Partial<PinSighterBackupData>,
  warnings: string[]
): PinSighterBackupData {
  return {
    bowlers: getImportedArray(importedData, "bowlers", warnings),
    centers: getImportedArray(importedData, "centers", warnings),
    patterns: getImportedArray(importedData, "patterns", warnings),
    events: getImportedArray(importedData, "events", warnings),
    savedEventLogs: getImportedArray(
      importedData,
      "savedEventLogs",
      warnings
    ),
    savedGames: getImportedArray(importedData, "savedGames", warnings),
  };
}

function getImportedArray<K extends keyof PinSighterBackupData>(
  importedData: Partial<PinSighterBackupData>,
  key: K,
  warnings: string[]
): PinSighterBackupData[K] {
  if (Array.isArray(importedData[key])) {
    return importedData[key] as PinSighterBackupData[K];
  }

  warnings.push(`Missing or invalid ${key}; using an empty list.`);

  return [] as unknown as PinSighterBackupData[K];
}

function downloadJsonBackup(fileName: string, backup: PinSighterBackup) {
  const backupBlob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json",
  });
  const downloadUrl = URL.createObjectURL(backupBlob);
  const downloadLink = document.createElement("a");

  downloadLink.href = downloadUrl;
  downloadLink.download = fileName;
  downloadLink.click();

  URL.revokeObjectURL(downloadUrl);
}

function formatBackupFileTimestamp() {
  return new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
}

// Log Games
// ==================

function LogGamesPage({
  bowlers,
  centers,
  patterns,
  events,
  savedEventLogs,
  setSavedEventLogs,
  setSavedGames,
}: LogGamesPageProps) {
  const [showGameEntry, setShowGameEntry] = useState(false);

  const [competitionType, setCompetitionType] =
    useState<CompetitionType>("Open");
  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedEventStage, setSelectedEventStage] = useState("");
  const [format, setFormat] = useState<BowlingFormat>("Singles");
  const [bowlersPerTeam, setBowlersPerTeam] = useState("1");
  const [hasVacantOrBlindBowlers, setHasVacantOrBlindBowlers] =
    useState(false);
  const [selectedCenterId, setSelectedCenterId] = useState("");
  const [selectedPatternId, setSelectedPatternId] = useState("0");
  const [laneMode, setLaneMode] = useState("Pair");
  const [startingLaneOrPair, setStartingLaneOrPair] = useState("");
  const [selectedBowlers, setSelectedBowlers] = useState<string[]>([""]);

  const isOpen = competitionType === "Open";
  const isLimitedSeries = !isOpen;

  const availableEvents = events.filter(
    (event) => event.eventType === competitionType
  );

  const selectedEvent = events.find(
    (event) => String(event.id) === selectedEventId
  );

  const selectedCenter = isOpen
    ? centers.find((center) => String(center.id) === selectedCenterId)
    : centers.find((center) => center.id === selectedEvent?.centerId);

  const selectedPattern = patterns.find(
    (pattern) => String(pattern.id) === selectedPatternId
  );

  const activeFormat = selectedEvent?.format ?? format;
  const enteredBowlersPerPair = Math.max(
    1,
    Math.floor(Number(bowlersPerTeam) || 1)
  );
  const activeBowlersPerPair =
    !isOpen && selectedEvent && !hasVacantOrBlindBowlers
      ? selectedEvent.bowlersPerPair
      : enteredBowlersPerPair;

  const seriesGameCount = isLimitedSeries
    ? selectedEvent?.seriesGameCount ?? null
    : null;

  const eventStageOptions =
    selectedEvent && selectedEvent.scheduleCount > 0
      ? Array.from(
          { length: selectedEvent.scheduleCount },
          (_, index) => index + 1
        )
      : [];

  const eventStageSingular =
    selectedEvent?.scheduleUnit === "Days" ? "Day" : "Week";

  const eventStageLabel =
    selectedEvent && selectedEventStage
      ? `${eventStageSingular} ${selectedEventStage}`
      : "";

  const eventLogKey =
    selectedEvent && selectedEventStage
      ? `${selectedEvent.id}:${selectedEvent.scheduleUnit}:${selectedEventStage}`
      : "";

  const alreadyLoggedEventStage =
    eventLogKey !== "" &&
    savedEventLogs.some((savedLog) => savedLog.key === eventLogKey);

  const bowlerSlotCount = getBowlerSlotCount(activeFormat);
  const activeBowlers = selectedBowlers.filter(Boolean);

  const laneOptions = useMemo<LaneOption[]>(() => {
    if (!selectedCenter) {
      return [];
    }

    if (laneMode === "Single Lane") {
      return Array.from({ length: selectedCenter.laneCount }, (_, index) => {
        const laneNumber = index + 1;

        return {
          value: String(laneNumber),
          label: `Lane ${laneNumber}`,
        };
      });
    }

    return Array.from(
      { length: Math.floor(selectedCenter.laneCount / 2) },
      (_, index) => {
        const leftLane = index * 2 + 1;
        const rightLane = leftLane + 1;

        return {
          value: `${leftLane}/${rightLane}`,
          label: `Pair ${leftLane}/${rightLane}`,
        };
      }
    );
  }, [selectedCenter, laneMode]);

  function handleCompetitionTypeChange(newCompetitionType: CompetitionType) {
    setCompetitionType(newCompetitionType);
    setSelectedEventId("");
    setSelectedEventStage("");
    setHasVacantOrBlindBowlers(false);
    setSelectedCenterId("");
    setSelectedPatternId("0");
    setStartingLaneOrPair("");
  }

  function handleFormatChange(newFormat: BowlingFormat) {
    setFormat(newFormat);
    setBowlersPerTeam(String(getDefaultTeamSize(newFormat)));

    const newSlotCount = getBowlerSlotCount(newFormat);

    setSelectedBowlers((currentBowlers) => {
      const resizedBowlers = currentBowlers.slice(0, newSlotCount);

      while (resizedBowlers.length < newSlotCount) {
        resizedBowlers.push("");
      }

      return resizedBowlers;
    });
  }

  function handleEventChange(newEventId: string) {
    setSelectedEventId(newEventId);
    setSelectedEventStage("");
    setStartingLaneOrPair("");

    const nextEvent = events.find((event) => String(event.id) === newEventId);

    if (nextEvent) {
      const nextSlotCount = getBowlerSlotCount(nextEvent.format);

      setBowlersPerTeam(String(nextEvent.bowlersPerPair));
      setHasVacantOrBlindBowlers(false);

      setSelectedBowlers((currentBowlers) => {
        const resizedBowlers = currentBowlers.slice(0, nextSlotCount);

        while (resizedBowlers.length < nextSlotCount) {
          resizedBowlers.push("");
        }

        return resizedBowlers;
      });
    }
  }

  function handleCenterChange(newCenterId: string) {
    setSelectedCenterId(newCenterId);
    setStartingLaneOrPair("");
  }

  function handleLaneModeChange(newLaneMode: string) {
    setLaneMode(newLaneMode);
    setStartingLaneOrPair("");
  }

  function handleBowlerChange(index: number, bowlerName: string) {
    setSelectedBowlers((currentBowlers) => {
      const updatedBowlers = [...currentBowlers];
      updatedBowlers[index] = bowlerName;
      return updatedBowlers;
    });
  }

  const selectedNonEmptyBowlers = selectedBowlers.filter(Boolean);

  const hasEnoughBowlers =
    activeFormat === "Baker"
      ? selectedBowlers[0] !== "" && selectedBowlers[1] !== ""
      : selectedBowlers[0] !== "";

  const hasDuplicateBowlers =
    new Set(selectedNonEmptyBowlers).size !== selectedNonEmptyBowlers.length;

  const hasRequiredEvent = isOpen || selectedEvent !== undefined;
  const hasRequiredEventStage =
    isOpen || eventStageOptions.length === 0 || selectedEventStage !== "";

  const canStartGame =
    hasRequiredEvent &&
    hasRequiredEventStage &&
    selectedCenter !== undefined &&
    selectedPattern !== undefined &&
    startingLaneOrPair !== "" &&
    hasEnoughBowlers &&
    !hasDuplicateBowlers &&
    activeBowlersPerPair >= 1 &&
    !alreadyLoggedEventStage;

  const bowlersForGame = activeBowlers;

  if (showGameEntry) {
    return (
      <GameEntryPage
        bowlers={bowlers}
        bowlerNames={bowlersForGame}
        competitionType={competitionType}
        format={activeFormat}
        bowlersPerTeam={activeBowlersPerPair}
        centerName={selectedCenter?.name ?? "Unknown Center"}
        patternName={selectedPattern?.name ?? "Unknown Pattern"}
        eventStageLabel={eventStageLabel}
        eventLogKey={eventLogKey}
        eventName={selectedEvent?.name ?? ""}
        eventId={selectedEvent?.id ?? null}
        laneMode={laneMode}
        startingLaneOrPair={startingLaneOrPair}
        laneOptions={laneOptions}
        seriesGameCount={seriesGameCount}
        onSavedEventLog={(savedLog) =>
          setSavedEventLogs((currentLogs) =>
            currentLogs.some((currentLog) => currentLog.key === savedLog.key)
              ? currentLogs
              : [...currentLogs, savedLog]
          )
        }
        onSaveCompletedGames={(newSavedGames) =>
          setSavedGames((currentSavedGames) => [
            ...currentSavedGames,
            ...newSavedGames,
          ])
        }
        onBack={() => setShowGameEntry(false)}
      />
    );
  }

  return (
    <>
      <h2>Log Games</h2>
      <p>
        Set up an open, league, or tournament session before entering shot data.
      </p>

      <div className="form-grid">
        <label>
          Competition Type
          <select
            value={competitionType}
            onChange={(event) =>
              handleCompetitionTypeChange(
                event.target.value as CompetitionType
              )
            }
          >
            <option>Open</option>
            <option>League</option>
            <option>Tournament</option>
          </select>
        </label>

        {isLimitedSeries && (
          <label>
            {competitionType} <span className="required">*</span>
            <select
              value={selectedEventId}
              onChange={(event) => handleEventChange(event.target.value)}
            >
              <option value="">Select {competitionType.toLowerCase()}</option>

              {availableEvents.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <label>
          Format
          <select
            value={activeFormat}
            disabled={!isOpen}
            onChange={(event) =>
              handleFormatChange(event.target.value as BowlingFormat)
            }
          >
            <option>Singles</option>
            <option>Doubles</option>
            <option>Trios</option>
            <option>Fours</option>
            <option>Fives</option>
            <option>Baker</option>
          </select>
        </label>

        <label>
          Bowlers Per Pair <span className="required">*</span>
          <input
            type="number"
            min="1"
            value={bowlersPerTeam}
            disabled={!isOpen && !hasVacantOrBlindBowlers}
            onChange={(event) => setBowlersPerTeam(event.target.value)}
            placeholder="Example: 10"
          />
        </label>

        {!isOpen && selectedEvent && (
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={hasVacantOrBlindBowlers}
              onChange={(event) => {
                setHasVacantOrBlindBowlers(event.target.checked);

                if (!event.target.checked) {
                  setBowlersPerTeam(String(selectedEvent.bowlersPerPair));
                }
              }}
            />
            Vacant / blind / unopposed adjustment
          </label>
        )}

        {isOpen && (
          <label>
            Bowling Center <span className="required">*</span>
            <select
              value={selectedCenterId}
              onChange={(event) => handleCenterChange(event.target.value)}
            >
              <option value="">Select bowling center</option>

              {centers.map((center) => (
                <option key={center.id} value={center.id}>
                  {center.name} — {center.laneCount} lanes
                </option>
              ))}
            </select>
          </label>
        )}

        <label>
          Pattern
          <select
            value={selectedPatternId}
            onChange={(event) => setSelectedPatternId(event.target.value)}
          >
            {patterns.map((pattern) => (
              <option key={pattern.id} value={pattern.id}>
                {pattern.name}
              </option>
            ))}
          </select>
        </label>

        {selectedEvent && eventStageOptions.length > 0 && (
          <label>
            {eventStageSingular} <span className="required">*</span>
            <select
              value={selectedEventStage}
              onChange={(event) => setSelectedEventStage(event.target.value)}
            >
              <option value="">Select {eventStageSingular.toLowerCase()}</option>
              {eventStageOptions.map((stageNumber) => (
                <option key={stageNumber} value={stageNumber}>
                  {eventStageSingular} {stageNumber}
                </option>
              ))}
            </select>
          </label>
        )}

        <label>
          Lane Mode
          <select
            value={laneMode}
            onChange={(event) => handleLaneModeChange(event.target.value)}
            disabled={!selectedCenter}
          >
            <option>Single Lane</option>
            <option>Pair</option>
          </select>
        </label>

        <label>
          Starting Pair/Lane <span className="required">*</span>
          <select
            value={startingLaneOrPair}
            onChange={(event) => setStartingLaneOrPair(event.target.value)}
            disabled={!selectedCenter}
          >
            <option value="">
              {!selectedCenter
                ? isOpen
                  ? "Select center first"
                  : `Select ${competitionType.toLowerCase()} first`
                : laneMode === "Pair"
                ? "Select starting pair"
                : "Select starting lane"}
            </option>

            {laneOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {selectedEvent && (
        <section className="event-summary-card">
          <h3>{selectedEvent.name}</h3>
          <p>
            <strong>Format:</strong> {selectedEvent.format}
          </p>
          <p>
            <strong>Games in Series/Block:</strong>{" "}
            {selectedEvent.seriesGameCount}
          </p>
          <p>
            <strong>Bowlers Per Pair:</strong> {activeBowlersPerPair}
            {hasVacantOrBlindBowlers &&
              ` (event default: ${selectedEvent.bowlersPerPair})`}
          </p>
          <p>
            <strong>Schedule:</strong> {selectedEvent.scheduleCount}{" "}
            {selectedEvent.scheduleUnit.toLowerCase()}
          </p>
          {eventStageLabel && (
            <p>
              <strong>Logging For:</strong> {eventStageLabel}
            </p>
          )}
          {alreadyLoggedEventStage && (
            <p className="error-text">
              This {eventStageSingular.toLowerCase()} has already been saved.
              Delete the original saved log before entering it again.
            </p>
          )}
          <p>
            <strong>Bowling Center:</strong> {selectedCenter?.name}
          </p>
          <p>
            <strong>Pattern:</strong> {selectedPattern?.name} for this {eventStageSingular.toLowerCase()}
          </p>
        </section>
      )}

      <section className="bowler-order-card">
        <h3>Bowler Order</h3>
        <p>
          {activeFormat === "Baker"
            ? "For Baker, choose 2 to 5 tracked bowlers. Positions 1 and 2 are required; positions 3–5 are optional."
            : "Choose at least one bowler to track. Additional team members are optional if you want individual stats for more of the lineup."}
        </p>

        {activeFormat === "Baker" && (
          <BakerRotationPreview selectedBowlers={activeBowlers} />
        )}

        <div className="form-grid">
          {Array.from({ length: bowlerSlotCount }, (_, index) => {
            const isRequired =
              activeFormat === "Baker" ? index < 2 : index === 0;

            return (
              <label key={index}>
                {activeFormat === "Baker"
                  ? `Baker Position ${index + 1}`
                  : `Bowler ${index + 1}`}{" "}
                {isRequired ? (
                  <span className="required">*</span>
                ) : (
                  <span className="helper-text">Optional</span>
                )}
                <select
                  value={selectedBowlers[index] ?? ""}
                  onChange={(event) =>
                    handleBowlerChange(index, event.target.value)
                  }
                >
                  <option value="">Select bowler</option>

                  {bowlers.map((bowler) => (
                    <option
                      key={bowler.id}
                      value={bowler.name}
                      disabled={
                        selectedBowlers.includes(bowler.name) &&
                        selectedBowlers[index] !== bowler.name
                      }
                    >
                      {bowler.name}
                    </option>
                  ))}
                </select>
              </label>
            );
          })}
        </div>

        {hasDuplicateBowlers && (
          <p className="error-text">Each bowler can only be selected once.</p>
        )}
      </section>

      <button
        className="primary-button"
        disabled={!canStartGame}
        onClick={() => setShowGameEntry(true)}
      >
        Start Game
      </button>

      {!canStartGame && (
        <p className={alreadyLoggedEventStage ? "error-text" : "helper-text"}>
          {alreadyLoggedEventStage
            ? `This ${eventStageSingular.toLowerCase()} already has saved data. Delete the original saved log before logging it again.`
            : activeFormat === "Baker"
            ? "Select at least 2 Baker bowlers, a starting pair/lane, and any required event setup to begin."
            : isOpen
            ? "Select a bowling center, pattern, bowlers per pair, starting pair/lane, and at least one bowler to begin."
            : `Select a ${competitionType.toLowerCase()}, week/day, pattern, starting pair/lane, and at least one bowler to begin.`}
        </p>
      )}
    </>
  );
}

// Log Games Helpers
// ==================

function getBowlerSlotCount(format: BowlingFormat) {
  switch (format) {
    case "Doubles":
      return 2;
    case "Trios":
      return 3;
    case "Fours":
      return 4;
    case "Fives":
    case "Baker":
      return 5;
    case "Singles":
    default:
      return 1;
  }
}

function getDefaultTeamSize(format: BowlingFormat) {
  switch (format) {
    case "Doubles":
      return 2;
    case "Trios":
      return 3;
    case "Fours":
      return 4;
    case "Fives":
    case "Baker":
      return 5;
    case "Singles":
    default:
      return 1;
  }
}

function BakerRotationPreview({
  selectedBowlers,
}: {
  selectedBowlers: string[];
}) {
  if (selectedBowlers.length < 2) {
    return (
      <p className="helper-text">
        Choose at least 2 bowlers to preview the Baker frame rotation.
      </p>
    );
  }

  const assignments = selectedBowlers.map((bowlerName, bowlerIndex) => {
    const frames = Array.from({ length: 10 }, (_, index) => index + 1).filter(
      (frameNumber) =>
        (frameNumber - 1) % selectedBowlers.length === bowlerIndex
    );

    return {
      bowlerName,
      position: bowlerIndex + 1,
      frames,
    };
  });

  return (
    <section className="baker-rotation-card">
      <h4>Baker Rotation Preview</h4>

      <div className="baker-rotation-list">
        {assignments.map((assignment) => (
          <p key={assignment.position}>
            <strong>
              Position {assignment.position} — {assignment.bowlerName}:
            </strong>{" "}
            Frames {assignment.frames.join(", ")}
          </p>
        ))}
      </div>
    </section>
  );
}

// Bowlers
// ==================

function BowlersPage({ bowlers, setBowlers }: BowlersPageProps) {
  const [newBowlerName, setNewBowlerName] = useState("");
  const [newBowlerHandedness, setNewBowlerHandedness] =
    useState<Handedness>("Right");
  const [newBowlerNotes, setNewBowlerNotes] = useState("");
  const [newBallForms, setNewBallForms] = useState<
    Record<number, NewBallFormState>
  >({});
  const [bowlerDrafts, setBowlerDrafts] = useState<Record<number, Bowler>>({});

  function getBowlerDraft(bowler: Bowler) {
    return bowlerDrafts[bowler.id] ?? bowler;
  }

  function hasBowlerChanged(bowler: Bowler) {
    const draft = bowlerDrafts[bowler.id];

    if (!draft) {
      return false;
    }

    return JSON.stringify(draft) !== JSON.stringify(bowler);
  }

  function updateBowlerDraft(bowler: Bowler, updates: Partial<Bowler>) {
    setBowlerDrafts((currentDrafts) => ({
      ...currentDrafts,
      [bowler.id]: {
        ...getBowlerDraft(bowler),
        ...updates,
      },
    }));
  }

  function saveBowler(bowlerId: number) {
    const draft = bowlerDrafts[bowlerId];

    if (!draft) {
      return;
    }

    const trimmedName = draft.name.trim();

    if (!trimmedName) {
      window.alert("Bowler name cannot be empty.");
      return;
    }

    const nameAlreadyExists = bowlers.some(
      (bowler) =>
        bowler.id !== bowlerId &&
        bowler.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (nameAlreadyExists) {
      window.alert("A bowler with that name already exists.");
      return;
    }

    setBowlers((currentBowlers) =>
      currentBowlers.map((bowler) =>
        bowler.id === bowlerId
          ? {
              ...draft,
              name: trimmedName,
              notes: draft.notes.trim(),
              arsenal: draft.arsenal.map((ball) => ({
                ...ball,
                name: ball.name.trim(),
                brand: ball.brand.trim(),
                surface: ball.surface.trim(),
                layout: ball.layout.trim(),
                notes: ball.notes.trim(),
              })),
            }
          : bowler
      )
    );

    setBowlerDrafts((currentDrafts) => {
      const updatedDrafts = { ...currentDrafts };
      delete updatedDrafts[bowlerId];
      return updatedDrafts;
    });
  }

  function addBowler() {
    const trimmedName = newBowlerName.trim();

    if (!trimmedName) {
      return;
    }

    const nameAlreadyExists = bowlers.some(
      (bowler) => bowler.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (nameAlreadyExists) {
      window.alert("A bowler with that name already exists.");
      return;
    }

    setBowlers((currentBowlers) => [
      ...currentBowlers,
      {
        id: Date.now(),
        name: trimmedName,
        handedness: newBowlerHandedness,
        notes: newBowlerNotes.trim(),
        arsenal: [],
      },
    ]);

    setNewBowlerName("");
    setNewBowlerHandedness("Right");
    setNewBowlerNotes("");
  }

  function deleteBowler(bowlerId: number) {
    const bowler = bowlers.find(
      (currentBowler) => currentBowler.id === bowlerId
    );

    if (!bowler) {
      return;
    }

    const shouldDelete = window.confirm(
      `Delete ${bowler.name}? This will also remove their arsenal.`
    );

    if (!shouldDelete) {
      return;
    }

    setBowlers((currentBowlers) =>
      currentBowlers.filter((currentBowler) => currentBowler.id !== bowlerId)
    );

    setBowlerDrafts((currentDrafts) => {
      const updatedDrafts = { ...currentDrafts };
      delete updatedDrafts[bowlerId];
      return updatedDrafts;
    });
  }

  function getBallForm(bowlerId: number) {
    return newBallForms[bowlerId] ?? emptyBallForm;
  }

  function updateBallForm(
    bowlerId: number,
    updates: Partial<NewBallFormState>
  ) {
    setNewBallForms((currentForms) => ({
      ...currentForms,
      [bowlerId]: {
        ...getBallForm(bowlerId),
        ...updates,
      },
    }));
  }

  function addBallToBowler(bowler: Bowler) {
    const form = getBallForm(bowler.id);
    const trimmedName = form.name.trim();

    if (!trimmedName) {
      return;
    }

    const draftBowler = getBowlerDraft(bowler);

    updateBowlerDraft(bowler, {
      arsenal: [
        ...draftBowler.arsenal,
        {
          id: Date.now(),
          name: trimmedName,
          brand: form.brand.trim(),
          surface: form.surface.trim(),
          layout: form.layout.trim(),
          notes: form.notes.trim(),
        },
      ],
    });

    setNewBallForms((currentForms) => ({
      ...currentForms,
      [bowler.id]: emptyBallForm,
    }));
  }

  function deleteBall(bowler: Bowler, ballId: number) {
    const draftBowler = getBowlerDraft(bowler);
    const ball = draftBowler.arsenal.find(
      (currentBall) => currentBall.id === ballId
    );

    if (!ball) {
      return;
    }

    const shouldDelete = window.confirm(
      `Remove ${ball.name} from ${draftBowler.name}'s arsenal?`
    );

    if (!shouldDelete) {
      return;
    }

    updateBowlerDraft(bowler, {
      arsenal: draftBowler.arsenal.filter(
        (currentBall) => currentBall.id !== ballId
      ),
    });
  }

  return (
    <>
      <h2>Bowlers</h2>
      <p>
        Add bowlers, set handedness, manage notes, and build each bowler’s
        arsenal for shot logging.
      </p>

      <details className="bowler-form-card add-form-card">
        <summary className="add-form-summary">
          <strong>Add Bowler</strong>
          <span className="summary-hint">Open Form</span>
        </summary>

        <div className="add-form-content">
          <div className="form-grid">
          <label>
            Name <span className="required">*</span>
            <input
              value={newBowlerName}
              onChange={(event) => setNewBowlerName(event.target.value)}
              placeholder="Example: Kevin"
            />
          </label>

          <label>
            Handedness
            <select
              value={newBowlerHandedness}
              onChange={(event) =>
                setNewBowlerHandedness(event.target.value as Handedness)
              }
            >
              {handednessOptions.map((handedness) => (
                <option key={handedness} value={handedness}>
                  {handedness}
                </option>
              ))}
            </select>
          </label>

          <label>
            Notes
            <textarea
              value={newBowlerNotes}
              onChange={(event) => setNewBowlerNotes(event.target.value)}
              placeholder="Optional notes"
              rows={3}
            />
          </label>
        </div>

          <button
            className="primary-button"
            disabled={!newBowlerName.trim()}
            onClick={addBowler}
          >
            Add Bowler
          </button>
        </div>
      </details>

      <section className="bowler-list">
        {bowlers.map((bowler) => {
          const draftBowler = getBowlerDraft(bowler);
          const ballForm = getBallForm(bowler.id);
          const isDirty = hasBowlerChanged(bowler);

          return (
            <details className="bowler-card" key={bowler.id}>
              <summary className="bowler-summary">
                <div>
                  <strong>{bowler.name}</strong>
                  <p>
                    {bowler.handedness} • {bowler.arsenal.length} ball
                    {bowler.arsenal.length === 1 ? "" : "s"}
                  </p>
                  {isDirty && <p className="unsaved-text">Unsaved changes</p>}
                </div>

                <span className="summary-hint">Open Details</span>
              </summary>

              <div className="bowler-details-content">
                <div className="bowler-actions-row">
                  <button
                    className="save-button"
                    disabled={!isDirty}
                    onClick={() => saveBowler(bowler.id)}
                  >
                    Save Bowler
                  </button>

                  <button
                    className="danger-button"
                    onClick={() => deleteBowler(bowler.id)}
                  >
                    Delete Bowler
                  </button>
                </div>

                <div className="form-grid">
                  <label>
                    Name
                    <input
                      value={draftBowler.name}
                      onChange={(event) =>
                        updateBowlerDraft(bowler, {
                          name: event.target.value,
                        })
                      }
                    />
                  </label>

                  <label>
                    Handedness
                    <select
                      value={draftBowler.handedness}
                      onChange={(event) =>
                        updateBowlerDraft(bowler, {
                          handedness: event.target.value as Handedness,
                        })
                      }
                    >
                      {handednessOptions.map((handedness) => (
                        <option key={handedness} value={handedness}>
                          {handedness}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Notes
                    <textarea
                      value={draftBowler.notes}
                      onChange={(event) =>
                        updateBowlerDraft(bowler, {
                          notes: event.target.value,
                        })
                      }
                      rows={3}
                      placeholder="Optional notes"
                    />
                  </label>
                </div>

                <section className="arsenal-section">
                  <h4>Arsenal</h4>

                  {draftBowler.arsenal.length === 0 ? (
                    <p className="helper-text">No balls added yet.</p>
                  ) : (
                    <div className="arsenal-list">
                      {draftBowler.arsenal.map((ball) => (
                        <div className="ball-card" key={ball.id}>
                          <div>
                            <strong>{ball.name}</strong>
                            <p>
                              {[ball.brand, ball.surface]
                                .filter(Boolean)
                                .join(" • ") || "No brand/surface entered"}
                            </p>

                            {ball.layout && (
                              <p>
                                <strong>Layout:</strong> {ball.layout}
                              </p>
                            )}

                            {ball.notes && <p>{ball.notes}</p>}
                          </div>

                          <button
                            className="danger-button small-button"
                            onClick={() => deleteBall(bowler, ball.id)}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <details className="add-ball-card">
                    <summary className="add-ball-summary">
                      <strong>Add Ball</strong>
                      <span className="summary-hint">Open Form</span>
                    </summary>

                    <div className="add-ball-content">
                      <div className="form-grid">
                        <label>
                          Ball Name <span className="required">*</span>
                          <input
                            value={ballForm.name}
                            onChange={(event) =>
                              updateBallForm(bowler.id, {
                                name: event.target.value,
                              })
                            }
                            placeholder="Example: Venom Shock"
                          />
                        </label>

                        <label>
                          Brand
                          <input
                            value={ballForm.brand}
                            onChange={(event) =>
                              updateBallForm(bowler.id, {
                                brand: event.target.value,
                              })
                            }
                            placeholder="Optional"
                          />
                        </label>

                        <label>
                          Surface
                          <input
                            value={ballForm.surface}
                            onChange={(event) =>
                              updateBallForm(bowler.id, {
                                surface: event.target.value,
                              })
                            }
                            placeholder="Example: 2K, box, polish"
                          />
                        </label>

                        <label>
                          Layout
                          <input
                            value={ballForm.layout}
                            onChange={(event) =>
                              updateBallForm(bowler.id, {
                                layout: event.target.value,
                              })
                            }
                            placeholder="Optional, example: 5 x 4 x 2"
                          />
                        </label>

                        <label>
                          Notes
                          <textarea
                            value={ballForm.notes}
                            onChange={(event) =>
                              updateBallForm(bowler.id, {
                                notes: event.target.value,
                              })
                            }
                            rows={3}
                            placeholder="Optional notes"
                          />
                        </label>
                      </div>

                      <button
                        className="secondary-button"
                        disabled={!ballForm.name.trim()}
                        onClick={() => addBallToBowler(bowler)}
                      >
                        Add Ball
                      </button>
                    </div>
                  </details>
                </section>
              </div>
            </details>
          );
        })}
      </section>
    </>
  );
}

// Bowling Centers
// ==================

function CentersPage({ centers, setCenters }: CentersPageProps) {
  const [newCenterName, setNewCenterName] = useState("");
  const [newCenterLaneCount, setNewCenterLaneCount] = useState("8");
  const [newCenterNotes, setNewCenterNotes] = useState("");
  const [centerDrafts, setCenterDrafts] = useState<Record<number, Center>>({});

  function getCenterDraft(center: Center) {
    return centerDrafts[center.id] ?? center;
  }

  function hasCenterChanged(center: Center) {
    const draft = centerDrafts[center.id];

    if (!draft) {
      return false;
    }

    return JSON.stringify(draft) !== JSON.stringify(center);
  }

  function updateCenterDraft(center: Center, updates: Partial<Center>) {
    setCenterDrafts((currentDrafts) => ({
      ...currentDrafts,
      [center.id]: {
        ...getCenterDraft(center),
        ...updates,
      },
    }));
  }

  function saveCenter(centerId: number) {
    const draft = centerDrafts[centerId];

    if (!draft) {
      return;
    }

    const trimmedName = draft.name.trim();

    if (!trimmedName) {
      window.alert("Center name cannot be empty.");
      return;
    }

    if (!Number.isFinite(draft.laneCount) || draft.laneCount < 1) {
      window.alert("Lane count must be at least 1.");
      return;
    }

    const nameAlreadyExists = centers.some(
      (center) =>
        center.id !== centerId &&
        center.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (nameAlreadyExists) {
      window.alert("A bowling center with that name already exists.");
      return;
    }

    setCenters((currentCenters) =>
      currentCenters.map((center) =>
        center.id === centerId
          ? {
              ...draft,
              name: trimmedName,
              laneCount: Math.max(1, Math.floor(draft.laneCount)),
              notes: draft.notes.trim(),
            }
          : center
      )
    );

    setCenterDrafts((currentDrafts) => {
      const updatedDrafts = { ...currentDrafts };
      delete updatedDrafts[centerId];
      return updatedDrafts;
    });
  }

  function addCenter() {
    const trimmedName = newCenterName.trim();
    const laneCount = Number(newCenterLaneCount);

    if (!trimmedName || !Number.isFinite(laneCount) || laneCount < 1) {
      return;
    }

    const nameAlreadyExists = centers.some(
      (center) => center.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (nameAlreadyExists) {
      window.alert("A bowling center with that name already exists.");
      return;
    }

    setCenters((currentCenters) => [
      ...currentCenters,
      {
        id: Date.now(),
        name: trimmedName,
        laneCount: Math.floor(laneCount),
        notes: newCenterNotes.trim(),
      },
    ]);

    setNewCenterName("");
    setNewCenterLaneCount("8");
    setNewCenterNotes("");
  }

  function deleteCenter(centerId: number) {
    const center = centers.find((currentCenter) => currentCenter.id === centerId);

    if (!center) {
      return;
    }

    const shouldDelete = window.confirm(
      `Delete ${center.name}? This will remove it from center selection.`
    );

    if (!shouldDelete) {
      return;
    }

    setCenters((currentCenters) =>
      currentCenters.filter((currentCenter) => currentCenter.id !== centerId)
    );

    setCenterDrafts((currentDrafts) => {
      const updatedDrafts = { ...currentDrafts };
      delete updatedDrafts[centerId];
      return updatedDrafts;
    });
  }

  return (
    <>
      <h2>Bowling Centers</h2>
      <p>Add bowling centers and assign lane counts.</p>

      <details className="center-form-card add-form-card">
        <summary className="add-form-summary">
          <strong>Add Bowling Center</strong>
          <span className="summary-hint">Open Form</span>
        </summary>

        <div className="add-form-content">
          <div className="form-grid">
          <label>
            Name <span className="required">*</span>
            <input
              value={newCenterName}
              onChange={(event) => setNewCenterName(event.target.value)}
              placeholder="Example: Titan Bowl"
            />
          </label>

          <label>
            Number of Lanes <span className="required">*</span>
            <input
              type="number"
              min="1"
              value={newCenterLaneCount}
              onChange={(event) => setNewCenterLaneCount(event.target.value)}
              placeholder="Example: 8"
            />
          </label>

          <label>
            Notes
            <textarea
              value={newCenterNotes}
              onChange={(event) => setNewCenterNotes(event.target.value)}
              placeholder="Optional notes"
              rows={3}
            />
          </label>
        </div>

          <button
            className="primary-button"
            disabled={!newCenterName.trim() || Number(newCenterLaneCount) < 1}
            onClick={addCenter}
          >
            Add Center
          </button>
        </div>
      </details>

      <section className="center-list">
        {centers.map((center) => {
          const draftCenter = getCenterDraft(center);
          const isDirty = hasCenterChanged(center);

          return (
            <details className="center-card" key={center.id}>
              <summary className="center-summary">
                <div>
                  <strong>{center.name}</strong>
                  <p>
                    {center.laneCount} lane{center.laneCount === 1 ? "" : "s"}
                  </p>
                  {isDirty && <p className="unsaved-text">Unsaved changes</p>}
                </div>

                <span className="summary-hint">Open Details</span>
              </summary>

              <div className="center-details-content">
                <div className="center-actions-row">
                  <button
                    className="save-button"
                    disabled={!isDirty}
                    onClick={() => saveCenter(center.id)}
                  >
                    Save Center
                  </button>

                  <button
                    className="danger-button"
                    onClick={() => deleteCenter(center.id)}
                  >
                    Delete Center
                  </button>
                </div>

                <div className="form-grid">
                  <label>
                    Name
                    <input
                      value={draftCenter.name}
                      onChange={(event) =>
                        updateCenterDraft(center, { name: event.target.value })
                      }
                    />
                  </label>

                  <label>
                    Number of Lanes
                    <input
                      type="number"
                      min="1"
                      value={draftCenter.laneCount}
                      onChange={(event) =>
                        updateCenterDraft(center, {
                          laneCount: Math.max(
                            1,
                            Math.floor(Number(event.target.value))
                          ),
                        })
                      }
                    />
                  </label>

                  <label>
                    Notes
                    <textarea
                      value={draftCenter.notes}
                      onChange={(event) =>
                        updateCenterDraft(center, { notes: event.target.value })
                      }
                      rows={3}
                      placeholder="Optional notes"
                    />
                  </label>
                </div>

                <section className="lane-preview-card">
                  <h4>Generated Lane Options</h4>
                  <p>
                    <strong>Single Lane Mode:</strong> Lanes 1 through{" "}
                    {draftCenter.laneCount}
                  </p>
                  <p>
                    <strong>Pair Mode:</strong>{" "}
                    {Math.floor(draftCenter.laneCount / 2) > 0
                      ? `Pairs 1/2 through ${
                          Math.floor(draftCenter.laneCount / 2) * 2 - 1
                        }/${Math.floor(draftCenter.laneCount / 2) * 2}`
                      : "No pairs available"}
                  </p>
                </section>
              </div>
            </details>
          );
        })}
      </section>
    </>
  );
}

// Tournaments / Leagues
// ==================

function EventsPage({
  events,
  setEvents,
  centers,
}: EventsPageProps) {
  const [newEventName, setNewEventName] = useState("");
  const [newEventType, setNewEventType] = useState<"League" | "Tournament">(
    "League"
  );
  const [newEventFormat, setNewEventFormat] = useState<BowlingFormat>("Singles");
  const [newSeriesGameCount, setNewSeriesGameCount] = useState("3");
  const [newBowlersPerPair, setNewBowlersPerPair] = useState("10");
  const [newScheduleUnit, setNewScheduleUnit] =
    useState<EventScheduleUnit>("Weeks");
  const [newScheduleCount, setNewScheduleCount] = useState("12");
  const [newStartDate, setNewStartDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");
  const [newCenterId, setNewCenterId] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [eventDrafts, setEventDrafts] = useState<Record<number, EventSetup>>(
    {}
  );

  function getEventDraft(event: EventSetup) {
    return eventDrafts[event.id] ?? event;
  }

  function hasEventChanged(event: EventSetup) {
    const draft = eventDrafts[event.id];

    if (!draft) {
      return false;
    }

    return JSON.stringify(draft) !== JSON.stringify(event);
  }

  function updateEventDraft(event: EventSetup, updates: Partial<EventSetup>) {
    setEventDrafts((currentDrafts) => ({
      ...currentDrafts,
      [event.id]: {
        ...getEventDraft(event),
        ...updates,
      },
    }));
  }

  function saveEvent(eventId: number) {
    const draft = eventDrafts[eventId];

    if (!draft) {
      return;
    }

    const trimmedName = draft.name.trim();

    if (!trimmedName) {
      window.alert("Event name cannot be empty.");
      return;
    }

    if (!Number.isFinite(draft.seriesGameCount) || draft.seriesGameCount < 1) {
      window.alert("Games in series/block must be at least 1.");
      return;
    }

    if (!Number.isFinite(draft.scheduleCount) || draft.scheduleCount < 1) {
      window.alert("Number of weeks/days must be at least 1.");
      return;
    }

    if (!Number.isFinite(draft.bowlersPerPair) || draft.bowlersPerPair < 1) {
      window.alert("Bowlers per pair must be at least 1.");
      return;
    }

    if (!centers.some((center) => center.id === draft.centerId)) {
      window.alert("Choose a valid bowling center.");
      return;
    }

    const nameAlreadyExists = events.some(
      (event) =>
        event.id !== eventId &&
        event.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (nameAlreadyExists) {
      window.alert("An event with that name already exists.");
      return;
    }

    setEvents((currentEvents) =>
      currentEvents.map((event) =>
        event.id === eventId
          ? {
              ...draft,
              name: trimmedName,
              seriesGameCount: Math.max(
                1,
                Math.floor(draft.seriesGameCount)
              ),
              bowlersPerPair: Math.max(1, Math.floor(draft.bowlersPerPair)),
              scheduleCount: Math.max(1, Math.floor(draft.scheduleCount)),
              startDate: draft.startDate,
              endDate: draft.endDate,
              notes: draft.notes.trim(),
            }
          : event
      )
    );

    setEventDrafts((currentDrafts) => {
      const updatedDrafts = { ...currentDrafts };
      delete updatedDrafts[eventId];
      return updatedDrafts;
    });
  }

  function addEvent() {
    const trimmedName = newEventName.trim();
    const seriesGameCount = Number(newSeriesGameCount);
    const bowlersPerPair = Number(newBowlersPerPair);
    const scheduleCount = Number(newScheduleCount);
    const centerId = Number(newCenterId);

    if (
      !trimmedName ||
      !Number.isFinite(seriesGameCount) ||
      seriesGameCount < 1 ||
      !Number.isFinite(bowlersPerPair) ||
      bowlersPerPair < 1 ||
      !Number.isFinite(scheduleCount) ||
      scheduleCount < 1 ||
      !Number.isFinite(centerId)
    ) {
      return;
    }

    const nameAlreadyExists = events.some(
      (event) => event.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (nameAlreadyExists) {
      window.alert("An event with that name already exists.");
      return;
    }

    setEvents((currentEvents) => [
      ...currentEvents,
      {
        id: Date.now(),
        name: trimmedName,
        eventType: newEventType,
        format: newEventFormat,
        seriesGameCount: Math.floor(seriesGameCount),
        bowlersPerPair: Math.floor(bowlersPerPair),
        scheduleUnit: newScheduleUnit,
        scheduleCount: Math.floor(scheduleCount),
        startDate: newStartDate,
        endDate: newEndDate,
        centerId,
        notes: newNotes.trim(),
      },
    ]);

    setNewEventName("");
    setNewEventType("League");
    setNewEventFormat("Singles");
    setNewSeriesGameCount("3");
    setNewBowlersPerPair("10");
    setNewScheduleUnit("Weeks");
    setNewScheduleCount("12");
    setNewStartDate("");
    setNewEndDate("");
    setNewCenterId("");
    setNewNotes("");
  }

  function deleteEvent(eventId: number) {
    const event = events.find((currentEvent) => currentEvent.id === eventId);

    if (!event) {
      return;
    }

    const shouldDelete = window.confirm(
      `Delete ${event.name}? This will remove it from league/tournament selection.`
    );

    if (!shouldDelete) {
      return;
    }

    setEvents((currentEvents) =>
      currentEvents.filter((currentEvent) => currentEvent.id !== eventId)
    );

    setEventDrafts((currentDrafts) => {
      const updatedDrafts = { ...currentDrafts };
      delete updatedDrafts[eventId];
      return updatedDrafts;
    });
  }

  function getCenterName(centerId: number) {
    return (
      centers.find((center) => center.id === centerId)?.name ?? "Unknown Center"
    );
  }

  function getScheduleLabel(event: EventSetup) {
    return `${event.scheduleCount} ${event.scheduleUnit.toLowerCase()}`;
  }

  function formatEventSummary(event: EventSetup) {
    return `${event.eventType} • ${event.format} • ${event.seriesGameCount} game${
      event.seriesGameCount === 1 ? "" : "s"
    } • ${event.bowlersPerPair} per pair • ${getScheduleLabel(event)} • ${getCenterName(event.centerId)}`;
  }

  const canAddEvent =
    newEventName.trim() !== "" &&
    Number(newSeriesGameCount) >= 1 &&
    Number(newBowlersPerPair) >= 1 &&
    Number(newScheduleCount) >= 1 &&
    newCenterId !== "";

  return (
    <>
      <h2>Tournaments / Leagues</h2>
      <p>Create leagues and tournaments.</p>

      <details className="event-form-card add-form-card">
        <summary className="add-form-summary">
          <strong>Add League / Tournament</strong>
          <span className="summary-hint">Open Form</span>
        </summary>

        <div className="add-form-content">
          <div className="form-grid">
          <label>
            Name <span className="required">*</span>
            <input
              value={newEventName}
              onChange={(event) => setNewEventName(event.target.value)}
              placeholder="Example: Tuesday Night League"
            />
          </label>

          <label>
            Type
            <select
              value={newEventType}
              onChange={(event) => {
                const nextType = event.target.value as "League" | "Tournament";
                setNewEventType(nextType);
                setNewScheduleUnit(nextType === "League" ? "Weeks" : "Days");
                setNewScheduleCount(nextType === "League" ? "12" : "1");
              }}
            >
              <option>League</option>
              <option>Tournament</option>
            </select>
          </label>

          <label>
            Format
            <select
              value={newEventFormat}
              onChange={(event) =>
                setNewEventFormat(event.target.value as BowlingFormat)
              }
            >
              <option>Singles</option>
              <option>Doubles</option>
              <option>Trios</option>
              <option>Fours</option>
              <option>Fives</option>
              <option>Baker</option>
            </select>
          </label>

          <label>
            Games in Series/Block <span className="required">*</span>
            <input
              type="number"
              min="1"
              value={newSeriesGameCount}
              onChange={(event) => setNewSeriesGameCount(event.target.value)}
              placeholder="Example: 3"
            />
          </label>

          <label>
            Bowlers Per Pair <span className="required">*</span>
            <input
              type="number"
              min="1"
              value={newBowlersPerPair}
              onChange={(event) => setNewBowlersPerPair(event.target.value)}
              placeholder="Example: 10"
            />
          </label>

          <label>
            Schedule Type
            <select
              value={newScheduleUnit}
              onChange={(event) =>
                setNewScheduleUnit(event.target.value as EventScheduleUnit)
              }
            >
              <option>Weeks</option>
              <option>Days</option>
            </select>
          </label>

          <label>
            Number of {newScheduleUnit} <span className="required">*</span>
            <input
              type="number"
              min="1"
              value={newScheduleCount}
              onChange={(event) => setNewScheduleCount(event.target.value)}
              placeholder={newScheduleUnit === "Weeks" ? "Example: 12" : "Example: 2"}
            />
          </label>

          <label>
            Start Date
            <input
              type="date"
              value={newStartDate}
              onChange={(event) => setNewStartDate(event.target.value)}
            />
          </label>

          <label>
            End Date
            <input
              type="date"
              value={newEndDate}
              onChange={(event) => setNewEndDate(event.target.value)}
            />
          </label>

          <label>
            Bowling Center <span className="required">*</span>
            <select
              value={newCenterId}
              onChange={(event) => setNewCenterId(event.target.value)}
            >
              <option value="">Select bowling center</option>
              {centers.map((center) => (
                <option key={center.id} value={center.id}>
                  {center.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Notes
            <textarea
              value={newNotes}
              onChange={(event) => setNewNotes(event.target.value)}
              rows={3}
              placeholder="Optional notes"
            />
          </label>
        </div>

          <button
            className="primary-button"
            disabled={!canAddEvent}
            onClick={addEvent}
          >
            Add Event
          </button>
        </div>
      </details>

      <section className="event-list">
        {events.map((event) => {
          const draftEvent = getEventDraft(event);
          const isDirty = hasEventChanged(event);

          return (
            <details className="event-card" key={event.id}>
              <summary className="event-summary">
                <div>
                  <strong>{event.name}</strong>
                  <p>{formatEventSummary(event)}</p>
                  {isDirty && <p className="unsaved-text">Unsaved changes</p>}
                </div>

                <span className="summary-hint">Open Details</span>
              </summary>

              <div className="event-details-content">
                <div className="event-actions-row">
                  <button
                    className="save-button"
                    disabled={!isDirty}
                    onClick={() => saveEvent(event.id)}
                  >
                    Save Event
                  </button>

                  <button
                    className="danger-button"
                    onClick={() => deleteEvent(event.id)}
                  >
                    Delete Event
                  </button>
                </div>

                <div className="form-grid">
                  <label>
                    Name
                    <input
                      value={draftEvent.name}
                      onChange={(inputEvent) =>
                        updateEventDraft(event, {
                          name: inputEvent.target.value,
                        })
                      }
                    />
                  </label>

                  <label>
                    Type
                    <select
                      value={draftEvent.eventType}
                      onChange={(inputEvent) => {
                        const nextType = inputEvent.target.value as
                          | "League"
                          | "Tournament";

                        updateEventDraft(event, {
                          eventType: nextType,
                          scheduleUnit:
                            nextType === "League" ? "Weeks" : "Days",
                        });
                      }}
                    >
                      <option>League</option>
                      <option>Tournament</option>
                    </select>
                  </label>

                  <label>
                    Format
                    <select
                      value={draftEvent.format}
                      onChange={(inputEvent) =>
                        updateEventDraft(event, {
                          format: inputEvent.target.value as BowlingFormat,
                        })
                      }
                    >
                      <option>Singles</option>
                      <option>Doubles</option>
                      <option>Trios</option>
                      <option>Fours</option>
                      <option>Fives</option>
                      <option>Baker</option>
                    </select>
                  </label>

                  <label>
                    Games in Series/Block
                    <input
                      type="number"
                      min="1"
                      value={draftEvent.seriesGameCount}
                      onChange={(inputEvent) =>
                        updateEventDraft(event, {
                          seriesGameCount: Math.max(
                            1,
                            Math.floor(Number(inputEvent.target.value))
                          ),
                        })
                      }
                    />
                  </label>

                  <label>
                    Bowlers Per Pair
                    <input
                      type="number"
                      min="1"
                      value={draftEvent.bowlersPerPair}
                      onChange={(inputEvent) =>
                        updateEventDraft(event, {
                          bowlersPerPair: Math.max(
                            1,
                            Math.floor(Number(inputEvent.target.value))
                          ),
                        })
                      }
                    />
                  </label>

                  <label>
                    Schedule Type
                    <select
                      value={draftEvent.scheduleUnit}
                      onChange={(inputEvent) =>
                        updateEventDraft(event, {
                          scheduleUnit: inputEvent.target
                            .value as EventScheduleUnit,
                        })
                      }
                    >
                      <option>Weeks</option>
                      <option>Days</option>
                    </select>
                  </label>

                  <label>
                    Number of {draftEvent.scheduleUnit}
                    <input
                      type="number"
                      min="1"
                      value={draftEvent.scheduleCount}
                      onChange={(inputEvent) =>
                        updateEventDraft(event, {
                          scheduleCount: Math.max(
                            1,
                            Math.floor(Number(inputEvent.target.value))
                          ),
                        })
                      }
                    />
                  </label>

                  <label>
                    Start Date
                    <input
                      type="date"
                      value={draftEvent.startDate}
                      onChange={(inputEvent) =>
                        updateEventDraft(event, {
                          startDate: inputEvent.target.value,
                        })
                      }
                    />
                  </label>

                  <label>
                    End Date
                    <input
                      type="date"
                      value={draftEvent.endDate}
                      onChange={(inputEvent) =>
                        updateEventDraft(event, {
                          endDate: inputEvent.target.value,
                        })
                      }
                    />
                  </label>

                  <label>
                    Bowling Center
                    <select
                      value={draftEvent.centerId}
                      onChange={(inputEvent) =>
                        updateEventDraft(event, {
                          centerId: Number(inputEvent.target.value),
                        })
                      }
                    >
                      {centers.map((center) => (
                        <option key={center.id} value={center.id}>
                          {center.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Notes
                    <textarea
                      value={draftEvent.notes}
                      onChange={(inputEvent) =>
                        updateEventDraft(event, {
                          notes: inputEvent.target.value,
                        })
                      }
                      rows={3}
                      placeholder="Optional notes"
                    />
                  </label>
                </div>

                <section className="event-preview-card">
                  <h4>Event Summary</h4>
                  <p>
                    <strong>Type:</strong> {draftEvent.eventType}
                  </p>
                  <p>
                    <strong>Format:</strong> {draftEvent.format}
                  </p>
                  <p>
                    <strong>Games in Series/Block:</strong>{" "}
                    {draftEvent.seriesGameCount}
                  </p>
                  <p>
                    <strong>Bowlers Per Pair:</strong> {draftEvent.bowlersPerPair}
                  </p>
                  <p>
                    <strong>Schedule:</strong> {getScheduleLabel(draftEvent)}
                  </p>
                  <p>
                    <strong>Dates:</strong>{" "}
                    {draftEvent.startDate || "No start date"} →{" "}
                    {draftEvent.endDate || "No end date"}
                  </p>
                  <p>
                    <strong>Bowling Center:</strong>{" "}
                    {getCenterName(draftEvent.centerId)}
                  </p>
                  <p>
                    <strong>Pattern:</strong> selected when logging each week/day
                  </p>
                </section>
              </div>
            </details>
          );
        })}
      </section>
    </>
  );
}
// Patterns
// ==================

function PatternsPage({ patterns, setPatterns }: PatternsPageProps) {
  const [newPatternName, setNewPatternName] = useState("");
  const [newPatternLength, setNewPatternLength] = useState("");
  const [newPatternVolume, setNewPatternVolume] = useState("");
  const [newPatternRatio, setNewPatternRatio] = useState("");
  const [newPatternDropBrush, setNewPatternDropBrush] = useState("");
  const [newPatternSource, setNewPatternSource] = useState("");
  const [newPatternNotes, setNewPatternNotes] = useState("");
  const [patternDrafts, setPatternDrafts] = useState<Record<number, Pattern>>(
    {}
  );

  function getPatternDraft(pattern: Pattern) {
    return patternDrafts[pattern.id] ?? pattern;
  }

  function hasPatternChanged(pattern: Pattern) {
    const draft = patternDrafts[pattern.id];

    if (!draft) {
      return false;
    }

    return (
      draft.name !== pattern.name ||
      draft.length !== pattern.length ||
      draft.volume !== pattern.volume ||
      draft.ratio !== pattern.ratio ||
      draft.dropBrush !== pattern.dropBrush ||
      draft.source !== pattern.source ||
      draft.notes !== pattern.notes
    );
  }

  function updatePatternDraft(pattern: Pattern, updates: Partial<Pattern>) {
    setPatternDrafts((currentDrafts) => ({
      ...currentDrafts,
      [pattern.id]: {
        ...getPatternDraft(pattern),
        ...updates,
      },
    }));
  }

  function savePattern(patternId: number) {
    const draft = patternDrafts[patternId];

    if (!draft) {
      return;
    }

    setPatterns((currentPatterns) =>
      currentPatterns.map((pattern) =>
        pattern.id === patternId ? { ...draft } : pattern
      )
    );

    setPatternDrafts((currentDrafts) => {
      const updatedDrafts = { ...currentDrafts };
      delete updatedDrafts[patternId];
      return updatedDrafts;
    });
  }

  function addPattern() {
    const trimmedName = newPatternName.trim();

    if (!trimmedName) {
      return;
    }

    const nameAlreadyExists = patterns.some(
      (pattern) => pattern.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (nameAlreadyExists) {
      window.alert("A pattern with that name already exists.");
      return;
    }

    setPatterns((currentPatterns) => [
      ...currentPatterns,
      {
        id: Date.now(),
        name: trimmedName,
        length: newPatternLength.trim(),
        volume: newPatternVolume.trim(),
        ratio: newPatternRatio.trim(),
        dropBrush: newPatternDropBrush.trim(),
        source: newPatternSource.trim(),
        notes: newPatternNotes.trim(),
      },
    ]);

    setNewPatternName("");
    setNewPatternLength("");
    setNewPatternVolume("");
    setNewPatternRatio("");
    setNewPatternDropBrush("");
    setNewPatternSource("");
    setNewPatternNotes("");
  }

  function deletePattern(patternId: number) {
    const pattern = patterns.find(
      (currentPattern) => currentPattern.id === patternId
    );

    if (!pattern) {
      return;
    }

    const shouldDelete = window.confirm(
      `Delete ${pattern.name}? This will remove it from pattern selection.`
    );

    if (!shouldDelete) {
      return;
    }

    setPatterns((currentPatterns) =>
      currentPatterns.filter(
        (currentPattern) => currentPattern.id !== patternId
      )
    );

    setPatternDrafts((currentDrafts) => {
      const updatedDrafts = { ...currentDrafts };
      delete updatedDrafts[patternId];
      return updatedDrafts;
    });
  }

  function formatPatternSummary(pattern: Pattern) {
    const details = [
      pattern.length ? `${pattern.length} ft` : "",
      pattern.volume ? `${pattern.volume} mL` : "",
      pattern.ratio ? `${pattern.ratio}:1` : "",
    ].filter(Boolean);

    return details.length > 0 ? details.join(" • ") : "No specs entered";
  }

  return (
    <>
      <h2>Patterns</h2>
      <p>
        Add oil patterns with length, volume, ratio, drop brush, source, and
        additional notes.
      </p>

      <details className="pattern-form-card add-form-card">
        <summary className="add-form-summary">
          <strong>Add Pattern</strong>
          <span className="summary-hint">Open Form</span>
        </summary>

        <div className="add-form-content">
          <div className="form-grid">
          <label>
            Name <span className="required">*</span>
            <input
              value={newPatternName}
              onChange={(event) => setNewPatternName(event.target.value)}
              placeholder="Example: 2025 PBA Wolf"
            />
          </label>

          <label>
            Length
            <input
              value={newPatternLength}
              onChange={(event) => setNewPatternLength(event.target.value)}
              placeholder="Example: 32"
            />
          </label>

          <label>
            Volume
            <input
              value={newPatternVolume}
              onChange={(event) => setNewPatternVolume(event.target.value)}
              placeholder="Example: 28.5"
            />
          </label>

          <label>
            Ratio
            <input
              value={newPatternRatio}
              onChange={(event) => setNewPatternRatio(event.target.value)}
              placeholder="Example: 2.0"
            />
          </label>

          <label>
            Drop Brush
            <input
              value={newPatternDropBrush}
              onChange={(event) => setNewPatternDropBrush(event.target.value)}
              placeholder="Optional"
            />
          </label>

          <label>
            Source
            <input
              value={newPatternSource}
              onChange={(event) => setNewPatternSource(event.target.value)}
              placeholder="Example: Kegel, PBA, custom"
            />
          </label>

          <label>
            Notes
            <textarea
              value={newPatternNotes}
              onChange={(event) => setNewPatternNotes(event.target.value)}
              placeholder="Optional notes"
              rows={3}
            />
          </label>
        </div>

          <button
            className="primary-button"
            disabled={!newPatternName.trim()}
            onClick={addPattern}
          >
            Add Pattern
          </button>
        </div>
      </details>

      <section className="pattern-list">
        {patterns.map((pattern) => {
          const draftPattern = getPatternDraft(pattern);
          const isDirty = hasPatternChanged(pattern);

          return (
            <details className="pattern-card" key={pattern.id}>
              <summary className="pattern-summary">
                <div>
                  <strong>{pattern.name}</strong>
                  <p>{formatPatternSummary(pattern)}</p>
                  {isDirty && (
                    <p className="unsaved-text">Unsaved changes</p>
                  )}
                </div>

                <span className="summary-hint">Open Details</span>
              </summary>

              <div className="pattern-details-content">
                <div className="pattern-actions-row">
                  <button
                    className="save-button"
                    disabled={!isDirty}
                    onClick={() => savePattern(pattern.id)}
                  >
                    Save Pattern
                  </button>

                  <button
                    className="danger-button"
                    onClick={() => deletePattern(pattern.id)}
                  >
                    Delete Pattern
                  </button>
                </div>

                <div className="form-grid">
                  <label>
                    Name
                    <input
                      value={draftPattern.name}
                      onChange={(event) =>
                        updatePatternDraft(pattern, {
                          name: event.target.value,
                        })
                      }
                    />
                  </label>

                  <label>
                    Length
                    <input
                      value={draftPattern.length}
                      onChange={(event) =>
                        updatePatternDraft(pattern, {
                          length: event.target.value,
                        })
                      }
                      placeholder="Example: 32"
                    />
                  </label>

                  <label>
                    Volume
                    <input
                      value={draftPattern.volume}
                      onChange={(event) =>
                        updatePatternDraft(pattern, {
                          volume: event.target.value,
                        })
                      }
                      placeholder="Example: 28.5"
                    />
                  </label>

                  <label>
                    Ratio
                    <input
                      value={draftPattern.ratio}
                      onChange={(event) =>
                        updatePatternDraft(pattern, {
                          ratio: event.target.value,
                        })
                      }
                      placeholder="Example: 2.0"
                    />
                  </label>

                  <label>
                    Drop Brush
                    <input
                      value={draftPattern.dropBrush}
                      onChange={(event) =>
                        updatePatternDraft(pattern, {
                          dropBrush: event.target.value,
                        })
                      }
                      placeholder="Optional"
                    />
                  </label>

                  <label>
                    Source
                    <input
                      value={draftPattern.source}
                      onChange={(event) =>
                        updatePatternDraft(pattern, {
                          source: event.target.value,
                        })
                      }
                      placeholder="Example: Kegel, PBA, custom"
                    />
                  </label>

                  <label>
                    Notes
                    <textarea
                      value={draftPattern.notes}
                      onChange={(event) =>
                        updatePatternDraft(pattern, {
                          notes: event.target.value,
                        })
                      }
                      rows={3}
                      placeholder="Optional notes"
                    />
                  </label>
                </div>

                <section className="pattern-preview-card">
                  <h4>Pattern Summary</h4>
                  <p>
                    <strong>Length:</strong>{" "}
                    {draftPattern.length
                      ? `${draftPattern.length} ft`
                      : "Not entered"}
                  </p>
                  <p>
                    <strong>Volume:</strong>{" "}
                    {draftPattern.volume
                      ? `${draftPattern.volume} mL`
                      : "Not entered"}
                  </p>
                  <p>
                    <strong>Ratio:</strong>{" "}
                    {draftPattern.ratio
                      ? `${draftPattern.ratio}:1`
                      : "Not entered"}
                  </p>
                  <p>
                    <strong>Drop Brush:</strong>{" "}
                    {draftPattern.dropBrush || "Not entered"}
                  </p>
                  <p>
                    <strong>Source:</strong>{" "}
                    {draftPattern.source || "Not entered"}
                  </p>
                </section>
              </div>
            </details>
          );
        })}
      </section>
    </>
  );
}
export default App;

// Game Entry
// ==================

function GameEntryPage({
  bowlers,
  bowlerNames,
  competitionType,
  format,
  bowlersPerTeam,
  centerName,
  patternName,
  eventStageLabel,
  eventLogKey,
  eventName,
  eventId,
  laneMode,
  startingLaneOrPair,
  laneOptions,
  seriesGameCount,
  onSavedEventLog,
  onSaveCompletedGames,
  onBack,
}: GameEntryPageProps) {
  const frameOrder = useMemo(() => {
    const orderedEntries: { frameNumber: number; bowlerName: string }[] = [];

    for (let frameNumber = 1; frameNumber <= 10; frameNumber += 1) {
      if (format === "Baker") {
        const bowlerIndex = (frameNumber - 1) % bowlerNames.length;

        orderedEntries.push({
          frameNumber,
          bowlerName: bowlerNames[bowlerIndex],
        });
      } else {
        bowlerNames.forEach((bowlerName) => {
          orderedEntries.push({
            frameNumber,
            bowlerName,
          });
        });
      }
    }

    return orderedEntries;
  }, [bowlerNames, format]);

  const [gameNumber, setGameNumber] = useState(1);
  const [currentStartingLaneOrPair, setCurrentStartingLaneOrPair] =
    useState(startingLaneOrPair);
  const [nextLaneOrPair, setNextLaneOrPair] = useState(startingLaneOrPair);
  const [showNextGameSetup, setShowNextGameSetup] = useState(false);

  const [completedGames, setCompletedGames] = useState<CompletedGameSummary[]>(
    []
  );

  const [bowlerCarryovers, setBowlerCarryovers] = useState<
    Record<string, CarryoverFields>
  >({});

  function buildEntries(
    carryovers: Record<string, CarryoverFields>
  ): FrameEntry[] {
    return frameOrder.map((entry) => {
      const carryover = carryovers[entry.bowlerName];

      return {
        frameNumber: entry.frameNumber,
        bowlerName: entry.bowlerName,
        firstShotKnockedPins: [...ALL_PINS],
        secondShotKnockedPins:
          entry.frameNumber === 10 ? [...ALL_PINS] : [],
        thirdShotKnockedPins:
          entry.frameNumber === 10 ? [...ALL_PINS] : [],
        ballUsed: carryover?.ballUsed ?? "",
        footBoard: carryover?.footBoard ?? "",
        targetArrow: carryover?.targetArrow ?? "",
        targetBreakpoint: carryover?.targetBreakpoint ?? "",
        actualArrow: carryover?.actualArrow ?? "",
        actualBreakpoint: carryover?.actualBreakpoint ?? "",
        isComplete: false,
      };
    });
  }

  const [entries, setEntries] = useState<FrameEntry[]>(() => buildEntries({}));
  const [currentEntryIndex, setCurrentEntryIndex] = useState(0);
  const [maxUnlockedIndex, setMaxUnlockedIndex] = useState(0);

  const currentEntry = entries[currentEntryIndex];
  const isLastEntry = currentEntryIndex === entries.length - 1;
  const isGameComplete = entries.every((entry) => entry.isComplete);

  const currentBowler = bowlers.find(
    (bowler) => bowler.name === currentEntry.bowlerName
  );
  const currentBowlerBalls = currentBowler?.arsenal ?? [];

  const isLimitedSeries = seriesGameCount !== null;
  const isLastGameInSeries =
    isLimitedSeries && gameNumber >= (seriesGameCount ?? 0);

  const gameDisplay = isLimitedSeries
    ? `${gameNumber}/${seriesGameCount}`
    : `${gameNumber}`;

  const isTenthFrame = currentEntry.frameNumber === 10;
  const firstShotStandingPins = getPinsStanding(
    currentEntry.firstShotKnockedPins
  );
  const firstShotPinCount = currentEntry.firstShotKnockedPins.length;
  const isStrike = firstShotPinCount === 10;

  const secondShotAvailablePins =
    isTenthFrame && isStrike ? ALL_PINS : firstShotStandingPins;

  const secondShotPinCount = currentEntry.secondShotKnockedPins.length;
  const secondShotStandingPins =
    isTenthFrame && isStrike
      ? getPinsStanding(currentEntry.secondShotKnockedPins)
      : firstShotStandingPins.filter(
          (pin) => !currentEntry.secondShotKnockedPins.includes(pin)
        );

  const isSpare =
    !isStrike && firstShotPinCount + secondShotPinCount === 10;

  const shouldShowSecondShot = isTenthFrame || !isStrike;
  const shouldShowThirdShot = isTenthFrame && (isStrike || isSpare);

  const thirdShotAvailablePins =
    isTenthFrame && isStrike
      ? secondShotPinCount === 10
        ? ALL_PINS
        : secondShotStandingPins
      : isTenthFrame && isSpare
      ? ALL_PINS
      : [];

  const thirdShotPinCount = currentEntry.thirdShotKnockedPins.length;

  const pinsStandingAfterFrame =
    shouldShowThirdShot && thirdShotAvailablePins.length > 0
      ? thirdShotAvailablePins.filter(
          (pin) => !currentEntry.thirdShotKnockedPins.includes(pin)
        )
      : secondShotStandingPins;

  const totalFramePinCount =
    firstShotPinCount +
    (shouldShowSecondShot ? secondShotPinCount : 0) +
    (shouldShowThirdShot ? thirdShotPinCount : 0);

  const frameResult = getFrameResult(isStrike, pinsStandingAfterFrame, isSpare);

  function hasUnsavedProgress() {
    return (
      completedGames.length > 0 ||
      entries.some(
        (entry) =>
          entry.isComplete ||
          entry.firstShotKnockedPins.length !== 10 ||
          entry.secondShotKnockedPins.length > 0 ||
          entry.thirdShotKnockedPins.length > 0 ||
          entry.ballUsed !== "" ||
          entry.footBoard !== "" ||
          entry.targetArrow !== "" ||
          entry.targetBreakpoint !== "" ||
          entry.actualArrow !== "" ||
          entry.actualBreakpoint !== ""
      )
    );
  }

  function handleBackDuringScoring() {
    if (!hasUnsavedProgress()) {
      onBack();
      return;
    }

    const shouldExit = window.confirm(
      "Exit scoring? Any unsaved game data in this session will be lost."
    );

    if (shouldExit) {
      onBack();
    }
  }

  function updateCurrentEntry(updatedFields: Partial<FrameEntry>) {
    setEntries((currentEntries) => {
      const updatedEntries = [...currentEntries];

      updatedEntries[currentEntryIndex] = {
        ...updatedEntries[currentEntryIndex],
        ...updatedFields,
      };

      return updatedEntries;
    });
  }

  function updateFirstShotPins(knockedPins: number[]) {
    const newStandingPins = getPinsStanding(knockedPins);
    const firstShotIsStrike = knockedPins.length === 10;

    if (currentEntry.frameNumber === 10) {
      if (firstShotIsStrike) {
        updateCurrentEntry({
          firstShotKnockedPins: knockedPins,
          secondShotKnockedPins: [...ALL_PINS],
          thirdShotKnockedPins: [...ALL_PINS],
        });
        return;
      }

      updateCurrentEntry({
        firstShotKnockedPins: knockedPins,
        secondShotKnockedPins: [...newStandingPins],
        thirdShotKnockedPins: [...ALL_PINS],
      });
      return;
    }

    updateCurrentEntry({
      firstShotKnockedPins: knockedPins,
      secondShotKnockedPins: [...newStandingPins],
      thirdShotKnockedPins: [],
    });
  }

  function updateSecondShotPins(knockedPins: number[]) {
    if (currentEntry.frameNumber !== 10) {
      updateCurrentEntry({ secondShotKnockedPins: knockedPins });
      return;
    }

    if (isStrike) {
      updateCurrentEntry({
        secondShotKnockedPins: knockedPins,
        thirdShotKnockedPins:
          knockedPins.length === 10 ? [...ALL_PINS] : getPinsStanding(knockedPins),
      });
      return;
    }

    const secondShotMakesSpare = firstShotPinCount + knockedPins.length === 10;

    updateCurrentEntry({
      secondShotKnockedPins: knockedPins,
      thirdShotKnockedPins: secondShotMakesSpare ? [...ALL_PINS] : [],
    });
  }

  function goToPreviousEntry() {
    if (currentEntryIndex > 0) {
      setCurrentEntryIndex((index) => index - 1);
    }
  }

  function goToNextEntry() {
    if (currentEntryIndex < maxUnlockedIndex) {
      setCurrentEntryIndex((index) => index + 1);
    }
  }

  function getCarryoverFromEntry(entry: FrameEntry): CarryoverFields {
    return {
      ballUsed: entry.ballUsed,
      footBoard: entry.footBoard,
      targetArrow: entry.targetArrow,
      targetBreakpoint: entry.targetBreakpoint,
      actualArrow: entry.actualArrow,
      actualBreakpoint: entry.actualBreakpoint,
    };
  }

  function applyCarryoverToEntry(
    entry: FrameEntry,
    carryover: CarryoverFields | undefined
  ): FrameEntry {
    if (!carryover) {
      return entry;
    }

    return {
      ...entry,
      ballUsed: entry.ballUsed || carryover.ballUsed,
      footBoard: entry.footBoard || carryover.footBoard,
      targetArrow: entry.targetArrow || carryover.targetArrow,
      targetBreakpoint: entry.targetBreakpoint || carryover.targetBreakpoint,
      actualArrow: entry.actualArrow || carryover.actualArrow,
      actualBreakpoint: entry.actualBreakpoint || carryover.actualBreakpoint,
    };
  }

  function completeCurrentEntry() {
    const nextIndex = currentEntryIndex + 1;
    const currentCarryover = getCarryoverFromEntry(currentEntry);

    const updatedCarryovers = {
      ...bowlerCarryovers,
      [currentEntry.bowlerName]: currentCarryover,
    };

    setBowlerCarryovers(updatedCarryovers);

    const updatedEntries = [...entries];

    updatedEntries[currentEntryIndex] = {
      ...updatedEntries[currentEntryIndex],
      isComplete: true,
    };

    if (nextIndex < updatedEntries.length) {
      const nextBowlerName = updatedEntries[nextIndex].bowlerName;

      updatedEntries[nextIndex] = applyCarryoverToEntry(
        updatedEntries[nextIndex],
        updatedCarryovers[nextBowlerName]
      );
    }

    setEntries(updatedEntries);

    if (isLastEntry) {
      const scores = calculateScoresForGame(updatedEntries, bowlerNames, format);
      const laneLabel = formatLaneLabel(laneMode, currentStartingLaneOrPair);

      setCompletedGames((currentGames) => {
        const otherGames = currentGames.filter(
          (game) => game.gameNumber !== gameNumber
        );

        return [
          ...otherGames,
          {
            gameNumber,
            laneLabel,
            scores,
            entries: updatedEntries.map((entry) => ({
              ...entry,
              firstShotKnockedPins: [...entry.firstShotKnockedPins],
              secondShotKnockedPins: [...entry.secondShotKnockedPins],
              thirdShotKnockedPins: [...entry.thirdShotKnockedPins],
            })),
          },
        ].sort((a, b) => a.gameNumber - b.gameNumber);
      });

      return;
    }

    setMaxUnlockedIndex((currentMax) => Math.max(currentMax, nextIndex));
    setCurrentEntryIndex(nextIndex);
  }

  function handleSaveAndExit() {
    const savedAt = new Date().toISOString();
    const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    if (completedGames.length > 0) {
      onSaveCompletedGames(
        completedGames.map((game) => ({
          id: `${sessionId}-${game.gameNumber}`,
          sessionId,
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
          gameNumber: game.gameNumber,
          laneLabel: game.laneLabel,
          bowlerNames,
          scores: game.scores,
          entries: game.entries.map((entry) => ({
            ...entry,
            firstShotKnockedPins: [...entry.firstShotKnockedPins],
            secondShotKnockedPins: [...entry.secondShotKnockedPins],
          })),
        }))
      );
    }

    if (
      eventLogKey &&
      eventId !== null &&
      eventStageLabel &&
      competitionType !== "Open"
    ) {
      onSavedEventLog({
        key: eventLogKey,
        eventId,
        eventName,
        eventType: competitionType,
        stageLabel: eventStageLabel,
      });
    }

    onBack();
  }

  function handleStartAnotherGame() {
    if (isLastGameInSeries) {
      return;
    }

    setCurrentStartingLaneOrPair(nextLaneOrPair);
    setGameNumber((currentGameNumber) => currentGameNumber + 1);
    setEntries(buildEntries(bowlerCarryovers));
    setCurrentEntryIndex(0);
    setMaxUnlockedIndex(0);
    setShowNextGameSetup(false);
  }

  return (
    <>
      <button className="back-button" onClick={handleBackDuringScoring}>
        ← Back to Setup
      </button>

      <h2>Game Entry</h2>

      <div className="session-summary">
        <p>
          <strong>Game:</strong> {gameDisplay}
        </p>
        <p>
          <strong>Competition:</strong> {competitionType}
        </p>
        <p>
          <strong>Format:</strong> {format}
        </p>
        <p>
          <strong>Bowlers Per Pair:</strong> {bowlersPerTeam}
        </p>
        <p>
          <strong>Bowling Center:</strong> {centerName}
        </p>
        <p>
          <strong>Pattern:</strong> {patternName}
        </p>
        {eventStageLabel && (
          <p>
            <strong>Week/Day:</strong> {eventStageLabel}
          </p>
        )}
        <p>
          <strong>Pair/Lane:</strong>{" "}
          {formatLaneLabel(laneMode, currentStartingLaneOrPair)}
        </p>
        <p>
          <strong>Bowler Order:</strong> {bowlerNames.join(" → ")}
        </p>
      </div>

      <section className="frame-card current-frame-card">
        <div className="frame-header">
          <div>
            <p className="eyebrow">Current Frame</p>
            <h3>Frame {currentEntry.frameNumber}</h3>
          </div>

          <div>
            <p className="eyebrow">Current Bowler</p>
            <h3>{currentEntry.bowlerName}</h3>
          </div>
        </div>

        <div className="progress-row">
          <span>Game {gameDisplay}</span>
          <span>
            Entry {currentEntryIndex + 1} of {entries.length}
          </span>
          <span>Frame {currentEntry.frameNumber} of 10</span>
          <span>{frameResult}</span>
          {currentEntry.isComplete && <span>Completed</span>}
          {format === "Baker" && <span>Baker rotation</span>}
        </div>

        <ScoreGrid
          title={
            format === "Baker"
              ? "Baker Team Score"
              : `${currentEntry.bowlerName} Score`
          }
          entries={entries.filter((entry, index) => {
            const matchesBowler =
              format === "Baker" || entry.bowlerName === currentEntry.bowlerName;

            return matchesBowler && index <= currentEntryIndex;
          })}
        />

        <div className="pin-entry-layout">
          <div className="shot-decks">
            <div>
              <h3>First Ball Pin Deck</h3>
              <p className="helper-text">
                Click the pins that were knocked down. Pins not selected are
                treated as standing.
              </p>

              <PinDeck
                knockedPins={currentEntry.firstShotKnockedPins}
                onChange={updateFirstShotPins}
              />
            </div>

            {shouldShowSecondShot && (
              <div className="second-shot-card">
                <h3>Second Ball Pin Deck</h3>
                <p className="helper-text">
                  {isTenthFrame && isStrike
                    ? "Tenth-frame bonus shot. Default is strike; deselect pins left standing."
                    : "Default is spare conversion; deselect pins left standing after the spare attempt."}
                </p>

                <PinDeck
                  knockedPins={currentEntry.secondShotKnockedPins}
                  availablePins={secondShotAvailablePins}
                  onChange={updateSecondShotPins}
                />
              </div>
            )}

            {shouldShowThirdShot && (
              <div className="second-shot-card">
                <h3>Third Ball Pin Deck</h3>
                <p className="helper-text">
                  Tenth-frame fill shot. Default is strike or spare conversion;
                  deselect pins left standing.
                </p>

                <PinDeck
                  knockedPins={currentEntry.thirdShotKnockedPins}
                  availablePins={thirdShotAvailablePins}
                  onChange={(knockedPins) =>
                    updateCurrentEntry({ thirdShotKnockedPins: knockedPins })
                  }
                />
              </div>
            )}

            <div className="shot-summary">
              <p>
                <strong>First Shot Count:</strong> {firstShotPinCount}
              </p>
              {shouldShowSecondShot && (
                <p>
                  <strong>Second Shot Count:</strong> {secondShotPinCount}
                </p>
              )}
              {shouldShowThirdShot && (
                <p>
                  <strong>Third Shot Count:</strong> {thirdShotPinCount}
                </p>
              )}
              <p>
                <strong>Frame Pin Count:</strong> {totalFramePinCount}
              </p>
              <p>
                <strong>Pins Standing After Frame:</strong>{" "}
                {pinsStandingAfterFrame.length === 0
                  ? "None"
                  : pinsStandingAfterFrame.join("-")}
              </p>
              <p>
                <strong>Result:</strong> {frameResult}
              </p>
            </div>
          </div>

          <div>
            <div className="form-grid compact-grid">
              <label>
                Ball Used
                <select
                  value={currentEntry.ballUsed}
                  onChange={(event) =>
                    updateCurrentEntry({ ballUsed: event.target.value })
                  }
                >
                  <option value="">Select ball</option>

                  {currentBowlerBalls.length === 0 && (
                    <option value="" disabled>
                      No balls in arsenal
                    </option>
                  )}

                  {currentBowlerBalls.map((ball) => (
                    <option key={ball.id} value={ball.name}>
                      {ball.name}
                      {ball.brand ? ` — ${ball.brand}` : ""}
                    </option>
                  ))}
                </select>
              </label>

              <BoardSelect
                label="Foot Board"
                value={currentEntry.footBoard}
                options={footBoardOptions}
                onChange={(value) => updateCurrentEntry({ footBoard: value })}
              />

              <BoardSelect
                label="Target Arrow"
                value={currentEntry.targetArrow}
                options={laneBoardOptions}
                onChange={(value) => updateCurrentEntry({ targetArrow: value })}
              />

              <BoardSelect
                label="Target Breakpoint"
                value={currentEntry.targetBreakpoint}
                options={laneBoardOptions}
                onChange={(value) =>
                  updateCurrentEntry({ targetBreakpoint: value })
                }
              />

              <BoardSelect
                label="Actual Arrow"
                value={currentEntry.actualArrow}
                options={laneBoardOptions}
                onChange={(value) => updateCurrentEntry({ actualArrow: value })}
              />

              <BoardSelect
                label="Actual Breakpoint"
                value={currentEntry.actualBreakpoint}
                options={laneBoardOptions}
                onChange={(value) =>
                  updateCurrentEntry({ actualBreakpoint: value })
                }
              />
            </div>
          </div>
        </div>

        <p className="helper-text frame-edit-warning-text">
          Saving frame edits recalculates this game's saved score and updates
          the stats that use this game. Closing with unsaved changes will ask
          before discarding and reverting the edits.
        </p>

        <div className="frame-navigation">
          <button
            className="secondary-button"
            disabled={currentEntryIndex === 0}
            onClick={goToPreviousEntry}
          >
            ← Previous
          </button>

          <button
            className="secondary-button"
            disabled={currentEntryIndex >= maxUnlockedIndex}
            onClick={goToNextEntry}
          >
            Next →
          </button>

          <button
            className="primary-button"
            disabled={isGameComplete}
            onClick={completeCurrentEntry}
          >
            {isLastEntry ? "Complete Game" : "Complete Frame"}
          </button>
        </div>

        {isGameComplete && (
          <section className="post-game-actions">
            <h3>
              {isLastGameInSeries
                ? `${competitionType} Set Complete`
                : `Game ${gameDisplay} Complete`}
            </h3>

            <CompletedGamesList completedGames={completedGames} />

            <p className="success-text">
              {isLastGameInSeries
                ? "This series/block is complete. Save and exit when ready."
                : "Choose whether to exit or start another game in the same session."}
            </p>

            {eventLogKey && competitionType !== "Open" && (
              <p className="helper-text">
                Saving will lock {eventStageLabel} for this {competitionType.toLowerCase()}.
                To log it again later, the original saved log will need to be deleted.
              </p>
            )}

            <div className="post-game-buttons">
              <button className="primary-button" onClick={handleSaveAndExit}>
                Save and Exit
              </button>

              {!isLastGameInSeries && (
                <button
                  className="secondary-button"
                  onClick={() => setShowNextGameSetup((current) => !current)}
                >
                  Start Another Game
                </button>
              )}
            </div>

            {showNextGameSetup && !isLastGameInSeries && (
              <div className="next-game-card">
                <label>
                  Next Pair/Lane
                  <select
                    value={nextLaneOrPair}
                    onChange={(event) => setNextLaneOrPair(event.target.value)}
                  >
                    {laneOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  className="primary-button"
                  disabled={!nextLaneOrPair}
                  onClick={handleStartAnotherGame}
                >
                  Start Game {gameNumber + 1}
                  {isLimitedSeries ? `/${seriesGameCount}` : ""}
                </button>
              </div>
            )}
          </section>
        )}
      </section>
    </>
  );
}

// Completed Game Summary
// ==================

function CompletedGamesList({
  completedGames,
}: {
  completedGames: CompletedGameSummary[];
}) {
  if (completedGames.length === 0) {
    return null;
  }

  return (
    <section className="completed-games-card">
      <h4>Completed Game Scores</h4>

      {completedGames.map((game) => (
        <div className="completed-game-row" key={game.gameNumber}>
          <div>
            <strong>Game {game.gameNumber}</strong>
            <p>{game.laneLabel}</p>
          </div>

          <div className="score-list">
            {game.scores.map((score) => (
              <p key={score.label}>
                <strong>{score.label}:</strong> {score.score}
              </p>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

// Board Select
// ==================

function BoardSelect({ label, value, options, onChange }: BoardSelectProps) {
  return (
    <label>
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Optional</option>
        {options.map((board) => (
          <option key={board} value={board}>
            {board}
          </option>
        ))}
      </select>
    </label>
  );
}

// Scoring Helpers
// ==================

function getPinsStanding(knockedPins: number[]) {
  return ALL_PINS.filter((pin) => !knockedPins.includes(pin));
}

function isSplitLeave(knockedPins: number[]) {
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

function getFrameResult(
  isStrike: boolean,
  pinsStandingAfterFrame: number[],
  isSpare = false
) {
  if (isStrike) {
    return "Strike";
  }

  if (isSpare || pinsStandingAfterFrame.length === 0) {
    return "Spare";
  }

  return "Open";
}

function formatLaneLabel(laneMode: string, laneOrPair: string) {
  return laneMode === "Pair" ? `Pair ${laneOrPair}` : `Lane ${laneOrPair}`;
}

function calculateScoresForGame(
  entries: FrameEntry[],
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

function getFrameRolls(frame: FrameEntry) {
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

function scoreBowlingFrames(frames: FrameEntry[]) {
  const sortedFrames = [...frames].sort((a, b) => a.frameNumber - b.frameNumber);
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

function getCumulativeFrameScores(frames: FrameEntry[]) {
  const sortedFrames = [...frames].sort((a, b) => a.frameNumber - b.frameNumber);
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

function formatPinfallMark(value: number, options?: { isStrikeShot?: boolean }) {
  if (options?.isStrikeShot && value === 10) {
    return "X";
  }

  if (value === 0) {
    return "-";
  }

  return String(value);
}

type ScoreMark = {
  value: string;
  isSplit?: boolean;
};

function createScoreMark(value: string, isSplit = false): ScoreMark {
  return {
    value,
    isSplit,
  };
}

function getFrameMarks(frame: FrameEntry): ScoreMark[] {
  const first = frame.firstShotKnockedPins.length;
  const second = frame.secondShotKnockedPins.length;
  const third = frame.thirdShotKnockedPins.length;
  const firstShotSplit = first < 10 && isSplitLeave(frame.firstShotKnockedPins);

  if (frame.frameNumber === 10) {
    const firstMark = createScoreMark(
      first === 10 ? "X" : formatPinfallMark(first),
      firstShotSplit
    );
    let secondMark = createScoreMark("");

    if (first === 10) {
      secondMark = createScoreMark(
        second === 10 ? "X" : formatPinfallMark(second),
        second < 10 && isSplitLeave(frame.secondShotKnockedPins)
      );
    } else {
      secondMark = createScoreMark(
        first + second === 10 ? "/" : formatPinfallMark(second)
      );
    }

    let thirdMark = createScoreMark("");

    if (first === 10 || first + second === 10) {
      if (second === 10 || first + second === 10) {
        thirdMark = createScoreMark(
          third === 10 ? "X" : formatPinfallMark(third),
          third < 10 && isSplitLeave(frame.thirdShotKnockedPins)
        );
      } else {
        thirdMark = createScoreMark(
          second + third === 10 ? "/" : formatPinfallMark(third)
        );
      }
    }

    return [firstMark, secondMark, thirdMark];
  }

  if (first === 10) {
    return [createScoreMark(""), createScoreMark("X")];
  }

  return [
    createScoreMark(formatPinfallMark(first), firstShotSplit),
    createScoreMark(first + second === 10 ? "/" : formatPinfallMark(second)),
  ];
}

// Score Grid
// ==================

function ScoreRollMark({ mark }: { mark?: ScoreMark }) {
  return (
    <span className={mark?.isSplit ? "split-score-mark" : ""}>
      {mark?.value ?? ""}
    </span>
  );
}

function ScoreGrid({
  title,
  entries,
}: {
  title: string;
  entries: FrameEntry[];
}) {
  const framesByNumber = new Map<number, FrameEntry>();

  entries.forEach((entry) => {
    framesByNumber.set(entry.frameNumber, entry);
  });

  const orderedFrames = Array.from(framesByNumber.values()).sort(
    (a, b) => a.frameNumber - b.frameNumber
  );
  const cumulativeScores = getCumulativeFrameScores(orderedFrames);

  return (
    <section className="score-grid-card">
      <h4>{title}</h4>

      <div className="score-grid">
        {Array.from({ length: 10 }, (_, index) => {
          const frameNumber = index + 1;
          const frame = framesByNumber.get(frameNumber);
          const marks = frame ? getFrameMarks(frame) : [];
          const cumulativeScore = cumulativeScores[index] ?? "";

          return (
            <div className="score-frame" key={frameNumber}>
              <div className="score-frame-number">{frameNumber}</div>

              <div
                className={
                  frameNumber === 10
                    ? "score-rolls tenth-frame-rolls"
                    : "score-rolls"
                }
              >
                {frameNumber === 10 ? (
                  <>
                    <ScoreRollMark mark={marks[0]} />
                    <ScoreRollMark mark={marks[1]} />
                    <ScoreRollMark mark={marks[2]} />
                  </>
                ) : (
                  <>
                    <ScoreRollMark mark={marks[0]} />
                    <ScoreRollMark mark={marks[1]} />
                  </>
                )}
              </div>

              <div className="score-total">{cumulativeScore}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}


// Pin Deck
// ==================

function PinDeck({ knockedPins, onChange, availablePins }: PinDeckProps) {
  const pins = [
    { number: 7, left: 15, top: 15 },
    { number: 8, left: 38, top: 15 },
    { number: 9, left: 62, top: 15 },
    { number: 10, left: 85, top: 15 },

    { number: 4, left: 27, top: 38 },
    { number: 5, left: 50, top: 38 },
    { number: 6, left: 73, top: 38 },

    { number: 2, left: 38, top: 61 },
    { number: 3, left: 62, top: 61 },

    { number: 1, left: 50, top: 84 },
  ];

  const availablePinNumbers = availablePins ?? ALL_PINS;

  function togglePin(pinNumber: number) {
    if (!availablePinNumbers.includes(pinNumber)) {
      return;
    }

    if (knockedPins.includes(pinNumber)) {
      onChange(knockedPins.filter((pin) => pin !== pinNumber));
      return;
    }

    onChange([...knockedPins, pinNumber].sort((a, b) => a - b));
  }

  function selectAllPins() {
    onChange([...availablePinNumbers].sort((a, b) => a - b));
  }

  function clearPins() {
    onChange([]);
  }

  return (
    <div>
      <div className="pin-deck">
        {pins.map((pin) => {
          const isAvailable = availablePinNumbers.includes(pin.number);
          const isKnocked = knockedPins.includes(pin.number);

          return (
            <button
              key={pin.number}
              type="button"
              className={`pin-button ${isKnocked ? "knocked" : ""} ${
                !isAvailable ? "unavailable" : ""
              }`}
              disabled={!isAvailable}
              style={{
                left: `${pin.left}%`,
                top: `${pin.top}%`,
              }}
              onClick={() => togglePin(pin.number)}
              title={
                isKnocked
                  ? `Pin ${pin.number} knocked down`
                  : `Pin ${pin.number} standing`
              }
            >
              {pin.number}
            </button>
          );
        })}
      </div>

      <div className="pin-actions">
        <button
          type="button"
          className="secondary-button"
          onClick={selectAllPins}
        >
          Select All
        </button>

        <button type="button" className="secondary-button" onClick={clearPins}>
          Clear
        </button>
      </div>
    </div>
  );
}

// Static Pin Deck
// ==================

function StaticPinLeaveDeck({ leave }: { leave: string }) {
  const pins = [
    { number: 7, left: 15, top: 15 },
    { number: 8, left: 38, top: 15 },
    { number: 9, left: 62, top: 15 },
    { number: 10, left: 85, top: 15 },
    { number: 4, left: 27, top: 38 },
    { number: 5, left: 50, top: 38 },
    { number: 6, left: 73, top: 38 },
    { number: 2, left: 38, top: 61 },
    { number: 3, left: 62, top: 61 },
    { number: 1, left: 50, top: 84 },
  ];
  const standingPins = parseLeaveKeyPins(leave);

  return (
    <div className="mini-pin-deck" aria-label={`Leave ${leave}`}>
      {pins.map((pin) => {
        const isStanding = standingPins.includes(pin.number);

        return (
          <span
            key={pin.number}
            className={`mini-pin ${isStanding ? "standing" : ""}`}
            style={{
              left: `${pin.left}%`,
              top: `${pin.top}%`,
            }}
            title={
              isStanding
                ? `Pin ${pin.number} left`
                : `Pin ${pin.number} cleared`
            }
          >
            {pin.number}
          </span>
        );
      })}
    </div>
  );
}

// Stats
// ==================

function StatsPage({
  bowlers,
  centers,
  patterns,
  savedGames,
  setSavedGames,
  setSavedEventLogs,
}: StatsPageProps) {
  const [selectedBowler, setSelectedBowler] = useState("All");
  const [selectedBakerBowler, setSelectedBakerBowler] = useState("All");
  const [selectedBall, setSelectedBall] = useState("All");
  const [selectedCompetition, setSelectedCompetition] = useState("All");
  const [selectedEventName, setSelectedEventName] = useState("All");
  const [selectedCenter, setSelectedCenter] = useState("All");
  const [selectedLane, setSelectedLane] = useState("All");
  const [selectedPattern, setSelectedPattern] = useState("All");
  const [selectedEventStage, setSelectedEventStage] = useState("All");
  const [selectedSetKey, setSelectedSetKey] = useState("All");
  const [selectedGameNumber, setSelectedGameNumber] = useState("All");
  const [setMetadataDrafts, setSetMetadataDrafts] = useState<
    Record<string, SetMetadataDraft>
  >({});
  const [editingSetMetadataKey, setEditingSetMetadataKey] = useState<
    string | null
  >(null);
  const [gameMetadataDrafts, setGameMetadataDrafts] = useState<
    Record<string, GameMetadataDraft>
  >({});
  const [editingGameMetadataId, setEditingGameMetadataId] = useState<
    string | null
  >(null);
  const [frameEditorGameId, setFrameEditorGameId] = useState<string | null>(
    null
  );
  const [frameEditorEntries, setFrameEditorEntries] = useState<FrameEntry[]>(
    []
  );
  const [frameEditorIndex, setFrameEditorIndex] = useState(0);

  const isBakerTeamSelection = selectedBowler.startsWith("Baker Team:");
  const usesEventFilter =
    selectedCompetition === "League" || selectedCompetition === "Tournament";
  const hasFocusedStatsFilter =
    selectedBowler !== "All" ||
    selectedBakerBowler !== "All" ||
    selectedBall !== "All" ||
    selectedCompetition !== "All" ||
    selectedEventName !== "All" ||
    selectedCenter !== "All" ||
    selectedLane !== "All" ||
    selectedPattern !== "All" ||
    selectedEventStage !== "All" ||
    selectedSetKey !== "All" ||
    selectedGameNumber !== "All";
  const isIndividualBowlerFilter =
    selectedBowler !== "All" && !isBakerTeamSelection;
  const bowlerHandednessByName = useMemo(
    () =>
      new Map<string, Handedness>(
        bowlers.map((bowler) => [bowler.name, bowler.handedness])
      ),
    [bowlers]
  );
  const frameEditorGame =
    frameEditorGameId !== null
      ? savedGames.find((game) => game.id === frameEditorGameId) ?? null
      : null;

  function getEventStageLabelForGame(game: SavedGameRecord) {
    return game.eventName && game.eventStageLabel
      ? `${game.eventName} — ${game.eventStageLabel}`
      : "";
  }

  function getBakerTeamLabelFromNames(names: string[]) {
    const sortedNames = Array.from(new Set(names)).sort((a, b) =>
      a.localeCompare(b)
    );

    return `Baker Team: ${sortedNames.join(", ")}`;
  }

  function getBakerTeamLabelForGame(game: SavedGameRecord) {
    if (game.format !== "Baker") {
      return "";
    }

    return getBakerTeamLabelFromNames(game.bowlerNames);
  }

  function gameMatchesCurrentFilters(
    game: SavedGameRecord,
    ignoredFilters: string[] = []
  ) {
    const ignores = new Set(ignoredFilters);
    const bakerTeamLabel = getBakerTeamLabelForGame(game);

    const matchesBowler =
      ignores.has("bowler") ||
      selectedBowler === "All" ||
      (isBakerTeamSelection
        ? game.format === "Baker" && bakerTeamLabel === selectedBowler
        : game.format !== "Baker" &&
          game.entries.some((entry) => entry.bowlerName === selectedBowler));

    const matchesBakerBowler =
      ignores.has("bakerBowler") ||
      selectedBakerBowler === "All" ||
      game.format !== "Baker" ||
      game.entries.some((entry) => entry.bowlerName === selectedBakerBowler);

    const matchesBall =
      ignores.has("ball") ||
      selectedBall === "All" ||
      game.entries.some(
        (entry) =>
          entry.ballUsed === selectedBall &&
          (selectedBowler === "All" ||
            isBakerTeamSelection ||
            entry.bowlerName === selectedBowler) &&
          (selectedBakerBowler === "All" ||
            game.format !== "Baker" ||
            entry.bowlerName === selectedBakerBowler)
      );

    const matchesCompetition =
      ignores.has("competition") ||
      selectedCompetition === "All" ||
      game.competitionType === selectedCompetition;

    const matchesEventName =
      ignores.has("eventName") ||
      selectedEventName === "All" ||
      game.eventName === selectedEventName;

    const matchesCenter =
      ignores.has("center") ||
      selectedCenter === "All" ||
      game.centerName === selectedCenter;

    const matchesLane =
      ignores.has("lane") ||
      selectedLane === "All" ||
      game.laneLabel === selectedLane;

    const matchesPattern =
      ignores.has("pattern") ||
      selectedPattern === "All" ||
      game.patternName === selectedPattern;

    const matchesEventStage =
      ignores.has("eventStage") ||
      selectedEventStage === "All" ||
      game.eventStageLabel === selectedEventStage;

    const matchesSet =
      ignores.has("set") ||
      selectedSetKey === "All" ||
      game.sessionId === selectedSetKey;

    const matchesGame =
      ignores.has("game") ||
      selectedGameNumber === "All" ||
      String(game.gameNumber) === selectedGameNumber;

    return (
      matchesBowler &&
      matchesBakerBowler &&
      matchesBall &&
      matchesCompetition &&
      matchesEventName &&
      matchesCenter &&
      matchesLane &&
      matchesPattern &&
      matchesEventStage &&
      matchesSet &&
      matchesGame
    );
  }

  const individualBowlerOptions = Array.from(
    new Set(
      savedGames
        .filter(
          (game) =>
            game.format !== "Baker" &&
            gameMatchesCurrentFilters(game, ["bowler", "ball"])
        )
        .flatMap((game) => game.entries.map((entry) => entry.bowlerName))
    )
  ).sort();

  const bakerTeamOptions = Array.from(
    new Set(
      savedGames
        .filter(
          (game) =>
            game.format === "Baker" &&
            gameMatchesCurrentFilters(game, ["bowler", "bakerBowler", "ball"])
        )
        .map(getBakerTeamLabelForGame)
        .filter(Boolean)
    )
  ).sort();

  const selectedBakerGames = savedGames.filter(
    (game) =>
      game.format === "Baker" &&
      selectedBowler !== "All" &&
      getBakerTeamLabelForGame(game) === selectedBowler &&
      gameMatchesCurrentFilters(game, ["bakerBowler", "ball"])
  );

  const bakerBowlerOptions = Array.from(
    new Set(selectedBakerGames.flatMap((game) => game.bowlerNames))
  ).sort((a, b) => a.localeCompare(b));

  const ballOptions = Array.from(
    new Set(
      savedGames
        .filter((game) => gameMatchesCurrentFilters(game, ["ball"]))
        .flatMap((game) => {
          if (isBakerTeamSelection) {
            if (game.format !== "Baker" || getBakerTeamLabelForGame(game) !== selectedBowler) {
              return [];
            }

            return game.entries
              .filter(
                (entry) =>
                  selectedBakerBowler === "All" ||
                  entry.bowlerName === selectedBakerBowler
              )
              .map((entry) => entry.ballUsed)
              .filter(Boolean);
          }

          if (game.format === "Baker") {
            return [];
          }

          return game.entries
            .filter(
              (entry) =>
                selectedBowler === "All" || entry.bowlerName === selectedBowler
            )
            .map((entry) => entry.ballUsed)
            .filter(Boolean);
        })
    )
  ).sort();

  const competitionOptions = Array.from(
    new Set(
      savedGames
        .filter((game) => gameMatchesCurrentFilters(game, ["competition"]))
        .map((game) => game.competitionType)
    )
  ).sort();

  const eventOptions = usesEventFilter
    ? Array.from(
        new Set(
          savedGames
            .filter(
              (game) =>
                game.eventName &&
                game.competitionType === selectedCompetition &&
                gameMatchesCurrentFilters(game, ["eventName", "eventStage"])
            )
            .map((game) => game.eventName)
        )
      ).sort()
    : [];

  const centerOptions = Array.from(
    new Set(
      savedGames
        .filter((game) => gameMatchesCurrentFilters(game, ["center", "lane"]))
        .map((game) => game.centerName)
    )
  ).sort();

  const laneOptions =
    selectedCenter === "All"
      ? []
      : Array.from(
          new Set(
            savedGames
              .filter(
                (game) =>
                  game.centerName === selectedCenter &&
                  gameMatchesCurrentFilters(game, ["lane"])
              )
              .map((game) => game.laneLabel)
          )
        ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const patternOptions = Array.from(
    new Set(
      savedGames
        .filter((game) => gameMatchesCurrentFilters(game, ["pattern"]))
        .map((game) => game.patternName)
    )
  ).sort();

  const eventStageOptions =
    usesEventFilter && selectedEventName !== "All"
      ? Array.from(
          new Set(
            savedGames
              .filter(
                (game) =>
                  game.competitionType === selectedCompetition &&
                  game.eventName === selectedEventName &&
                  gameMatchesCurrentFilters(game, ["eventStage"])
              )
              .map((game) => game.eventStageLabel)
              .filter(Boolean)
          )
        ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      : [];

  const usesSetFilter =
    (usesEventFilter && selectedEventName !== "All") ||
    selectedCompetition === "Open";

  const setOptions = usesSetFilter
    ? buildSetFilterOptions(
        savedGames.filter((game) =>
          gameMatchesCurrentFilters(game, ["set", "game"])
        )
      )
    : [];

  const gameOptions =
    selectedSetKey !== "All"
      ? Array.from(
          new Set(
            savedGames
              .filter((game) => gameMatchesCurrentFilters(game, ["game"]))
              .map((game) => game.gameNumber)
          )
        ).sort((a, b) => a - b)
      : [];

  const filteredGames = savedGames.filter((game) =>
    gameMatchesCurrentFilters(game)
  );
  const statsFilteredGames = filteredGames.filter(
    (game) => game.format !== "Baker" || isBakerTeamSelection
  );
  const hiddenBakerGameCount = filteredGames.length - statsFilteredGames.length;

  const bakerTeamGames = filteredGames.filter(
    (game) =>
      game.format === "Baker" &&
      (selectedBowler === "All" ||
        getBakerTeamLabelForGame(game) === selectedBowler)
  );

  const filteredEntries = statsFilteredGames.flatMap((game) =>
    game.entries.filter((entry) => {
      if (game.format === "Baker") {
        if (!isBakerTeamSelection) {
          return false;
        }

        const matchesBakerBowler =
          selectedBakerBowler === "All" ||
          entry.bowlerName === selectedBakerBowler;
        const matchesBall =
          selectedBall === "All" || entry.ballUsed === selectedBall;

        return matchesBakerBowler && matchesBall;
      }

      const matchesBowler =
        selectedBowler === "All" || entry.bowlerName === selectedBowler;
      const matchesBall =
        selectedBall === "All" || entry.ballUsed === selectedBall;

      return matchesBowler && matchesBall;
    })
  );

  const totalScores = statsFilteredGames.flatMap((game) => {
    if (game.format === "Baker") {
      if (!isBakerTeamSelection) {
        return [];
      }

      return game.scores.map((score) => score.score);
    }

    return game.scores
      .filter((score) => selectedBowler === "All" || score.label === selectedBowler)
      .map((score) => score.score);
  });

  const overallAverage =
    totalScores.length > 0
      ? totalScores.reduce((sum, score) => sum + score, 0) / totalScores.length
      : 0;

  const strikeCount = filteredEntries.filter(isStrikeEntry).length;
  const spareCount = filteredEntries.filter(isSpareEntry).length;
  const openCount = filteredEntries.length - strikeCount - spareCount;
  const cleanFrameCount = filteredEntries.filter(isCleanFrame).length;
  const splitCount = filteredEntries.filter(isSplitEntry).length;
  const cleanPercentage =
    filteredEntries.length > 0
      ? (cleanFrameCount / filteredEntries.length) * 100
      : 0;
  const splitPercentage =
    filteredEntries.length > 0 ? (splitCount / filteredEntries.length) * 100 : 0;
  const cleanGameCount = countCleanGames(
    statsFilteredGames,
    isBakerTeamSelection ? selectedBakerBowler : selectedBowler,
    selectedBall
  );

  const sessionGroups = buildSessionGroups(statsFilteredGames);
  const overviewHighGame = totalScores.length > 0 ? Math.max(...totalScores) : 0;
  const overviewHighThreeGameSeries = isIndividualBowlerFilter
    ? getHighSeries(sessionGroups, selectedBowler, 3)
    : getHighTeamSeries(sessionGroups, 3);
  const teamSetRows = calculateTeamSetRows(sessionGroups);
  const detailedStats =
    isIndividualBowlerFilter
      ? calculateDetailedBowlerStats(
          selectedBowler,
          selectedBall,
          statsFilteredGames.filter((game) => game.format !== "Baker"),
          sessionGroups,
          bowlerHandednessByName
        )
      : null;

  const spareLeaveRows = calculateSpareLeaveRows(filteredEntries);
  const spareLeaveSummary = calculateSpareLeaveSummary(filteredEntries);
  const boardStats = calculateBoardStats(filteredEntries);
  const boardProgressionRows = calculateBoardProgressionRows(
    statsFilteredGames,
    isBakerTeamSelection ? selectedBakerBowler : selectedBowler,
    selectedBall
  );

  const bowlerRows = individualBowlerOptions
    .map((bowlerName) => {
      const nonBakerGames = statsFilteredGames.filter((game) => game.format !== "Baker");

      const bowlerEntries = nonBakerGames.flatMap((game) =>
        game.entries.filter((entry) => {
          const matchesBowler = entry.bowlerName === bowlerName;
          const matchesBall =
            selectedBall === "All" || entry.ballUsed === selectedBall;

          return matchesBowler && matchesBall;
        })
      );

      const bowlerScores = nonBakerGames.flatMap((game) =>
        game.scores
          .filter((score) => score.label === bowlerName)
          .map((score) => score.score)
      );

      const bowlerStrikes = bowlerEntries.filter(isStrikeEntry).length;
      const bowlerSpares = bowlerEntries.filter(isSpareEntry).length;
      const bowlerOpens = bowlerEntries.length - bowlerStrikes - bowlerSpares;
      const bowlerCleanFrames = bowlerEntries.filter(isCleanFrame).length;
      const bowlerSplits = bowlerEntries.filter(isSplitEntry).length;
      const bowlerCleanGames = countCleanGames(
        nonBakerGames,
        bowlerName,
        selectedBall
      );

      const bowlerAverage =
        bowlerScores.length > 0
          ? bowlerScores.reduce((sum, score) => sum + score, 0) /
            bowlerScores.length
          : 0;

      return {
        bowlerName,
        games: bowlerScores.length,
        frames: bowlerEntries.length,
        average: bowlerAverage,
        highGame: bowlerScores.length > 0 ? Math.max(...bowlerScores) : 0,
        highSeries: getHighFullSeries(sessionGroups, bowlerName),
        strikes: bowlerStrikes,
        spares: bowlerSpares,
        opens: bowlerOpens,
        cleanGames: bowlerCleanGames,
        strikeRate:
          bowlerEntries.length > 0
            ? (bowlerStrikes / bowlerEntries.length) * 100
            : 0,
        spareRate:
          bowlerEntries.length > 0
            ? (bowlerSpares / bowlerEntries.length) * 100
            : 0,
        cleanRate:
          bowlerEntries.length > 0
            ? (bowlerCleanFrames / bowlerEntries.length) * 100
            : 0,
        splitRate:
          bowlerEntries.length > 0
            ? (bowlerSplits / bowlerEntries.length) * 100
            : 0,
      };
    })
    .filter((row) => row.frames > 0 || row.games > 0);

  function clearFilters() {
    setSelectedBowler("All");
    setSelectedBakerBowler("All");
    setSelectedBall("All");
    setSelectedCompetition("All");
    setSelectedEventName("All");
    setSelectedCenter("All");
    setSelectedLane("All");
    setSelectedPattern("All");
    setSelectedEventStage("All");
    setSelectedSetKey("All");
    setSelectedGameNumber("All");
  }

  function escapeCsv(value: string | number) {
    const stringValue = String(value);

    if (
      stringValue.includes(",") ||
      stringValue.includes('"') ||
      stringValue.includes("\n")
    ) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
  }

  function getSetMetadataDraft(
    session: ReturnType<typeof buildSessionGroups>[number]
  ) {
    return (
      setMetadataDrafts[session.sessionKey] ?? createSetMetadataDraft(session)
    );
  }

  function hasSetMetadataChanges(
    session: ReturnType<typeof buildSessionGroups>[number]
  ) {
    return (
      JSON.stringify(getSetMetadataDraft(session)) !==
      JSON.stringify(createSetMetadataDraft(session))
    );
  }

  function updateSetMetadataDraft(
    session: ReturnType<typeof buildSessionGroups>[number],
    field: keyof SetMetadataDraft,
    value: string
  ) {
    setSetMetadataDrafts((currentDrafts) => ({
      ...currentDrafts,
      [session.sessionKey]: {
        ...getSetMetadataDraft(session),
        [field]: value,
      },
    }));
  }

  function updateSetGameLaneDraft(
    session: ReturnType<typeof buildSessionGroups>[number],
    gameId: string,
    laneLabel: string
  ) {
    setSetMetadataDrafts((currentDrafts) => {
      const currentDraft = getSetMetadataDraft(session);

      return {
        ...currentDrafts,
        [session.sessionKey]: {
          ...currentDraft,
          gameLaneLabels: {
            ...currentDraft.gameLaneLabels,
            [gameId]: laneLabel,
          },
        },
      };
    });
  }

  function resetSetMetadataDraft(
    session: ReturnType<typeof buildSessionGroups>[number]
  ) {
    setSetMetadataDrafts((currentDrafts) => {
      const updatedDrafts = { ...currentDrafts };

      delete updatedDrafts[session.sessionKey];

      return updatedDrafts;
    });
  }

  function saveSetMetadata(
    session: ReturnType<typeof buildSessionGroups>[number]
  ) {
    const draft = getSetMetadataDraft(session);
    const gameIds = new Set(session.games.map((game) => game.id));

    setSavedGames((currentGames) =>
      currentGames.map((game) =>
        gameIds.has(game.id)
          ? {
              ...game,
              centerName: draft.centerName.trim() || game.centerName,
              patternName: draft.patternName.trim() || game.patternName,
              laneLabel:
                draft.gameLaneLabels[game.id]?.trim() || game.laneLabel,
              setNotes: draft.setNotes.trim(),
            }
          : game
      )
    );

    resetSetMetadataDraft(session);
    setEditingSetMetadataKey(null);
  }

  function getGameMetadataDraft(game: SavedGameRecord) {
    return gameMetadataDrafts[game.id] ?? createGameMetadataDraft(game);
  }

  function hasGameNotesChanges(game: SavedGameRecord) {
    return (
      getGameMetadataDraft(game).gameNotes !==
      createGameMetadataDraft(game).gameNotes
    );
  }

  function updateGameNotesDraft(game: SavedGameRecord, gameNotes: string) {
    setGameMetadataDrafts((currentDrafts) => ({
      ...currentDrafts,
      [game.id]: {
        ...getGameMetadataDraft(game),
        gameNotes,
      },
    }));
  }

  function resetGameMetadataDraft(game: SavedGameRecord) {
    setGameMetadataDrafts((currentDrafts) => {
      const updatedDrafts = { ...currentDrafts };

      delete updatedDrafts[game.id];

      return updatedDrafts;
    });
  }

  function saveGameMetadata(gameToUpdate: SavedGameRecord) {
    const draft = getGameMetadataDraft(gameToUpdate);

    setSavedGames((currentGames) =>
      currentGames.map((game) =>
        game.id === gameToUpdate.id
          ? {
              ...game,
              gameNotes: draft.gameNotes.trim(),
            }
          : game
      )
    );

    resetGameMetadataDraft(gameToUpdate);
    setEditingGameMetadataId(null);
  }

  function openFrameEditor(game: SavedGameRecord) {
    setEditingGameMetadataId(null);
    setFrameEditorGameId(game.id);
    setFrameEditorEntries(
      game.entries.map((entry) => cloneFrameEntryForEditing(entry))
    );
    setFrameEditorIndex(0);
  }

  function closeFrameEditor() {
    setFrameEditorGameId(null);
    setFrameEditorEntries([]);
    setFrameEditorIndex(0);
  }

  function updateFrameEditorEntry(
    entryIndex: number,
    updatedFields: Partial<FrameEntry>
  ) {
    setFrameEditorEntries((currentEntries) =>
      currentEntries.map((entry, index) =>
        index === entryIndex ? { ...entry, ...updatedFields } : entry
      )
    );
  }

  function saveFrameEdits(gameToUpdate: SavedGameRecord) {
    const editedEntries = frameEditorEntries.map((entry) => ({
      ...entry,
      firstShotKnockedPins: [...entry.firstShotKnockedPins],
      secondShotKnockedPins: [...entry.secondShotKnockedPins],
      thirdShotKnockedPins: [...entry.thirdShotKnockedPins],
      isComplete: true,
    }));
    const recalculatedScores = calculateScoresForGame(
      editedEntries,
      gameToUpdate.bowlerNames,
      gameToUpdate.format
    );

    setSavedGames((currentGames) =>
      currentGames.map((game) =>
        game.id === gameToUpdate.id
          ? {
              ...game,
              entries: editedEntries,
              scores: recalculatedScores,
            }
          : game
      )
    );
    resetGameMetadataDraft(gameToUpdate);
    closeFrameEditor();
  }

  function exportFilteredCsv() {
    const rows = [
      [
        "Saved At",
        "Competition",
        "Event",
        "Week/Day",
        "Game",
        "Center",
        "Pattern",
        "Format",
        "Lane",
        "Set Notes",
        "Game Notes",
        "Score Label",
        "Score",
      ],
      ...statsFilteredGames.flatMap((game) =>
        game.scores.map((score) => [
          new Date(game.savedAt).toLocaleString(),
          game.competitionType,
          game.eventName || "Open",
          game.eventStageLabel || "",
          game.gameNumber,
          game.centerName,
          game.patternName,
          game.format,
          game.laneLabel,
          game.setNotes ?? "",
          game.gameNotes ?? "",
          score.label,
          score.score,
        ])
      ),
    ];

    const csv = rows
      .map((row) => row.map((cell) => escapeCsv(cell)).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = buildStatsExportFileName({
      selectedBowler,
      selectedBall,
      selectedCompetition,
      selectedEventName,
      selectedCenter,
      selectedLane,
      selectedPattern,
      selectedEventStage,
      selectedSetKey,
      selectedGameNumber,
    });
    link.click();

    URL.revokeObjectURL(url);
  }

  function deleteSavedSet(sessionKey: string) {
    const session = sessionGroups.find((group) => group.sessionKey === sessionKey);

    if (!session) {
      return;
    }

    const shouldDelete = window.confirm(
      `Delete saved set: ${session.title}?`
    );

    if (!shouldDelete) {
      return;
    }

    const idsToDelete = new Set(session.games.map((game) => game.id));
    const eventKeysToCheck = Array.from(
      new Set(session.games.map((game) => game.eventLogKey).filter(Boolean))
    );

    const remainingGames = savedGames.filter((game) => !idsToDelete.has(game.id));

    setSavedGames(remainingGames);

    eventKeysToCheck.forEach((eventLogKey) => {
      const stillHasEventLogRecords = remainingGames.some(
        (game) => game.eventLogKey === eventLogKey
      );

      if (!stillHasEventLogRecords) {
        setSavedEventLogs((currentLogs) =>
          currentLogs.filter((log) => log.key !== eventLogKey)
        );
      }
    });
  }

  function deleteSavedGame(
    session: ReturnType<typeof buildSessionGroups>[number],
    gameToDelete: SavedGameRecord
  ) {
    const shouldDelete = window.confirm(
      `Delete Game ${gameToDelete.gameNumber} from this saved set?`
    );

    if (!shouldDelete) {
      return;
    }

    const remainingGames = savedGames.filter(
      (game) => game.id !== gameToDelete.id
    );
    const remainingSessionGames = remainingGames.filter(
      (game) => game.sessionId === session.sessionKey
    );

    setSavedGames(remainingGames);
    setSetMetadataDrafts((currentDrafts) => {
      const currentDraft = currentDrafts[session.sessionKey];

      if (!currentDraft) {
        return currentDrafts;
      }

      const updatedDrafts = { ...currentDrafts };
      const updatedGameLaneLabels = { ...currentDraft.gameLaneLabels };

      delete updatedGameLaneLabels[gameToDelete.id];

      if (remainingSessionGames.length === 0) {
        delete updatedDrafts[session.sessionKey];
      } else {
        updatedDrafts[session.sessionKey] = {
          ...currentDraft,
          gameLaneLabels: updatedGameLaneLabels,
        };
      }

      return updatedDrafts;
    });
    setGameMetadataDrafts((currentDrafts) => {
      const updatedDrafts = { ...currentDrafts };

      delete updatedDrafts[gameToDelete.id];

      return updatedDrafts;
    });

    if (editingGameMetadataId === gameToDelete.id) {
      setEditingGameMetadataId(null);
    }

    if (frameEditorGameId === gameToDelete.id) {
      closeFrameEditor();
    }

    if (selectedGameNumber === String(gameToDelete.gameNumber)) {
      setSelectedGameNumber("All");
    }

    if (remainingSessionGames.length === 0) {
      setSelectedSetKey("All");
      setEditingSetMetadataKey(null);
    }

    if (gameToDelete.eventLogKey) {
      const stillHasEventLogRecords = remainingGames.some(
        (game) => game.eventLogKey === gameToDelete.eventLogKey
      );

      if (!stillHasEventLogRecords) {
        setSavedEventLogs((currentLogs) =>
          currentLogs.filter((log) => log.key !== gameToDelete.eventLogKey)
        );
      }
    }
  }

  function updateSavedGameNotes(gameId: string, gameNotes: string) {
    setSavedGames((currentGames) =>
      currentGames.map((game) =>
        game.id === gameId ? { ...game, gameNotes } : game
      )
    );
  }

  function handleBowlerChange(value: string) {
    setSelectedBowler(value);
    setSelectedBakerBowler("All");
    setSelectedBall("All");
  }

  function handleBakerBowlerChange(value: string) {
    setSelectedBakerBowler(value);
    setSelectedBall("All");
  }

  function handleBallChange(value: string) {
    setSelectedBall(value);
  }

  function handleCompetitionChange(value: string) {
    setSelectedCompetition(value);
    setSelectedEventName("All");
    setSelectedEventStage("All");
    setSelectedSetKey("All");
    setSelectedGameNumber("All");
    setSelectedLane("All");
  }

  function handleEventNameChange(value: string) {
    setSelectedEventName(value);
    setSelectedEventStage("All");
    setSelectedSetKey("All");
    setSelectedGameNumber("All");
  }

  function handleEventStageChange(value: string) {
    setSelectedEventStage(value);
    setSelectedSetKey("All");
    setSelectedGameNumber("All");
  }

  function handleSetChange(value: string) {
    setSelectedSetKey(value);
    setSelectedGameNumber("All");
  }

  function handleCenterChange(value: string) {
    setSelectedCenter(value);
    setSelectedLane("All");
    setSelectedSetKey("All");
    setSelectedGameNumber("All");
  }

  function handlePatternChange(value: string) {
    setSelectedPattern(value);
    setSelectedSetKey("All");
    setSelectedGameNumber("All");
  }

  function handleLaneChange(value: string) {
    setSelectedLane(value);
    setSelectedSetKey("All");
    setSelectedGameNumber("All");
  }

  function handleGameChange(value: string) {
    setSelectedGameNumber(value);
  }

  return (
    <>
      <h2>Stats</h2>
      <p>
        Review saved sets, narrow stats with filters, export CSVs, and remove
        logs that need to be entered again.
      </p>

      {savedGames.length === 0 ? (
        <section className="empty-state-card">
          <h3>No Saved Sets Yet</h3>
          <p>
            Save a game from Log Games to start building stats, saved sets, and
            exportable data.
          </p>
        </section>
      ) : (
        <>
          <details className="stats-filter-card stats-collapsible-card">
            <summary className="stats-section-summary">
              <div>
                <strong>Filters</strong>
                <p>
                  Narrow the data by bowler, competition, set, game, center,
                  lane, pattern, ball, and saved log details.
                </p>

              </div>
              <span className="summary-hint">Open Section</span>
            </summary>

            <div className="stats-collapsible-content">
              <div className="form-grid">
              <label>
                Bowler / Baker Team
                <select
                  value={selectedBowler}
                  onChange={(event) => handleBowlerChange(event.target.value)}
                >
                  <option>All</option>

                  {individualBowlerOptions.length > 0 && (
                    <optgroup label="Individual Bowlers">
                      {individualBowlerOptions.map((bowlerName) => (
                        <option key={bowlerName}>{bowlerName}</option>
                      ))}
                    </optgroup>
                  )}

                  {bakerTeamOptions.length > 0 && (
                    <optgroup label="Baker Teams">
                      {bakerTeamOptions.map((teamName) => (
                        <option key={teamName}>{teamName}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </label>

              {isBakerTeamSelection && (
                <label>
                  Baker Bowler
                  <select
                    value={selectedBakerBowler}
                    onChange={(event) =>
                      handleBakerBowlerChange(event.target.value)
                    }
                  >
                    <option>All</option>
                    {bakerBowlerOptions.map((bowlerName) => (
                      <option key={bowlerName}>{bowlerName}</option>
                    ))}
                  </select>
                </label>
              )}

              {selectedBowler !== "All" && (
                <label>
                  Ball
                  <select
                    value={selectedBall}
                    onChange={(event) => handleBallChange(event.target.value)}
                  >
                    <option>All</option>
                    {ballOptions.map((ballName) => (
                      <option key={ballName}>{ballName}</option>
                    ))}
                  </select>
                </label>
              )}

              <label>
                Competition
                <select
                  value={selectedCompetition}
                  onChange={(event) =>
                    handleCompetitionChange(event.target.value)
                  }
                >
                  <option>All</option>
                  {competitionOptions.map((competition) => (
                    <option key={competition}>{competition}</option>
                  ))}
                </select>
              </label>

              {usesEventFilter && (
                <label>
                  {selectedCompetition}
                  <select
                    value={selectedEventName}
                    onChange={(event) =>
                      handleEventNameChange(event.target.value)
                    }
                  >
                    <option>All</option>
                    {eventOptions.map((eventName) => (
                      <option key={eventName}>{eventName}</option>
                    ))}
                  </select>
                </label>
              )}

              {usesEventFilter && selectedEventName !== "All" && (
                <label>
                  {selectedCompetition === "League" ? "Week" : "Day"}
                  <select
                    value={selectedEventStage}
                    onChange={(event) =>
                      handleEventStageChange(event.target.value)
                    }
                  >
                    <option>All</option>
                    {eventStageOptions.map((eventStage) => (
                      <option key={eventStage}>{eventStage}</option>
                    ))}
                  </select>
                </label>
              )}

              {usesSetFilter && (
                <label>
                  Set
                  <select
                    value={selectedSetKey}
                    onChange={(event) => handleSetChange(event.target.value)}
                  >
                    <option>All</option>
                    {setOptions.map((setOption) => (
                      <option key={setOption.key} value={setOption.key}>
                        {setOption.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {selectedSetKey !== "All" && (
                <label>
                  Game
                  <select
                    value={selectedGameNumber}
                    onChange={(event) => handleGameChange(event.target.value)}
                  >
                    <option>All</option>
                    {gameOptions.map((gameNumber) => (
                      <option key={gameNumber} value={String(gameNumber)}>
                        Game {gameNumber}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <label>
                Bowling Center
                <select
                  value={selectedCenter}
                  onChange={(event) => handleCenterChange(event.target.value)}
                >
                  <option>All</option>
                  {centerOptions.map((center) => (
                    <option key={center}>{center}</option>
                  ))}
                </select>
              </label>

              {selectedCenter !== "All" && (
                <label>
                  Lane / Pair
                  <select
                    value={selectedLane}
                    onChange={(event) => handleLaneChange(event.target.value)}
                  >
                    <option>All</option>
                    {laneOptions.map((lane) => (
                      <option key={lane}>{lane}</option>
                    ))}
                  </select>
                </label>
              )}

              <label>
                Pattern
                <select
                  value={selectedPattern}
                  onChange={(event) => handlePatternChange(event.target.value)}
                >
                  <option>All</option>
                  {patternOptions.map((pattern) => (
                    <option key={pattern}>{pattern}</option>
                  ))}
                </select>
              </label>

            </div>

              <div className="stats-action-row">
                <button className="secondary-button" onClick={clearFilters}>
                  Clear Filters
                </button>

                <button
                  className="primary-button"
                  disabled={statsFilteredGames.length === 0}
                  onClick={exportFilteredCsv}
                >
                  Export Filtered CSV
                </button>
              </div>
            </div>
          </details>

          <details className="stats-collapsible-card">
            <summary className="stats-section-summary">
              <div>
                <strong>Overview</strong>
                <p>
                  Quick summary of sets using current filters.
                  {!isBakerTeamSelection && hiddenBakerGameCount > 0
                    ? " Baker games are hidden unless a Baker Team is selected."
                    : ""}
                </p>
              </div>
              <span className="summary-hint">Open Section</span>
            </summary>

            <div className="stats-collapsible-content stats-summary-grid">
            <div className="stat-card">
              <strong>{sessionGroups.length}</strong>
              <span>Saved Sets</span>
            </div>

            <div className="stat-card">
              <strong>{statsFilteredGames.length}</strong>
              <span>Total Games</span>
            </div>

            <div className="stat-card">
              <strong>{overallAverage.toFixed(1)}</strong>
              <span>Average</span>
            </div>

            <div className="stat-card">
              <strong>{strikeCount}</strong>
              <span>Strikes</span>
            </div>

            <div className="stat-card">
              <strong>{spareCount}</strong>
              <span>Spares</span>
            </div>

            <div className="stat-card">
              <strong>{openCount}</strong>
              <span>Opens</span>
            </div>

            <div className="stat-card">
              <strong>{splitCount}</strong>
              <span>Splits</span>
            </div>

            <div className="stat-card">
              <strong>{cleanGameCount}</strong>
              <span>Clean Games</span>
            </div>

            <div className="stat-card">
              <strong>{overviewHighGame || "—"}</strong>
              <span>High Game</span>
            </div>

            <div className="stat-card">
              <strong>{overviewHighThreeGameSeries || "—"}</strong>
              <span>High Series (3-game)</span>
            </div>

            {!hasFocusedStatsFilter && (
              <p className="helper-text overview-default-note">
                Select a filter to reveal the applicable breakdown sections for
                the current view.
              </p>
            )}
            </div>
          </details>

          {hasFocusedStatsFilter && (
            <>
          {!isBakerTeamSelection && (
          <details className="stats-table-card stats-collapsible-card">
            <summary className="stats-section-summary">
              <div>
                <strong>Bowler Breakdown</strong>
                <p>Individual bowler stats.</p>
              </div>
              <span className="summary-hint">Open Section</span>
            </summary>

            <div className="stats-collapsible-content">
              {bowlerRows.length === 0 ? (
              <p className="helper-text">No rows match the current filters.</p>
            ) : (
              <div className="table-scroll">
                <table className="stats-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Games</th>
                      <th>Average</th>
                      <th>High Game</th>
                      <th>High Series</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bowlerRows.map((row) => (
                      <tr key={row.bowlerName}>
                        <td>{row.bowlerName}</td>
                        <td>{row.games}</td>
                        <td>{row.average ? row.average.toFixed(1) : "—"}</td>
                        <td>{row.highGame || "—"}</td>
                        <td>{row.highSeries || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              )}
              {detailedStats && (
                <section className="deep-stats-card inner-stats-card">
                  <h3>
                    Detailed Bowler Analysis — {selectedBowler}
                    {selectedBall !== "All" ? ` with ${selectedBall}` : ""}
                  </h3>
                  <p className="helper-text">
                    Deeper scoring, pocket, spare, clean-frame, split, and
                    first-ball stats.
                  </p>
                  <p className="helper-text">
                    Pocket stats use handedness: right-handed bowlers count the
                    pocket when pins 1 and 3 go down on the first ball, while
                    left-handed bowlers count the pocket when pins 1 and 2 go
                    down. Carry percentage is strikes divided by pocket hits.
                    First ball average is average first-ball pinfall.
                  </p>

                  <div className="deep-stats-grid">
                    <div className="stat-card">
                      <strong>{detailedStats.numGames}</strong>
                      <span>Total Games</span>
                    </div>

                    <div className="stat-card">
                      <strong>{detailedStats.average.toFixed(1)}</strong>
                      <span>Average</span>
                    </div>

                    <div className="stat-card">
                      <strong>
                        {detailedStats.highThreeGameSeries > 0
                          ? detailedStats.highThreeGameSeries
                          : "—"}
                      </strong>
                      <span>High 3-Game Series</span>
                    </div>

                    <div className="stat-card">
                      <strong>
                        {detailedStats.highFourGameSeries > 0
                          ? detailedStats.highFourGameSeries
                          : "—"}
                      </strong>
                      <span>High 4-Game Series</span>
                    </div>

                    <div className="stat-card">
                      <strong>{detailedStats.pocketPercentage.toFixed(1)}%</strong>
                      <span>Pocket Percentage</span>
                    </div>

                    <div className="stat-card">
                      <strong>{detailedStats.carryPercentage.toFixed(1)}%</strong>
                      <span>Carry Percentage</span>
                    </div>

                    <div className="stat-card">
                      <strong>{detailedStats.doublePercentage.toFixed(1)}%</strong>
                      <span>Double Percentage</span>
                    </div>

                    <div className="stat-card">
                      <strong>
                        {detailedStats.makeableSpareConversion.toFixed(1)}%
                      </strong>
                      <span>Makeable Spare Conversion</span>
                    </div>

                    <div className="stat-card">
                      <strong>{detailedStats.fillFramesPercentage.toFixed(1)}%</strong>
                      <span>Fill Frames Percentage</span>
                    </div>

                    <div className="stat-card">
                      <strong>{detailedStats.cleanPercentage.toFixed(1)}%</strong>
                      <span>Clean Percentage</span>
                    </div>

                    <div className="stat-card">
                      <strong>{detailedStats.splitPercentage.toFixed(1)}%</strong>
                      <span>Split Percentage</span>
                    </div>

                    <div className="stat-card">
                      <strong>{detailedStats.cleanGames}</strong>
                      <span>Clean Games</span>
                    </div>

                    <div className="stat-card">
                      <strong>{detailedStats.firstBallAverage.toFixed(2)}</strong>
                      <span>First Ball Average</span>
                    </div>
                  </div>

                  <section className="frame-score-card">
                    <h4>Average Frame Score</h4>
                    <p className="helper-text">
                      Average scoring value by frame.
                    </p>

                    <div className="frame-score-chart">
                      {detailedStats.frameScoreRows.map((row) => (
                        <div className="frame-score-bar-row" key={row.frameNumber}>
                          <span className="frame-score-label">
                            Frame {row.frameNumber}
                          </span>
                          <div className="frame-score-track">
                            <div
                              className="frame-score-bar"
                              style={{
                                width: `${Math.min(100, (row.average / 30) * 100)}%`,
                              }}
                            />
                          </div>
                          <strong>{row.average.toFixed(1)}</strong>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="average-game-card">
                    <h4>Average by Game</h4>
                    <p className="helper-text">
                      Average score by game number across matching sets.
                    </p>

                    <div className="table-scroll">
                      <table className="stats-table">
                        <thead>
                          <tr>
                            <th>Game</th>
                            <th>Games Tracked</th>
                            <th>Average</th>
                            <th>High</th>
                            <th>Low</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailedStats.averageByGameRows.map((row) => (
                            <tr key={row.gameNumber}>
                              <td>Game {row.gameNumber}</td>
                              <td>{row.count}</td>
                              <td>{row.average.toFixed(1)}</td>
                              <td>{row.high}</td>
                              <td>{row.low}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  <section className="score-distribution-card">
                    <h4>Score Distribution</h4>
                    <p className="helper-text">
                      Score ranges by game number, plus 3-game series totals.
                    </p>

                    <div className="score-distribution-grid">
                      <section>
                        <h5>Game Distribution</h5>

                        <div className="table-scroll">
                          <table className="stats-table distribution-table">
                            <thead>
                              <tr>
                                <th>Games</th>
                                {detailedStats.scoreDistribution.gameNumbers.map(
                                  (gameNumber) => (
                                    <th key={gameNumber}>Game {gameNumber}</th>
                                  )
                                )}
                                <th>Total</th>
                                <th>%</th>
                              </tr>
                            </thead>
                            <tbody>
                              {detailedStats.scoreDistribution.gameRows.map(
                                (row) => (
                                  <tr key={row.label}>
                                    <td>{row.label}</td>
                                    {detailedStats.scoreDistribution.gameNumbers.map(
                                      (gameNumber) => (
                                        <td key={gameNumber}>
                                          {row.gameCounts[gameNumber] ?? 0}
                                        </td>
                                      )
                                    )}
                                    <td>{row.total}</td>
                                    <td>{row.percentage.toFixed(1)}%</td>
                                  </tr>
                                )
                              )}
                            </tbody>
                          </table>
                        </div>
                      </section>

                      <section>
                        <h5>Series Distribution</h5>

                        <div className="table-scroll">
                          <table className="stats-table distribution-table">
                            <thead>
                              <tr>
                                <th>Series</th>
                                <th>Total</th>
                                <th>%</th>
                              </tr>
                            </thead>
                            <tbody>
                              {detailedStats.scoreDistribution.seriesRows.map(
                                (row) => (
                                  <tr key={row.label}>
                                    <td>{row.label}</td>
                                    <td>{row.total}</td>
                                    <td>{row.percentage.toFixed(1)}%</td>
                                  </tr>
                                )
                              )}
                            </tbody>
                          </table>
                        </div>
                      </section>
                    </div>
                  </section>

                  <section className="transition-card">
                    <h4>Transitional Phase Breakdown</h4>
                    <p className="helper-text">
                      Phase is estimated using first-shot frame count per lane,
                      adjusted by the session's Bowlers Per Pair value:
                      Fresh ≤55, Early Transition 56–110, Early Middle 111–165,
                      Late Middle 166–220, Late Transition 221–275, Burn ≥276.
                      Reference:{" "}
                      <a
                        href="https://www.bowlingthismonth.com/bowling-tips/how-to-arrive-at-more-meaningful-analysis-data/"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Bowling This Month
                      </a>
                      .
                    </p>

                    <div className="table-scroll">
                      <table className="stats-table">
                        <thead>
                          <tr>
                            <th>Phase</th>
                            <th>Frames</th>
                            <th>Strikes</th>
                            <th>Spares</th>
                            <th>Opens</th>
                            <th>Splits</th>
                            <th>Strike %</th>
                            <th>Clean %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailedStats.transitionRows.map((row) => (
                            <tr key={row.phase}>
                              <td>{row.phase}</td>
                              <td>{row.frames}</td>
                              <td>{row.strikes}</td>
                              <td>{row.spares}</td>
                              <td>{row.opens}</td>
                              <td>{row.splits}</td>
                              <td>{row.strikePercentage.toFixed(1)}%</td>
                              <td>{row.cleanPercentage.toFixed(1)}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </section>
              )}

            </div>
          </details>
          )}

          {usesEventFilter &&
            teamSetRows.length > 0 &&
            (selectedBowler === "All" ||
              (isBakerTeamSelection && selectedBakerBowler === "All")) && (
            <details className="team-set-card stats-collapsible-card">
              <summary className="stats-section-summary">
                <div>
                  <strong>Team / Set Breakdown</strong>
                  <p>
                    Team totals and averages for the current set filters.
                  </p>
                </div>
                <span className="summary-hint">Open Section</span>
              </summary>

              <div className="stats-collapsible-content">
                <div className="table-scroll">
                  <table className="stats-table">
                    <thead>
                      <tr>
                        <th>Set</th>
                        <th>Games</th>
                        <th>Tracked Bowlers</th>
                        <th>Team Set Total</th>
                        <th>Team Game Avg</th>
                        <th>Tracked Bowler Avg</th>
                        <th>High Team Game</th>
                        <th>Frames</th>
                        <th>Strikes</th>
                        <th>Spares</th>
                        <th>Opens</th>
                        <th>Clean %</th>
                        <th>Split %</th>
                        <th>Clean Team Games</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamSetRows.map((row) => (
                        <tr key={row.sessionKey}>
                          <td>{row.title}</td>
                          <td>{row.games}</td>
                          <td>{row.bowlers}</td>
                          <td>{row.teamSetTotal}</td>
                          <td>{row.teamGameAverage.toFixed(1)}</td>
                          <td>{row.trackedBowlerAverage.toFixed(1)}</td>
                          <td>{row.highTeamGame}</td>
                          <td>{row.frames}</td>
                          <td>{row.strikes}</td>
                          <td>{row.spares}</td>
                          <td>{row.opens}</td>
                          <td>{row.cleanRate.toFixed(1)}%</td>
                          <td>{row.splitRate.toFixed(1)}%</td>
                          <td>{row.cleanTeamGames}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </details>
          )}

          <details className="spare-leave-card stats-collapsible-card">
            <summary className="stats-section-summary">
              <div>
                <strong>Spare Leave Breakdown</strong>
                <p>
                  Most common leaves, attempts, conversions, misses, and pickup
                  percentages.
                </p>
              </div>
              <span className="summary-hint">Open Section</span>
            </summary>

            <div className="stats-collapsible-content">
              <p className="helper-text">
                Leaves are grouped by first-ball result and sorted by how often
                each leave occurs.
              </p>

              <div className="stats-summary-grid spare-summary-grid">
                <div className="stat-card">
                  <strong>
                    {spareLeaveSummary.makeable.percentage.toFixed(1)}%
                  </strong>
                  <span>
                    Makeable Pickup ({spareLeaveSummary.makeable.conversions}/
                    {spareLeaveSummary.makeable.attempts})
                  </span>
                </div>

                <div className="stat-card">
                  <strong>
                    {spareLeaveSummary.singlePin.percentage.toFixed(1)}%
                  </strong>
                  <span>
                    Single Pin Pickup ({spareLeaveSummary.singlePin.conversions}/
                    {spareLeaveSummary.singlePin.attempts})
                  </span>
                </div>

                <div className="stat-card">
                  <strong>
                    {spareLeaveSummary.multiPin.percentage.toFixed(1)}%
                  </strong>
                  <span>
                    Multi Pin Pickup ({spareLeaveSummary.multiPin.conversions}/
                    {spareLeaveSummary.multiPin.attempts})
                  </span>
                </div>

                <div className="stat-card">
                  <strong>
                    {spareLeaveSummary.split.percentage.toFixed(1)}%
                  </strong>
                  <span>
                    Split Pickup ({spareLeaveSummary.split.conversions}/
                    {spareLeaveSummary.split.attempts})
                  </span>
                </div>
              </div>

              {spareLeaveRows.length === 0 ? (
              <p className="helper-text">
                No spare attempts match the current filters.
              </p>
            ) : (
              <div className="table-scroll">
                <table className="stats-table">
                  <thead>
                    <tr>
                      <th>Leave</th>
                      <th>Pins</th>
                      <th>Attempts</th>
                      <th>Conversions</th>
                      <th>Misses</th>
                      <th>Pickup %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {spareLeaveRows.map((row) => (
                      <tr key={row.leave}>
                        <td>{row.leave}</td>
                        <td>
                          <StaticPinLeaveDeck leave={row.leave} />
                        </td>
                        <td>{row.attempts}</td>
                        <td>{row.conversions}</td>
                        <td>{row.misses}</td>
                        <td>{row.conversionPercentage.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              )}
            </div>
          </details>

          {!isBakerTeamSelection && (
          <details className="board-analysis-card stats-collapsible-card">
            <summary className="stats-section-summary">
              <div>
                <strong>Targeting Analysis</strong>
                <p>
                  Foot board, target arrow, actual arrow, breakpoint, miss
                  averages, and progression over filtered sets.
                </p>
              </div>
              <span className="summary-hint">Open Section</span>
            </summary>

            <div className="stats-collapsible-content">
              <p className="helper-text">
                This uses the foot board, target arrow, actual arrow, target
                breakpoint, and actual breakpoint saved on each shot. Miss values
                are calculated as actual minus target, so positive means farther
                right on the board scale and negative means farther left.
              </p>

              {boardStats.trackedShots === 0 ? (
              <p className="helper-text">
                No board/targeting data matches the current filters yet.
              </p>
            ) : (
              <>
                <div className="stats-summary-grid">
                  <div className="stat-card">
                    <strong>{boardStats.trackedShots}</strong>
                    <span>Tracked Shots</span>
                  </div>

                  <div className="stat-card">
                    <strong>{formatSignedNumber(boardStats.averageArrowMiss)}</strong>
                    <span>Avg Arrow Miss</span>
                  </div>

                  <div className="stat-card">
                    <strong>{formatMaybeNumber(boardStats.averageAbsoluteArrowMiss)}</strong>
                    <span>Avg Abs Arrow Miss</span>
                  </div>

                  <div className="stat-card">
                    <strong>{formatPercentValue(boardStats.arrowHitRate)}</strong>
                    <span>Arrow ±1 Board</span>
                  </div>

                  <div className="stat-card">
                    <strong>{formatSignedNumber(boardStats.averageBreakpointMiss)}</strong>
                    <span>Avg Breakpoint Miss</span>
                  </div>

                  <div className="stat-card">
                    <strong>{formatMaybeNumber(boardStats.averageAbsoluteBreakpointMiss)}</strong>
                    <span>Avg Abs BP Miss</span>
                  </div>

                  <div className="stat-card">
                    <strong>{formatPercentValue(boardStats.breakpointHitRate)}</strong>
                    <span>Breakpoint ±1 Board</span>
                  </div>
                </div>

                <section className="board-table-section">
                  <h4>Board Stats by Ball</h4>

                  <div className="table-scroll">
                    <table className="stats-table">
                      <thead>
                        <tr>
                          <th>Ball</th>
                          <th>Shots</th>
                          <th>Avg Foot</th>
                          <th>Avg Target Arrow</th>
                          <th>Avg Actual Arrow</th>
                          <th>Avg Arrow Miss</th>
                          <th>Avg Abs Arrow Miss</th>
                          <th>Arrow ±1</th>
                          <th>Avg Target BP</th>
                          <th>Avg Actual BP</th>
                          <th>Avg BP Miss</th>
                          <th>Avg Abs BP Miss</th>
                          <th>BP ±1</th>
                        </tr>
                      </thead>
                      <tbody>
                        {boardStats.byBallRows.map((row) => (
                          <tr key={row.ball}>
                            <td>{row.ball}</td>
                            <td>{row.shots}</td>
                            <td>{formatMaybeNumber(row.averageFootBoard)}</td>
                            <td>{formatMaybeNumber(row.averageTargetArrow)}</td>
                            <td>{formatMaybeNumber(row.averageActualArrow)}</td>
                            <td>{formatSignedNumber(row.averageArrowMiss)}</td>
                            <td>
                              {formatMaybeNumber(row.averageAbsoluteArrowMiss)}
                            </td>
                            <td>{formatPercentValue(row.arrowHitRate)}</td>
                            <td>
                              {formatMaybeNumber(row.averageTargetBreakpoint)}
                            </td>
                            <td>
                              {formatMaybeNumber(row.averageActualBreakpoint)}
                            </td>
                            <td>
                              {formatSignedNumber(row.averageBreakpointMiss)}
                            </td>
                            <td>
                              {formatMaybeNumber(row.averageAbsoluteBreakpointMiss)}
                            </td>
                            <td>{formatPercentValue(row.breakpointHitRate)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="board-table-section">
                  <h4>Progression Over Filtered Sets</h4>
                  <p className="helper-text">
                    This shows how feet, arrows, and breakpoints progress by
                    game/set under the current filters.
                  </p>

                  {boardProgressionRows.length === 0 ? (
                    <p className="helper-text">
                      No progression rows match the current filters.
                    </p>
                  ) : (
                    <div className="table-scroll">
                      <table className="stats-table">
                        <thead>
                          <tr>
                            <th>Set</th>
                            <th>Game</th>
                            <th>Lane</th>
                            <th>Shots</th>
                            <th>Avg Foot</th>
                            <th>Avg Target Arrow</th>
                            <th>Avg Actual Arrow</th>
                            <th>Avg Arrow Miss</th>
                            <th>Avg Target BP</th>
                            <th>Avg Actual BP</th>
                            <th>Avg BP Miss</th>
                          </tr>
                        </thead>
                        <tbody>
                          {boardProgressionRows.map((row) => (
                            <tr key={`${row.sessionTitle}-${row.gameNumber}-${row.laneLabel}`}>
                              <td>{row.sessionTitle}</td>
                              <td>{row.gameNumber}</td>
                              <td>{row.laneLabel}</td>
                              <td>{row.shots}</td>
                              <td>{formatMaybeNumber(row.averageFootBoard)}</td>
                              <td>
                                {formatMaybeNumber(row.averageTargetArrow)}
                              </td>
                              <td>
                                {formatMaybeNumber(row.averageActualArrow)}
                              </td>
                              <td>{formatSignedNumber(row.averageArrowMiss)}</td>
                              <td>
                                {formatMaybeNumber(row.averageTargetBreakpoint)}
                              </td>
                              <td>
                                {formatMaybeNumber(row.averageActualBreakpoint)}
                              </td>
                              <td>
                                {formatSignedNumber(row.averageBreakpointMiss)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>

                <section className="board-table-section">
                  <h4>Recent Board Data</h4>

                  <div className="table-scroll">
                    <table className="stats-table">
                      <thead>
                        <tr>
                          <th>Bowler</th>
                          <th>Frame</th>
                          <th>Ball</th>
                          <th>Foot</th>
                          <th>Target Arrow</th>
                          <th>Actual Arrow</th>
                          <th>Arrow Miss</th>
                          <th>Target BP</th>
                          <th>Actual BP</th>
                          <th>BP Miss</th>
                        </tr>
                      </thead>
                      <tbody>
                        {boardStats.recentRows.map((row, index) => (
                          <tr key={`${row.bowlerName}-${row.frameNumber}-${index}`}>
                            <td>{row.bowlerName}</td>
                            <td>{row.frameNumber}</td>
                            <td>{row.ballUsed || "No ball"}</td>
                            <td>{formatMaybeNumber(row.footBoard)}</td>
                            <td>{formatMaybeNumber(row.targetArrow)}</td>
                            <td>{formatMaybeNumber(row.actualArrow)}</td>
                            <td>{formatSignedNumber(row.arrowMiss)}</td>
                            <td>{formatMaybeNumber(row.targetBreakpoint)}</td>
                            <td>{formatMaybeNumber(row.actualBreakpoint)}</td>
                            <td>{formatSignedNumber(row.breakpointMiss)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
              )}
            </div>
          </details>
          )}

          {isBakerTeamSelection && bakerTeamGames.length > 0 && (
            <BakerStatsSection
              games={bakerTeamGames}
              selectedBakerBowler={selectedBakerBowler}
              selectedBall={selectedBall}
            />
          )}

            </>
          )}

          <details className="saved-sets-list stats-collapsible-card">
            <summary className="stats-section-summary">
              <div>
                <strong>Saved Sets</strong>
                <p>Expandable saved sets matching the active filters.</p>
              </div>
              <span className="summary-hint">Open Section</span>
            </summary>

            <div className="stats-collapsible-content">
              {sessionGroups.length === 0 ? (
              <p className="helper-text">No saved sets match the current filters.</p>
            ) : (
              sessionGroups.map((session) => (
                <details className="saved-set-card" key={session.sessionKey}>
                  <summary className="saved-set-summary">
                    <div>
                      <strong>{session.title}</strong>
                      <p>
                        {session.games.length} game
                        {session.games.length === 1 ? "" : "s"} •{" "}
                        {session.centerName} • {session.patternName}
                        {session.games[0]?.setNotes ? " • Notes" : ""}
                      </p>
                    </div>

                    <span className="summary-hint">Open Details</span>
                  </summary>

                  <div className="saved-set-details">
                    <div className="saved-set-top-actions">
                      <button
                        className="secondary-button"
                        onClick={() =>
                          setEditingSetMetadataKey(
                            editingSetMetadataKey === session.sessionKey
                              ? null
                              : session.sessionKey
                          )
                        }
                      >
                        {editingSetMetadataKey === session.sessionKey
                          ? "Close Edit Set Data"
                          : "Edit Set Data"}
                      </button>
                      <button
                        className="danger-button"
                        onClick={() => deleteSavedSet(session.sessionKey)}
                      >
                        Delete Saved Set
                      </button>
                    </div>

                    {editingSetMetadataKey === session.sessionKey && (
                      <SavedSetMetadataEditor
                        session={session}
                        centers={centers}
                        patterns={patterns}
                        draft={getSetMetadataDraft(session)}
                        hasChanges={hasSetMetadataChanges(session)}
                        onChange={(field, value) =>
                          updateSetMetadataDraft(session, field, value)
                        }
                        onLaneChange={(gameId, laneLabel) =>
                          updateSetGameLaneDraft(session, gameId, laneLabel)
                        }
                        onSave={() => saveSetMetadata(session)}
                        onReset={() => resetSetMetadataDraft(session)}
                        onClose={() => setEditingSetMetadataKey(null)}
                      />
                    )}

                    <div className="saved-set-content-divider" />

                    {selectedBowler !== "All" && (
                      <SetSpecificStats
                        bowlerName={selectedBowler}
                        selectedBall={selectedBall}
                        session={session}
                        bowlerHandednessByName={bowlerHandednessByName}
                      />
                    )}

                    {session.games.some((game) => game.format === "Baker") && (
                      <BakerSetBreakdown session={session} />
                    )}

                    {session.games.map((game) => (
                      <article className="saved-game-detail-card" key={game.id}>
                        <h4>Game {game.gameNumber}</h4>
                        <p>
                          <strong>Lane:</strong> {game.laneLabel}
                        </p>
                        <p>
                          <strong>Scores:</strong>{" "}
                          {game.scores
                            .map((score) => `${score.label}: ${score.score}`)
                            .join(" • ")}
                        </p>

                        {game.format === "Baker" && (
                          <>
                            <ScoreGrid
                              title={`Baker Team Game ${game.gameNumber}`}
                              entries={game.entries}
                            />
                            <BakerFrameTable game={game} />
                          </>
                        )}

                        {selectedBowler !== "All" && game.format !== "Baker" && (
                          <ScoreGrid
                            title={`${selectedBowler} Game ${game.gameNumber}`}
                            entries={game.entries.filter(
                              (entry) =>
                                entry.bowlerName === selectedBowler &&
                                (selectedBall === "All" ||
                                  entry.ballUsed === selectedBall)
                            )}
                          />
                        )}

                        <p>
                          <strong>Saved:</strong>{" "}
                          {new Date(game.savedAt).toLocaleString()}
                        </p>

                        {game.gameNotes && (
                          <p>
                            <strong>Game Notes:</strong> {game.gameNotes}
                          </p>
                        )}

                        <div className="saved-game-actions-row">
                          <button
                            className="secondary-button"
                            onClick={() =>
                              setEditingGameMetadataId(
                                editingGameMetadataId === game.id
                                  ? null
                                  : game.id
                              )
                            }
                          >
                            {editingGameMetadataId === game.id
                              ? "Close Notes"
                              : game.gameNotes
                              ? "Edit Notes"
                              : "Add Notes"}
                          </button>
                          <button
                            className="secondary-button"
                            onClick={() => openFrameEditor(game)}
                          >
                            Edit Frames
                          </button>
                          <button
                            className="danger-button"
                            onClick={() => deleteSavedGame(session, game)}
                          >
                            Delete Game {game.gameNumber}
                          </button>
                        </div>

                        {editingGameMetadataId === game.id && (
                          <SavedGameNotesEditor
                            draft={getGameMetadataDraft(game)}
                            hasExistingNotes={Boolean(game.gameNotes)}
                            hasChanges={hasGameNotesChanges(game)}
                            onNotesChange={(gameNotes) =>
                              updateGameNotesDraft(game, gameNotes)
                            }
                            onSave={() => saveGameMetadata(game)}
                            onReset={() => resetGameMetadataDraft(game)}
                            onClose={() => setEditingGameMetadataId(null)}
                          />
                        )}
                      </article>
                    ))}

                  </div>
                </details>
              ))
            )}
            </div>
          </details>
        </>
      )}

      {frameEditorGame && (
        <SavedFrameEditModal
          game={frameEditorGame}
          bowlers={bowlers}
          entries={frameEditorEntries}
          currentIndex={frameEditorIndex}
          onIndexChange={setFrameEditorIndex}
          onEntryChange={updateFrameEditorEntry}
          onSave={() => saveFrameEdits(frameEditorGame)}
          onClose={closeFrameEditor}
        />
      )}
    </>
  );
}


// Targeting Analysis Helpers
// ==================

type BoardStatRow = {
  ball: string;
  shots: number;
  averageFootBoard: number | null;
  averageTargetArrow: number | null;
  averageActualArrow: number | null;
  averageArrowMiss: number | null;
  averageAbsoluteArrowMiss: number | null;
  arrowHitRate: number | null;
  averageTargetBreakpoint: number | null;
  averageActualBreakpoint: number | null;
  averageBreakpointMiss: number | null;
  averageAbsoluteBreakpointMiss: number | null;
  breakpointHitRate: number | null;
};

type BoardShotRow = {
  bowlerName: string;
  frameNumber: number;
  ballUsed: string;
  footBoard: number | null;
  targetArrow: number | null;
  actualArrow: number | null;
  arrowMiss: number | null;
  targetBreakpoint: number | null;
  actualBreakpoint: number | null;
  breakpointMiss: number | null;
};

function parseBoardValue(value: string) {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function averageValues(values: Array<number | null>) {
  const validValues = values.filter((value): value is number => value !== null);

  if (validValues.length === 0) {
    return null;
  }

  return validValues.reduce((sum, value) => sum + value, 0) / validValues.length;
}

function calculateMiss(actual: number | null, target: number | null) {
  if (actual === null || target === null) {
    return null;
  }

  return actual - target;
}

function formatMaybeNumber(value: number | null) {
  return value === null ? "—" : value.toFixed(1);
}

function formatSignedNumber(value: number | null) {
  if (value === null) {
    return "—";
  }

  if (value > 0) {
    return `+${value.toFixed(1)}`;
  }

  return value.toFixed(1);
}

function formatPercentValue(value: number | null) {
  return value === null ? "—" : `${value.toFixed(1)}%`;
}

function calculateBoardHitRate(values: Array<number | null>, tolerance = 1) {
  const validValues = values.filter((value): value is number => value !== null);

  if (validValues.length === 0) {
    return null;
  }

  const hits = validValues.filter((value) => Math.abs(value) <= tolerance).length;

  return (hits / validValues.length) * 100;
}

function createBoardShotRow(entry: FrameEntry): BoardShotRow {
  const footBoard = parseBoardValue(entry.footBoard);
  const targetArrow = parseBoardValue(entry.targetArrow);
  const actualArrow = parseBoardValue(entry.actualArrow);
  const targetBreakpoint = parseBoardValue(entry.targetBreakpoint);
  const actualBreakpoint = parseBoardValue(entry.actualBreakpoint);

  return {
    bowlerName: entry.bowlerName,
    frameNumber: entry.frameNumber,
    ballUsed: entry.ballUsed,
    footBoard,
    targetArrow,
    actualArrow,
    arrowMiss: calculateMiss(actualArrow, targetArrow),
    targetBreakpoint,
    actualBreakpoint,
    breakpointMiss: calculateMiss(actualBreakpoint, targetBreakpoint),
  };
}

function hasBoardData(row: BoardShotRow) {
  return (
    row.footBoard !== null ||
    row.targetArrow !== null ||
    row.actualArrow !== null ||
    row.targetBreakpoint !== null ||
    row.actualBreakpoint !== null
  );
}

function summarizeBoardRows(rows: BoardShotRow[]): Omit<BoardStatRow, "ball" | "shots"> {
  return {
    averageFootBoard: averageValues(rows.map((row) => row.footBoard)),
    averageTargetArrow: averageValues(rows.map((row) => row.targetArrow)),
    averageActualArrow: averageValues(rows.map((row) => row.actualArrow)),
    averageArrowMiss: averageValues(rows.map((row) => row.arrowMiss)),
    averageAbsoluteArrowMiss: averageValues(
      rows.map((row) =>
        row.arrowMiss === null ? null : Math.abs(row.arrowMiss)
      )
    ),
    arrowHitRate: calculateBoardHitRate(rows.map((row) => row.arrowMiss)),
    averageTargetBreakpoint: averageValues(
      rows.map((row) => row.targetBreakpoint)
    ),
    averageActualBreakpoint: averageValues(
      rows.map((row) => row.actualBreakpoint)
    ),
    averageBreakpointMiss: averageValues(
      rows.map((row) => row.breakpointMiss)
    ),
    averageAbsoluteBreakpointMiss: averageValues(
      rows.map((row) =>
        row.breakpointMiss === null ? null : Math.abs(row.breakpointMiss)
      )
    ),
    breakpointHitRate: calculateBoardHitRate(
      rows.map((row) => row.breakpointMiss)
    ),
  };
}

function calculateBoardStats(entries: FrameEntry[]) {
  const boardRows = entries.map(createBoardShotRow).filter(hasBoardData);
  const overall = summarizeBoardRows(boardRows);
  const rowsByBall = new Map<string, BoardShotRow[]>();

  boardRows.forEach((row) => {
    const ballName = row.ballUsed || "No ball";
    const currentRows = rowsByBall.get(ballName) ?? [];
    rowsByBall.set(ballName, [...currentRows, row]);
  });

  const byBallRows: BoardStatRow[] = Array.from(rowsByBall.entries())
    .map(([ball, rows]) => ({
      ball,
      shots: rows.length,
      ...summarizeBoardRows(rows),
    }))
    .sort((a, b) => b.shots - a.shots || a.ball.localeCompare(b.ball));

  return {
    trackedShots: boardRows.length,
    ...overall,
    byBallRows,
    recentRows: boardRows.slice(-12).reverse(),
  };
}

function calculateBoardProgressionRows(
  games: SavedGameRecord[],
  selectedBowler: string,
  selectedBall: string
) {
  return games
    .map((game) => {
      const boardRows = game.entries
        .filter((entry) => {
          const matchesBowler =
            selectedBowler === "All" || entry.bowlerName === selectedBowler;
          const matchesBall =
            selectedBall === "All" || entry.ballUsed === selectedBall;

          return matchesBowler && matchesBall;
        })
        .map(createBoardShotRow)
        .filter(hasBoardData);

      if (boardRows.length === 0) {
        return null;
      }

      const sessionTitle = [
        game.eventName || game.competitionType,
        game.eventStageLabel,
      ]
        .filter(Boolean)
        .join(" — ");

      return {
        sessionTitle,
        gameNumber: game.gameNumber,
        laneLabel: game.laneLabel,
        shots: boardRows.length,
        ...summarizeBoardRows(boardRows),
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);
}

// Stats Export
// ==================

function buildStatsExportFileName(filters: {
  selectedBowler: string;
  selectedBall: string;
  selectedCompetition: string;
  selectedEventName: string;
  selectedCenter: string;
  selectedLane: string;
  selectedPattern: string;
  selectedEventStage: string;
  selectedSetKey: string;
  selectedGameNumber: string;
}) {
  const activeFilterParts = [
    "pin-sighter-stats",
    filters.selectedBowler !== "All" ? filters.selectedBowler : "",
    filters.selectedBall !== "All" ? filters.selectedBall : "",
    filters.selectedCompetition !== "All" ? filters.selectedCompetition : "",
    filters.selectedEventName !== "All" ? filters.selectedEventName : "",
    filters.selectedCenter !== "All" ? filters.selectedCenter : "",
    filters.selectedLane !== "All" ? filters.selectedLane : "",
    filters.selectedPattern !== "All" ? filters.selectedPattern : "",
    filters.selectedEventStage !== "All" ? filters.selectedEventStage : "",
    filters.selectedSetKey !== "All" ? "selected-set" : "",
    filters.selectedGameNumber !== "All"
      ? `game-${filters.selectedGameNumber}`
      : "",
  ]
    .filter(Boolean)
    .map((part) =>
      part
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
    );

  return `${activeFilterParts.join("_") || "pin-sighter-stats"}.csv`;
}


function parseStoredLaneLabels(laneLabel: string) {
  return laneLabel
    .split(",")
    .map((label) => label.trim())
    .filter(Boolean);
}

function getSetLaneLabelsByGame(
  session: ReturnType<typeof buildSessionGroups>[number]
) {
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

function createSetMetadataDraft(
  session: ReturnType<typeof buildSessionGroups>[number]
): SetMetadataDraft {
  const firstGame = session.games[0];

  return {
    centerName: firstGame?.centerName ?? "",
    patternName: firstGame?.patternName ?? "",
    gameLaneLabels: getSetLaneLabelsByGame(session),
    setNotes: firstGame?.setNotes ?? "",
  };
}

function getUniqueMetadataOptions(currentValue: string, options: string[]) {
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

function buildMetadataLaneOptions(
  centerName: string,
  centers: Center[],
  session: ReturnType<typeof buildSessionGroups>[number],
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

function SavedSetMetadataEditor({
  session,
  centers,
  patterns,
  draft,
  hasChanges,
  onChange,
  onLaneChange,
  onSave,
  onReset,
  onClose,
}: {
  session: ReturnType<typeof buildSessionGroups>[number];
  centers: Center[];
  patterns: Pattern[];
  draft: SetMetadataDraft;
  hasChanges: boolean;
  onChange: (field: keyof SetMetadataDraft, value: string) => void;
  onLaneChange: (gameId: string, laneLabel: string) => void;
  onSave: () => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const firstGame = session.games[0];
  const savedDate = firstGame
    ? new Date(firstGame.savedAt).toLocaleString()
    : "Unknown";
  const scoreLabels = Array.from(
    new Set(
      session.games.flatMap((game) =>
        game.scores.map((score) => score.label)
      )
    )
  ).join(", ");
  const centerOptions = getUniqueMetadataOptions(
    draft.centerName,
    centers.map((center) => center.name)
  );
  const patternOptions = getUniqueMetadataOptions(
    draft.patternName,
    patterns.map((pattern) => pattern.name)
  );
  const laneOptions = buildMetadataLaneOptions(
    draft.centerName,
    centers,
    session,
    Object.values(draft.gameLaneLabels)
  );

  return (
    <section className="set-metadata-card">
      <div className="set-metadata-header">
        <div>
          <h4>Edit Set Data</h4>
          <p>
            Edit set-level labels and notes without changing the actual frame
            data.
          </p>
        </div>
      </div>

      <div className="set-metadata-grid">
        <p>
          <strong>Saved:</strong> {savedDate}
        </p>
        <p>
          <strong>Competition:</strong>{" "}
          {firstGame?.eventName || firstGame?.competitionType || "Open"}
        </p>
        <p>
          <strong>Week/Day:</strong> {firstGame?.eventStageLabel || "N/A"}
        </p>
        <p>
          <strong>Format:</strong> {firstGame?.format ?? "Unknown"}
        </p>
        <p>
          <strong>Games:</strong> {session.games.length}
        </p>
        <p>
          <strong>Score Labels:</strong> {scoreLabels || "N/A"}
        </p>
      </div>

      <div className="form-grid set-metadata-form">
        <label>
          Bowling Center
          <select
            value={draft.centerName}
            onChange={(event) => onChange("centerName", event.target.value)}
          >
            {centerOptions.map((centerName) => (
              <option key={centerName} value={centerName}>
                {centerName}
              </option>
            ))}
          </select>
        </label>

        <label>
          Pattern
          <select
            value={draft.patternName}
            onChange={(event) => onChange("patternName", event.target.value)}
          >
            {patternOptions.map((patternName) => (
              <option key={patternName} value={patternName}>
                {patternName}
              </option>
            ))}
          </select>
        </label>

        <div className="metadata-game-lane-card full-width-field">
          <strong>Lane / Pair by Game</strong>
          <p className="helper-text">
            Choose the lane or pair for each saved game. Options are based on
            the saved set's center and whether the set was logged as pairs or
            single lanes.
          </p>

          <div className="metadata-game-lane-list">
            {session.games.map((game) => (
              <label key={game.id}>
                Game {game.gameNumber}
                <select
                  value={draft.gameLaneLabels[game.id] ?? game.laneLabel}
                  onChange={(event) =>
                    onLaneChange(game.id, event.target.value)
                  }
                >
                  {laneOptions.map((laneLabel) => (
                    <option key={laneLabel} value={laneLabel}>
                      {laneLabel}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </div>

        <label className="full-width-field">
          Set Notes
          <textarea
            rows={3}
            value={draft.setNotes}
            placeholder="Add notes about the pair, transition, ball choices, moves, or anything else from this set."
            onChange={(event) => onChange("setNotes", event.target.value)}
          />
        </label>
      </div>

      <div className="saved-set-actions-row">
        <button className="primary-button" onClick={onSave}>
          Save Set Data
        </button>
        <button
          className="secondary-button"
          disabled={!hasChanges}
          onClick={onReset}
        >
          Reset Changes
        </button>
        <button className="secondary-button" onClick={onClose}>
          Cancel
        </button>
      </div>
    </section>
  );
}

function createGameMetadataDraft(game: SavedGameRecord): GameMetadataDraft {
  return {
    gameNotes: game.gameNotes ?? "",
  };
}

function SavedGameNotesEditor({
  draft,
  hasExistingNotes,
  hasChanges,
  onNotesChange,
  onSave,
  onReset,
  onClose,
}: {
  draft: GameMetadataDraft;
  hasExistingNotes: boolean;
  hasChanges: boolean;
  onNotesChange: (gameNotes: string) => void;
  onSave: () => void;
  onReset: () => void;
  onClose: () => void;
}) {
  return (
    <section className="game-notes-card">
      <h4>{hasExistingNotes ? "Edit Game Notes" : "Add Game Notes"}</h4>
      <p>
        Add notes for this specific game. Use Edit Frames for score, pinfall,
        ball, and board corrections.
      </p>

      <label className="full-width-field">
        Game Notes
        <textarea
          rows={3}
          value={draft.gameNotes}
          placeholder="Add notes for this specific game."
          onChange={(event) => onNotesChange(event.target.value)}
        />
      </label>

      <div className="saved-game-actions-row">
        <button className="primary-button" onClick={onSave}>
          Save Notes
        </button>
        <button
          className="secondary-button"
          disabled={!hasChanges}
          onClick={onReset}
        >
          Reset Changes
        </button>
        <button className="secondary-button" onClick={onClose}>
          Cancel
        </button>
      </div>
    </section>
  );
}

function cloneFrameEntryForEditing(entry: FrameEntry): FrameEntry {
  return {
    ...entry,
    firstShotKnockedPins: [...entry.firstShotKnockedPins],
    secondShotKnockedPins: [...entry.secondShotKnockedPins],
    thirdShotKnockedPins: [...entry.thirdShotKnockedPins],
  };
}

function normalizeFrameEntryForComparison(entry: FrameEntry) {
  return {
    ...entry,
    firstShotKnockedPins: [...entry.firstShotKnockedPins].sort((a, b) => a - b),
    secondShotKnockedPins: [...entry.secondShotKnockedPins].sort(
      (a, b) => a - b
    ),
    thirdShotKnockedPins: [...entry.thirdShotKnockedPins].sort((a, b) => a - b),
  };
}

function frameEntriesHaveChanges(
  editedEntries: FrameEntry[],
  originalEntries: FrameEntry[]
) {
  return (
    JSON.stringify(editedEntries.map(normalizeFrameEntryForComparison)) !==
    JSON.stringify(originalEntries.map(normalizeFrameEntryForComparison))
  );
}

function SavedFrameEditModal({
  game,
  bowlers,
  entries,
  currentIndex,
  onIndexChange,
  onEntryChange,
  onSave,
  onClose,
}: {
  game: SavedGameRecord;
  bowlers: Bowler[];
  entries: FrameEntry[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onEntryChange: (entryIndex: number, updatedFields: Partial<FrameEntry>) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  const currentEntry = entries[currentIndex];
  const previewScores = calculateScoresForGame(
    entries,
    game.bowlerNames,
    game.format
  );
  const hasFrameChanges = frameEntriesHaveChanges(entries, game.entries);

  function handleCloseFrameEditor() {
    if (
      hasFrameChanges &&
      !window.confirm(
        "Discard unsaved frame edits and close? The saved game will revert to the previous frame data."
      )
    ) {
      return;
    }

    onClose();
  }

  function handleSaveFrameEdits() {
    const shouldSave = window.confirm(
      "Save frame edits? This will recalculate the saved score and update stats for this game."
    );

    if (!shouldSave) {
      return;
    }

    onSave();
  }

  if (!currentEntry) {
    return null;
  }

  const currentBowler = bowlers.find(
    (bowler) => bowler.name === currentEntry.bowlerName
  );
  const currentBowlerBalls = currentBowler?.arsenal ?? [];
  const isTenthFrame = currentEntry.frameNumber === 10;
  const firstShotStandingPins = getPinsStanding(
    currentEntry.firstShotKnockedPins
  );
  const firstShotPinCount = currentEntry.firstShotKnockedPins.length;
  const isStrike = firstShotPinCount === 10;
  const secondShotAvailablePins =
    isTenthFrame && isStrike ? ALL_PINS : firstShotStandingPins;
  const secondShotPinCount = currentEntry.secondShotKnockedPins.length;
  const secondShotStandingPins =
    isTenthFrame && isStrike
      ? getPinsStanding(currentEntry.secondShotKnockedPins)
      : firstShotStandingPins.filter(
          (pin) => !currentEntry.secondShotKnockedPins.includes(pin)
        );
  const isSpare =
    !isStrike && firstShotPinCount + secondShotPinCount === 10;
  const shouldShowSecondShot = isTenthFrame || !isStrike;
  const shouldShowThirdShot = isTenthFrame && (isStrike || isSpare);
  const thirdShotAvailablePins =
    isTenthFrame && isStrike
      ? secondShotPinCount === 10
        ? ALL_PINS
        : secondShotStandingPins
      : isTenthFrame && isSpare
      ? ALL_PINS
      : [];
  const thirdShotPinCount = currentEntry.thirdShotKnockedPins.length;
  const pinsStandingAfterFrame =
    shouldShowThirdShot && thirdShotAvailablePins.length > 0
      ? thirdShotAvailablePins.filter(
          (pin) => !currentEntry.thirdShotKnockedPins.includes(pin)
        )
      : secondShotStandingPins;
  const totalFramePinCount =
    firstShotPinCount +
    (shouldShowSecondShot ? secondShotPinCount : 0) +
    (shouldShowThirdShot ? thirdShotPinCount : 0);
  const frameResult = getFrameResult(isStrike, pinsStandingAfterFrame, isSpare);

  function updateCurrentEntry(updatedFields: Partial<FrameEntry>) {
    onEntryChange(currentIndex, updatedFields);
  }

  function updateFirstShotPins(knockedPins: number[]) {
    const newStandingPins = getPinsStanding(knockedPins);
    const firstShotIsStrike = knockedPins.length === 10;

    if (currentEntry.frameNumber === 10) {
      if (firstShotIsStrike) {
        updateCurrentEntry({
          firstShotKnockedPins: knockedPins,
          secondShotKnockedPins: [...ALL_PINS],
          thirdShotKnockedPins: [...ALL_PINS],
        });
        return;
      }

      updateCurrentEntry({
        firstShotKnockedPins: knockedPins,
        secondShotKnockedPins: [...newStandingPins],
        thirdShotKnockedPins: [...ALL_PINS],
      });
      return;
    }

    updateCurrentEntry({
      firstShotKnockedPins: knockedPins,
      secondShotKnockedPins: [...newStandingPins],
      thirdShotKnockedPins: [],
    });
  }

  function updateSecondShotPins(knockedPins: number[]) {
    if (currentEntry.frameNumber !== 10) {
      updateCurrentEntry({ secondShotKnockedPins: knockedPins });
      return;
    }

    if (isStrike) {
      updateCurrentEntry({
        secondShotKnockedPins: knockedPins,
        thirdShotKnockedPins:
          knockedPins.length === 10 ? [...ALL_PINS] : getPinsStanding(knockedPins),
      });
      return;
    }

    const secondShotMakesSpare = firstShotPinCount + knockedPins.length === 10;

    updateCurrentEntry({
      secondShotKnockedPins: knockedPins,
      thirdShotKnockedPins: secondShotMakesSpare ? [...ALL_PINS] : [],
    });
  }

  return (
    <div className="frame-editor-overlay">
      <section className="frame-editor-modal">
        <div className="frame-editor-header">
          <div>
            <p className="eyebrow">Editing Saved Game</p>
            <h3>
              Game {game.gameNumber} • Frame {currentEntry.frameNumber}
            </h3>
            <p>
              Original saved frame data is loaded here. Move through each frame
              and save when the correction is complete.
            </p>
          </div>

          <button className="secondary-button" onClick={handleCloseFrameEditor}>
            Close
          </button>
        </div>

        <div className="frame-editor-progress">
          {entries.map((entry, index) => (
            <button
              key={`${entry.bowlerName}-${entry.frameNumber}-${index}`}
              className={`small-button ${
                index === currentIndex ? "active-frame-button" : ""
              }`}
              onClick={() => onIndexChange(index)}
            >
              {entry.frameNumber}
              {game.format === "Baker" ? ` • ${entry.bowlerName}` : ""}
            </button>
          ))}
        </div>

        <div className="form-grid compact-grid">
          <label>
            Bowler
            <input value={currentEntry.bowlerName} disabled />
          </label>

          <label>
            Ball Used
            <select
              value={currentEntry.ballUsed}
              onChange={(event) =>
                updateCurrentEntry({ ballUsed: event.target.value })
              }
            >
              <option value="">No ball</option>
              {getUniqueMetadataOptions(
                currentEntry.ballUsed,
                currentBowlerBalls.map((ball) => ball.name)
              ).map((ballName) => (
                <option key={ballName} value={ballName}>
                  {ballName}
                </option>
              ))}
            </select>
          </label>

          <BoardSelect
            label="Foot Board"
            value={currentEntry.footBoard}
            options={footBoardOptions}
            onChange={(value) => updateCurrentEntry({ footBoard: value })}
          />

          <BoardSelect
            label="Target Arrow"
            value={currentEntry.targetArrow}
            options={laneBoardOptions}
            onChange={(value) => updateCurrentEntry({ targetArrow: value })}
          />

          <BoardSelect
            label="Target Breakpoint"
            value={currentEntry.targetBreakpoint}
            options={laneBoardOptions}
            onChange={(value) =>
              updateCurrentEntry({ targetBreakpoint: value })
            }
          />

          <BoardSelect
            label="Actual Arrow"
            value={currentEntry.actualArrow}
            options={laneBoardOptions}
            onChange={(value) => updateCurrentEntry({ actualArrow: value })}
          />

          <BoardSelect
            label="Actual Breakpoint"
            value={currentEntry.actualBreakpoint}
            options={laneBoardOptions}
            onChange={(value) =>
              updateCurrentEntry({ actualBreakpoint: value })
            }
          />
        </div>

        <div className="pin-entry-layout frame-editor-pin-layout">
          <div className="shot-decks">
            <div>
              <h3>First Ball Pin Deck</h3>
              <p className="helper-text">
                Select pins knocked down on the first ball.
              </p>
              <PinDeck
                knockedPins={currentEntry.firstShotKnockedPins}
                onChange={updateFirstShotPins}
              />
            </div>

            {shouldShowSecondShot && (
              <div className="second-shot-card">
                <h3>Second Ball Pin Deck</h3>
                <p className="helper-text">
                  {isTenthFrame && isStrike
                    ? "Tenth-frame bonus shot. Select pins knocked down."
                    : "Select pins knocked down on the spare attempt."}
                </p>
                <PinDeck
                  knockedPins={currentEntry.secondShotKnockedPins}
                  availablePins={secondShotAvailablePins}
                  onChange={updateSecondShotPins}
                />
              </div>
            )}

            {shouldShowThirdShot && (
              <div className="second-shot-card">
                <h3>Third Ball Pin Deck</h3>
                <p className="helper-text">
                  Tenth-frame fill shot. Select pins knocked down.
                </p>
                <PinDeck
                  knockedPins={currentEntry.thirdShotKnockedPins}
                  availablePins={thirdShotAvailablePins}
                  onChange={(knockedPins) =>
                    updateCurrentEntry({ thirdShotKnockedPins: knockedPins })
                  }
                />
              </div>
            )}
          </div>

          <div className="shot-summary">
            <p>
              <strong>First Shot Count:</strong> {firstShotPinCount}
            </p>
            {shouldShowSecondShot && (
              <p>
                <strong>Second Shot Count:</strong> {secondShotPinCount}
              </p>
            )}
            {shouldShowThirdShot && (
              <p>
                <strong>Third Shot Count:</strong> {thirdShotPinCount}
              </p>
            )}
            <p>
              <strong>Frame Pin Count:</strong> {totalFramePinCount}
            </p>
            <p>
              <strong>Pins Standing After Frame:</strong>{" "}
              {pinsStandingAfterFrame.length === 0
                ? "None"
                : pinsStandingAfterFrame.join("-")}
            </p>
            <p>
              <strong>Result:</strong> {frameResult}
            </p>
          </div>
        </div>

        <section className="frame-editor-score-preview">
          <strong>Preview Scores</strong>
          <div className="score-list">
            {previewScores.map((score) => (
              <p key={score.label}>
                <strong>{score.label}:</strong> {score.score}
              </p>
            ))}
          </div>
        </section>

        <div className="frame-navigation">
          <button
            className="secondary-button"
            disabled={currentIndex === 0}
            onClick={() => onIndexChange(currentIndex - 1)}
          >
            Previous Frame
          </button>
          <button
            className="secondary-button"
            disabled={currentIndex === entries.length - 1}
            onClick={() => onIndexChange(currentIndex + 1)}
          >
            Next Frame
          </button>
          <button className="primary-button" onClick={handleSaveFrameEdits}>
            Save Frame Edits
          </button>
        </div>
      </section>
    </div>
  );
}

// Set Specific Stats
// ==================

function SetSpecificStats({
  bowlerName,
  selectedBall,
  session,
  bowlerHandednessByName,
}: {
  bowlerName: string;
  selectedBall: string;
  session: ReturnType<typeof buildSessionGroups>[number];
  bowlerHandednessByName: Map<string, Handedness>;
}) {
  const sessionStats = calculateDetailedBowlerStats(
    bowlerName,
    selectedBall,
    session.games,
    [session],
    bowlerHandednessByName
  );

  return (
    <section className="set-specific-stats-card">
      <h4>
        Set Stats — {bowlerName}
        {selectedBall !== "All" ? ` with ${selectedBall}` : ""}
      </h4>

      <div className="deep-stats-grid">
        <div className="stat-card">
          <strong>{sessionStats.numGames}</strong>
          <span>Games</span>
        </div>

        <div className="stat-card">
          <strong>{sessionStats.average.toFixed(1)}</strong>
          <span>Average</span>
        </div>

        <div className="stat-card">
          <strong>{sessionStats.pocketPercentage.toFixed(1)}%</strong>
          <span>Pocket %</span>
        </div>

        <div className="stat-card">
          <strong>{sessionStats.carryPercentage.toFixed(1)}%</strong>
          <span>Carry %</span>
        </div>

        <div className="stat-card">
          <strong>{sessionStats.doublePercentage.toFixed(1)}%</strong>
          <span>Double %</span>
        </div>

        <div className="stat-card">
          <strong>{sessionStats.makeableSpareConversion.toFixed(1)}%</strong>
          <span>Makeable Spare %</span>
        </div>

        <div className="stat-card">
          <strong>{sessionStats.fillFramesPercentage.toFixed(1)}%</strong>
          <span>Fill Frames %</span>
        </div>

        <div className="stat-card">
          <strong>{sessionStats.cleanPercentage.toFixed(1)}%</strong>
          <span>Clean %</span>
        </div>

        <div className="stat-card">
          <strong>{sessionStats.splitPercentage.toFixed(1)}%</strong>
          <span>Split %</span>
        </div>

        <div className="stat-card">
          <strong>{sessionStats.cleanGames}</strong>
          <span>Clean Games</span>
        </div>
      </div>
    </section>
  );
}

// Baker Stats Helpers
// ==================

function getBakerEntryStatCounts(entry: FrameEntry) {
  const rolls = getFrameRolls(entry);
  let strikes = 0;
  let spares = 0;

  if (entry.frameNumber === 10) {
    rolls.forEach((roll) => {
      if (roll === 10) {
        strikes += 1;
      }
    });

    if ((rolls[0] ?? 0) !== 10 && (rolls[0] ?? 0) + (rolls[1] ?? 0) === 10) {
      spares += 1;
    }

    if (
      (rolls[0] ?? 0) === 10 &&
      (rolls[1] ?? 0) !== 10 &&
      (rolls[1] ?? 0) + (rolls[2] ?? 0) === 10
    ) {
      spares += 1;
    }
  } else if ((rolls[0] ?? 0) === 10) {
    strikes += 1;
  } else if ((rolls[0] ?? 0) + (rolls[1] ?? 0) === 10) {
    spares += 1;
  }

  return {
    strikes,
    spares,
    opens: isCleanFrame(entry) ? 0 : 1,
    splits: isSplitEntry(entry) ? 1 : 0,
    cleanFrames: isCleanFrame(entry) ? 1 : 0,
  };
}

function summarizeBakerEntries(entries: FrameEntry[]) {
  return entries.reduce(
    (summary, entry) => {
      const entryStats = getBakerEntryStatCounts(entry);

      return {
        strikes: summary.strikes + entryStats.strikes,
        spares: summary.spares + entryStats.spares,
        opens: summary.opens + entryStats.opens,
        splits: summary.splits + entryStats.splits,
        cleanFrames: summary.cleanFrames + entryStats.cleanFrames,
      };
    },
    {
      strikes: 0,
      spares: 0,
      opens: 0,
      splits: 0,
      cleanFrames: 0,
    }
  );
}

function calculateBakerTeamSummaryRows(games: SavedGameRecord[]) {
  const gamesByTeam = new Map<string, SavedGameRecord[]>();

  games.forEach((game) => {
    const teamName = `Baker Team: ${Array.from(new Set(game.bowlerNames))
      .sort((a, b) => a.localeCompare(b))
      .join(", ")}`;
    const currentGames = gamesByTeam.get(teamName) ?? [];
    gamesByTeam.set(teamName, [...currentGames, game]);
  });

  return Array.from(gamesByTeam.entries()).map(([teamName, teamGames]) => {
    const scores = teamGames.flatMap((game) =>
      game.scores.map((score) => score.score)
    );
    const entries = teamGames.flatMap((game) => game.entries);
    const bakerStats = summarizeBakerEntries(entries);

    return {
      teamName,
      games: teamGames.length,
      average:
        scores.length > 0
          ? scores.reduce((sum, score) => sum + score, 0) / scores.length
          : 0,
      highGame: scores.length > 0 ? Math.max(...scores) : 0,
      frames: entries.length,
      strikes: bakerStats.strikes,
      spares: bakerStats.spares,
      opens: bakerStats.opens,
      splits: bakerStats.splits,
      cleanRate:
        entries.length > 0 ? (bakerStats.cleanFrames / entries.length) * 100 : 0,
      cleanGames: teamGames.filter((game) => isCleanGameForEntries(game.entries))
        .length,
    };
  });
}

function calculateBakerPositionRows(
  games: SavedGameRecord[],
  selectedBakerBowler: string,
  selectedBall: string
) {
  const rowsByPosition = new Map<
    number,
    {
      position: number;
      bowlerNames: Set<string>;
      entries: FrameEntry[];
    }
  >();

  games.forEach((game) => {
    game.entries.forEach((entry) => {
      const matchesBakerBowler =
        selectedBakerBowler === "All" ||
        entry.bowlerName === selectedBakerBowler;
      const matchesBall = selectedBall === "All" || entry.ballUsed === selectedBall;

      if (!matchesBakerBowler || !matchesBall) {
        return;
      }

      const position = ((entry.frameNumber - 1) % Math.max(1, game.bowlersPerTeam)) + 1;
      const currentRow =
        rowsByPosition.get(position) ?? {
          position,
          bowlerNames: new Set<string>(),
          entries: [],
        };

      currentRow.bowlerNames.add(entry.bowlerName);
      currentRow.entries.push(entry);
      rowsByPosition.set(position, currentRow);
    });
  });

  return Array.from(rowsByPosition.values())
    .map((row) => {
      const bakerStats = summarizeBakerEntries(row.entries);

      return {
        position: row.position,
        bowlers: Array.from(row.bowlerNames).sort().join(", "),
        frames: row.entries.length,
        strikes: bakerStats.strikes,
        spares: bakerStats.spares,
        opens: bakerStats.opens,
        splits: bakerStats.splits,
        cleanRate:
          row.entries.length > 0
            ? (bakerStats.cleanFrames / row.entries.length) * 100
            : 0,
      };
    })
    .sort((a, b) => a.position - b.position);
}

// Baker Stats Components
// ==================

function BakerStatsSection({
  games,
  selectedBakerBowler,
  selectedBall,
}: {
  games: SavedGameRecord[];
  selectedBakerBowler: string;
  selectedBall: string;
}) {
  const teamRows = calculateBakerTeamSummaryRows(games);
  const positionRows = calculateBakerPositionRows(
    games,
    selectedBakerBowler,
    selectedBall
  );
  const bowlerRows = calculateBakerBowlerRows(games).filter((row) => {
    const matchesBakerBowler =
      selectedBakerBowler === "All" || row.bowlerName === selectedBakerBowler;
    const matchesBall =
      selectedBall === "All" ||
      row.balls.split(", ").some((ballName) => ballName === selectedBall);

    return matchesBakerBowler && matchesBall;
  });

  return (
    <details className="baker-stats-card stats-collapsible-card">
      <summary className="stats-section-summary">
        <div>
          <strong>Baker Team Stats</strong>
          <p>
            Baker games stay separate from individual stats. Use this section
            for team score, lineup position, frame responsibility, and anchor
            10th-frame fill shots.
          </p>
        </div>
        <span className="summary-hint">Open Section</span>
      </summary>

      <div className="stats-collapsible-content">
        <section className="baker-breakdown-card">
          <h4>Team Summary</h4>

          <div className="table-scroll">
            <table className="stats-table">
              <thead>
                <tr>
                  <th>Baker Team</th>
                  <th>Games</th>
                  <th>Average</th>
                  <th>High Game</th>
                  <th>Frames</th>
                  <th>Strikes</th>
                  <th>Spares</th>
                  <th>Opens</th>
                  <th>Splits</th>
                  <th>Clean %</th>
                  <th>Clean Games</th>
                </tr>
              </thead>
              <tbody>
                {teamRows.map((row) => (
                  <tr key={row.teamName}>
                    <td>{row.teamName}</td>
                    <td>{row.games}</td>
                    <td>{row.average.toFixed(1)}</td>
                    <td>{row.highGame}</td>
                    <td>{row.frames}</td>
                    <td>{row.strikes}</td>
                    <td>{row.spares}</td>
                    <td>{row.opens}</td>
                    <td>{row.splits}</td>
                    <td>{row.cleanRate.toFixed(1)}%</td>
                    <td>{row.cleanGames}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="baker-breakdown-card">
          <h4>Stats by Baker Position</h4>
          <p className="helper-text">
            Position is calculated from the frame number and team size. For a
            five-person lineup, position 1 bowls frames 1 and 6, position 2
            bowls frames 2 and 7, and so on. The anchor position also gets
            credit for any 10th-frame fill-ball strikes or spares.
          </p>

          <div className="table-scroll">
            <table className="stats-table">
              <thead>
                <tr>
                  <th>Position</th>
                  <th>Bowler(s)</th>
                  <th>Frames</th>
                  <th>Strikes</th>
                  <th>Spares</th>
                  <th>Opens</th>
                  <th>Splits</th>
                  <th>Clean %</th>
                </tr>
              </thead>
              <tbody>
                {positionRows.map((row) => (
                  <tr key={row.position}>
                    <td>{row.position}</td>
                    <td>{row.bowlers}</td>
                    <td>{row.frames}</td>
                    <td>{row.strikes}</td>
                    <td>{row.spares}</td>
                    <td>{row.opens}</td>
                    <td>{row.splits}</td>
                    <td>{row.cleanRate.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="baker-breakdown-card">
          <h4>Baker Bowler Contribution</h4>

          <div className="table-scroll">
            <table className="stats-table">
              <thead>
                <tr>
                  <th>Bowler</th>
                  <th>Frames</th>
                  <th>Strikes</th>
                  <th>Spares</th>
                  <th>Opens</th>
                  <th>Splits</th>
                  <th>Clean %</th>
                  <th>Balls Used</th>
                </tr>
              </thead>
              <tbody>
                {bowlerRows.map((row) => (
                  <tr key={row.bowlerName}>
                    <td>{row.bowlerName}</td>
                    <td>{row.frames}</td>
                    <td>{row.strikes}</td>
                    <td>{row.spares}</td>
                    <td>{row.opens}</td>
                    <td>{row.splits}</td>
                    <td>{row.cleanRate.toFixed(1)}%</td>
                    <td>{row.balls}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </details>
  );
}

function calculateBakerBowlerRows(games: SavedGameRecord[]) {
  const entryMap = new Map<string, FrameEntry[]>();

  games
    .filter((game) => game.format === "Baker")
    .flatMap((game) => game.entries)
    .forEach((entry) => {
      const currentEntries = entryMap.get(entry.bowlerName) ?? [];
      entryMap.set(entry.bowlerName, [...currentEntries, entry]);
    });

  return Array.from(entryMap.entries())
    .map(([bowlerName, entries]) => {
      const bakerStats = summarizeBakerEntries(entries);
      const balls = Array.from(
        new Set(entries.map((entry) => entry.ballUsed).filter(Boolean))
      ).join(", ");

      return {
        bowlerName,
        frames: entries.length,
        strikes: bakerStats.strikes,
        spares: bakerStats.spares,
        opens: bakerStats.opens,
        splits: bakerStats.splits,
        cleanRate:
          entries.length > 0
            ? (bakerStats.cleanFrames / entries.length) * 100
            : 0,
        balls: balls || "No ball",
      };
    })
    .sort((a, b) => a.bowlerName.localeCompare(b.bowlerName));
}

function BakerSetBreakdown({
  session,
}: {
  session: ReturnType<typeof buildSessionGroups>[number];
}) {
  const rows = calculateBakerBowlerRows(session.games);

  if (rows.length === 0) {
    return null;
  }

  return (
    <section className="baker-breakdown-card">
      <h4>Baker Rotation Breakdown</h4>
      <p className="helper-text">
        Baker keeps the team score as one score while still tracking who bowled
        each frame. This table shows each bowler’s frame responsibility inside
        the team set.
      </p>

      <div className="table-scroll">
        <table className="stats-table">
          <thead>
            <tr>
              <th>Bowler</th>
              <th>Frames</th>
              <th>Strikes</th>
              <th>Spares</th>
              <th>Opens</th>
              <th>Splits</th>
              <th>Clean %</th>
              <th>Balls Used</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.bowlerName}>
                <td>{row.bowlerName}</td>
                <td>{row.frames}</td>
                <td>{row.strikes}</td>
                <td>{row.spares}</td>
                <td>{row.opens}</td>
                <td>{row.splits}</td>
                <td>{row.cleanRate.toFixed(1)}%</td>
                <td>{row.balls}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function getEntryResultLabel(entry: FrameEntry) {
  if (isStrikeEntry(entry)) {
    return "Strike";
  }

  if (isSpareEntry(entry)) {
    return "Spare";
  }

  return "Open";
}

function BakerFrameTable({ game }: { game: SavedGameRecord }) {
  return (
    <section className="baker-frame-card">
      <h4>Baker Frame Responsibility</h4>

      <div className="table-scroll">
        <table className="stats-table">
          <thead>
            <tr>
              <th>Frame</th>
              <th>Bowler</th>
              <th>Ball</th>
              <th>Marks</th>
              <th>Leave</th>
              <th>Result</th>
              <th>Frame Pinfall</th>
            </tr>
          </thead>
          <tbody>
            {game.entries
              .sort((a, b) => a.frameNumber - b.frameNumber)
              .map((entry) => (
                <tr key={`${game.id}-${entry.frameNumber}`}>
                  <td>{entry.frameNumber}</td>
                  <td>{entry.bowlerName}</td>
                  <td>{entry.ballUsed || "No ball"}</td>
                  <td>
                    {getFrameMarks(entry)
                      .map((mark) => mark.value)
                      .filter(Boolean)
                      .join(" ")}
                  </td>
                  <td>{isStrikeEntry(entry) ? "—" : getSpareLeaveKey(entry)}</td>
                  <td>{getEntryResultLabel(entry)}</td>
                  <td>
                    {getFrameRolls(entry).reduce(
                      (sum, roll) => sum + roll,
                      0
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// Set / Session Helpers
// ==================

function formatSetSavedDateTime(savedAt: string) {
  const savedDate = new Date(savedAt);

  if (Number.isNaN(savedDate.getTime())) {
    return savedAt;
  }

  return savedDate.toLocaleString([], {
    month: "numeric",
    day: "numeric",
    year: "2-digit",
    hour: "numeric",
    minute: "2-digit",
  });
}

function buildSetFilterOptions(games: SavedGameRecord[]) {
  return buildSessionGroups(games).map((group) => {
    const firstGame = group.games[0];
    const gameCount = group.games.length;
    const savedDateTime = firstGame
      ? formatSetSavedDateTime(firstGame.savedAt)
      : "";

    return {
      key: group.sessionKey,
      label: [
        `${gameCount} game${gameCount === 1 ? "" : "s"}`,
        firstGame?.centerName,
        savedDateTime,
      ]
        .filter(Boolean)
        .join(" • "),
    };
  });
}

function calculateTeamSetRows(sessionGroups: ReturnType<typeof buildSessionGroups>) {
  return sessionGroups.map((group) => {
    const teamGameScores = group.games.map((game) =>
      game.scores.reduce((sum, score) => sum + score.score, 0)
    );
    const individualScores = group.games.flatMap((game) =>
      game.scores.map((score) => score.score)
    );
    const entries = group.games.flatMap((game) => game.entries);
    const strikes = entries.filter(isStrikeEntry).length;
    const spares = entries.filter(isSpareEntry).length;
    const opens = entries.length - strikes - spares;
    const cleanFrames = entries.filter(isCleanFrame).length;
    const splits = entries.filter(isSplitEntry).length;
    const bowlerNames = Array.from(
      new Set(group.games.flatMap((game) => game.bowlerNames))
    ).sort((a, b) => a.localeCompare(b));
    const cleanTeamGames = group.games.filter((game) => {
      if (game.format === "Baker") {
        return isCleanGameForEntries(game.entries);
      }

      const entriesByBowler = new Map<string, FrameEntry[]>();

      game.entries.forEach((entry) => {
        const currentEntries = entriesByBowler.get(entry.bowlerName) ?? [];
        entriesByBowler.set(entry.bowlerName, [...currentEntries, entry]);
      });

      const bowlerFrameSets = Array.from(entriesByBowler.values());

      return (
        bowlerFrameSets.length > 0 &&
        bowlerFrameSets.every((bowlerEntries) =>
          isCleanGameForEntries(bowlerEntries)
        )
      );
    }).length;

    const teamSetTotal = teamGameScores.reduce((sum, score) => sum + score, 0);
    const teamGameAverage =
      teamGameScores.length > 0 ? teamSetTotal / teamGameScores.length : 0;
    const trackedBowlerAverage =
      individualScores.length > 0
        ? individualScores.reduce((sum, score) => sum + score, 0) /
          individualScores.length
        : 0;

    return {
      sessionKey: group.sessionKey,
      title: group.title,
      games: group.games.length,
      bowlers: bowlerNames.join(", ") || "Team",
      teamSetTotal,
      teamGameAverage,
      trackedBowlerAverage,
      highTeamGame: teamGameScores.length > 0 ? Math.max(...teamGameScores) : 0,
      frames: entries.length,
      strikes,
      spares,
      opens,
      cleanRate: entries.length > 0 ? (cleanFrames / entries.length) * 100 : 0,
      splitRate: entries.length > 0 ? (splits / entries.length) * 100 : 0,
      cleanTeamGames,
    };
  });
}

function buildSessionGroups(games: SavedGameRecord[]) {
  const groups = new Map<
    string,
    {
      sessionKey: string;
      title: string;
      centerName: string;
      patternName: string;
      games: SavedGameRecord[];
    }
  >();

  games.forEach((game) => {
    const sessionKey =
      game.sessionId ||
      game.eventLogKey ||
      `${game.savedAt}-${game.centerName}-${game.patternName}-${game.format}`;

    const titleParts = [
      game.eventName || game.competitionType,
      game.eventStageLabel,
      game.format,
    ].filter(Boolean);

    if (!groups.has(sessionKey)) {
      groups.set(sessionKey, {
        sessionKey,
        title: titleParts.join(" — "),
        centerName: game.centerName,
        patternName: game.patternName,
        games: [],
      });
    }

    groups.get(sessionKey)?.games.push(game);
  });

  return Array.from(groups.values()).map((group) => ({
    ...group,
    games: group.games.sort((a, b) => a.gameNumber - b.gameNumber),
  }));
}

// Frame Result Helpers
// ==================

function isStrikeEntry(entry: FrameEntry) {
  return entry.firstShotKnockedPins.length === 10;
}

function isSplitEntry(entry: FrameEntry) {
  return !isStrikeEntry(entry) && isSplitLeave(entry.firstShotKnockedPins);
}

function isCleanGameForEntries(entries: FrameEntry[]) {
  const frames = entries.filter(
    (entry) => entry.frameNumber >= 1 && entry.frameNumber <= 10
  );

  return frames.length === 10 && frames.every(isCleanFrame);
}

function countCleanGames(
  games: SavedGameRecord[],
  selectedBowler: string,
  selectedBall: string
) {
  return games.filter((game) => {
    const relevantEntries = game.entries.filter((entry) => {
      const matchesBowler =
        selectedBowler === "All" || entry.bowlerName === selectedBowler;
      const matchesBall =
        selectedBall === "All" || entry.ballUsed === selectedBall;

      return matchesBowler && matchesBall;
    });

    if (selectedBowler === "All") {
      if (game.format === "Baker") {
        return isCleanGameForEntries(relevantEntries);
      }

      const entriesByBowler = new Map<string, FrameEntry[]>();

      relevantEntries.forEach((entry) => {
        const currentEntries = entriesByBowler.get(entry.bowlerName) ?? [];
        entriesByBowler.set(entry.bowlerName, [...currentEntries, entry]);
      });

      return Array.from(entriesByBowler.values()).some(isCleanGameForEntries);
    }

    return isCleanGameForEntries(relevantEntries);
  }).length;
}

function isSpareAttemptEntry(entry: FrameEntry) {
  return !isStrikeEntry(entry);
}

function getSpareLeavePins(entry: FrameEntry) {
  if (!isSpareAttemptEntry(entry)) {
    return [];
  }

  return getPinsStanding(entry.firstShotKnockedPins);
}

function getSpareLeaveKey(entry: FrameEntry) {
  const leavePins = getSpareLeavePins(entry);

  return leavePins.length > 0 ? leavePins.join("-") : "None";
}

function parseLeaveKeyPins(leave: string) {
  if (leave === "None") {
    return [];
  }

  return leave
    .split("-")
    .map((pin) => Number(pin))
    .filter((pin) => Number.isFinite(pin))
    .sort((a, b) => a - b);
}

function calculateSpareLeaveSummary(entries: FrameEntry[]) {
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

function calculateSpareLeaveRows(entries: FrameEntry[]) {
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

function isSpareEntry(entry: FrameEntry) {
  if (isStrikeEntry(entry)) {
    return false;
  }

  const firstShotStandingPins = getPinsStanding(entry.firstShotKnockedPins);
  const pinsStandingAfterFrame = firstShotStandingPins.filter(
    (pin) => !entry.secondShotKnockedPins.includes(pin)
  );

  return pinsStandingAfterFrame.length === 0;
}

function isCleanFrame(entry: FrameEntry) {
  return isStrikeEntry(entry) || isSpareEntry(entry);
}

function getBowlerHandedness(
  bowlerName: string,
  bowlerHandednessByName: Map<string, Handedness>
) {
  return bowlerHandednessByName.get(bowlerName) ?? "Right";
}

function getPocketContactPins(handedness: Handedness) {
  // LaneTalk-style pocket proxy:
  // right-handed pocket = 1/3 contact on first ball,
  // left-handed pocket = 1/2 contact on first ball.
  return handedness === "Left" ? [1, 2] : [1, 3];
}

function isPocketHit(entry: FrameEntry, handedness: Handedness) {
  const pocketPins = getPocketContactPins(handedness);

  return pocketPins.every((pin) => entry.firstShotKnockedPins.includes(pin));
}

function isPocketStrike(entry: FrameEntry, handedness: Handedness) {
  return isPocketHit(entry, handedness) && isStrikeEntry(entry);
}

function isMakeableSpareAttempt(entry: FrameEntry) {
  if (isStrikeEntry(entry)) {
    return false;
  }

  const standingPins = getPinsStanding(entry.firstShotKnockedPins);

  return standingPins.length <= 3;
}

// Detailed Bowler Analysis Helpers
// ==================

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

function getScoredFrameValues(entries: FrameEntry[]) {
  const orderedFrames = [...entries].sort((a, b) => a.frameNumber - b.frameNumber);
  const cumulativeScores = getCumulativeFrameScores(orderedFrames);
  let previousScore = 0;

  return orderedFrames
    .map((entry, index) => {
      const cumulativeScore = cumulativeScores[index];

      if (typeof cumulativeScore !== "number") {
        return null;
      }

      const frameScore = cumulativeScore - previousScore;
      previousScore = cumulativeScore;

      return {
        frameNumber: entry.frameNumber,
        frameScore,
      };
    })
    .filter(
      (row): row is { frameNumber: number; frameScore: number } => row !== null
    );
}

function calculateAverageFrameScoreRows(
  games: SavedGameRecord[],
  bowlerName: string,
  selectedBall: string
) {
  const rowsByFrame = new Map<number, number[]>();

  games.forEach((game) => {
    const gameEntries = game.entries
      .filter((entry) => {
        const matchesBowler = entry.bowlerName === bowlerName;
        const matchesBall =
          selectedBall === "All" || entry.ballUsed === selectedBall;

        return matchesBowler && matchesBall;
      })
      .sort((a, b) => a.frameNumber - b.frameNumber);

    getScoredFrameValues(gameEntries).forEach((row) => {
      const frameScores = rowsByFrame.get(row.frameNumber) ?? [];
      rowsByFrame.set(row.frameNumber, [...frameScores, row.frameScore]);
    });
  });

  return Array.from({ length: 10 }, (_, index) => {
    const frameNumber = index + 1;
    const frameScores = rowsByFrame.get(frameNumber) ?? [];
    const average =
      frameScores.length > 0
        ? frameScores.reduce((sum, score) => sum + score, 0) /
          frameScores.length
        : 0;

    return {
      frameNumber,
      average,
      count: frameScores.length,
    };
  });
}

function calculateAverageByGameRows(
  games: SavedGameRecord[],
  bowlerName: string,
  selectedBall: string
) {
  const scoresByGameNumber = new Map<number, number[]>();

  games.forEach((game) => {
    const gameEntries = game.entries.filter((entry) => {
      const matchesBowler = entry.bowlerName === bowlerName;
      const matchesBall =
        selectedBall === "All" || entry.ballUsed === selectedBall;

      return matchesBowler && matchesBall;
    });

    if (gameEntries.length === 0) {
      return;
    }

    const score = scoreBowlingFrames(gameEntries);
    const gameScores = scoresByGameNumber.get(game.gameNumber) ?? [];
    scoresByGameNumber.set(game.gameNumber, [...gameScores, score]);
  });

  return Array.from(scoresByGameNumber.entries())
    .map(([gameNumber, scores]) => ({
      gameNumber,
      count: scores.length,
      average:
        scores.length > 0
          ? scores.reduce((sum, score) => sum + score, 0) / scores.length
          : 0,
      high: scores.length > 0 ? Math.max(...scores) : 0,
      low: scores.length > 0 ? Math.min(...scores) : 0,
    }))
    .sort((a, b) => a.gameNumber - b.gameNumber);
}

function getScoreBinLabel(score: number) {
  if (score < 100) return "U/100";
  if (score < 125) return "100-124";
  if (score < 150) return "125-149";
  if (score < 175) return "150-174";
  if (score < 200) return "175-199";
  if (score < 225) return "200-224";
  if (score < 250) return "225-249";
  if (score < 275) return "250-274";
  if (score < 300) return "275-299";
  return "300";
}

function getSeriesBinLabel(score: number) {
  if (score < 400) return "U/400";
  if (score < 450) return "400-449";
  if (score < 500) return "450-499";
  if (score < 550) return "500-549";
  if (score < 600) return "550-599";
  if (score < 650) return "600-649";
  if (score < 700) return "650-699";
  if (score < 750) return "700-749";
  if (score < 800) return "750-799";
  return "800-900";
}

function getGameScoreItems(
  games: SavedGameRecord[],
  bowlerName: string,
  selectedBall: string
) {
  return games
    .map((game) => {
      const gameEntries = game.entries.filter((entry) => {
        const matchesBowler = entry.bowlerName === bowlerName;
        const matchesBall =
          selectedBall === "All" || entry.ballUsed === selectedBall;

        return matchesBowler && matchesBall;
      });

      if (gameEntries.length === 0) {
        return null;
      }

      return {
        gameNumber: game.gameNumber,
        score: scoreBowlingFrames(gameEntries),
      };
    })
    .filter(
      (item): item is { gameNumber: number; score: number } => item !== null
    );
}

function getThreeGameSeriesTotals(
  sessionGroups: ReturnType<typeof buildSessionGroups>,
  bowlerName: string
) {
  const seriesTotals: number[] = [];

  sessionGroups.forEach((session) => {
    const bowlerScores = session.games
      .sort((a, b) => a.gameNumber - b.gameNumber)
      .map((game) =>
        game.scores.find((score) => score.label === bowlerName)?.score ?? null
      )
      .filter((score): score is number => score !== null);

    if (bowlerScores.length < 3) {
      return;
    }

    for (let index = 0; index <= bowlerScores.length - 3; index += 1) {
      seriesTotals.push(
        bowlerScores
          .slice(index, index + 3)
          .reduce((sum, score) => sum + score, 0)
      );
    }
  });

  return seriesTotals;
}

function calculateScoreDistribution(
  games: SavedGameRecord[],
  sessionGroups: ReturnType<typeof buildSessionGroups>,
  bowlerName: string,
  selectedBall: string
) {
  const gameScoreItems = getGameScoreItems(games, bowlerName, selectedBall);
  const gameNumbers = Array.from(
    new Set(gameScoreItems.map((item) => item.gameNumber))
  ).sort((a, b) => a - b);
  const gameBinLabels = [
    "U/100",
    "100-124",
    "125-149",
    "150-174",
    "175-199",
    "200-224",
    "225-249",
    "250-274",
    "275-299",
    "300",
  ];
  const gameRows = gameBinLabels.map((label) => {
    const gameCounts: Record<number, number> = {};

    gameNumbers.forEach((gameNumber) => {
      gameCounts[gameNumber] = 0;
    });

    gameScoreItems.forEach((item) => {
      if (getScoreBinLabel(item.score) === label) {
        gameCounts[item.gameNumber] = (gameCounts[item.gameNumber] ?? 0) + 1;
      }
    });

    const total = Object.values(gameCounts).reduce(
      (sum, count) => sum + count,
      0
    );

    return {
      label,
      gameCounts,
      total,
      percentage:
        gameScoreItems.length > 0
          ? (total / gameScoreItems.length) * 100
          : 0,
    };
  });

  const seriesTotals = getThreeGameSeriesTotals(sessionGroups, bowlerName);
  const seriesBinLabels = [
    "U/400",
    "400-449",
    "450-499",
    "500-549",
    "550-599",
    "600-649",
    "650-699",
    "700-749",
    "750-799",
    "800-900",
  ];
  const seriesRows = seriesBinLabels.map((label) => {
    const total = seriesTotals.filter(
      (seriesTotal) => getSeriesBinLabel(seriesTotal) === label
    ).length;

    return {
      label,
      total,
      percentage:
        seriesTotals.length > 0 ? (total / seriesTotals.length) * 100 : 0,
    };
  });

  return {
    gameNumbers,
    gameRows,
    seriesRows,
  };
}

// Detailed Bowler Analysis
// ==================

function calculateDetailedBowlerStats(
  bowlerName: string,
  selectedBall: string,
  games: SavedGameRecord[],
  sessionGroups: ReturnType<typeof buildSessionGroups>,
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
  const average =
    scores.length > 0
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length
      : 0;

  const highThreeGameSeries = getHighSeries(sessionGroups, bowlerName, 3);
  const highFourGameSeries = getHighSeries(sessionGroups, bowlerName, 4);

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
  const firstBallAverage =
    entries.length > 0
      ? entries.reduce(
          (sum, entry) => sum + entry.firstShotKnockedPins.length,
          0
        ) / entries.length
      : 0;
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
    average,
    highThreeGameSeries,
    highFourGameSeries,
    frames: entries.length,
    strikes,
    spares,
    opens,
    pocketPercentage:
      firstShots > 0 ? (pocketHits / firstShots) * 100 : 0,
    carryPercentage:
      pocketHits > 0 ? (pocketStrikes / pocketHits) * 100 : 0,
    doublePercentage:
      pocketStrikes > 0 ? (pocketStrikesAfterStrike / pocketStrikes) * 100 : 0,
    makeableSpareConversion:
      makeableAttempts.length > 0
        ? (convertedMakeableSpares / makeableAttempts.length) * 100
        : 0,
    fillFramesPercentage:
      firstShots > 0 ? (cleanFrames / firstShots) * 100 : 0,
    cleanPercentage:
      firstShots > 0 ? (cleanFrames / firstShots) * 100 : 0,
    splitPercentage:
      firstShots > 0 ? (splits / firstShots) * 100 : 0,
    cleanGames,
    firstBallAverage,
    frameScoreRows,
    averageByGameRows,
    scoreDistribution,
    transitionRows,
  };
}

function getHighFullSeries(
  sessionGroups: ReturnType<typeof buildSessionGroups>,
  bowlerName: string
) {
  let highSeries = 0;

  sessionGroups.forEach((session) => {
    const seriesTotal = session.games.reduce((sum, game) => {
      const score = game.scores.find(
        (currentScore) => currentScore.label === bowlerName
      );

      return sum + (score?.score ?? 0);
    }, 0);

    highSeries = Math.max(highSeries, seriesTotal);
  });

  return highSeries;
}

function getHighTeamSeries(
  sessionGroups: ReturnType<typeof buildSessionGroups>,
  seriesLength: number
) {
  let highSeries = 0;

  sessionGroups.forEach((session) => {
    const teamScores = session.games
      .sort((a, b) => a.gameNumber - b.gameNumber)
      .map((game) =>
        game.scores.reduce((sum, score) => sum + score.score, 0)
      );

    if (teamScores.length < seriesLength) {
      return;
    }

    for (let index = 0; index <= teamScores.length - seriesLength; index += 1) {
      const series = teamScores
        .slice(index, index + seriesLength)
        .reduce((sum, score) => sum + score, 0);

      highSeries = Math.max(highSeries, series);
    }
  });

  return highSeries;
}

function getHighSeries(
  sessionGroups: ReturnType<typeof buildSessionGroups>,
  bowlerName: string,
  seriesLength: number
) {
  let highSeries = 0;

  sessionGroups.forEach((session) => {
    const leagueOrTournamentGames = session.games.filter(
      (game) => game.competitionType !== "Open"
    );

    const bowlerScores = leagueOrTournamentGames
      .sort((a, b) => a.gameNumber - b.gameNumber)
      .map((game) =>
        game.scores.find((score) => score.label === bowlerName)?.score ?? null
      )
      .filter((score): score is number => score !== null);

    if (bowlerScores.length < seriesLength) {
      return;
    }

    for (let index = 0; index <= bowlerScores.length - seriesLength; index += 1) {
      const series = bowlerScores
        .slice(index, index + seriesLength)
        .reduce((sum, score) => sum + score, 0);

      highSeries = Math.max(highSeries, series);
    }
  });

  return highSeries;
}