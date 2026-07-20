# StatsPage decomposition plan

Status: **Proposed** (planning only — no code yet)
Author: drafted with Claude, 2026-07-13
Scope: split `StatsPage` and its helper ecosystem out of `src/App.tsx` into
`src/stats/*` modules + `src/pages/StatsPage.tsx`, without changing behavior or
output.

---

## 1. Why this is its own project

Every other page lifted this session (About, Home, Data, Centers, Patterns,
Events, Bowlers) was a near-verbatim move: the component and its helpers were
self-contained, so each was a single low-risk commit. **StatsPage is not that.**

- The component is **~3,790 lines** (`function StatsPage` at ~3442 → ~7229).
- Its helper ecosystem is another **~3,500 lines** of module-level functions,
  card builders, and editor sub-components living *after* the component
  (lines ~7232 → 10745).
- The export subsystem (~1,340 lines) is written as **local closures over
  derived render data**, so it cannot be moved without first threading that
  data through parameters (or a selector hook).

So this is a **sequenced, multi-commit refactor**, not a lift. The good news:
the whole cluster is **StatsPage-family-only** — a full-file scan confirms the
scoring flow (`LogGamesPage`/`GameEntryPage`) and the CRUD pages do **not** use
any of the stat classifiers or calculators. The only helper worth sharing more
widely is the strike/spare frame classifier (HomePage currently re-implements it
inline).

The filter engine is already extracted (`lib/statsFilters.ts`), and session /
series logic already lives in `lib/sessions.ts`. StatsPage mostly *orchestrates*
those. That's the seam we widen.

---

## 2. Target structure

New directory `src/stats/` for stats-only logic (keeps `lib/` for genuinely
cross-cutting modules; promote to `lib/` only what other features consume).

```
src/
├─ pages/
│  └─ StatsPage.tsx           # the shell: state, filter bar, JSX layout, section wiring (~1.5k lines)
├─ stats/
│  ├─ frames.ts               # frame classifiers + pocket/handedness (pure)
│  ├─ spareLeaves.ts          # spare-leave keying + summary/rows
│  ├─ distribution.ts         # score/series distribution + averages
│  ├─ board.ts                # board/targeting core + card builders
│  ├─ detailed.ts             # calculateDetailedBowlerStats + buildDetailedStatCards + formatters
│  ├─ overview.ts             # getHighGameDetail + buildOverviewStatCards
│  ├─ setStats.ts             # set score rows / card builders / team-set rows / set filter options
│  ├─ baker.ts                # baker summary/position/bowler row calculators
│  ├─ types.ts                # stats-local result types (see §5)
│  ├─ export/
│  │  ├─ format.ts            # file-name, csv/html escaping, section presets/toggles
│  │  ├─ rows.ts              # the ~20 get*ExportRows builders (data-in, rows-out)
│  │  ├─ html.ts              # buildStatsReportHtml + STATS_REPORT_CSS
│  │  └─ run.ts               # runStatsExport (csv / xlsx-lazy / html / pdf)
│  └─ components/
│     ├─ SavedFrameEditModal.tsx
│     ├─ SavedSetMetadataEditor.tsx
│     ├─ SavedGameNotesEditor.tsx
│     ├─ SetSpecificStats.tsx
│     ├─ BakerStatsSection.tsx
│     ├─ BakerSetBreakdown.tsx
│     └─ BakerFrameTable.tsx
└─ lib/
   └─ (existing) + possibly frames strike/spare promoted here if HomePage reuses
```

Note: `src/stats/*` may import from `src/lib/*` and `src/types`, never from
`App.tsx` or `src/pages/*`. That directionality is the whole point.

---

## 3. Sequencing — smallest / lowest-risk first

Each numbered step is **one commit**, verified with
`npm run build && npm run test:run && npm run test:e2e` before the next. The
component keeps working after every step because we only relocate module-level
pure functions and re-import them; the JSX doesn't change until the very end.

**Phase 1 — pure calculators (low risk, no state coupling).** These are pure
functions of `FrameEntry[]` / `SavedGameRecord[]`; move them and import back.

1. `stats/frames.ts` — classifiers + pocket/handedness (~250 lines, lines
   ~9198–9448). While here, **promote `isStrikeEntry` + `isSpareEntry` to a
   shared spot** and replace HomePage's inline `firstShotKnockedPins.length === 10`
   with the imported helper (removes the "classifies the same way StatsPage does"
   comment/duplication).
2. `stats/spareLeaves.ts` — `getSpareLeavePins/Key`, `calculateSpareLeaveSummary/Rows`
   (~120 lines, currently interleaved at ~9252–9370).
3. `stats/distribution.ts` — score/series bins, averages, distribution (~278).
4. `stats/board.ts` — board core (~190) + board card builders (~177).
5. `stats/overview.ts` — `getHighGameDetail` + `buildOverviewStatCards` (~84).
6. `stats/detailed.ts` — `calculateDetailedBowlerStats` + formatters (~248).
7. `stats/setStats.ts` — set summary + card builders + `calculateTeamSetRows`
   + `buildSetFilterOptions` + `formatSetSavedDateTime` (~348).
8. `stats/baker.ts` — baker calculators (~250; leave the Baker *components* for
   Phase 3).
9. `stats/detailed.ts` orchestrator — `buildDetailedStatCards` (~246) once its
   dependencies (board/set/targeting cards) are in place.

Each of these carries the **result types it needs** into `stats/types.ts`
(see §5). After Phase 1, ~2,400 lines of pure logic are out and StatsPage still
lives in App.tsx, importing from `src/stats/*`.

**Phase 2 — types module.** Move the stats-local result types to
`stats/types.ts` (some will already have moved with their cluster; consolidate).
See §5 for the list and ownership.

**Phase 3 — self-contained sub-components.** These are real components with their
own props; they render inside StatsPage but don't close over its state.

10. `stats/components/SavedFrameEditModal.tsx` (~480 lines; deps: lib/scoring
    marks, `BoardSelect`/`PinDeck`, focus-trap util → the focus-trap util
    (`trapFocusWithinElement`/`lockDocumentScroll`) should move to
    `lib/domFocus.ts` since it's generic).
11. `stats/components/SavedSetMetadataEditor.tsx` + its lane helpers
    (`parseStoredLaneLabels`, `buildMetadataLaneOptions`, etc. → `stats/laneMeta.ts`).
12. `stats/components/SavedGameNotesEditor.tsx` + game-summary helpers.
13. `stats/components/{BakerStatsSection,BakerSetBreakdown,BakerFrameTable,SetSpecificStats}.tsx`.

**Phase 4 — lift StatsPage to `src/pages/StatsPage.tsx`.** With all helpers and
sub-components external, the remaining component is the shell: state, the filter
bar, the JSX section layout, and the local editor/delete/continue closures. Move
it, import everything from `src/stats/*`. This is the point where the render tree
finally leaves App.tsx.

**Phase 5 — the export subsystem (highest risk, do last).** See §4.

---

## 4. The hard part: the export subsystem

`runStatsExport` and its ~25 supporting builders (`get*ExportRows`,
`buildHtmlTable`, `buildStatsReportHtml`, `buildSelectedCsv`,
`buildStatsExportRows`) are **local closures over StatsPage's derived render
data** — `filters`, `filteredEntries`, the stat-card arrays, `sessionGroups`,
etc. They can't move to `stats/export/*` as-is.

Two options, in order of preference:

**Option A — extract a `useStatsData` selector first (recommended).** Pull the
inline derived-data computation (currently recomputed each render at ~3606–3872:
`filterOptions`, `filteredGames`, `filteredEntries`, `overviewStatCards`,
`spareLeaveRows`, `boardStats`, `bowlerRows`, `sessionGroups`, …) into a single
`useStatsData(filters, savedGames, …)` hook returning a `StatsData` object.
Then the export builders become **pure functions of `StatsData`** and move to
`stats/export/*` cleanly. Bonus: this also fixes the current perf smell (all
derived data recomputes on every keystroke because it's inline, not memoized) —
wrap the selector body in `useMemo`.

**Option B — thread parameters.** Pass the needed derived values into each
export builder explicitly. Less invasive but leaves a wide, awkward parameter
surface and doesn't fix the memoization issue. Fallback only.

Keep the **lazy `import("xlsx")`** exactly as-is (it preserves the separate
SheetJS chunk and the bundle-size win). The CSV/HTML/PDF branches are pure string
building once fed `StatsData`.

Because export is the riskiest and most behavior-sensitive (it produces files
users keep), it goes **last**, after everything else is stable, and gets its own
manual verification pass: export one of each format (CSV, XLSX, HTML, PDF) before
and after and diff the outputs.

---

## 5. Types ownership

Stats-local types to move into `stats/types.ts` (or co-locate with their one
consumer cluster):

| Type | Consumer cluster |
|---|---|
| `DetailedStatDetail` | the universal stat-detail modal shape (detailed/targeting/set) |
| `OverviewScoreDetail` | overview |
| `SetStatDetailRow` | set stats |
| `BoardStatRow`, `BoardShotRow` | board/targeting |
| `SetMetadataDraft` | SavedSetMetadataEditor |
| `GameMetadataDraft` | SavedGameNotesEditor |
| `StatsExportFormat`, `StatsExportSectionKey`, `StatsExportSections` (+ default/option consts) | export |
| `ResettableFilterKey` (+ `statsFilterDependents`) | filter bar |
| `STATS_REPORT_CSS` | export/html |

**Already in lib — do not redefine:** `HighSeriesDetail`,
`HighSeriesGameDetail`, `SessionGroup` (`lib/sessions.ts`); `StatsFilters`,
`ScopeMode`, `TimeFramePreset`, `FilterKey`, … (`lib/statsFilters.ts`);
`ScoreMark`, `BowlingFormat` (`lib/scoring.ts`).

`StatsPageProps` moves with the component to `pages/StatsPage.tsx`. Its one
non-obvious field, `onContinueSavedSet: (request: ContinueSavedSetRequest) => void`,
depends on `ContinueSavedSetRequest` — check whether that type is scoring-flow
shared; if so it belongs in `types.ts`, else co-locate.

---

## 6. Shared vs. stats-only (cross-usage findings)

- The stat classifiers/calculators are used **only** by StatsPage and its
  sub-components — **zero** uses in `LogGamesPage`, `GameEntryPage`, `App`, or the
  CRUD pages.
- The scoring flow uses a **different, already-extracted** vocabulary
  (`lib/scoring.ts`: `getFrameResult`, `isSplitLeave`, `getFrameMarks`,
  `calculateScoresForGame`, …). No coupling to the stats classifiers.
- **HomePage** re-implements strike classification inline (`pages/HomePage.tsx`
  ~L97). It already imports `gameDate` (statsFilters) and `buildSessionGroups`
  (sessions). → promoting `isStrikeEntry`/`isSpareEntry` to a shared module and
  reusing them in HomePage is the one genuinely cross-cutting win.

Everything else can start life as `src/stats/*` internal modules and be promoted
to `lib/` later only if another feature needs it.

---

## 7. Risks & guardrails

- **Behavior must not change.** Move functions verbatim; only add `export` and
  fix imports. Validate every step with typecheck + unit + e2e.
- **Data-safety (CLAUDE.md §5):** StatsPage mutates saved data via
  `setSavedGames`/`setSavedEventLogs` (frame edits, set/game deletes, metadata
  edits). The editor closures that do this (`saveFrameEdits`, `deleteSavedSet`,
  `deleteSavedGame`, metadata savers) stay in the StatsPage shell in Phase 4;
  don't try to move them to lib.
- **The `ReturnType<typeof buildSessionGroups>[number]` idiom** is threaded
  through ~10 local functions. Since `buildSessionGroups` is imported from
  `lib/sessions`, those annotations keep resolving after moves — or switch them
  to the exported `SessionGroup` type for clarity.
- **Export is behavior-sensitive** — it's last, with a before/after output diff
  across all four formats.
- **Perf note (not a blocker):** derived data is currently recomputed inline
  every render. Phase 5's `useStatsData` selector is the natural place to add
  `useMemo`; don't scatter memos earlier.
- **Test coverage today** is `lib/statsFilters.test.ts` (44) + scoring +
  backup — the *filter* engine is well covered, the *calculators* are not.
  Optional but valuable: add a `stats/*.test.ts` for the pure calculators as
  they're extracted (they're now trivially unit-testable in isolation — a real
  upside of this refactor).

---

## 8. Definition of done

- `src/pages/StatsPage.tsx` exists and is the render shell only (target
  <1,600 lines).
- `src/stats/*` holds the pure calculators, result types, export subsystem, and
  stats sub-components; nothing in `src/stats/*` imports from `App.tsx` or
  `src/pages/*`.
- `App.tsx` imports `StatsPage` from `./pages/StatsPage` and no longer contains
  any stat helper, card builder, stats type, or stats sub-component. Expected
  App.tsx reduction: **~7,000+ lines** removed (StatsPage zone A+B+C), leaving
  App.tsx as mostly the scoring flow + the App shell.
- All four export formats produce byte-identical output to today.
- Full suite green.

---

## 9. Suggested first commit

Phase 1 step 1: create `src/stats/frames.ts`, move the frame classifiers +
pocket/handedness helpers, import them back into StatsPage, and switch HomePage's
inline strike check to the shared `isStrikeEntry`. Small, verifiable, and it
immediately DRYs a real duplication — a good proof the seam works before we
commit to the larger sequence.

---

## 10. Findings & follow-ups (surfaced during extraction)

These are pre-existing behaviors noticed while extracting/testing — NOT
regressions from the decomposition (all moves are verbatim). Fix separately,
outside the behavior-preserving refactor.

- **Empty board fields parse to `0`, not "untracked" (`stats/board.ts`).**
  `parseBoardValue("")` returns `0` because `Number("") === 0`. Consequence: a
  frame where the bowler did **not** record foot/arrow/breakpoint boards still
  passes `hasBoardData` (its values are `0`, and `0 !== null`), so it counts as a
  *tracked shot* at board 0 and drags the board averages toward zero. Boards are
  1–39, so a real value is never 0. **Likely fix:** treat a blank/whitespace
  string as `null` in `parseBoardValue` (e.g. `value.trim() === "" ? null : …`).
  **Caution:** this changes existing users' targeting numbers (tracked-shot
  counts drop, averages shift), so ship it deliberately — ideally alongside a
  note in the UI or changelog — rather than silently. Captured by
  `stats/board.test.ts`, which currently documents the *current* (0) behavior.
