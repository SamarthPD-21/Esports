/** A small pixel-art cloud, drawn on a 16×6 grid. Decorative. */
export function PixelCloud({ className }: { className?: string }) {
  // [row, from, to] runs of cream, then a shaded underside.
  const top: [number, number, number][] = [[0, 5, 8], [1, 3, 11], [2, 1, 13], [3, 0, 15]];
  const shade: [number, number, number][] = [[4, 1, 14], [5, 3, 7], [5, 9, 12]];
  return (
    <svg viewBox="0 0 16 6" className={className} shapeRendering="crispEdges" aria-hidden>
      {top.map(([y, a, b]) => <rect key={`t${y}`} x={a} y={y} width={b - a + 1} height={1} fill="#f3f1e2" />)}
      {shade.map(([y, a, b]) => <rect key={`s${y}${a}`} x={a} y={y} width={b - a + 1} height={1} fill={y === 4 ? "#c9d3ef" : "#f6d3e3"} />)}
    </svg>
  );
}
