// =============================================================================
// Persistence helpers — the localStorage namespace, generic load/save, the
// first-launch-setup checks, and the JSON backup download. Extracted from
// App.tsx. Pure browser/DOM logic; the only module dependency is lib/backup
// (for the backup types + the "Unknown" pattern sentinel).
//
// NOTE: the Tauri filesystem layer (writeAppDataFile / readAppDataFileWithTimeout
// / writeTemporaryBackup) still lives in App.tsx and imports `storageKeys` and
// `saveToLocalStorage` from here.
// =============================================================================

import { ensureUnknownPattern } from "./backup";
import type { PinSighterBackup, PinSighterBackupData } from "./backup";

export const storageKeys = {
  bowlers: "pin-sighter:bowlers:v1",
  centers: "pin-sighter:centers:v1",
  patterns: "pin-sighter:patterns:v1",
  events: "pin-sighter:events:v1",
  savedEventLogs: "pin-sighter:saved-event-logs:v1",
  savedGames: "pin-sighter:saved-games:v1",
  appDataFileFallback: "pin-sighter:app-data-file-json:v1",
  temporaryBackup: "pin-sighter:temporary-backup-json:v1",
  setupComplete: "pin-sighter:setup-complete:v1",
  mainBowler: "pin-sighter:main-bowler:v1",
};

export function loadFromLocalStorage<T>(key: string, fallbackValue: T): T {
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

export function saveToLocalStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Unable to save ${key} to localStorage.`, error);
  }
}

function hasExistingPinSighterData() {
  return Object.entries(storageKeys).some(([storageName, key]) => {
    if (
      storageName === "temporaryBackup" ||
      storageName === "setupComplete" ||
      storageName === "appDataFileFallback" ||
      storageName === "mainBowler"
    ) {
      return false;
    }

    return localStorage.getItem(key) !== null;
  });
}

export function hasCompletedFirstLaunchSetup() {
  return (
    localStorage.getItem(storageKeys.setupComplete) === "true" ||
    hasExistingPinSighterData()
  );
}

export function markFirstLaunchSetupComplete() {
  localStorage.setItem(storageKeys.setupComplete, "true");
}

export function clearPinSighterLocalStorage() {
  Object.entries(storageKeys).forEach(([storageName, key]) => {
    if (storageName !== "temporaryBackup" && storageName !== "setupComplete") {
      localStorage.removeItem(key);
    }
  });
}

export function createEmptyBackupData(): PinSighterBackupData {
  return {
    bowlers: [],
    centers: [],
    patterns: ensureUnknownPattern([]),
    events: [],
    savedEventLogs: [],
    savedGames: [],
  };
}

export function downloadJsonBackup(fileName: string, backup: PinSighterBackup) {
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

export function formatBackupFileTimestamp() {
  return new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
}
