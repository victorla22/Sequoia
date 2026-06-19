type PageCardProps = {
  title: string;
  description: string;
};

export function PageCard({ title, description }: PageCardProps) {
  return (
    <section className="page-card">
      <h2>{title}</h2>
      <p>{description}</p>
    </section>
  );
}
