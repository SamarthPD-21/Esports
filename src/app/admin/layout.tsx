import Link from "next/link";
import { Suspense } from "react";
import { getViewer, canStaff } from "@/lib/auth";
import { staffTags } from "@/lib/staff";

const LINKS = [
  { href: "/admin", label: "Games" },
  { href: "/ref", label: "Tonight" },
  { href: "/admin/disputes", label: "Disputes" },
  { href: "/admin/sync", label: "Registrations" },
  { href: "/admin/setup", label: "CODM setup", game: "codm" },
  { href: "/admin/content", label: "CODM settings", game: "codm" },
  { href: "/admin/staff", label: "Staff", admin: true },
];

const linkClass = "caps px-3 py-2 text-[0.7rem] font-bold text-muted hover:bg-surface-2 hover:text-text";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="pt-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <p className="font-display text-3xl text-moon">Control room</p>
        <Suspense fallback={<nav className="flex flex-wrap gap-1" aria-label="Admin" />}>
          <AdminNav />
        </Suspense>
      </div>
      {children}
    </div>
  );
}

/** Links for what this staff member can do, and their tags. */
async function AdminNav() {
  const viewer = await getViewer();
  const isAdmin = viewer?.staffRole === "admin";
  const links = LINKS.filter((l) => (l.admin ? isAdmin : !l.game || (viewer && canStaff(viewer, l.game))));
  const tags = viewer?.staffRole ? staffTags({ role: viewer.staffRole, games: viewer.staffGames ?? null }) : [];
  return (
    <nav className="flex flex-wrap items-center gap-1" aria-label="Admin">
      {links.map((l) => (
        <Link key={l.href} href={l.href} className={linkClass}>{l.label}</Link>
      ))}
      <span className="ml-2 flex flex-wrap gap-1" title="Your roles">
        {tags.map((t) => <span key={t} className="tag text-steel">{t}</span>)}
      </span>
    </nav>
  );
}
