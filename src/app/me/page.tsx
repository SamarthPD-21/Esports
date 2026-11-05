import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { GAMES, isGameId } from "@/games/registry";
import { requestNow, requireViewer, type Viewer } from "@/lib/auth";
import {
  getDashboard,
  getLobbyDashboard,
  getTeamSummaries,
  h2hTodos,
  lobbyTodos,
  pickTodo,
  type Dashboard,
  type LobbyDashboard,
  type Todo,
} from "@/lib/player";
import { CodmSection } from "./CodmSection";
import { DoNow } from "./DoNow";
import { H2hSection } from "./H2hSection";
import { LobbySection } from "./LobbySection";
import { TeamSection } from "./TeamSection";

export const metadata: Metadata = { title: "My matches" };

export default function MePage() {
  return (
    <Suspense fallback={<div className="panel mt-10 h-72 animate-pulse" />}>
      <Me />
    </Suspense>
  );
}

function SignOut() {
  return (
    <form action="/auth/signout" method="post">
      <button className="rounded-sm border border-line px-3 py-1.5 text-xs font-medium text-muted hover:text-text">Sign out</button>
    </form>
  );
}

function StaffLinks({ viewer }: { viewer: Viewer }) {
  if (!viewer.staffRole) return null;
  return (
    <>
      <Link href="/ref" className="rounded-sm border border-line-strong px-3 py-1.5 text-xs font-semibold hover:border-signal">Referee</Link>
      {viewer.staffRole === "admin" && (
        <Link href="/admin" className="rounded-sm border border-line-strong px-3 py-1.5 text-xs font-semibold hover:border-signal">Admin</Link>
      )}
    </>
  );
}

function Unlinked({ viewer }: { viewer: Viewer }) {
  return (
    <div className="mx-auto max-w-lg pt-12">
      <div className="panel flex flex-col gap-4 p-6">
        <p className="text-sm text-muted">Signed in as <span className="text-text">{viewer.email}</span></p>
        {viewer.staffRole ? (
          <>
            <p className="font-cond text-xl font-bold">You&apos;re tournament staff ({viewer.staffRole}).</p>
            <div className="flex flex-wrap gap-2">
              <Link href="/ref" className="rounded-sm bg-signal px-4 py-2 text-sm font-semibold text-bg">Open the referee desk</Link>
              {viewer.staffRole === "admin" && (
                <Link href="/admin" className="rounded-sm border border-line-strong px-4 py-2 text-sm font-semibold">Open the admin panel</Link>
              )}
            </div>
          </>
        ) : (
          <>
            <p className="font-cond text-xl font-bold">No team is linked to this email.</p>
            <p className="text-sm">
              Only team leaders and solo players log in. If you lead a team, use the email you registered with on Unstop.
            </p>
            <p className="text-sm text-muted">
              Team members: you don&apos;t need to log in. <Link href="/" className="link">Schedules and standings</Link> are public.
            </p>
          </>
        )}
        <SignOut />
      </div>
    </div>
  );
}

type Loaded =
  | { kind: "codm"; d: Dashboard }
  | { kind: "h2h"; d: Dashboard }
  | { kind: "lobby"; d: LobbyDashboard };

/** Start of the team's next scheduled match, for ordering the sections. */
function nextStart(x: Loaded): string | undefined {
  if (x.kind === "lobby") {
    return x.d.evenings.flatMap((ev) => ev.matches).find((m) => (m.status === "scheduled" || m.status === "live") && m.scheduledAt)?.scheduledAt;
  }
  return x.d.upcoming.find((m) => m.scheduledAt)?.scheduledAt;
}

async function Me() {
  const viewer = await requireViewer();
  // Only leaders log in; older links to non-leader rows are ignored here.
  const leading = viewer.players.filter((p) => p.isCaptain && isGameId(p.gameId));
  if (!leading.length) return <Unlinked viewer={viewer} />;

  const now = await requestNow();
  const [summaries, loaded] = await Promise.all([
    getTeamSummaries(leading.map((p) => p.teamId)),
    Promise.all(
      leading.map(async (p): Promise<Loaded> => {
        const game = GAMES[p.gameId as keyof typeof GAMES];
        if (game.shape === "lobby") return { kind: "lobby", d: await getLobbyDashboard(p.teamId, game.id, now) };
        const d = await getDashboard(p.teamId, game.id, now);
        return { kind: game.id === "codm" ? "codm" : "h2h", d };
      }),
    ),
  ]);

  const sections = leading
    .map((player, i) => ({ player, x: loaded[i], team: summaries.get(player.teamId) }))
    .filter((s) => s.team)
    .map((s) => ({ ...s, team: s.team!, next: nextStart(s.x) }))
    .sort((a, b) => (a.next ?? "~").localeCompare(b.next ?? "~"));

  const todos: Todo[] = sections.flatMap(({ x, team }) => (x.kind === "lobby" ? lobbyTodos(x.d, team.name, now) : h2hTodos(x.d, team.name, now)));
  const todo = pickTodo(todos);
  const ign = sections[0]?.player.ign;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 pt-8 sm:pt-10">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted">{viewer.email}</p>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{ign ? `GG, ${ign}` : "My matches"}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StaffLinks viewer={viewer} />
          <SignOut />
        </div>
      </header>

      <DoNow todo={todo} multi={sections.length > 1} />

      {sections.map(({ player, x, team }) => (
        <TeamSection key={team.id} team={team}>
          {x.kind === "codm" ? (
            <CodmSection player={player} d={x.d} now={now} />
          ) : x.kind === "h2h" ? (
            <H2hSection d={x.d} now={now} />
          ) : (
            <LobbySection d={x.d} now={now} />
          )}
        </TeamSection>
      ))}
    </div>
  );
}
