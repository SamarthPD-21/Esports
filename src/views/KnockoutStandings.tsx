import { KnockoutBracket } from "@/components/KnockoutBracket";
import { PageHeader } from "@/components/SectionHeading";
import type { GameId } from "@/games/registry";
import { getTournament, teamMap } from "@/lib/data";

/** Single-elimination games (Valorant, FIFA): the bracket is the standings. */
export async function KnockoutStandings({ game }: { game: GameId }) {
  const t = await getTournament(game);
  const teams = teamMap(t);
  const left = t.matches.filter((m) => m.status === "scheduled" || m.status === "live").length;
  return (
    <>
      <PageHeader meta={t.matches.length ? `${left} matches to play` : undefined} title="Bracket">
        Single elimination: win and you move on, lose and you&apos;re out.
      </PageHeader>
      {t.matches.length === 0 ? (
        <p className="text-muted">The bracket is drawn after registration closes.</p>
      ) : (
        <KnockoutBracket game={game} matches={t.matches} teams={teams} />
      )}
    </>
  );
}
