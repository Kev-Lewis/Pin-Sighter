// Bowling Centers page — CRUD for centers (name, lane count, notes). Lifted out
// of App.tsx into src/pages/. Self-contained: React hooks + the Center type +
// the shared EmptyStateCard; state comes in via props.

import { useState, useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Center } from "../types";
import { EmptyStateCard } from "../components/EmptyStateCard";

type CentersPageProps = {
  centers: Center[];
  setCenters: Dispatch<SetStateAction<Center[]>>;
};

export function CentersPage({ centers, setCenters }: CentersPageProps) {
  const [newCenterName, setNewCenterName] = useState("");
  const [newCenterLaneCount, setNewCenterLaneCount] = useState("8");
  const [newCenterNotes, setNewCenterNotes] = useState("");
  const [centerDrafts, setCenterDrafts] = useState<Record<number, Center>>({});
  const [addingCenter, setAddingCenter] = useState(false);
  const [editingCenterId, setEditingCenterId] = useState<number | null>(null);

  useEffect(() => {
    if (!addingCenter && editingCenterId === null) {
      return;
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setAddingCenter(false);
        setEditingCenterId(null);
      }
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [addingCenter, editingCenterId]);

  function discardCenterDraft(centerId: number) {
    setCenterDrafts((currentDrafts) => {
      const updatedDrafts = { ...currentDrafts };
      delete updatedDrafts[centerId];
      return updatedDrafts;
    });
  }

  function closeCenterEditor(centerId: number) {
    discardCenterDraft(centerId);
    setEditingCenterId(null);
  }

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

  const trimmedNewCenterName = newCenterName.trim();
  const newCenterLaneCountValue = Number(newCenterLaneCount);
  const newCenterNameAlreadyExists =
    trimmedNewCenterName !== "" &&
    centers.some(
      (center) =>
        center.name.toLowerCase() === trimmedNewCenterName.toLowerCase()
    );
  const centerAddValidationMessages = [
    !trimmedNewCenterName ? "Enter a bowling center name." : "",
    !Number.isFinite(newCenterLaneCountValue) || newCenterLaneCountValue < 1
      ? "Enter at least 1 lane."
      : "",
    newCenterNameAlreadyExists
      ? "A bowling center with that name already exists."
      : "",
  ].filter(Boolean);
  const canAddCenter = centerAddValidationMessages.length === 0;

  return (
    <>
      <div className="page-head">
        <div className="page-head-text">
          <h2>Bowling Centers</h2>
          <p>Add bowling centers and assign lane counts.</p>
        </div>
        <button
          type="button"
          className="secondary-button add-entity-trigger"
          onClick={() => setAddingCenter(true)}
        >
          + Add Bowling Center
        </button>
      </div>

      {addingCenter && (
        <div className="ps-modal" role="dialog" aria-modal="true">
          <div
            className="ps-modal-backdrop"
            onClick={() => setAddingCenter(false)}
          />
          <div className="ps-modal-panel">
            <button
              type="button"
              className="ps-modal-close"
              onClick={() => setAddingCenter(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h3 className="ps-modal-title">Add Bowling Center</h3>

            <div className="add-form-content">
          <div className="form-grid">
          <label>
            Name <span className="required">*</span>
            <input
              value={newCenterName}
              aria-invalid={
                !trimmedNewCenterName || newCenterNameAlreadyExists
              }
              aria-describedby={
                !canAddCenter ? "add-center-validation" : undefined
              }
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
              aria-invalid={
                !Number.isFinite(newCenterLaneCountValue) ||
                newCenterLaneCountValue < 1
              }
              aria-describedby={
                !canAddCenter ? "add-center-validation" : undefined
              }
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

          {!canAddCenter && (
            <section
              className="field-validation-card compact-validation-card"
              id="add-center-validation"
              aria-live="polite"
            >
              <h3>Before Adding</h3>
              <ul>
                {centerAddValidationMessages.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </section>
          )}

          <button
            className="save-button"
            disabled={!canAddCenter}
            onClick={() => {
              addCenter();
              setAddingCenter(false);
            }}
          >
            Add Center
          </button>
            </div>
          </div>
        </div>
      )}

      <section className="center-list">
        {centers.length === 0 && (
          <EmptyStateCard
            title="No Bowling Centers Added Yet"
            description="You haven't added any bowling centers. Use + Add Bowling Center above to create one so sets can be saved with lane information."
          />
        )}

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
                </div>

                <span className="summary-hint">Open / Close Details</span>
              </summary>

              <div className="center-details-content">
                {center.notes && <p className="center-notes">{center.notes}</p>}

                <section className="lane-preview-card">
                  <h4>Generated Lane Options</h4>
                  <p>
                    <strong>Single Lane Mode:</strong> Lanes 1 through{" "}
                    {center.laneCount}
                  </p>
                  <p>
                    <strong>Pair Mode:</strong>{" "}
                    {Math.floor(center.laneCount / 2) > 0
                      ? `Pairs 1/2 through ${
                          Math.floor(center.laneCount / 2) * 2 - 1
                        }/${Math.floor(center.laneCount / 2) * 2}`
                      : "No pairs available"}
                  </p>
                </section>

                <div className="center-actions-row single">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setEditingCenterId(center.id)}
                  >
                    Edit Center
                  </button>
                </div>
              </div>

              {editingCenterId === center.id && (
                <div className="ps-modal" role="dialog" aria-modal="true">
                  <div
                    className="ps-modal-backdrop"
                    onClick={() => closeCenterEditor(center.id)}
                  />
                  <div className="ps-modal-panel">
                    <button
                      type="button"
                      className="ps-modal-close"
                      onClick={() => closeCenterEditor(center.id)}
                      aria-label="Close"
                    >
                      ×
                    </button>
                    <h3 className="ps-modal-title">Edit Bowling Center</h3>

                    <div className="form-grid">
                      <label>
                        Name
                        <input
                          value={draftCenter.name}
                          onChange={(event) =>
                            updateCenterDraft(center, {
                              name: event.target.value,
                            })
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
                            updateCenterDraft(center, {
                              notes: event.target.value,
                            })
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

                    <div className="center-actions-row">
                      <button
                        className="save-button"
                        disabled={!isDirty}
                        onClick={() => {
                          saveCenter(center.id);
                          setEditingCenterId(null);
                        }}
                      >
                        Save Center
                      </button>

                      <button
                        className="danger-button"
                        onClick={() => {
                          deleteCenter(center.id);
                          setEditingCenterId(null);
                        }}
                      >
                        Delete Center
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
