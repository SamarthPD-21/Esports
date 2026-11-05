/**
 * A headline whose letters drop in one by one and settle with a small bounce.
 * Screen readers get the whole word from aria-label.
 */
export function DropTitle({ text, className, delay = 0.35 }: { text: string; className?: string; delay?: number }) {
  return (
    <h1 className={className} aria-label={text}>
      {[...text].map((ch, i) => (
        <span key={i} aria-hidden className="drop-letter inline-block" style={{ animationDelay: `${(delay * 100 + i * 8) / 100}s` }}>
          {ch === " " ? " " : ch}
        </span>
      ))}
    </h1>
  );
}
