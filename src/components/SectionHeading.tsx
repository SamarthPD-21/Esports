export function SectionHeading({ kicker, title, children }: { kicker?: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        {kicker && <p className="mb-1 font-display text-xs font-semibold uppercase tracking-[0.2em] text-violet-soft">{kicker}</p>}
        <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export function PageHeader({ kicker, title, children }: { kicker: string; title: string; children?: React.ReactNode }) {
  return (
    <header className="mb-8 pt-6 sm:pt-10">
      <p className="mb-2 font-display text-xs font-semibold uppercase tracking-[0.25em] text-violet-soft">{kicker}</p>
      <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
      {children && <div className="mt-3 max-w-2xl text-muted">{children}</div>}
      <div className="rift-line mt-6" />
    </header>
  );
}
