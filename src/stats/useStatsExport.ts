// useStatsExport — the Stats page export subsystem as a hook: owns export
// format/section state + the export-modal focus trap, and builds CSV / Excel /
// HTML / print-to-PDF reports from the current filtered stat data. Extracted
// from StatsPage (shell lift, stage 3). StatsPage computes the stat data and
// passes it in as one object; the export modal JSX stays in StatsPage and
// consumes this hook's returned API.

import { useState, useRef, useEffect } from "react";
import type { FrameEntry, SavedGameRecord } from "../types";
import type { StatsFilters } from "../lib/statsFilters";
import type { SessionGroup } from "../lib/sessions";
import { getCumulativeFrameScores, getPinsStanding } from "../lib/scoring";
import { lockDocumentScroll, trapFocusWithinElement } from "../lib/domFocus";
import {
  formatMaybeNumber,
  formatPercentValue,
  formatSignedNumber,
} from "./board";
import {
  STATS_REPORT_CSS,
  buildStatsExportFileName,
  defaultStatsExportSections,
  formatScorecardFrameForExport,
  getUniqueBallSummary,
  type StatsExportFormat,
  type StatsExportSectionKey,
  type StatsExportSections,
} from "./export";
import { calculateBoardStats } from "./board";
import {
  calculateSpareLeaveRows,
  calculateSpareLeaveSummary,
} from "./spareLeaves";
import { calculateDetailedBowlerStats } from "./detailed";

export type BowlerBreakdownRow = {
  bowlerName: string;
  games: number;
  frames: number;
  average: number;
  highGame: number;
  highSeries: number;
  strikes: number;
  spares: number;
  opens: number;
  cleanGames: number;
  strikeRate: number;
  spareRate: number;
  cleanRate: number;
  splitRate: number;
};

export type StatsExportData = {
  filters: StatsFilters;
  selectedBowler: string;
  selectedBakerBowler: string;
  selectedBall: string;
  selectedCompetition: string;
  selectedEventName: string;
  selectedEventStage: string;
  selectedSetKey: string;
  selectedGameNumber: string;
  selectedCenter: string;
  selectedLane: string;
  selectedPattern: string;
  statsFilteredGames: SavedGameRecord[];
  sessionGroups: SessionGroup[];
  overallAverage: number;
  strikeCount: number;
  spareCount: number;
  openCount: number;
  splitCount: number;
  cleanGameCount: number;
  overviewHighGame: number;
  overviewHighThreeGameSeries: number;
  bowlerRows: BowlerBreakdownRow[];
  detailedStats: ReturnType<typeof calculateDetailedBowlerStats> | null;
  spareLeaveRows: ReturnType<typeof calculateSpareLeaveRows>;
  spareLeaveSummary: ReturnType<typeof calculateSpareLeaveSummary>;
  boardStats: ReturnType<typeof calculateBoardStats>;
  onToast: (message: string) => void;
};

export function useStatsExport(data: StatsExportData) {
  const {
    filters,
    selectedBowler,
    selectedBakerBowler,
    selectedBall,
    selectedCompetition,
    selectedEventName,
    selectedEventStage,
    selectedSetKey,
    selectedGameNumber,
    selectedCenter,
    selectedLane,
    selectedPattern,
    statsFilteredGames,
    sessionGroups,
    overallAverage,
    strikeCount,
    spareCount,
    openCount,
    splitCount,
    cleanGameCount,
    overviewHighGame,
    overviewHighThreeGameSeries,
    bowlerRows,
    detailedStats,
    spareLeaveRows,
    spareLeaveSummary,
    boardStats,
    onToast,
  } = data;

  const [exportFormat, setExportFormat] = useState<StatsExportFormat>("html");
  const [exportSections, setExportSections] = useState<StatsExportSections>({
    ...defaultStatsExportSections,
  });
  const [isExportPanelOpen, setIsExportPanelOpen] = useState(false);
  const exportModalRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isExportPanelOpen) {
      return;
    }

    const unlockDocumentScroll = lockDocumentScroll();
    const previouslyFocusedElement = document.activeElement as HTMLElement | null;

    window.setTimeout(() => exportModalRef.current?.focus(), 0);

    function handleExportModalKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsExportPanelOpen(false);
        return;
      }

      trapFocusWithinElement(event, exportModalRef.current);
    }

    document.addEventListener("keydown", handleExportModalKeyDown);

    return () => {
      document.removeEventListener("keydown", handleExportModalKeyDown);
      unlockDocumentScroll();
      previouslyFocusedElement?.focus();
    };
  }, [isExportPanelOpen]);

  function getStatsExportFilters() {
    const timeFrame = filters.timeFrame;
    const timeFrameToken =
      timeFrame.preset === "all"
        ? ""
        : timeFrame.preset === "custom"
        ? `${timeFrame.from || "from"}-to-${timeFrame.to || "now"}`
        : timeFrame.preset;

    return {
      selectedBowler,
      selectedBakerBowler,
      selectedBall,
      selectedCompetition,
      selectedEventName,
      selectedCenter,
      selectedLane,
      selectedPattern,
      selectedEventStage,
      selectedSetKey,
      selectedGameNumber,
      timeFrame: timeFrameToken,
    };
  }

  function getStatsExportFileName(extension: string) {
    return buildStatsExportFileName(getStatsExportFilters(), extension);
  }

  function getExportExtension() {
    if (exportFormat === "excel") {
      return "xlsx";
    }

    if (exportFormat === "pdf") {
      return "pdf";
    }

    return exportFormat;
  }

  function getExportFormatLabel() {
    if (exportFormat === "excel") {
      return "Excel workbook (.xlsx)";
    }

    if (exportFormat === "pdf") {
      return "Print / Save as PDF";
    }

    return exportFormat.toUpperCase();
  }


  function downloadTextFile(
    fileName: string,
    content: string,
    mimeType: string
  ) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = fileName;
    link.click();

    URL.revokeObjectURL(url);
  }

  function escapeCsv(value: string | number) {
    const stringValue = String(value);

    if (
      stringValue.includes(",") ||
      stringValue.includes('"') ||
      stringValue.includes("\n")
    ) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
  }

  function escapeHtml(value: string | number) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function hasSelectedExportSections() {
    return Object.values(exportSections).some(Boolean);
  }

  function toggleExportSection(sectionKey: StatsExportSectionKey) {
    setExportSections((currentSections) => ({
      ...currentSections,
      [sectionKey]: !currentSections[sectionKey],
    }));
  }

  function applyExportPreset(
    preset: "summary" | "scores" | "scorecards" | "detailed" | "full"
  ) {
    if (preset === "summary") {
      setExportSections({
        overview: true,
        activeFilters: true,
        savedSets: true,
        gameScores: false,
        scorecards: false,
        bowlerBreakdown: true,
        detailedAnalysis: false,
        spareLeaves: false,
        targeting: false,
        frameDetails: false,
      });
      return;
    }

    if (preset === "scores") {
      setExportSections({
        overview: false,
        activeFilters: true,
        savedSets: true,
        gameScores: true,
        scorecards: false,
        bowlerBreakdown: false,
        detailedAnalysis: false,
        spareLeaves: false,
        targeting: false,
        frameDetails: false,
      });
      return;
    }

    if (preset === "scorecards") {
      setExportSections({
        overview: false,
        activeFilters: true,
        savedSets: true,
        gameScores: true,
        scorecards: true,
        bowlerBreakdown: false,
        detailedAnalysis: false,
        spareLeaves: false,
        targeting: false,
        frameDetails: false,
      });
      return;
    }

    if (preset === "detailed") {
      setExportSections({
        overview: true,
        activeFilters: true,
        savedSets: false,
        gameScores: false,
        scorecards: false,
        bowlerBreakdown: true,
        detailedAnalysis: true,
        spareLeaves: true,
        targeting: true,
        frameDetails: false,
      });
      return;
    }

    setExportSections({
      overview: true,
      activeFilters: true,
      savedSets: true,
      gameScores: true,
      scorecards: true,
      bowlerBreakdown: true,
      detailedAnalysis: true,
      spareLeaves: true,
      targeting: true,
      frameDetails: true,
    });
  }

  function describeScopeLabel() {
    if (filters.mode === "baker") {
      const team =
        filters.selection === "All"
          ? "All teams"
          : filters.selection.replace(/^Baker Team:\s*/, "");
      return filters.bakerBowler !== "All"
        ? `Baker — ${team} — ${filters.bakerBowler}`
        : `Baker — ${team}`;
    }
    if (filters.mode === "individual") {
      return filters.selection === "All"
        ? "Individual — all bowlers"
        : `Individual — ${filters.selection}`;
    }
    return "All bowlers";
  }

  function describeTimeFrameLabel() {
    const timeFrame = filters.timeFrame;
    if (timeFrame.preset === "custom") {
      return `${timeFrame.from || "…"} to ${timeFrame.to || "…"}`;
    }
    const presetLabels: Record<string, string> = {
      all: "All time",
      thisWeek: "This week",
      thisMonth: "This month",
      thisYear: "This year",
      last7: "Last 7 days",
      last30: "Last 30 days",
      last90: "Last 90 days",
    };
    return presetLabels[timeFrame.preset] ?? "All time";
  }

  function getActiveFilterRows() {
    const rows: (string | number)[][] = [["Scope", describeScopeLabel()]];

    if (filters.timeFrame.preset !== "all") {
      rows.push(["Time Frame", describeTimeFrameLabel()]);
    }

    const conditionalRows = [
      ["Ball", selectedBall],
      ["Competition", selectedCompetition],
      ["League / Tournament", selectedEventName],
      ["Week / Day", selectedEventStage],
      ["Set", selectedSetKey === "All" ? "All" : "Selected set"],
      ["Game", selectedGameNumber],
      ["Bowling Center", selectedCenter],
      ["Lane / Pair", selectedLane],
      ["Pattern", selectedPattern],
    ].filter(([, value]) => value !== "All");

    return [...rows, ...conditionalRows];
  }

  function getOverviewExportRows() {
    return [
      ["Saved Sets", sessionGroups.length],
      ["Total Games", statsFilteredGames.length],
      ["Average", overallAverage.toFixed(1)],
      ["Strikes", strikeCount],
      ["Spares", spareCount],
      ["Opens", openCount],
      ["Splits", splitCount],
      ["Clean Games", cleanGameCount],
      ["High Game", overviewHighGame || "—"],
      ["High Series (3-game)", overviewHighThreeGameSeries || "—"],
    ];
  }

  function getSetSummaryExportRows() {
    return sessionGroups.map((session) => [
      session.title,
      session.games.length,
      session.games[0]?.centerName ?? "",
      session.games[0]?.patternName ?? "",
      session.games.map((game) => game.laneLabel).join(" → "),
      session.games
        .flatMap((game) =>
          game.scores.map((score) => `${score.label}: ${score.score}`)
        )
        .join(" • "),
      session.games[0]?.setNotes ?? "",
    ]);
  }

  function getGameSummaryExportRows() {
    return statsFilteredGames.flatMap((game) =>
      game.scores.map((score) => [
        new Date(game.createdAt ?? game.savedAt).toLocaleString(),
        new Date(game.savedAt).toLocaleString(),
        game.competitionType,
        game.eventName || "Open",
        game.eventStageLabel || "",
        game.gameNumber,
        game.centerName,
        game.patternName,
        game.format,
        game.laneLabel,
        game.setNotes ?? "",
        game.gameNotes ?? "",
        game.ballReactionNotes ?? "",
        game.laneTransitionNotes ?? "",
        game.adjustmentNotes ?? "",
        score.label,
        score.score,
      ])
    );
  }

  function getScorecardExportRows() {
    return statsFilteredGames.flatMap((game) => {
      const scorecardGroups =
        game.format === "Baker"
          ? [
              {
                label: game.scores[0]?.label ?? "Baker Team",
                score: game.scores[0]?.score ?? "",
                entries: game.entries,
              },
            ]
          : game.scores.map((score) => ({
              label: score.label,
              score: score.score,
              entries: game.entries.filter((entry) => {
                const matchesBowler = entry.bowlerName === score.label;
                const matchesBall =
                  selectedBall === "All" || entry.ballUsed === selectedBall;

                return matchesBowler && matchesBall;
              }),
            }));

      return scorecardGroups.map((group) => {
        const framesByNumber = new Map<number, FrameEntry>();

        group.entries.forEach((entry) => {
          framesByNumber.set(entry.frameNumber, entry);
        });

        const orderedEntries = Array.from(framesByNumber.values()).sort(
          (a, b) => a.frameNumber - b.frameNumber
        );
        const cumulativeScores = getCumulativeFrameScores(orderedEntries);
        const frameCells = Array.from({ length: 10 }, (_, index) => {
          const frameNumber = index + 1;
          const frame = framesByNumber.get(frameNumber);
          const cumulativeScore = frame ? cumulativeScores[index] : "";

          return formatScorecardFrameForExport(frame, cumulativeScore);
        });

        return [
          game.eventName || "Open",
          game.eventStageLabel || "",
          game.gameNumber,
          game.laneLabel,
          group.label,
          ...frameCells,
          group.score || cumulativeScores[cumulativeScores.length - 1] || "",
          getUniqueBallSummary(group.entries),
        ];
      });
    });
  }

  function getBowlerBreakdownExportRows() {
    return bowlerRows.map((row) => [
      row.bowlerName,
      row.games,
      row.average.toFixed(1),
      row.highGame || "—",
      row.highSeries || "—",
      row.frames,
      row.strikes,
      row.spares,
      row.opens,
      row.cleanGames,
      `${row.strikeRate.toFixed(1)}%`,
      `${row.cleanRate.toFixed(1)}%`,
      `${row.splitRate.toFixed(1)}%`,
    ]);
  }

  function getDetailedAnalysisTitle() {
    if (!detailedStats) {
      return "Detailed Stat Analysis";
    }

    return `Detailed Stat Analysis — ${selectedBowler}${
      selectedBall !== "All" ? ` with ${selectedBall}` : ""
    }`;
  }

  function getDetailedAnalysisUnavailableRows() {
    return [
      [
        "Detailed Stat Analysis",
        "Select one individual bowler in the Stats filters to export detailed bowler analysis.",
      ],
    ];
  }

  function getDetailedAnalysisStatsExportRows() {
    if (!detailedStats) {
      return getDetailedAnalysisUnavailableRows();
    }

    return [
      ["Total Games", detailedStats.numGames],
      ["Average", detailedStats.average.toFixed(1)],
      [
        "High 3-Game Series",
        detailedStats.highThreeGameSeries > 0
          ? detailedStats.highThreeGameSeries
          : "—",
      ],
      [
        "High 4-Game Series",
        detailedStats.highFourGameSeries > 0
          ? detailedStats.highFourGameSeries
          : "—",
      ],
      ["Pocket Percentage", `${detailedStats.pocketPercentage.toFixed(1)}%`],
      ["Carry Percentage", `${detailedStats.carryPercentage.toFixed(1)}%`],
      ["Double Percentage", `${detailedStats.doublePercentage.toFixed(1)}%`],
      [
        "Makeable Spare Conversion",
        `${detailedStats.makeableSpareConversion.toFixed(1)}%`,
      ],
      ["Clean Percentage", `${detailedStats.cleanPercentage.toFixed(1)}%`],
      ["Split Percentage", `${detailedStats.splitPercentage.toFixed(1)}%`],
      ["Clean Games", detailedStats.cleanGames],
      ["First Ball Average", detailedStats.firstBallAverage.toFixed(2)],
    ];
  }

  function getAverageFrameScoreExportRows() {
    if (!detailedStats) {
      return getDetailedAnalysisUnavailableRows();
    }

    return detailedStats.frameScoreRows.map((row) => [
      `Frame ${row.frameNumber}`,
      row.average.toFixed(1),
    ]);
  }

  function getAverageByGameExportRows() {
    if (!detailedStats) {
      return getDetailedAnalysisUnavailableRows();
    }

    return detailedStats.averageByGameRows.map((row) => [
      `Game ${row.gameNumber}`,
      row.count,
      row.average.toFixed(1),
      row.high,
      row.low,
    ]);
  }

  function getGameScoreDistributionExportHeaders() {
    if (!detailedStats) {
      return ["Section", "Message"];
    }

    return [
      "Games",
      ...detailedStats.scoreDistribution.gameNumbers.map(
        (gameNumber) => `Game ${gameNumber}`
      ),
      "Total",
      "%",
    ];
  }

  function getGameScoreDistributionExportRows() {
    if (!detailedStats) {
      return getDetailedAnalysisUnavailableRows();
    }

    return detailedStats.scoreDistribution.gameRows.map((row) => [
      row.label,
      ...detailedStats.scoreDistribution.gameNumbers.map(
        (gameNumber) => row.gameCounts[gameNumber] ?? 0
      ),
      row.total,
      `${row.percentage.toFixed(1)}%`,
    ]);
  }

  function getSeriesScoreDistributionExportRows() {
    if (!detailedStats) {
      return getDetailedAnalysisUnavailableRows();
    }

    return detailedStats.scoreDistribution.seriesRows.map((row) => [
      row.label,
      row.total,
      `${row.percentage.toFixed(1)}%`,
    ]);
  }

  function getTransitionPhaseExportRows() {
    if (!detailedStats) {
      return getDetailedAnalysisUnavailableRows();
    }

    return detailedStats.transitionRows.map((row) => [
      row.phase,
      row.frames,
      row.strikes,
      row.spares,
      row.opens,
      row.splits,
      `${row.strikePercentage.toFixed(1)}%`,
      `${row.cleanPercentage.toFixed(1)}%`,
    ]);
  }

  function getSpareLeaveSummaryExportRows() {
    return [
      [
        "Makeable Pickup",
        spareLeaveSummary.makeable.attempts,
        spareLeaveSummary.makeable.conversions,
        `${spareLeaveSummary.makeable.percentage.toFixed(1)}%`,
      ],
      [
        "Single Pin Pickup",
        spareLeaveSummary.singlePin.attempts,
        spareLeaveSummary.singlePin.conversions,
        `${spareLeaveSummary.singlePin.percentage.toFixed(1)}%`,
      ],
      [
        "Multi Pin Pickup",
        spareLeaveSummary.multiPin.attempts,
        spareLeaveSummary.multiPin.conversions,
        `${spareLeaveSummary.multiPin.percentage.toFixed(1)}%`,
      ],
      [
        "Split Pickup",
        spareLeaveSummary.split.attempts,
        spareLeaveSummary.split.conversions,
        `${spareLeaveSummary.split.percentage.toFixed(1)}%`,
      ],
    ];
  }

  function getSpareLeaveExportRows() {
    return spareLeaveRows.map((row) => [
      row.leave,
      row.attempts,
      row.conversions,
      row.misses,
      `${row.conversionPercentage.toFixed(1)}%`,
    ]);
  }

  function getTargetingSummaryExportRows() {
    return [
      ["Tracked Shots", boardStats.trackedShots],
      ["Avg Arrow Miss", formatSignedNumber(boardStats.averageArrowMiss)],
      ["Avg Abs Arrow Miss", formatMaybeNumber(boardStats.averageAbsoluteArrowMiss)],
      ["Arrow ±1 Board", formatPercentValue(boardStats.arrowHitRate)],
      ["Avg Breakpoint Miss", formatSignedNumber(boardStats.averageBreakpointMiss)],
      [
        "Avg Abs Breakpoint Miss",
        formatMaybeNumber(boardStats.averageAbsoluteBreakpointMiss),
      ],
      ["Breakpoint ±1 Board", formatPercentValue(boardStats.breakpointHitRate)],
    ];
  }

  function getTargetingByBallExportRows() {
    return boardStats.byBallRows.map((row) => [
      row.ball,
      row.shots,
      formatSignedNumber(row.averageArrowMiss),
      formatMaybeNumber(row.averageAbsoluteArrowMiss),
      formatPercentValue(row.arrowHitRate),
      formatSignedNumber(row.averageBreakpointMiss),
      formatMaybeNumber(row.averageAbsoluteBreakpointMiss),
      formatPercentValue(row.breakpointHitRate),
    ]);
  }

  function getFrameExportRows() {
    return statsFilteredGames.flatMap((game) =>
      game.entries.map((entry) => [
        game.eventName || "Open",
        game.eventStageLabel || "",
        game.gameNumber,
        game.centerName,
        game.patternName,
        game.laneLabel,
        entry.bowlerName,
        entry.frameNumber,
        entry.ballUsed || "",
        entry.firstShotKnockedPins.join("-") || "0",
        entry.secondShotKnockedPins.join("-") || "0",
        entry.thirdShotKnockedPins.join("-") || "0",
        getPinsStanding(entry.firstShotKnockedPins).join("-") || "None",
        entry.footBoard || "",
        entry.targetArrow || "",
        entry.actualArrow || "",
        entry.targetBreakpoint || "",
        entry.actualBreakpoint || "",
      ])
    );
  }

  function buildHtmlTable(
    title: string,
    headers: string[],
    rows: (string | number)[][]
  ) {
    const cellText = (value: string | number) => String(value ?? "").trim();
    const isNumericCell = (value: string | number) => {
      const text = cellText(value);
      if (text === "") return false;
      if (typeof value === "number") return true;
      return /^-?[\d,]+(\.\d+)?%?$/.test(text);
    };
    const isDateHeader = (header: string) => /(\bat|date)$/i.test(header.trim());
    const columnValues = (index: number) =>
      rows.map((row) => cellText(row[index])).join("");
    const emphasisHeaders = new Set([
      "score",
      "total",
      "average",
      "high game",
      "high series",
      "high series (3-game)",
    ]);

    // Keep columns that carry data, and merge duplicate date columns
    // (e.g. Created At / Saved At when identical) — kept narrow to date
    // headers so identical-looking value columns (scorecard frames) survive.
    const keptIndexes: number[] = [];
    headers.forEach((header, index) => {
      const hasValue =
        rows.length === 0 || rows.some((row) => cellText(row[index]) !== "");
      if (!hasValue) {
        return;
      }
      const duplicateDate =
        isDateHeader(header) &&
        rows.length > 0 &&
        keptIndexes.some(
          (kept) =>
            isDateHeader(headers[kept]) &&
            columnValues(kept) === columnValues(index)
        );
      if (!duplicateDate) {
        keptIndexes.push(index);
      }
    });

    const columnMeta = keptIndexes.map((index) => {
      const nonEmpty = rows
        .map((row) => row[index])
        .filter((value) => cellText(value) !== "");
      return {
        index,
        numeric: nonEmpty.length > 0 && nonEmpty.every(isNumericCell),
        emphasis: emphasisHeaders.has(headers[index].trim().toLowerCase()),
      };
    });

    const classFor = (meta: { numeric: boolean; emphasis: boolean }) =>
      [meta.numeric ? "num" : "", meta.emphasis ? "emph" : ""]
        .filter(Boolean)
        .join(" ");

    const headerHtml = columnMeta
      .map(
        (meta) =>
          `<th class="${classFor(meta)}">${escapeHtml(headers[meta.index])}</th>`
      )
      .join("");

    const rowHtml =
      rows.length > 0
        ? rows
            .map(
              (row) =>
                `<tr>${columnMeta
                  .map((meta) => {
                    const raw = row[meta.index];
                    const value = escapeHtml(raw);
                    const perfect = meta.emphasis && cellText(raw) === "300";
                    return `<td class="${classFor(meta)}">${
                      perfect
                        ? `<span class="perfect-pill">${value}</span>`
                        : value
                    }</td>`;
                  })
                  .join("")}</tr>`
            )
            .join("")
        : `<tr><td class="empty" colspan="${columnMeta.length}">No data for this section.</td></tr>`;

    return `
      <section class="report-section">
        <h2>${escapeHtml(title)}</h2>
        <div class="table-wrap">
          <table>
            <thead><tr>${headerHtml}</tr></thead>
            <tbody>${rowHtml}</tbody>
          </table>
        </div>
      </section>
    `;
  }

  function buildStatsReportHtml(
    options: {
      autoPrint?: boolean;
      sections?: StatsExportSections;
    } = {}
  ) {
    const sections = options.sections ?? exportSections;
    const activeFilterRows = getActiveFilterRows();
    const exportedAt = new Date().toLocaleString();
    const reportSections: string[] = [];

    if (sections.activeFilters) {
      reportSections.push(
        buildHtmlTable(
          "Active Filters",
          ["Filter", "Value"],
          activeFilterRows.length > 0 ? activeFilterRows : [["Filters", "All"]]
        )
      );
    }

    if (sections.savedSets) {
      reportSections.push(
        buildHtmlTable(
          "Saved Sets",
          [
            "Set",
            "Games",
            "Center",
            "Pattern",
            "Lane / Pair Flow",
            "Scores",
            "Set Notes",
          ],
          getSetSummaryExportRows()
        )
      );
    }

    if (sections.gameScores) {
      reportSections.push(
        buildHtmlTable(
          "Game Scores",
          [
            "Created At",
            "Saved At",
            "Competition",
            "Event",
            "Week / Day",
            "Game",
            "Center",
            "Pattern",
            "Format",
            "Lane / Pair",
            "Set Notes",
            "Game Notes",
            "Ball Reaction Notes",
            "Lane Transition Notes",
            "Adjustment Notes",
            "Score Label",
            "Score",
          ],
          getGameSummaryExportRows()
        )
      );
    }

    if (sections.scorecards) {
      reportSections.push(
        buildHtmlTable(
          "Scorecards",
          [
            "Event",
            "Week / Day",
            "Game",
            "Lane / Pair",
            "Bowler / Team",
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9",
            "10",
            "Total",
            "Ball(s)",
          ],
          getScorecardExportRows()
        )
      );
    }

    if (sections.bowlerBreakdown) {
      reportSections.push(
        buildHtmlTable(
          "Bowler Breakdown",
          [
            "Bowler",
            "Games",
            "Average",
            "High Game",
            "High Series",
            "Frames",
            "Strikes",
            "Spares",
            "Opens",
            "Clean Games",
            "Strike %",
            "Clean %",
            "Split %",
          ],
          getBowlerBreakdownExportRows()
        )
      );
    }

    if (sections.detailedAnalysis) {
      reportSections.push(
        buildHtmlTable(
          getDetailedAnalysisTitle(),
          detailedStats ? ["Metric", "Value"] : ["Section", "Message"],
          getDetailedAnalysisStatsExportRows()
        )
      );
      reportSections.push(
        buildHtmlTable(
          "Average Frame Score",
          detailedStats ? ["Frame", "Average Score"] : ["Section", "Message"],
          getAverageFrameScoreExportRows()
        )
      );
      reportSections.push(
        buildHtmlTable(
          "Average by Game",
          detailedStats
            ? ["Game", "Games Tracked", "Average", "High", "Low"]
            : ["Section", "Message"],
          getAverageByGameExportRows()
        )
      );
      reportSections.push(
        buildHtmlTable(
          "Score Distribution — Games",
          getGameScoreDistributionExportHeaders(),
          getGameScoreDistributionExportRows()
        )
      );
      reportSections.push(
        buildHtmlTable(
          "Score Distribution — Series",
          detailedStats ? ["Series", "Total", "%"] : ["Section", "Message"],
          getSeriesScoreDistributionExportRows()
        )
      );
      reportSections.push(
        buildHtmlTable(
          "Transitional Phase Breakdown",
          detailedStats
            ? [
                "Phase",
                "Frames",
                "Strikes",
                "Spares",
                "Opens",
                "Splits",
                "Strike %",
                "Clean %",
              ]
            : ["Section", "Message"],
          getTransitionPhaseExportRows()
        )
      );
    }

    if (sections.spareLeaves) {
      reportSections.push(
        buildHtmlTable(
          "Spare Pickup Summary",
          ["Category", "Attempts", "Conversions", "Pickup %"],
          getSpareLeaveSummaryExportRows()
        )
      );
      reportSections.push(
        buildHtmlTable(
          "Spare Leave Breakdown",
          ["Leave", "Attempts", "Conversions", "Misses", "Pickup %"],
          getSpareLeaveExportRows()
        )
      );
    }

    if (sections.targeting) {
      reportSections.push(
        buildHtmlTable(
          "Targeting Summary",
          ["Metric", "Value"],
          getTargetingSummaryExportRows()
        )
      );
      reportSections.push(
        buildHtmlTable(
          "Targeting by Ball",
          [
            "Ball",
            "Shots",
            "Avg Arrow Miss",
            "Avg Abs Arrow Miss",
            "Arrow ±1 Board",
            "Avg Breakpoint Miss",
            "Avg Abs Breakpoint Miss",
            "Breakpoint ±1 Board",
          ],
          getTargetingByBallExportRows()
        )
      );
    }

    if (sections.frameDetails) {
      reportSections.push(
        buildHtmlTable(
          "Frame / Shot Details",
          [
            "Event",
            "Week / Day",
            "Game",
            "Center",
            "Pattern",
            "Lane / Pair",
            "Bowler",
            "Frame",
            "Ball",
            "First Shot Pins",
            "Second Shot Pins",
            "Third Shot Pins",
            "First Ball Leave",
            "Foot Board",
            "Target Arrow",
            "Actual Arrow",
            "Target Breakpoint",
            "Actual Breakpoint",
          ],
          getFrameExportRows()
        )
      );
    }

    const heroLabels = new Set([
      "Average",
      "High Game",
      "High Series (3-game)",
    ]);
    const overviewHtml = sections.overview
      ? `<div class="overview">${getOverviewExportRows()
          .map(
            ([label, value]) =>
              `<article class="tile ${
                heroLabels.has(String(label)) ? "hero" : ""
              }"><span class="tile-value">${escapeHtml(
                value
              )}</span><span class="tile-label">${escapeHtml(
                label
              )}</span></article>`
          )
          .join("")}</div>`
      : "";

    const scopeMetaHtml =
      filters.timeFrame.preset !== "all"
        ? `<strong>${escapeHtml(describeScopeLabel())}</strong> · ${escapeHtml(
            describeTimeFrameLabel()
          )}`
        : `<strong>${escapeHtml(describeScopeLabel())}</strong>`;

    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Pin-Sighter Stats Report</title>
  <style>${STATS_REPORT_CSS}</style>
</head>
<body>
  <div class="page">
    <header class="report-head">
      <div class="brand">
        <span class="mark" aria-hidden="true"></span>
        <div>
          <h1>Pin-Sighter</h1>
          <p class="sub">Stats Report</p>
        </div>
      </div>
      <div class="meta">
        <span>${scopeMetaHtml}</span>
        <span>${statsFilteredGames.length} game${
      statsFilteredGames.length === 1 ? "" : "s"
    } · ${sessionGroups.length} saved set${
      sessionGroups.length === 1 ? "" : "s"
    }</span>
        <span>Exported ${escapeHtml(exportedAt)}</span>
      </div>
    </header>

    ${overviewHtml}

    ${reportSections.join("")}
  </div>

  ${
    options.autoPrint
      ? `<script>
          window.addEventListener("load", () => {
            window.focus();
            window.print();
          });
        </script>`
      : ""
  }
</body>
</html>`;
  }

  function appendCsvSection(
    rows: (string | number)[][],
    title: string,
    headers: string[],
    dataRows: (string | number)[][]
  ) {
    rows.push([title]);
    rows.push(headers);
    rows.push(...dataRows);
    rows.push([]);
  }

  function buildStatsExportRows(
    sections: StatsExportSections
  ): (string | number)[][] {
    const rows: (string | number)[][] = [];

    if (sections.overview) {
      appendCsvSection(rows, "Overview", ["Metric", "Value"], getOverviewExportRows());
    }

    if (sections.activeFilters) {
      const activeFilterRows = getActiveFilterRows();

      appendCsvSection(
        rows,
        "Active Filters",
        ["Filter", "Value"],
        activeFilterRows.length > 0 ? activeFilterRows : [["Filters", "All"]]
      );
    }

    if (sections.savedSets) {
      appendCsvSection(
        rows,
        "Saved Sets",
        ["Set", "Games", "Center", "Pattern", "Lane / Pair Flow", "Scores", "Set Notes"],
        getSetSummaryExportRows()
      );
    }

    if (sections.gameScores) {
      appendCsvSection(
        rows,
        "Game Scores",
        [
          "Created At",
          "Saved At",
          "Competition",
          "Event",
          "Week/Day",
          "Game",
          "Center",
          "Pattern",
          "Format",
          "Lane",
          "Set Notes",
          "Game Notes",
          "Score Label",
          "Score",
        ],
        getGameSummaryExportRows()
      );
    }

    if (sections.scorecards) {
      appendCsvSection(
        rows,
        "Scorecards",
        [
          "Event",
          "Week/Day",
          "Game",
          "Lane/Pair",
          "Bowler/Team",
          "1",
          "2",
          "3",
          "4",
          "5",
          "6",
          "7",
          "8",
          "9",
          "10",
          "Total",
          "Ball(s)",
        ],
        getScorecardExportRows()
      );
    }

    if (sections.bowlerBreakdown) {
      appendCsvSection(
        rows,
        "Bowler Breakdown",
        [
          "Bowler",
          "Games",
          "Average",
          "High Game",
          "High Series",
          "Frames",
          "Strikes",
          "Spares",
          "Opens",
          "Clean Games",
          "Strike %",
          "Clean %",
          "Split %",
        ],
        getBowlerBreakdownExportRows()
      );
    }

    if (sections.detailedAnalysis) {
      appendCsvSection(
        rows,
        getDetailedAnalysisTitle(),
        detailedStats ? ["Metric", "Value"] : ["Section", "Message"],
        getDetailedAnalysisStatsExportRows()
      );
      appendCsvSection(
        rows,
        "Average Frame Score",
        detailedStats ? ["Frame", "Average Score"] : ["Section", "Message"],
        getAverageFrameScoreExportRows()
      );
      appendCsvSection(
        rows,
        "Average by Game",
        detailedStats
          ? ["Game", "Games Tracked", "Average", "High", "Low"]
          : ["Section", "Message"],
        getAverageByGameExportRows()
      );
      appendCsvSection(
        rows,
        "Score Distribution - Games",
        getGameScoreDistributionExportHeaders(),
        getGameScoreDistributionExportRows()
      );
      appendCsvSection(
        rows,
        "Score Distribution - Series",
        detailedStats ? ["Series", "Total", "%"] : ["Section", "Message"],
        getSeriesScoreDistributionExportRows()
      );
      appendCsvSection(
        rows,
        "Transitional Phase Breakdown",
        detailedStats
          ? [
              "Phase",
              "Frames",
              "Strikes",
              "Spares",
              "Opens",
              "Splits",
              "Strike %",
              "Clean %",
            ]
          : ["Section", "Message"],
        getTransitionPhaseExportRows()
      );
    }

    if (sections.spareLeaves) {
      appendCsvSection(
        rows,
        "Spare Pickup Summary",
        ["Category", "Attempts", "Conversions", "Pickup %"],
        getSpareLeaveSummaryExportRows()
      );
      appendCsvSection(
        rows,
        "Spare Leave Breakdown",
        ["Leave", "Attempts", "Conversions", "Misses", "Pickup %"],
        getSpareLeaveExportRows()
      );
    }

    if (sections.targeting) {
      appendCsvSection(
        rows,
        "Targeting Summary",
        ["Metric", "Value"],
        getTargetingSummaryExportRows()
      );
      appendCsvSection(
        rows,
        "Targeting by Ball",
        [
          "Ball",
          "Shots",
          "Avg Arrow Miss",
          "Avg Abs Arrow Miss",
          "Arrow ±1 Board",
          "Avg Breakpoint Miss",
          "Avg Abs Breakpoint Miss",
          "Breakpoint ±1 Board",
        ],
        getTargetingByBallExportRows()
      );
    }

    if (sections.frameDetails) {
      appendCsvSection(
        rows,
        "Frame / Shot Details",
        [
          "Event",
          "Week/Day",
          "Game",
          "Center",
          "Pattern",
          "Lane",
          "Bowler",
          "Frame",
          "Ball",
          "First Shot Pins",
          "Second Shot Pins",
          "Third Shot Pins",
          "First Ball Leave",
          "Foot Board",
          "Target Arrow",
          "Actual Arrow",
          "Target Breakpoint",
          "Actual Breakpoint",
        ],
        getFrameExportRows()
      );
    }

    return rows;
  }

  function buildSelectedCsv(sections: StatsExportSections) {
    return buildStatsExportRows(sections)
      .map((row) => row.map((cell) => escapeCsv(cell)).join(","))
      .join("\n");
  }

  async function runStatsExport() {
    if (!hasSelectedExportSections()) {
      window.alert("Select at least one export section.");
      return;
    }

    if (exportFormat === "csv") {
      downloadTextFile(
        getStatsExportFileName("csv"),
        buildSelectedCsv(exportSections),
        "text/csv;charset=utf-8"
      );
      onToast(`CSV exported as ${getStatsExportFileName("csv")}.`);
      setIsExportPanelOpen(false);
      return;
    }

    if (exportFormat === "excel") {
      // Loaded on demand so SheetJS is its own chunk, out of the main bundle.
      const xlsx = await import("xlsx");
      const worksheet = xlsx.utils.aoa_to_sheet(
        buildStatsExportRows(exportSections)
      );
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, "Pin-Sighter Stats");
      const workbookData = xlsx.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const fileName = getStatsExportFileName("xlsx");
      const blob = new Blob([workbookData], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
      onToast(`Excel workbook exported as ${fileName}.`);
      setIsExportPanelOpen(false);
      return;
    }

    if (exportFormat === "html") {
      downloadTextFile(
        getStatsExportFileName("html"),
        buildStatsReportHtml({ sections: exportSections }),
        "text/html;charset=utf-8"
      );
      onToast(`HTML report exported as ${getStatsExportFileName("html")}.`);
      setIsExportPanelOpen(false);
      return;
    }

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      window.alert("Allow pop-ups to open the print view for this report.");
      return;
    }

    printWindow.document.open();
    printWindow.document.write(
      buildStatsReportHtml({ autoPrint: true, sections: exportSections })
    );
    printWindow.document.close();
    onToast('Print view opened — choose "Save as PDF" to keep a copy.');
    setIsExportPanelOpen(false);
  }

  return {
    exportFormat,
    setExportFormat,
    exportSections,
    setExportSections,
    isExportPanelOpen,
    setIsExportPanelOpen,
    exportModalRef,
    getStatsExportFileName,
    getExportExtension,
    getExportFormatLabel,
    hasSelectedExportSections,
    toggleExportSection,
    applyExportPreset,
    runStatsExport,
  };
}
