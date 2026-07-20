// DetailedStatModal — the drill-in dialog shown when a stat card is clicked,
// presenting the stat's value, description, formula, and calculation detail
// rows. Extracted from StatsPage (StatsPage shell lift, stage 1). Owns its own
// scroll-lock + focus-trap; the parent renders it only when a stat is selected.

import { useEffect, useRef } from "react";
import type { DetailedStatDetail } from "../types";
import { lockDocumentScroll, trapFocusWithinElement } from "../../lib/domFocus";

export function DetailedStatModal({
  stat,
  onClose,
}: {
  stat: DetailedStatDetail;
  onClose: () => void;
}) {
  const detailedStatModalRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const unlockDocumentScroll = lockDocumentScroll();
    const previouslyFocusedElement = document.activeElement as HTMLElement | null;

    window.setTimeout(() => detailedStatModalRef.current?.focus(), 0);

    function handleDetailedStatModalKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      trapFocusWithinElement(event, detailedStatModalRef.current);
    }

    document.addEventListener("keydown", handleDetailedStatModalKeyDown);

    return () => {
      document.removeEventListener("keydown", handleDetailedStatModalKeyDown);
      unlockDocumentScroll();
      previouslyFocusedElement?.focus();
    };
    // Mount-once: this modal only mounts while a stat is selected, so open =
    // mount and close = unmount. Keying on `onClose` (a fresh arrow each render)
    // would churn the scroll-lock/focus-trap on every parent re-render, unlike
    // the original inline effect which keyed on the stable selected-stat value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="stat-detail-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className="stat-detail-modal"
        ref={detailedStatModalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="stat-detail-title"
        tabIndex={-1}
      >
        <div className="stat-detail-header">
          <div>
            <p className="eyebrow">Stat Detail</p>
            <h3 id="stat-detail-title">{stat.title}</h3>
          </div>

          <button className="secondary-button" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="stat-detail-value">
          <strong>{stat.value}</strong>
          <span>{stat.label}</span>
        </div>

        <p>{stat.description}</p>

        <section className="stat-detail-formula">
          <h4>Formula</h4>
          <p>{stat.formula}</p>
        </section>

        <div className="table-scroll">
          <table className="stats-table stat-detail-table">
            <caption className="sr-only">
              Calculation details for {stat.label}.
            </caption>
            <tbody>
              {stat.detailRows.map((row) => (
                <tr key={row.label}>
                  <th scope="row">{row.label}</th>
                  <td>{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {stat.note && <p className="helper-text">{stat.note}</p>}
      </section>
    </div>
  );
}
