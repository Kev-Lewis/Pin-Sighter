// StatsFilterBar — the Stats page filter bar: a segmented scope toggle plus a
// row of labeled pill dropdowns. The always-relevant filters (scope selection,
// time frame, center, pattern) sit inline; the conditional ones (ball,
// competition, event, set, game, lane, baker bowler) tuck into a "More filters"
// tray. Purely presentational — StatsPage owns `filters`, computes the option
// lists + derived selected values, and passes update/clear callbacks in. The
// export trigger lives in the page header, not here.

import { useState, type ReactNode } from "react";
import type { StatsFilters, TimeFramePreset } from "../../lib/statsFilters";

type StatsFilterBarProps = {
  filters: StatsFilters;
  selected: {
    bowler: string;
    bakerBowler: string;
    ball: string;
    competition: string;
    eventName: string;
    eventStage: string;
    setKey: string;
    gameNumber: string;
    center: string;
    lane: string;
    pattern: string;
  };
  options: {
    selection: string[];
    bakerBowler: string[];
    ball: string[];
    competition: string[];
    event: string[];
    eventStage: string[];
    set: { key: string; label: string }[];
    game: string[];
    center: string[];
    lane: string[];
    pattern: string[];
  };
  isBakerTeamSelection: boolean;
  usesEventFilter: boolean;
  usesSetFilter: boolean;
  onUpdateFilters: (patch: Partial<StatsFilters>) => void;
  onClearFilters: () => void;
};

const TIME_FRAME_LABELS: Record<TimeFramePreset, string> = {
  all: "All time",
  thisWeek: "This week",
  thisMonth: "This month",
  thisYear: "This year",
  last7: "Last 7 days",
  last30: "Last 30 days",
  last90: "Last 90 days",
  custom: "Custom range…",
};

// One labeled pill dropdown: `LABEL  value  ▾`. A transparent full-size <select>
// overlays the whole pill so a click anywhere opens the native menu; `display`
// is the visible text for the current value, `active` tints it when non-default.
function FilterPill({
  label,
  display,
  value,
  active,
  onChange,
  children,
}: {
  label: string;
  display: string;
  value: string;
  active: boolean;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <div className={`filter-pill${active ? " is-set" : ""}`}>
      <span className="filter-pill-k">{label}</span>
      <span className="filter-pill-v">{display}</span>
      <span className="filter-pill-chev" aria-hidden="true">
        ▾
      </span>
      <select
        className="filter-pill-native"
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </select>
    </div>
  );
}

export function StatsFilterBar({
  filters,
  selected,
  options,
  isBakerTeamSelection,
  usesEventFilter,
  usesSetFilter,
  onUpdateFilters,
  onClearFilters,
}: StatsFilterBarProps) {
  const [showMore, setShowMore] = useState(false);

  // Which conditional filters are currently relevant (and therefore rendered in
  // the tray). Competition is always relevant; the rest depend on context.
  const showBaker = isBakerTeamSelection;
  const showBall = selected.bowler !== "All";
  const showEvent = usesEventFilter;
  const showStage = usesEventFilter && selected.eventName !== "All";
  const showSet = usesSetFilter;
  const showGame = selected.setKey !== "All";
  const showLane = selected.center !== "All";

  const relevantExtras = [
    showBaker,
    showBall,
    true, // competition
    showEvent,
    showStage,
    showSet,
    showGame,
    showLane,
  ].filter(Boolean).length;

  // Any extra filter holding a non-default value → flag the More button so a
  // collapsed tray still signals that hidden filters are active.
  const hasActiveExtra =
    (showBaker && selected.bakerBowler !== "All") ||
    (showBall && selected.ball !== "All") ||
    selected.competition !== "All" ||
    (showEvent && selected.eventName !== "All") ||
    (showStage && selected.eventStage !== "All") ||
    (showSet && selected.setKey !== "All") ||
    (showGame && selected.gameNumber !== "All") ||
    (showLane && selected.lane !== "All");

  const selectedSetLabel =
    selected.setKey === "All"
      ? "All"
      : options.set.find((option) => option.key === selected.setKey)?.label ??
        "Selected set";

  return (
    <section className="stats-filter-panel">
      <div className="stats-filter-row">
        <div className="stats-scope-toggle" role="group" aria-label="Scope">
          <button
            type="button"
            className={filters.mode === "all" ? "is-active" : ""}
            aria-pressed={filters.mode === "all"}
            onClick={() => onUpdateFilters({ mode: "all" })}
          >
            All Bowlers
          </button>
          <button
            type="button"
            className={filters.mode === "individual" ? "is-active" : ""}
            aria-pressed={filters.mode === "individual"}
            onClick={() => onUpdateFilters({ mode: "individual" })}
          >
            Individual
          </button>
          <button
            type="button"
            className={filters.mode === "baker" ? "is-active" : ""}
            aria-pressed={filters.mode === "baker"}
            onClick={() => onUpdateFilters({ mode: "baker" })}
          >
            Baker Team
          </button>
        </div>

        {(filters.mode === "individual" || filters.mode === "baker") && (
          <FilterPill
            label={filters.mode === "baker" ? "Team" : "Bowler"}
            display={filters.selection}
            value={filters.selection}
            active={filters.selection !== "All"}
            onChange={(value) => onUpdateFilters({ selection: value })}
          >
            <option>All</option>
            {options.selection.map((name) => (
              <option key={name}>{name}</option>
            ))}
          </FilterPill>
        )}

        <FilterPill
          label="When"
          display={TIME_FRAME_LABELS[filters.timeFrame.preset]}
          value={filters.timeFrame.preset}
          active={filters.timeFrame.preset !== "all"}
          onChange={(value) =>
            onUpdateFilters({
              timeFrame: {
                ...filters.timeFrame,
                preset: value as TimeFramePreset,
              },
            })
          }
        >
          <option value="all">All time</option>
          <option value="thisWeek">This week</option>
          <option value="thisMonth">This month</option>
          <option value="thisYear">This year</option>
          <option value="last7">Last 7 days</option>
          <option value="last30">Last 30 days</option>
          <option value="last90">Last 90 days</option>
          <option value="custom">Custom range…</option>
        </FilterPill>

        {filters.timeFrame.preset === "custom" && (
          <>
            <label className="filter-pill filter-pill-date is-set">
              <span className="filter-pill-k">From</span>
              <input
                className="filter-pill-dateinput"
                type="date"
                value={filters.timeFrame.from ?? ""}
                onChange={(event) =>
                  onUpdateFilters({
                    timeFrame: {
                      ...filters.timeFrame,
                      from: event.target.value || null,
                    },
                  })
                }
              />
            </label>
            <label className="filter-pill filter-pill-date is-set">
              <span className="filter-pill-k">To</span>
              <input
                className="filter-pill-dateinput"
                type="date"
                value={filters.timeFrame.to ?? ""}
                onChange={(event) =>
                  onUpdateFilters({
                    timeFrame: {
                      ...filters.timeFrame,
                      to: event.target.value || null,
                    },
                  })
                }
              />
            </label>
          </>
        )}

        <FilterPill
          label="Center"
          display={selected.center}
          value={selected.center}
          active={selected.center !== "All"}
          onChange={(value) => onUpdateFilters({ center: value })}
        >
          <option>All</option>
          {options.center.map((center) => (
            <option key={center}>{center}</option>
          ))}
        </FilterPill>

        <FilterPill
          label="Pattern"
          display={selected.pattern}
          value={selected.pattern}
          active={selected.pattern !== "All"}
          onChange={(value) => onUpdateFilters({ pattern: value })}
        >
          <option>All</option>
          {options.pattern.map((pattern) => (
            <option key={pattern}>{pattern}</option>
          ))}
        </FilterPill>

        <button
          type="button"
          className={`stats-more-button${showMore ? " is-open" : ""}${
            hasActiveExtra ? " is-active" : ""
          }`}
          aria-expanded={showMore}
          onClick={() => setShowMore((open) => !open)}
        >
          More filters
          {relevantExtras > 0 && (
            <span className="stats-more-badge">+{relevantExtras}</span>
          )}
        </button>

        <button
          type="button"
          className="stats-reset-link"
          onClick={onClearFilters}
        >
          Reset
        </button>
      </div>

      {showMore && (
        <div className="stats-more-tray">
          {showBaker && (
            <FilterPill
              label="Baker Bowler"
              display={selected.bakerBowler}
              value={selected.bakerBowler}
              active={selected.bakerBowler !== "All"}
              onChange={(value) => onUpdateFilters({ bakerBowler: value })}
            >
              <option>All</option>
              {options.bakerBowler.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </FilterPill>
          )}

          {showBall && (
            <FilterPill
              label="Ball"
              display={selected.ball}
              value={selected.ball}
              active={selected.ball !== "All"}
              onChange={(value) => onUpdateFilters({ ball: value })}
            >
              <option>All</option>
              {options.ball.map((ball) => (
                <option key={ball}>{ball}</option>
              ))}
            </FilterPill>
          )}

          <FilterPill
            label="Competition"
            display={selected.competition}
            value={selected.competition}
            active={selected.competition !== "All"}
            onChange={(value) => onUpdateFilters({ competition: value })}
          >
            <option>All</option>
            {options.competition.map((competition) => (
              <option key={competition}>{competition}</option>
            ))}
          </FilterPill>

          {showEvent && (
            <FilterPill
              label={selected.competition}
              display={selected.eventName}
              value={selected.eventName}
              active={selected.eventName !== "All"}
              onChange={(value) => onUpdateFilters({ eventName: value })}
            >
              <option>All</option>
              {options.event.map((eventName) => (
                <option key={eventName}>{eventName}</option>
              ))}
            </FilterPill>
          )}

          {showStage && (
            <FilterPill
              label={selected.competition === "League" ? "Week" : "Day"}
              display={selected.eventStage}
              value={selected.eventStage}
              active={selected.eventStage !== "All"}
              onChange={(value) => onUpdateFilters({ eventStage: value })}
            >
              <option>All</option>
              {options.eventStage.map((eventStage) => (
                <option key={eventStage}>{eventStage}</option>
              ))}
            </FilterPill>
          )}

          {showSet && (
            <FilterPill
              label="Set"
              display={selectedSetLabel}
              value={selected.setKey}
              active={selected.setKey !== "All"}
              onChange={(value) => onUpdateFilters({ set: value })}
            >
              <option value="All">All</option>
              {options.set.map((setOption) => (
                <option key={setOption.key} value={setOption.key}>
                  {setOption.label}
                </option>
              ))}
            </FilterPill>
          )}

          {showGame && (
            <FilterPill
              label="Game"
              display={
                selected.gameNumber === "All"
                  ? "All"
                  : `Game ${selected.gameNumber}`
              }
              value={selected.gameNumber}
              active={selected.gameNumber !== "All"}
              onChange={(value) => onUpdateFilters({ game: value })}
            >
              <option value="All">All</option>
              {options.game.map((gameNumber) => (
                <option key={gameNumber} value={String(gameNumber)}>
                  Game {gameNumber}
                </option>
              ))}
            </FilterPill>
          )}

          {showLane && (
            <FilterPill
              label="Lane / Pair"
              display={selected.lane}
              value={selected.lane}
              active={selected.lane !== "All"}
              onChange={(value) => onUpdateFilters({ lane: value })}
            >
              <option>All</option>
              {options.lane.map((lane) => (
                <option key={lane}>{lane}</option>
              ))}
            </FilterPill>
          )}
        </div>
      )}
    </section>
  );
}
