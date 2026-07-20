// Stats export core — the top-level, dependency-light pieces of the Stats
// export subsystem: the format/section types, section defaults + option
// metadata, the printable HTML report stylesheet, the scorecard/mark
// formatters, and the export filename builder. Extracted from App.tsx (stats
// decomposition). The section row-builders and the export modal remain inside
// StatsPage for now (they close over StatsPage's filtered data) and will move
// out with the StatsPage shell lift.

import type { FrameEntry } from "../types";
import { getFrameMarks, type ScoreMark } from "../lib/scoring";

export type StatsExportFormat = "csv" | "excel" | "html" | "pdf";

export type StatsExportSectionKey =
  | "overview"
  | "activeFilters"
  | "savedSets"
  | "gameScores"
  | "scorecards"
  | "bowlerBreakdown"
  | "detailedAnalysis"
  | "spareLeaves"
  | "targeting"
  | "frameDetails";

export type StatsExportSections = Record<StatsExportSectionKey, boolean>;

export const defaultStatsExportSections: StatsExportSections = {
  overview: true,
  activeFilters: true,
  savedSets: true,
  gameScores: true,
  scorecards: false,
  bowlerBreakdown: false,
  detailedAnalysis: false,
  spareLeaves: false,
  targeting: false,
  frameDetails: false,
};

export const statsExportSectionOptions: Array<{
  key: StatsExportSectionKey;
  label: string;
  description: string;
}> = [
  {
    key: "overview",
    label: "Overview",
    description: "Main totals, average, high game, and high series.",
  },
  {
    key: "activeFilters",
    label: "Active Filters",
    description: "Shows the filters used to create this export.",
  },
  {
    key: "savedSets",
    label: "Saved Sets",
    description: "One row per saved set with center, pattern, lanes, and scores.",
  },
  {
    key: "gameScores",
    label: "Game Scores",
    description: "Simple score rows for each game and bowler/team.",
  },
  {
    key: "scorecards",
    label: "Scorecards",
    description: "Spreadsheet-style score rows with frames 1-10 and total.",
  },
  {
    key: "bowlerBreakdown",
    label: "Bowler Breakdown",
    description: "Games, average, high game, high series, and mark totals.",
  },
  {
    key: "detailedAnalysis",
    label: "Detailed Stat Analysis",
    description:
      "Analysis stats, average frame score, average by game, score distribution, and transition phases.",
  },
  {
    key: "spareLeaves",
    label: "Spare Leave Breakdown",
    description: "Leave attempts, conversions, misses, and pickup percentages.",
  },
  {
    key: "targeting",
    label: "Targeting Analysis",
    description: "Arrow and breakpoint accuracy summary, plus ball breakdown.",
  },
  {
    key: "frameDetails",
    label: "Frame / Shot Details",
    description: "Raw frame-level pinfall, leave, target, and board data.",
  },
];

// Styling for the exported HTML / print-to-PDF Stats report — kl-ui "Scope Red"
// theme so the report matches the app (soft surfaces, hairline borders, Space
// Mono figures, accent-highlighted key metrics).
export const STATS_REPORT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap');
:root{
  --accent:#e5241f; --accent-ink:#c11a17; --accent-soft:#fdeceb; --accent-soft-bd:#f7cecc;
  --ink:#0e1526; --ink-soft:#46536b; --ink-faint:#75839a;
  --line:#ece9f2; --line-strong:#dfe1ea; --paper:#fff; --bg:#f6f7f9; --bg-tint:#f7f8fa;
  --radius:16px; --radius-sm:12px;
  --shadow:0 2px 4px rgba(16,25,45,.03), 0 12px 30px -12px rgba(16,25,45,.10);
}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);
  font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.5;
  -webkit-font-smoothing:antialiased;}
.page{max-width:1080px;margin:0 auto;padding:32px 28px 56px;}
.tile-value,td.num,th.num{font-family:'Space Mono','SFMono-Regular',ui-monospace,Menlo,Consolas,monospace;font-variant-numeric:tabular-nums;}
.report-head{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;
  padding-bottom:18px;border-bottom:2px solid var(--accent);margin-bottom:26px;flex-wrap:wrap;}
.brand{display:flex;align-items:center;gap:14px;}
.brand .mark{width:34px;height:34px;border-radius:50%;flex:0 0 auto;
  background:radial-gradient(circle at 50% 50%, #fff 0 22%, var(--accent) 24% 44%, #fff 46% 60%, var(--accent) 62% 82%, #fff 84%);
  box-shadow:0 0 0 2px var(--accent-soft-bd);}
.brand h1{margin:0;font-size:1.5rem;font-weight:800;letter-spacing:-.02em;}
.brand .sub{margin:2px 0 0;color:var(--accent-ink);font-weight:600;font-size:.82rem;text-transform:uppercase;letter-spacing:.08em;}
.meta{display:flex;flex-direction:column;align-items:flex-end;gap:2px;color:var(--ink-faint);font-size:.82rem;text-align:right;}
.meta strong{color:var(--ink);}
.overview{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin:0 0 30px;}
.tile{background:var(--paper);border:1px solid var(--line);border-radius:var(--radius-sm);padding:14px 16px;
  display:flex;flex-direction:column;gap:4px;box-shadow:var(--shadow);}
.tile-value{font-size:1.7rem;font-weight:700;line-height:1;color:var(--ink);}
.tile-label{font-size:.72rem;text-transform:uppercase;letter-spacing:.06em;color:var(--ink-faint);font-weight:600;}
.tile.hero{background:linear-gradient(180deg,#fff, var(--accent-soft));border-color:var(--accent-soft-bd);}
.tile.hero .tile-value{color:var(--accent-ink);font-size:2rem;}
.tile.hero .tile-label{color:var(--accent-ink);}
.report-section{margin:0 0 26px;page-break-inside:avoid;}
.report-section h2{font-size:1.02rem;font-weight:700;margin:0 0 10px;padding-left:11px;position:relative;letter-spacing:-.01em;}
.report-section h2::before{content:"";position:absolute;left:0;top:.15em;bottom:.15em;width:4px;border-radius:2px;background:var(--accent);}
.table-wrap{overflow-x:auto;border:1px solid var(--line);border-radius:var(--radius-sm);box-shadow:var(--shadow);background:var(--paper);}
table{width:100%;border-collapse:collapse;font-size:.86rem;}
thead th{background:var(--bg-tint);color:var(--ink-soft);text-align:left;font-weight:600;font-size:.7rem;
  text-transform:uppercase;letter-spacing:.05em;padding:10px 12px;border-bottom:1px solid var(--line-strong);white-space:nowrap;}
tbody td{padding:9px 12px;border-bottom:1px solid var(--line);vertical-align:top;color:var(--ink-soft);}
tbody tr:last-child td{border-bottom:none;}
tbody tr:nth-child(even){background:var(--bg-tint);}
th.num,td.num{text-align:right;white-space:nowrap;}
td.emph{color:var(--ink);font-weight:700;}
th.emph{color:var(--accent-ink);}
.perfect-pill{display:inline-block;background:var(--accent);color:#fff;font-weight:700;
  padding:1px 9px;border-radius:999px;font-size:.82rem;box-shadow:0 1px 2px rgba(229,36,31,.4);}
td.empty{text-align:center;color:var(--ink-faint);font-style:italic;padding:16px;}
@media print{
  body{background:#fff;} .page{padding:0;max-width:none;}
  .tile,.table-wrap{box-shadow:none;}
  thead th{-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  table{font-size:.72rem;} tbody td,thead th{padding:5px 7px;}
}
`;

export function formatScoreMarksForExport(marks: ScoreMark[]) {
  const markText = marks.map((mark) => mark.value).filter(Boolean).join("");

  return markText || "";
}

export function formatScorecardFrameForExport(
  entry: FrameEntry | undefined,
  cumulativeScore: number | string | undefined
) {
  if (!entry) {
    return "";
  }

  const markText = formatScoreMarksForExport(getFrameMarks(entry));
  const scoreText =
    cumulativeScore === undefined || cumulativeScore === ""
      ? ""
      : ` (${cumulativeScore})`;

  return `${markText}${scoreText}`;
}

export function getUniqueBallSummary(entries: FrameEntry[]) {
  const uniqueBalls = Array.from(
    new Set(entries.map((entry) => entry.ballUsed).filter(Boolean))
  );

  return uniqueBalls.length > 0 ? uniqueBalls.join(", ") : "";
}

export function buildStatsExportFileName(
  filters: {
    selectedBowler: string;
    selectedBakerBowler?: string;
    selectedBall: string;
    selectedCompetition: string;
    selectedEventName: string;
    selectedCenter: string;
    selectedLane: string;
    selectedPattern: string;
    selectedEventStage: string;
    selectedSetKey: string;
    selectedGameNumber: string;
    timeFrame?: string;
  },
  extension = "csv"
) {
  const activeFilterParts = [
    "pin-sighter-stats",
    filters.selectedBowler !== "All" ? filters.selectedBowler : "",
    filters.selectedBakerBowler && filters.selectedBakerBowler !== "All"
      ? filters.selectedBakerBowler
      : "",
    filters.selectedBall !== "All" ? filters.selectedBall : "",
    filters.selectedCompetition !== "All" ? filters.selectedCompetition : "",
    filters.selectedEventName !== "All" ? filters.selectedEventName : "",
    filters.selectedCenter !== "All" ? filters.selectedCenter : "",
    filters.selectedLane !== "All" ? filters.selectedLane : "",
    filters.selectedPattern !== "All" ? filters.selectedPattern : "",
    filters.selectedEventStage !== "All" ? filters.selectedEventStage : "",
    filters.selectedSetKey !== "All" ? "selected-set" : "",
    filters.selectedGameNumber !== "All"
      ? `game-${filters.selectedGameNumber}`
      : "",
    filters.timeFrame ? filters.timeFrame : "",
  ]
    .filter(Boolean)
    .map((part) =>
      part
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
    );

  return `${activeFilterParts.join("_") || "pin-sighter-stats"}.${extension}`;
}
