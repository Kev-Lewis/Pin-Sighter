// A small, static pin-deck showing which pins were left standing for a given
// spare-leave key (e.g. "3-6-10"). Read-only. Styling is global (`.mini-pin-deck`).

import { parseLeaveKeyPins } from "../lib/scoring";

export function StaticPinLeaveDeck({ leave }: { leave: string }) {
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
  const standingPins = parseLeaveKeyPins(leave);

  return (
    <div className="mini-pin-deck" aria-label={`Leave ${leave}`}>
      {pins.map((pin) => {
        const isStanding = standingPins.includes(pin.number);

        return (
          <span
            key={pin.number}
            className={`mini-pin ${isStanding ? "standing" : ""}`}
            style={{
              left: `${pin.left}%`,
              top: `${pin.top}%`,
            }}
            title={
              isStanding
                ? `Pin ${pin.number} left`
                : `Pin ${pin.number} cleared`
            }
          >
            {pin.number}
          </span>
        );
      })}
    </div>
  );
}
