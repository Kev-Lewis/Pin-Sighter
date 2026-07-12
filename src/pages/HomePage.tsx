// The Home dashboard — an at-a-glance snapshot shown when the app opens.
// Numbers are read from the authoritative stored values on each saved game
// (game.scores) so they stay consistent with the Stats page; strike rate is
// classified inline the same way StatsPage does (a frame is a strike when the
// first shot knocks all 10). Session/series grouping still lives in App.tsx,
// so "recent" is by game date for now rather than grouped sets.

import type { SavedGameRecord } from "../types";
import { gameDate } from "../lib/statsFilters";
import { buildSessionGroups } from "../lib/sessions";

type HomePageProps = {
  savedGames: SavedGameRecord[];
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
  onLogGame,
  onOpenStats,
  onNewEvent,
}: HomePageProps) {
  if (savedGames.length === 0) {
    return (
      <div className="dashboard">
        <section className="dash-empty">
          <h2>Welcome to Pin-Sighter</h2>
          <p>
            Log your first game to start building your averages, strike and
            spare trends, and set history. Everything stays on this device.
          </p>
          <button type="button" className="dash-action dash-action-primary" onClick={onLogGame}>
            <span className="dash-action-icon" aria-hidden="true">🎯</span>
            Log your first game
          </button>
        </section>
      </div>
    );
  }

  // Snapshot metrics — mean/max over the authoritative stored scores.
  const allScores = savedGames.flatMap((g) => g.scores.map((s) => s.score));
  const gamesLogged = savedGames.length;
  const averageScore =
    allScores.length > 0
      ? Math.round((allScores.reduce((sum, s) => sum + s, 0) / allScores.length) * 10) / 10
      : 0;
  const highGame = allScores.length > 0 ? Math.max(...allScores) : 0;

  const allEntries = savedGames.flatMap((g) => g.entries);
  const strikeFrames = allEntries.filter(
    (e) => e.firstShotKnockedPins.length === 10,
  ).length;
  const strikeRate =
    allEntries.length > 0 ? Math.round((strikeFrames / allEntries.length) * 100) : 0;

  // Chronological order for recency + trend.
  const chronological = [...savedGames].sort(
    (a, b) => new Date(gameDate(a)).getTime() - new Date(gameDate(b)).getTime(),
  );
  // Group games into sessions ("sets") and surface the most recent few, so a
  // multi-game league night collapses into one row instead of repeating.
  const recentSets = buildSessionGroups(savedGames)
    .map((session) => {
      const times = session.games.map((g) => new Date(gameDate(g)).getTime());
      const setScores = session.games.flatMap((g) => g.scores.map((s) => s.score));
      const latestGame = [...session.games].sort(
        (a, b) => new Date(gameDate(b)).getTime() - new Date(gameDate(a)).getTime(),
      )[0];
      return {
        key: session.sessionKey,
        latest: times.length > 0 ? Math.max(...times) : 0,
        dateISO: latestGame ? gameDate(latestGame) : "",
        center: session.centerName,
        gameCount: session.games.length,
        competitionType: latestGame ? latestGame.competitionType : "",
        format: latestGame ? latestGame.format : "",
        highGame: setScores.length > 0 ? Math.max(...setScores) : null,
      };
    })
    .sort((a, b) => b.latest - a.latest)
    .slice(0, 5);
  const trendScores = chronological
    .slice(-12)
    .map((g) => gameTopScore(g))
    .filter((s): s is number => s !== null);

  // Sparkline geometry (300 x 64 viewport, 6px vertical padding).
  const W = 300;
  const H = 64;
  const pad = 6;
  const tMin = trendScores.length > 0 ? Math.min(...trendScores) : 0;
  const tMax = trendScores.length > 0 ? Math.max(...trendScores) : 0;
  const tRange = tMax - tMin || 1;
  const sparkPoints = trendScores
    .map((s, i) => {
      const x = trendScores.length > 1 ? (i / (trendScores.length - 1)) * W : W / 2;
      const y = H - pad - ((s - tMin) / tRange) * (H - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const lastPoint = sparkPoints.split(" ").pop() ?? "";
  const [lastX, lastY] = lastPoint.split(",");

  return (
    <div className="dashboard">
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
                  {set.highGame ?? "—"}
                  <span className="dash-recent-score-tag">high</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <div className="dash-side">
          {trendScores.length >= 2 && (
            <section className="dash-panel">
              <h3>Recent scores</h3>
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
                {lastX && lastY && (
                  <circle className="dash-spark-dot" cx={lastX} cy={lastY} r="3.5" />
                )}
              </svg>
              <p className="dash-spark-caption">
                Last {trendScores.length} games · high {Math.max(...trendScores)}
              </p>
            </section>
          )}

          <section className="dash-panel">
            <h3>Quick actions</h3>
            <div className="dash-actions">
              <button type="button" className="dash-action dash-action-primary" onClick={onLogGame}>
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
