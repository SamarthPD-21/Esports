import type { Team } from "@/lib/types";
import { teamHue } from "@/lib/format";

const SIZES = { sm: "size-7 text-xs", md: "size-10 text-sm", lg: "size-16 text-xl" };

export function TeamBadge({ team, size = "md" }: { team?: Team; size?: keyof typeof SIZES }) {
  if (!team) {
    return <span className={`${SIZES[size]} grid shrink-0 place-items-center rounded-sm border border-dashed border-line-strong text-faint`}>?</span>;
  }
  if (team.logoUrl) {
    // Logos are arbitrary URLs pasted into the sheet, so skip next/image's domain allowlist.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={team.logoUrl} alt="" className={`${SIZES[size]} shrink-0 rounded-sm object-cover`} />;
  }
  const hue = teamHue(team.id);
  return (
    <span
      aria-hidden
      className={`${SIZES[size]} grid shrink-0 place-items-center rounded-sm font-display font-bold`}
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 70% 22%), hsl(${(hue + 40) % 360} 70% 14%))`,
        color: `hsl(${hue} 90% 80%)`,
        boxShadow: `inset 0 0 0 1px hsl(${hue} 60% 40% / 0.5)`,
      }}
    >
      {team.tag.slice(0, 4)}
    </span>
  );
}
