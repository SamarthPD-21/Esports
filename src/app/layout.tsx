import type { Metadata } from "next";
import { Barlow, Barlow_Condensed, Big_Shoulders_Stencil } from "next/font/google";
import { Suspense } from "react";
import { DataNotice, Footer } from "@/components/Footer";
import { Nav, NavShell } from "@/components/Nav";
import { EVENT } from "@/content/event";
import "./globals.css";

const barlow = Barlow({ variable: "--font-barlow", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const barlowCond = Barlow_Condensed({ variable: "--font-barlow-cond", subsets: ["latin"], weight: ["500", "600", "700"] });
const stencil = Big_Shoulders_Stencil({ variable: "--font-stencil", subsets: ["latin"], axes: ["opsz"], adjustFontFallback: false });

export const metadata: Metadata = {
  title: { default: `${EVENT.name} — ${EVENT.edition}`, template: `%s · ${EVENT.name}` },
  description: `${EVENT.festival} presents ${EVENT.name}: ${EVENT.edition}. ${EVENT.tagline} Teams, groups, schedule, bracket and rules.`,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${barlow.variable} ${barlowCond.variable} ${stencil.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <Suspense fallback={null}>
          <DataNotice />
        </Suspense>
        <Suspense fallback={<NavShell pathname="" />}>
          <Nav />
        </Suspense>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4">{children}</main>
        <Suspense fallback={null}>
          <Footer />
        </Suspense>
      </body>
    </html>
  );
}
