import { PixelCloud } from "../PixelCloud";

/** [top %, width px, seconds to cross, opacity]. Far clouds are small, dim and slow. */
type Cloud = [number, number, number, number];

const SKY: Cloud[] = [
  [8, 54, 150, 0.45],
  [30, 80, 115, 0.6],
  [62, 140, 80, 0.85],
  [18, 110, 95, 0.75],
  [78, 64, 130, 0.5],
];

const BAND: Cloud[] = [
  [14, 48, 140, 0.3],
  [46, 72, 105, 0.4],
];

/**
 * Pixel clouds drifting left to right in a loop. Negative delays spread them
 * across the sky on first paint, so it never starts empty. Positions are
 * fixed: server and client render the same markup.
 */
export function Clouds({ band = false, className = "" }: { band?: boolean; className?: string }) {
  const clouds = band ? BAND : SKY;
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      {clouds.map(([top, width, time, opacity], i) => (
        <div
          key={i}
          className="cloud-track"
          style={{ top: `${top}%`, "--w": `${width}px`, "--cloud-time": `${time}s`, "--cloud-start": `${-((i * 0.37 + 0.15) % 1) * time}s` } as React.CSSProperties}
        >
          <div className="bob" style={{ opacity, "--bob-time": `${6 + (i % 3) * 1.5}s`, animationDelay: `${-i * 1.1}s` } as React.CSSProperties}>
            <PixelCloud className="block w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
