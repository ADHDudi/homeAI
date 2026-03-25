export default function ProjectsLoading() {
  return (
    <div className="space-y-4 md:space-y-6 animate-pulse">
      {/* Title */}
      <div>
        <div className="h-8 bg-muted rounded w-64 mb-2" />
        <div className="h-4 bg-muted rounded w-96" />
      </div>

      {/* Filter controls */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
        <div className="h-9 bg-muted rounded w-full sm:max-w-xs" />
        <div className="h-9 bg-muted rounded w-full sm:w-[200px]" />
        <div className="h-9 bg-muted rounded w-full sm:w-[180px]" />
      </div>

      {/* Mini charts area */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border rounded-lg p-4 h-[160px]"><div className="h-3 bg-muted rounded w-20 mb-2" /><div className="h-[100px] bg-muted rounded" /></div>
        <div className="border rounded-lg p-4 h-[160px]"><div className="h-3 bg-muted rounded w-20 mb-2" /><div className="h-[100px] bg-muted rounded" /></div>
        <div className="border rounded-lg p-4"><div className="h-3 bg-muted rounded w-20 mb-2" /><div className="h-7 bg-muted rounded w-24" /></div>
        <div className="border rounded-lg p-4"><div className="h-3 bg-muted rounded w-20 mb-2" /><div className="h-7 bg-muted rounded w-14" /></div>
      </div>

      {/* Table skeleton */}
      <div className="border rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex gap-4 p-3 border-b bg-muted/30">
          <div className="h-4 bg-muted rounded w-32" />
          <div className="h-4 bg-muted rounded w-20" />
          <div className="h-4 bg-muted rounded w-16 hidden md:block" />
          <div className="h-4 bg-muted rounded w-12" />
          <div className="h-4 bg-muted rounded w-16 hidden md:block" />
          <div className="h-4 bg-muted rounded w-16" />
          <div className="h-4 bg-muted rounded w-12 hidden md:block" />
          <div className="h-4 bg-muted rounded w-16" />
        </div>
        {/* Rows */}
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex gap-4 p-3 border-b last:border-0">
            <div className="h-4 bg-muted rounded w-32" />
            <div className="h-4 bg-muted rounded w-20" />
            <div className="h-4 bg-muted rounded w-16 hidden md:block" />
            <div className="h-4 bg-muted rounded-full w-10" />
            <div className="h-4 bg-muted rounded w-12 hidden md:block" />
            <div className="h-4 bg-muted rounded w-14" />
            <div className="h-4 bg-muted rounded w-10 hidden md:block" />
            <div className="h-4 bg-muted rounded-full w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
