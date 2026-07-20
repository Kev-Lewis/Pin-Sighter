// SavedFrameEditModal — the full frame-by-frame editor overlay for correcting a
// saved game's shot data (pins, ball, targeting boards) with a live score
// preview. Extracted from App.tsx (stats decomposition). Rendered by StatsPage.

import { useEffect, useRef, useState } from "react";
import type { SavedGameRecord, Bowler, FrameEntry } from "../../types";
import {
  ALL_PINS,
  getPinsStanding,
  getFrameResult,
  calculateScoresForGame,
} from "../../lib/scoring";
import { BoardSelect } from "../../components/BoardSelect";
import { PinDeck } from "../../components/PinDeck";
import { footBoardOptions, laneBoardOptions } from "../../lib/boards";
import { lockDocumentScroll, trapFocusWithinElement } from "../../lib/domFocus";
import { frameEntriesHaveChanges } from "../../lib/frameEditing";
import { getUniqueMetadataOptions } from "../setMetadata";

export function SavedFrameEditModal({
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
