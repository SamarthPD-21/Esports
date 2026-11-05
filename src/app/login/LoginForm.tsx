"use client";

import { useActionState, useState } from "react";
import { useHydrated } from "@/lib/use-hydrated";
import { sendLoginCode, verifyLoginCode, type LoginState } from "./actions";

const input =
  "border border-line-strong bg-deep px-3 py-2.5 text-text outline-none placeholder:text-faint focus:border-signal";
const button = "btn disabled:opacity-60";

export function LoginForm() {
  // Bumping the key starts over with an empty email form.
  const [attempt, setAttempt] = useState(0);
  return <EmailStep key={attempt} onReset={() => setAttempt((n) => n + 1)} />;
}

// Bound straight to the server action so a tap before hydration still submits.
function EmailStep({ onReset }: { onReset: () => void }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(sendLoginCode, {});
  const hydrated = useHydrated();
  if (state.email && !state.error) return <CodeForm email={state.email} onBack={onReset} />;

  return (
    <form action={action} className="panel flex flex-col gap-4 p-6">
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">Email you registered with on Unstop</span>
        <input type="email" name="email" required autoComplete="email" defaultValue={state.email} placeholder="you@example.com" className={input} />
      </label>
      {state.error && <p className="text-sm text-live" role="alert">{state.error}</p>}
      <button disabled={pending || !hydrated} className={button}>{pending ? "Sending…" : "Email me a login code"}</button>
    </form>
  );
}

function CodeForm({ email, onBack }: { email: string; onBack: () => void }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(verifyLoginCode, { email });
  const hydrated = useHydrated();
  return (
    <form action={action} className="panel step-in flex flex-col gap-4 p-6">
      <div role="status">
        <p className="font-cond text-xl font-bold">Check your inbox</p>
        <p className="mt-2 text-sm text-muted">
          If <span className="text-text">{email}</span> leads a team or is a solo entry, a login code is on its way. Check Spam and Promotions too.
        </p>
      </div>
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">Login code</span>
        <input
          name="code"
          required
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9 ]{6,12}"
          maxLength={12}
          placeholder="123456"
          className={`${input} tnum font-cond text-xl`}
        />
      </label>
      {state.error && <p className="text-sm text-live" role="alert">{state.error}</p>}
      <button disabled={pending || !hydrated} className={button}>{pending ? "Checking…" : "Log in"}</button>
      <p className="text-xs text-faint">
        You can also tap the link in the email. Wrong address?{" "}
        <button type="button" onClick={onBack} className="link">Use a different email</button>
      </p>
    </form>
  );
}
