// SetSpecificStats — the per-set stat-card grid for one bowler inside a saved
// set. Extracted from App.tsx (stats decomposition). Rendered by StatsPage.

import type { Handedness } from "../../types";
import type { SessionGroup } from "../../lib/sessions";
import { calculateDetailedBowlerStats } from "../detailed";
import { buildSetStatCards } from "../setStats";
import type { DetailedStatDetail } from "../types";

export function SetSpecificStats({
  bowlerName,
  selectedBall,
  session,
  bowlerHandednessByName,
  onStatClick,
}: {
  bowlerName: string;
  selectedBall: string;
  session: SessionGroup;
  bowlerHandednessByName: Map<string, Handedness>;
  onStatClick: (stat: DetailedStatDetail) => void;
}) {
  const sessionStats = calculateDetailedBowlerStats(
    bowlerName,
    selectedBall,
    session.games,
    [session],
    bowlerHandednessByName
  );
  const setStatCards = buildSetStatCards({
    stats: sessionStats,
    selectedBowler: bowlerName,
    selectedBall,
    games: session.games,
  });

  return (
    <section className="set-specific-stats-card">
      <h4>
        Set Stats — {bowlerName}
        {selectedBall !== "All" ? ` with ${selectedBall}` : ""}
      </h4>

      <div className="deep-stats-grid">
        {setStatCards.map((stat) => (
          <button
            className="stat-card stat-card-button"
            key={stat.title}
            type="button"
            onClick={() => onStatClick(stat)}
            aria-label={`View details for ${stat.label}`}
          >
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
            <small>View Details</small>
          </button>
        ))}
      </div>
    </section>
  );
}
