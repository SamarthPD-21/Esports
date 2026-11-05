/**
 * Pixel stars that blink on a two-frame cycle. Positions are fixed so server
 * and client render the same markup; each star gets its own delay and period.
 */
const FIELD: [number, number, number][] = [
  // [left %, top %, size px]
  [4, 18, 3], [11, 62, 2], [17, 34, 3], [23, 8, 2], [29, 74, 2], [34, 22, 3],
  [41, 52, 2], [47, 12, 3], [53, 68, 2], [58, 30, 2], [64, 82, 3], [69, 16, 2],
  [75, 46, 3], [81, 70, 2], [86, 28, 3], [92, 56, 2], [97, 10, 2], [38, 88, 2],
];

export function Stars({ count = FIELD.length, className = "" }: { count?: number; className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 ${className}`} aria-hidden>
      {FIELD.slice(0, count).map(([x, y, s], i) => (
        <span
          key={i}
          className="twinkle absolute bg-text"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            width: s,
            height: s,
            animationDelay: `${((i * 37) % 260) / 100}s`,
            animationDuration: `${2.2 + (i % 4) * 0.6}s`,
          }}
        />
      ))}
    </div>
  );
}

/** A shooting star that crosses the sky every so often. */
export function ShootingStar({ className = "" }: { className?: string }) {
  return <span className={`shooting-star pointer-events-none absolute ${className}`} aria-hidden />;
}
