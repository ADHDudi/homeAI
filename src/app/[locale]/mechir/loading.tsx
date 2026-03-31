export default function MechirLoading() {
  return (
    <div className="space-y-4 md:space-y-6 animate-pulse">
      {/* Title */}
      <div>
        <div className="h-8 w-56 bg-muted rounded" />
        <div className="h-4 w-80 bg-muted rounded mt-2" />
      </div>

      {/* Filter controls */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
        <div className="h-10 w-full sm:w-64 bg-muted rounded" />
        <div className="h-10 w-full sm:w-48 bg-muted rounded" />
        <div className="h-10 w-full sm:w-44 bg-muted rounded" />
        <div className="h-10 w-full sm:w-48 bg-muted rounded" />
      </div>

      {/* Mini charts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border rounded-lg p-4 h-[140px] bg-muted" />
        <div className="border rounded-lg p-4 h-[140px] bg-muted" />
        <div className="border rounded-lg p-4 h-[140px] bg-muted" />
        <div className="border rounded-lg p-4 h-[140px] bg-muted" />
      </div>

      {/* Results count */}
      <div className="h-4 w-40 bg-muted rounded" />

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex gap-4 p-3 bg-muted/50">
          {[120, 80, 90, 70, 60, 80, 80, 90].map((w, i) => (
            <div key={i} className="h-4 bg-muted rounded" style={{ width: w }} />
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex gap-4 p-3 border-t">
            {[120, 80, 90, 70, 60, 80, 80, 90].map((w, j) => (
              <div key={j} className="h-4 bg-muted rounded" style={{ width: w }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
