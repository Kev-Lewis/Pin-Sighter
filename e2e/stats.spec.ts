import { test, expect } from "@playwright/test";
import { openStats, totalGamesValue, expandSection } from "./utils";

test.beforeEach(async ({ page }) => {
  await openStats(page);
});

test("default view aggregates all individual games", async ({ page }) => {
  await expandSection(page, "Overview");
  // 8 non-Baker games in the fixture (Baker games are excluded from the
  // individual universe).
  await expect(totalGamesValue(page)).toHaveText("8");
});

test("time frame filters out older games", async ({ page }) => {
  await expandSection(page, "Overview");
  await expect(totalGamesValue(page)).toHaveText("8");

  await page.getByLabel("Time Frame").selectOption({ label: "This year" });

  // Sections re-collapse on any filter change, so re-open Overview.
  await expandSection(page, "Overview");
  // Fixed clock is 2026 → the 3 games from 2025 drop out, leaving 5.
  await expect(totalGamesValue(page)).toHaveText("5");
});

test("individual scope unlocks Detailed Bowler Analysis", async ({ page }) => {
  await page.getByRole("button", { name: "Individual" }).click();
  await page.getByLabel("Bowler", { exact: true }).selectOption({ label: "Kevin" });

  await expect(
    page.locator("summary", { hasText: "Bowler Breakdown" })
  ).toBeVisible();

  await expandSection(page, "Bowler Breakdown");
  await expect(page.getByText(/Detailed Bowler Analysis/)).toBeVisible();
});

test("baker scope swaps to the Baker Team Stats section", async ({ page }) => {
  await page.getByRole("button", { name: "Baker Team" }).click();

  // Baker aggregation is shown; the individual-only Bowler Breakdown is hidden.
  await expect(
    page.locator("summary", { hasText: "Baker Team Stats" })
  ).toBeVisible();
  await expect(
    page.locator("summary", { hasText: "Bowler Breakdown" })
  ).toHaveCount(0);
});

test("exports a CSV of the current stats", async ({ page }) => {
  await page.getByRole("button", { name: "Export Options" }).click();
  await page.getByLabel("Export Format").selectOption({ label: "CSV" });

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export Selected" }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/pin-sighter-stats.*\.csv$/);
});
