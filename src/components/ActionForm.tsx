"use client";

import { startTransition, useActionState } from "react";
import { useHydrated } from "@/lib/use-hydrated";

interface State {
  ok?: string;
  error?: string;
}

/** A form bound to a staff Server Action, showing its success/error message. */
export function ActionForm({
  action,
  children,
  submit,
  className = "flex flex-col gap-3",
  tone = "primary",
}: {
  action: (prev: State, form: FormData) => Promise<State>;
  children?: React.ReactNode;
  submit: string;
  className?: string;
  tone?: "primary" | "quiet" | "danger";
}) {
  const [state, run, pending] = useActionState(action, {});
  const hydrated = useHydrated();
  const btn =
    tone === "primary" ? "bg-signal text-bg" : tone === "danger" ? "border border-live/40 text-live" : "border border-line-strong text-muted hover:text-text";
  return (
    <form
      action={run}
      className={className}
      onSubmit={(e) => {
        // Once hydrated, submit without React's automatic form reset so a rejected
        // entry isn't wiped. Before hydration `action` still posts the form.
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => run(data));
      }}
    >
      {children}
      <div className="flex flex-wrap items-center gap-3">
        <button disabled={pending || !hydrated} className={`rounded-sm px-4 py-2 text-sm font-semibold disabled:opacity-60 ${btn}`}>
          {pending ? "Working…" : submit}
        </button>
        {state.error && <span className="text-sm text-live" role="alert">{state.error}</span>}
        {state.ok && <span className="text-sm text-win" role="status">{state.ok}</span>}
      </div>
    </form>
  );
}

export const inputClass =
  "w-full rounded-sm border border-line-strong bg-surface-2 px-3 py-2 text-sm text-text outline-none placeholder:text-faint focus:border-signal";
