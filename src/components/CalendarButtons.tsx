"use client";

/**
 * Subscribe (webcal, stays in sync) or download a team's calendar. The webcal
 * link needs this site's host, so it's built when tapped.
 */
export function CalendarButtons({ game, teamId, compact = false }: { game: string; teamId: string; compact?: boolean }) {
  const path = `/calendar/${game}/${teamId}.ics`;
  return (
    <span className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <a
        href={path}
        onClick={(e) => {
          e.preventDefault();
          window.location.href = `webcal://${window.location.host}${path}`;
        }}
        className={compact ? "caps text-[0.7rem] font-bold text-steel hover:text-signal" : "btn btn-ghost"}
      >
        Add to my calendar
      </a>
      <a href={path} download className="text-xs text-muted underline underline-offset-4 hover:text-text">
        Download .ics
      </a>
    </span>
  );
}
