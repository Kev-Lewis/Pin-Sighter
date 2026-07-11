// Interactive 10-pin deck for shot entry — tap pins to toggle knocked/standing,
// with optional prev/next-ball navigation and Select-All / Clear actions.
// Styling is global (`.pin-deck`, `.pin-button`, …).

import { ALL_PINS } from "../lib/scoring";

type PinDeckProps = {
  knockedPins: number[];
  onChange: (knockedPins: number[]) => void;
  availablePins?: number[];
  onPrevShot?: () => void;
  onNextShot?: () => void;
  hasPrevShot?: boolean;
  hasNextShot?: boolean;
  hideActions?: boolean;
};

export function PinDeck({
  knockedPins,
  onChange,
  availablePins,
  onPrevShot,
  onNextShot,
  hasPrevShot,
  hasNextShot,
  hideActions,
}: PinDeckProps) {
  const pins = [
    { number: 7, left: 15, top: 15 },
    { number: 8, left: 38, top: 15 },
    { number: 9, left: 62, top: 15 },
    { number: 10, left: 85, top: 15 },

    { number: 4, left: 27, top: 38 },
    { number: 5, left: 50, top: 38 },
    { number: 6, left: 73, top: 38 },

    { number: 2, left: 38, top: 61 },
    { number: 3, left: 62, top: 61 },

    { number: 1, left: 50, top: 84 },
  ];

  const availablePinNumbers = availablePins ?? ALL_PINS;

  function togglePin(pinNumber: number) {
    if (!availablePinNumbers.includes(pinNumber)) {
      return;
    }

    if (knockedPins.includes(pinNumber)) {
      onChange(knockedPins.filter((pin) => pin !== pinNumber));
      return;
    }

    onChange([...knockedPins, pinNumber].sort((a, b) => a - b));
  }

  function selectAllPins() {
    onChange([...availablePinNumbers].sort((a, b) => a - b));
  }

  function clearPins() {
    onChange([]);
  }

  return (
    <div>
      <div className="pin-deck">
        {onPrevShot && (
          <button
            type="button"
            className="pin-deck-nav is-prev"
            onClick={onPrevShot}
            disabled={!hasPrevShot}
            aria-label="Previous ball"
            title="Previous ball"
          >
            ‹
          </button>
        )}
        {onNextShot && (
          <button
            type="button"
            className="pin-deck-nav is-next"
            onClick={onNextShot}
            disabled={!hasNextShot}
            aria-label="Next ball"
            title="Next ball"
          >
            ›
          </button>
        )}
        {pins.map((pin) => {
          const isAvailable = availablePinNumbers.includes(pin.number);
          const isKnocked = knockedPins.includes(pin.number);

          return (
            <button
              key={pin.number}
              type="button"
              className={`pin-button ${isKnocked ? "knocked" : ""} ${
                !isAvailable ? "unavailable" : ""
              }`}
              disabled={!isAvailable}
              style={{
                left: `${pin.left}%`,
                top: `${pin.top}%`,
              }}
              onClick={() => togglePin(pin.number)}
              title={
                isKnocked
                  ? `Pin ${pin.number} knocked down`
                  : `Pin ${pin.number} standing`
              }
            >
              {pin.number}
            </button>
          );
        })}
      </div>

      {!hideActions && (
        <div className="pin-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={selectAllPins}
          >
            Select All
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={clearPins}
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
