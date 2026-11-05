import type { Metadata } from "next";
import { PageHeader } from "@/components/SectionHeading";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md">
      <PageHeader title="Log in">
        Team leaders and solo players: use the email you registered with on Unstop. We&apos;ll email you a one-time code.
      </PageHeader>
      <LoginForm />
      <p className="mt-4 text-xs text-faint">
        Team members don&apos;t need to log in: schedules and standings are public. If your leader&apos;s email changed, ask a tournament coordinator to update it.
      </p>
    </div>
  );
}
