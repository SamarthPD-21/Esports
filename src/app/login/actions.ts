"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";

export interface LoginState {
  sent?: boolean;
  error?: string;
}

const SENT = { sent: true } as const;

export async function sendMagicLink(_: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email address." };

  // Only registered players and staff get a link. Respond the same way either
  // way so the form can't be used to discover who registered.
  const { data: registered, error } = await createServiceClient().rpc("is_registered_email", { addr: email });
  if (error) return { error: "Login is unavailable right now. Try again in a minute." };
  if (!registered) return SENT;

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const db = await createClient();
  const { error: otpError } = await db.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${site}/auth/confirm`, shouldCreateUser: true },
  });
  if (otpError?.status === 429) return { error: "Too many attempts — wait a minute and try again." };
  return SENT;
}
