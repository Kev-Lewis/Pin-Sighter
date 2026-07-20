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
  calculateScoresForGame,
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
  bakerTeamLabelForGame,
  type StatsFilters,
} from "./lib/statsFilters";
import { ToastMessage } from "./components/ToastMessage";
import { EmptyStateCard } from "./components/EmptyStateCard";
import { BoardSelect } from "./components/BoardSelect";
import { PinDeck } from "./components/PinDeck";
import { ScoreGrid } from "./components/ScoreGrid";
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
  countCleanGames,
  isSpareEntry,
  isCleanFrame,
} from "./stats/frames";
import {
  calculateSpareLeaveSummary,
  calculateSpareLeaveRows,
} from "./stats/spareLeaves";
import {
  calculateBoardStats,
  calculateBoardProgressionRows,
  buildTargetingStatCards,
} from "./stats/board";
import {
  getHighGameDetail,
  buildOverviewStatCards,
  type OverviewScoreDetail,
} from "./stats/overview";
import type { DetailedStatDetail } from "./stats/types";
import {
  calculateDetailedBowlerStats,
  buildDetailedStatCards,
} from "./stats/detailed";
import {
  buildSetFilterOptions,
  calculateTeamSetRows,
} from "./stats/setStats";
import {
  BakerStatsSection,
  BakerSetBreakdown,
  BakerFrameTable,
} from "./stats/components/BakerStats";
import {
  type StatsExportFormat,
  defaultStatsExportSections,
  statsExportSectionOptions,
} from "./stats/export";
import { DetailedStatModal } from "./stats/components/DetailedStatModal";
import { StatsFilterBar } from "./stats/components/StatsFilterBar";
import {
  OverviewSection,
  FrameOutcomesSection,
  SpareLeaveSection,
  TeamSetSection,
  TargetingSection,
  BowlerBreakdownTable,
  DetailedBowlerAnalysis,
} from "./stats/components/StatsSections";
import { useStatsExport } from "./stats/useStatsExport";
import { useSavedSetEditing } from "./stats/useSavedSetEditing";
import { SetSpecificStats } from "./stats/components/SetSpecificStats";
import { SavedGameNotesEditor } from "./stats/components/SavedGameNotesEditor";
import { SavedSetMetadataEditor } from "./stats/components/SavedSetMetadataEditor";
import { SavedFrameEditModal } from "./stats/components/SavedFrameEditModal";
import {
  getSavedGameBallSummary,
  getSavedGameScoreSummary,
  hasSavedGameNotes,
} from "./stats/savedGames";
import { footBoardOptions, laneBoardOptions } from "./lib/boards";
import { cloneFrameEntryForEditing } from "./lib/frameEditing";
import { APP_VERSION } from "./version";
import {
  buildSessionGroups,
  getHighSeriesDetail,
  getHighFullSeries,
  getHighTeamSeriesDetail,
} from "./lib/sessions";
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

      <section className="log-setup-card">
        <h3>Session</h3>
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
      </section>

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
  const [selectedDetailedStat, setSelectedDetailedStat] =
    useState<DetailedStatDetail | null>(null);
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

  const {
    exportFormat,
    setExportFormat,
    exportSections,
    setExportSections,
    isExportPanelOpen,
    setIsExportPanelOpen,
    exportModalRef,
    getStatsExportFileName,
    getExportExtension,
    getExportFormatLabel,
    hasSelectedExportSections,
    toggleExportSection,
    applyExportPreset,
    runStatsExport,
  } = useStatsExport({
    filters,
    selectedBowler,
    selectedBakerBowler,
    selectedBall,
    selectedCompetition,
    selectedEventName,
    selectedEventStage,
    selectedSetKey,
    selectedGameNumber,
    selectedCenter,
    selectedLane,
    selectedPattern,
    statsFilteredGames,
    sessionGroups,
    overallAverage,
    strikeCount,
    spareCount,
    openCount,
    splitCount,
    cleanGameCount,
    overviewHighGame,
    overviewHighThreeGameSeries,
    bowlerRows,
    detailedStats,
    spareLeaveRows,
    spareLeaveSummary,
    boardStats,
    onToast: showStatsToast,
  });

  function clearFilters() {
    setFilters({ ...defaultStatsFilters });
    setFilterEpoch((epoch) => epoch + 1);
  }


  const {
    editingSetMetadataKey,
    setEditingSetMetadataKey,
    editingGameMetadataId,
    setEditingGameMetadataId,
    frameEditorEntries,
    frameEditorIndex,
    setFrameEditorIndex,
    frameEditorGame,
    getSetMetadataDraft,
    hasSetMetadataChanges,
    updateSetMetadataDraft,
    updateSetGameLaneDraft,
    resetSetMetadataDraft,
    saveSetMetadata,
    getGameMetadataDraft,
    hasGameNotesChanges,
    updateGameNotesDraft,
    resetGameMetadataDraft,
    saveGameMetadata,
    openFrameEditor,
    closeFrameEditor,
    updateFrameEditorEntry,
    saveFrameEdits,
    deleteSavedSet,
    deleteSavedGame,
    getSavedSetCompletionStatus,
  } = useSavedSetEditing({
    savedGames,
    sessionGroups,
    events,
    selectedGameNumber,
    setFilters,
    setSavedGames,
    setSavedEventLogs,
    onToast: showStatsToast,
  });

  function showStatsToast(message: string) {
    setToastMessage(message);
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

  const statsSectionsRef = useRef<HTMLDivElement>(null);
  function setAllSectionsOpen(open: boolean) {
    statsSectionsRef.current
      ?.querySelectorAll("details")
      .forEach((section) => {
        section.open = open;
      });
  }

  const [openSavedSetKey, setOpenSavedSetKey] = useState<string | null>(null);
  const openSavedSet =
    openSavedSetKey !== null
      ? sessionGroups.find((group) => group.sessionKey === openSavedSetKey) ??
        null
      : null;
  useEffect(() => {
    if (!openSavedSetKey) {
      return;
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenSavedSetKey(null);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [openSavedSetKey]);

  return (
    <>
      <div className="stats-page-head">
        <div>
          <h2>Stats</h2>
          <p>
            Review saved sets, narrow stats with filters, export data, and remove
            logs that need to be entered again.
          </p>
        </div>
        {savedGames.length > 0 && (
          <button
            className="stats-export-button"
            disabled={statsFilteredGames.length === 0}
            onClick={() => setIsExportPanelOpen(true)}
          >
            Export report
          </button>
        )}
      </div>

      <div className="stats-toast-anchor">
        <ToastMessage
          className="stats-toast"
          message={toastMessage}
          onDismiss={() => setToastMessage("")}
        />
      </div>

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
          <StatsFilterBar
            filters={filters}
            selected={{
              bowler: selectedBowler,
              bakerBowler: selectedBakerBowler,
              ball: selectedBall,
              competition: selectedCompetition,
              eventName: selectedEventName,
              eventStage: selectedEventStage,
              setKey: selectedSetKey,
              gameNumber: selectedGameNumber,
              center: selectedCenter,
              lane: selectedLane,
              pattern: selectedPattern,
            }}
            options={{
              selection: selectionOptions,
              bakerBowler: bakerBowlerOptions,
              ball: ballOptions,
              competition: competitionOptions,
              event: eventOptions,
              eventStage: eventStageOptions,
              set: setOptions,
              game: gameOptions,
              center: centerOptions,
              lane: laneOptions,
              pattern: patternOptions,
            }}
            isBakerTeamSelection={isBakerTeamSelection}
            usesEventFilter={usesEventFilter}
            usesSetFilter={usesSetFilter}
            onUpdateFilters={updateFilters}
            onClearFilters={clearFilters}
          />

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

          <div className="stats-section-toolbar">
            <button
              type="button"
              className="stats-toolbar-button"
              onClick={() => setAllSectionsOpen(false)}
            >
              Collapse all
            </button>
            <button
              type="button"
              className="stats-toolbar-button"
              onClick={() => setAllSectionsOpen(true)}
            >
              Expand all
            </button>
          </div>

          <div className="stats-sections" ref={statsSectionsRef}>
          <OverviewSection
            filterEpoch={filterEpoch}
            isBakerTeamSelection={isBakerTeamSelection}
            hiddenBakerGameCount={hiddenBakerGameCount}
            sessionGroups={sessionGroups}
            statsFilteredGames={statsFilteredGames}
            overviewStatCards={overviewStatCards}
            overallAverage={overallAverage}
            overviewHighGame={overviewHighGame}
            overviewHighThreeGameSeries={overviewHighThreeGameSeries}
            onStatClick={setSelectedDetailedStat}
          />

          <FrameOutcomesSection
            filterEpoch={filterEpoch}
            frameCount={filteredEntries.length}
            strikeCount={strikeCount}
            spareCount={spareCount}
            openCount={openCount}
            splitCount={splitCount}
            cleanGameCount={cleanGameCount}
          />

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
              <BowlerBreakdownTable bowlerRows={bowlerRows} />
              {detailedStats && (
                <DetailedBowlerAnalysis
                  detailedStats={detailedStats}
                  detailedStatCards={detailedStatCards}
                  selectedBowler={selectedBowler}
                  selectedBall={selectedBall}
                  onStatClick={setSelectedDetailedStat}
                />
              )}

            </div>
          </details>
          )}

          {usesEventFilter &&
            teamSetRows.length > 0 &&
            (selectedBowler === "All" ||
              (isBakerTeamSelection && selectedBakerBowler === "All")) && (
            <TeamSetSection
              filterEpoch={filterEpoch}
              teamSetRows={teamSetRows}
            />
          )}

          <SpareLeaveSection
            filterEpoch={filterEpoch}
            spareLeaveSummary={spareLeaveSummary}
            spareLeaveRows={spareLeaveRows}
          />

          {!isBakerUniverse && (
          <TargetingSection
            filterEpoch={filterEpoch}
            boardStats={boardStats}
            targetingStatCards={targetingStatCards}
            boardProgressionRows={boardProgressionRows}
            onStatClick={setSelectedDetailedStat}
          />
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
                <button
                  type="button"
                  className={`saved-set-card${
                    openSavedSetKey === session.sessionKey ? " is-open" : ""
                  }`}
                  key={session.sessionKey}
                  onClick={() => setOpenSavedSetKey(session.sessionKey)}
                >
                  <div className="saved-set-card-info">
                    <strong>{session.title}</strong>
                    <p>
                      {session.games.length} game
                      {session.games.length === 1 ? "" : "s"} •{" "}
                      {session.centerName} • {session.patternName}
                      {session.games[0]?.setNotes ? " • Notes" : ""}
                    </p>
                  </div>
                  <span className="saved-set-card-cue" aria-hidden="true">›</span>
                </button>
              ))
            )}
            </div>
          </details>
          </div>
        </>
      )}

      {openSavedSet && (
        <div
          className="saved-set-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setOpenSavedSetKey(null);
            }
          }}
        >
          <section className="saved-set-modal" role="dialog" aria-modal="true">
            <div className="saved-set-modal-head">
              <div>
                <strong>{openSavedSet.title}</strong>
                <p>
                  {openSavedSet.games.length} game
                  {openSavedSet.games.length === 1 ? "" : "s"} •{" "}
                  {openSavedSet.centerName} • {openSavedSet.patternName}
                </p>
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setOpenSavedSetKey(null)}
              >
                Close
              </button>
            </div>
            <div className="saved-set-modal-body">
              {(() => {
                const session = openSavedSet;
                return (
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
                );
              })()}
            </div>
          </section>
        </div>
      )}

      {selectedDetailedStat && (
        <DetailedStatModal
          stat={selectedDetailedStat}
          onClose={() => setSelectedDetailedStat(null)}
        />
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
