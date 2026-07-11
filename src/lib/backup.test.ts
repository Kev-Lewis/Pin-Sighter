import { describe, it, expect } from "vitest";
import {
  ensureUnknownPattern,
  createPinSighterBackup,
  getImportedBackupData,
  normalizeImportedBackupData,
  isUnknownPattern,
  unknownPatternId,
  currentBackupVersion,
  type PinSighterBackup,
  type PinSighterBackupData,
} from "./backup";

// --- fixtures ----------------------------------------------------------------
function pat(id: number, name: string) {
  return {
    id,
    name,
    length: "",
    volume: "",
    ratio: "",
    dropBrush: "",
    source: "",
    notes: "",
  };
}

function emptyData(): PinSighterBackupData {
  return {
    bowlers: [],
    centers: [],
    patterns: [],
    events: [],
    savedEventLogs: [],
    savedGames: [],
  };
}

const wrap = (
  data: PinSighterBackupData,
  version = currentBackupVersion
): PinSighterBackup => ({
  appName: "Pin-Sighter",
  version,
  exportedAt: "2026-01-01T00:00:00.000Z",
  data,
});

// --- ensureUnknownPattern ----------------------------------------------------
describe("ensureUnknownPattern", () => {
  it("adds an Unknown pattern to an empty list", () => {
    const result = ensureUnknownPattern([]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(unknownPatternId);
    expect(result[0].name).toBe("Unknown");
  });

  it("keeps Unknown at the front, editable patterns after", () => {
    const result = ensureUnknownPattern([pat(5, "Wolf")]);
    expect(result.map((p) => p.name)).toEqual(["Unknown", "Wolf"]);
  });

  it("replaces an existing id-0 pattern with the canonical Unknown", () => {
    const result = ensureUnknownPattern([pat(0, "Tampered Name"), pat(5, "Wolf")]);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(0);
    expect(result[0].name).toBe("Unknown");
  });

  it("dedupes patterns named 'unknown' regardless of case or id", () => {
    const result = ensureUnknownPattern([pat(9, "unknown"), pat(5, "Wolf")]);
    expect(result.map((p) => p.name)).toEqual(["Unknown", "Wolf"]);
  });

  it("dedupes 'Unknown / House Shot'", () => {
    const result = ensureUnknownPattern([pat(9, "Unknown / House Shot")]);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Unknown");
  });

  it("always yields exactly one Unknown pattern", () => {
    const result = ensureUnknownPattern([pat(0, "a"), pat(9, "unknown"), pat(5, "Wolf")]);
    expect(result.filter(isUnknownPattern)).toHaveLength(1);
  });
});

// --- createPinSighterBackup --------------------------------------------------
describe("createPinSighterBackup", () => {
  it("wraps data with app name, version, and a timestamp", () => {
    const backup = createPinSighterBackup(emptyData());
    expect(backup.appName).toBe("Pin-Sighter");
    expect(backup.version).toBe(currentBackupVersion);
    expect(typeof backup.exportedAt).toBe("string");
    expect(Number.isNaN(Date.parse(backup.exportedAt))).toBe(false);
  });

  it("guarantees an Unknown pattern in the exported data", () => {
    const backup = createPinSighterBackup({ ...emptyData(), patterns: [pat(5, "Wolf")] });
    expect(backup.data.patterns.map((p) => p.name)).toEqual(["Unknown", "Wolf"]);
  });

  it("passes the other data slices through untouched", () => {
    const data = { ...emptyData(), bowlers: [{ id: 1, name: "Kevin" } as never] };
    const backup = createPinSighterBackup(data);
    expect(backup.data.bowlers).toEqual([{ id: 1, name: "Kevin" }]);
  });
});

// --- getImportedBackupData: versioning + warnings ----------------------------
describe("getImportedBackupData", () => {
  it("accepts a current-version wrapped backup with no warnings", () => {
    const { warnings, data } = getImportedBackupData(wrap(emptyData()));
    expect(warnings).toEqual([]);
    expect(data.patterns).toHaveLength(1); // Unknown ensured
  });

  it("warns on a legacy (unwrapped) backup", () => {
    const { warnings } = getImportedBackupData(emptyData());
    expect(warnings).toContain("Legacy backup format detected.");
  });

  it("warns when the backup version is older than supported", () => {
    const { warnings } = getImportedBackupData(wrap(emptyData(), 0));
    expect(warnings.some((w) => w.includes("older than the supported version"))).toBe(true);
  });

  it("warns when the backup version is newer than this app", () => {
    const { warnings } = getImportedBackupData(wrap(emptyData(), 999));
    expect(warnings.some((w) => w.includes("newer than this app version"))).toBe(true);
  });

  it("still normalizes + ensures the Unknown pattern on a legacy import", () => {
    const { data } = getImportedBackupData(emptyData());
    expect(data.patterns).toHaveLength(1);
    expect(isUnknownPattern(data.patterns[0])).toBe(true);
  });
});

// --- normalizeImportedBackupData: array validation ---------------------------
describe("normalizeImportedBackupData", () => {
  it("fills missing slices with empty lists and warns for each", () => {
    const warnings: string[] = [];
    const data = normalizeImportedBackupData({}, warnings);
    expect(data.bowlers).toEqual([]);
    expect(data.centers).toEqual([]);
    expect(data.events).toEqual([]);
    expect(data.savedEventLogs).toEqual([]);
    expect(data.savedGames).toEqual([]);
    expect(data.patterns).toHaveLength(1); // empty → Unknown ensured
    // one warning per missing slice (bowlers, centers, patterns, events, logs, games)
    expect(warnings).toHaveLength(6);
    expect(warnings.every((w) => w.includes("Missing or invalid"))).toBe(true);
  });

  it("rejects non-array slices and substitutes empty lists", () => {
    const warnings: string[] = [];
    const junk = { bowlers: "nope", savedGames: 42 } as unknown as Partial<PinSighterBackupData>;
    const data = normalizeImportedBackupData(junk, warnings);
    expect(data.bowlers).toEqual([]);
    expect(data.savedGames).toEqual([]);
    expect(warnings.some((w) => w.includes("bowlers"))).toBe(true);
    expect(warnings.some((w) => w.includes("savedGames"))).toBe(true);
  });

  it("passes valid slices through and ensures the Unknown pattern", () => {
    const warnings: string[] = [];
    const input = { ...emptyData(), patterns: [pat(5, "Wolf")] };
    const data = normalizeImportedBackupData(input, warnings);
    expect(warnings).toEqual([]);
    expect(data.patterns.map((p) => p.name)).toEqual(["Unknown", "Wolf"]);
  });
});
