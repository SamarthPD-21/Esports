import { PageHeader } from "@/components/SectionHeading";
import { GAMES, type GameId } from "@/games/registry";

/** The short version of a game's rules, with the organisers' PDF linked. */
export function GameRules({ game }: { game: GameId }) {
  const g = GAMES[game];
  return (
    <>
      <PageHeader title="Rules">
        The essentials. If anything here differs from the official document, the document wins.
        {g.rulesPdf && (
          <>
            {" "}
            <a href={`/rules/${g.rulesPdf}`} className="link">Read the full rules (PDF)</a>.
          </>
        )}
      </PageHeader>
      <div className="grid gap-10 lg:grid-cols-2">
        {g.rules.map((sec) => (
          <section key={sec.heading}>
            <h2 className="mb-3 font-cond text-xl font-bold">{sec.heading}</h2>
            <ul className="flex flex-col gap-2.5">
              {sec.items.map((item) => (
                <li key={item} className="border-l-2 border-line pl-4 text-[15px] leading-relaxed text-muted">{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
