"use client";

import { useActionState } from "react";
import { sendMagicLink, type LoginState } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(sendMagicLink, {});

  if (state.sent) {
    return (
      <div className="panel p-6" role="status">
        <p className="font-display text-xl font-bold">Check your inbox</p>
        <p className="mt-2 text-sm text-muted">
          If that email is registered for the tournament, a login link is on its way. Open it in this browser. It expires in 1 hour.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="panel flex flex-col gap-4 p-6">
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">Email used at registration</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="rounded-lg border border-line-strong bg-surface-2 px-3 py-2.5 text-text outline-none placeholder:text-faint focus:border-violet"
        />
      </label>
      {state.error && <p className="text-sm text-live" role="alert">{state.error}</p>}
      <button
        disabled={pending}
        className="rounded-lg bg-gradient-to-r from-violet to-cyan px-5 py-2.5 text-sm font-semibold text-bg disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send login link"}
      </button>
    </form>
  );
}
