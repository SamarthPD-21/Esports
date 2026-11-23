/** What a page looks like while its data loads: a heading bar and a few panels. */
export function PageSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-4 py-6" role="status" aria-label="Loading">
      <div className="skeleton h-8 w-56" />
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: rows * 2 }, (_, i) => (
          <div key={i} className="skeleton h-28" style={{ animationDelay: `${i * 0.08}s` }} />
        ))}
      </div>
    </div>
  );
}
