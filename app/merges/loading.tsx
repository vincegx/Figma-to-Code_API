/**
 * Loading State for Merges Page
 *
 * Shows skeleton cards while the merges list is loading.
 */

export default function MergesLoading() {
  return (
    <div className="container py-8">
      {/* Header skeleton */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 h-9 w-48 animate-pulse rounded bg-muted" />
          <div className="h-5 w-72 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-10 w-28 animate-pulse rounded bg-muted" />
      </div>

      {/* Filter skeleton */}
      <div className="mb-6 flex gap-3">
        <div className="h-10 w-64 animate-pulse rounded bg-muted" />
        <div className="h-10 w-36 animate-pulse rounded bg-muted" />
      </div>

      {/* Grid skeleton */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-start justify-between">
              <div className="h-6 w-32 animate-pulse rounded bg-muted" />
              <div className="h-8 w-8 animate-pulse rounded bg-muted" />
            </div>
            <div className="mb-4 h-5 w-20 animate-pulse rounded bg-muted" />
            <div className="mb-3 flex gap-2">
              {[1, 2, 3].map((j) => (
                <div key={j} className="h-12 w-12 animate-pulse rounded bg-muted" />
              ))}
            </div>
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
