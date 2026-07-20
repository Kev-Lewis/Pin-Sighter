// StatsSections — presentational collapsible report sections lifted out of
// StatsPage (shell lift, stage 4). Each takes already-computed stat data as
// props and renders one <details> card. StatsPage keeps the filter/derivation
// spine and any surrounding conditionals.

import { useState } from "react";
import type { SavedGameRecord } from "../../types";
import type { SessionGroup } from "../../lib/sessions";
import type { DetailedStatDetail } from "../types";
import { buildOverviewStatCards } from "../overview";
import {
  calculateSpareLeaveRows,
  calculateSpareLeaveSummary,
} from "../spareLeaves";
import { calculateTeamSetRows } from "../setStats";
import {
  calculateBoardStats,
  calculateBoardProgressionRows,
  buildTargetingStatCards,
  formatMaybeNumber,
  formatSignedNumber,
  formatPercentValue,
} from "../board";
import {
  calculateDetailedBowlerStats,
  buildDetailedStatCards,
} from "../detailed";
import { StaticPinLeaveDeck } from "../../components/StaticPinLeaveDeck";

export function OverviewSection({
  filterEpoch,
  isBakerTeamSelection,
  hiddenBakerGameCount,
  sessionGroups,
  statsFilteredGames,
  overviewStatCards,
  overallAverage,
  overviewHighGame,
  overviewHighThreeGameSeries,
  onStatClick,
}: {
  filterEpoch: number;
  isBakerTeamSelection: boolean;
  hiddenBakerGameCount: number;
  sessionGroups: SessionGroup[];
  statsFilteredGames: SavedGameRecord[];
  overviewStatCards: ReturnType<typeof buildOverviewStatCards>;
  overallAverage: number;
  overviewHighGame: number;
  overviewHighThreeGameSeries: number;
  onStatClick: (stat: DetailedStatDetail) => void;
}) {
  return (
    <details
      key={`overview-${filterEpoch}`}
      className="stats-collapsible-card"
      open
    >
      <summary className="stats-section-summary">
        <div>
          <strong>Overview</strong>
          <p>
            Headline numbers for the games matching the current filters.
            {!isBakerTeamSelection && hiddenBakerGameCount > 0
              ? " Baker games are hidden unless a Baker Team is selected."
              : ""}
          </p>
        </div>
        <span className="summary-hint">Open / Close Section</span>
      </summary>

      <div className="stats-collapsible-content stats-summary-grid">
        <button
          className="stat-card stat-card-button hero-card"
          type="button"
          onClick={() => onStatClick(overviewStatCards.average)}
          aria-label="View details for average"
        >
          <strong>{overallAverage.toFixed(1)}</strong>
          <span>Average</span>
          <small>View Details</small>
        </button>

        <div className="stat-card hero-card">
          <strong>{statsFilteredGames.length}</strong>
          <span>Games</span>
        </div>

        <button
          className="stat-card stat-card-button"
          type="button"
          onClick={() => onStatClick(overviewStatCards.highGame)}
          aria-label="View details for high game"
        >
          <strong>{overviewHighGame || "—"}</strong>
          <span>High Game</span>
          <small>View Details</small>
        </button>

        <button
          className="stat-card stat-card-button"
          type="button"
          onClick={() => onStatClick(overviewStatCards.highSeries)}
          aria-label="View details for high series"
        >
          <strong>{overviewHighThreeGameSeries || "—"}</strong>
          <span>High Series (3-game)</span>
          <small>View Details</small>
        </button>

        <div className="stat-card">
          <strong>{sessionGroups.length}</strong>
          <span>Saved Sets</span>
        </div>
      </div>
    </details>
  );
}

export function FrameOutcomesSection({
  filterEpoch,
  frameCount,
  strikeCount,
  spareCount,
  openCount,
  splitCount,
  cleanGameCount,
}: {
  filterEpoch: number;
  frameCount: number;
  strikeCount: number;
  spareCount: number;
  openCount: number;
  splitCount: number;
  cleanGameCount: number;
}) {
  return (
    <details
      key={`frame-outcomes-${filterEpoch}`}
      className="stats-collapsible-card"
      open
    >
      <summary className="stats-section-summary">
        <div>
          <div className="section-title-row">
            <strong>Frame Outcomes</strong>
            <span className="section-count">
              {frameCount.toLocaleString()} frames
            </span>
          </div>
          <p>
            Strike, spare, open, split, and clean-game totals across the
            filtered frames.
          </p>
        </div>
        <span className="summary-hint">Open / Close Section</span>
      </summary>

      <div className="stats-collapsible-content stats-summary-grid">
        <div className="stat-card">
          <strong>{strikeCount}</strong>
          <span>Strikes</span>
        </div>

        <div className="stat-card">
          <strong>{spareCount}</strong>
          <span>Spares</span>
        </div>

        <div className="stat-card">
          <strong>{openCount}</strong>
          <span>Opens</span>
        </div>

        <div className="stat-card">
          <strong>{splitCount}</strong>
          <span>Splits</span>
        </div>

        <div className="stat-card">
          <strong>{cleanGameCount}</strong>
          <span>Clean Games</span>
        </div>
      </div>
    </details>
  );
}

export function SpareLeaveSection({
  filterEpoch,
  spareLeaveSummary,
  spareLeaveRows,
}: {
  filterEpoch: number;
  spareLeaveSummary: ReturnType<typeof calculateSpareLeaveSummary>;
  spareLeaveRows: ReturnType<typeof calculateSpareLeaveRows>;
}) {
  type SpareSortKey =
    | "leave"
    | "attempts"
    | "conversions"
    | "misses"
    | "conversionPercentage";
  const [sort, setSort] = useState<{
    key: SpareSortKey;
    dir: "asc" | "desc";
  } | null>(null);

  function toggleSort(key: SpareSortKey) {
    setSort((current) => {
      if (current?.key === key) {
        return { key, dir: current.dir === "asc" ? "desc" : "asc" };
      }
      // Text sorts A→Z by default; numeric columns start high→low.
      return { key, dir: key === "leave" ? "asc" : "desc" };
    });
  }

  // Default (sort === null) keeps the calculator's own frequency order.
  const displayRows = sort
    ? [...spareLeaveRows].sort((a, b) => {
        const aValue = a[sort.key];
        const bValue = b[sort.key];
        const comparison =
          typeof aValue === "number" && typeof bValue === "number"
            ? aValue - bValue
            : String(aValue).localeCompare(String(bValue), undefined, {
                numeric: true,
              });
        return sort.dir === "asc" ? comparison : -comparison;
      })
    : spareLeaveRows;

  function sortableHeader(label: string, key: SpareSortKey) {
    const activeDir = sort?.key === key ? sort.dir : null;
    return (
      <th
        aria-sort={
          activeDir === "asc"
            ? "ascending"
            : activeDir === "desc"
            ? "descending"
            : "none"
        }
      >
        <button
          type="button"
          className="th-sort"
          onClick={() => toggleSort(key)}
        >
          {label}
          <span className="th-sort-ind" aria-hidden="true">
            {activeDir === "asc" ? "▲" : activeDir === "desc" ? "▼" : "⇅"}
          </span>
        </button>
      </th>
    );
  }

  return (
    <details
      key={`spare-leave-${filterEpoch}`}
      className="spare-leave-card stats-collapsible-card"
    >
      <summary className="stats-section-summary">
        <div>
          <strong>Spare Leave Breakdown</strong>
          <p>
            Most common leaves, attempts, conversions, misses, and pickup
            percentages.
          </p>
        </div>
        <span className="summary-hint">Open / Close Section</span>
      </summary>

      <div className="stats-collapsible-content">
        <p className="helper-text">
          Leaves are grouped by first-ball result and sorted by how often
          each leave occurs.
        </p>

        <div className="stats-summary-grid spare-summary-grid">
          <div className="stat-card">
            <strong>
              {spareLeaveSummary.makeable.percentage.toFixed(1)}%
            </strong>
            <span>
              Makeable Pickup ({spareLeaveSummary.makeable.conversions}/
              {spareLeaveSummary.makeable.attempts})
            </span>
          </div>

          <div className="stat-card">
            <strong>
              {spareLeaveSummary.singlePin.percentage.toFixed(1)}%
            </strong>
            <span>
              Single Pin Pickup ({spareLeaveSummary.singlePin.conversions}/
              {spareLeaveSummary.singlePin.attempts})
            </span>
          </div>

          <div className="stat-card">
            <strong>
              {spareLeaveSummary.multiPin.percentage.toFixed(1)}%
            </strong>
            <span>
              Multi Pin Pickup ({spareLeaveSummary.multiPin.conversions}/
              {spareLeaveSummary.multiPin.attempts})
            </span>
          </div>

          <div className="stat-card">
            <strong>
              {spareLeaveSummary.split.percentage.toFixed(1)}%
            </strong>
            <span>
              Split Pickup ({spareLeaveSummary.split.conversions}/
              {spareLeaveSummary.split.attempts})
            </span>
          </div>
        </div>

        {spareLeaveRows.length === 0 ? (
        <p className="helper-text">
          No spare attempts match the current filters.
        </p>
      ) : (
        <div className="table-scroll">
          <table className="stats-table">
              <caption className="sr-only">Bowling statistics table for this section.</caption>
            <thead>
              <tr>
                {sortableHeader("Leave", "leave")}
                <th>Pins</th>
                {sortableHeader("Attempts", "attempts")}
                {sortableHeader("Conversions", "conversions")}
                {sortableHeader("Misses", "misses")}
                {sortableHeader("Pickup %", "conversionPercentage")}
              </tr>
            </thead>
            <tbody>
              {displayRows.map((row) => (
                <tr key={row.leave}>
                  <td>{row.leave}</td>
                  <td>
                    <StaticPinLeaveDeck leave={row.leave} />
                  </td>
                  <td>{row.attempts}</td>
                  <td>{row.conversions}</td>
                  <td>{row.misses}</td>
                  <td>{row.conversionPercentage.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </details>
  );
}

export function TeamSetSection({
  filterEpoch,
  teamSetRows,
}: {
  filterEpoch: number;
  teamSetRows: ReturnType<typeof calculateTeamSetRows>;
}) {
  return (
    <details
      key={`team-set-${filterEpoch}`}
      className="team-set-card stats-collapsible-card"
    >
      <summary className="stats-section-summary">
        <div>
          <strong>Team / Set Breakdown</strong>
          <p>
            Team totals and averages for the current set filters.
          </p>
        </div>
        <span className="summary-hint">Open / Close Section</span>
      </summary>

      <div className="stats-collapsible-content">
        <div className="table-scroll">
          <table className="stats-table">
            <caption className="sr-only">Bowling statistics table for this section.</caption>
            <thead>
              <tr>
                <th>Set</th>
                <th>Games</th>
                <th>Tracked Bowlers</th>
                <th>Team Set Total</th>
                <th>Team Game Avg</th>
                <th>Tracked Bowler Avg</th>
                <th>High Team Game</th>
                <th>Frames</th>
                <th>Strikes</th>
                <th>Spares</th>
                <th>Opens</th>
                <th>Clean %</th>
                <th>Split %</th>
                <th>Clean Team Games</th>
              </tr>
            </thead>
            <tbody>
              {teamSetRows.map((row) => (
                <tr key={row.sessionKey}>
                  <td>{row.title}</td>
                  <td>{row.games}</td>
                  <td>{row.bowlers}</td>
                  <td>{row.teamSetTotal}</td>
                  <td>{row.teamGameAverage.toFixed(1)}</td>
                  <td>{row.trackedBowlerAverage.toFixed(1)}</td>
                  <td>{row.highTeamGame}</td>
                  <td>{row.frames}</td>
                  <td>{row.strikes}</td>
                  <td>{row.spares}</td>
                  <td>{row.opens}</td>
                  <td>{row.cleanRate.toFixed(1)}%</td>
                  <td>{row.splitRate.toFixed(1)}%</td>
                  <td>{row.cleanTeamGames}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </details>
  );
}

export function TargetingSection({
  filterEpoch,
  boardStats,
  targetingStatCards,
  boardProgressionRows,
  onStatClick,
}: {
  filterEpoch: number;
  boardStats: ReturnType<typeof calculateBoardStats>;
  targetingStatCards: ReturnType<typeof buildTargetingStatCards>;
  boardProgressionRows: ReturnType<typeof calculateBoardProgressionRows>;
  onStatClick: (stat: DetailedStatDetail) => void;
}) {
  return (
    <details
      key={`board-analysis-${filterEpoch}`}
      className="board-analysis-card stats-collapsible-card"
    >
      <summary className="stats-section-summary">
        <div>
          <strong>Targeting Analysis</strong>
          <p>
            Foot board, target arrow, actual arrow, breakpoint, miss
            averages, and progression over filtered sets.
          </p>
        </div>
        <span className="summary-hint">Open / Close Section</span>
      </summary>

      <div className="stats-collapsible-content">
        <p className="helper-text">
          This uses the foot board, target arrow, actual arrow, target
          breakpoint, and actual breakpoint saved on each shot. Miss values
          are calculated as actual minus target, so positive means farther
          right on the board scale and negative means farther left.
        </p>

        {boardStats.trackedShots === 0 ? (
        <p className="helper-text">
          No board/targeting data matches the current filters yet.
        </p>
      ) : (
        <>
          <div className="stats-summary-grid">
            {targetingStatCards.map((stat) => (
              <button
                className="stat-card stat-card-button"
                key={stat.title}
                type="button"
                onClick={() => onStatClick(stat)}
                aria-label={`View details for ${stat.label}`}
              >
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
                <small>View Details</small>
              </button>
            ))}
          </div>

          <section className="board-table-section">
            <h4>Board Stats by Ball</h4>

            <div className="table-scroll">
              <table className="stats-table">
              <caption className="sr-only">Bowling statistics table for this section.</caption>
                <thead>
                  <tr>
                    <th>Ball</th>
                    <th>Shots</th>
                    <th>Avg Foot</th>
                    <th>Avg Target Arrow</th>
                    <th>Avg Actual Arrow</th>
                    <th>Avg Arrow Miss</th>
                    <th>Avg Abs Arrow Miss</th>
                    <th>Arrow ±1</th>
                    <th>Avg Target BP</th>
                    <th>Avg Actual BP</th>
                    <th>Avg BP Miss</th>
                    <th>Avg Abs BP Miss</th>
                    <th>BP ±1</th>
                  </tr>
                </thead>
                <tbody>
                  {boardStats.byBallRows.map((row) => (
                    <tr key={row.ball}>
                      <td>{row.ball}</td>
                      <td>{row.shots}</td>
                      <td>{formatMaybeNumber(row.averageFootBoard)}</td>
                      <td>{formatMaybeNumber(row.averageTargetArrow)}</td>
                      <td>{formatMaybeNumber(row.averageActualArrow)}</td>
                      <td>{formatSignedNumber(row.averageArrowMiss)}</td>
                      <td>
                        {formatMaybeNumber(row.averageAbsoluteArrowMiss)}
                      </td>
                      <td>{formatPercentValue(row.arrowHitRate)}</td>
                      <td>
                        {formatMaybeNumber(row.averageTargetBreakpoint)}
                      </td>
                      <td>
                        {formatMaybeNumber(row.averageActualBreakpoint)}
                      </td>
                      <td>
                        {formatSignedNumber(row.averageBreakpointMiss)}
                      </td>
                      <td>
                        {formatMaybeNumber(row.averageAbsoluteBreakpointMiss)}
                      </td>
                      <td>{formatPercentValue(row.breakpointHitRate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="board-table-section">
            <h4>Progression Over Filtered Sets</h4>
            <p className="helper-text">
              This shows how feet, arrows, and breakpoints progress by
              game/set under the current filters.
            </p>

            {boardProgressionRows.length === 0 ? (
              <p className="helper-text">
                No progression rows match the current filters.
              </p>
            ) : (
              <div className="table-scroll">
                <table className="stats-table">
              <caption className="sr-only">Bowling statistics table for this section.</caption>
                  <thead>
                    <tr>
                      <th>Set</th>
                      <th>Game</th>
                      <th>Lane</th>
                      <th>Shots</th>
                      <th>Avg Foot</th>
                      <th>Avg Target Arrow</th>
                      <th>Avg Actual Arrow</th>
                      <th>Avg Arrow Miss</th>
                      <th>Avg Target BP</th>
                      <th>Avg Actual BP</th>
                      <th>Avg BP Miss</th>
                    </tr>
                  </thead>
                  <tbody>
                    {boardProgressionRows.map((row) => (
                      <tr key={`${row.sessionTitle}-${row.gameNumber}-${row.laneLabel}`}>
                        <td>{row.sessionTitle}</td>
                        <td>{row.gameNumber}</td>
                        <td>{row.laneLabel}</td>
                        <td>{row.shots}</td>
                        <td>{formatMaybeNumber(row.averageFootBoard)}</td>
                        <td>
                          {formatMaybeNumber(row.averageTargetArrow)}
                        </td>
                        <td>
                          {formatMaybeNumber(row.averageActualArrow)}
                        </td>
                        <td>{formatSignedNumber(row.averageArrowMiss)}</td>
                        <td>
                          {formatMaybeNumber(row.averageTargetBreakpoint)}
                        </td>
                        <td>
                          {formatMaybeNumber(row.averageActualBreakpoint)}
                        </td>
                        <td>
                          {formatSignedNumber(row.averageBreakpointMiss)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="board-table-section">
            <h4>Recent Board Data</h4>

            <div className="table-scroll">
              <table className="stats-table">
              <caption className="sr-only">Bowling statistics table for this section.</caption>
                <thead>
                  <tr>
                    <th>Bowler</th>
                    <th>Frame</th>
                    <th>Ball</th>
                    <th>Foot</th>
                    <th>Target Arrow</th>
                    <th>Actual Arrow</th>
                    <th>Arrow Miss</th>
                    <th>Target BP</th>
                    <th>Actual BP</th>
                    <th>BP Miss</th>
                  </tr>
                </thead>
                <tbody>
                  {boardStats.recentRows.map((row, index) => (
                    <tr key={`${row.bowlerName}-${row.frameNumber}-${index}`}>
                      <td>{row.bowlerName}</td>
                      <td>{row.frameNumber}</td>
                      <td>{row.ballUsed || "No ball"}</td>
                      <td>{formatMaybeNumber(row.footBoard)}</td>
                      <td>{formatMaybeNumber(row.targetArrow)}</td>
                      <td>{formatMaybeNumber(row.actualArrow)}</td>
                      <td>{formatSignedNumber(row.arrowMiss)}</td>
                      <td>{formatMaybeNumber(row.targetBreakpoint)}</td>
                      <td>{formatMaybeNumber(row.actualBreakpoint)}</td>
                      <td>{formatSignedNumber(row.breakpointMiss)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
        )}
      </div>
    </details>
  );
}

export function BowlerBreakdownTable({
  bowlerRows,
}: {
  bowlerRows: {
    bowlerName: string;
    games: number;
    average: number;
    highGame: number;
    highSeries: number;
  }[];
}) {
  if (bowlerRows.length === 0) {
    return <p className="helper-text">No rows match the current filters.</p>;
  }

  return (
    <div className="table-scroll">
      <table className="stats-table">
        <caption className="sr-only">Bowling statistics table for this section.</caption>
        <thead>
          <tr>
            <th>Name</th>
            <th>Games</th>
            <th>Average</th>
            <th>High Game</th>
            <th>High Series</th>
          </tr>
        </thead>
        <tbody>
          {bowlerRows.map((row) => (
            <tr key={row.bowlerName}>
              <td>{row.bowlerName}</td>
              <td>{row.games}</td>
              <td>{row.average ? row.average.toFixed(1) : "—"}</td>
              <td>{row.highGame || "—"}</td>
              <td>{row.highSeries || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DetailedBowlerAnalysis({
  detailedStats,
  detailedStatCards,
  selectedBowler,
  selectedBall,
  onStatClick,
}: {
  detailedStats: NonNullable<ReturnType<typeof calculateDetailedBowlerStats>>;
  detailedStatCards: ReturnType<typeof buildDetailedStatCards>;
  selectedBowler: string;
  selectedBall: string;
  onStatClick: (stat: DetailedStatDetail) => void;
}) {
  return (
    <section className="deep-stats-card inner-stats-card">
      <h3>
        Detailed Bowler Analysis — {selectedBowler}
        {selectedBall !== "All" ? ` with ${selectedBall}` : ""}
      </h3>
      <p className="helper-text">
        Deeper scoring, pocket, spare, clean-frame, split, and
        first-ball stats.
      </p>
      <div className="deep-stats-grid">
        {detailedStatCards.map((stat) => (
          <button
            className="stat-card stat-card-button"
            key={stat.title}
            type="button"
            onClick={() => onStatClick(stat)}
            aria-label={`View details for ${stat.label}`}
          >
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
            <small>View Details</small>
          </button>
        ))}
      </div>

      <section className="frame-score-card">
        <h4>Average Frame Score</h4>
        <p className="helper-text">
          Average scoring value by frame.
        </p>

        <div className="frame-score-chart">
          {detailedStats.frameScoreRows.map((row) => (
            <div className="frame-score-bar-row" key={row.frameNumber}>
              <span className="frame-score-label">
                Frame {row.frameNumber}
              </span>
              <div className="frame-score-track">
                <div
                  className="frame-score-bar"
                  style={{
                    width: `${Math.min(100, (row.average / 30) * 100)}%`,
                  }}
                />
              </div>
              <strong>{row.average.toFixed(1)}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="average-game-card">
        <h4>Average by Game</h4>
        <p className="helper-text">
          Average score by game number across matching sets.
        </p>

        <div className="table-scroll">
          <table className="stats-table">
        <caption className="sr-only">Bowling statistics table for this section.</caption>
            <thead>
              <tr>
                <th>Game</th>
                <th>Games Tracked</th>
                <th>Average</th>
                <th>High</th>
                <th>Low</th>
              </tr>
            </thead>
            <tbody>
              {detailedStats.averageByGameRows.map((row) => (
                <tr key={row.gameNumber}>
                  <td>Game {row.gameNumber}</td>
                  <td>{row.count}</td>
                  <td>{row.average.toFixed(1)}</td>
                  <td>{row.high}</td>
                  <td>{row.low}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="score-distribution-card">
        <h4>Score Distribution</h4>
        <p className="helper-text">
          Score ranges by game number, plus 3-game series totals.
        </p>

        <div className="score-distribution-grid">
          <section>
            <h5>Game Distribution</h5>

            <div className="table-scroll">
              <table className="stats-table distribution-table">
        <caption className="sr-only">Bowling statistics table for this section.</caption>
                <thead>
                  <tr>
                    <th>Games</th>
                    {detailedStats.scoreDistribution.gameNumbers.map(
                      (gameNumber) => (
                        <th key={gameNumber}>Game {gameNumber}</th>
                      )
                    )}
                    <th>Total</th>
                    <th>%</th>
                  </tr>
                </thead>
                <tbody>
                  {detailedStats.scoreDistribution.gameRows.map(
                    (row) => (
                      <tr key={row.label}>
                        <td>{row.label}</td>
                        {detailedStats.scoreDistribution.gameNumbers.map(
                          (gameNumber) => (
                            <td key={gameNumber}>
                              {row.gameCounts[gameNumber] ?? 0}
                            </td>
                          )
                        )}
                        <td>{row.total}</td>
                        <td>{row.percentage.toFixed(1)}%</td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h5>Series Distribution</h5>

            <div className="table-scroll">
              <table className="stats-table distribution-table">
        <caption className="sr-only">Bowling statistics table for this section.</caption>
                <thead>
                  <tr>
                    <th>Series</th>
                    <th>Total</th>
                    <th>%</th>
                  </tr>
                </thead>
                <tbody>
                  {detailedStats.scoreDistribution.seriesRows.map(
                    (row) => (
                      <tr key={row.label}>
                        <td>{row.label}</td>
                        <td>{row.total}</td>
                        <td>{row.percentage.toFixed(1)}%</td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </section>

      <section className="transition-card">
        <h4>Transitional Phase Breakdown</h4>
        <p className="helper-text">
          Phase is estimated using first-shot frame count per lane,
          adjusted by the session's Bowlers Per Pair value:
          Fresh ≤55, Early Transition 56–110, Early Middle 111–165,
          Late Middle 166–220, Late Transition 221–275, Burn ≥276.
          Reference:{" "}
          <a
            href="https://www.bowlingthismonth.com/bowling-tips/how-to-arrive-at-more-meaningful-analysis-data/"
            target="_blank"
            rel="noreferrer"
          >
            Bowling This Month
          </a>
          .
        </p>

        <div className="table-scroll">
          <table className="stats-table">
        <caption className="sr-only">Bowling statistics table for this section.</caption>
            <thead>
              <tr>
                <th>Phase</th>
                <th>Frames</th>
                <th>Strikes</th>
                <th>Spares</th>
                <th>Opens</th>
                <th>Splits</th>
                <th>Strike %</th>
                <th>Clean %</th>
              </tr>
            </thead>
            <tbody>
              {detailedStats.transitionRows.map((row) => (
                <tr key={row.phase}>
                  <td>{row.phase}</td>
                  <td>{row.frames}</td>
                  <td>{row.strikes}</td>
                  <td>{row.spares}</td>
                  <td>{row.opens}</td>
                  <td>{row.splits}</td>
                  <td>{row.strikePercentage.toFixed(1)}%</td>
                  <td>{row.cleanPercentage.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
