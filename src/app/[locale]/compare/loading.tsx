export default function CompareLoading() {
  return (
    <div className="container mx-auto px-4 py-6 animate-pulse">
      {/* Title */}
      <div className="h-8 bg-muted rounded w-48 mb-2" />
      <div className="h-4 bg-muted rounded w-72 mb-6" />

      {/* City selectors */}
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4">
            <div className="h-4 bg-muted rounded w-16 mb-2" />
            <div className="h-10 bg-muted rounded" />
          </div>
        ))}
      </div>

      {/* Comparison table */}
      <div className="border rounded-lg p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 bg-muted rounded mb-2" />
        ))}
      </div>
    </div>
  );
}
