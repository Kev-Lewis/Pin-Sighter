import { describe, it, expect } from "vitest";
import type { SavedGameRecord } from "../App";
import {
  defaultStatsFilters,
  filterGames,
  deriveOptions,
  resolveFilters,
  visibleSections,
  filterAvailability,
  bakerTeamLabelFromNames,
  gameDate,
  inTimeFrame,
  scopedEntries,
  type StatsFilters,
  type TimeFrame,
} from "./statsFilters";

// --- fixtures ----------------------------------------------------------------

function entry(bowlerName: string, ballUsed: string) {
  return {
    frameNumber: 1,
    bowlerName,
    ballUsed,
    footBoard: "",
    targetArrow: "",
    targetBreakpoint: "",
    actualArrow: "",
    actualBreakpoint: "",
    firstShotKnockedPins: [],
    secondShotKnockedPins: [],
    thirdShotKnockedPins: [],
    isComplete: true,
  };
}

let gameCounter = 0;

function mkGame(overrides: Partial<SavedGameRecord>): SavedGameRecord {
  gameCounter += 1;
  const base: SavedGameRecord = {
    id: `g${gameCounter}`,
    sessionId: "s1",
    savedAt: "2026-07-10T12:00:00.000Z",
    competitionType: "Open",
    format: "Singles",
    bowlersPerTeam: 1,
    centerName: "Sunset Lanes",
    patternName: "House",
    eventLogKey: "",
    eventId: null,
    eventName: "",
    eventStageLabel: "",
    gameNumber: 1,
    laneLabel: "1",
    bowlerNames: ["Kevin"],
    scores: [],
    entries: [entry("Kevin", "Phaze II")],
  };
  return { ...base, ...overrides };
}

const NOW = new Date(2026, 6, 15); // Wed Jul 15 2026, local time

function filters(overrides: Partial<StatsFilters> = {}): StatsFilters {
  return { ...defaultStatsFilters, ...overrides };
}

const ids = (games: SavedGameRecord[]) => games.map((g) => g.id).sort();

// --- bakerTeamLabelFromNames + gameDate --------------------------------------

describe("bakerTeamLabelFromNames", () => {
  it("dedupes and sorts names into a stable label", () => {
    expect(bakerTeamLabelFromNames(["Cara", "Al", "Bo", "Al"])).toBe(
      "Baker Team: Al, Bo, Cara"
    );
  });
  it("is order-independent", () => {
    expect(bakerTeamLabelFromNames(["Bo", "Al"])).toBe(
      bakerTeamLabelFromNames(["Al", "Bo"])
    );
  });
});

describe("gameDate", () => {
  it("prefers createdAt, falls back to savedAt", () => {
    expect(gameDate(mkGame({ createdAt: "2026-01-01T00:00:00.000Z", savedAt: "2026-02-02T00:00:00.000Z" }))).toBe(
      "2026-01-01T00:00:00.000Z"
    );
    expect(gameDate(mkGame({ createdAt: undefined, savedAt: "2026-02-02T00:00:00.000Z" }))).toBe(
      "2026-02-02T00:00:00.000Z"
    );
  });
});

// --- filterGames: universe + scope -------------------------------------------

describe("filterGames — universe & scope", () => {
  const kevinSingles = mkGame({ id: "ks", format: "Singles", bowlerNames: ["Kevin"], entries: [entry("Kevin", "Phaze II")] });
  const amySingles = mkGame({ id: "as", format: "Singles", bowlerNames: ["Amy"], entries: [entry("Amy", "Zen")] });
  const bakerABC = mkGame({ id: "b1", format: "Baker", bowlerNames: ["Al", "Bo", "Cara"], entries: [entry("Al", "IQ"), entry("Bo", "Zen")] });
  const bakerXYZ = mkGame({ id: "b2", format: "Baker", bowlerNames: ["Xi", "Yu"], entries: [entry("Xi", "IQ"), entry("Yu", "Rhino")] });
  const games = [kevinSingles, amySingles, bakerABC, bakerXYZ];

  it("mode 'all' includes every non-Baker game and excludes Baker games", () => {
    expect(ids(filterGames(games, filters({ mode: "all" }), NOW))).toEqual(["as", "ks"]);
  });

  it("mode 'individual' scopes to one bowler's non-Baker games", () => {
    expect(ids(filterGames(games, filters({ mode: "individual", selection: "Kevin" }), NOW))).toEqual(["ks"]);
  });

  it("mode 'baker' with selection 'All' includes every Baker game (never silently excluded)", () => {
    expect(ids(filterGames(games, filters({ mode: "baker" }), NOW))).toEqual(["b1", "b2"]);
  });

  it("mode 'baker' with a team label scopes to that team", () => {
    const team = bakerTeamLabelFromNames(["Al", "Bo", "Cara"]);
    expect(ids(filterGames(games, filters({ mode: "baker", selection: team }), NOW))).toEqual(["b1"]);
  });

  it("mode 'baker' with a drilled-in member keeps only games that member bowled", () => {
    const team = bakerTeamLabelFromNames(["Al", "Bo", "Cara"]);
    // Cara is on the roster (bowlerNames) but has no entry in b1 → excluded by drill-in
    expect(ids(filterGames(games, filters({ mode: "baker", selection: team, bakerBowler: "Bo" }), NOW))).toEqual(["b1"]);
    expect(ids(filterGames(games, filters({ mode: "baker", selection: team, bakerBowler: "Cara" }), NOW))).toEqual([]);
  });

  it("is order-independent", () => {
    const forward = ids(filterGames(games, filters({ mode: "all" }), NOW));
    const reversed = ids(filterGames([...games].reverse(), filters({ mode: "all" }), NOW));
    expect(reversed).toEqual(forward);
  });
});

// --- filterGames: ball (entry-level, scoped) ---------------------------------

describe("filterGames — ball is entry-level and scope-aware", () => {
  const g = mkGame({ id: "g", format: "Singles", bowlerNames: ["Kevin", "Amy"], entries: [entry("Kevin", "Phaze II"), entry("Amy", "Zen")] });

  it("matches when any scoped entry used the ball (mode all)", () => {
    expect(ids(filterGames([g], filters({ ball: "Zen" }), NOW))).toEqual(["g"]);
  });

  it("respects the individual scope: ball must belong to the selected bowler", () => {
    expect(ids(filterGames([g], filters({ mode: "individual", selection: "Kevin", ball: "Zen" }), NOW))).toEqual([]);
    expect(ids(filterGames([g], filters({ mode: "individual", selection: "Kevin", ball: "Phaze II" }), NOW))).toEqual(["g"]);
  });

  it("scopedEntries narrows to the drilled-in Baker member", () => {
    const b = mkGame({ format: "Baker", bowlerNames: ["Al", "Bo"], entries: [entry("Al", "IQ"), entry("Bo", "Zen")] });
    expect(scopedEntries(b, filters({ mode: "baker", selection: "x", bakerBowler: "Bo" })).map((e) => e.ballUsed)).toEqual(["Zen"]);
  });
});

// --- filterGames: game-level equality + time frame ---------------------------

describe("filterGames — equality filters", () => {
  const a = mkGame({ id: "a", centerName: "Sunset Lanes", laneLabel: "3", patternName: "Wolf", competitionType: "League", eventName: "Tues Night", eventStageLabel: "Week 1", sessionId: "sA", gameNumber: 2 });
  const b = mkGame({ id: "b", centerName: "Bowlero", laneLabel: "7", patternName: "House", competitionType: "Open", sessionId: "sB", gameNumber: 1 });
  const games = [a, b];

  it("center", () => expect(ids(filterGames(games, filters({ center: "Bowlero" }), NOW))).toEqual(["b"]));
  it("lane", () => expect(ids(filterGames(games, filters({ lane: "3" }), NOW))).toEqual(["a"]));
  it("pattern", () => expect(ids(filterGames(games, filters({ pattern: "Wolf" }), NOW))).toEqual(["a"]));
  it("competition", () => expect(ids(filterGames(games, filters({ competition: "Open" }), NOW))).toEqual(["b"]));
  it("set (sessionId)", () => expect(ids(filterGames(games, filters({ set: "sA" }), NOW))).toEqual(["a"]));
  it("game number (as string)", () => expect(ids(filterGames(games, filters({ game: "2" }), NOW))).toEqual(["a"]));
  it("eventStage", () => expect(ids(filterGames(games, filters({ eventStage: "Week 1" }), NOW))).toEqual(["a"]));
});

describe("filterGames — time frame", () => {
  const jul10 = mkGame({ id: "jul10", savedAt: "2026-07-10T12:00:00.000Z" });
  const jun20 = mkGame({ id: "jun20", savedAt: "2026-06-20T12:00:00.000Z" });
  const jan05 = mkGame({ id: "jan05", savedAt: "2026-01-05T12:00:00.000Z" });
  const games = [jul10, jun20, jan05];

  it("'all' includes everything", () => {
    expect(ids(filterGames(games, filters(), NOW))).toEqual(["jan05", "jul10", "jun20"]);
  });
  it("'thisMonth' keeps only July 2026 games", () => {
    expect(ids(filterGames(games, filters({ timeFrame: { preset: "thisMonth", from: null, to: null } }), NOW))).toEqual(["jul10"]);
  });
  it("'thisYear' keeps all 2026 games", () => {
    expect(ids(filterGames(games, filters({ timeFrame: { preset: "thisYear", from: null, to: null } }), NOW))).toEqual(["jan05", "jul10", "jun20"]);
  });
  it("'last7' (now = Jul 15) keeps Jul 10, drops Jun 20", () => {
    expect(ids(filterGames(games, filters({ timeFrame: { preset: "last7", from: null, to: null } }), NOW))).toEqual(["jul10"]);
  });
  it("'last30' keeps Jul 10 and Jun 20", () => {
    expect(ids(filterGames(games, filters({ timeFrame: { preset: "last30", from: null, to: null } }), NOW))).toEqual(["jul10", "jun20"]);
  });
  it("custom range is inclusive of both endpoints' days", () => {
    const tf: TimeFrame = { preset: "custom", from: "2026-06-01", to: "2026-06-30" };
    expect(ids(filterGames(games, filters({ timeFrame: tf }), NOW))).toEqual(["jun20"]);
  });
  it("inTimeFrame keeps games with unparseable dates rather than dropping them", () => {
    const bad = mkGame({ savedAt: "not-a-date", createdAt: undefined });
    expect(inTimeFrame(bad, { preset: "thisMonth", from: null, to: null }, NOW)).toBe(true);
  });
});

// --- deriveOptions: uniform cascade ------------------------------------------

describe("deriveOptions — uniform cascade", () => {
  const g1 = mkGame({ id: "g1", centerName: "Sunset Lanes", laneLabel: "3", patternName: "Wolf" });
  const g2 = mkGame({ id: "g2", centerName: "Sunset Lanes", laneLabel: "5", patternName: "House" });
  const g3 = mkGame({ id: "g3", centerName: "Bowlero", laneLabel: "7", patternName: "House" });
  const games = [g1, g2, g3];

  it("lists all centers when nothing narrows them", () => {
    expect(deriveOptions(games, filters(), NOW).center).toEqual(["Bowlero", "Sunset Lanes"]);
  });

  it("narrows pattern options to the games matching the active center", () => {
    expect(deriveOptions(games, filters({ center: "Sunset Lanes" }), NOW).pattern).toEqual(["House", "Wolf"]);
    expect(deriveOptions(games, filters({ center: "Bowlero" }), NOW).pattern).toEqual(["House"]);
  });

  it("center options ignore the chosen lane (self + child neutralized)", () => {
    // lane 3 exists only at Sunset; without neutralizing lane, Bowlero would vanish
    expect(deriveOptions(games, filters({ lane: "3" }), NOW).center).toEqual(["Bowlero", "Sunset Lanes"]);
  });

  it("selection options are bowler names in individual universe, team labels in baker", () => {
    const teamGame = mkGame({ format: "Baker", bowlerNames: ["Al", "Bo"], entries: [entry("Al", "IQ")] });
    const soloGame = mkGame({ format: "Singles", bowlerNames: ["Kevin"], entries: [entry("Kevin", "Phaze II")] });
    const mixed = [teamGame, soloGame];
    expect(deriveOptions(mixed, filters({ mode: "individual" }), NOW).selection).toEqual(["Kevin"]);
    expect(deriveOptions(mixed, filters({ mode: "baker" }), NOW).selection).toEqual([bakerTeamLabelFromNames(["Al", "Bo"])]);
  });
});

// --- resolveFilters: parent/child + stale reset ------------------------------

describe("resolveFilters — parent/child rules", () => {
  const anyOptions = () => deriveOptions([], defaultStatsFilters, NOW);

  it("mode 'all' clears a lingering selection", () => {
    const { filters: out, cleared } = resolveFilters(filters({ mode: "all", selection: "Kevin" }), anyOptions());
    expect(out.selection).toBe("All");
    expect(cleared).toContain("selection");
  });

  it("non-event competition clears eventName and eventStage", () => {
    const { filters: out, cleared } = resolveFilters(
      filters({ competition: "Open", eventName: "Tues Night", eventStage: "Week 1" }),
      anyOptions()
    );
    expect(out.eventName).toBe("All");
    expect(out.eventStage).toBe("All");
    expect(cleared).toEqual(expect.arrayContaining(["eventName", "eventStage"]));
  });

  it("center = All clears lane; set = All clears game", () => {
    const { filters: out } = resolveFilters(filters({ center: "All", lane: "5", set: "All", game: "2" }), anyOptions());
    expect(out.lane).toBe("All");
    expect(out.game).toBe("All");
  });

  it("baker drill-in is cleared unless a specific team is selected", () => {
    const { filters: out } = resolveFilters(filters({ mode: "baker", selection: "All", bakerBowler: "Bo" }), anyOptions());
    expect(out.bakerBowler).toBe("All");
  });
});

describe("resolveFilters — stale-selection reset", () => {
  const g = mkGame({ id: "g", centerName: "Sunset Lanes", laneLabel: "3", patternName: "Wolf" });
  const games = [g];

  it("resets a value that is no longer reachable and reports it", () => {
    const current = filters({ pattern: "Nonexistent" });
    const options = deriveOptions(games, current, NOW);
    const { filters: out, cleared } = resolveFilters(current, options);
    expect(out.pattern).toBe("All");
    expect(cleared).toContain("pattern");
  });

  it("keeps a value that is still reachable", () => {
    const current = filters({ pattern: "Wolf" });
    const options = deriveOptions(games, current, NOW);
    const { filters: out, cleared } = resolveFilters(current, options);
    expect(out.pattern).toBe("Wolf");
    expect(cleared).not.toContain("pattern");
  });

  it("a stale parent cascades to reset its child", () => {
    // center chosen but not in options → resets, which forces lane to All too
    const current = filters({ center: "Closed Center", lane: "9" });
    const options = deriveOptions(games, current, NOW);
    const { filters: out, cleared } = resolveFilters(current, options);
    expect(out.center).toBe("All");
    expect(out.lane).toBe("All");
    expect(cleared).toContain("center");
  });
});

// --- visibleSections + availability ------------------------------------------

describe("visibleSections", () => {
  it("aggregate (mode all): breakdown + targeting on, detailed off, no baker", () => {
    const v = visibleSections(filters({ mode: "all" }));
    expect(v).toMatchObject({ overview: true, bowlerBreakdown: true, targeting: true, detailedAnalysis: false, bakerTeam: false, teamSet: true });
  });
  it("single individual: detailed analysis unlocks", () => {
    expect(visibleSections(filters({ mode: "individual", selection: "Kevin" })).detailedAnalysis).toBe(true);
  });
  it("individual with no pick keeps detailed analysis gated", () => {
    expect(visibleSections(filters({ mode: "individual", selection: "All" })).detailedAnalysis).toBe(false);
  });
  it("baker mode: baker section on, bowler breakdown + targeting off", () => {
    const v = visibleSections(filters({ mode: "baker", selection: "t" }));
    expect(v).toMatchObject({ bakerTeam: true, bowlerBreakdown: false, targeting: false });
  });
});

describe("filterAvailability", () => {
  it("event fields disabled unless competition is League/Tournament", () => {
    expect(filterAvailability(filters({ competition: "Open" })).eventName).toBe(false);
    expect(filterAvailability(filters({ competition: "League" })).eventName).toBe(true);
  });
  it("eventStage needs an event name; lane needs a center; game needs a set", () => {
    expect(filterAvailability(filters({ competition: "League", eventName: "All" })).eventStage).toBe(false);
    expect(filterAvailability(filters({ competition: "League", eventName: "Tues" })).eventStage).toBe(true);
    expect(filterAvailability(filters({ center: "All" })).lane).toBe(false);
    expect(filterAvailability(filters({ center: "Sunset Lanes" })).lane).toBe(true);
    expect(filterAvailability(filters({ set: "All" })).game).toBe(false);
    expect(filterAvailability(filters({ set: "s1" })).game).toBe(true);
  });
  it("baker drill-in available only with a specific team", () => {
    expect(filterAvailability(filters({ mode: "baker", selection: "All" })).bakerBowler).toBe(false);
    expect(filterAvailability(filters({ mode: "baker", selection: "t" })).bakerBowler).toBe(true);
  });
});
