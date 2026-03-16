import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-9 w-96" />
        <Skeleton className="h-5 w-64 mt-2" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-6 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border p-6">
          <Skeleton className="h-5 w-48 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="rounded-lg border p-6">
          <Skeleton className="h-5 w-48 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>

      <div>
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="rounded-lg border">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex gap-4 p-3 border-b last:border-0">
              <Skeleton className="h-5 w-8" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-12" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
