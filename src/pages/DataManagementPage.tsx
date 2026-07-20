// Data management page — export / import / reset the on-device data. Lifted out
// of App.tsx into src/pages/. Depends only on the extracted data layer
// (lib/storage + lib/backup) and the shared ToastMessage component; no runtime
// coupling back to App beyond the state setters passed as props.

import { useState, useEffect } from "react";
import type { ChangeEvent, Dispatch, SetStateAction } from "react";
import type {
  Bowler,
  Center,
  Pattern,
  EventSetup,
  SavedEventLog,
  SavedGameRecord,
} from "../types";
import {
  createPinSighterBackup,
  getImportedBackupData,
  ensureUnknownPattern,
  currentBackupVersion,
} from "../lib/backup";
import type { PinSighterBackup, PinSighterBackupData } from "../lib/backup";
import {
  downloadJsonBackup,
  formatBackupFileTimestamp,
  markFirstLaunchSetupComplete,
  clearPinSighterLocalStorage,
  createEmptyBackupData,
} from "../lib/storage";
import { ToastMessage } from "../components/ToastMessage";

type DataManagementPageProps = {
  bowlers: Bowler[];
  setBowlers: Dispatch<SetStateAction<Bowler[]>>;
  centers: Center[];
  setCenters: Dispatch<SetStateAction<Center[]>>;
  patterns: Pattern[];
  setPatterns: Dispatch<SetStateAction<Pattern[]>>;
  events: EventSetup[];
  setEvents: Dispatch<SetStateAction<EventSetup[]>>;
  setSavedEventLogs: Dispatch<SetStateAction<SavedEventLog[]>>;
  savedGames: SavedGameRecord[];
  setSavedGames: Dispatch<SetStateAction<SavedGameRecord[]>>;
  backupData: PinSighterBackupData;
};

export function DataManagementPage({
  bowlers,
  setBowlers,
  centers,
  setCenters,
  patterns,
  setPatterns,
  events,
  setEvents,
  setSavedEventLogs,
  savedGames,
  setSavedGames,
  backupData,
}: DataManagementPageProps) {
  const [dataMessage, setDataMessage] = useState("");

  useEffect(() => {
    if (!dataMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => setDataMessage(""), 3000);

    return () => window.clearTimeout(timeoutId);
  }, [dataMessage]);

  function handleExportData() {
    const backup = createPinSighterBackup(backupData);

    downloadJsonBackup(
      `pin-sighter-backup-${formatBackupFileTimestamp()}.json`,
      backup
    );
    setDataMessage("Backup exported.");
  }

  async function handleImportData(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      !window.confirm(
        "Importing this backup will replace all current Pin-Sighter data on this device. Continue?"
      )
    ) {
      event.target.value = "";
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
      setPatterns(ensureUnknownPattern(importedData.patterns));
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

  function handleClearData() {
    if (
      !window.confirm(
        "Reset all Pin-Sighter data and start empty? This cannot be undone unless you have a backup."
      )
    ) {
      return;
    }

    clearPinSighterLocalStorage();
    const emptyData = createEmptyBackupData();
    setBowlers(emptyData.bowlers);
    setCenters(emptyData.centers);
    setPatterns(ensureUnknownPattern(emptyData.patterns));
    setEvents(emptyData.events);
    setSavedEventLogs(emptyData.savedEventLogs);
    setSavedGames(emptyData.savedGames);
    markFirstLaunchSetupComplete();
    setDataMessage("App data reset. You are starting empty.");
  }

  return (
    <>
      <h2>Data</h2>
      <p>
        Back up, restore, reset, or clear the data stored on this device.
      </p>

      <ToastMessage
        message={dataMessage}
        onDismiss={() => setDataMessage("")}
      />

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
          <h3>Backup</h3>
          <p>
            Download one JSON backup file with all bowlers, centers, patterns,
            events, saved sets, and saved games. Save this file somewhere safe
            before switching browsers, devices, or clearing browser data.
          </p>
        </div>
        <button className="primary-button" onClick={handleExportData}>
          Export All Data
        </button>
      </section>

      <section className="data-card">
        <div>
          <h3>Restore</h3>
          <p>
            Import a Pin-Sighter JSON backup from your computer. This replaces
            the current browser data.
          </p>
        </div>
        <label className="import-button">
          Import Data
          <input type="file" accept="application/json,.json" onChange={handleImportData} />
        </label>
      </section>

      <section className="data-card">
        <div>
          <h3>Reset</h3>
          <p>
            Reset all app data and start empty. Export a backup first if you
            want to keep your current data.
          </p>
        </div>
        <div className="data-button-row">
          <button className="danger-button" onClick={handleClearData}>
            Reset App Data
          </button>
        </div>
      </section>
    </>
  );
}
