export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display text-foreground">{title}</h1>
        <p className="text-body text-muted-foreground mt-1">This page is under construction.</p>
      </div>
      <div className="surface rounded-lg border border-border p-12 shadow-surface text-center">
        <p className="text-body text-muted-foreground">Content coming soon.</p>
      </div>
    </div>
  );
}
