// A simple empty-state placeholder card. Styling is global (`.empty-state-card`).

type EmptyStateCardProps = {
  title: string;
  description: string;
};

export function EmptyStateCard({ title, description }: EmptyStateCardProps) {
  return (
    <section className="empty-state-card">
      <h3>{title}</h3>
      <p>{description}</p>
    </section>
  );
}
