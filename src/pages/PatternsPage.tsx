// Oil Patterns page — CRUD for patterns, including duel patterns. Lifted out of
// App.tsx into src/pages/. Duel-pattern helpers come from lib/patterns; the
// "Unknown" sentinel checks from lib/backup.

import { useState, useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Pattern } from "../types";
import { unknownPatternId, isUnknownPattern } from "../lib/backup";
import {
  isDuelPattern,
  buildDuelPatternName,
  getPatternNameById,
  formatPatternDropdownLabel,
  getDuelPatternBaseOptions,
} from "../lib/patterns";
import { EmptyStateCard } from "../components/EmptyStateCard";

type PatternsPageProps = {
  patterns: Pattern[];
  setPatterns: Dispatch<SetStateAction<Pattern[]>>;
};

export function PatternsPage({ patterns, setPatterns }: PatternsPageProps) {
  const [isNewDuelPattern, setIsNewDuelPattern] = useState(false);
  const [newDuelFirstPatternId, setNewDuelFirstPatternId] = useState("");
  const [newDuelSecondPatternId, setNewDuelSecondPatternId] = useState("");
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
  const [addingPattern, setAddingPattern] = useState(false);
  const [editingPatternId, setEditingPatternId] = useState<number | null>(null);

  useEffect(() => {
    if (!addingPattern && editingPatternId === null) {
      return;
    }
    function handleEscape(keyEvent: KeyboardEvent) {
      if (keyEvent.key === "Escape") {
        setAddingPattern(false);
        setEditingPatternId(null);
      }
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [addingPattern, editingPatternId]);

  function discardPatternDraft(patternId: number) {
    setPatternDrafts((currentDrafts) => {
      const updatedDrafts = { ...currentDrafts };
      delete updatedDrafts[patternId];
      return updatedDrafts;
    });
  }

  function closePatternEditor(patternId: number) {
    discardPatternDraft(patternId);
    setEditingPatternId(null);
  }

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
      draft.notes !== pattern.notes ||
      draft.isDuelPattern !== pattern.isDuelPattern ||
      draft.firstPatternId !== pattern.firstPatternId ||
      draft.secondPatternId !== pattern.secondPatternId ||
      draft.firstPatternName !== pattern.firstPatternName ||
      draft.secondPatternName !== pattern.secondPatternName
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
    if (patternId === unknownPatternId) {
      return;
    }

    const draft = patternDrafts[patternId];

    if (!draft) {
      return;
    }

    const patternToSave = isDuelPattern(draft)
      ? prepareDuelPatternForSave(draft, patternId)
      : { ...draft, isDuelPattern: false };

    if (!patternToSave) {
      return;
    }

    setPatterns((currentPatterns) =>
      currentPatterns.map((pattern) =>
        pattern.id === patternId ? patternToSave : pattern
      )
    );

    setPatternDrafts((currentDrafts) => {
      const updatedDrafts = { ...currentDrafts };
      delete updatedDrafts[patternId];
      return updatedDrafts;
    });
  }

  function prepareDuelPatternForSave(
    pattern: Pattern,
    currentPatternId?: number
  ) {
    const firstPattern = patterns.find(
      (currentPattern) => currentPattern.id === pattern.firstPatternId
    );
    const secondPattern = patterns.find(
      (currentPattern) => currentPattern.id === pattern.secondPatternId
    );

    if (!firstPattern || !secondPattern) {
      window.alert("Choose both duel pattern lanes before saving.");
      return null;
    }

    if (firstPattern.id === secondPattern.id) {
      window.alert("Choose two different patterns for duel pattern play.");
      return null;
    }

    const duelPatternName = buildDuelPatternName(
      firstPattern.name,
      secondPattern.name
    );
    const nameAlreadyExists = patterns.some(
      (currentPattern) =>
        currentPattern.id !== currentPatternId &&
        currentPattern.name.toLowerCase() === duelPatternName.toLowerCase()
    );

    if (nameAlreadyExists) {
      window.alert("A duel pattern with that pair already exists.");
      return null;
    }

    return {
      ...pattern,
      name: duelPatternName,
      length: "",
      volume: "",
      ratio: "",
      dropBrush: "",
      source: "Duel Pattern",
      notes: "",
      isDuelPattern: true,
      firstPatternId: firstPattern.id,
      secondPatternId: secondPattern.id,
      firstPatternName: firstPattern.name,
      secondPatternName: secondPattern.name,
    };
  }

  function addPattern() {
    if (isNewDuelPattern) {
      const draftDuelPattern: Pattern = {
        id: Date.now(),
        name: "",
        length: "",
        volume: "",
        ratio: "",
        dropBrush: "",
        source: "Duel Pattern",
        notes: "",
        isDuelPattern: true,
        firstPatternId: Number(newDuelFirstPatternId),
        secondPatternId: Number(newDuelSecondPatternId),
      };
      const duelPatternToSave = prepareDuelPatternForSave(draftDuelPattern);

      if (!duelPatternToSave) {
        return;
      }

      setPatterns((currentPatterns) => [...currentPatterns, duelPatternToSave]);
      setNewDuelFirstPatternId("");
      setNewDuelSecondPatternId("");
      setIsNewDuelPattern(false);
      setAddingPattern(false);
      return;
    }

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
        isDuelPattern: false,
      },
    ]);

    setNewPatternName("");
    setNewPatternLength("");
    setNewPatternVolume("");
    setNewPatternRatio("");
    setNewPatternDropBrush("");
    setNewPatternSource("");
    setNewPatternNotes("");
    setAddingPattern(false);
  }

  function deletePattern(patternId: number) {
    if (patternId === unknownPatternId) {
      return;
    }

    const pattern = patterns.find(
      (currentPattern) => currentPattern.id === patternId
    );

    if (!pattern) {
      return;
    }

    const shouldDelete = window.confirm(
      `Delete ${formatPatternDropdownLabel(pattern)}? This will remove it from pattern selection.`
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
    if (isDuelPattern(pattern)) {
      const firstPatternName = getPatternNameById(
        patterns,
        pattern.firstPatternId,
        pattern.firstPatternName
      );
      const secondPatternName = getPatternNameById(
        patterns,
        pattern.secondPatternId,
        pattern.secondPatternName
      );

      return `Duel Pattern • Left: ${firstPatternName} • Right: ${secondPatternName}`;
    }

    const details = [
      pattern.length ? `${pattern.length} ft` : "",
      pattern.volume ? `${pattern.volume} mL` : "",
      pattern.ratio ? `${pattern.ratio}:1` : "",
    ].filter(Boolean);

    return details.length > 0 ? details.join(" • ") : "No specs entered";
  }

  const duelPatternBaseOptions = getDuelPatternBaseOptions(patterns);
  const selectedNewDuelFirstPattern = patterns.find(
    (pattern) => String(pattern.id) === newDuelFirstPatternId
  );
  const selectedNewDuelSecondPattern = patterns.find(
    (pattern) => String(pattern.id) === newDuelSecondPatternId
  );
  const newDuelPatternName =
    selectedNewDuelFirstPattern && selectedNewDuelSecondPattern
      ? buildDuelPatternName(
          selectedNewDuelFirstPattern.name,
          selectedNewDuelSecondPattern.name
        )
      : "";
  const newDuelPatternNameAlreadyExists =
    newDuelPatternName !== "" &&
    patterns.some(
      (pattern) =>
        pattern.name.toLowerCase() === newDuelPatternName.toLowerCase()
    );
  const trimmedNewPatternName = newPatternName.trim();
  const newPatternNameAlreadyExists =
    trimmedNewPatternName !== "" &&
    patterns.some(
      (pattern) =>
        pattern.name.toLowerCase() === trimmedNewPatternName.toLowerCase()
    );
  const patternAddValidationMessages = isNewDuelPattern
    ? [
        duelPatternBaseOptions.length < 2
          ? "Create at least two normal patterns before adding a duel pattern."
          : "",
        newDuelFirstPatternId === "" ? "Choose the left lane pattern." : "",
        newDuelSecondPatternId === "" ? "Choose the right lane pattern." : "",
        newDuelFirstPatternId !== "" &&
        newDuelFirstPatternId === newDuelSecondPatternId
          ? "Choose two different patterns."
          : "",
        newDuelPatternNameAlreadyExists
          ? "A duel pattern with that pair already exists."
          : "",
      ].filter(Boolean)
    : [
        !trimmedNewPatternName ? "Enter a pattern name." : "",
        newPatternNameAlreadyExists
          ? "A pattern with that name already exists."
          : "",
      ].filter(Boolean);
  const canAddPattern = patternAddValidationMessages.length === 0;

  return (
    <>
      <div className="page-head">
        <div className="page-head-text">
          <h2>Patterns</h2>
          <p>
            Add oil patterns with length, volume, ratio, drop brush, source, and
            notes. A locked Unknown pattern is always available for games where
            the condition is not known. Duel patterns combine two saved patterns
            for left-lane/right-lane play on a pair.
          </p>
        </div>
      </div>

      <div className="patterns-toolbar">
        <a
          className="resource-link-pill"
          href="https://patternlibrary.kegel.net/"
          target="_blank"
          rel="noreferrer"
        >
          <span className="resource-link-label">Kegel Pattern Library</span>
          <span className="resource-link-arrow" aria-hidden="true">↗</span>
        </a>

        <button
          type="button"
          className="secondary-button add-entity-trigger"
          onClick={() => setAddingPattern(true)}
        >
          + Add Pattern
        </button>
      </div>

      {addingPattern && (
        <div className="ps-modal" role="dialog" aria-modal="true">
          <div
            className="ps-modal-backdrop"
            onClick={() => setAddingPattern(false)}
          />
          <div className="ps-modal-panel">
            <button
              type="button"
              className="ps-modal-close"
              onClick={() => setAddingPattern(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h3 className="ps-modal-title">
              {isNewDuelPattern ? "Add Duel Pattern" : "Add Pattern"}
            </h3>

            <div className="add-form-content">
          {!isNewDuelPattern && (
            <div className="form-grid">
              <label>
                Name <span className="required">*</span>
                <input
                  value={newPatternName}
                  aria-invalid={
                    !trimmedNewPatternName || newPatternNameAlreadyExists
                  }
                  aria-describedby={
                    !canAddPattern ? "add-pattern-validation" : undefined
                  }
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
                  onChange={(event) =>
                    setNewPatternDropBrush(event.target.value)
                  }
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
          )}

          <section
            className={`duel-pattern-toggle-card ${
              isNewDuelPattern ? "active" : ""
            }`}
          >
            <label className="duel-toggle-row">
              <input
                type="checkbox"
                checked={isNewDuelPattern}
                onChange={(event) => {
                  setIsNewDuelPattern(event.target.checked);
                  setNewDuelFirstPatternId("");
                  setNewDuelSecondPatternId("");
                }}
              />
              <span>
                <strong>Duel Pattern</strong>
                <small>
                  Use this when the left and right lanes have different oil
                  patterns.
                </small>
              </span>
            </label>

            {isNewDuelPattern && (
              <div className="duel-pattern-fields">
                <div className="form-grid">
                  <label>
                    <span className="field-caption">
                      First Pattern — Left Lane{" "}
                      <span className="required">*</span>
                    </span>
                    <select
                      value={newDuelFirstPatternId}
                      aria-invalid={newDuelFirstPatternId === ""}
                      aria-describedby={
                        !canAddPattern ? "add-pattern-validation" : undefined
                      }
                      onChange={(event) =>
                        setNewDuelFirstPatternId(event.target.value)
                      }
                    >
                      <option value="">Select left lane pattern</option>
                      {duelPatternBaseOptions.map((pattern) => (
                        <option key={pattern.id} value={pattern.id}>
                          {formatPatternDropdownLabel(pattern)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span className="field-caption">
                      Second Pattern — Right Lane{" "}
                      <span className="required">*</span>
                    </span>
                    <select
                      value={newDuelSecondPatternId}
                      aria-invalid={newDuelSecondPatternId === ""}
                      aria-describedby={
                        !canAddPattern ? "add-pattern-validation" : undefined
                      }
                      onChange={(event) =>
                        setNewDuelSecondPatternId(event.target.value)
                      }
                    >
                      <option value="">Select right lane pattern</option>
                      {duelPatternBaseOptions.map((pattern) => (
                        <option key={pattern.id} value={pattern.id}>
                          {formatPatternDropdownLabel(pattern)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <section className="pattern-preview-card duel-pattern-preview">
                  <h4>Duel Pattern Summary</h4>
                  <p>
                    <strong>Saved Name:</strong>{" "}
                    {newDuelPatternName || "Choose two patterns"}
                  </p>
                  <p>
                    <strong>Left Lane:</strong>{" "}
                    {selectedNewDuelFirstPattern?.name || "Not selected"}
                  </p>
                  <p>
                    <strong>Right Lane:</strong>{" "}
                    {selectedNewDuelSecondPattern?.name || "Not selected"}
                  </p>
                  <p className="helper-text">
                    Duel patterns can only be selected when logging on a pair.
                  </p>
                </section>
              </div>
            )}
          </section>

          {!canAddPattern && (
            <section
              className="field-validation-card compact-validation-card"
              id="add-pattern-validation"
              aria-live="polite"
            >
              <h3>Before Adding</h3>
              <ul>
                {patternAddValidationMessages.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </section>
          )}

          <button
            className="primary-button"
            disabled={!canAddPattern}
            onClick={addPattern}
          >
            {isNewDuelPattern ? "Add Duel Pattern" : "Add Pattern"}
          </button>
            </div>
          </div>
        </div>
      )}

      <section className="pattern-list">
        {patterns.length === 0 && (
          <EmptyStateCard
            title="No Patterns Added Yet"
            description="You haven't added any patterns. Use + Add Pattern above to create one, or keep a fallback house shot pattern for general logging."
          />
        )}

        {patterns.map((pattern) => {
          const draftPattern = getPatternDraft(pattern);
          const isDirty = hasPatternChanged(pattern);
          const isLockedUnknownPattern = isUnknownPattern(pattern);

          if (isLockedUnknownPattern) {
            return (
              <details className="pattern-card locked-pattern-card" key={pattern.id}>
                <summary className="pattern-summary">
                  <div>
                    <strong>{pattern.name}</strong>
                    <p>{formatPatternSummary(pattern)}</p>
                    <p className="locked-pattern-text">
                      Default pattern for unknown conditions. This pattern cannot
                      be edited or deleted.
                    </p>
                  </div>

                  <span className="summary-hint">Open / Close Details</span>
                </summary>

                <div className="pattern-details-content">
                  <section className="locked-pattern-info">
                    <h3>Built-In Default</h3>
                    <p>
                      Use Unknown when you do not know the oil pattern, house
                      shot, volume, or lane condition. It will always appear as
                      the default option when logging games.
                    </p>
                  </section>
                </div>
              </details>
            );
          }

          if (isDuelPattern(pattern)) {
            const duelPatternOptions = getDuelPatternBaseOptions(
              patterns,
              pattern.id
            );
            const firstPatternName = getPatternNameById(
              patterns,
              draftPattern.firstPatternId,
              draftPattern.firstPatternName
            );
            const secondPatternName = getPatternNameById(
              patterns,
              draftPattern.secondPatternId,
              draftPattern.secondPatternName
            );

            return (
              <details className="pattern-card duel-pattern-card" key={pattern.id}>
                <summary className="pattern-summary">
                  <div>
                    <strong>{pattern.name}</strong>
                    <p>{formatPatternSummary(pattern)}</p>
                    {isDirty && (
                      <p className="unsaved-text">Unsaved changes</p>
                    )}
                  </div>

                  <span className="summary-hint">Open / Close Details</span>
                </summary>

                <div className="pattern-details-content">
                  <section className="pattern-preview-card duel-pattern-preview">
                    <h4>Duel Pattern Summary</h4>
                    <p>
                      <strong>Saved Name:</strong> {pattern.name}
                    </p>
                    <p>
                      <strong>Left Lane:</strong> {firstPatternName}
                    </p>
                    <p>
                      <strong>Right Lane:</strong> {secondPatternName}
                    </p>
                    <p className="helper-text">
                      Duel patterns can only be selected when logging on a pair.
                    </p>
                  </section>

                  <div className="pattern-actions-row single">
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => setEditingPatternId(pattern.id)}
                    >
                      Edit Duel Pattern
                    </button>
                  </div>
                </div>

                {editingPatternId === pattern.id && (
                  <div className="ps-modal" role="dialog" aria-modal="true">
                    <div
                      className="ps-modal-backdrop"
                      onClick={() => closePatternEditor(pattern.id)}
                    />
                    <div className="ps-modal-panel">
                      <button
                        type="button"
                        className="ps-modal-close"
                        onClick={() => closePatternEditor(pattern.id)}
                        aria-label="Close"
                      >
                        ×
                      </button>
                      <h3 className="ps-modal-title">Edit Duel Pattern</h3>

                      <div className="form-grid">
                        <label>
                          First Pattern — Left Lane
                          <select
                            value={draftPattern.firstPatternId ?? ""}
                            onChange={(event) =>
                              updatePatternDraft(pattern, {
                                firstPatternId: Number(event.target.value),
                              })
                            }
                          >
                            <option value="">Select left lane pattern</option>
                            {duelPatternOptions.map((optionPattern) => (
                              <option
                                key={optionPattern.id}
                                value={optionPattern.id}
                              >
                                {formatPatternDropdownLabel(optionPattern)}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label>
                          Second Pattern — Right Lane
                          <select
                            value={draftPattern.secondPatternId ?? ""}
                            onChange={(event) =>
                              updatePatternDraft(pattern, {
                                secondPatternId: Number(event.target.value),
                              })
                            }
                          >
                            <option value="">Select right lane pattern</option>
                            {duelPatternOptions.map((optionPattern) => (
                              <option
                                key={optionPattern.id}
                                value={optionPattern.id}
                              >
                                {formatPatternDropdownLabel(optionPattern)}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>

                      <section className="pattern-preview-card duel-pattern-preview">
                        <h4>Duel Pattern Summary</h4>
                        <p>
                          <strong>Saved Name:</strong>{" "}
                          {draftPattern.firstPatternId &&
                          draftPattern.secondPatternId
                            ? buildDuelPatternName(
                                firstPatternName,
                                secondPatternName
                              )
                            : pattern.name}
                        </p>
                        <p>
                          <strong>Left Lane:</strong> {firstPatternName}
                        </p>
                        <p>
                          <strong>Right Lane:</strong> {secondPatternName}
                        </p>
                        <p className="helper-text">
                          Duel patterns can only be selected when logging on a
                          pair.
                        </p>
                      </section>

                      <div className="pattern-actions-row">
                        <button
                          className="save-button"
                          disabled={!isDirty}
                          onClick={() => {
                            savePattern(pattern.id);
                            setEditingPatternId(null);
                          }}
                        >
                          Save Duel Pattern
                        </button>

                        <button
                          className="danger-button"
                          onClick={() => {
                            deletePattern(pattern.id);
                            setEditingPatternId(null);
                          }}
                        >
                          Delete Pattern
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </details>
            );
          }

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

                <span className="summary-hint">Open / Close Details</span>
              </summary>

              <div className="pattern-details-content">
                <section className="pattern-preview-card">
                  <h4>Pattern Summary</h4>
                  <p>
                    <strong>Length:</strong>{" "}
                    {pattern.length ? `${pattern.length} ft` : "Not entered"}
                  </p>
                  <p>
                    <strong>Volume:</strong>{" "}
                    {pattern.volume ? `${pattern.volume} mL` : "Not entered"}
                  </p>
                  <p>
                    <strong>Ratio:</strong>{" "}
                    {pattern.ratio ? `${pattern.ratio}:1` : "Not entered"}
                  </p>
                  <p>
                    <strong>Drop Brush:</strong>{" "}
                    {pattern.dropBrush || "Not entered"}
                  </p>
                  <p>
                    <strong>Source:</strong> {pattern.source || "Not entered"}
                  </p>
                  {pattern.notes && (
                    <p>
                      <strong>Notes:</strong> {pattern.notes}
                    </p>
                  )}
                </section>

                <div className="pattern-actions-row single">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setEditingPatternId(pattern.id)}
                  >
                    Edit Pattern
                  </button>
                </div>
              </div>

              {editingPatternId === pattern.id && (
                <div className="ps-modal" role="dialog" aria-modal="true">
                  <div
                    className="ps-modal-backdrop"
                    onClick={() => closePatternEditor(pattern.id)}
                  />
                  <div className="ps-modal-panel">
                    <button
                      type="button"
                      className="ps-modal-close"
                      onClick={() => closePatternEditor(pattern.id)}
                      aria-label="Close"
                    >
                      ×
                    </button>
                    <h3 className="ps-modal-title">Edit Pattern</h3>

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

                    <div className="pattern-actions-row">
                      <button
                        className="save-button"
                        disabled={!isDirty}
                        onClick={() => {
                          savePattern(pattern.id);
                          setEditingPatternId(null);
                        }}
                      >
                        Save Pattern
                      </button>

                      <button
                        className="danger-button"
                        onClick={() => {
                          deletePattern(pattern.id);
                          setEditingPatternId(null);
                        }}
                      >
                        Delete Pattern
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </details>
          );
        })}
      </section>
    </>
  );
}
