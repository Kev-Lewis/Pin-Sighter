// =============================================================================
// Backup, import & data-normalization — the user-data safety layer.
//
// Extracted from App.tsx so the import/normalize/versioning logic can be
// unit-tested in isolation (see backup.test.ts). A bug here silently corrupts
// or drops real user data on import, so this is the highest-stakes pure logic
// in the app.
//
// Domain types are imported type-only from App.tsx — those imports are erased
// at compile time, so this module has NO runtime dependency on App (it loads
// first, App imports its functions back).
// =============================================================================

import type {
  Bowler,
  Center,
  Pattern,
  EventSetup,
  SavedEventLog,
  SavedGameRecord,
} from "../App";

// --- Backup shapes -----------------------------------------------------------
export type PinSighterBackupData = {
  bowlers: Bowler[];
  centers: Center[];
  patterns: Pattern[];
  events: EventSetup[];
  savedEventLogs: SavedEventLog[];
  savedGames: SavedGameRecord[];
};

export type PinSighterBackup = {
  appName: "Pin-Sighter";
  version: number;
  exportedAt: string;
  data: PinSighterBackupData;
};

export type PinSighterImportResult = {
  data: PinSighterBackupData;
  warnings: string[];
};

// --- Backup versioning -------------------------------------------------------
export const currentBackupVersion = 1;
export const minimumSupportedBackupVersion = 1;

// --- The "Unknown" pattern sentinel ------------------------------------------
// A locked fallback pattern that must always exist so games logged without a
// known lane condition still have something to reference.
export const unknownPatternId = 0;

export const unknownPattern: Pattern = {
  id: unknownPatternId,
  name: "Unknown",
  length: "",
  volume: "",
  ratio: "",
  dropBrush: "",
  source: "",
  notes: "Default fallback pattern when the condition is unknown.",
};

export function isUnknownPattern(pattern: Pattern): boolean {
  return pattern.id === unknownPatternId;
}

/**
 * Guarantee exactly one Unknown pattern at the front of the list: drop any
 * existing Unknown (by id or by name) and prepend a fresh canonical copy.
 */
export function ensureUnknownPattern(patterns: Pattern[]): Pattern[] {
  const editablePatterns = patterns.filter((pattern) => {
    const normalizedName = pattern.name.trim().toLowerCase();

    return (
      pattern.id !== unknownPatternId &&
      normalizedName !== "unknown" &&
      normalizedName !== "unknown / house shot"
    );
  });

  return [{ ...unknownPattern }, ...editablePatterns];
}

// --- Create a backup ---------------------------------------------------------
export function createPinSighterBackup(
  data: PinSighterBackupData
): PinSighterBackup {
  return {
    appName: "Pin-Sighter",
    version: currentBackupVersion,
    exportedAt: new Date().toISOString(),
    data: {
      ...data,
      patterns: ensureUnknownPattern(data.patterns),
    },
  };
}

// --- Import & normalize a backup ---------------------------------------------
/**
 * Turn a parsed backup (wrapped or legacy bare data) into normalized app data
 * plus human-readable warnings about anything that looked off.
 */
export function getImportedBackupData(
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

export function normalizeImportedBackupData(
  importedData: Partial<PinSighterBackupData>,
  warnings: string[]
): PinSighterBackupData {
  return {
    bowlers: getImportedArray(importedData, "bowlers", warnings),
    centers: getImportedArray(importedData, "centers", warnings),
    patterns: ensureUnknownPattern(
      getImportedArray(importedData, "patterns", warnings)
    ),
    events: getImportedArray(importedData, "events", warnings),
    savedEventLogs: getImportedArray(importedData, "savedEventLogs", warnings),
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
