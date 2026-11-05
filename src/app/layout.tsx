import type { Metadata } from "next";
import { Alegreya_Sans, Jersey_10 } from "next/font/google";
import { Suspense } from "react";
import { DataNotice, Footer } from "@/components/Footer";
import { Nav, NavShell } from "@/components/Nav";
import { EVENT } from "@/content/event";
import "./globals.css";

// Same pixel face as yugaantar.org for headings and numbers; a humanist sans for reading.
const body = Alegreya_Sans({ variable: "--font-body", subsets: ["latin"], weight: ["400", "500", "700", "800"], style: ["normal", "italic"] });
const pixel = Jersey_10({ variable: "--font-pixel", subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: { default: `Esports · ${EVENT.festival}`, template: `%s · ${EVENT.festival} Esports` },
  description: `${EVENT.festival} esports: CODM, Valorant, BGMI, Free Fire MAX, Smash Karts and FIFA. Schedules, live standings, brackets and rules.`,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${body.variable} ${pixel.variable} h-full antialiased`}>
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
