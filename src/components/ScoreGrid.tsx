// A read-only bowling score grid — 10 frames of roll marks (X, /, -, splits)
// plus cumulative scores. Pure presentation over `ScoringFrame` data; all the
// scoring logic lives in lib/scoring. Styling is global (`.score-grid`, …).

import {
  getFrameMarks,
  getCumulativeFrameScores,
  type ScoreMark,
  type ScoringFrame,
} from "../lib/scoring";

function ScoreRollMark({ mark }: { mark?: ScoreMark }) {
  return (
    <span className={mark?.isSplit ? "split-score-mark" : ""}>
      {mark?.value ?? ""}
    </span>
  );
}

export function ScoreGrid({
  title,
  entries,
}: {
  title: string;
  entries: ScoringFrame[];
}) {
  const framesByNumber = new Map<number, ScoringFrame>();

  entries.forEach((entry) => {
    framesByNumber.set(entry.frameNumber, entry);
  });

  const orderedFrames = Array.from(framesByNumber.values()).sort(
    (a, b) => a.frameNumber - b.frameNumber
  );
  const cumulativeScores = getCumulativeFrameScores(orderedFrames);
  const scoreGridId = `score-grid-${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")}`;
  const scoreGridDescriptionId = `${scoreGridId}-description`;

  return (
    <section className="score-grid-card" aria-describedby={scoreGridDescriptionId}>
      <h4 id={scoreGridId}>{title}</h4>
      <p className="sr-only" id={scoreGridDescriptionId}>
        Score grid for {title}. Each frame shows the frame number, roll marks,
        and cumulative score.
      </p>

      <div className="score-grid" role="table" aria-labelledby={scoreGridId}>
        {Array.from({ length: 10 }, (_, index) => {
          const frameNumber = index + 1;
          const frame = framesByNumber.get(frameNumber);
          const marks = frame ? getFrameMarks(frame) : [];
          const cumulativeScore = cumulativeScores[index] ?? "";

          return (
            <div
              className="score-frame"
              key={frameNumber}
              role="cell"
              aria-label={`Frame ${frameNumber}: ${
                marks.map((mark) => mark.value).filter(Boolean).join(" ") ||
                "no marks"
              }, cumulative score ${cumulativeScore || "not scored"}`}
            >
              <div className="score-frame-number">{frameNumber}</div>

              <div
                className={
                  frameNumber === 10
                    ? "score-rolls tenth-frame-rolls"
                    : "score-rolls"
                }
              >
                {frameNumber === 10 ? (
                  <>
                    <ScoreRollMark mark={marks[0]} />
                    <ScoreRollMark mark={marks[1]} />
                    <ScoreRollMark mark={marks[2]} />
                  </>
                ) : (
                  <>
                    <ScoreRollMark mark={marks[0]} />
                    <ScoreRollMark mark={marks[1]} />
                  </>
                )}
              </div>

              <div className="score-total">{cumulativeScore}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
