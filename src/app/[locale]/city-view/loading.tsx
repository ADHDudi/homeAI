export default function CityViewLoading() {
  return (
    <div className="container mx-auto px-4 py-6 animate-pulse">
      {/* Title */}
      <div className="h-8 bg-muted rounded w-40 mb-2" />
      <div className="h-4 bg-muted rounded w-72 mb-6" />

      {/* City selector */}
      <div className="border rounded-lg p-4 mb-6">
        <div className="h-10 bg-muted rounded w-64" />
      </div>

      {/* Score card + stat cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <div className="border rounded-lg p-6">
          <div className="h-16 bg-muted rounded-full w-16 mx-auto mb-3" />
          <div className="h-5 bg-muted rounded w-32 mx-auto" />
        </div>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4">
            <div className="h-3 bg-muted rounded w-24 mb-3" />
            <div className="h-7 bg-muted rounded w-16" />
          </div>
        ))}
      </div>

      {/* Map placeholder */}
      <div className="h-[300px] bg-muted rounded-lg" />
    </div>
  );
}
