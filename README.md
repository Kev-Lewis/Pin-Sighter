# Pin-Sighter

**Local-first bowling analytics.** Log games frame by frame across open, league,
tournament, and Baker sessions, then get performance reports: averages,
strike / spare / open / split trends, spare-leave conversion, targeting and
board progression, saved sets, and scorecards. All data stays on your device —
no account, no server, no tracking.

[![CI](https://github.com/Kev-Lewis/Pin-Sighter/actions/workflows/ci.yml/badge.svg)](https://github.com/Kev-Lewis/Pin-Sighter/actions/workflows/ci.yml)

🎳 **Live app:** https://pin-sighter.kevinlewis.net · **About:** https://kevinlewis.net/pin-sighter

<!-- Add a screenshot or short GIF and uncomment:
![Pin-Sighter Stats screen](docs/screenshot.png)
-->

---

## Features

- **Frame-by-frame logging** — full shot detail per frame (knocked pins, ball
  used, foot board, target/actual arrow and breakpoint), across Singles,
  Doubles, Trios, Fours, Fives, and Baker formats.
- **Sessions & saved sets** — open play, leagues, and tournaments with per-week
  / per-day logs, grouped into saved sets you can revisit and continue.
- **Deep stats** — overview tiles, per-bowler breakdown, detailed single-bowler
  analysis, spare-leave conversion, and targeting / board-progression trends.
- **Robust filtering** — an explicit **scope** (all bowlers / a single bowler /
  a Baker team), a **time frame** (presets plus a custom range), and a
  cascading set of filters (competition, event, week, set, game, center, lane,
  pattern, ball) that reset their dependents cleanly and never leave a stale,
  invisible selection.
- **Exports** — CSV, a real `.xlsx` workbook, a themed HTML report, and a
  print-to-PDF view — all driven by the same active filters.
- **Backup & restore** — versioned JSON backups with a normalizing import path,
  so your data survives shape changes.

## Tech stack

- **React 19** + **TypeScript** (strict)
- **Vite 7** for dev/build
- **Tauri 2** for optional desktop packaging
- **Vitest** (unit) + **Playwright** (E2E), gated in **GitHub Actions**
- Persistence: `localStorage` + a Tauri app-data file + a rolling temporary
  backup. No server, no external database.
- A small design system (**kl-ui**) applied as a single themeable layer.

## Getting started

```bash
npm install
npm run dev        # Vite dev server → http://localhost:1420
npm run build      # tsc (strict) + vite build → dist/
npm run preview    # preview the production build
```

Desktop (optional, requires the Rust/Tauri toolchain):

```bash
npm run tauri dev
npm run tauri build
```

## Testing

```bash
npm run test:run   # unit tests (Vitest)
npm run test:e2e   # end-to-end tests (Playwright)
```

- **Unit** tests cover the pure logic extracted into `src/lib/` — the scoring
  engine, the backup/import normalizer, and the Stats filtering model.
- **E2E** tests drive the real UI in Chromium, seeding a fixed dataset and
  exercising the Stats scope/time-frame flows and export.
- Both run on every push and pull request via `.github/workflows/ci.yml`.

## Architecture notes

The app began life as a single large `App.tsx` and is being decomposed
incrementally, behavior-preserving, with the test suite as a safety net. The
strategy has been to pull **pure, testable logic** into `src/lib/` first:

- `src/lib/scoring.ts` — the bowling scoring engine (frames, strikes/spares,
  10th-frame fills, Baker vs. individual).
- `src/lib/backup.ts` — backup creation and the import/normalize/versioning path.
- `src/lib/statsFilters.ts` — the Stats filter model, cascade, parent/child +
  stale-selection resolution, and time-frame logic.

Shared UI components are now being lifted into `src/components/` (starting with
the smallest, dependency-free pieces). See [`docs/`](docs/) for design notes,
including the Stats filtering & export redesign.

## Roadmap

- Continue decomposing `App.tsx` into `src/components/` and `src/pages/`.
- Extract the remaining data layer (storage, types) out of the monolith.
- Deepen mobile ergonomics (score entry and wide tables on small screens).
- Month/week bucketed trend views built on the time-frame model.

## License

_No license yet — all rights reserved.

---

Built by [Kevin Lewis](https://kevinlewis.net).
