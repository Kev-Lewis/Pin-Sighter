// Baker stats components — the team-level Baker reporting tables that stay
// separate from individual bowler stats: the collapsible team/position/bowler
// summary section, the per-set rotation breakdown, and the per-game frame
// responsibility table. Extracted from App.tsx (stats decomposition); rendered
// by StatsPage.

import type { SavedGameRecord } from "../../types";
import type { SessionGroup } from "../../lib/sessions";
import { getFrameMarks, getFrameRolls } from "../../lib/scoring";
import { isStrikeEntry } from "../frames";
import { getSpareLeaveKey } from "../spareLeaves";
import {
  calculateBakerTeamSummaryRows,
  calculateBakerPositionRows,
  calculateBakerBowlerRows,
  getEntryResultLabel,
} from "../baker";

export function BakerStatsSection({
  games,
  selectedBakerBowler,
  selectedBall,
}: {
  games: SavedGameRecord[];
  selectedBakerBowler: string;
  selectedBall: string;
}) {
  const teamRows = calculateBakerTeamSummaryRows(games);
  const positionRows = calculateBakerPositionRows(
    games,
    selectedBakerBowler,
    selectedBall
  );
  const bowlerRows = calculateBakerBowlerRows(games).filter((row) => {
    const matchesBakerBowler =
      selectedBakerBowler === "All" || row.bowlerName === selectedBakerBowler;
    const matchesBall =
      selectedBall === "All" ||
      row.balls.split(", ").some((ballName) => ballName === selectedBall);

    return matchesBakerBowler && matchesBall;
  });

  return (
    <details className="baker-stats-card stats-collapsible-card">
      <summary className="stats-section-summary">
        <div>
          <strong>Baker Team Stats</strong>
          <p>
            Baker games stay separate from individual stats. Use this section
            for team score, lineup position, frame responsibility, and anchor
            10th-frame fill shots.
          </p>
        </div>
        <span className="summary-hint">Open / Close Section</span>
      </summary>

      <div className="stats-collapsible-content">
        <section className="baker-breakdown-card">
          <h4>Team Summary</h4>

          <div className="table-scroll">
            <table className="stats-table">
                    <caption className="sr-only">Bowling statistics table for this section.</caption>
              <thead>
                <tr>
                  <th>Baker Team</th>
                  <th>Games</th>
                  <th>Average</th>
                  <th>High Game</th>
                  <th>Frames</th>
                  <th>Strikes</th>
                  <th>Spares</th>
                  <th>Opens</th>
                  <th>Splits</th>
                  <th>Clean %</th>
                  <th>Clean Games</th>
                </tr>
              </thead>
              <tbody>
                {teamRows.map((row) => (
                  <tr key={row.teamName}>
                    <td>{row.teamName}</td>
                    <td>{row.games}</td>
                    <td>{row.average.toFixed(1)}</td>
                    <td>{row.highGame}</td>
                    <td>{row.frames}</td>
                    <td>{row.strikes}</td>
                    <td>{row.spares}</td>
                    <td>{row.opens}</td>
                    <td>{row.splits}</td>
                    <td>{row.cleanRate.toFixed(1)}%</td>
                    <td>{row.cleanGames}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="baker-breakdown-card">
          <h4>Stats by Baker Position</h4>
          <p className="helper-text">
            Position is calculated from the frame number and team size. For a
            five-person lineup, position 1 bowls frames 1 and 6, position 2
            bowls frames 2 and 7, and so on. The anchor position also gets
            credit for any 10th-frame fill-ball strikes or spares.
          </p>

          <div className="table-scroll">
            <table className="stats-table">
                    <caption className="sr-only">Bowling statistics table for this section.</caption>
              <thead>
                <tr>
                  <th>Position</th>
                  <th>Bowler(s)</th>
                  <th>Frames</th>
                  <th>Strikes</th>
                  <th>Spares</th>
                  <th>Opens</th>
                  <th>Splits</th>
                  <th>Clean %</th>
                </tr>
              </thead>
              <tbody>
                {positionRows.map((row) => (
                  <tr key={row.position}>
                    <td>{row.position}</td>
                    <td>{row.bowlers}</td>
                    <td>{row.frames}</td>
                    <td>{row.strikes}</td>
                    <td>{row.spares}</td>
                    <td>{row.opens}</td>
                    <td>{row.splits}</td>
                    <td>{row.cleanRate.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="baker-breakdown-card">
          <h4>Baker Bowler Contribution</h4>

          <div className="table-scroll">
            <table className="stats-table">
                    <caption className="sr-only">Bowling statistics table for this section.</caption>
              <thead>
                <tr>
                  <th>Bowler</th>
                  <th>Frames</th>
                  <th>Strikes</th>
                  <th>Spares</th>
                  <th>Opens</th>
                  <th>Splits</th>
                  <th>Clean %</th>
                  <th>Balls Used</th>
                </tr>
              </thead>
              <tbody>
                {bowlerRows.map((row) => (
                  <tr key={row.bowlerName}>
                    <td>{row.bowlerName}</td>
                    <td>{row.frames}</td>
                    <td>{row.strikes}</td>
                    <td>{row.spares}</td>
                    <td>{row.opens}</td>
                    <td>{row.splits}</td>
                    <td>{row.cleanRate.toFixed(1)}%</td>
                    <td>{row.balls}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </details>
  );
}

export function BakerSetBreakdown({
  session,
}: {
  session: SessionGroup;
}) {
  const rows = calculateBakerBowlerRows(session.games);

  if (rows.length === 0) {
    return null;
  }

  return (
    <section className="baker-breakdown-card">
      <h4>Baker Rotation Breakdown</h4>
      <p className="helper-text">
        Baker keeps the team score as one score while still tracking who bowled
        each frame. This table shows each bowler’s frame responsibility inside
        the team set.
      </p>

      <div className="table-scroll">
        <table className="stats-table">
                    <caption className="sr-only">Bowling statistics table for this section.</caption>
          <thead>
            <tr>
              <th>Bowler</th>
              <th>Frames</th>
              <th>Strikes</th>
              <th>Spares</th>
              <th>Opens</th>
              <th>Splits</th>
              <th>Clean %</th>
              <th>Balls Used</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.bowlerName}>
                <td>{row.bowlerName}</td>
                <td>{row.frames}</td>
                <td>{row.strikes}</td>
                <td>{row.spares}</td>
                <td>{row.opens}</td>
                <td>{row.splits}</td>
                <td>{row.cleanRate.toFixed(1)}%</td>
                <td>{row.balls}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function BakerFrameTable({ game }: { game: SavedGameRecord }) {
  return (
    <section className="baker-frame-card">
      <h4>Baker Frame Responsibility</h4>

      <div className="table-scroll">
        <table className="stats-table">
                    <caption className="sr-only">Bowling statistics table for this section.</caption>
          <thead>
            <tr>
              <th>Frame</th>
              <th>Bowler</th>
              <th>Ball</th>
              <th>Marks</th>
              <th>Leave</th>
              <th>Result</th>
              <th>Frame Pinfall</th>
            </tr>
          </thead>
          <tbody>
            {game.entries
              .sort((a, b) => a.frameNumber - b.frameNumber)
              .map((entry) => (
                <tr key={`${game.id}-${entry.frameNumber}`}>
                  <td>{entry.frameNumber}</td>
                  <td>{entry.bowlerName}</td>
                  <td>{entry.ballUsed || "No ball"}</td>
                  <td>
                    {getFrameMarks(entry)
                      .map((mark) => mark.value)
                      .filter(Boolean)
                      .join(" ")}
                  </td>
                  <td>{isStrikeEntry(entry) ? "—" : getSpareLeaveKey(entry)}</td>
                  <td>{getEntryResultLabel(entry)}</td>
                  <td>
                    {getFrameRolls(entry).reduce(
                      (sum, roll) => sum + roll,
                      0
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
