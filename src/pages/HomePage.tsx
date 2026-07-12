// The Home dashboard — an at-a-glance snapshot shown when the app opens.
// A "Showing" dropdown picks the main bowler (or the all-bowlers composite);
// every metric, recent set, and the trend reflect that choice. Numbers are read
// from the authoritative stored scores so they stay consistent with the Stats
// page; strike rate classifies frames the same way StatsPage does.

import { useState } from "react";
import type { Bowler, SavedGameRecord } from "../types";
import { gameDate } from "../lib/statsFilters";
import { buildSessionGroups } from "../lib/sessions";

type HomePageProps = {
  savedGames: SavedGameRecord[];
  bowlers: Bowler[];
  mainBowler: string;
  onChangeMainBowler: (name: string) => void;
  onLogGame: () => void;
  onOpenStats: () => void;
  onNewEvent: () => void;
};

function shortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function gameTopScore(game: SavedGameRecord): number | null {
  if (game.scores.length === 0) return null;
  return Math.max(...game.scores.map((s) => s.score));
}

export function HomePage({
  savedGames,
  bowlers,
  mainBowler,
  onChangeMainBowler,
  onLogGame,
  onOpenStats,
  onNewEvent,
}: HomePageProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Which roster bowlers actually appear in the saved games (composite scope).
  const rosterWithGames = bowlers.filter((bowler) =>
    savedGames.some((game) =>
      game.scores.some((score) => score.label === bowler.name),
    ),
  );
  const bowlerCount = rosterWithGames.length;

  // The active scope arrives already resolved by App: a valid roster name, the
  // sole bowler when there's only one, or "" for the all-bowlers composite.
  const selected = mainBowler;

  if (savedGames.length === 0) {
    return (
      <div className="dashboard">
        <section className="dash-empty">
          <h2>Welcome to Pin-Sighter</h2>
          <p>
            Log your first game to start building your averages, strike and
            spare trends, and set history. Everything stays on this device.
          </p>
          <button
            type="button"
            className="dash-action dash-action-primary"
            onClick={onLogGame}
          >
            <span className="dash-action-icon" aria-hidden="true">🎯</span>
            Log your first game
          </button>
        </section>
      </div>
    );
  }

  // Snapshot metrics, scoped to the selected bowler or the whole composite.
  const scopeScores = selected
    ? savedGames.flatMap((g) =>
        g.scores.filter((s) => s.label === selected).map((s) => s.score),
      )
    : savedGames.flatMap((g) => g.scores.map((s) => s.score));
  const scopeGames = selected
    ? savedGames.filter((g) => g.scores.some((s) => s.label === selected))
    : savedGames;
  const gamesLogged = scopeGames.length;
  const averageScore =
    scopeScores.length > 0
      ? Math.round((scopeScores.reduce((sum, s) => sum + s, 0) / scopeScores.length) * 10) / 10
      : 0;
  const highGame = scopeScores.length > 0 ? Math.max(...scopeScores) : 0;

  const scopeEntries = selected
    ? savedGames.flatMap((g) => g.entries.filter((e) => e.bowlerName === selected))
    : savedGames.flatMap((g) => g.entries);
  const strikeFrames = scopeEntries.filter(
    (e) => e.firstShotKnockedPins.length === 10,
  ).length;
  const strikeRate =
    scopeEntries.length > 0 ? Math.round((strikeFrames / scopeEntries.length) * 100) : 0;

  // Recent sets — for a bowler, show their series total; for the composite, the
  // set's high game. Skip sets the selected bowler didn't play.
  const recentSets = buildSessionGroups(savedGames)
    .map((session) => {
      const scopeSessionGames = selected
        ? session.games.filter((g) => g.scores.some((s) => s.label === selected))
        : session.games;
      if (scopeSessionGames.length === 0) return null;

      const setScores = selected
        ? scopeSessionGames.flatMap((g) =>
            g.scores.filter((s) => s.label === selected).map((s) => s.score),
          )
        : scopeSessionGames.flatMap((g) => g.scores.map((s) => s.score));
      const times = scopeSessionGames.map((g) => new Date(gameDate(g)).getTime());
      const latestGame = [...scopeSessionGames].sort(
        (a, b) => new Date(gameDate(b)).getTime() - new Date(gameDate(a)).getTime(),
      )[0];
      const headline = setScores.length
        ? selected
          ? setScores.reduce((sum, s) => sum + s, 0)
          : Math.max(...setScores)
        : null;

      return {
        key: session.sessionKey,
        latest: times.length > 0 ? Math.max(...times) : 0,
        dateISO: latestGame ? gameDate(latestGame) : "",
        center: session.centerName,
        gameCount: scopeSessionGames.length,
        competitionType: latestGame ? latestGame.competitionType : "",
        format: latestGame ? latestGame.format : "",
        headline,
        headlineTag: selected ? "series" : "high",
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .sort((a, b) => b.latest - a.latest)
    .slice(0, 5);

  // Trend: the selected bowler's score per game (or the game's top score for the
  // composite), most-recent 12, oldest → newest.
  const chronological = [...savedGames].sort(
    (a, b) => new Date(gameDate(a)).getTime() - new Date(gameDate(b)).getTime(),
  );
  const trendData = chronological
    .slice(-12)
    .map((g) => {
      const score = selected
        ? g.scores.find((s) => s.label === selected)?.score ?? null
        : gameTopScore(g);
      return { score, dateISO: gameDate(g) };
    })
    .filter((d): d is { score: number; dateISO: string } => d.score !== null);

  // Sparkline geometry (300 x 64 viewport, 6px vertical padding).
  const W = 300;
  const H = 64;
  const pad = 6;
  const tMin = trendData.length > 0 ? Math.min(...trendData.map((d) => d.score)) : 0;
  const tMax = trendData.length > 0 ? Math.max(...trendData.map((d) => d.score)) : 0;
  const tRange = tMax - tMin || 1;
  const points = trendData.map((d, i) => {
    const frac = trendData.length > 1 ? i / (trendData.length - 1) : 0.5;
    const x = frac * W;
    const y = H - pad - ((d.score - tMin) / tRange) * (H - pad * 2);
    return { x, y, frac, score: d.score, dateISO: d.dateISO };
  });
  const sparkPoints = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const hovered =
    hoverIndex !== null && hoverIndex >= 0 && hoverIndex < points.length
      ? points[hoverIndex]
      : null;

  return (
    <div className="dashboard">
      <div className="dash-scope">
        <label className="dash-scope-label" htmlFor="main-bowler-select">
          Showing
        </label>
        <select
          id="main-bowler-select"
          className="dash-scope-select"
          value={selected}
          onChange={(e) => onChangeMainBowler(e.target.value)}
        >
          <option value="">
            All bowlers{bowlerCount > 0 ? ` (${bowlerCount})` : ""}
          </option>
          {bowlers.map((bowler) => (
            <option key={bowler.id} value={bowler.name}>
              {bowler.name}
            </option>
          ))}
        </select>
        {selected === "" && bowlerCount > 1 && (
          <span className="dash-scope-note">
            composite across {bowlerCount} bowlers
          </span>
        )}
      </div>

      <div className="dash-metrics">
        <div className="stat-card">
          <strong>{gamesLogged}</strong>
          <span>Games logged</span>
        </div>
        <div className="stat-card">
          <strong>{averageScore}</strong>
          <span>Average score</span>
        </div>
        <div className="stat-card">
          <strong>{highGame}</strong>
          <span>High game</span>
        </div>
        <div className="stat-card">
          <strong>{strikeRate}%</strong>
          <span>Strike rate</span>
        </div>
      </div>

      <div className="dash-grid">
        <section className="dash-panel">
          <h3>Recent sets</h3>
          <ul className="dash-recent">
            {recentSets.map((set) => (
              <li className="dash-recent-row" key={set.key}>
                <span className="dash-recent-date">{shortDate(set.dateISO)}</span>
                <span className="dash-recent-where">
                  <span className="dash-recent-center">{set.center || "—"}</span>
                  <span className="dash-recent-meta">
                    {set.gameCount} {set.gameCount === 1 ? "game" : "games"}
                    {set.competitionType ? ` · ${set.competitionType}` : ""}
                    {set.format ? ` · ${set.format}` : ""}
                  </span>
                </span>
                <span className="dash-recent-score">
                  {set.headline ?? "—"}
                  <span className="dash-recent-score-tag">{set.headlineTag}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <div className="dash-side">
          {trendData.length >= 2 && (
            <section className="dash-panel">
              <h3>Recent scores</h3>
              <div
                className="dash-spark-wrap"
                onPointerMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  if (rect.width === 0) return;
                  const frac = (e.clientX - rect.left) / rect.width;
                  const idx = Math.round(frac * (points.length - 1));
                  setHoverIndex(Math.max(0, Math.min(points.length - 1, idx)));
                }}
                onPointerLeave={() => setHoverIndex(null)}
              >
                <svg
                  className="dash-spark"
                  viewBox={`0 0 ${W} ${H}`}
                  preserveAspectRatio="none"
                  role="img"
                  aria-label="Recent game scores trend"
                >
                  <polyline
                    className="dash-spark-line"
                    fill="none"
                    points={sparkPoints}
                  />
                  {hovered && (
                    <line
                      className="dash-spark-guide"
                      x1={hovered.x}
                      y1="0"
                      x2={hovered.x}
                      y2={H}
                    />
                  )}
                  <circle
                    className="dash-spark-dot"
                    cx={points[points.length - 1].x}
                    cy={points[points.length - 1].y}
                    r="3.5"
                  />
                  {hovered && (
                    <circle
                      className="dash-spark-hover-dot"
                      cx={hovered.x}
                      cy={hovered.y}
                      r="4"
                    />
                  )}
                </svg>
                {hovered && (
                  <div
                    className="dash-spark-tooltip"
                    style={{ left: `${hovered.frac * 100}%`, top: `${hovered.y}px` }}
                  >
                    <span className="dash-spark-tooltip-score">{hovered.score}</span>
                    <span className="dash-spark-tooltip-date">
                      {shortDate(hovered.dateISO)}
                    </span>
                  </div>
                )}
              </div>
              <p className="dash-spark-caption">
                {hovered
                  ? "Drag across the line to inspect each game"
                  : `Last ${trendData.length} games · high ${Math.max(
                      ...trendData.map((d) => d.score),
                    )}`}
              </p>
            </section>
          )}

          <section className="dash-panel">
            <h3>Quick actions</h3>
            <div className="dash-actions">
              <button
                type="button"
                className="dash-action dash-action-primary"
                onClick={onLogGame}
              >
                <span className="dash-action-icon" aria-hidden="true">🎯</span>
                Log a game
              </button>
              <button type="button" className="dash-action" onClick={onOpenStats}>
                <span className="dash-action-icon" aria-hidden="true">📊</span>
                Open Stats
              </button>
              <button type="button" className="dash-action" onClick={onNewEvent}>
                <span className="dash-action-icon" aria-hidden="true">🏆</span>
                New event
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
