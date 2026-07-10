# Stats Filtering, Display & Export Redesign

**Status:** Approved design — not yet implemented
**Last updated:** 2026-07-09
**Owner:** Kevin Lewis
**Related:** `StatsPage` in `src/App.tsx`; QA/test + CI initiative (see "Testing strategy" below)
**Covers:** filter model + cascade, default/scenario display, time-frame filter, and the Stats export review

---

## 1. Why

The Stats screen has all the filters we want, but the *cascading* behavior and the
rules for **what is displayed by default vs. under each filter** are ad hoc, so the
experience gets "wonky" in certain combinations. This document defines a simpler,
more robust filtering model that is predictable, testable, and easy to reason about.

Goals:

- A filtering system that is **simple to understand** and behaves consistently.
- Clear, deliberate answers to: *what shows when nothing is filtered? when one player
  is filtered? when a Baker team is picked? how do the remaining filters cascade?*
- A structure that is **pure and unit-testable**, so this never silently regresses.

---

## 2. How it works today (baseline)

Filter state (11 controls) lives in `StatsPage`: `selectedBowler`,
`selectedBakerBowler`, `selectedBall`, `selectedCompetition`, `selectedEventName`,
`selectedCenter`, `selectedLane`, `selectedPattern`, `selectedEventStage`,
`selectedSetKey`, `selectedGameNumber`.

Matching is a single AND predicate, `gameMatchesCurrentFilters(game, ignoredFilters)`.
Dropdown option lists are each built by calling that predicate with a **hand-picked
set of ignored filters** (this is the "cascade").

Behavior by scenario:

- **Nothing filtered:** only the Overview tiles render (aggregate across all games
  **except Baker games, which are silently excluded**). All deeper sections are hidden
  behind a "select a filter" note. The default screen is a teaser.
- **One player selected:** everything re-scopes to that player's non-Baker games;
  Bowler Breakdown, Detailed Bowler Analysis, spare-leave, and targeting sections appear.
- **Baker team selected:** the single "Bowler / Baker Team" dropdown does double duty —
  a Baker team is encoded as the literal string `"Baker Team: A, B, C"`. Selecting one
  flips `isBakerTeamSelection`, which *includes* Baker games, *hides* the normal Bowler
  Breakdown, and reveals Baker/team sections. A second "Baker Bowler" dropdown drills
  into one member's frames.
- **Remaining filters** (ball, competition, event, stage, center, lane, pattern, set,
  game) AND together to narrow whichever universe is active.

---

## 3. Root-cause problems

1. **Conflated scope selector.** Individual bowlers and Baker teams share one dropdown
   via a string prefix (`"Baker Team: …"`). Fragile, and the source of most Baker weirdness.
2. **Silent Baker exclusion.** Baker games disappear from the default and any
   non-Baker-team view, with only a small note — easy to think data is missing.
3. **Ad-hoc cascading.** Each dropdown hand-picks which *other* filters to ignore when
   building its options. These bespoke ignore-lists are inconsistent, which is exactly
   where weird combinations come from.
4. **No stale-selection reset.** Changing one filter can leave another pointing at a
   value no longer in scope (e.g. a lane that isn't at the newly chosen center), silently
   zeroing out results. *(Confirm against repo — no reset logic spotted.)*
5. **Empty default.** "Nothing shows until you filter" is not the experience we want.

---

## 4. Target model (approved)

### 4.1 Scope selector — restructured
Replace the string-prefixed dropdown with explicit, separate state:

- **mode:** `All bowlers | Individual | Baker team`
- **selection:** the specific bowler (Individual) or the specific team (Baker team)

No more encoding teams as prefixed strings; mode and selection are independent fields.

### 4.2 Individual / Baker universe toggle — visible
A segmented control at the top makes the universe explicit. Baker games are **never
silently excluded** — the user chooses Individual or Baker, and the scope selector's
options follow from that choice.

### 4.3 Uniform cascading — one rule
Every dropdown's options = the **distinct values present in the games matching every
*other* active filter**. Applied identically to all filters. No per-dropdown ignore-lists.

### 4.4 Explicit parent → child dependencies
| Child filter | Parent | Behavior |
|---|---|---|
| Event Name / Event Stage | Competition = League/Tournament | Reset + disabled unless parent set |
| Lane | Center | Reset when Center changes; disabled when Center = All |
| Game # | Set | Reset when Set changes; disabled when Set = All |
| Baker Bowler | Baker team (scope) | Only available when a Baker team is selected |

Changing a parent resets its children; children are disabled when the parent is "All".

### 4.5 Auto-reset stale selections
When another change makes a filter's current value unreachable, snap it back to "All"
with a subtle notice, so the user never sits on an invisible dead filter.

### 4.6 Default view — Option 3 (summary + collapsed breakdowns)
With no filters applied:

- Overview tiles are **filled in** (all-up across the active universe).
- Every breakdown section is **present but collapsed** — a tidy stack of expandable headers.
- **Detailed Bowler Analysis stays gated** to when a single Individual is selected
  (it is meaningless in aggregate).

### 4.7 Time-frame filter
A **Time Frame** control alongside the other filters, participating in the same uniform
cascade (it narrows the game set by date; other dropdowns' options reflect the
date-narrowed set, and vice versa). No parent dependency — every game has a date.

- **Form:** quick **presets** (This week, This month, This year, Last 7 / 30 / 90 days,
  All time) **plus a Custom range** (from / to date pickers).
- **Date anchor:** a game is filed under **when it was logged/played** (the game's own
  timestamp, `createdAt ?? savedAt`) — always available, consistent across all game types.
  *Not* the scheduled league/tournament week.
- **Week/month semantics:** calendar-based (e.g. "This month" = current calendar month).
- **Scope:** ship the **filter now**; month/week-**bucketed trend views** (e.g. average by
  month) are noted as a **future enhancement**, not part of this work.
- Applies to **exports** automatically (exports read the same predicate); it must appear
  in the export's "Active Filters" section and in the generated filename.

---

## 5. Architecture

Collapse the logic into small **pure functions**, extracted out of `StatsPage`
(aligns with the monolith-decomposition roadmap):

- `filterGames(games, filters) -> games[]` — the single AND predicate; the one source
  of truth for "what's in scope."
- `deriveOptions(games, filters) -> Record<filterKey, string[]>` — the uniform cascade:
  for each filter, distinct reachable values given every *other* active filter.
- `resolveFilters(filters, options) -> filters` — applies parent→child rules and the
  stale-selection reset (returns a normalized filter state + a list of what got cleared).
- A small `visibleSections(filters)` helper — which breakdown sections render/expand,
  derived from the scope/universe, not scattered inline flags.

Display and dropdowns are then thin views over these pure functions.

---

## 6. Testing strategy (ties into the QA + CI initiative)

Because the model is pure, it is directly unit-testable:

- **Truth-table unit tests** (Vitest): for representative filter combinations, assert
  the resulting in-scope games, the derived options per dropdown, the parent/child
  resets, and which sections are visible/collapsed.
- **Stale-reset tests:** set filter A, then change B so A becomes unreachable; assert A
  resets to "All" and the cleared-filter notice fires.
- **Universe tests:** Individual vs Baker toggle yields the correct game set and sections.
- **E2E (Playwright):** a couple of flows through the real UI — pick a player and confirm
  the expected sections appear; switch to a Baker team and confirm the universe/sections change.

This makes the Stats filtering a strong candidate to be the first (or an early)
"extract logic → unit test → CI" slice.

---

## 7. To verify against the repo before implementing

- Whether any stale-selection reset already exists (none spotted).
- Exact shape of the event / stage / set / lane fields on `SavedGameRecord`, so the
  parent→child dependency wiring matches real data.
- Any Baker-specific stat sections that assume the current `"Baker Team: …"` string
  encoding and will need updating to the new scope model.

---

## 8. Export review & plan

The Stats export runs off the **same filters** as the screen, so the filtering redesign
(scope, universe, time-frame, cascade) flows through it as long as we keep the single
shared `filterGames` predicate.

### 8.1 Current state
- **Formats:** CSV, "Excel", HTML, "PDF" — all built from the **same section-getter
  functions**, so content is **consistent across formats** (exported numbers match the
  screen). ✅
- **Sections:** 10 toggleable sections (overview, active filters, saved sets, game scores,
  scorecards, bowler breakdown, detailed analysis, spare leaves, targeting, frame details)
  mapping to the on-screen sections; sensible defaults (first four on).
- **CSV:** real CSV with proper quote/comma/newline escaping. ✅
- **HTML:** genuine standalone HTML report. ✅

### 8.2 Findings (inconsistencies to fix)
1. **"Excel" is not a real spreadsheet.** It's the HTML report with a BOM, saved `.xls`
   with an Excel mime type. Opens in Excel but throws the "format and extension don't
   match" warning every time; no real cells/formulas.
2. **"PDF" produces no PDF.** It opens the HTML with `autoPrint` (browser print dialog →
   user Saves-as-PDF). The extension logic implies a `.pdf` download that never happens.

*(Both logged as QA findings in the bug/inconsistency log.)*

### 8.3 Plan (approved)
- **Excel → real `.xlsx`.** Generate a true workbook via a spreadsheet library
  (SheetJS/exceljs): proper cells, opens with no warning. Adds one dependency.
- **PDF → "Print / Save as PDF".** Keep the print-to-PDF flow but **relabel honestly** and
  drop the implied `.pdf` download. Zero dependencies, works everywhere.
- **CSV, HTML:** unchanged (already correct).
- **Reflect the redesign in exports:** add **time-frame** and **scope/universe (Individual
  vs Baker)** to the "Active Filters" section and the generated filename.
- Keep all formats sharing the single set of section-getters so content stays consistent.

---

## 9. Decision log

| Decision | Choice |
|---|---|
| Default view (no filters) | **Option 3** — summary filled in, breakdown sections present but collapsed |
| Baker games | **Explicit Individual/Baker toggle** (no silent exclusion) |
| Scope selector | **Restructure cleanly** (mode + selection, drop the string-prefix hack) |
| Stale selections | **Auto-reset to "All" with a subtle notice** |
| Testing | **Unit (pure functions) + E2E**, folded into the QA/CI initiative |
| Time-frame filter | **Presets + custom range**; anchored on **logged/played date**; **filter now, trends later**; applies to exports |
| Excel export | **Generate a real `.xlsx`** (via SheetJS/exceljs) |
| PDF export | **Relabel as "Print / Save as PDF"**; keep print flow, drop the fake `.pdf` |
| Export content | Keep all formats on the shared section-getters; add time-frame + scope/universe to Active Filters & filename |
