import type { Metadata } from "next";
import { PageHeader } from "@/components/SectionHeading";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md">
      <PageHeader kicker="Players & staff" title="Log in">
        No password needed. We&apos;ll email you a one-time code.
      </PageHeader>
      <LoginForm />
      <p className="mt-4 text-xs text-faint">
        Your email must match the one your captain gave at registration. If it doesn&apos;t, ask a tournament coordinator to update it.
      </p>
    </div>
  );
}
