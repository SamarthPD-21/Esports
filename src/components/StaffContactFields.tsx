import { inputClass } from "./ActionForm";

/** Name and contact details players see on a game's Referees section. */
export function StaffContactFields({ name, phone, discord, listed = true }: { name?: string | null; phone?: string | null; discord?: string | null; listed?: boolean }) {
  return (
    <fieldset className="grid gap-3 sm:grid-cols-3">
      <legend className="mb-2 text-xs text-muted">Shown to players</legend>
      <label className="flex flex-col gap-1 text-xs text-muted">
        Name
        <input name="name" defaultValue={name ?? ""} placeholder="Aarav Shah" className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-xs text-muted">
        Phone / WhatsApp
        <input name="phone" type="tel" defaultValue={phone ?? ""} placeholder="+91 98765 43210" className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-xs text-muted">
        Discord
        <input name="discord" defaultValue={discord ?? ""} placeholder="aarav.ref" className={inputClass} />
      </label>
      <label className="flex items-center gap-2 text-sm sm:col-span-3">
        <input type="checkbox" name="listed" defaultChecked={listed} className="accent-signal" />
        List on the game&apos;s page (contact details only go to that game&apos;s team leaders)
      </label>
    </fieldset>
  );
}
