// Shared stats-local types — the universal stat-detail card shape, the set/game
// metadata draft shapes, and the set stat row. Dependency-free; consumed by the
// stat-card builders, the saved-set/game editors, and the StatsPage shell.

export type SetMetadataDraft = {
  centerName: string;
  patternName: string;
  gameLaneLabels: Record<string, string>;
  setNotes: string;
};

export type GameMetadataDraft = {
  gameNotes: string;
  ballReactionNotes: string;
  laneTransitionNotes: string;
  adjustmentNotes: string;
};

export type DetailedStatDetail = {
  title: string;
  label: string;
  value: string;
  description: string;
  formula: string;
  detailRows: { label: string; value: string }[];
  note?: string;
};

export type SetStatDetailRow = {
  id: string;
  score: number;
  gameNumber: number;
  laneLabel: string;
  savedAt: string;
  eventLabel: string;
};
