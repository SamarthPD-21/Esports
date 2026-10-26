"use server";

import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export interface LoginState {
  /** Set once a code has been requested; the code form uses it. */
  email?: string;
  error?: string;
}

export async function sendLoginCode(_: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email address." };

  // Only registered players and staff get an email. Respond the same way either
  // way so the form can't be used to discover who registered.
  const { data: registered, error } = await createServiceClient().rpc("is_registered_email", { addr: email });
  if (error) return { error: "Login is unavailable right now. Try again in a minute." };
  if (!registered) return { email };

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const db = await createClient();
  const { error: otpError } = await db.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${site}/auth/confirm`, shouldCreateUser: true },
  });
  if (otpError?.status === 429) return { email, error: "A code was sent less than a minute ago. Wait a bit before asking for another." };
  return { email };
}

export async function verifyLoginCode(prev: LoginState, form: FormData): Promise<LoginState> {
  const email = prev.email ?? "";
  const token = String(form.get("code") ?? "").replace(/\s/g, "");
  if (!/^\d{6,10}$/.test(token)) return { email, error: "Enter the code from the email." };

  const db = await createClient();
  const { error } = await db.auth.verifyOtp({ email, token, type: "email" });
  if (error) return { email, error: "That code is wrong or has expired. Check the latest email, or ask for a new code." };
  await db.rpc("claim_player");
  redirect("/me");
}

/** Second step of the email link: runs on a button press, so link scanners can't use it up. */
export async function confirmLink(form: FormData): Promise<void> {
  const tokenHash = String(form.get("token_hash") ?? "");
  const type = String(form.get("type") ?? "email") as EmailOtpType;
  const code = String(form.get("code") ?? "");

  const db = await createClient();
  const { error } = code
    ? await db.auth.exchangeCodeForSession(code)
    : tokenHash
      ? await db.auth.verifyOtp({ token_hash: tokenHash, type })
      : { error: new Error("missing token") };
  if (error) redirect("/auth/confirm?failed=1");
  await db.rpc("claim_player");
  redirect("/me");
}
