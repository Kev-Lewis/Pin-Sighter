// =============================================================================
// Stats filtering — the pure, testable core of the Stats screen.
//
// Extracted from StatsPage so the filter model, the cascade, the parent/child
// + stale-selection reset rules, and section visibility can be unit-tested in
// isolation (see statsFilters.test.ts) and reasoned about without touching the
// UI. StatsPage becomes a thin view over these functions.
//
// Design (see docs/stats-filtering-redesign.md):
//   - Scope is explicit: `mode` (all | individual | baker) + `selection`,
//     instead of the old `"Baker Team: A, B, C"` string-prefix hack.
//   - Baker games are NEVER silently excluded — the universe follows `mode`.
//   - One uniform cascade: a filter's options are the distinct values present
//     in the games matching every *other* active filter.
//   - A Time Frame filter (presets + custom range), anchored on the game's own
//     logged/played date (`createdAt ?? savedAt`).
//
// `now` is injected into every date-sensitive function (never Date.now()) so
// the module is deterministic and safe to unit-test.
//
// The SavedGameRecord type is imported type-only from App.tsx — erased at
// compile time, so this module has no runtime dependency on App.
// =============================================================================

import type { SavedGameRecord } from "../App";

// --- Filter model ------------------------------------------------------------

/** Which universe of games + how the scope is chosen within it. */
export type ScopeMode = "all" | "individual" | "baker";

export type TimeFramePreset =
  | "all"
  | "thisWeek"
  | "thisMonth"
  | "thisYear"
  | "last7"
  | "last30"
  | "last90"
  | "custom";

export type TimeFrame = {
  preset: TimeFramePreset;
  /** Custom-range lower bound, "YYYY-MM-DD" (inclusive). Only used when preset === "custom". */
  from: string | null;
  /** Custom-range upper bound, "YYYY-MM-DD" (inclusive). Only used when preset === "custom". */
  to: string | null;
};

export type StatsFilters = {
  /** all = every non-Baker game (individual universe, aggregate);
   *  individual = non-Baker games for one bowler (`selection`);
   *  baker = Baker games (all teams if selection === "All", else one team). */
  mode: ScopeMode;
  /** Bowler name (individual) or Baker-team label (baker). "All" = no specific pick. */
  selection: string;
  /** Baker drill-in: one team member. "All" = whole team. Only meaningful in baker mode. */
  bakerBowler: string;
  ball: string;
  competition: string;
  eventName: string;
  eventStage: string;
  center: string;
  lane: string;
  pattern: string;
  /** A saved set's sessionId. */
  set: string;
  /** A game number, as a string. */
  game: string;
  timeFrame: TimeFrame;
};

/** The discrete, option-backed filters (everything except mode + timeFrame). */
export type FilterKey =
  | "selection"
  | "bakerBowler"
  | "ball"
  | "competition"
  | "eventName"
  | "eventStage"
  | "center"
  | "lane"
  | "pattern"
  | "set"
  | "game";

export type FilterOptions = Record<FilterKey, string[]>;
export type FilterAvailability = Record<FilterKey, boolean>;

export type SectionVisibility = {
  overview: boolean;
  bowlerBreakdown: boolean;
  detailedAnalysis: boolean;
  teamSet: boolean;
  spareLeaves: boolean;
  targeting: boolean;
  bakerTeam: boolean;
};

export type ResolveResult = {
  filters: StatsFilters;
  /** Filters whose non-"All" value was auto-reset to "All" by this resolve. */
  cleared: FilterKey[];
};

export const DISCRETE_FILTER_KEYS: FilterKey[] = [
  "selection",
  "bakerBowler",
  "ball",
  "competition",
  "eventName",
  "eventStage",
  "center",
  "lane",
  "pattern",
  "set",
  "game",
];

export const defaultTimeFrame: TimeFrame = {
  preset: "all",
  from: null,
  to: null,
};

export const defaultStatsFilters: StatsFilters = {
  mode: "all",
  selection: "All",
  bakerBowler: "All",
  ball: "All",
  competition: "All",
  eventName: "All",
  eventStage: "All",
  center: "All",
  lane: "All",
  pattern: "All",
  set: "All",
  game: "All",
  timeFrame: { ...defaultTimeFrame },
};

// --- Small shared helpers ----------------------------------------------------

/** The one canonical Baker-team encoder (dedup + sort → stable label). */
export function bakerTeamLabelFromNames(names: string[]): string {
  const sortedNames = Array.from(new Set(names)).sort((a, b) =>
    a.localeCompare(b)
  );

  return `Baker Team: ${sortedNames.join(", ")}`;
}

/** A game's Baker-team label, or "" for non-Baker games. */
export function bakerTeamLabelForGame(game: SavedGameRecord): string {
  return game.format === "Baker" ? bakerTeamLabelFromNames(game.bowlerNames) : "";
}

/** The date a game is filed under: when it was logged/played. */
export function gameDate(game: SavedGameRecord): string {
  return game.createdAt ?? game.savedAt;
}

export function isEventCompetition(filters: StatsFilters): boolean {
  return filters.competition === "League" || filters.competition === "Tournament";
}

export function usesSetFilter(filters: StatsFilters): boolean {
  return (
    (isEventCompetition(filters) && filters.eventName !== "All") ||
    filters.competition === "Open"
  );
}

/**
 * The entries of a game that belong to the current scope — used both for the
 * ball match and by the UI for per-person stats.
 *   - baker + a drilled-in member → just that member's entries
 *   - individual + a chosen bowler → just that bowler's entries
 *   - otherwise → all entries
 */
export function scopedEntries(
  game: SavedGameRecord,
  filters: StatsFilters
): SavedGameRecord["entries"] {
  if (filters.mode === "baker") {
    if (filters.bakerBowler !== "All") {
      return game.entries.filter((entry) => entry.bowlerName === filters.bakerBowler);
    }
    return game.entries;
  }

  if (filters.mode === "individual" && filters.selection !== "All") {
    return game.entries.filter((entry) => entry.bowlerName === filters.selection);
  }

  return game.entries;
}

// --- Time frame --------------------------------------------------------------

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Half-open [start, end) instant range for a time frame, or null bounds for "all time". */
export function timeFrameRange(
  timeFrame: TimeFrame,
  now: Date
): { start: Date | null; end: Date | null } {
  const rolling = (days: number) => {
    const start = startOfDay(now);
    start.setDate(start.getDate() - (days - 1));
    const end = startOfDay(now);
    end.setDate(end.getDate() + 1);
    return { start, end };
  };

  switch (timeFrame.preset) {
    case "all":
      return { start: null, end: null };
    case "thisWeek": {
      const start = startOfDay(now);
      start.setDate(start.getDate() - now.getDay()); // week starts Sunday
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      return { start, end };
    }
    case "thisMonth":
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: new Date(now.getFullYear(), now.getMonth() + 1, 1),
      };
    case "thisYear":
      return {
        start: new Date(now.getFullYear(), 0, 1),
        end: new Date(now.getFullYear() + 1, 0, 1),
      };
    case "last7":
      return rolling(7);
    case "last30":
      return rolling(30);
    case "last90":
      return rolling(90);
    case "custom": {
      const start = timeFrame.from
        ? new Date(`${timeFrame.from}T00:00:00`)
        : null;
      let end: Date | null = null;
      if (timeFrame.to) {
        end = new Date(`${timeFrame.to}T00:00:00`);
        end.setDate(end.getDate() + 1); // make the "to" day inclusive
      }
      return { start, end };
    }
    default:
      return { start: null, end: null };
  }
}

export function inTimeFrame(
  game: SavedGameRecord,
  timeFrame: TimeFrame,
  now: Date
): boolean {
  const { start, end } = timeFrameRange(timeFrame, now);
  if (!start && !end) {
    return true;
  }

  const time = new Date(gameDate(game)).getTime();
  if (Number.isNaN(time)) {
    return true; // never drop a game just because its date won't parse
  }

  if (start && time < start.getTime()) {
    return false;
  }
  if (end && time >= end.getTime()) {
    return false;
  }
  return true;
}

// --- The single source of truth: what's in scope -----------------------------

export function filterGames(
  games: SavedGameRecord[],
  filters: StatsFilters,
  now: Date
): SavedGameRecord[] {
  return games.filter((game) => {
    const isBaker = game.format === "Baker";

    // Universe + scope.
    if (filters.mode === "baker") {
      if (!isBaker) {
        return false;
      }
      if (
        filters.selection !== "All" &&
        bakerTeamLabelForGame(game) !== filters.selection
      ) {
        return false;
      }
      if (
        filters.bakerBowler !== "All" &&
        !game.entries.some((entry) => entry.bowlerName === filters.bakerBowler)
      ) {
        return false;
      }
    } else {
      if (isBaker) {
        return false;
      }
      if (
        filters.mode === "individual" &&
        filters.selection !== "All" &&
        !game.entries.some((entry) => entry.bowlerName === filters.selection)
      ) {
        return false;
      }
    }

    // Ball — entry-level, scoped to the chosen bowler/member.
    if (
      filters.ball !== "All" &&
      !scopedEntries(game, filters).some((entry) => entry.ballUsed === filters.ball)
    ) {
      return false;
    }

    // Game-level equality filters.
    if (filters.competition !== "All" && game.competitionType !== filters.competition) {
      return false;
    }
    if (filters.eventName !== "All" && game.eventName !== filters.eventName) {
      return false;
    }
    if (filters.eventStage !== "All" && game.eventStageLabel !== filters.eventStage) {
      return false;
    }
    if (filters.center !== "All" && game.centerName !== filters.center) {
      return false;
    }
    if (filters.lane !== "All" && game.laneLabel !== filters.lane) {
      return false;
    }
    if (filters.pattern !== "All" && game.patternName !== filters.pattern) {
      return false;
    }
    if (filters.set !== "All" && game.sessionId !== filters.set) {
      return false;
    }
    if (filters.game !== "All" && String(game.gameNumber) !== filters.game) {
      return false;
    }

    // Time frame.
    if (!inTimeFrame(game, filters.timeFrame, now)) {
      return false;
    }

    return true;
  });
}

// --- Uniform cascade: options per filter -------------------------------------

// When listing a filter's options we neutralize that filter AND its dependent
// children (so, e.g., listing centers ignores the chosen lane) — this mirrors
// the original per-dropdown ignore-lists, now expressed once.
const NEUTRALIZE: Record<FilterKey, FilterKey[]> = {
  selection: ["selection", "bakerBowler", "ball"],
  bakerBowler: ["bakerBowler", "ball"],
  ball: ["ball"],
  competition: ["competition"],
  eventName: ["eventName", "eventStage"],
  eventStage: ["eventStage"],
  center: ["center", "lane"],
  lane: ["lane"],
  pattern: ["pattern"],
  set: ["set", "game"],
  game: ["game"],
};

function neutralized(filters: StatsFilters, keys: FilterKey[]): StatsFilters {
  const next: StatsFilters = { ...filters };
  for (const key of keys) {
    next[key] = "All";
  }
  return next;
}

function sortAlpha(values: string[]): string[] {
  return values.sort((a, b) => a.localeCompare(b));
}

function sortNumeric(values: string[]): string[] {
  return values.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function distinct(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function optionsForKey(
  key: FilterKey,
  games: SavedGameRecord[],
  filters: StatsFilters,
  now: Date
): string[] {
  const base = filterGames(games, neutralized(filters, NEUTRALIZE[key]), now);

  switch (key) {
    case "selection":
      if (filters.mode === "baker") {
        return sortAlpha(distinct(base.map(bakerTeamLabelForGame)));
      }
      return sortAlpha(
        distinct(base.flatMap((game) => game.entries.map((entry) => entry.bowlerName)))
      );
    case "bakerBowler":
      return sortAlpha(distinct(base.flatMap((game) => game.bowlerNames)));
    case "ball":
      return sortAlpha(
        distinct(
          base.flatMap((game) =>
            scopedEntries(game, filters).map((entry) => entry.ballUsed)
          )
        )
      );
    case "competition":
      return sortAlpha(distinct(base.map((game) => game.competitionType)));
    case "eventName":
      return sortAlpha(distinct(base.map((game) => game.eventName)));
    case "eventStage":
      return sortNumeric(distinct(base.map((game) => game.eventStageLabel)));
    case "center":
      return sortAlpha(distinct(base.map((game) => game.centerName)));
    case "lane":
      return sortNumeric(distinct(base.map((game) => game.laneLabel)));
    case "pattern":
      return sortAlpha(distinct(base.map((game) => game.patternName)));
    case "set":
      return distinct(base.map((game) => game.sessionId));
    case "game":
      return sortNumeric(distinct(base.map((game) => String(game.gameNumber))));
    default:
      return [];
  }
}

export function deriveOptions(
  games: SavedGameRecord[],
  filters: StatsFilters,
  now: Date
): FilterOptions {
  const options = {} as FilterOptions;
  for (const key of DISCRETE_FILTER_KEYS) {
    options[key] = optionsForKey(key, games, filters, now);
  }
  return options;
}

// --- Which filter controls are usable given current parents ------------------

export function filterAvailability(filters: StatsFilters): FilterAvailability {
  const eventOn = isEventCompetition(filters);
  return {
    selection: filters.mode !== "all",
    bakerBowler: filters.mode === "baker" && filters.selection !== "All",
    ball: true,
    competition: true,
    eventName: eventOn,
    eventStage: eventOn && filters.eventName !== "All",
    center: true,
    lane: filters.center !== "All",
    pattern: true,
    set: usesSetFilter(filters),
    game: filters.set !== "All",
  };
}

// --- Normalize: parent/child rules + stale-selection auto-reset --------------

export function resolveFilters(
  filters: StatsFilters,
  options: FilterOptions
): ResolveResult {
  let next: StatsFilters = { ...filters };
  const cleared = new Set<FilterKey>();

  const forceAll = (key: FilterKey) => {
    if (next[key] !== "All") {
      next = { ...next, [key]: "All" };
      cleared.add(key);
    }
  };

  // Fixpoint: a parent reset can make a child unreachable, which resets it too.
  let changed = true;
  let guard = 0;
  while (changed && guard < 12) {
    guard += 1;
    const before = JSON.stringify(next);

    // Structural parent → child rules (disabled control ⇒ value forced to All).
    if (next.mode === "all") {
      forceAll("selection");
    }
    if (!(next.mode === "baker" && next.selection !== "All")) {
      forceAll("bakerBowler");
    }
    if (!isEventCompetition(next)) {
      forceAll("eventName");
    }
    if (!(isEventCompetition(next) && next.eventName !== "All")) {
      forceAll("eventStage");
    }
    if (next.center === "All") {
      forceAll("lane");
    }
    if (!usesSetFilter(next)) {
      forceAll("set");
    }
    if (next.set === "All") {
      forceAll("game");
    }

    // Stale-selection reset: a value no longer present in its option list.
    for (const key of DISCRETE_FILTER_KEYS) {
      const value = next[key];
      if (value !== "All" && options[key] && !options[key].includes(value)) {
        forceAll(key);
      }
    }

    changed = JSON.stringify(next) !== before;
  }

  return { filters: next, cleared: Array.from(cleared) };
}

// --- Which display sections render, from scope alone -------------------------

export function visibleSections(filters: StatsFilters): SectionVisibility {
  return {
    overview: true,
    bowlerBreakdown: filters.mode !== "baker",
    detailedAnalysis: filters.mode === "individual" && filters.selection !== "All",
    teamSet:
      filters.mode === "all" ||
      (filters.mode === "baker" && filters.bakerBowler === "All"),
    spareLeaves: true,
    targeting: filters.mode !== "baker",
    bakerTeam: filters.mode === "baker",
  };
}
