export function DashboardPageLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading page">
      <div className="space-y-2">
        <div className="h-8 w-52 rounded-md bg-muted" />
        <div className="h-4 w-72 rounded-md bg-muted" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-28 rounded-lg border bg-card" />
        ))}
      </div>
      <div className="h-72 rounded-lg border bg-card" />
    </div>
  );
}
