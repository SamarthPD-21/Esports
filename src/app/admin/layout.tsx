import Link from "next/link";

const LINKS = [
  { href: "/admin", label: "Matches" },
  { href: "/admin/disputes", label: "Disputes" },
  { href: "/admin/setup", label: "Setup" },
  { href: "/admin/content", label: "Content & staff" },
];

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="pt-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="font-cond text-base font-semibold text-muted">Control room</p>
        <nav className="flex flex-wrap gap-1" aria-label="Admin">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-sm px-3 py-1.5 text-sm text-muted hover:bg-surface-2 hover:text-text">
              {l.label}
            </Link>
          ))}
          <Link href="/me" className="rounded-sm px-3 py-1.5 text-sm text-faint hover:text-text">My account</Link>
        </nav>
      </div>
      {children}
    </div>
  );
}
