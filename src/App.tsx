// Imports
// ==================

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
} from "react";
import "./App.css";
import "./theme.css";
import {
  ALL_PINS,
  getPinsStanding,
  getFrameResult,
  getFrameRolls,
  scoreBowlingFrames,
  getCumulativeFrameScores,
  calculateScoresForGame,
  getFrameMarks,
  type ScoreMark,
} from "./lib/scoring";
import {
  unknownPatternId,
  unknownPattern,
  ensureUnknownPattern,
  createPinSighterBackup,
  getImportedBackupData,
  type PinSighterBackupData,
  type PinSighterBackup,
} from "./lib/backup";
import {
  defaultStatsFilters,
  filterGames,
  deriveOptions,
  resolveFilters,
  bakerTeamLabelFromNames,
  bakerTeamLabelForGame,
  type StatsFilters,
  type TimeFramePreset,
} from "./lib/statsFilters";
import { ToastMessage } from "./components/ToastMessage";
import { EmptyStateCard } from "./components/EmptyStateCard";
import { BoardSelect } from "./components/BoardSelect";
import { PinDeck } from "./components/PinDeck";
import { ScoreGrid } from "./components/ScoreGrid";
import { StaticPinLeaveDeck } from "./components/StaticPinLeaveDeck";
import { AboutPage } from "./pages/AboutPage";
import { BowlersPage } from "./pages/BowlersPage";
import { CentersPage } from "./pages/CentersPage";
import { DataManagementPage } from "./pages/DataManagementPage";
import { EventsPage } from "./pages/EventsPage";
import { HomePage } from "./pages/HomePage";
import { PatternsPage } from "./pages/PatternsPage";
import { isDuelPattern, formatPatternDropdownLabel } from "./lib/patterns";
import {
  createSampleSavedGames,
  createSampleSavedEventLogs,
} from "./lib/sampleData";
import {
  isStrikeEntry,
  isSplitEntry,
  isCleanGameForEntries,
  countCleanGames,
  isSpareEntry,
  isCleanFrame,
  getBowlerHandedness,
  isPocketHit,
  isPocketStrike,
  isMakeableSpareAttempt,
} from "./stats/frames";
import {
  getSpareLeaveKey,
  calculateSpareLeaveSummary,
  calculateSpareLeaveRows,
} from "./stats/spareLeaves";
import { APP_VERSION } from "./version";
import {
  buildSessionGroups,
  getHighSeriesDetail,
  getHighFullSeries,
  getHighTeamSeriesDetail,
} from "./lib/sessions";
import type { HighSeriesDetail } from "./lib/sessions";
import {
  storageKeys,
  loadFromLocalStorage,
  saveToLocalStorage,
  hasCompletedFirstLaunchSetup,
  markFirstLaunchSetupComplete,
  createEmptyBackupData,
} from "./lib/storage";
import type {
  CompetitionType,
  BowlingFormat,
  Handedness,
  Bowler,
  Center,
  Pattern,
  EventSetup,
  CarryoverFields,
  FrameEntry,
  CompletedGameScore,
  SavedEventLog,
  SavedGameRecord,
} from "./types";

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
  | "ball-seeker"
  | "layout-visualizer"
  | "speed-rev"
  | "data"
  | "about";

type LaneOption = {
  value: string;
  label: string;
};

type CompletedGameSummary = {
  gameNumber: number;
  laneLabel: string;
  scores: CompletedGameScore[];
  entries: FrameEntry[];
};


type ContinueSavedSetRequest = {
  sessionId: string;
  createdAt?: string;
  competitionType: CompetitionType;
  format: BowlingFormat;
  bowlersPerTeam: number;
  centerName: string;
  patternName: string;
  eventLogKey: string;
  eventId: number | null;
  eventName: string;
  eventStageLabel: string;
  bowlerNames: string[];
  laneMode: string;
  startingLaneOrPair: string;
  startingLane: string;
  seriesGameCount: number | null;
  initialGameNumber: number;
  firstGameNumberToSave: number;
  existingCompletedGames: CompletedGameSummary[];
};

type LogGamesPageProps = {
  bowlers: Bowler[];
  centers: Center[];
  patterns: Pattern[];
  events: EventSetup[];
  savedEventLogs: SavedEventLog[];
  setSavedEventLogs: Dispatch<SetStateAction<SavedEventLog[]>>;
  setSavedGames: Dispatch<SetStateAction<SavedGameRecord[]>>;
  continueSavedSetRequest: ContinueSavedSetRequest | null;
  onConsumeContinueSavedSetRequest: () => void;
  leaveGuardRef: { current: (() => boolean) | null };
};

type StatsPageProps = {
  bowlers: Bowler[];
  centers: Center[];
  patterns: Pattern[];
  events: EventSetup[];
  savedGames: SavedGameRecord[];
  setSavedGames: Dispatch<SetStateAction<SavedGameRecord[]>>;
  savedEventLogs: SavedEventLog[];
  setSavedEventLogs: Dispatch<SetStateAction<SavedEventLog[]>>;
  /** The app's main bowler (name), used to seed the default Individual scope.
   *  "" = no main bowler → default all-bowlers scope. */
  mainBowler: string;
  onContinueSavedSet: (request: ContinueSavedSetRequest) => void;
};

type SetMetadataDraft = {
  centerName: string;
  patternName: string;
  gameLaneLabels: Record<string, string>;
  setNotes: string;
};

type GameMetadataDraft = {
  gameNotes: string;
  ballReactionNotes: string;
  laneTransitionNotes: string;
  adjustmentNotes: string;
};

type DetailedStatDetail = {
  title: string;
  label: string;
  value: string;
  description: string;
  formula: string;
  detailRows: { label: string; value: string }[];
  note?: string;
};

type OverviewScoreDetail = {
  score: number;
  bowlerLabel: string;
  gameNumber: number;
  laneLabel: string;
  savedAt: string;
  eventLabel: string;
};

type SetStatDetailRow = {
  id: string;
  score: number;
  gameNumber: number;
  laneLabel: string;
  savedAt: string;
  eventLabel: string;
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
  startingLane: string;
  laneOptions: LaneOption[];
  seriesGameCount: number | null;
  resumeSessionId?: string;
  resumeCreatedAt?: string;
  initialGameNumber?: number;
  firstGameNumberToSave?: number;
  initialCompletedGames?: CompletedGameSummary[];
  onSavedEventLog: (savedLog: SavedEventLog) => void;
  onSaveCompletedGames: (savedGames: SavedGameRecord[]) => void;
  onBack: () => void;
  leaveGuardRef: { current: (() => boolean) | null };
};

// Default Data
// ==================

const tabs: { id: Tab; label: string; wip?: boolean }[] = [
  { id: "log-games", label: "Log Games" },
  { id: "stats", label: "Stats" },
  { id: "bowlers", label: "Bowlers" },
  { id: "centers", label: "Bowling Centers" },
  { id: "events", label: "Tournaments / Leagues" },
  { id: "patterns", label: "Patterns" },
  { id: "ball-seeker", label: "Bowling Ball Seeker", wip: true },
  { id: "layout-visualizer", label: "Bowling Ball Layout Visualizer", wip: true },
  { id: "speed-rev", label: "Speed Rev Checker", wip: true },
  { id: "data", label: "Data" },
  { id: "about", label: "About" },
];


const defaultCenters: Center[] = [
  { id: 1, name: "Titan Bowl", laneCount: 8, notes: "School bowling center" },
  { id: 2, name: "Bowlero Fullerton", laneCount: 40, notes: "" },
  { id: 3, name: "Temporary 24 Lane Center", laneCount: 24, notes: "" },
];

const defaultPatterns: Pattern[] = [
  unknownPattern,
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

const footBoardOptions = Array.from({ length: 81 }, (_, index) => index - 20);
const laneBoardOptions = Array.from({ length: 39 }, (_, index) => index + 1);

// Persistence Helpers
// ==================

const dataFolderName = "data";
const backupFolderName = "back-ups";
const appDataFileName = "pin-sighter-data.json";
const temporaryBackupFileName = "pin-sighter-temporary-backup.json";

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

function trapFocusWithinElement(
  event: KeyboardEvent,
  container: HTMLElement | null
) {
  if (event.key !== "Tab" || !container) {
    return;
  }

  const focusableElements = Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter(
    (element) =>
      !element.hasAttribute("disabled") &&
      element.getAttribute("aria-hidden") !== "true"
  );

  if (focusableElements.length === 0) {
    event.preventDefault();
    container.focus();
    return;
  }

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault();
    lastElement.focus();
  } else if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
}

let documentScrollLockCount = 0;
let lockedScrollY = 0;
let previousBodyPosition = "";
let previousBodyTop = "";
let previousBodyWidth = "";
let previousBodyOverflow = "";
let previousHtmlOverscrollBehavior = "";

function lockDocumentScroll() {
  if (typeof window === "undefined") {
    return () => {};
  }

  if (documentScrollLockCount === 0) {
    lockedScrollY = window.scrollY;
    previousBodyPosition = document.body.style.position;
    previousBodyTop = document.body.style.top;
    previousBodyWidth = document.body.style.width;
    previousBodyOverflow = document.body.style.overflow;
    previousHtmlOverscrollBehavior =
      document.documentElement.style.overscrollBehavior;

    document.body.style.position = "fixed";
    document.body.style.top = `-${lockedScrollY}px`;
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";
    document.documentElement.style.overscrollBehavior = "contain";
  }

  documentScrollLockCount += 1;

  return () => {
    documentScrollLockCount = Math.max(0, documentScrollLockCount - 1);

    if (documentScrollLockCount > 0) {
      return;
    }

    document.body.style.position = previousBodyPosition;
    document.body.style.top = previousBodyTop;
    document.body.style.width = previousBodyWidth;
    document.body.style.overflow = previousBodyOverflow;
    document.documentElement.style.overscrollBehavior =
      previousHtmlOverscrollBehavior;

    window.scrollTo(0, lockedScrollY);
  };
}

function App() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // The chosen "main bowler" (a bowler name), or "" for the all-bowlers
  // composite. A device preference — persisted separately from backup data.
  const [mainBowler, setMainBowler] = useState<string>(() =>
    loadFromLocalStorage(storageKeys.mainBowler, ""),
  );
  const [hasCheckedAppDataFile, setHasCheckedAppDataFile] = useState(false);
  const [setupMessage, setSetupMessage] = useState("");
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
      ? ensureUnknownPattern(
          loadFromLocalStorage(storageKeys.patterns, defaultPatterns)
        )
      : ensureUnknownPattern([])
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

  const [continueSavedSetRequest, setContinueSavedSetRequest] =
    useState<ContinueSavedSetRequest | null>(null);

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
    setPatterns(ensureUnknownPattern(data.patterns));
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

  async function handleSetupImportData(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const parsedBackup = JSON.parse(await file.text()) as
        | PinSighterBackup
        | PinSighterBackupData;
      const importResult = getImportedBackupData(parsedBackup);

      completeSetup(importResult.data);

      if (importResult.warnings.length > 0) {
        setSetupMessage(
          `Backup imported with warnings: ${importResult.warnings.join(" ")}`
        );
      }
    } catch (error) {
      console.error("First-launch import failed.", error);
      setSetupMessage(
        "Import failed. Make sure the file is a Pin-Sighter JSON backup."
      );
    } finally {
      event.target.value = "";
    }
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

  // Persist the main-bowler preference (independent of the setup gate — it's a
  // device setting, not part of the backup data).
  useEffect(() => {
    saveToLocalStorage(storageKeys.mainBowler, mainBowler);
  }, [mainBowler]);

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

  // A page (e.g. Game Entry) can register a guard that runs before navigating
  // home, so in-progress work isn't discarded without a confirmation.
  const leaveGuardRef = useRef<(() => boolean) | null>(null);

  function requestGoHome() {
    if (leaveGuardRef.current && !leaveGuardRef.current()) {
      return;
    }
    setActiveTab("home");
  }

  // Sidebar navigation: run the leave-guard (so in-progress scoring isn't
  // discarded) before switching tabs, then close the mobile drawer.
  function requestNavigate(tab: Tab) {
    if (leaveGuardRef.current && !leaveGuardRef.current()) {
      return;
    }
    setActiveTab(tab);
    setSidebarOpen(false);
  }

  // Sidebar nav grouping (labels pulled from `tabs` so they stay in sync).
  const navGroups: { heading?: string; ids: Tab[] }[] = [
    { ids: ["log-games", "stats"] },
    { heading: "Manage", ids: ["bowlers", "centers", "events", "patterns"] },
    { heading: "Tools", ids: ["ball-seeker", "layout-visualizer", "speed-rev"] },
    { heading: "System", ids: ["data", "about"] },
  ];
  // A little flavor: an emoji per tab, shown before the sidebar label.
  const navIcons: Partial<Record<Tab, string>> = {
    home: "🏠",
    "log-games": "🎯",
    stats: "📊",
    bowlers: "👤",
    centers: "🏟️",
    events: "🏆",
    patterns: "🛢️",
    "ball-seeker": "🔍",
    "layout-visualizer": "📐",
    "speed-rev": "⚡",
    data: "💾",
    about: "ℹ️",
  };
  const currentPageLabel =
    activeTab === "home"
      ? "Home"
      : tabs.find((tab) => tab.id === activeTab)?.label ?? "Pin-Sighter";
  const showAppChrome = hasCheckedAppDataFile && hasCompletedSetup;
  // Resolve the main bowler: an explicit, still-valid pick wins; otherwise, if
  // there's exactly one bowler on the roster, default to them (a single-user
  // setup skips the composite); otherwise the all-bowlers composite ("").
  const effectiveMainBowler =
    mainBowler && bowlers.some((bowler) => bowler.name === mainBowler)
      ? mainBowler
      : bowlers.length === 1
        ? bowlers[0].name
        : "";

  return (
    <main className="app-shell">
      {!showAppChrome ? (
        <div className="app-onboarding">
          <section
            className="logo-card"
            onClick={requestGoHome}
            aria-label="Go to Pin-Sighter home"
          >
            <div className="logo-title-row">
              <img
                src={`${import.meta.env.BASE_URL}pin-sighter-logo-mark-110x160.png`}
                srcSet={`${import.meta.env.BASE_URL}pin-sighter-logo-mark-110x160.png 1x, ${import.meta.env.BASE_URL}pin-sighter-logo-mark-176x256.png 2x, ${import.meta.env.BASE_URL}pin-sighter-logo-mark-353x512.png 3x`}
                alt=""
                className="app-logo-mark"
                aria-hidden="true"
              />
              <h1>Pin-Sighter</h1>
            </div>
            <p>Bowling scorekeeping, set tracking, and performance reports</p>
          </section>

          {!hasCheckedAppDataFile ? (
            <section className="setup-card">
              <h2>Loading Pin-Sighter</h2>
              <p>Checking for a saved app data file. This should only take a moment.</p>
            </section>
          ) : (
            <section className="setup-card">
              <h2>Set Up Pin-Sighter</h2>
              <p>
                If you have existing Pin-Sighter data, import your backup to restore
                your bowlers, centers, patterns, and saved sets. Otherwise, you can
                start empty and build your own data from scratch.
              </p>

              <ToastMessage
                message={setupMessage}
                onDismiss={() => setSetupMessage("")}
              />

              <div className="setup-button-row">
                <label className="import-button setup-import-button">
                  Import Data
                  <input
                    type="file"
                    accept="application/json,.json"
                    onChange={handleSetupImportData}
                  />
                </label>
                <button className="secondary-button" onClick={handleStartEmpty}>
                  Start Empty
                </button>
              </div>
            </section>
          )}
        </div>
      ) : (
        <div className="shell-layout">
          <aside className={`app-sidebar ${sidebarOpen ? "is-open" : ""}`}>
            <button
              type="button"
              className="sidebar-brand"
              onClick={() => requestNavigate("home")}
              aria-label="Pin-Sighter home"
            >
              <img
                src={`${import.meta.env.BASE_URL}pin-sighter-logo-mark-110x160.png`}
                srcSet={`${import.meta.env.BASE_URL}pin-sighter-logo-mark-110x160.png 1x, ${import.meta.env.BASE_URL}pin-sighter-logo-mark-176x256.png 2x, ${import.meta.env.BASE_URL}pin-sighter-logo-mark-353x512.png 3x`}
                alt=""
                className="app-logo-mark"
                aria-hidden="true"
              />
              <span className="sidebar-brand-name">Pin-Sighter</span>
            </button>

            <nav className="sidebar-nav" aria-label="Primary">
              <button
                type="button"
                className={`sidebar-link ${activeTab === "home" ? "is-active" : ""}`}
                onClick={() => requestNavigate("home")}
                aria-current={activeTab === "home" ? "page" : undefined}
              >
                <span className="sidebar-link-icon" aria-hidden="true">
                  {navIcons.home}
                </span>
                <span className="sidebar-link-label">Home</span>
              </button>
              {navGroups.map((group, groupIndex) => (
                <div
                  className="sidebar-group"
                  key={group.heading ?? `group-${groupIndex}`}
                >
                  {group.heading && (
                    <p className="sidebar-group-heading">{group.heading}</p>
                  )}
                  {group.ids.map((id) => {
                    const tab = tabs.find((item) => item.id === id);
                    if (!tab) return null;
                    return (
                      <button
                        type="button"
                        key={tab.id}
                        className={`sidebar-link ${activeTab === tab.id ? "is-active" : ""} ${tab.wip ? "sidebar-link-wip" : ""}`}
                        onClick={() => requestNavigate(tab.id)}
                        aria-current={activeTab === tab.id ? "page" : undefined}
                      >
                        <span className="sidebar-link-icon" aria-hidden="true">
                          {navIcons[tab.id]}
                        </span>
                        <span className="sidebar-link-label">{tab.label}</span>
                        {tab.wip && <span className="nav-wip-badge">WIP</span>}
                      </button>
                    );
                  })}
                </div>
              ))}
            </nav>

            <div className="sidebar-foot">v{APP_VERSION} · local-first</div>
          </aside>

          <div
            className="sidebar-scrim"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />

          <div className="app-main">
            <header className="app-topbar">
              <button
                type="button"
                className="sidebar-toggle"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open navigation menu"
              >
                ☰
              </button>
              <h1 className="app-topbar-title">{currentPageLabel}</h1>
            </header>

            <div className="app-content">
              {activeTab === "home" ? (
                <HomePage
                  savedGames={savedGames}
                  bowlers={bowlers}
                  mainBowler={effectiveMainBowler}
                  onChangeMainBowler={setMainBowler}
                  onLogGame={() => requestNavigate("log-games")}
                  onOpenStats={() => requestNavigate("stats")}
                  onNewEvent={() => requestNavigate("events")}
                />
              ) : (
                <section className="page-card">

          {activeTab === "log-games" && (
            <LogGamesPage
              bowlers={bowlers}
              centers={centers}
              patterns={patterns}
              events={events}
              savedEventLogs={savedEventLogs}
              setSavedEventLogs={setSavedEventLogs}
              setSavedGames={setSavedGames}
              continueSavedSetRequest={continueSavedSetRequest}
              onConsumeContinueSavedSetRequest={() =>
                setContinueSavedSetRequest(null)
              }
              leaveGuardRef={leaveGuardRef}
            />
          )}
          {activeTab === "stats" && (
            <StatsPage
              bowlers={bowlers}
              centers={centers}
              patterns={patterns}
              events={events}
              savedGames={savedGames}
              setSavedGames={setSavedGames}
              savedEventLogs={savedEventLogs}
              setSavedEventLogs={setSavedEventLogs}
              mainBowler={effectiveMainBowler}
              onContinueSavedSet={(request) => {
                setContinueSavedSetRequest(request);
                setActiveTab("log-games");
              }}
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
          {activeTab === "ball-seeker" && (
            <ComingSoonPage
              title="Bowling Ball Seeker"
              tagline="A searchable ball catalog with price tracking."
              description="An AWS-backed bowling ball catalog and price-tracking system — search balls, pull retailer and manufacturer data, keep a watchlist, and get alerts when prices move."
              features={[
                "Searchable ball database with manufacturer and retailer data",
                "Price watchlists with drop alerts (Discord bot / commands)",
                "REST-style API with admin controls and Postman-tested endpoints",
              ]}
            />
          )}
          {activeTab === "layout-visualizer" && (
            <ComingSoonPage
              title="Bowling Ball Layout Visualizer"
              tagline="See a drilling layout before you drill it."
              description="A tool for plotting and previewing ball drilling layouts — pin, PSA/mass-bias, and PAP positions — so a layout can be visualized and compared before it's drilled."
              features={[
                "Enter pin-to-PAP and PSA-to-PAP distances",
                "Visualize the layout on a ball diagram",
                "Save and compare layouts across your arsenal",
              ]}
            />
          )}
          {activeTab === "speed-rev" && (
            <ComingSoonPage
              title="Speed Rev Checker"
              tagline="Estimate ball speed and rev rate from video."
              description="A video-based sports-tech prototype that estimates ball speed, rev rate, and a confidence score — and first checks whether a clip is even valid enough to analyze."
              features={[
                "Manual and semi-automated frame inputs to start",
                "Speed, rev-rate, and confidence estimates per shot",
                "Future computer vision with rotation tracking trained on sample video",
              ]}
            />
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
              setSavedEventLogs={setSavedEventLogs}
              savedGames={savedGames}
              setSavedGames={setSavedGames}
              backupData={backupData}
            />
          )}
          {activeTab === "about" && <AboutPage />}
                </section>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}



// About
// ==================

function ComingSoonPage({
  title,
  tagline,
  description,
  features,
}: {
  title: string;
  tagline: string;
  description: string;
  features: string[];
}) {
  return (
    <div className="coming-soon-page">
      <span className="coming-soon-badge">In Development</span>
      <h2>{title}</h2>
      <p className="coming-soon-tagline">{tagline}</p>
      <p className="coming-soon-description">{description}</p>

      <div className="coming-soon-card">
        <h3>What it will do</h3>
        <ul className="coming-soon-list">
          {features.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
      </div>

      <p className="coming-soon-note">
        This project is a work in progress and isn't available yet — it's here
        as a placeholder while it's being built. Check back in a future update.
      </p>
    </div>
  );
}



// Data Management
// ==================

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
  continueSavedSetRequest,
  onConsumeContinueSavedSetRequest,
  leaveGuardRef,
}: LogGamesPageProps) {
  const [showGameEntry, setShowGameEntry] = useState(false);
  const [resumeSavedSetRequest, setResumeSavedSetRequest] =
    useState<ContinueSavedSetRequest | null>(null);

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
  const [startingLane, setStartingLane] = useState("");
  const [selectedBowlers, setSelectedBowlers] = useState<string[]>([""]);

  useEffect(() => {
    if (!continueSavedSetRequest) {
      return;
    }

    const matchingEvent = events.find(
      (event) => event.id === continueSavedSetRequest.eventId
    );
    const matchingCenter = centers.find(
      (center) => center.name === continueSavedSetRequest.centerName
    );
    const matchingPattern = patterns.find(
      (pattern) => pattern.name === continueSavedSetRequest.patternName
    );

    setResumeSavedSetRequest(continueSavedSetRequest);
    setCompetitionType(continueSavedSetRequest.competitionType);
    setFormat(continueSavedSetRequest.format);
    setBowlersPerTeam(String(continueSavedSetRequest.bowlersPerTeam));
    setSelectedBowlers(continueSavedSetRequest.bowlerNames);
    setSelectedEventId(matchingEvent ? String(matchingEvent.id) : "");
    setSelectedEventStage(
      extractEventStageNumber(continueSavedSetRequest.eventStageLabel)
    );
    setSelectedCenterId(matchingCenter ? String(matchingCenter.id) : "");
    setSelectedPatternId(
      matchingPattern ? String(matchingPattern.id) : String(unknownPatternId)
    );
    setLaneMode(continueSavedSetRequest.laneMode);
    setStartingLaneOrPair(continueSavedSetRequest.startingLaneOrPair);
    setStartingLane(continueSavedSetRequest.startingLane);
    setShowGameEntry(true);
    onConsumeContinueSavedSetRequest();
  }, [
    continueSavedSetRequest,
    centers,
    events,
    patterns,
    onConsumeContinueSavedSetRequest,
  ]);

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

  useEffect(() => {
    if (patterns.length > 0 && !selectedPattern) {
      setSelectedPatternId(String(unknownPatternId));
    }
  }, [patterns, selectedPattern]);

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

  const gameEntryCenter =
    resumeSavedSetRequest !== null
      ? centers.find((center) => center.name === resumeSavedSetRequest.centerName)
      : selectedCenter;

  const laneOptions = useMemo<LaneOption[]>(() => {
    if (!gameEntryCenter) {
      return [];
    }

    if (laneMode === "Single Lane") {
      return Array.from({ length: gameEntryCenter.laneCount }, (_, index) => {
        const laneNumber = index + 1;

        return {
          value: String(laneNumber),
          label: `Lane ${laneNumber}`,
        };
      });
    }

    return Array.from(
      { length: Math.floor(gameEntryCenter.laneCount / 2) },
      (_, index) => {
        const leftLane = index * 2 + 1;
        const rightLane = leftLane + 1;

        return {
          value: `${leftLane}/${rightLane}`,
          label: `Pair ${leftLane}/${rightLane}`,
        };
      }
    );
  }, [gameEntryCenter, laneMode]);

  const startingLaneOptions = getStartingLaneOptions(laneMode, startingLaneOrPair);

  useEffect(() => {
    setStartingLane(getDefaultStartingLane(laneMode, startingLaneOrPair));
  }, [laneMode, startingLaneOrPair]);

  function handleCompetitionTypeChange(newCompetitionType: CompetitionType) {
    setCompetitionType(newCompetitionType);
    setSelectedEventId("");
    setSelectedEventStage("");
    setHasVacantOrBlindBowlers(false);
    setSelectedCenterId("");
    setSelectedPatternId("0");
    setStartingLaneOrPair("");
    setStartingLane("");
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
    setStartingLane("");

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
    setStartingLane("");
  }

  function handleLaneModeChange(newLaneMode: string) {
    setLaneMode(newLaneMode);
    setStartingLaneOrPair("");
    setStartingLane("");
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

  const selectedPatternIsDuelPattern = isDuelPattern(selectedPattern);

  const canStartGame =
    hasRequiredEvent &&
    hasRequiredEventStage &&
    selectedCenter !== undefined &&
    selectedPattern !== undefined &&
    (!selectedPatternIsDuelPattern || laneMode === "Pair") &&
    startingLaneOrPair !== "" &&
    (laneMode !== "Pair" || startingLane !== "") &&
    hasEnoughBowlers &&
    !hasDuplicateBowlers &&
    activeBowlersPerPair >= 1 &&
    !alreadyLoggedEventStage;

  const setupValidationMessages = [
    !hasRequiredEvent
      ? `Choose a ${competitionType.toLowerCase()} before logging.`
      : "",
    !hasRequiredEventStage
      ? `Choose a ${eventStageSingular.toLowerCase()} for this ${competitionType.toLowerCase()}.`
      : "",
    selectedCenter === undefined ? "Choose a bowling center." : "",
    selectedPattern === undefined ? "Choose a pattern." : "",
    selectedPatternIsDuelPattern && laneMode !== "Pair"
      ? "Duel patterns can only be used when Lane Mode is set to Pair."
      : "",
    activeBowlersPerPair < 1 ? "Enter at least 1 bowler per pair." : "",
    startingLaneOrPair === "" ? "Choose a starting lane or pair." : "",
    laneMode === "Pair" && startingLane === ""
      ? "Choose which lane you are starting on."
      : "",
    !hasEnoughBowlers
      ? activeFormat === "Baker"
        ? "Choose at least the first 2 Baker bowlers."
        : "Choose at least one bowler."
      : "",
    hasDuplicateBowlers ? "Each selected bowler must be unique." : "",
    alreadyLoggedEventStage
      ? `This ${eventStageSingular.toLowerCase()} already has saved data. Delete the original saved log before logging it again.`
      : "",
  ].filter(Boolean);

  const bowlersForGame = activeBowlers;

  if (showGameEntry) {
    const gameEntryRequest = resumeSavedSetRequest;
    const gameEntryStartingLaneOrPair =
      gameEntryRequest?.startingLaneOrPair ?? startingLaneOrPair;
    const gameEntryLaneMode = gameEntryRequest?.laneMode ?? laneMode;
    const gameEntryStartingLane =
      gameEntryRequest?.startingLane ||
      startingLane ||
      getDefaultStartingLane(gameEntryLaneMode, gameEntryStartingLaneOrPair);

    return (
      <GameEntryPage
        bowlers={bowlers}
        bowlerNames={gameEntryRequest?.bowlerNames ?? bowlersForGame}
        competitionType={gameEntryRequest?.competitionType ?? competitionType}
        format={gameEntryRequest?.format ?? activeFormat}
        bowlersPerTeam={gameEntryRequest?.bowlersPerTeam ?? activeBowlersPerPair}
        centerName={gameEntryRequest?.centerName ?? selectedCenter?.name ?? "Unknown Center"}
        patternName={gameEntryRequest?.patternName ?? selectedPattern?.name ?? "Unknown Pattern"}
        eventStageLabel={gameEntryRequest?.eventStageLabel ?? eventStageLabel}
        eventLogKey={gameEntryRequest?.eventLogKey ?? eventLogKey}
        eventName={gameEntryRequest?.eventName ?? selectedEvent?.name ?? ""}
        eventId={gameEntryRequest?.eventId ?? selectedEvent?.id ?? null}
        laneMode={gameEntryLaneMode}
        startingLaneOrPair={gameEntryStartingLaneOrPair}
        startingLane={gameEntryStartingLane}
        laneOptions={laneOptions}
        seriesGameCount={gameEntryRequest?.seriesGameCount ?? seriesGameCount}
        resumeSessionId={gameEntryRequest?.sessionId}
        resumeCreatedAt={gameEntryRequest?.createdAt}
        initialGameNumber={gameEntryRequest?.initialGameNumber}
        firstGameNumberToSave={gameEntryRequest?.firstGameNumberToSave}
        initialCompletedGames={gameEntryRequest?.existingCompletedGames}
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
        onBack={() => {
          setShowGameEntry(false);
          setResumeSavedSetRequest(null);
        }}
        leaveGuardRef={leaveGuardRef}
      />
    );
  }

  return (
    <>
      <h2>Log Games</h2>
      <p>
        Set up an open, league, or tournament session before entering shot data.
      </p>

      {!canStartGame && setupValidationMessages.length > 0 && (
        <section
          className={
            alreadyLoggedEventStage
              ? "field-validation-card error-validation-card"
              : "field-validation-card"
          }
          id="log-setup-validation"
          aria-live="polite"
        >
          <h3>Before Starting</h3>
          <ul>
            {setupValidationMessages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </section>
      )}

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
              aria-invalid={!hasRequiredEvent}
              aria-describedby={!hasRequiredEvent ? "log-setup-validation" : undefined}
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
            aria-invalid={activeBowlersPerPair < 1}
            aria-describedby={
              activeBowlersPerPair < 1 ? "log-setup-validation" : undefined
            }
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
              aria-invalid={selectedCenter === undefined}
              aria-describedby={
                selectedCenter === undefined ? "log-setup-validation" : undefined
              }
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
            aria-invalid={
              selectedPattern === undefined ||
              (selectedPatternIsDuelPattern && laneMode !== "Pair")
            }
            aria-describedby={
              selectedPattern === undefined ||
              (selectedPatternIsDuelPattern && laneMode !== "Pair")
                ? "log-setup-validation"
                : undefined
            }
            onChange={(event) => setSelectedPatternId(event.target.value)}
          >
            {patterns.map((pattern) => (
              <option key={pattern.id} value={pattern.id}>
                {formatPatternDropdownLabel(pattern)}
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
            aria-invalid={startingLaneOrPair === ""}
            aria-describedby={
              startingLaneOrPair === "" ? "log-setup-validation" : undefined
            }
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

        {laneMode === "Pair" && startingLaneOrPair && (
          <label>
            Starting Lane <span className="required">*</span>
            <select
              value={startingLane}
              aria-invalid={startingLane === ""}
              aria-describedby={
                startingLane === "" ? "log-setup-validation" : undefined
              }
              onChange={(event) => setStartingLane(event.target.value)}
            >
              {startingLaneOptions.map((lane) => (
                <option key={lane} value={lane}>
                  Lane {lane}
                </option>
              ))}
            </select>
          </label>
        )}
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
  startingLane,
  laneOptions,
  seriesGameCount,
  resumeSessionId,
  resumeCreatedAt,
  initialGameNumber = 1,
  firstGameNumberToSave = 1,
  initialCompletedGames = [],
  onSavedEventLog,
  onSaveCompletedGames,
  onBack,
  leaveGuardRef,
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

  const initialStartingLane = getDefaultStartingLane(
    laneMode,
    startingLaneOrPair,
    startingLane
  );

  const sessionIdRef = useRef(
    resumeSessionId ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
  const sessionCreatedAtRef = useRef(resumeCreatedAt ?? new Date().toISOString());

  const [gameNumber, setGameNumber] = useState(initialGameNumber);
  const [currentStartingLaneOrPair, setCurrentStartingLaneOrPair] =
    useState(startingLaneOrPair);
  const [currentStartingLane, setCurrentStartingLane] =
    useState(initialStartingLane);
  const [nextLaneOrPair, setNextLaneOrPair] = useState(startingLaneOrPair);
  const [nextStartingLane, setNextStartingLane] = useState(() =>
    getDefaultNextStartingLane(
      laneMode,
      startingLaneOrPair,
      initialStartingLane,
      competitionType
    )
  );
  const [showNextGameSetup, setShowNextGameSetup] = useState(false);
  const [activeShot, setActiveShot] = useState(1);

  const [completedGames, setCompletedGames] = useState<CompletedGameSummary[]>(
    () =>
      initialCompletedGames.map((game) => ({
        ...game,
        scores: game.scores.map((score) => ({ ...score })),
        entries: game.entries.map(cloneFrameEntryForEditing),
      }))
  );

  const [bowlerCarryovers, setBowlerCarryovers] = useState<
    Record<string, CarryoverFields>
  >({});

  function getCarryoverSlot(frameNumber: number) {
    if (laneMode !== "Pair") {
      return "single";
    }

    return frameNumber % 2 === 1 ? "pair-odd" : "pair-even";
  }

  function getCarryoverKey(bowlerName: string, frameNumber: number) {
    return `${bowlerName}:${getCarryoverSlot(frameNumber)}`;
  }

  function buildEntries(
    carryovers: Record<string, CarryoverFields>
  ): FrameEntry[] {
    return frameOrder.map((entry) => {
      const carryover = carryovers[
        getCarryoverKey(entry.bowlerName, entry.frameNumber)
      ];

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

  // Which balls are relevant for this frame, and the config for the one
  // currently shown in the single (switchable) pin deck.
  const availableShots = [1];
  if (shouldShowSecondShot) availableShots.push(2);
  if (shouldShowThirdShot) availableShots.push(3);

  const activeShotConfig =
    activeShot === 3
      ? {
          title: "Third Ball Pin Deck",
          help: "Tenth-frame fill shot. Default is strike or spare conversion; deselect pins left standing.",
          knockedPins: currentEntry.thirdShotKnockedPins,
          availablePins: thirdShotAvailablePins as number[] | undefined,
          onChange: (knockedPins: number[]) =>
            updateCurrentEntry({ thirdShotKnockedPins: knockedPins }),
        }
      : activeShot === 2
      ? {
          title: "Second Ball Pin Deck",
          help:
            isTenthFrame && isStrike
              ? "Tenth-frame bonus shot. Default is strike; deselect pins left standing."
              : "Default is spare conversion; deselect pins left standing after the spare attempt.",
          knockedPins: currentEntry.secondShotKnockedPins,
          availablePins: secondShotAvailablePins as number[] | undefined,
          onChange: updateSecondShotPins,
        }
      : {
          title: "First Ball Pin Deck",
          help: "Click the pins that were knocked down. Pins not selected are treated as standing.",
          knockedPins: currentEntry.firstShotKnockedPins,
          availablePins: undefined as number[] | undefined,
          onChange: updateFirstShotPins,
        };

  // Deck arrows step through every ball of the game in order: within a frame
  // they move between balls, and at the ends they roll into the adjacent frame.
  const activeShotIndex = availableShots.indexOf(activeShot);
  const hasPrevShot = activeShotIndex > 0 || currentEntryIndex > 0;
  const hasNextShot =
    activeShotIndex < availableShots.length - 1 ||
    currentEntryIndex < maxUnlockedIndex;

  function goToPreviousShot() {
    if (activeShotIndex > 0) {
      setActiveShot(availableShots[activeShotIndex - 1]);
    } else if (currentEntryIndex > 0) {
      goToPreviousEntry();
    }
  }

  function goToNextShot() {
    if (activeShotIndex < availableShots.length - 1) {
      setActiveShot(availableShots[activeShotIndex + 1]);
    } else if (currentEntryIndex < maxUnlockedIndex) {
      goToNextEntry();
    }
  }

  // Reset to the first ball whenever we move to a different frame.
  useEffect(() => {
    setActiveShot(1);
  }, [currentEntryIndex]);

  // Keep the active ball valid if it becomes unavailable (e.g. a strike).
  useEffect(() => {
    if (!availableShots.includes(activeShot)) {
      setActiveShot(availableShots[availableShots.length - 1]);
    }
  }, [activeShot, shouldShowSecondShot, shouldShowThirdShot]);

  // Latest handlers for the keyboard listener (avoids stale closures).
  const shotNavRef = useRef({ goToPreviousShot, goToNextShot });
  shotNavRef.current = { goToPreviousShot, goToNextShot };

  // Left / right arrow keys step balls (rolling into frames), unless typing.
  useEffect(() => {
    function handleShotKey(event: KeyboardEvent) {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      const tag = (document.activeElement as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      event.preventDefault();
      if (event.key === "ArrowRight") shotNavRef.current.goToNextShot();
      else shotNavRef.current.goToPreviousShot();
    }
    window.addEventListener("keydown", handleShotKey);
    return () => window.removeEventListener("keydown", handleShotKey);
  }, []);

  // While Game Entry is mounted, guard navigation home (logo / Back) so
  // in-progress shots aren't discarded without confirming.
  useEffect(() => {
    leaveGuardRef.current = () => {
      if (!hasUnsavedProgress()) return true;
      return window.confirm(
        "Leave the current game? Unsaved shot data for this game will be lost."
      );
    };
    return () => {
      leaveGuardRef.current = null;
    };
  });

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
      ballUsed: carryover.ballUsed,
      footBoard: carryover.footBoard,
      targetArrow: carryover.targetArrow,
      targetBreakpoint: carryover.targetBreakpoint,
      actualArrow: carryover.actualArrow,
      actualBreakpoint: carryover.actualBreakpoint,
    };
  }

  function completeCurrentEntry() {
    const nextIndex = currentEntryIndex + 1;
    const currentCarryover = getCarryoverFromEntry(currentEntry);
    const currentCarryoverKey = getCarryoverKey(
      currentEntry.bowlerName,
      currentEntry.frameNumber
    );

    const updatedCarryovers = {
      ...bowlerCarryovers,
      [currentCarryoverKey]: currentCarryover,
    };

    setBowlerCarryovers(updatedCarryovers);

    const updatedEntries = [...entries];

    updatedEntries[currentEntryIndex] = {
      ...updatedEntries[currentEntryIndex],
      isComplete: true,
    };

    if (nextIndex < updatedEntries.length) {
      const nextEntry = updatedEntries[nextIndex];
      const nextCarryoverKey = getCarryoverKey(
        nextEntry.bowlerName,
        nextEntry.frameNumber
      );

      updatedEntries[nextIndex] = applyCarryoverToEntry(
        nextEntry,
        updatedCarryovers[nextCarryoverKey]
      );
    }

    setEntries(updatedEntries);

    if (isLastEntry) {
      const scores = calculateScoresForGame(updatedEntries, bowlerNames, format);
      const laneLabel = formatGameLaneLabel(
        laneMode,
        currentStartingLaneOrPair,
        currentStartingLane
      );

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
    const completedGamesToSave = completedGames.filter(
      (game) => game.gameNumber >= firstGameNumberToSave
    );

    if (completedGamesToSave.length === 0) {
      window.alert("Complete at least one new game before saving.");
      return;
    }

    if (
      !isGameComplete &&
      !window.confirm(
        "The current game is not complete. Save only the completed games and discard the unfinished game?"
      )
    ) {
      return;
    }

    const savedAt = new Date().toISOString();
    const sessionId = sessionIdRef.current;
    const createdAt = sessionCreatedAtRef.current;

    if (completedGamesToSave.length > 0) {
      onSaveCompletedGames(
        completedGamesToSave.map((game) => ({
          id: `${sessionId}-${game.gameNumber}`,
          sessionId,
          createdAt,
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
            thirdShotKnockedPins: [...entry.thirdShotKnockedPins],
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

  function handleNextLaneOrPairChange(newLaneOrPair: string) {
    setNextLaneOrPair(newLaneOrPair);
    setNextStartingLane(getDefaultStartingLane(laneMode, newLaneOrPair));
  }

  function handleStartAnotherGame() {
    if (isLastGameInSeries) {
      return;
    }

    const nextGameStartingLane =
      laneMode === "Pair"
        ? nextStartingLane || getDefaultStartingLane(laneMode, nextLaneOrPair)
        : nextLaneOrPair;

    setCurrentStartingLaneOrPair(nextLaneOrPair);
    setCurrentStartingLane(nextGameStartingLane);
    setGameNumber((currentGameNumber) => currentGameNumber + 1);
    setEntries(buildEntries(bowlerCarryovers));
    setCurrentEntryIndex(0);
    setMaxUnlockedIndex(0);
    setNextStartingLane(
      getDefaultNextStartingLane(
        laneMode,
        nextLaneOrPair,
        nextGameStartingLane,
        competitionType
      )
    );
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
        {laneMode === "Pair" && (
          <p>
            <strong>Starting Lane:</strong> Lane {currentStartingLane}
          </p>
        )}
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
          <span>
            {formatFrameLaneLabel(
              laneMode,
              currentStartingLaneOrPair,
              currentStartingLane,
              currentEntry.frameNumber
            )}
          </span>
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
              <h3>{activeShotConfig.title}</h3>
              <p className="helper-text">{activeShotConfig.help}</p>

              <PinDeck
                knockedPins={activeShotConfig.knockedPins}
                availablePins={activeShotConfig.availablePins}
                onChange={activeShotConfig.onChange}
                onPrevShot={goToPreviousShot}
                onNextShot={goToNextShot}
                hasPrevShot={hasPrevShot}
                hasNextShot={hasNextShot}
                hideActions
              />
            </div>
          </div>

          <div className="pin-entry-side">
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

            <div className="deck-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  activeShotConfig.onChange(
                    [...(activeShotConfig.availablePins ?? ALL_PINS)].sort(
                      (a, b) => a - b
                    )
                  )
                }
              >
                Select All
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => activeShotConfig.onChange([])}
              >
                Clear
              </button>
              <button
                className="primary-button complete-frame-button"
                disabled={isGameComplete}
                onClick={completeCurrentEntry}
              >
                {isLastEntry ? "Complete Game" : "Complete Frame"}
              </button>
            </div>
          </div>
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
                    onChange={(event) =>
                      handleNextLaneOrPairChange(event.target.value)
                    }
                  >
                    {laneOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                {laneMode === "Pair" && nextLaneOrPair && (
                  <label>
                    Starting Lane
                    <select
                      value={nextStartingLane}
                      onChange={(event) =>
                        setNextStartingLane(event.target.value)
                      }
                    >
                      {getStartingLaneOptions(laneMode, nextLaneOrPair).map(
                        (lane) => (
                          <option key={lane} value={lane}>
                            Lane {lane}
                          </option>
                        )
                      )}
                    </select>
                  </label>
                )}

                <button
                  className="primary-button"
                  disabled={!nextLaneOrPair || (laneMode === "Pair" && !nextStartingLane)}
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

// Scoring Helpers
// ==================


function extractEventStageNumber(eventStageLabel: string) {
  const match = eventStageLabel.match(/\d+/);

  return match?.[0] ?? "";
}

function parseSavedGameLaneLabel(laneLabel: string) {
  const pairMatch = laneLabel.match(/Pair\s+([0-9]+\/[0-9]+)/i);
  const laneMatch = laneLabel.match(/Lane\s+([0-9]+)/i);
  const startLaneMatch = laneLabel.match(/Start Lane\s+([0-9]+)/i);

  if (pairMatch) {
    return {
      laneMode: "Pair",
      startingLaneOrPair: pairMatch[1],
      startingLane: startLaneMatch?.[1] ?? pairMatch[1].split("/")[0] ?? "",
    };
  }

  if (laneMatch) {
    return {
      laneMode: "Single Lane",
      startingLaneOrPair: laneMatch[1],
      startingLane: laneMatch[1],
    };
  }

  return {
    laneMode: "Pair",
    startingLaneOrPair: "",
    startingLane: "",
  };
}

function getNextGameLaneSetup(game: SavedGameRecord) {
  const currentLaneSetup = parseSavedGameLaneLabel(game.laneLabel);
  const nextStartingLane = getDefaultNextStartingLane(
    currentLaneSetup.laneMode,
    currentLaneSetup.startingLaneOrPair,
    currentLaneSetup.startingLane,
    game.competitionType
  );

  return {
    ...currentLaneSetup,
    startingLane: nextStartingLane,
  };
}

function savedGameToCompletedGameSummary(
  game: SavedGameRecord
): CompletedGameSummary {
  return {
    gameNumber: game.gameNumber,
    laneLabel: game.laneLabel,
    scores: game.scores.map((score) => ({ ...score })),
    entries: game.entries.map(cloneFrameEntryForEditing),
  };
}

function getStartingLaneOptions(laneMode: string, laneOrPair: string) {
  if (!laneOrPair) {
    return [];
  }

  if (laneMode !== "Pair") {
    return [laneOrPair];
  }

  return laneOrPair.split("/").filter(Boolean);
}

function getDefaultStartingLane(
  laneMode: string,
  laneOrPair: string,
  preferredStartingLane = ""
) {
  const laneOptions = getStartingLaneOptions(laneMode, laneOrPair);

  if (preferredStartingLane && laneOptions.includes(preferredStartingLane)) {
    return preferredStartingLane;
  }

  return laneOptions[0] ?? "";
}

function getOppositeStartingLane(laneOrPair: string, currentStartingLane: string) {
  const laneOptions = getStartingLaneOptions("Pair", laneOrPair);

  if (laneOptions.length < 2) {
    return currentStartingLane || laneOptions[0] || "";
  }

  return currentStartingLane === laneOptions[0] ? laneOptions[1] : laneOptions[0];
}

function getDefaultNextStartingLane(
  laneMode: string,
  laneOrPair: string,
  currentStartingLane: string,
  competitionType: CompetitionType
) {
  if (laneMode !== "Pair") {
    return getDefaultStartingLane(laneMode, laneOrPair, currentStartingLane);
  }

  if (competitionType === "League") {
    return getOppositeStartingLane(laneOrPair, currentStartingLane);
  }

  return getDefaultStartingLane(laneMode, laneOrPair, currentStartingLane);
}

function getActiveFrameLane(
  laneMode: string,
  laneOrPair: string,
  startingLane: string,
  frameNumber: number
) {
  if (laneMode !== "Pair") {
    return laneOrPair;
  }

  const laneOptions = getStartingLaneOptions(laneMode, laneOrPair);
  const firstLane = getDefaultStartingLane(laneMode, laneOrPair, startingLane);
  const otherLane =
    laneOptions.find((lane) => lane !== firstLane) ?? firstLane;

  return frameNumber % 2 === 1 ? firstLane : otherLane;
}

function formatLaneLabel(laneMode: string, laneOrPair: string) {
  return laneMode === "Pair" ? `Pair ${laneOrPair}` : `Lane ${laneOrPair}`;
}

function formatGameLaneLabel(
  laneMode: string,
  laneOrPair: string,
  startingLane: string
) {
  if (laneMode !== "Pair") {
    return formatLaneLabel(laneMode, laneOrPair);
  }

  return `${formatLaneLabel(laneMode, laneOrPair)} — Start Lane ${startingLane}`;
}

function formatFrameLaneLabel(
  laneMode: string,
  laneOrPair: string,
  startingLane: string,
  frameNumber: number
) {
  return `Lane ${getActiveFrameLane(
    laneMode,
    laneOrPair,
    startingLane,
    frameNumber
  )}`;
}

function formatScoreMarksForExport(marks: ScoreMark[]) {
  const markText = marks.map((mark) => mark.value).filter(Boolean).join("");

  return markText || "";
}

function formatScorecardFrameForExport(
  entry: FrameEntry | undefined,
  cumulativeScore: number | string | undefined
) {
  if (!entry) {
    return "";
  }

  const markText = formatScoreMarksForExport(getFrameMarks(entry));
  const scoreText =
    cumulativeScore === undefined || cumulativeScore === ""
      ? ""
      : ` (${cumulativeScore})`;

  return `${markText}${scoreText}`;
}

function getUniqueBallSummary(entries: FrameEntry[]) {
  const uniqueBalls = Array.from(
    new Set(entries.map((entry) => entry.ballUsed).filter(Boolean))
  );

  return uniqueBalls.length > 0 ? uniqueBalls.join(", ") : "";
}


// Stats
// ==================

// When a Stats filter changes, these dependent filters are reset to "All" so
// their controls collapse and can't hold a selection that no longer fits.
type ResettableFilterKey =
  | "selection"
  | "bakerBowler"
  | "ball"
  | "eventName"
  | "eventStage"
  | "set"
  | "game"
  | "lane";

const statsFilterDependents: Record<string, ResettableFilterKey[]> = {
  mode: ["selection", "bakerBowler", "ball"],
  selection: ["bakerBowler", "ball"],
  bakerBowler: ["ball"],
  competition: ["eventName", "eventStage", "set", "game", "lane"],
  eventName: ["eventStage", "set", "game"],
  eventStage: ["set", "game"],
  set: ["game"],
  center: ["lane", "set", "game"],
  pattern: ["set", "game"],
  lane: ["set", "game"],
};

// Styling for the exported HTML / print-to-PDF Stats report — kl-ui "Scope Red"
// theme so the report matches the app (soft surfaces, hairline borders, Space
// Mono figures, accent-highlighted key metrics).
const STATS_REPORT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap');
:root{
  --accent:#e5241f; --accent-ink:#c11a17; --accent-soft:#fdeceb; --accent-soft-bd:#f7cecc;
  --ink:#0e1526; --ink-soft:#46536b; --ink-faint:#75839a;
  --line:#ece9f2; --line-strong:#dfe1ea; --paper:#fff; --bg:#f6f7f9; --bg-tint:#f7f8fa;
  --radius:16px; --radius-sm:12px;
  --shadow:0 2px 4px rgba(16,25,45,.03), 0 12px 30px -12px rgba(16,25,45,.10);
}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);
  font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.5;
  -webkit-font-smoothing:antialiased;}
.page{max-width:1080px;margin:0 auto;padding:32px 28px 56px;}
.tile-value,td.num,th.num{font-family:'Space Mono','SFMono-Regular',ui-monospace,Menlo,Consolas,monospace;font-variant-numeric:tabular-nums;}
.report-head{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;
  padding-bottom:18px;border-bottom:2px solid var(--accent);margin-bottom:26px;flex-wrap:wrap;}
.brand{display:flex;align-items:center;gap:14px;}
.brand .mark{width:34px;height:34px;border-radius:50%;flex:0 0 auto;
  background:radial-gradient(circle at 50% 50%, #fff 0 22%, var(--accent) 24% 44%, #fff 46% 60%, var(--accent) 62% 82%, #fff 84%);
  box-shadow:0 0 0 2px var(--accent-soft-bd);}
.brand h1{margin:0;font-size:1.5rem;font-weight:800;letter-spacing:-.02em;}
.brand .sub{margin:2px 0 0;color:var(--accent-ink);font-weight:600;font-size:.82rem;text-transform:uppercase;letter-spacing:.08em;}
.meta{display:flex;flex-direction:column;align-items:flex-end;gap:2px;color:var(--ink-faint);font-size:.82rem;text-align:right;}
.meta strong{color:var(--ink);}
.overview{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin:0 0 30px;}
.tile{background:var(--paper);border:1px solid var(--line);border-radius:var(--radius-sm);padding:14px 16px;
  display:flex;flex-direction:column;gap:4px;box-shadow:var(--shadow);}
.tile-value{font-size:1.7rem;font-weight:700;line-height:1;color:var(--ink);}
.tile-label{font-size:.72rem;text-transform:uppercase;letter-spacing:.06em;color:var(--ink-faint);font-weight:600;}
.tile.hero{background:linear-gradient(180deg,#fff, var(--accent-soft));border-color:var(--accent-soft-bd);}
.tile.hero .tile-value{color:var(--accent-ink);font-size:2rem;}
.tile.hero .tile-label{color:var(--accent-ink);}
.report-section{margin:0 0 26px;page-break-inside:avoid;}
.report-section h2{font-size:1.02rem;font-weight:700;margin:0 0 10px;padding-left:11px;position:relative;letter-spacing:-.01em;}
.report-section h2::before{content:"";position:absolute;left:0;top:.15em;bottom:.15em;width:4px;border-radius:2px;background:var(--accent);}
.table-wrap{overflow-x:auto;border:1px solid var(--line);border-radius:var(--radius-sm);box-shadow:var(--shadow);background:var(--paper);}
table{width:100%;border-collapse:collapse;font-size:.86rem;}
thead th{background:var(--bg-tint);color:var(--ink-soft);text-align:left;font-weight:600;font-size:.7rem;
  text-transform:uppercase;letter-spacing:.05em;padding:10px 12px;border-bottom:1px solid var(--line-strong);white-space:nowrap;}
tbody td{padding:9px 12px;border-bottom:1px solid var(--line);vertical-align:top;color:var(--ink-soft);}
tbody tr:last-child td{border-bottom:none;}
tbody tr:nth-child(even){background:var(--bg-tint);}
th.num,td.num{text-align:right;white-space:nowrap;}
td.emph{color:var(--ink);font-weight:700;}
th.emph{color:var(--accent-ink);}
.perfect-pill{display:inline-block;background:var(--accent);color:#fff;font-weight:700;
  padding:1px 9px;border-radius:999px;font-size:.82rem;box-shadow:0 1px 2px rgba(229,36,31,.4);}
td.empty{text-align:center;color:var(--ink-faint);font-style:italic;padding:16px;}
@media print{
  body{background:#fff;} .page{padding:0;max-width:none;}
  .tile,.table-wrap{box-shadow:none;}
  thead th{-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  table{font-size:.72rem;} tbody td,thead th{padding:5px 7px;}
}
`;

function StatsPage({
  bowlers,
  centers,
  patterns,
  events,
  savedGames,
  setSavedGames,
  setSavedEventLogs,
  mainBowler,
  onContinueSavedSet,
}: StatsPageProps) {
  // Seed the scope from the app's main bowler: if one is set, open pre-scoped
  // to that bowler (Individual). Still fully changeable afterwards.
  const [filters, setFilters] = useState<StatsFilters>(() =>
    mainBowler
      ? { ...defaultStatsFilters, mode: "individual", selection: mainBowler }
      : { ...defaultStatsFilters },
  );
  // Bumped whenever the filters change, so the collapsible sections below
  // remount and collapse back to their default (closed) state on any change.
  const [filterEpoch, setFilterEpoch] = useState(0);
  const [isExportPanelOpen, setIsExportPanelOpen] = useState(false);
  const exportModalRef = useRef<HTMLElement | null>(null);
  const [selectedDetailedStat, setSelectedDetailedStat] =
    useState<DetailedStatDetail | null>(null);
  const detailedStatModalRef = useRef<HTMLElement | null>(null);
  const [exportFormat, setExportFormat] = useState<StatsExportFormat>("html");
  const [exportSections, setExportSections] = useState<StatsExportSections>({
    ...defaultStatsExportSections,
  });
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
  const [toastMessage, setToastMessage] = useState("");

  // Stable "now" for the whole render pass — injected into the time-frame math
  // so filtering is deterministic (no Date.now() sprinkled through the module).
  const now = useMemo(() => new Date(), []);

  // --- Filter adapter -------------------------------------------------------
  // The source of truth is `filters` (the statsFilters model). Downstream stat
  // math + exports still read these legacy per-field names; deriving them here
  // keeps that code untouched while the engine underneath is the tested module.
  // In baker mode `selection` is the "Baker Team: …" label, so the existing
  // `isBakerTeamSelection = selectedBowler.startsWith("Baker Team:")` still holds.
  const selectedBowler = filters.mode === "all" ? "All" : filters.selection;
  const selectedBakerBowler = filters.bakerBowler;
  const selectedBall = filters.ball;
  const selectedCompetition = filters.competition;
  const selectedEventName = filters.eventName;
  const selectedCenter = filters.center;
  const selectedLane = filters.lane;
  const selectedPattern = filters.pattern;
  const selectedEventStage = filters.eventStage;
  const selectedSetKey = filters.set;
  const selectedGameNumber = filters.game;

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => setToastMessage(""), 3000);

    return () => window.clearTimeout(timeoutId);
  }, [toastMessage]);

  useEffect(() => {
    if (!isExportPanelOpen) {
      return;
    }

    const unlockDocumentScroll = lockDocumentScroll();
    const previouslyFocusedElement = document.activeElement as HTMLElement | null;

    window.setTimeout(() => exportModalRef.current?.focus(), 0);

    function handleExportModalKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsExportPanelOpen(false);
        return;
      }

      trapFocusWithinElement(event, exportModalRef.current);
    }

    document.addEventListener("keydown", handleExportModalKeyDown);

    return () => {
      document.removeEventListener("keydown", handleExportModalKeyDown);
      unlockDocumentScroll();
      previouslyFocusedElement?.focus();
    };
  }, [isExportPanelOpen]);

  useEffect(() => {
    if (!selectedDetailedStat) {
      return;
    }

    const unlockDocumentScroll = lockDocumentScroll();
    const previouslyFocusedElement = document.activeElement as HTMLElement | null;

    window.setTimeout(() => detailedStatModalRef.current?.focus(), 0);

    function handleDetailedStatModalKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedDetailedStat(null);
        return;
      }

      trapFocusWithinElement(event, detailedStatModalRef.current);
    }

    document.addEventListener("keydown", handleDetailedStatModalKeyDown);

    return () => {
      document.removeEventListener("keydown", handleDetailedStatModalKeyDown);
      unlockDocumentScroll();
      previouslyFocusedElement?.focus();
    };
  }, [selectedDetailedStat]);

  const isBakerTeamSelection = selectedBowler.startsWith("Baker Team:");
  // Baker universe = Baker scope, whether "All teams" or one specific team.
  // Stats aggregate across it; `isBakerTeamSelection` stays for the one control
  // (the Baker Bowler drill-in) that needs a specific team.
  const isBakerUniverse = filters.mode === "baker";
  const usesEventFilter =
    selectedCompetition === "League" || selectedCompetition === "Tournament";
  const usesSetFilter =
    (usesEventFilter && selectedEventName !== "All") ||
    selectedCompetition === "Open";
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


  const filterOptions = deriveOptions(savedGames, filters, now);
  const selectionOptions = filterOptions.selection;
  // The per-bowler breakdown table iterates every individual bowler in scope
  // (independent of the current pick). In baker mode that table is hidden, and
  // `selection` options are team labels, so fall back to an empty list there.
  const individualBowlerOptions =
    filters.mode === "baker"
      ? []
      : deriveOptions(savedGames, { ...filters, mode: "individual" }, now)
          .selection;
  const bakerBowlerOptions = filterOptions.bakerBowler;
  const ballOptions = filterOptions.ball;
  const competitionOptions = filterOptions.competition;
  const eventOptions = filterOptions.eventName;
  const eventStageOptions = filterOptions.eventStage;
  const centerOptions = filterOptions.center;
  const laneOptions = filterOptions.lane;
  const patternOptions = filterOptions.pattern;
  const gameOptions = filterOptions.game;
  const setOptions = buildSetFilterOptions(
    filterGames(savedGames, { ...filters, set: "All", game: "All" }, now)
  );

  const filteredGames = filterGames(savedGames, filters, now);
  // filterGames already applies the universe (Baker vs individual), so the
  // in-scope set needs no second Baker pass. Baker games are an explicit mode
  // now, never silently dropped — so nothing is "hidden".
  const statsFilteredGames = filteredGames;
  const hiddenBakerGameCount = 0;

  function updateFilters(patch: Partial<StatsFilters>) {
    const draft: StatsFilters = { ...filters, ...patch };

    // When a field changes, proactively reset the filters that depend on it so
    // the dependent controls below collapse instead of holding a now-moot pick.
    // Mirrors the classic cascade (competition → event/week/set/game/lane, etc.).
    const forced: string[] = [];
    for (const changedKey of Object.keys(patch)) {
      for (const child of statsFilterDependents[changedKey] ?? []) {
        if (draft[child] !== "All") {
          draft[child] = "All";
          forced.push(child);
        }
      }
    }

    const draftOptions = deriveOptions(savedGames, draft, now);
    const { filters: resolved, cleared } = resolveFilters(draft, draftOptions);
    setFilters(resolved);
    setFilterEpoch((epoch) => epoch + 1);

    const resetKeys = Array.from(new Set([...forced, ...cleared]));
    if (resetKeys.length > 0) {
      const labels: Record<string, string> = {
        selection: "Scope",
        bakerBowler: "Baker Bowler",
        ball: "Ball",
        competition: "Competition",
        eventName: "Event",
        eventStage: "Week / Day",
        center: "Center",
        lane: "Lane",
        pattern: "Pattern",
        set: "Set",
        game: "Game",
      };
      showStatsToast(
        `Reset ${resetKeys.map((key) => labels[key] ?? key).join(", ")}.`
      );
    }
  }

  const bakerTeamGames = filteredGames.filter(
    (game) =>
      game.format === "Baker" &&
      (selectedBowler === "All" ||
        bakerTeamLabelForGame(game) === selectedBowler)
  );

  const filteredEntries = statsFilteredGames.flatMap((game) =>
    game.entries.filter((entry) => {
      if (game.format === "Baker") {
        if (!isBakerUniverse) {
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

  const overviewScoreEntries: OverviewScoreDetail[] = statsFilteredGames.flatMap(
    (game) => {
      const eventLabel = [
        game.eventName || game.competitionType,
        game.eventStageLabel,
        game.centerName,
      ]
        .filter(Boolean)
        .join(" • ");

      if (game.format === "Baker") {
        if (!isBakerUniverse) {
          return [];
        }

        return game.scores.map((score) => ({
          score: score.score,
          bowlerLabel: score.label,
          gameNumber: game.gameNumber,
          laneLabel: game.laneLabel,
          savedAt: game.savedAt,
          eventLabel,
        }));
      }

      return game.scores
        .filter(
          (score) => selectedBowler === "All" || score.label === selectedBowler
        )
        .map((score) => ({
          score: score.score,
          bowlerLabel: score.label,
          gameNumber: game.gameNumber,
          laneLabel: game.laneLabel,
          savedAt: game.savedAt,
          eventLabel,
        }));
    }
  );
  const totalScores = overviewScoreEntries.map((entry) => entry.score);
  const overviewTotalPins = totalScores.reduce((sum, score) => sum + score, 0);

  const overallAverage =
    totalScores.length > 0 ? overviewTotalPins / totalScores.length : 0;

  const strikeCount = filteredEntries.filter(isStrikeEntry).length;
  const spareCount = filteredEntries.filter(isSpareEntry).length;
  const openCount = filteredEntries.length - strikeCount - spareCount;
  const splitCount = filteredEntries.filter(isSplitEntry).length;
  const cleanGameCount = countCleanGames(
    statsFilteredGames,
    isBakerUniverse ? selectedBakerBowler : selectedBowler,
    selectedBall
  );

  const sessionGroups = buildSessionGroups(statsFilteredGames);
  const overviewHighGameDetail = getHighGameDetail(overviewScoreEntries);
  const overviewHighGame = overviewHighGameDetail?.score ?? 0;
  const overviewHighThreeGameSeriesDetail = isIndividualBowlerFilter
    ? getHighSeriesDetail(sessionGroups, selectedBowler, 3)
    : getHighTeamSeriesDetail(sessionGroups, 3);
  const overviewHighThreeGameSeries =
    overviewHighThreeGameSeriesDetail?.total ?? 0;
  const overviewStatCards = buildOverviewStatCards({
    average: overallAverage,
    totalPins: overviewTotalPins,
    totalScores: totalScores.length,
    highGameDetail: overviewHighGameDetail,
    highSeriesDetail: overviewHighThreeGameSeriesDetail,
  });
  const targetingStatCards = buildTargetingStatCards(filteredEntries);
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
  const detailedStatCards = detailedStats
    ? buildDetailedStatCards(detailedStats, selectedBall)
    : [];

  const spareLeaveRows = calculateSpareLeaveRows(filteredEntries);
  const spareLeaveSummary = calculateSpareLeaveSummary(filteredEntries);
  const boardStats = calculateBoardStats(filteredEntries);
  const boardProgressionRows = calculateBoardProgressionRows(
    statsFilteredGames,
    isBakerUniverse ? selectedBakerBowler : selectedBowler,
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
    setFilters({ ...defaultStatsFilters });
    setFilterEpoch((epoch) => epoch + 1);
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
    const hasMissingLaneLabel = session.games.some(
      (game) => !draft.gameLaneLabels[game.id]?.trim()
    );

    if (!draft.centerName.trim() || !draft.patternName.trim() || hasMissingLaneLabel) {
      window.alert("Choose a bowling center, pattern, and lane/pair for each game before saving set data.");
      return;
    }

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
    showStatsToast("Set data saved.");
  }

  function getGameMetadataDraft(game: SavedGameRecord) {
    return gameMetadataDrafts[game.id] ?? createGameMetadataDraft(game);
  }

  function hasGameNotesChanges(game: SavedGameRecord) {
    return (
      JSON.stringify(getGameMetadataDraft(game)) !==
      JSON.stringify(createGameMetadataDraft(game))
    );
  }

  function updateGameNotesDraft(
    game: SavedGameRecord,
    field: keyof GameMetadataDraft,
    value: string
  ) {
    setGameMetadataDrafts((currentDrafts) => ({
      ...currentDrafts,
      [game.id]: {
        ...getGameMetadataDraft(game),
        [field]: value,
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
              ballReactionNotes: draft.ballReactionNotes.trim(),
              laneTransitionNotes: draft.laneTransitionNotes.trim(),
              adjustmentNotes: draft.adjustmentNotes.trim(),
            }
          : game
      )
    );

    resetGameMetadataDraft(gameToUpdate);
    setEditingGameMetadataId(null);
    showStatsToast("Game notes saved.");
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
    showStatsToast("Frame edits saved.");
  }

  function getStatsExportFilters() {
    const timeFrame = filters.timeFrame;
    const timeFrameToken =
      timeFrame.preset === "all"
        ? ""
        : timeFrame.preset === "custom"
        ? `${timeFrame.from || "from"}-to-${timeFrame.to || "now"}`
        : timeFrame.preset;

    return {
      selectedBowler,
      selectedBakerBowler,
      selectedBall,
      selectedCompetition,
      selectedEventName,
      selectedCenter,
      selectedLane,
      selectedPattern,
      selectedEventStage,
      selectedSetKey,
      selectedGameNumber,
      timeFrame: timeFrameToken,
    };
  }

  function getStatsExportFileName(extension: string) {
    return buildStatsExportFileName(getStatsExportFilters(), extension);
  }

  function getExportExtension() {
    if (exportFormat === "excel") {
      return "xlsx";
    }

    if (exportFormat === "pdf") {
      return "pdf";
    }

    return exportFormat;
  }

  function getExportFormatLabel() {
    if (exportFormat === "excel") {
      return "Excel workbook (.xlsx)";
    }

    if (exportFormat === "pdf") {
      return "Print / Save as PDF";
    }

    return exportFormat.toUpperCase();
  }

  function showStatsToast(message: string) {
    setToastMessage(message);
  }

  function downloadTextFile(
    fileName: string,
    content: string,
    mimeType: string
  ) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = fileName;
    link.click();

    URL.revokeObjectURL(url);
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

  function escapeHtml(value: string | number) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function hasSelectedExportSections() {
    return Object.values(exportSections).some(Boolean);
  }

  function toggleExportSection(sectionKey: StatsExportSectionKey) {
    setExportSections((currentSections) => ({
      ...currentSections,
      [sectionKey]: !currentSections[sectionKey],
    }));
  }

  function applyExportPreset(
    preset: "summary" | "scores" | "scorecards" | "detailed" | "full"
  ) {
    if (preset === "summary") {
      setExportSections({
        overview: true,
        activeFilters: true,
        savedSets: true,
        gameScores: false,
        scorecards: false,
        bowlerBreakdown: true,
        detailedAnalysis: false,
        spareLeaves: false,
        targeting: false,
        frameDetails: false,
      });
      return;
    }

    if (preset === "scores") {
      setExportSections({
        overview: false,
        activeFilters: true,
        savedSets: true,
        gameScores: true,
        scorecards: false,
        bowlerBreakdown: false,
        detailedAnalysis: false,
        spareLeaves: false,
        targeting: false,
        frameDetails: false,
      });
      return;
    }

    if (preset === "scorecards") {
      setExportSections({
        overview: false,
        activeFilters: true,
        savedSets: true,
        gameScores: true,
        scorecards: true,
        bowlerBreakdown: false,
        detailedAnalysis: false,
        spareLeaves: false,
        targeting: false,
        frameDetails: false,
      });
      return;
    }

    if (preset === "detailed") {
      setExportSections({
        overview: true,
        activeFilters: true,
        savedSets: false,
        gameScores: false,
        scorecards: false,
        bowlerBreakdown: true,
        detailedAnalysis: true,
        spareLeaves: true,
        targeting: true,
        frameDetails: false,
      });
      return;
    }

    setExportSections({
      overview: true,
      activeFilters: true,
      savedSets: true,
      gameScores: true,
      scorecards: true,
      bowlerBreakdown: true,
      detailedAnalysis: true,
      spareLeaves: true,
      targeting: true,
      frameDetails: true,
    });
  }

  function describeScopeLabel() {
    if (filters.mode === "baker") {
      const team =
        filters.selection === "All"
          ? "All teams"
          : filters.selection.replace(/^Baker Team:\s*/, "");
      return filters.bakerBowler !== "All"
        ? `Baker — ${team} — ${filters.bakerBowler}`
        : `Baker — ${team}`;
    }
    if (filters.mode === "individual") {
      return filters.selection === "All"
        ? "Individual — all bowlers"
        : `Individual — ${filters.selection}`;
    }
    return "All bowlers";
  }

  function describeTimeFrameLabel() {
    const timeFrame = filters.timeFrame;
    if (timeFrame.preset === "custom") {
      return `${timeFrame.from || "…"} to ${timeFrame.to || "…"}`;
    }
    const presetLabels: Record<string, string> = {
      all: "All time",
      thisWeek: "This week",
      thisMonth: "This month",
      thisYear: "This year",
      last7: "Last 7 days",
      last30: "Last 30 days",
      last90: "Last 90 days",
    };
    return presetLabels[timeFrame.preset] ?? "All time";
  }

  function getActiveFilterRows() {
    const rows: (string | number)[][] = [["Scope", describeScopeLabel()]];

    if (filters.timeFrame.preset !== "all") {
      rows.push(["Time Frame", describeTimeFrameLabel()]);
    }

    const conditionalRows = [
      ["Ball", selectedBall],
      ["Competition", selectedCompetition],
      ["League / Tournament", selectedEventName],
      ["Week / Day", selectedEventStage],
      ["Set", selectedSetKey === "All" ? "All" : "Selected set"],
      ["Game", selectedGameNumber],
      ["Bowling Center", selectedCenter],
      ["Lane / Pair", selectedLane],
      ["Pattern", selectedPattern],
    ].filter(([, value]) => value !== "All");

    return [...rows, ...conditionalRows];
  }

  function getOverviewExportRows() {
    return [
      ["Saved Sets", sessionGroups.length],
      ["Total Games", statsFilteredGames.length],
      ["Average", overallAverage.toFixed(1)],
      ["Strikes", strikeCount],
      ["Spares", spareCount],
      ["Opens", openCount],
      ["Splits", splitCount],
      ["Clean Games", cleanGameCount],
      ["High Game", overviewHighGame || "—"],
      ["High Series (3-game)", overviewHighThreeGameSeries || "—"],
    ];
  }

  function getSetSummaryExportRows() {
    return sessionGroups.map((session) => [
      session.title,
      session.games.length,
      session.games[0]?.centerName ?? "",
      session.games[0]?.patternName ?? "",
      session.games.map((game) => game.laneLabel).join(" → "),
      session.games
        .flatMap((game) =>
          game.scores.map((score) => `${score.label}: ${score.score}`)
        )
        .join(" • "),
      session.games[0]?.setNotes ?? "",
    ]);
  }

  function getGameSummaryExportRows() {
    return statsFilteredGames.flatMap((game) =>
      game.scores.map((score) => [
        new Date(game.createdAt ?? game.savedAt).toLocaleString(),
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
        game.ballReactionNotes ?? "",
        game.laneTransitionNotes ?? "",
        game.adjustmentNotes ?? "",
        score.label,
        score.score,
      ])
    );
  }

  function getScorecardExportRows() {
    return statsFilteredGames.flatMap((game) => {
      const scorecardGroups =
        game.format === "Baker"
          ? [
              {
                label: game.scores[0]?.label ?? "Baker Team",
                score: game.scores[0]?.score ?? "",
                entries: game.entries,
              },
            ]
          : game.scores.map((score) => ({
              label: score.label,
              score: score.score,
              entries: game.entries.filter((entry) => {
                const matchesBowler = entry.bowlerName === score.label;
                const matchesBall =
                  selectedBall === "All" || entry.ballUsed === selectedBall;

                return matchesBowler && matchesBall;
              }),
            }));

      return scorecardGroups.map((group) => {
        const framesByNumber = new Map<number, FrameEntry>();

        group.entries.forEach((entry) => {
          framesByNumber.set(entry.frameNumber, entry);
        });

        const orderedEntries = Array.from(framesByNumber.values()).sort(
          (a, b) => a.frameNumber - b.frameNumber
        );
        const cumulativeScores = getCumulativeFrameScores(orderedEntries);
        const frameCells = Array.from({ length: 10 }, (_, index) => {
          const frameNumber = index + 1;
          const frame = framesByNumber.get(frameNumber);
          const cumulativeScore = frame ? cumulativeScores[index] : "";

          return formatScorecardFrameForExport(frame, cumulativeScore);
        });

        return [
          game.eventName || "Open",
          game.eventStageLabel || "",
          game.gameNumber,
          game.laneLabel,
          group.label,
          ...frameCells,
          group.score || cumulativeScores[cumulativeScores.length - 1] || "",
          getUniqueBallSummary(group.entries),
        ];
      });
    });
  }

  function getBowlerBreakdownExportRows() {
    return bowlerRows.map((row) => [
      row.bowlerName,
      row.games,
      row.average.toFixed(1),
      row.highGame || "—",
      row.highSeries || "—",
      row.frames,
      row.strikes,
      row.spares,
      row.opens,
      row.cleanGames,
      `${row.strikeRate.toFixed(1)}%`,
      `${row.cleanRate.toFixed(1)}%`,
      `${row.splitRate.toFixed(1)}%`,
    ]);
  }

  function getDetailedAnalysisTitle() {
    if (!detailedStats) {
      return "Detailed Stat Analysis";
    }

    return `Detailed Stat Analysis — ${selectedBowler}${
      selectedBall !== "All" ? ` with ${selectedBall}` : ""
    }`;
  }

  function getDetailedAnalysisUnavailableRows() {
    return [
      [
        "Detailed Stat Analysis",
        "Select one individual bowler in the Stats filters to export detailed bowler analysis.",
      ],
    ];
  }

  function getDetailedAnalysisStatsExportRows() {
    if (!detailedStats) {
      return getDetailedAnalysisUnavailableRows();
    }

    return [
      ["Total Games", detailedStats.numGames],
      ["Average", detailedStats.average.toFixed(1)],
      [
        "High 3-Game Series",
        detailedStats.highThreeGameSeries > 0
          ? detailedStats.highThreeGameSeries
          : "—",
      ],
      [
        "High 4-Game Series",
        detailedStats.highFourGameSeries > 0
          ? detailedStats.highFourGameSeries
          : "—",
      ],
      ["Pocket Percentage", `${detailedStats.pocketPercentage.toFixed(1)}%`],
      ["Carry Percentage", `${detailedStats.carryPercentage.toFixed(1)}%`],
      ["Double Percentage", `${detailedStats.doublePercentage.toFixed(1)}%`],
      [
        "Makeable Spare Conversion",
        `${detailedStats.makeableSpareConversion.toFixed(1)}%`,
      ],
      ["Clean Percentage", `${detailedStats.cleanPercentage.toFixed(1)}%`],
      ["Split Percentage", `${detailedStats.splitPercentage.toFixed(1)}%`],
      ["Clean Games", detailedStats.cleanGames],
      ["First Ball Average", detailedStats.firstBallAverage.toFixed(2)],
    ];
  }

  function getAverageFrameScoreExportRows() {
    if (!detailedStats) {
      return getDetailedAnalysisUnavailableRows();
    }

    return detailedStats.frameScoreRows.map((row) => [
      `Frame ${row.frameNumber}`,
      row.average.toFixed(1),
    ]);
  }

  function getAverageByGameExportRows() {
    if (!detailedStats) {
      return getDetailedAnalysisUnavailableRows();
    }

    return detailedStats.averageByGameRows.map((row) => [
      `Game ${row.gameNumber}`,
      row.count,
      row.average.toFixed(1),
      row.high,
      row.low,
    ]);
  }

  function getGameScoreDistributionExportHeaders() {
    if (!detailedStats) {
      return ["Section", "Message"];
    }

    return [
      "Games",
      ...detailedStats.scoreDistribution.gameNumbers.map(
        (gameNumber) => `Game ${gameNumber}`
      ),
      "Total",
      "%",
    ];
  }

  function getGameScoreDistributionExportRows() {
    if (!detailedStats) {
      return getDetailedAnalysisUnavailableRows();
    }

    return detailedStats.scoreDistribution.gameRows.map((row) => [
      row.label,
      ...detailedStats.scoreDistribution.gameNumbers.map(
        (gameNumber) => row.gameCounts[gameNumber] ?? 0
      ),
      row.total,
      `${row.percentage.toFixed(1)}%`,
    ]);
  }

  function getSeriesScoreDistributionExportRows() {
    if (!detailedStats) {
      return getDetailedAnalysisUnavailableRows();
    }

    return detailedStats.scoreDistribution.seriesRows.map((row) => [
      row.label,
      row.total,
      `${row.percentage.toFixed(1)}%`,
    ]);
  }

  function getTransitionPhaseExportRows() {
    if (!detailedStats) {
      return getDetailedAnalysisUnavailableRows();
    }

    return detailedStats.transitionRows.map((row) => [
      row.phase,
      row.frames,
      row.strikes,
      row.spares,
      row.opens,
      row.splits,
      `${row.strikePercentage.toFixed(1)}%`,
      `${row.cleanPercentage.toFixed(1)}%`,
    ]);
  }

  function getSpareLeaveSummaryExportRows() {
    return [
      [
        "Makeable Pickup",
        spareLeaveSummary.makeable.attempts,
        spareLeaveSummary.makeable.conversions,
        `${spareLeaveSummary.makeable.percentage.toFixed(1)}%`,
      ],
      [
        "Single Pin Pickup",
        spareLeaveSummary.singlePin.attempts,
        spareLeaveSummary.singlePin.conversions,
        `${spareLeaveSummary.singlePin.percentage.toFixed(1)}%`,
      ],
      [
        "Multi Pin Pickup",
        spareLeaveSummary.multiPin.attempts,
        spareLeaveSummary.multiPin.conversions,
        `${spareLeaveSummary.multiPin.percentage.toFixed(1)}%`,
      ],
      [
        "Split Pickup",
        spareLeaveSummary.split.attempts,
        spareLeaveSummary.split.conversions,
        `${spareLeaveSummary.split.percentage.toFixed(1)}%`,
      ],
    ];
  }

  function getSpareLeaveExportRows() {
    return spareLeaveRows.map((row) => [
      row.leave,
      row.attempts,
      row.conversions,
      row.misses,
      `${row.conversionPercentage.toFixed(1)}%`,
    ]);
  }

  function getTargetingSummaryExportRows() {
    return [
      ["Tracked Shots", boardStats.trackedShots],
      ["Avg Arrow Miss", formatSignedNumber(boardStats.averageArrowMiss)],
      ["Avg Abs Arrow Miss", formatMaybeNumber(boardStats.averageAbsoluteArrowMiss)],
      ["Arrow ±1 Board", formatPercentValue(boardStats.arrowHitRate)],
      ["Avg Breakpoint Miss", formatSignedNumber(boardStats.averageBreakpointMiss)],
      [
        "Avg Abs Breakpoint Miss",
        formatMaybeNumber(boardStats.averageAbsoluteBreakpointMiss),
      ],
      ["Breakpoint ±1 Board", formatPercentValue(boardStats.breakpointHitRate)],
    ];
  }

  function getTargetingByBallExportRows() {
    return boardStats.byBallRows.map((row) => [
      row.ball,
      row.shots,
      formatSignedNumber(row.averageArrowMiss),
      formatMaybeNumber(row.averageAbsoluteArrowMiss),
      formatPercentValue(row.arrowHitRate),
      formatSignedNumber(row.averageBreakpointMiss),
      formatMaybeNumber(row.averageAbsoluteBreakpointMiss),
      formatPercentValue(row.breakpointHitRate),
    ]);
  }

  function getFrameExportRows() {
    return statsFilteredGames.flatMap((game) =>
      game.entries.map((entry) => [
        game.eventName || "Open",
        game.eventStageLabel || "",
        game.gameNumber,
        game.centerName,
        game.patternName,
        game.laneLabel,
        entry.bowlerName,
        entry.frameNumber,
        entry.ballUsed || "",
        entry.firstShotKnockedPins.join("-") || "0",
        entry.secondShotKnockedPins.join("-") || "0",
        entry.thirdShotKnockedPins.join("-") || "0",
        getPinsStanding(entry.firstShotKnockedPins).join("-") || "None",
        entry.footBoard || "",
        entry.targetArrow || "",
        entry.actualArrow || "",
        entry.targetBreakpoint || "",
        entry.actualBreakpoint || "",
      ])
    );
  }

  function buildHtmlTable(
    title: string,
    headers: string[],
    rows: (string | number)[][]
  ) {
    const cellText = (value: string | number) => String(value ?? "").trim();
    const isNumericCell = (value: string | number) => {
      const text = cellText(value);
      if (text === "") return false;
      if (typeof value === "number") return true;
      return /^-?[\d,]+(\.\d+)?%?$/.test(text);
    };
    const isDateHeader = (header: string) => /(\bat|date)$/i.test(header.trim());
    const columnValues = (index: number) =>
      rows.map((row) => cellText(row[index])).join("");
    const emphasisHeaders = new Set([
      "score",
      "total",
      "average",
      "high game",
      "high series",
      "high series (3-game)",
    ]);

    // Keep columns that carry data, and merge duplicate date columns
    // (e.g. Created At / Saved At when identical) — kept narrow to date
    // headers so identical-looking value columns (scorecard frames) survive.
    const keptIndexes: number[] = [];
    headers.forEach((header, index) => {
      const hasValue =
        rows.length === 0 || rows.some((row) => cellText(row[index]) !== "");
      if (!hasValue) {
        return;
      }
      const duplicateDate =
        isDateHeader(header) &&
        rows.length > 0 &&
        keptIndexes.some(
          (kept) =>
            isDateHeader(headers[kept]) &&
            columnValues(kept) === columnValues(index)
        );
      if (!duplicateDate) {
        keptIndexes.push(index);
      }
    });

    const columnMeta = keptIndexes.map((index) => {
      const nonEmpty = rows
        .map((row) => row[index])
        .filter((value) => cellText(value) !== "");
      return {
        index,
        numeric: nonEmpty.length > 0 && nonEmpty.every(isNumericCell),
        emphasis: emphasisHeaders.has(headers[index].trim().toLowerCase()),
      };
    });

    const classFor = (meta: { numeric: boolean; emphasis: boolean }) =>
      [meta.numeric ? "num" : "", meta.emphasis ? "emph" : ""]
        .filter(Boolean)
        .join(" ");

    const headerHtml = columnMeta
      .map(
        (meta) =>
          `<th class="${classFor(meta)}">${escapeHtml(headers[meta.index])}</th>`
      )
      .join("");

    const rowHtml =
      rows.length > 0
        ? rows
            .map(
              (row) =>
                `<tr>${columnMeta
                  .map((meta) => {
                    const raw = row[meta.index];
                    const value = escapeHtml(raw);
                    const perfect = meta.emphasis && cellText(raw) === "300";
                    return `<td class="${classFor(meta)}">${
                      perfect
                        ? `<span class="perfect-pill">${value}</span>`
                        : value
                    }</td>`;
                  })
                  .join("")}</tr>`
            )
            .join("")
        : `<tr><td class="empty" colspan="${columnMeta.length}">No data for this section.</td></tr>`;

    return `
      <section class="report-section">
        <h2>${escapeHtml(title)}</h2>
        <div class="table-wrap">
          <table>
            <thead><tr>${headerHtml}</tr></thead>
            <tbody>${rowHtml}</tbody>
          </table>
        </div>
      </section>
    `;
  }

  function buildStatsReportHtml(
    options: {
      autoPrint?: boolean;
      sections?: StatsExportSections;
    } = {}
  ) {
    const sections = options.sections ?? exportSections;
    const activeFilterRows = getActiveFilterRows();
    const exportedAt = new Date().toLocaleString();
    const reportSections: string[] = [];

    if (sections.activeFilters) {
      reportSections.push(
        buildHtmlTable(
          "Active Filters",
          ["Filter", "Value"],
          activeFilterRows.length > 0 ? activeFilterRows : [["Filters", "All"]]
        )
      );
    }

    if (sections.savedSets) {
      reportSections.push(
        buildHtmlTable(
          "Saved Sets",
          [
            "Set",
            "Games",
            "Center",
            "Pattern",
            "Lane / Pair Flow",
            "Scores",
            "Set Notes",
          ],
          getSetSummaryExportRows()
        )
      );
    }

    if (sections.gameScores) {
      reportSections.push(
        buildHtmlTable(
          "Game Scores",
          [
            "Created At",
            "Saved At",
            "Competition",
            "Event",
            "Week / Day",
            "Game",
            "Center",
            "Pattern",
            "Format",
            "Lane / Pair",
            "Set Notes",
            "Game Notes",
            "Ball Reaction Notes",
            "Lane Transition Notes",
            "Adjustment Notes",
            "Score Label",
            "Score",
          ],
          getGameSummaryExportRows()
        )
      );
    }

    if (sections.scorecards) {
      reportSections.push(
        buildHtmlTable(
          "Scorecards",
          [
            "Event",
            "Week / Day",
            "Game",
            "Lane / Pair",
            "Bowler / Team",
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9",
            "10",
            "Total",
            "Ball(s)",
          ],
          getScorecardExportRows()
        )
      );
    }

    if (sections.bowlerBreakdown) {
      reportSections.push(
        buildHtmlTable(
          "Bowler Breakdown",
          [
            "Bowler",
            "Games",
            "Average",
            "High Game",
            "High Series",
            "Frames",
            "Strikes",
            "Spares",
            "Opens",
            "Clean Games",
            "Strike %",
            "Clean %",
            "Split %",
          ],
          getBowlerBreakdownExportRows()
        )
      );
    }

    if (sections.detailedAnalysis) {
      reportSections.push(
        buildHtmlTable(
          getDetailedAnalysisTitle(),
          detailedStats ? ["Metric", "Value"] : ["Section", "Message"],
          getDetailedAnalysisStatsExportRows()
        )
      );
      reportSections.push(
        buildHtmlTable(
          "Average Frame Score",
          detailedStats ? ["Frame", "Average Score"] : ["Section", "Message"],
          getAverageFrameScoreExportRows()
        )
      );
      reportSections.push(
        buildHtmlTable(
          "Average by Game",
          detailedStats
            ? ["Game", "Games Tracked", "Average", "High", "Low"]
            : ["Section", "Message"],
          getAverageByGameExportRows()
        )
      );
      reportSections.push(
        buildHtmlTable(
          "Score Distribution — Games",
          getGameScoreDistributionExportHeaders(),
          getGameScoreDistributionExportRows()
        )
      );
      reportSections.push(
        buildHtmlTable(
          "Score Distribution — Series",
          detailedStats ? ["Series", "Total", "%"] : ["Section", "Message"],
          getSeriesScoreDistributionExportRows()
        )
      );
      reportSections.push(
        buildHtmlTable(
          "Transitional Phase Breakdown",
          detailedStats
            ? [
                "Phase",
                "Frames",
                "Strikes",
                "Spares",
                "Opens",
                "Splits",
                "Strike %",
                "Clean %",
              ]
            : ["Section", "Message"],
          getTransitionPhaseExportRows()
        )
      );
    }

    if (sections.spareLeaves) {
      reportSections.push(
        buildHtmlTable(
          "Spare Pickup Summary",
          ["Category", "Attempts", "Conversions", "Pickup %"],
          getSpareLeaveSummaryExportRows()
        )
      );
      reportSections.push(
        buildHtmlTable(
          "Spare Leave Breakdown",
          ["Leave", "Attempts", "Conversions", "Misses", "Pickup %"],
          getSpareLeaveExportRows()
        )
      );
    }

    if (sections.targeting) {
      reportSections.push(
        buildHtmlTable(
          "Targeting Summary",
          ["Metric", "Value"],
          getTargetingSummaryExportRows()
        )
      );
      reportSections.push(
        buildHtmlTable(
          "Targeting by Ball",
          [
            "Ball",
            "Shots",
            "Avg Arrow Miss",
            "Avg Abs Arrow Miss",
            "Arrow ±1 Board",
            "Avg Breakpoint Miss",
            "Avg Abs Breakpoint Miss",
            "Breakpoint ±1 Board",
          ],
          getTargetingByBallExportRows()
        )
      );
    }

    if (sections.frameDetails) {
      reportSections.push(
        buildHtmlTable(
          "Frame / Shot Details",
          [
            "Event",
            "Week / Day",
            "Game",
            "Center",
            "Pattern",
            "Lane / Pair",
            "Bowler",
            "Frame",
            "Ball",
            "First Shot Pins",
            "Second Shot Pins",
            "Third Shot Pins",
            "First Ball Leave",
            "Foot Board",
            "Target Arrow",
            "Actual Arrow",
            "Target Breakpoint",
            "Actual Breakpoint",
          ],
          getFrameExportRows()
        )
      );
    }

    const heroLabels = new Set([
      "Average",
      "High Game",
      "High Series (3-game)",
    ]);
    const overviewHtml = sections.overview
      ? `<div class="overview">${getOverviewExportRows()
          .map(
            ([label, value]) =>
              `<article class="tile ${
                heroLabels.has(String(label)) ? "hero" : ""
              }"><span class="tile-value">${escapeHtml(
                value
              )}</span><span class="tile-label">${escapeHtml(
                label
              )}</span></article>`
          )
          .join("")}</div>`
      : "";

    const scopeMetaHtml =
      filters.timeFrame.preset !== "all"
        ? `<strong>${escapeHtml(describeScopeLabel())}</strong> · ${escapeHtml(
            describeTimeFrameLabel()
          )}`
        : `<strong>${escapeHtml(describeScopeLabel())}</strong>`;

    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Pin-Sighter Stats Report</title>
  <style>${STATS_REPORT_CSS}</style>
</head>
<body>
  <div class="page">
    <header class="report-head">
      <div class="brand">
        <span class="mark" aria-hidden="true"></span>
        <div>
          <h1>Pin-Sighter</h1>
          <p class="sub">Stats Report</p>
        </div>
      </div>
      <div class="meta">
        <span>${scopeMetaHtml}</span>
        <span>${statsFilteredGames.length} game${
      statsFilteredGames.length === 1 ? "" : "s"
    } · ${sessionGroups.length} saved set${
      sessionGroups.length === 1 ? "" : "s"
    }</span>
        <span>Exported ${escapeHtml(exportedAt)}</span>
      </div>
    </header>

    ${overviewHtml}

    ${reportSections.join("")}
  </div>

  ${
    options.autoPrint
      ? `<script>
          window.addEventListener("load", () => {
            window.focus();
            window.print();
          });
        </script>`
      : ""
  }
</body>
</html>`;
  }

  function appendCsvSection(
    rows: (string | number)[][],
    title: string,
    headers: string[],
    dataRows: (string | number)[][]
  ) {
    rows.push([title]);
    rows.push(headers);
    rows.push(...dataRows);
    rows.push([]);
  }

  function buildStatsExportRows(
    sections: StatsExportSections
  ): (string | number)[][] {
    const rows: (string | number)[][] = [];

    if (sections.overview) {
      appendCsvSection(rows, "Overview", ["Metric", "Value"], getOverviewExportRows());
    }

    if (sections.activeFilters) {
      const activeFilterRows = getActiveFilterRows();

      appendCsvSection(
        rows,
        "Active Filters",
        ["Filter", "Value"],
        activeFilterRows.length > 0 ? activeFilterRows : [["Filters", "All"]]
      );
    }

    if (sections.savedSets) {
      appendCsvSection(
        rows,
        "Saved Sets",
        ["Set", "Games", "Center", "Pattern", "Lane / Pair Flow", "Scores", "Set Notes"],
        getSetSummaryExportRows()
      );
    }

    if (sections.gameScores) {
      appendCsvSection(
        rows,
        "Game Scores",
        [
          "Created At",
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
        getGameSummaryExportRows()
      );
    }

    if (sections.scorecards) {
      appendCsvSection(
        rows,
        "Scorecards",
        [
          "Event",
          "Week/Day",
          "Game",
          "Lane/Pair",
          "Bowler/Team",
          "1",
          "2",
          "3",
          "4",
          "5",
          "6",
          "7",
          "8",
          "9",
          "10",
          "Total",
          "Ball(s)",
        ],
        getScorecardExportRows()
      );
    }

    if (sections.bowlerBreakdown) {
      appendCsvSection(
        rows,
        "Bowler Breakdown",
        [
          "Bowler",
          "Games",
          "Average",
          "High Game",
          "High Series",
          "Frames",
          "Strikes",
          "Spares",
          "Opens",
          "Clean Games",
          "Strike %",
          "Clean %",
          "Split %",
        ],
        getBowlerBreakdownExportRows()
      );
    }

    if (sections.detailedAnalysis) {
      appendCsvSection(
        rows,
        getDetailedAnalysisTitle(),
        detailedStats ? ["Metric", "Value"] : ["Section", "Message"],
        getDetailedAnalysisStatsExportRows()
      );
      appendCsvSection(
        rows,
        "Average Frame Score",
        detailedStats ? ["Frame", "Average Score"] : ["Section", "Message"],
        getAverageFrameScoreExportRows()
      );
      appendCsvSection(
        rows,
        "Average by Game",
        detailedStats
          ? ["Game", "Games Tracked", "Average", "High", "Low"]
          : ["Section", "Message"],
        getAverageByGameExportRows()
      );
      appendCsvSection(
        rows,
        "Score Distribution - Games",
        getGameScoreDistributionExportHeaders(),
        getGameScoreDistributionExportRows()
      );
      appendCsvSection(
        rows,
        "Score Distribution - Series",
        detailedStats ? ["Series", "Total", "%"] : ["Section", "Message"],
        getSeriesScoreDistributionExportRows()
      );
      appendCsvSection(
        rows,
        "Transitional Phase Breakdown",
        detailedStats
          ? [
              "Phase",
              "Frames",
              "Strikes",
              "Spares",
              "Opens",
              "Splits",
              "Strike %",
              "Clean %",
            ]
          : ["Section", "Message"],
        getTransitionPhaseExportRows()
      );
    }

    if (sections.spareLeaves) {
      appendCsvSection(
        rows,
        "Spare Pickup Summary",
        ["Category", "Attempts", "Conversions", "Pickup %"],
        getSpareLeaveSummaryExportRows()
      );
      appendCsvSection(
        rows,
        "Spare Leave Breakdown",
        ["Leave", "Attempts", "Conversions", "Misses", "Pickup %"],
        getSpareLeaveExportRows()
      );
    }

    if (sections.targeting) {
      appendCsvSection(
        rows,
        "Targeting Summary",
        ["Metric", "Value"],
        getTargetingSummaryExportRows()
      );
      appendCsvSection(
        rows,
        "Targeting by Ball",
        [
          "Ball",
          "Shots",
          "Avg Arrow Miss",
          "Avg Abs Arrow Miss",
          "Arrow ±1 Board",
          "Avg Breakpoint Miss",
          "Avg Abs Breakpoint Miss",
          "Breakpoint ±1 Board",
        ],
        getTargetingByBallExportRows()
      );
    }

    if (sections.frameDetails) {
      appendCsvSection(
        rows,
        "Frame / Shot Details",
        [
          "Event",
          "Week/Day",
          "Game",
          "Center",
          "Pattern",
          "Lane",
          "Bowler",
          "Frame",
          "Ball",
          "First Shot Pins",
          "Second Shot Pins",
          "Third Shot Pins",
          "First Ball Leave",
          "Foot Board",
          "Target Arrow",
          "Actual Arrow",
          "Target Breakpoint",
          "Actual Breakpoint",
        ],
        getFrameExportRows()
      );
    }

    return rows;
  }

  function buildSelectedCsv(sections: StatsExportSections) {
    return buildStatsExportRows(sections)
      .map((row) => row.map((cell) => escapeCsv(cell)).join(","))
      .join("\n");
  }

  async function runStatsExport() {
    if (!hasSelectedExportSections()) {
      window.alert("Select at least one export section.");
      return;
    }

    if (exportFormat === "csv") {
      downloadTextFile(
        getStatsExportFileName("csv"),
        buildSelectedCsv(exportSections),
        "text/csv;charset=utf-8"
      );
      showStatsToast(`CSV exported as ${getStatsExportFileName("csv")}.`);
      setIsExportPanelOpen(false);
      return;
    }

    if (exportFormat === "excel") {
      // Loaded on demand so SheetJS is its own chunk, out of the main bundle.
      const xlsx = await import("xlsx");
      const worksheet = xlsx.utils.aoa_to_sheet(
        buildStatsExportRows(exportSections)
      );
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, "Pin-Sighter Stats");
      const workbookData = xlsx.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const fileName = getStatsExportFileName("xlsx");
      const blob = new Blob([workbookData], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
      showStatsToast(`Excel workbook exported as ${fileName}.`);
      setIsExportPanelOpen(false);
      return;
    }

    if (exportFormat === "html") {
      downloadTextFile(
        getStatsExportFileName("html"),
        buildStatsReportHtml({ sections: exportSections }),
        "text/html;charset=utf-8"
      );
      showStatsToast(`HTML report exported as ${getStatsExportFileName("html")}.`);
      setIsExportPanelOpen(false);
      return;
    }

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      window.alert("Allow pop-ups to open the print view for this report.");
      return;
    }

    printWindow.document.open();
    printWindow.document.write(
      buildStatsReportHtml({ autoPrint: true, sections: exportSections })
    );
    printWindow.document.close();
    showStatsToast('Print view opened — choose "Save as PDF" to keep a copy.');
    setIsExportPanelOpen(false);
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
    showStatsToast("Saved set deleted.");

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
    showStatsToast("Game deleted.");
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
      setFilters((previous) => ({ ...previous, game: "All" }));
    }

    if (remainingSessionGames.length === 0) {
      setFilters((previous) => ({ ...previous, set: "All", game: "All" }));
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



  function getSavedSetCompletionStatus(
    session: ReturnType<typeof buildSessionGroups>[number]
  ) {
    const firstGame = session.games[0];

    if (!firstGame) {
      return {
        canContinue: false,
        label: "No games in this set",
      };
    }

    const highestGameNumber = Math.max(
      ...session.games.map((game) => game.gameNumber)
    );

    if (firstGame.competitionType === "Open") {
      return {
        canContinue: true,
        label: "Add another open bowling game",
      };
    }

    const event = events.find((currentEvent) => currentEvent.id === firstGame.eventId);
    const seriesGameCount = event?.seriesGameCount ?? null;

    if (seriesGameCount === null) {
      return {
        canContinue: false,
        label: "Series length unavailable",
      };
    }

    const gamesRemaining = Math.max(0, seriesGameCount - highestGameNumber);

    return {
      canContinue: gamesRemaining > 0,
      label:
        gamesRemaining > 0
          ? `Add ${gamesRemaining} remaining game${gamesRemaining === 1 ? "" : "s"}`
          : "Set complete",
    };
  }

  function continueSavedSet(session: ReturnType<typeof buildSessionGroups>[number]) {
    const firstGame = session.games[0];
    const lastGame = session.games[session.games.length - 1];

    if (!firstGame || !lastGame) {
      return;
    }

    const completionStatus = getSavedSetCompletionStatus(session);

    if (!completionStatus.canContinue) {
      window.alert("This saved set does not have any remaining games to add.");
      return;
    }

    const laneSetup = getNextGameLaneSetup(lastGame);
    const event = events.find((currentEvent) => currentEvent.id === firstGame.eventId);
    const highestGameNumber = Math.max(
      ...session.games.map((game) => game.gameNumber)
    );

    onContinueSavedSet({
      sessionId: firstGame.sessionId || session.sessionKey,
      createdAt: firstGame.createdAt ?? firstGame.savedAt,
      competitionType: firstGame.competitionType,
      format: firstGame.format,
      bowlersPerTeam: firstGame.bowlersPerTeam,
      centerName: session.centerName,
      patternName: session.patternName,
      eventLogKey: firstGame.eventLogKey,
      eventId: firstGame.eventId,
      eventName: firstGame.eventName,
      eventStageLabel: firstGame.eventStageLabel,
      bowlerNames: firstGame.bowlerNames,
      laneMode: laneSetup.laneMode,
      startingLaneOrPair: laneSetup.startingLaneOrPair,
      startingLane: laneSetup.startingLane,
      seriesGameCount:
        firstGame.competitionType === "Open"
          ? null
          : event?.seriesGameCount ?? highestGameNumber,
      initialGameNumber: highestGameNumber + 1,
      firstGameNumberToSave: highestGameNumber + 1,
      existingCompletedGames: session.games.map(savedGameToCompletedGameSummary),
    });
  }

  return (
    <>
      <h2>Stats</h2>
      <p>
        Review saved sets, narrow stats with filters, export data, and remove
        logs that need to be entered again.
      </p>

      <ToastMessage
        message={toastMessage}
        onDismiss={() => setToastMessage("")}
      />

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
          <section className="stats-filter-panel">
            <div className="stats-filter-head">
              <span className="stats-filter-eyebrow">Filters</span>
              <p>
                Narrow the data by bowler, competition, set, game, center,
                lane, pattern, ball, and saved log details.
              </p>
            </div>

            <div className="stats-filter-body">
              <div className="form-grid">
              <label className="stats-scope-field">
                Scope
                <div
                  className="stats-scope-toggle"
                  role="group"
                  aria-label="Scope"
                >
                  <button
                    type="button"
                    className={filters.mode === "all" ? "is-active" : ""}
                    aria-pressed={filters.mode === "all"}
                    aria-label="All Bowlers"
                    onClick={() => updateFilters({ mode: "all" })}
                  >
                    All Bowlers
                  </button>
                  <button
                    type="button"
                    className={filters.mode === "individual" ? "is-active" : ""}
                    aria-pressed={filters.mode === "individual"}
                    aria-label="Individual"
                    onClick={() => updateFilters({ mode: "individual" })}
                  >
                    Individual
                  </button>
                  <button
                    type="button"
                    className={filters.mode === "baker" ? "is-active" : ""}
                    aria-pressed={filters.mode === "baker"}
                    aria-label="Baker Team"
                    onClick={() => updateFilters({ mode: "baker" })}
                  >
                    Baker Team
                  </button>
                </div>
              </label>

              {filters.mode === "individual" && (
                <label>
                  Bowler
                  <select
                    value={filters.selection}
                    onChange={(event) =>
                      updateFilters({ selection: event.target.value })
                    }
                  >
                    <option>All</option>
                    {selectionOptions.map((bowlerName) => (
                      <option key={bowlerName}>{bowlerName}</option>
                    ))}
                  </select>
                </label>
              )}

              {filters.mode === "baker" && (
                <label>
                  Baker Team
                  <select
                    value={filters.selection}
                    onChange={(event) =>
                      updateFilters({ selection: event.target.value })
                    }
                  >
                    <option>All</option>
                    {selectionOptions.map((teamName) => (
                      <option key={teamName}>{teamName}</option>
                    ))}
                  </select>
                </label>
              )}

              {isBakerTeamSelection && (
                <label>
                  Baker Bowler
                  <select
                    value={selectedBakerBowler}
                    onChange={(event) =>
                      updateFilters({ bakerBowler: event.target.value })
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
                    onChange={(event) => updateFilters({ ball: event.target.value })}
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
                    updateFilters({ competition: event.target.value })
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
                      updateFilters({ eventName: event.target.value })
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
                      updateFilters({ eventStage: event.target.value })
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
                    onChange={(event) => updateFilters({ set: event.target.value })}
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
                    onChange={(event) => updateFilters({ game: event.target.value })}
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
                  onChange={(event) => updateFilters({ center: event.target.value })}
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
                    onChange={(event) => updateFilters({ lane: event.target.value })}
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
                  onChange={(event) => updateFilters({ pattern: event.target.value })}
                >
                  <option>All</option>
                  {patternOptions.map((pattern) => (
                    <option key={pattern}>{pattern}</option>
                  ))}
                </select>
              </label>

              <label>
                Time Frame
                <select
                  value={filters.timeFrame.preset}
                  onChange={(event) =>
                    updateFilters({
                      timeFrame: {
                        ...filters.timeFrame,
                        preset: event.target.value as TimeFramePreset,
                      },
                    })
                  }
                >
                  <option value="all">All time</option>
                  <option value="thisWeek">This week</option>
                  <option value="thisMonth">This month</option>
                  <option value="thisYear">This year</option>
                  <option value="last7">Last 7 days</option>
                  <option value="last30">Last 30 days</option>
                  <option value="last90">Last 90 days</option>
                  <option value="custom">Custom range…</option>
                </select>
              </label>

              {filters.timeFrame.preset === "custom" && (
                <>
                  <label>
                    From
                    <input
                      type="date"
                      value={filters.timeFrame.from ?? ""}
                      onChange={(event) =>
                        updateFilters({
                          timeFrame: {
                            ...filters.timeFrame,
                            from: event.target.value || null,
                          },
                        })
                      }
                    />
                  </label>

                  <label>
                    To
                    <input
                      type="date"
                      value={filters.timeFrame.to ?? ""}
                      onChange={(event) =>
                        updateFilters({
                          timeFrame: {
                            ...filters.timeFrame,
                            to: event.target.value || null,
                          },
                        })
                      }
                    />
                  </label>
                </>
              )}

            </div>

              <div className="stats-action-row">
                <button className="secondary-button" onClick={clearFilters}>
                  Clear Filters
                </button>

                <button
                  className="primary-button"
                  disabled={statsFilteredGames.length === 0}
                  onClick={() => setIsExportPanelOpen(true)}
                >
                  Export Options
                </button>
              </div>
            </div>
          </section>

          {isExportPanelOpen && (
            <div className="export-modal-overlay">
              <section
                className="export-modal-card"
                ref={exportModalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="export-options-title"
                tabIndex={-1}
              >
                <div className="export-modal-header">
                  <div>
                    <p className="eyebrow">Export Options</p>
                    <h3 id="export-options-title">Choose What to Export</h3>
                    <p>
                      The export uses the current Stats filters. To export a
                      specific league, set, or game, choose it in the filters
                      before exporting.
                    </p>
                  </div>

                  <button
                    className="secondary-button"
                    onClick={() => setIsExportPanelOpen(false)}
                  >
                    Close
                  </button>
                </div>

                <div className="form-grid compact-grid">
                  <label>
                    Export Format
                    <select
                      value={exportFormat}
                      onChange={(event) =>
                        setExportFormat(event.target.value as StatsExportFormat)
                      }
                    >
                      <option value="html">HTML Report</option>
                      <option value="pdf">Print / Save as PDF</option>
                      <option value="csv">CSV</option>
                      <option value="excel">Excel Workbook (.xlsx)</option>
                    </select>
                  </label>

                  <div className="export-scope-card">
                    <strong>Current Scope</strong>
                    <p>
                      {statsFilteredGames.length} game
                      {statsFilteredGames.length === 1 ? "" : "s"} •{" "}
                      {sessionGroups.length} saved set
                      {sessionGroups.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>

                <div className="export-file-preview">
                  {exportFormat === "pdf" ? (
                    <>
                      <strong>Output</strong>
                      <p>
                        Opens your browser's print dialog — choose “Save as PDF”
                        to keep a copy.
                      </p>
                    </>
                  ) : (
                    <>
                      <strong>File Name Preview</strong>
                      <code>{getStatsExportFileName(getExportExtension())}</code>
                      <p>{getExportFormatLabel()}</p>
                    </>
                  )}
                </div>

                <div className="export-preset-row">
                  <button
                    className="secondary-button"
                    onClick={() => applyExportPreset("scores")}
                  >
                    Scores Only
                  </button>
                  <button
                    className="secondary-button"
                    onClick={() => applyExportPreset("scorecards")}
                  >
                    Scores + Scorecards
                  </button>
                  <button
                    className="secondary-button"
                    onClick={() => applyExportPreset("summary")}
                  >
                    Summary Report
                  </button>
                  <button
                    className="secondary-button"
                    onClick={() => applyExportPreset("detailed")}
                  >
                    Detailed Stat Analysis
                  </button>
                  <button
                    className="secondary-button"
                    onClick={() => applyExportPreset("full")}
                  >
                    Full Export
                  </button>
                </div>

                <div className="export-section-grid">
                  {statsExportSectionOptions.map((section) => (
                    <label className="export-section-option" key={section.key}>
                      <input
                        type="checkbox"
                        checked={exportSections[section.key]}
                        onChange={() => toggleExportSection(section.key)}
                      />
                      <span>
                        <strong>{section.label}</strong>
                        <small>{section.description}</small>
                      </span>
                    </label>
                  ))}
                </div>

                <div className="export-modal-actions">
                  <button
                    className="secondary-button"
                    onClick={() => setExportSections({ ...defaultStatsExportSections })}
                  >
                    Reset Choices
                  </button>
                  <button
                    className="primary-button"
                    disabled={
                      statsFilteredGames.length === 0 ||
                      !hasSelectedExportSections()
                    }
                    onClick={runStatsExport}
                  >
                    Export Selected
                  </button>
                </div>
              </section>
            </div>
          )}

          <details
            key={`overview-${filterEpoch}`}
            className="stats-collapsible-card"
          >
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
              <span className="summary-hint">Open / Close Section</span>
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

            <button
              className="stat-card stat-card-button"
              type="button"
              onClick={() => setSelectedDetailedStat(overviewStatCards.average)}
              aria-label="View details for average"
            >
              <strong>{overallAverage.toFixed(1)}</strong>
              <span>Average</span>
              <small>View Details</small>
            </button>

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

            <button
              className="stat-card stat-card-button"
              type="button"
              onClick={() => setSelectedDetailedStat(overviewStatCards.highGame)}
              aria-label="View details for high game"
            >
              <strong>{overviewHighGame || "—"}</strong>
              <span>High Game</span>
              <small>View Details</small>
            </button>

            <button
              className="stat-card stat-card-button"
              type="button"
              onClick={() => setSelectedDetailedStat(overviewStatCards.highSeries)}
              aria-label="View details for high series"
            >
              <strong>{overviewHighThreeGameSeries || "—"}</strong>
              <span>High Series (3-game)</span>
              <small>View Details</small>
            </button>

            </div>
          </details>

          {(
            <>
          {!isBakerUniverse && (
          <details
            key={`bowler-${filterEpoch}`}
            className="stats-table-card stats-collapsible-card"
          >
            <summary className="stats-section-summary">
              <div>
                <strong>Bowler Breakdown</strong>
                <p>Individual bowler stats.</p>
              </div>
              <span className="summary-hint">Open / Close Section</span>
            </summary>

            <div className="stats-collapsible-content">
              {bowlerRows.length === 0 ? (
              <p className="helper-text">No rows match the current filters.</p>
            ) : (
              <div className="table-scroll">
                <table className="stats-table">
                    <caption className="sr-only">Bowling statistics table for this section.</caption>
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
                  <div className="deep-stats-grid">
                    {detailedStatCards.map((stat) => (
                      <button
                        className="stat-card stat-card-button"
                        key={stat.title}
                        type="button"
                        onClick={() => setSelectedDetailedStat(stat)}
                        aria-label={`View details for ${stat.label}`}
                      >
                        <strong>{stat.value}</strong>
                        <span>{stat.label}</span>
                        <small>View Details</small>
                      </button>
                    ))}
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
                    <caption className="sr-only">Bowling statistics table for this section.</caption>
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
                    <caption className="sr-only">Bowling statistics table for this section.</caption>
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
                    <caption className="sr-only">Bowling statistics table for this section.</caption>
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
                    <caption className="sr-only">Bowling statistics table for this section.</caption>
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
            <details
              key={`team-set-${filterEpoch}`}
              className="team-set-card stats-collapsible-card"
            >
              <summary className="stats-section-summary">
                <div>
                  <strong>Team / Set Breakdown</strong>
                  <p>
                    Team totals and averages for the current set filters.
                  </p>
                </div>
                <span className="summary-hint">Open / Close Section</span>
              </summary>

              <div className="stats-collapsible-content">
                <div className="table-scroll">
                  <table className="stats-table">
                    <caption className="sr-only">Bowling statistics table for this section.</caption>
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

          <details
            key={`spare-leave-${filterEpoch}`}
            className="spare-leave-card stats-collapsible-card"
          >
            <summary className="stats-section-summary">
              <div>
                <strong>Spare Leave Breakdown</strong>
                <p>
                  Most common leaves, attempts, conversions, misses, and pickup
                  percentages.
                </p>
              </div>
              <span className="summary-hint">Open / Close Section</span>
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
                    <caption className="sr-only">Bowling statistics table for this section.</caption>
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

          {!isBakerUniverse && (
          <details
            key={`board-analysis-${filterEpoch}`}
            className="board-analysis-card stats-collapsible-card"
          >
            <summary className="stats-section-summary">
              <div>
                <strong>Targeting Analysis</strong>
                <p>
                  Foot board, target arrow, actual arrow, breakpoint, miss
                  averages, and progression over filtered sets.
                </p>
              </div>
              <span className="summary-hint">Open / Close Section</span>
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
                  {targetingStatCards.map((stat) => (
                    <button
                      className="stat-card stat-card-button"
                      key={stat.title}
                      type="button"
                      onClick={() => setSelectedDetailedStat(stat)}
                      aria-label={`View details for ${stat.label}`}
                    >
                      <strong>{stat.value}</strong>
                      <span>{stat.label}</span>
                      <small>View Details</small>
                    </button>
                  ))}
                </div>

                <section className="board-table-section">
                  <h4>Board Stats by Ball</h4>

                  <div className="table-scroll">
                    <table className="stats-table">
                    <caption className="sr-only">Bowling statistics table for this section.</caption>
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
                    <caption className="sr-only">Bowling statistics table for this section.</caption>
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
                    <caption className="sr-only">Bowling statistics table for this section.</caption>
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

          {isBakerUniverse && bakerTeamGames.length > 0 && (
            <BakerStatsSection
              key={`baker-stats-${filterEpoch}`}
              games={bakerTeamGames}
              selectedBakerBowler={selectedBakerBowler}
              selectedBall={selectedBall}
            />
          )}

            </>
          )}

          <details
            key={`saved-sets-${filterEpoch}`}
            className="saved-sets-list stats-collapsible-card"
          >
            <summary className="stats-section-summary">
              <div>
                <strong>Saved Sets</strong>
                <p>Expandable saved sets matching the active filters.</p>
              </div>
              <span className="summary-hint">Open / Close Section</span>
            </summary>

            <div className="stats-collapsible-content">
              {sessionGroups.length === 0 ? (
              <EmptyStateCard
                title="No Saved Sets Match"
                description="Try clearing filters, choosing a different set, or logging a new game."
              />
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

                    <span className="summary-hint">Open / Close Details</span>
                  </summary>

                  <div className="saved-set-details">
                    <div className="saved-set-top-actions">
                      {(() => {
                        const completionStatus =
                          getSavedSetCompletionStatus(session);

                        return (
                          <button
                            className="primary-button"
                            disabled={!completionStatus.canContinue}
                            onClick={() => continueSavedSet(session)}
                            title={completionStatus.label}
                          >
                            {completionStatus.label}
                          </button>
                        );
                      })()}
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
                        onStatClick={setSelectedDetailedStat}
                      />
                    )}

                    {session.games.some((game) => game.format === "Baker") && (
                      <BakerSetBreakdown session={session} />
                    )}

                    {session.games.map((game) => (
                      <details
                        className="saved-game-detail-card saved-game-collapsible-card"
                        key={game.id}
                      >
                        <summary className="saved-game-summary">
                          <div>
                            <strong>
                              Game {game.gameNumber} • {getSavedGameScoreSummary(game)}
                            </strong>
                            <span>
                              {game.laneLabel} • {getSavedGameBallSummary(game)}
                            </span>
                          </div>
                          <div className="saved-game-summary-meta">
                            <span>
                              Created:{" "}
                              {new Date(
                                game.createdAt ?? game.savedAt
                              ).toLocaleString()}
                            </span>
                            {hasSavedGameNotes(game) && <span>Notes</span>}
                          </div>
                        </summary>

                        <div className="saved-game-detail-content">
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

                          {game.format !== "Baker" && (
                            <ScoreGrid
                              title={
                                selectedBowler === "All"
                                  ? `Game ${game.gameNumber} Score Grid`
                                  : `${selectedBowler} Game ${game.gameNumber}`
                              }
                              entries={
                                selectedBowler === "All"
                                  ? game.entries.filter(
                                      (entry) =>
                                        selectedBall === "All" ||
                                        entry.ballUsed === selectedBall
                                    )
                                  : game.entries.filter(
                                      (entry) =>
                                        entry.bowlerName === selectedBowler &&
                                        (selectedBall === "All" ||
                                          entry.ballUsed === selectedBall)
                                    )
                              }
                            />
                          )}

                          <p>
                            <strong>Created:</strong>{" "}
                            {new Date(
                              game.createdAt ?? game.savedAt
                            ).toLocaleString()}
                          </p>
                          <p>
                            <strong>Saved:</strong>{" "}
                            {new Date(game.savedAt).toLocaleString()}
                          </p>

                          {hasSavedGameNotes(game) && (
                            <div className="saved-notes-summary">
                              {game.gameNotes && (
                                <p>
                                  <strong>Game Notes:</strong> {game.gameNotes}
                                </p>
                              )}
                              {game.ballReactionNotes && (
                                <p>
                                  <strong>Ball Reaction:</strong>{" "}
                                  {game.ballReactionNotes}
                                </p>
                              )}
                              {game.laneTransitionNotes && (
                                <p>
                                  <strong>Lane Transition:</strong>{" "}
                                  {game.laneTransitionNotes}
                                </p>
                              )}
                              {game.adjustmentNotes && (
                                <p>
                                  <strong>Adjustments:</strong>{" "}
                                  {game.adjustmentNotes}
                                </p>
                              )}
                            </div>
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
                              hasExistingNotes={hasSavedGameNotes(game)}
                              hasChanges={hasGameNotesChanges(game)}
                              onNotesChange={(field, value) =>
                                updateGameNotesDraft(game, field, value)
                              }
                              onSave={() => saveGameMetadata(game)}
                              onReset={() => resetGameMetadataDraft(game)}
                              onClose={() => setEditingGameMetadataId(null)}
                            />
                          )}
                        </div>
                      </details>
                    ))}

                  </div>
                </details>
              ))
            )}
            </div>
          </details>
        </>
      )}

      {selectedDetailedStat && (
        <div
          className="stat-detail-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedDetailedStat(null);
            }
          }}
        >
          <section
            className="stat-detail-modal"
            ref={detailedStatModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="stat-detail-title"
            tabIndex={-1}
          >
            <div className="stat-detail-header">
              <div>
                <p className="eyebrow">Stat Detail</p>
                <h3 id="stat-detail-title">{selectedDetailedStat.title}</h3>
              </div>

              <button
                className="secondary-button"
                onClick={() => setSelectedDetailedStat(null)}
              >
                Close
              </button>
            </div>

            <div className="stat-detail-value">
              <strong>{selectedDetailedStat.value}</strong>
              <span>{selectedDetailedStat.label}</span>
            </div>

            <p>{selectedDetailedStat.description}</p>

            <section className="stat-detail-formula">
              <h4>Formula</h4>
              <p>{selectedDetailedStat.formula}</p>
            </section>

            <div className="table-scroll">
              <table className="stats-table stat-detail-table">
                <caption className="sr-only">
                  Calculation details for {selectedDetailedStat.label}.
                </caption>
                <tbody>
                  {selectedDetailedStat.detailRows.map((row) => (
                    <tr key={row.label}>
                      <th scope="row">{row.label}</th>
                      <td>{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedDetailedStat.note && (
              <p className="helper-text">{selectedDetailedStat.note}</p>
            )}
          </section>
        </div>
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

type StatsExportFormat = "csv" | "excel" | "html" | "pdf";

type StatsExportSectionKey =
  | "overview"
  | "activeFilters"
  | "savedSets"
  | "gameScores"
  | "scorecards"
  | "bowlerBreakdown"
  | "detailedAnalysis"
  | "spareLeaves"
  | "targeting"
  | "frameDetails";

type StatsExportSections = Record<StatsExportSectionKey, boolean>;

const defaultStatsExportSections: StatsExportSections = {
  overview: true,
  activeFilters: true,
  savedSets: true,
  gameScores: true,
  scorecards: false,
  bowlerBreakdown: false,
  detailedAnalysis: false,
  spareLeaves: false,
  targeting: false,
  frameDetails: false,
};

const statsExportSectionOptions: Array<{
  key: StatsExportSectionKey;
  label: string;
  description: string;
}> = [
  {
    key: "overview",
    label: "Overview",
    description: "Main totals, average, high game, and high series.",
  },
  {
    key: "activeFilters",
    label: "Active Filters",
    description: "Shows the filters used to create this export.",
  },
  {
    key: "savedSets",
    label: "Saved Sets",
    description: "One row per saved set with center, pattern, lanes, and scores.",
  },
  {
    key: "gameScores",
    label: "Game Scores",
    description: "Simple score rows for each game and bowler/team.",
  },
  {
    key: "scorecards",
    label: "Scorecards",
    description: "Spreadsheet-style score rows with frames 1-10 and total.",
  },
  {
    key: "bowlerBreakdown",
    label: "Bowler Breakdown",
    description: "Games, average, high game, high series, and mark totals.",
  },
  {
    key: "detailedAnalysis",
    label: "Detailed Stat Analysis",
    description:
      "Analysis stats, average frame score, average by game, score distribution, and transition phases.",
  },
  {
    key: "spareLeaves",
    label: "Spare Leave Breakdown",
    description: "Leave attempts, conversions, misses, and pickup percentages.",
  },
  {
    key: "targeting",
    label: "Targeting Analysis",
    description: "Arrow and breakpoint accuracy summary, plus ball breakdown.",
  },
  {
    key: "frameDetails",
    label: "Frame / Shot Details",
    description: "Raw frame-level pinfall, leave, target, and board data.",
  },
];

function buildStatsExportFileName(
  filters: {
    selectedBowler: string;
    selectedBakerBowler?: string;
    selectedBall: string;
    selectedCompetition: string;
    selectedEventName: string;
    selectedCenter: string;
    selectedLane: string;
    selectedPattern: string;
    selectedEventStage: string;
    selectedSetKey: string;
    selectedGameNumber: string;
    timeFrame?: string;
  },
  extension = "csv"
) {
  const activeFilterParts = [
    "pin-sighter-stats",
    filters.selectedBowler !== "All" ? filters.selectedBowler : "",
    filters.selectedBakerBowler && filters.selectedBakerBowler !== "All"
      ? filters.selectedBakerBowler
      : "",
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
    filters.timeFrame ? filters.timeFrame : "",
  ]
    .filter(Boolean)
    .map((part) =>
      part
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
    );

  return `${activeFilterParts.join("_") || "pin-sighter-stats"}.${extension}`;
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

function getSavedGameBallSummary(game: SavedGameRecord) {
  const uniqueBalls = Array.from(
    new Set(game.entries.map((entry) => entry.ballUsed).filter(Boolean))
  );

  if (uniqueBalls.length === 0) {
    return "No ball logged";
  }

  if (uniqueBalls.length <= 2) {
    return uniqueBalls.join(", ");
  }

  return `${uniqueBalls.slice(0, 2).join(", ")} +${uniqueBalls.length - 2} more`;
}

function getSavedGameScoreSummary(game: SavedGameRecord) {
  return game.scores.map((score) => `${score.label}: ${score.score}`).join(" • ");
}

function hasSavedGameNotes(game: SavedGameRecord) {
  return Boolean(
    game.gameNotes ||
      game.ballReactionNotes ||
      game.laneTransitionNotes ||
      game.adjustmentNotes
  );
}

function createGameMetadataDraft(game: SavedGameRecord): GameMetadataDraft {
  return {
    gameNotes: game.gameNotes ?? "",
    ballReactionNotes: game.ballReactionNotes ?? "",
    laneTransitionNotes: game.laneTransitionNotes ?? "",
    adjustmentNotes: game.adjustmentNotes ?? "",
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
  onNotesChange: (field: keyof GameMetadataDraft, value: string) => void;
  onSave: () => void;
  onReset: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    function handleEscape(keyEvent: KeyboardEvent) {
      if (keyEvent.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div className="ps-modal" role="dialog" aria-modal="true">
      <div className="ps-modal-backdrop" onClick={onClose} />
      <div className="ps-modal-panel">
        <button
          type="button"
          className="ps-modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <h3 className="ps-modal-title">
          {hasExistingNotes ? "Edit Game Notes" : "Add Game Notes"}
        </h3>
        <p>
          Add notes for this specific game. Use Edit Frames for score, pinfall,
          ball, and board corrections.
        </p>

        <div className="structured-notes-grid">
        <label>
          Game Notes
          <textarea
            rows={3}
            value={draft.gameNotes}
            placeholder="General notes for this specific game."
            onChange={(event) =>
              onNotesChange("gameNotes", event.target.value)
            }
          />
        </label>

        <label>
          Ball Reaction Notes
          <textarea
            rows={3}
            value={draft.ballReactionNotes}
            placeholder="Shape, read, carry, over/under, or ball reaction."
            onChange={(event) =>
              onNotesChange("ballReactionNotes", event.target.value)
            }
          />
        </label>

        <label>
          Lane Transition Notes
          <textarea
            rows={3}
            value={draft.laneTransitionNotes}
            placeholder="How the lane changed throughout the game."
            onChange={(event) =>
              onNotesChange("laneTransitionNotes", event.target.value)
            }
          />
        </label>

        <label>
          Adjustment Notes
          <textarea
            rows={3}
            value={draft.adjustmentNotes}
            placeholder="Moves, target changes, surface notes, or ball changes."
            onChange={(event) =>
              onNotesChange("adjustmentNotes", event.target.value)
            }
          />
        </label>
      </div>

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
      </div>
    </div>
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
  const previewScoreSummary = previewScores
    .map((score) => `${score.label}: ${score.score}`)
    .join(" • ");
  const hasFrameChanges = frameEntriesHaveChanges(entries, game.entries);
  const hasFrameChangesRef = useRef(hasFrameChanges);
  const frameEditorModalRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    hasFrameChangesRef.current = hasFrameChanges;
  }, [hasFrameChanges]);

  function handleCloseFrameEditor() {
    if (
      hasFrameChangesRef.current &&
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

  useEffect(() => {
    const unlockDocumentScroll = lockDocumentScroll();
    const previouslyFocusedElement = document.activeElement as HTMLElement | null;

    window.setTimeout(() => frameEditorModalRef.current?.focus(), 0);

    function handleFrameEditorKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        handleCloseFrameEditor();
        return;
      }

      trapFocusWithinElement(event, frameEditorModalRef.current);
    }

    document.addEventListener("keydown", handleFrameEditorKeyDown);

    return () => {
      document.removeEventListener("keydown", handleFrameEditorKeyDown);
      unlockDocumentScroll();
      previouslyFocusedElement?.focus();
    };
  }, [onClose]);

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

  // Single switchable pin deck (matches Game Entry): one deck at a time with
  // arrows stepping through each ball, rolling into adjacent frames at the ends.
  const [activeShot, setActiveShot] = useState(1);

  const availableShots = [1];
  if (shouldShowSecondShot) availableShots.push(2);
  if (shouldShowThirdShot) availableShots.push(3);

  const activeShotConfig =
    activeShot === 3
      ? {
          title: "Third Ball Pin Deck",
          help: "Tenth-frame fill shot. Select pins knocked down.",
          knockedPins: currentEntry.thirdShotKnockedPins,
          availablePins: thirdShotAvailablePins as number[] | undefined,
          onChange: (knockedPins: number[]) =>
            updateCurrentEntry({ thirdShotKnockedPins: knockedPins }),
        }
      : activeShot === 2
      ? {
          title: "Second Ball Pin Deck",
          help:
            isTenthFrame && isStrike
              ? "Tenth-frame bonus shot. Select pins knocked down."
              : "Select pins knocked down on the spare attempt.",
          knockedPins: currentEntry.secondShotKnockedPins,
          availablePins: secondShotAvailablePins as number[] | undefined,
          onChange: updateSecondShotPins,
        }
      : {
          title: "First Ball Pin Deck",
          help: "Select pins knocked down on the first ball.",
          knockedPins: currentEntry.firstShotKnockedPins,
          availablePins: undefined as number[] | undefined,
          onChange: updateFirstShotPins,
        };

  const activeShotIndex = availableShots.indexOf(activeShot);
  const hasPrevShot = activeShotIndex > 0 || currentIndex > 0;
  const hasNextShot =
    activeShotIndex < availableShots.length - 1 ||
    currentIndex < entries.length - 1;

  function goToPreviousShot() {
    if (activeShotIndex > 0) {
      setActiveShot(availableShots[activeShotIndex - 1]);
    } else if (currentIndex > 0) {
      onIndexChange(currentIndex - 1);
    }
  }

  function goToNextShot() {
    if (activeShotIndex < availableShots.length - 1) {
      setActiveShot(availableShots[activeShotIndex + 1]);
    } else if (currentIndex < entries.length - 1) {
      onIndexChange(currentIndex + 1);
    }
  }

  // Reset to the first ball whenever a different frame is shown.
  useEffect(() => {
    setActiveShot(1);
  }, [currentIndex]);

  // Keep the active ball valid if it becomes unavailable (e.g. a strike).
  useEffect(() => {
    if (!availableShots.includes(activeShot)) {
      setActiveShot(availableShots[availableShots.length - 1]);
    }
  }, [activeShot, shouldShowSecondShot, shouldShowThirdShot]);

  return (
    <div className="frame-editor-overlay">
      <section
        className="frame-editor-modal"
        ref={frameEditorModalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="frame-editor-title"
        tabIndex={-1}
      >
        <div className="frame-editor-scroll-shield" aria-hidden="true" />
        <div className="frame-editor-sticky-bar">
          <div className="frame-editor-header">
            <div>
              <p className="eyebrow">Editing Saved Game</p>
              <h3 id="frame-editor-title">
                Game {game.gameNumber} • Frame {currentEntry.frameNumber}
              </h3>
              <p>
                Original saved frame data is loaded here. Move through each
                frame and save when the correction is complete.
              </p>
            </div>

            <button className="secondary-button" onClick={handleCloseFrameEditor}>
              Close
            </button>
          </div>

          <div className="frame-editor-status-grid">
            <article className="mini-stat-card">
              <span>Game</span>
              <strong>{game.gameNumber}</strong>
            </article>
            <article className="mini-stat-card">
              <span>Bowler</span>
              <strong>{currentEntry.bowlerName}</strong>
            </article>
            <article className="mini-stat-card">
              <span>Frame</span>
              <strong>{currentEntry.frameNumber}</strong>
            </article>
            <article className="mini-stat-card">
              <span>Result</span>
              <strong>{frameResult}</strong>
            </article>
            <article className="mini-stat-card wide-mini-stat-card">
              <span>Preview Score</span>
              <strong>{previewScoreSummary}</strong>
            </article>
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
              <h3>{activeShotConfig.title}</h3>
              <p className="helper-text">{activeShotConfig.help}</p>
              <PinDeck
                knockedPins={activeShotConfig.knockedPins}
                availablePins={activeShotConfig.availablePins}
                onChange={activeShotConfig.onChange}
                onPrevShot={goToPreviousShot}
                onNextShot={goToNextShot}
                hasPrevShot={hasPrevShot}
                hasNextShot={hasNextShot}
              />
            </div>
          </div>

          <aside className="frame-editor-side-panel">
            <div className="shot-summary">
              <h4>Frame Summary</h4>
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
          </aside>
        </div>

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
  onStatClick,
}: {
  bowlerName: string;
  selectedBall: string;
  session: ReturnType<typeof buildSessionGroups>[number];
  bowlerHandednessByName: Map<string, Handedness>;
  onStatClick: (stat: DetailedStatDetail) => void;
}) {
  const sessionStats = calculateDetailedBowlerStats(
    bowlerName,
    selectedBall,
    session.games,
    [session],
    bowlerHandednessByName
  );
  const setStatCards = buildSetStatCards({
    stats: sessionStats,
    selectedBowler: bowlerName,
    selectedBall,
    games: session.games,
  });

  return (
    <section className="set-specific-stats-card">
      <h4>
        Set Stats — {bowlerName}
        {selectedBall !== "All" ? ` with ${selectedBall}` : ""}
      </h4>

      <div className="deep-stats-grid">
        {setStatCards.map((stat) => (
          <button
            className="stat-card stat-card-button"
            key={stat.title}
            type="button"
            onClick={() => onStatClick(stat)}
            aria-label={`View details for ${stat.label}`}
          >
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
            <small>View Details</small>
          </button>
        ))}
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
    const teamName = bakerTeamLabelFromNames(game.bowlerNames);
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
        <span className="summary-hint">Open / Close Section</span>
      </summary>

      <div className="stats-collapsible-content">
        <section className="baker-breakdown-card">
          <h4>Team Summary</h4>

          <div className="table-scroll">
            <table className="stats-table">
                    <caption className="sr-only">Bowling statistics table for this section.</caption>
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
                    <caption className="sr-only">Bowling statistics table for this section.</caption>
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
                    <caption className="sr-only">Bowling statistics table for this section.</caption>
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
                    <caption className="sr-only">Bowling statistics table for this section.</caption>
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
                    <caption className="sr-only">Bowling statistics table for this section.</caption>
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

function formatStatRatio(numerator: number, denominator: number) {
  return `${numerator.toLocaleString()} / ${denominator.toLocaleString()}`;
}

function formatDetailedPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function formatHighSeriesDetailRows(
  detail: HighSeriesDetail | null
): { label: string; value: string }[] {
  if (!detail) {
    return [{ label: "Series Games", value: "Not enough games tracked" }];
  }

  return [
    {
      label: "Series Date",
      value: formatSetSavedDateTime(detail.games[0]?.savedAt ?? ""),
    },
    {
      label: "Event / Set",
      value: detail.eventLabel,
    },
    ...detail.games.map((game, index) => ({
      label: `Game ${index + 1}`,
      value: `${game.score} — Game ${game.gameNumber}, ${game.laneLabel}`,
    })),
  ];
}

function getHighGameDetail(scoreEntries: OverviewScoreDetail[]) {
  if (scoreEntries.length === 0) {
    return null;
  }

  return scoreEntries.reduce((highest, current) =>
    current.score > highest.score ? current : highest
  );
}

function buildOverviewStatCards({
  average,
  totalPins,
  totalScores,
  highGameDetail,
  highSeriesDetail,
}: {
  average: number;
  totalPins: number;
  totalScores: number;
  highGameDetail: OverviewScoreDetail | null;
  highSeriesDetail: HighSeriesDetail | null;
}) {
  return {
    average: {
      title: "Average",
      label: "Average",
      value: totalScores > 0 ? average.toFixed(1) : "—",
      description:
        "Average score across the saved games that match the current filters.",
      formula: "Total pins ÷ total game scores.",
      detailRows: [
        { label: "Total Pins", value: totalPins.toLocaleString() },
        { label: "Scores Counted", value: totalScores.toLocaleString() },
        {
          label: "Calculation",
          value:
            totalScores > 0
              ? `${totalPins} ÷ ${totalScores} = ${average.toFixed(1)}`
              : "No scores match the current filters",
        },
      ],
    },
    highGame: {
      title: "High Game",
      label: "High Game",
      value: highGameDetail ? String(highGameDetail.score) : "—",
      description:
        "The highest single game score found under the current filters.",
      formula: "Highest score among matching saved game scores.",
      detailRows: highGameDetail
        ? [
            { label: "Score", value: String(highGameDetail.score) },
            { label: "Bowler / Team", value: highGameDetail.bowlerLabel },
            { label: "Game", value: `Game ${highGameDetail.gameNumber}` },
            { label: "Lane / Pair", value: highGameDetail.laneLabel || "—" },
            { label: "Event / Set", value: highGameDetail.eventLabel || "—" },
            {
              label: "Saved",
              value: formatSetSavedDateTime(highGameDetail.savedAt),
            },
          ]
        : [{ label: "High Game", value: "No scores match the current filters" }],
    },
    highSeries: {
      title: "High Series",
      label: "High Series (3-game)",
      value: highSeriesDetail ? String(highSeriesDetail.total) : "—",
      description:
        "The highest 3-game series found under the current filters.",
      formula:
        "Best total from three consecutive matching games in the same saved set.",
      detailRows: [
        {
          label: "Series Total",
          value: highSeriesDetail ? String(highSeriesDetail.total) : "—",
        },
        ...formatHighSeriesDetailRows(highSeriesDetail),
      ],
      note: "Open bowling games are not included in high series calculations.",
    },
  };
}

function getValidBoardValues(
  rows: BoardShotRow[],
  selector: (row: BoardShotRow) => number | null
) {
  return rows.map(selector).filter((value): value is number => value !== null);
}

function sumBoardValues(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0);
}

function averageBoardValue(values: number[]) {
  return values.length > 0 ? sumBoardValues(values) / values.length : null;
}

function createAverageBoardDetail({
  title,
  label,
  values,
  valueFormatter,
  description,
  formula,
}: {
  title: string;
  label: string;
  values: number[];
  valueFormatter: (value: number | null) => string;
  description: string;
  formula: string;
}): DetailedStatDetail {
  const averageValue = averageBoardValue(values);
  const totalValue = sumBoardValues(values);

  return {
    title,
    label,
    value: valueFormatter(averageValue),
    description,
    formula,
    detailRows: [
      { label: "Values Counted", value: values.length.toLocaleString() },
      { label: "Total", value: totalValue.toFixed(1) },
      {
        label: "Calculation",
        value:
          values.length > 0
            ? `${totalValue.toFixed(1)} ÷ ${values.length} = ${valueFormatter(averageValue)}`
            : "No matching board values tracked",
      },
    ],
  };
}

function createBoardHitRateDetail({
  title,
  label,
  values,
  description,
  formula,
}: {
  title: string;
  label: string;
  values: number[];
  description: string;
  formula: string;
}): DetailedStatDetail {
  const hits = values.filter((value) => Math.abs(value) <= 1).length;
  const percentage = values.length > 0 ? (hits / values.length) * 100 : null;

  return {
    title,
    label,
    value: formatPercentValue(percentage),
    description,
    formula,
    detailRows: [
      { label: "Hits Within ±1", value: hits.toLocaleString() },
      { label: "Values Counted", value: values.length.toLocaleString() },
      {
        label: "Calculation",
        value:
          values.length > 0
            ? `${formatStatRatio(hits, values.length)} = ${formatPercentValue(percentage)}`
            : "No matching board values tracked",
      },
    ],
  };
}

function buildTargetingStatCards(entries: FrameEntry[]): DetailedStatDetail[] {
  const boardRows = entries.map(createBoardShotRow).filter(hasBoardData);
  const arrowMissValues = getValidBoardValues(
    boardRows,
    (row) => row.arrowMiss
  );
  const absoluteArrowMissValues = arrowMissValues.map((value) =>
    Math.abs(value)
  );
  const breakpointMissValues = getValidBoardValues(
    boardRows,
    (row) => row.breakpointMiss
  );
  const absoluteBreakpointMissValues = breakpointMissValues.map((value) =>
    Math.abs(value)
  );

  return [
    {
      title: "Tracked Shots",
      label: "Tracked Shots",
      value: String(boardRows.length),
      description:
        "Number of shots with at least one saved targeting field.",
      formula:
        "Count of frame entries with foot board, target arrow, actual arrow, target breakpoint, or actual breakpoint saved.",
      detailRows: [
        { label: "Tracked Shots", value: boardRows.length.toLocaleString() },
        { label: "Total Filtered Frames", value: entries.length.toLocaleString() },
      ],
    },
    createAverageBoardDetail({
      title: "Average Arrow Miss",
      label: "Avg Arrow Miss",
      values: arrowMissValues,
      valueFormatter: formatSignedNumber,
      description:
        "Average directional miss at the arrows. Positive means farther right on the board scale, negative means farther left.",
      formula: "Sum of (actual arrow − target arrow) ÷ arrow values counted.",
    }),
    createAverageBoardDetail({
      title: "Average Absolute Arrow Miss",
      label: "Avg Abs Arrow Miss",
      values: absoluteArrowMissValues,
      valueFormatter: formatMaybeNumber,
      description:
        "Average size of the arrow miss regardless of left/right direction.",
      formula: "Sum of absolute arrow misses ÷ arrow values counted.",
    }),
    createBoardHitRateDetail({
      title: "Arrow Within ±1 Board",
      label: "Arrow ±1 Board",
      values: arrowMissValues,
      description:
        "How often the actual arrow was within one board of the target arrow.",
      formula: "Arrow misses with absolute value ≤ 1 ÷ arrow values counted.",
    }),
    createAverageBoardDetail({
      title: "Average Breakpoint Miss",
      label: "Avg Breakpoint Miss",
      values: breakpointMissValues,
      valueFormatter: formatSignedNumber,
      description:
        "Average directional miss at the breakpoint. Positive means farther right on the board scale, negative means farther left.",
      formula:
        "Sum of (actual breakpoint − target breakpoint) ÷ breakpoint values counted.",
    }),
    createAverageBoardDetail({
      title: "Average Absolute Breakpoint Miss",
      label: "Avg Abs BP Miss",
      values: absoluteBreakpointMissValues,
      valueFormatter: formatMaybeNumber,
      description:
        "Average size of the breakpoint miss regardless of left/right direction.",
      formula: "Sum of absolute breakpoint misses ÷ breakpoint values counted.",
    }),
    createBoardHitRateDetail({
      title: "Breakpoint Within ±1 Board",
      label: "Breakpoint ±1 Board",
      values: breakpointMissValues,
      description:
        "How often the actual breakpoint was within one board of the target breakpoint.",
      formula:
        "Breakpoint misses with absolute value ≤ 1 ÷ breakpoint values counted.",
    }),
  ];
}

function getSetScoreRows(
  games: SavedGameRecord[],
  bowlerName: string
): SetStatDetailRow[] {
  return games.flatMap((game) => {
    const score = game.scores.find(
      (currentScore) => currentScore.label === bowlerName
    );

    if (!score) {
      return [];
    }

    const eventLabel = [
      game.eventName || game.competitionType,
      game.eventStageLabel,
      game.centerName,
    ]
      .filter(Boolean)
      .join(" • ");

    return [
      {
        id: `${game.id}:${score.label}`,
        score: score.score,
        gameNumber: game.gameNumber,
        laneLabel: game.laneLabel,
        savedAt: game.savedAt,
        eventLabel,
      },
    ];
  });
}

function formatSetScoreDetailRows(rows: SetStatDetailRow[]) {
  if (rows.length === 0) {
    return [{ label: "Scores", value: "No matching games tracked" }];
  }

  return rows.map((row, index) => ({
    label: `Game ${index + 1}`,
    value: `${row.score} — Game ${row.gameNumber}, ${
      row.laneLabel || "No lane"
    }, ${row.eventLabel || "Saved Set"}, ${formatSetSavedDateTime(row.savedAt)}`,
  }));
}

function buildSetStatCards({
  stats,
  selectedBowler,
  selectedBall,
  games,
}: {
  stats: ReturnType<typeof calculateDetailedBowlerStats>;
  selectedBowler: string;
  selectedBall: string;
  games: SavedGameRecord[];
}): DetailedStatDetail[] {
  const scoreRows = getSetScoreRows(games, selectedBowler);
  const ballFilterNote =
    selectedBall === "All"
      ? undefined
      : "A ball filter is active. Frame-based stats use only frames matching that ball, while score-based stats use saved game scores in the current set.";

  return [
    {
      title: "Set Games",
      label: "Games",
      value: String(stats.numGames),
      description:
        "The number of saved non-Baker games counted for this bowler in this set.",
      formula: "Count of matching saved game scores.",
      detailRows: [
        { label: "Games Counted", value: stats.numGames.toLocaleString() },
        { label: "Total Pins", value: stats.totalPins.toLocaleString() },
        ...formatSetScoreDetailRows(scoreRows),
      ],
      note: ballFilterNote,
    },
    {
      title: "Set Average",
      label: "Average",
      value: stats.average.toFixed(1),
      description:
        "Average score for this bowler in this set.",
      formula: "Total pins ÷ games counted.",
      detailRows: [
        { label: "Total Pins", value: stats.totalPins.toLocaleString() },
        { label: "Games Counted", value: stats.numGames.toLocaleString() },
        {
          label: "Calculation",
          value:
            stats.numGames > 0
              ? `${stats.totalPins} ÷ ${stats.numGames} = ${stats.average.toFixed(1)}`
              : "No matching games tracked",
        },
        ...formatSetScoreDetailRows(scoreRows),
      ],
      note: ballFilterNote,
    },
    {
      title: "Set Pocket Percentage",
      label: "Pocket %",
      value: formatDetailedPercent(stats.pocketPercentage),
      description:
        "How often this bowler's first ball hit the pocket in this set.",
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
      title: "Set Carry Percentage",
      label: "Carry %",
      value: formatDetailedPercent(stats.carryPercentage),
      description:
        "How often pocket hits carried for strikes in this set.",
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
      title: "Set Double Percentage",
      label: "Double %",
      value: formatDetailedPercent(stats.doublePercentage),
      description:
        "How often a pocket strike followed a previous-frame strike in this set.",
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
      title: "Set Makeable Spare Percentage",
      label: "Makeable Spare %",
      value: formatDetailedPercent(stats.makeableSpareConversion),
      description:
        "How often makeable spare attempts were converted in this set.",
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
      title: "Set Clean Percentage",
      label: "Clean %",
      value: formatDetailedPercent(stats.cleanPercentage),
      description:
        "How often this bowler avoided open frames in this set.",
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
      title: "Set Split Percentage",
      label: "Split %",
      value: formatDetailedPercent(stats.splitPercentage),
      description:
        "How often this bowler left a split on the first ball in this set.",
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
      title: "Set Clean Games",
      label: "Clean Games",
      value: String(stats.cleanGames),
      description:
        "The number of games in this set where this bowler had no open frames.",
      formula: "Count of matching games where every completed frame was clean.",
      detailRows: [
        { label: "Clean Games", value: stats.cleanGames.toLocaleString() },
        { label: "Games Counted", value: stats.numGames.toLocaleString() },
      ],
      note: ballFilterNote,
    },
  ];
}

function buildDetailedStatCards(
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