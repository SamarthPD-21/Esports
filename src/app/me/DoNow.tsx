import { Countdown } from "@/components/UpNext";
import { GAMES } from "@/games/registry";
import { fmtDateTime, fmtTime } from "@/lib/format";
import type { Todo } from "@/lib/player";
import { CheckInForm } from "./forms";
import { RoomDetails } from "./RoomDetails";

const HEADING: Record<Todo["kind"], string> = {
  checkin: "Check in now",
  room: "Room details",
  result: "Result posted",
  next: "Next match",
};

/** The single most urgent thing across every team the viewer leads. */
export function DoNow({ todo, multi }: { todo?: Todo; multi: boolean }) {
  if (!todo) {
    return (
      <section className="panel border-l-4 border-l-line-strong p-4 sm:p-5">
        <p className="text-xs font-semibold text-faint">Do this now</p>
        <p className="mt-1 text-sm text-muted">Nothing right now. Your matches show up below once they&apos;re scheduled.</p>
      </section>
    );
  }
  const game = GAMES[todo.game];
  const who = multi ? `${game.short} · ${todo.teamName}` : game.short;
  const team = { game: todo.game, teamId: todo.teamId };

  return (
    <section className="panel flex flex-col gap-3 border-l-4 p-4 sm:p-5" style={{ borderLeftColor: game.accent }} aria-label="Do this now">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs font-semibold" style={{ color: game.accent }}>{who}</p>
        {todo.kind !== "result" && <Countdown to={todo.startsAt} className="tnum font-cond text-xl font-semibold" />}
      </div>
      <h2 className="font-display text-2xl font-bold tracking-tight">{HEADING[todo.kind]}</h2>

      {todo.kind === "checkin" && (
        <>
          <p className="text-sm text-muted">
            {todo.what}. Starts {fmtTime(todo.startsAt)}; check in by <span className="font-semibold text-text">{fmtTime(todo.by)}</span>.
          </p>
          <CheckInForm team={team} {...todo.target} label={"stageId" in todo.target ? "Check in for tonight" : "Check in"} />
        </>
      )}

      {todo.kind === "room" && (
        <>
          <p className="text-sm text-muted">{todo.what}, {fmtTime(todo.startsAt)}.</p>
          {todo.roomId ? (
            <RoomDetails roomId={todo.roomId} password={todo.password} />
          ) : (
            <p className="text-sm">The referee is setting up the room. Refresh in a minute.</p>
          )}
        </>
      )}

      {todo.kind === "result" && (
        <>
          <p className="font-cond text-xl font-semibold">{todo.text}</p>
          {todo.disputeBy && (
            <p className="text-sm text-muted">Something wrong? You can dispute it below until {fmtTime(todo.disputeBy)}.</p>
          )}
        </>
      )}

      {todo.kind === "next" && <p className="text-sm text-muted">{todo.what}, {fmtDateTime(todo.startsAt)}.</p>}
    </section>
  );
}
