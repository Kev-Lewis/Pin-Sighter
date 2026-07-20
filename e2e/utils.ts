import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

const here = dirname(fileURLToPath(import.meta.url));

// The seed backup — a small, deterministic dataset (see fixtures/seed-data.json):
// 8 individual games (3 Kevin recent, 3 Kevin from 2025, 2 Marcus recent) plus
// 2 Baker games for the team [Kevin, Marcus, Diane].
const backup = JSON.parse(
  readFileSync(join(here, "fixtures", "seed-data.json"), "utf-8")
);

// localStorage keys, mirrored from `storageKeys` in src/App.tsx.
const STORAGE_KEYS = {
  bowlers: "pin-sighter:bowlers:v1",
  centers: "pin-sighter:centers:v1",
  patterns: "pin-sighter:patterns:v1",
  events: "pin-sighter:events:v1",
  savedEventLogs: "pin-sighter:saved-event-logs:v1",
  savedGames: "pin-sighter:saved-games:v1",
  setupComplete: "pin-sighter:setup-complete:v1",
};

/**
 * Seed the app's localStorage before it boots, so first-launch setup is skipped
 * and the fixture data is loaded directly. Must be called before page.goto().
 */
export async function seedAppData(page: Page) {
  await page.addInitScript((payload: { keys: typeof STORAGE_KEYS; data: any }) => {
    const { keys, data } = payload;
    localStorage.setItem(keys.setupComplete, "true");
    localStorage.setItem(keys.bowlers, JSON.stringify(data.bowlers));
    localStorage.setItem(keys.centers, JSON.stringify(data.centers));
    localStorage.setItem(keys.patterns, JSON.stringify(data.patterns));
    localStorage.setItem(keys.events, JSON.stringify(data.events));
    localStorage.setItem(keys.savedEventLogs, JSON.stringify(data.savedEventLogs));
    localStorage.setItem(keys.savedGames, JSON.stringify(data.savedGames));
  }, { keys: STORAGE_KEYS, data: backup.data });
}

/** Seed, load the app at a fixed date, and open the Stats page. */
export async function openStats(page: Page) {
  // Fixed clock so time-frame filtering is deterministic (2026 → excludes the
  // 2025 games). Set before navigation so the app reads it at mount.
  await page.clock.setFixedTime(new Date("2026-07-08T12:00:00"));
  await seedAppData(page);
  await page.goto("/");
  // Scope to the sidebar nav + exact match: the Home dashboard also renders an
  // "Open Stats" quick-action button, so a substring "Stats" match is ambiguous.
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("button", { name: "Stats", exact: true })
    .click();
  await expect(page.getByRole("button", { name: "All Bowlers" })).toBeVisible();
}

/** The Overview "Games" tile value (count of games in the current filter). */
export function totalGamesValue(page: Page) {
  // Match the tile whose label is exactly "Games" so it doesn't also catch the
  // Frame Outcomes "Clean Games" tile.
  return page
    .locator(".stat-card", { has: page.getByText("Games", { exact: true }) })
    .locator("strong");
}

/**
 * Ensure a collapsible Stats section is open. Some sections (e.g. Overview,
 * Frame Outcomes) render open by default, so only click the summary when the
 * section is currently closed — an unconditional click would toggle an
 * already-open section shut.
 */
export async function expandSection(page: Page, name: string) {
  const details = page
    .locator("details")
    .filter({ has: page.locator("summary", { hasText: name }) })
    .first();
  const isOpen = await details.evaluate(
    (element) => (element as HTMLDetailsElement).open
  );
  if (!isOpen) {
    await details.locator("summary").first().click();
  }
}
