import "server-only";
import { createServerClient } from "@supabase/ssr";
import { PostgrestClient } from "@supabase/postgrest-js";
import { cookies } from "next/headers";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

/**
 * Acts as the signed-in user (RLS applies). Request-time only: reads cookies,
 * so call it inside a <Suspense> boundary, a Server Action or a Route Handler.
 */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component: the proxy refreshes the session instead.
        }
      },
    },
  });
}

// Public and service reads only need the database, not auth. A bare PostgREST
// client avoids supabase-js's auth bootstrap, which reads the clock and so
// can't run inside 'use cache'.
function restClient(key: string) {
  return new PostgrestClient(`${SUPABASE_URL}/rest/v1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
}

/** Anonymous, cookie-free client: safe inside 'use cache' for public data. */
export function createPublicClient() {
  return restClient(SUPABASE_ANON_KEY);
}

/**
 * Bypasses RLS. Only use after the caller has been authorised in server code
 * (player actions: disputes, veto, room details).
 */
export function createServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return restClient(key);
}
