// Bowlers page — CRUD for bowlers plus each bowler's ball arsenal (add / edit /
// delete balls inline). Lifted out of App.tsx into src/pages/. Self-contained:
// react + domain types + the shared EmptyStateCard; the ball-form draft type and
// defaults live here since only this page uses them.

import { useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Bowler, BowlingBall, Handedness } from "../types";
import { EmptyStateCard } from "../components/EmptyStateCard";

type NewBallFormState = {
  name: string;
  brand: string;
  surface: string;
  layout: string;
  notes: string;
};

const handednessOptions: Handedness[] = ["Right", "Left"];

const emptyBallForm: NewBallFormState = {
  name: "",
  brand: "",
  surface: "",
  layout: "",
  notes: "",
};

type BowlersPageProps = {
  bowlers: Bowler[];
  setBowlers: Dispatch<SetStateAction<Bowler[]>>;
};

export function BowlersPage({ bowlers, setBowlers }: BowlersPageProps) {
  const [newBowlerName, setNewBowlerName] = useState("");
  const [newBowlerHandedness, setNewBowlerHandedness] =
    useState<Handedness>("Right");
  const [newBowlerNotes, setNewBowlerNotes] = useState("");
  const [newBallForms, setNewBallForms] = useState<
    Record<number, NewBallFormState>
  >({});
  const [bowlerDrafts, setBowlerDrafts] = useState<Record<number, Bowler>>({});
  const [editingBall, setEditingBall] = useState<{
    bowlerId: number;
    ballId: number;
  } | null>(null);
  const [addingBallBowlerId, setAddingBallBowlerId] = useState<number | null>(
    null
  );
  const [addingBowler, setAddingBowler] = useState(false);
  const [editingBowlerId, setEditingBowlerId] = useState<number | null>(null);

  // Close any open popout on Escape.
  useEffect(() => {
    if (
      !editingBall &&
      addingBallBowlerId === null &&
      !addingBowler &&
      editingBowlerId === null
    ) {
      return;
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setEditingBall(null);
        setAddingBallBowlerId(null);
        setAddingBowler(false);
        setEditingBowlerId(null);
      }
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [editingBall, addingBallBowlerId, addingBowler, editingBowlerId]);

  function closeBowlerEditor(bowlerId: number) {
    setBowlerDrafts((currentDrafts) => {
      const updatedDrafts = { ...currentDrafts };
      delete updatedDrafts[bowlerId];
      return updatedDrafts;
    });
    setEditingBowlerId(null);
  }

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

    const editedBallNames = draft.arsenal.map((ball) => ball.name.trim());

    if (editedBallNames.some((name) => !name)) {
      window.alert("Every ball in the arsenal needs a ball name.");
      return;
    }

    const duplicateBallName = editedBallNames.find(
      (name, index) =>
        editedBallNames.findIndex(
          (otherName) => otherName.toLowerCase() === name.toLowerCase()
        ) !== index
    );

    if (duplicateBallName) {
      window.alert(`Duplicate ball name found: ${duplicateBallName}`);
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
    const ballAlreadyExists = draftBowler.arsenal.some(
      (ball) => ball.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (ballAlreadyExists) {
      window.alert("This bowler already has a ball with that name.");
      return;
    }

    const updatedArsenal = [
      ...draftBowler.arsenal,
      {
        id: Date.now(),
        name: trimmedName,
        brand: form.brand.trim(),
        surface: form.surface.trim(),
        layout: form.layout.trim(),
        notes: form.notes.trim(),
      },
    ];

    // Persist immediately so a newly added ball isn't stranded in an unsaved draft.
    setBowlers((currentBowlers) =>
      currentBowlers.map((currentBowler) =>
        currentBowler.id === bowler.id
          ? { ...currentBowler, arsenal: updatedArsenal }
          : currentBowler
      )
    );
    setBowlerDrafts((currentDrafts) => {
      const updatedDrafts = { ...currentDrafts };
      delete updatedDrafts[bowler.id];
      return updatedDrafts;
    });

    setNewBallForms((currentForms) => ({
      ...currentForms,
      [bowler.id]: emptyBallForm,
    }));
  }

  function updateBallInBowler(
    bowler: Bowler,
    ballId: number,
    updates: Partial<BowlingBall>
  ) {
    const draftBowler = getBowlerDraft(bowler);

    updateBowlerDraft(bowler, {
      arsenal: draftBowler.arsenal.map((ball) =>
        ball.id === ballId ? { ...ball, ...updates } : ball
      ),
    });
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

    const updatedArsenal = draftBowler.arsenal.filter(
      (currentBall) => currentBall.id !== ballId
    );

    // Persist immediately so the removal doesn't sit in an unsaved draft.
    setBowlers((currentBowlers) =>
      currentBowlers.map((currentBowler) =>
        currentBowler.id === bowler.id
          ? { ...currentBowler, arsenal: updatedArsenal }
          : currentBowler
      )
    );
    setBowlerDrafts((currentDrafts) => {
      const updatedDrafts = { ...currentDrafts };
      delete updatedDrafts[bowler.id];
      return updatedDrafts;
    });
  }

  const trimmedNewBowlerName = newBowlerName.trim();
  const newBowlerNameAlreadyExists =
    trimmedNewBowlerName !== "" &&
    bowlers.some(
      (bowler) =>
        bowler.name.toLowerCase() === trimmedNewBowlerName.toLowerCase()
    );
  const bowlerAddValidationMessages = [
    !trimmedNewBowlerName ? "Enter a bowler name." : "",
    newBowlerNameAlreadyExists ? "A bowler with that name already exists." : "",
  ].filter(Boolean);
  const canAddBowler = bowlerAddValidationMessages.length === 0;

  return (
    <>
      <div className="page-head">
        <div className="page-head-text">
          <h2>Bowlers</h2>
          <p>
            Add bowlers, set handedness, manage notes, and build each
            bowler’s arsenal for shot logging.
          </p>
        </div>
        <button
          type="button"
          className="secondary-button add-entity-trigger"
          onClick={() => setAddingBowler(true)}
        >
          + Add Bowler
        </button>
      </div>

      {addingBowler && (
        <div className="ps-modal" role="dialog" aria-modal="true">
          <div
            className="ps-modal-backdrop"
            onClick={() => setAddingBowler(false)}
          />
          <div className="ps-modal-panel">
            <button
              type="button"
              className="ps-modal-close"
              onClick={() => setAddingBowler(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h3 className="ps-modal-title">Add Bowler</h3>

            <div className="add-form-content">
          <div className="form-grid">
          <label>
            Name <span className="required">*</span>
            <input
              value={newBowlerName}
              aria-invalid={!canAddBowler}
              aria-describedby={!canAddBowler ? "add-bowler-validation" : undefined}
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

          {!canAddBowler && (
            <section
              className="field-validation-card compact-validation-card"
              id="add-bowler-validation"
              aria-live="polite"
            >
              <h3>Before Adding</h3>
              <ul>
                {bowlerAddValidationMessages.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </section>
          )}

          <button
            className="save-button"
            disabled={!canAddBowler}
            onClick={() => {
              addBowler();
              setAddingBowler(false);
            }}
          >
            Add Bowler
          </button>
            </div>
          </div>
        </div>
      )}

      <section className="bowler-list">
        {bowlers.length === 0 && (
          <EmptyStateCard
            title="No Bowlers Added Yet"
            description="You haven't added any bowlers. Use + Add Bowler above to create one before logging games or building stats."
          />
        )}

        {bowlers.map((bowler) => {
          const draftBowler = getBowlerDraft(bowler);
          const ballForm = getBallForm(bowler.id);
          const isDirty = hasBowlerChanged(bowler);
          const trimmedBallName = ballForm.name.trim();
          const ballNameAlreadyExists =
            trimmedBallName !== "" &&
            draftBowler.arsenal.some(
              (ball) =>
                ball.name.toLowerCase() === trimmedBallName.toLowerCase()
            );
          const ballAddValidationMessages = [
            !trimmedBallName ? "Enter a ball name." : "",
            ballNameAlreadyExists
              ? "This bowler already has a ball with that name."
              : "",
          ].filter(Boolean);
          const canAddBall = ballAddValidationMessages.length === 0;

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

                <span className="summary-hint">Open / Close Details</span>
              </summary>

              <div className="bowler-details-content">
                <section className="bowler-preview-card">
                  <h4>Bowler Info</h4>
                  <p>
                    <strong>Handedness:</strong> {bowler.handedness}
                  </p>
                  <p>
                    <strong>Notes:</strong>{" "}
                    {bowler.notes ? bowler.notes : "None"}
                  </p>
                </section>

                <div className="bowler-actions-row single">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setEditingBowlerId(bowler.id)}
                  >
                    Edit Bowler
                  </button>
                </div>

                {editingBowlerId === bowler.id && (
                  <div className="ps-modal" role="dialog" aria-modal="true">
                    <div
                      className="ps-modal-backdrop"
                      onClick={() => closeBowlerEditor(bowler.id)}
                    />
                    <div className="ps-modal-panel">
                      <button
                        type="button"
                        className="ps-modal-close"
                        onClick={() => closeBowlerEditor(bowler.id)}
                        aria-label="Close"
                      >
                        ×
                      </button>
                      <h3 className="ps-modal-title">Edit Bowler</h3>

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

                      <div className="bowler-actions-row">
                        <button
                          className="save-button"
                          disabled={!isDirty}
                          onClick={() => {
                            saveBowler(bowler.id);
                            setEditingBowlerId(null);
                          }}
                        >
                          Save Bowler
                        </button>

                        <button
                          className="danger-button"
                          onClick={() => {
                            deleteBowler(bowler.id);
                            setEditingBowlerId(null);
                          }}
                        >
                          Delete Bowler
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <section className="arsenal-section">
                  <div className="arsenal-head">
                    <h4>Arsenal</h4>
                    <button
                      type="button"
                      className="secondary-button add-ball-trigger"
                      onClick={() => setAddingBallBowlerId(bowler.id)}
                    >
                      + Add Ball
                    </button>
                  </div>

                  {draftBowler.arsenal.length === 0 ? (
                    <p className="helper-text">No balls added yet.</p>
                  ) : (
                    <div className="arsenal-list">
                      {draftBowler.arsenal.map((ball) => {
                        const trimmedEditedBallName = ball.name.trim();
                        const editedBallNameAlreadyExists =
                          trimmedEditedBallName !== "" &&
                          draftBowler.arsenal.some(
                            (currentBall) =>
                              currentBall.id !== ball.id &&
                              currentBall.name.toLowerCase() ===
                                trimmedEditedBallName.toLowerCase()
                          );
                        const ballEditValidationMessages = [
                          !trimmedEditedBallName ? "Enter a ball name." : "",
                          editedBallNameAlreadyExists
                            ? "This bowler already has another ball with that name."
                            : "",
                        ].filter(Boolean);
                        const canSaveBallEdit =
                          ballEditValidationMessages.length === 0;
                        const originalBall = bowler.arsenal.find(
                          (currentBall) => currentBall.id === ball.id
                        );
                        const hasBallEditChanges =
                          JSON.stringify(originalBall) !== JSON.stringify(ball);

                        return (
                          <div className="ball-card" key={ball.id}>
                            <div className="ball-card-header">
                              <div>
                                <strong>{ball.name || "Unnamed Ball"}</strong>
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
                                type="button"
                                className="ball-edit-trigger"
                                onClick={() =>
                                  setEditingBall({
                                    bowlerId: bowler.id,
                                    ballId: ball.id,
                                  })
                                }
                              >
                                Edit
                              </button>
                            </div>

                            {editingBall?.bowlerId === bowler.id &&
                              editingBall.ballId === ball.id && (
                                <div
                                  className="ps-modal"
                                  role="dialog"
                                  aria-modal="true"
                                >
                                  <div
                                    className="ps-modal-backdrop"
                                    onClick={() => setEditingBall(null)}
                                  />
                                  <div className="ps-modal-panel">
                                    <button
                                      type="button"
                                      className="ps-modal-close"
                                      onClick={() => setEditingBall(null)}
                                      aria-label="Close"
                                    >
                                      ×
                                    </button>
                                    <h3 className="ps-modal-title">Edit Ball</h3>

                                    <div className="ball-edit-content">
                                <div className="form-grid">
                                  <label>
                                    Ball Name <span className="required">*</span>
                                    <input
                                      value={ball.name}
                                      aria-invalid={!canSaveBallEdit}
                                      aria-describedby={
                                        !canSaveBallEdit
                                          ? `edit-ball-validation-${bowler.id}-${ball.id}`
                                          : undefined
                                      }
                                      onChange={(event) =>
                                        updateBallInBowler(bowler, ball.id, {
                                          name: event.target.value,
                                        })
                                      }
                                      placeholder="Example: Venom Shock"
                                    />
                                  </label>

                                  <label>
                                    Brand
                                    <input
                                      value={ball.brand}
                                      onChange={(event) =>
                                        updateBallInBowler(bowler, ball.id, {
                                          brand: event.target.value,
                                        })
                                      }
                                      placeholder="Optional"
                                    />
                                  </label>

                                  <label>
                                    Surface
                                    <input
                                      value={ball.surface}
                                      onChange={(event) =>
                                        updateBallInBowler(bowler, ball.id, {
                                          surface: event.target.value,
                                        })
                                      }
                                      placeholder="Example: 2K, box, polish"
                                    />
                                  </label>

                                  <label>
                                    Layout
                                    <input
                                      value={ball.layout}
                                      onChange={(event) =>
                                        updateBallInBowler(bowler, ball.id, {
                                          layout: event.target.value,
                                        })
                                      }
                                      placeholder="Optional, example: 5 x 4 x 2"
                                    />
                                  </label>

                                  <label>
                                    Notes
                                    <textarea
                                      value={ball.notes}
                                      onChange={(event) =>
                                        updateBallInBowler(bowler, ball.id, {
                                          notes: event.target.value,
                                        })
                                      }
                                      rows={3}
                                      placeholder="Optional notes"
                                    />
                                  </label>
                                </div>

                                {!canSaveBallEdit && (
                                  <section
                                    className="field-validation-card compact-validation-card"
                                    id={`edit-ball-validation-${bowler.id}-${ball.id}`}
                                    aria-live="polite"
                                  >
                                    <h3>Before Saving</h3>
                                    <ul>
                                      {ballEditValidationMessages.map(
                                        (message) => (
                                          <li key={message}>{message}</li>
                                        )
                                      )}
                                    </ul>
                                  </section>
                                )}

                                <div className="ball-edit-actions-row">
                                  <button
                                    className="save-button"
                                    disabled={
                                      !canSaveBallEdit || !hasBallEditChanges
                                    }
                                    onClick={() => {
                                      saveBowler(bowler.id);
                                      setEditingBall(null);
                                    }}
                                  >
                                    Save Ball Details
                                  </button>

                                  <button
                                    className="danger-button"
                                    onClick={() => {
                                      deleteBall(bowler, ball.id);
                                      setEditingBall(null);
                                    }}
                                  >
                                    Remove Ball
                                  </button>
                                </div>
                              </div>
                                  </div>
                                </div>
                              )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {addingBallBowlerId === bowler.id && (
                    <div className="ps-modal" role="dialog" aria-modal="true">
                      <div
                        className="ps-modal-backdrop"
                        onClick={() => setAddingBallBowlerId(null)}
                      />
                      <div className="ps-modal-panel">
                        <button
                          type="button"
                          className="ps-modal-close"
                          onClick={() => setAddingBallBowlerId(null)}
                          aria-label="Close"
                        >
                          ×
                        </button>
                        <h3 className="ps-modal-title">Add Ball</h3>

                        <div className="add-ball-content">
                      <div className="form-grid">
                        <label>
                          Ball Name <span className="required">*</span>
                          <input
                            value={ballForm.name}
                            aria-invalid={!canAddBall}
                            aria-describedby={
                              !canAddBall
                                ? `add-ball-validation-${bowler.id}`
                                : undefined
                            }
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

                      {!canAddBall && (
                        <section
                          className="field-validation-card compact-validation-card"
                          id={`add-ball-validation-${bowler.id}`}
                          aria-live="polite"
                        >
                          <h3>Before Adding</h3>
                          <ul>
                            {ballAddValidationMessages.map((message) => (
                              <li key={message}>{message}</li>
                            ))}
                          </ul>
                        </section>
                      )}

                      <button
                        className="save-button"
                        disabled={!canAddBall}
                        onClick={() => {
                          addBallToBowler(bowler);
                          setAddingBallBowlerId(null);
                        }}
                      >
                        Add Ball
                      </button>
                        </div>
                      </div>
                    </div>
                  )}
                </section>
              </div>
            </details>
          );
        })}
      </section>
    </>
  );
}
