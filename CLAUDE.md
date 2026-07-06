# CLAUDE.md — Pin-Sighter

Guidance for Claude Code (and humans) working in this repository. Read this
first: it captures the architecture, data model, design system, conventions,
and the refactor roadmap so changes stay consistent with the project's
direction.

---

## 1. What Pin-Sighter is

Pin-Sighter is a **local-first bowling analytics app**. Bowlers log games
frame-by-frame across open / league / tournament sessions and get performance
reports: averages, strike/spare/open/split trends, spare-leave conversion,
targeting and board progression, saved sets and scorecards. All data stays on
the device unless the user manually exports a backup.

- Live web app: https://pin-sighter.kevinlewis.net/
- Marketing page: https://kevinlewis.net/pin-sighter
- Repo: https://github.com/Kev-Lewis/Pin-Sighter
- Author: Kevin Lewis

---

## 2. Tech stack

- **React 19** + **TypeScript** (~5.8)
- **Vite 7** for dev/build
- **Tauri 2** for optional desktop packaging (`src-tauri/`)
- Persistence: **localStorage** + a **Tauri filesystem app-data file** +
  a rolling **temporary backup** (see §5). No server, no external DB.
- Design system: **kl-ui** (ported from kevinlewis.net) applied via
  `src/theme.css` (see §6).

### Commands

```bash
npm run dev       # Vite dev server on http://localhost:1420
npm run build     # tsc + vite build  → dist/
npm run preview   # preview the production build
npm run tauri dev # run inside the Tauri desktop shell
npm run tauri build
```

> Environment note: the app runs fine as a pure web build. Tauri filesystem
> APIs are loaded at runtime via `new Function("import(specifier)")` inside
> `loadTauriFileSystem()`, so the bundler never tries to resolve
> `@tauri-apps/*` for web builds — they're only present when running under Tauri.

---

## 3. Repository layout

```
Pin-Sighter/
├─ index.html               # Vite entry; mounts #root, loads /src/main.tsx
├─ src/
│  ├─ main.tsx              # ReactDOM.createRoot → <App/>
│  ├─ App.tsx               # ⚠ THE ENTIRE APP — ~14,900 lines, all components
│  ├─ App.css               # ⚠ ~4,000 lines — original "blocky" styles
│  ├─ theme.css             # kl-ui design layer (the restyle; see §6)
│  ├─ assets/               # react.svg
│  ├─ db/schema.sql         # ⚠ ASPIRATIONAL — SQLite model, NOT used at runtime
│  └─ types/models.ts       # ⚠ ASPIRATIONAL — snake_case model, NOT imported
├─ public/                  # logos, favicons, web manifest
├─ src-tauri/               # Tauri (Rust) desktop wrapper
├─ components/  pages/       # EMPTY — reserved for the refactor (see §8)
└─ vite.config.ts
```

**The single most important fact about this codebase:** the entire
application — every page, component, type, helper, and the data layer — lives
in one file, `src/App.tsx` (~14,900 lines), styled by one file, `src/App.css`
(~4,000 lines). The `components/` and `pages/` directories are empty. Breaking
this monolith up is the central goal of the refactor (§8).

### The two "aspirational" files

`src/db/schema.sql` and `src/types/models.ts` describe a **normalized SQLite
schema** (snake_case tables: `bowlers`, `balls`, `centers`, `patterns`,
`events`, `sessions`, `games`, `shots`; lowercase enums like
`'right' | 'left'`). **The running app does not use them.** App.tsx defines its
*own* inline types with different names and shapes (PascalCase enums like
`"Right" | "Left"`, a `Bowler.arsenal: BowlingBall[]` instead of a `balls`
table, etc.) and persists plain JSON to localStorage. Treat schema.sql /
models.ts as a *future* direction, not the current contract. Don't import from
them expecting them to match runtime data.

---

## 4. Application structure (inside App.tsx)

Navigation is **tab state**, not a router. `App()` holds `activeTab: Tab`
(`"home" | "log-games" | "stats" | "bowlers" | "centers" | "events" |
"patterns" | "data" | "about"`). Home renders a nav grid from the `tabs` array;
selecting a tab renders that page inside a `.page-card` with a `← Back` button.

Top-level page components (all in App.tsx):

| Component | Purpose | Approx. line |
|---|---|---|
| `App` | root state, persistence, routing shell | 1426 |
| `AboutPage` | static about | 1805 |
| `DataManagementPage` | import/export/backup/restore | 1837 |
| `LogGamesPage` | set up & log a session | 2109 |
| `BowlersPage` | bowler + ball arsenal CRUD | 2906 |
| `CentersPage` | bowling center CRUD | 3661 |
| `EventsPage` | leagues / tournaments CRUD | 4012 |
| `PatternsPage` | oil pattern CRUD | 4927 |
| `GameEntryPage` | frame-by-frame shot entry | 5782 |
| `StatsPage` | **~4,300 lines** — all reports & filters | 7417 |

Reusable pieces worth extracting first: `EmptyStateCard`, `ToastMessage`,
`BoardSelect`, `ScoreGrid`, `ScoreRollMark`, `PinDeck`, `StaticPinLeaveDeck`,
`CompletedGamesList`, `SavedFrameEditModal`, plus the Baker/stats sub-sections.

---

## 5. Data & persistence

All app state lives in `App()` as `useState` and is the source of truth:
`bowlers`, `centers`, `patterns`, `events`, `savedEventLogs`, `savedGames`
(plus setup flags). A `backupData` memo bundles them.

Three persistence layers, keyed under the `pin-sighter:*:v1` namespace
(`storageKeys`):

1. **localStorage** — each slice is written on change via a `useEffect`
   (`saveToLocalStorage`). Read on init via `loadFromLocalStorage`.
2. **Tauri app-data file** — debounced 500 ms write of the full backup
   (`writeAppDataFile`); read on launch with a timeout
   (`readAppDataFileWithTimeout`). Falls back to a localStorage key when the
   Tauri fs API is unavailable (web).
3. **Temporary backup** — debounced 1 s snapshot + a `beforeunload` write, so a
   crash/refresh is recoverable.

Backups are versioned JSON (`createPinSighterBackup` →
`{ version, exportedAt, data }`). Imports go through `getImportedBackupData`,
which normalizes and returns `{ data, warnings }`. `ensureUnknownPattern`
guarantees a sentinel "Unknown" pattern always exists.

**Implications for changes:** any change to a data shape must be handled in
the import/normalize path (and ideally the backup `version`) so existing users'
saved data still loads.

### Domain model (runtime types, the real ones)

`Bowler { id, name, handedness, notes, arsenal: BowlingBall[] }` ·
`BowlingBall { id, name, brand, surface, layout, notes }` ·
`Center { id, name, ... }` · `Pattern { id, name, lengthFt?, volumeMl?, ratio?, ... }` ·
`EventSetup` (league/tournament) · `SavedEventLog` · `SavedGameRecord`
(games with per-frame `FrameEntry` data, scores, and shot detail). Frames carry
`CarryoverFields` (lane, ball, targeting boards) so entry can prefill the next
shot.

---

## 6. Design system — kl-ui via `theme.css`

The original look is intentionally "blocky": 3px solid black borders, square
corners, flat black buttons, gray page. The redesign adopts **kl-ui**, the
design system from kevinlewis.net — soft white surfaces, hairline borders,
rounded corners, gentle elevation, Inter + Space Mono, and a single themeable
accent.

### How it's wired (deliberately minimal & reversible)

Rather than rewrite 14.9k lines of JSX or fight 4k lines of CSS, the theme is a
**single additive layer**, `src/theme.css`, scoped under `.app-shell` (already
the app's root element, `<main className="app-shell">`):

- **Activation is one line.** In `App.tsx`, directly under
  `import "./App.css";` add `import "./theme.css";`. No JSX/className change is
  needed — the scope class already exists. Revert by deleting that one line.
- Because every rule is `.app-shell <selector>` (specificity ≥ 0,2,0), it beats
  App.css's single-class rules (0,1,0). A few App.css rules use higher
  specificity (`.card[open] > .summary`, ~0,3,0) or `!important`; the theme
  matches those with equal-or-higher selectors and targeted `!important` only
  where required (the collapsible headers/chevrons).
- It restyles the app's **existing class vocabulary** (`.logo-card`,
  `.nav-button`, `.page-card`, `.primary-button`, `.stat-card`, `.stats-table`,
  form inputs, cards, toasts, …), so **every page inherits the new look at
  once**.
- **It flattens the nesting.** The app's biggest visual problem is
  boxes-in-boxes: `<details className="stats-collapsible-card">` sections, each
  a bordered panel, holding more bordered cards, with a redundant
  "Open / Close Section" label + boxed `+/−`. The theme strips those borders and
  backgrounds so sections become header rows separated by hairline dividers,
  hides the redundant label, replaces the boxed `+/−` with a single rotating
  chevron, and turns inner stat tiles into a light tinted grid — so pages flow
  instead of nest.

**If the restyle "shows the original style":** the `import "./theme.css";` line
is missing or `theme.css` isn't in `src/`; add both and hard-refresh (or restart
`npm run dev`). It does NOT require any className change.

This mirrors the kl-ui guide's own advice for React apps: *take the CSS, port
the tokens, reimplement interactive bits natively.* The full kit
(`kl-ui.css` / `kl-ui.js` / `kl-ui-guide.md`) lives in
`Projects/templates/kl-ui` and is the canonical reference when adopting real
`kl-*` components later.

### Design tokens (defined on `.ps-theme`)

Neutrals: `--ink`, `--ink-soft`, `--ink-faint`, `--line`, `--line-strong`,
`--paper`, `--bg`, `--bg-tint`. Shape/motion: `--radius-sm/‑/‑lg`, `--pill`,
`--shadow-1/2/3`, `--spring`. Accent (the 4 that define the brand):
`--accent`, `--accent-ink`, `--accent-soft`, `--accent-soft-bd`.

**Re-theming is a 4-line change** — edit the `--accent*` block at the top of
`theme.css`. Everything (buttons, pills, active states, table-row hover, focus
rings, highlights) follows. Candidate palettes:

| Theme | `--accent` | `--accent-ink` | `--accent-soft` | `--accent-soft-bd` |
|---|---|---|---|---|
| **Scope Red** (on-brand, default) | `#e5241f` | `#c11a17` | `#fdeceb` | `#f7cecc` |
| KL Purple (matches site) | `#7c3aed` | `#6d28d9` | `#f3edfd` | `#e3d7fa` |
| Lane Blue | `#2563eb` | `#1d4ed8` | `#eaf0fe` | `#cddcfb` |

Scope Red is derived from the logo's targeting-reticle, refined slightly for
text contrast (use `--accent-ink` for small text/links to stay AA).

### Responsive

`theme.css` includes a `max-width: 640px` layer: single-column nav, stacked
forms, reflowing stat cards, horizontally scrollable tables, ≥44px touch
targets, and `font-size:16px` on inputs to stop iOS zoom-on-focus. A
`prefers-reduced-motion` block disables transitions. App.css also has its own
older media queries; these are being consolidated into the theme layer over
time.

---

## 7. Conventions

- **TypeScript strict.** Prefer explicit types for props (`*PageProps` pattern
  already in use). State setters are passed down as props (`setBowlers`, etc.).
- **Styling:** add new styling to `theme.css` using the tokens above, scoped
  under `.ps-theme`. Don't add new hard-coded colors, black borders, or square
  corners — use `var(--line)`, `var(--radius)`, `var(--accent)`.
- **Data safety:** never break the import/normalize path (§5). Bump the backup
  `version` and handle migration when a shape changes.
- **Local-first:** no network calls for user data. Keep it that way.
- **Accessibility:** icon-only controls need `aria-label`; keep the visible
  focus ring (`box-shadow` accent-soft) intact.

---

## 8. Refactor roadmap

The direction is: preserve behavior and data, improve structure and feel,
mobile-friendly, eventually app-ready.

**Phase 0 — Design system (done / in progress).**
`theme.css` + `.ps-theme` restyle of the shell, nav, page frame, and shared
primitives; responsive layer; CLAUDE.md. Accent chosen by the author.

**Phase 1 — Decompose the monolith.** Move page components out of `App.tsx`
into `src/pages/` and shared UI into `src/components/`. Suggested order: leaf
components first (`ToastMessage`, `EmptyStateCard`, `ScoreGrid`, `PinDeck`,
`BoardSelect`), then the CRUD pages, then split `StatsPage` (~4.3k lines) into
`stats/` sub-modules (overview, spare/leave, targeting, Baker, exports).

**Phase 2 — Extract the data layer.** Pull `storageKeys`, load/save, backup,
import/normalize, and the domain types out of `App.tsx` into `src/data/`
(e.g. `storage.ts`, `backup.ts`, `types.ts`). Consider a small context or
reducer so pages stop receiving a dozen setter props.

**Phase 3 — Reconcile the data model.** Decide whether to adopt the
normalized model in `db/schema.sql` / `models.ts` (e.g. via `sql.js` /
Tauri SQLite) or formally retire those files and treat the localStorage JSON
shape as the contract. Today they disagree; pick one.

**Phase 4 — Componentize with real kl-ui.** Where it helps, replace bespoke
markup with kl-ui components (pills, panels, mini-cards) for consistency with
the site.

**Phase 5 — Mobile & app.** Deepen responsive behavior (score-entry ergonomics
on phones), then revisit Tauri / a mobile wrapper for a packaged app. Far-future.

### Guardrails

- Refactor in small, behavior-preserving steps; verify the app still builds and
  data still loads after each.
- Don't change persisted key names or JSON shapes without a migration.
- Keep `theme.css` as the styling entry point until App.css is fully retired.

---

## 9. Known issues / tech debt

- **Monolith:** `App.tsx` (~14.9k) and `App.css` (~4k) are the top priority.
- **Model drift:** schema.sql / models.ts vs. the runtime types (§3, Phase 3).
- **Empty `components/` and `pages/`** dirs signal intent but are unused.
- **Duplicate/legacy responsive rules** in App.css overlap the new theme layer.
- One `!important` accent-blue rule in App.css (~line 2629) can locally override
  the theme accent; fold into the theme layer during Phase 0/1.
- No automated tests yet; a build + manual smoke test is the current safety net.
