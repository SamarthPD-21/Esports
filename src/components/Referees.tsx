import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { GAMES, type GameId } from "@/games/registry";
import { getGameReferees, whatsappLink, type GameReferee } from "@/lib/referees";
import { SectionHeading } from "./SectionHeading";

/**
 * Who referees a game and how to reach them. Reads the visitor's session, so
 * it streams in after the cached page.
 */
export function Referees({ game, compact = false }: { game: GameId; compact?: boolean }) {
  return (
    <Suspense fallback={compact ? null : <RefereesShell game={game} />}>
      <RefereeList game={game} compact={compact} />
    </Suspense>
  );
}

function RefereesShell({ game, children }: { game: GameId; children?: React.ReactNode }) {
  return (
    <section className="mt-14">
      <SectionHeading title="Referees" note={`Questions about ${GAMES[game].short} matches go here`} />
      {children}
    </section>
  );
}

async function RefereeList({ game, compact }: { game: GameId; compact: boolean }) {
  await connection();
  const { refs, contactsVisible } = await getGameReferees(game);
  const list = refs.length === 0 ? (
    <p className="text-sm text-muted">Referees are announced before the first match.</p>
  ) : (
    <>
      <ul className={`grid gap-4 ${compact ? "" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
        {refs.map((r) => <RefereeCard key={`${r.role}${r.name}`} r={r} />)}
      </ul>
      {!contactsVisible && (
        <p className="mt-4 text-sm text-muted">
          <Link href="/me" className="link">Log in</Link> as a team leader to see how to reach them.
        </p>
      )}
    </>
  );
  if (compact) return list;
  return <RefereesShell game={game}>{list}</RefereesShell>;
}

function RefereeCard({ r }: { r: GameReferee }) {
  const wa = r.phone ? whatsappLink(r.phone) : undefined;
  const initials = r.name.split(/[\s._-]+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");
  return (
    <li className="panel flex gap-4 p-4">
      <span className="grid size-12 shrink-0 place-items-center bg-deep font-display text-2xl text-[var(--game,var(--color-signal))]" aria-hidden>
        {initials}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2">
          <span className="truncate font-bold">{r.name}</span>
          <span className={`tag ${r.role === "admin" ? "text-signal" : "text-steel"}`}>{r.role === "admin" ? "Organiser" : "Referee"}</span>
        </p>
        {(wa || r.phone || r.discord || r.email) && (
          <ul className="mt-2 flex flex-col gap-1 text-sm">
            {wa && <li><a href={wa} className="link">WhatsApp {r.phone}</a></li>}
            {!wa && r.phone && <li><a href={`tel:${r.phone.replace(/\s/g, "")}`} className="link">{r.phone}</a></li>}
            {r.discord && <li className="text-muted">Discord <span className="text-text">{r.discord}</span></li>}
            {r.email && <li><a href={`mailto:${r.email}`} className="link break-all">{r.email}</a></li>}
          </ul>
        )}
      </div>
    </li>
  );
}
