/** Section title, with an optional short fact beside it (e.g. "All times IST") and actions on the right. */
export function SectionHeading({ note, title, children }: { note?: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 border-b border-line pb-3">
      <h2 className="flex flex-wrap items-baseline gap-x-3 font-display text-3xl font-bold sm:text-4xl">
        {title}
        {note && <span className="font-sans text-sm font-normal text-muted">{note}</span>}
      </h2>
      {children}
    </div>
  );
}

/** Page title. `meta` is a live fact about the page's content, shown opposite the title. */
export function PageHeader({ meta, title, children }: { meta?: string; title: string; children?: React.ReactNode }) {
  return (
    <header className="mb-10 pt-8 sm:pt-12">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <h1 className="font-display text-5xl leading-[0.9] font-extrabold sm:text-7xl">{title}</h1>
        {meta && <p className="font-cond text-lg font-semibold text-muted">{meta}</p>}
      </div>
      {children && <div className="mt-4 max-w-2xl text-lg text-muted">{children}</div>}
      <div className="rift-line mt-6" />
    </header>
  );
}
