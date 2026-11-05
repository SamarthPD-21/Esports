import { CopyButton } from "./forms";

/** Room ID and password, large, each with a copy button. */
export function RoomDetails({ roomId, password, size = "lg" }: { roomId: string; password: string | null; size?: "lg" | "md" }) {
  const text = size === "lg" ? "text-3xl" : "text-xl";
  return (
    <dl className="grid grid-cols-2 gap-3">
      {[
        { k: "Room ID", v: roomId },
        { k: "Password", v: password },
      ].map(({ k, v }) => (
        <div key={k} className="min-w-0">
          <dt className="text-xs text-faint">{k}</dt>
          <dd className="flex flex-wrap items-center gap-2">
            <span className={`tnum font-cond font-semibold break-all select-all ${text}`}>{v ?? "None"}</span>
            {v && <CopyButton value={v} label={k.toLowerCase()} />}
          </dd>
        </div>
      ))}
    </dl>
  );
}
