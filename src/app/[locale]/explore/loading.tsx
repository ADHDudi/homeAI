export default function ExploreLoading() {
  return (
    <div className="container mx-auto px-4 py-6 animate-pulse">
      {/* Title */}
      <div className="h-8 bg-muted rounded w-48 mb-2" />
      <div className="h-4 bg-muted rounded w-80 mb-6" />

      {/* Filter bar */}
      <div className="flex gap-2 mb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-9 bg-muted rounded w-28" />
        ))}
      </div>

      {/* Map placeholder */}
      <div className="h-[350px] md:h-[450px] lg:h-[600px] bg-muted rounded-lg mb-6" />

      {/* Stats row */}
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4">
            <div className="h-3 bg-muted rounded w-20 mb-2" />
            <div className="h-6 bg-muted rounded w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}
