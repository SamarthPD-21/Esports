import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { confirmLink } from "@/app/login/actions";

export const metadata: Metadata = { title: "Log in" };

// The email link lands here. Logging in waits for a button press, because
// some college mail scanners open links on their own and would use it up.
export default function ConfirmPage(props: PageProps<"/auth/confirm">) {
  return (
    <div className="mx-auto max-w-md pt-16">
      <Suspense fallback={<div className="panel h-40 animate-pulse" />}>
        <Confirm searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function Confirm({ searchParams }: Pick<PageProps<"/auth/confirm">, "searchParams">) {
  const q = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const tokenHash = one(q.token_hash);
  const code = one(q.code);

  if (one(q.failed)) {
    return (
      <div className="panel flex flex-col gap-4 p-6" role="alert">
        <p className="font-cond text-xl font-bold">That login link didn&apos;t work</p>
        <p className="text-sm text-muted">It may have expired or already been used. Ask for a new code and type it in instead.</p>
        <Link href="/login" className="self-start rounded-sm bg-signal px-5 py-2.5 text-sm font-semibold text-bg">Get a new code</Link>
      </div>
    );
  }

  return (
    <form action={confirmLink} className="panel flex flex-col gap-4 p-6">
      <p className="font-cond text-xl font-bold">Log in to CODM Carnage 2.0</p>
      {tokenHash || code ? (
        <>
          <input type="hidden" name="token_hash" value={tokenHash} />
          <input type="hidden" name="type" value={one(q.type) || "email"} />
          <input type="hidden" name="code" value={code} />
          <button className="rounded-sm bg-signal px-5 py-2.5 text-sm font-semibold text-bg">Continue</button>
        </>
      ) : (
        <p className="text-sm text-muted">This link is incomplete. Go back to the login page and use the code from the email instead.</p>
      )}
    </form>
  );
}
