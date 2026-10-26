import type { Metadata } from "next";
import { Chakra_Petch, Inter, JetBrains_Mono } from "next/font/google";
import { Suspense } from "react";
import { DataNotice, Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { EVENT } from "@/content/event";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const chakra = Chakra_Petch({ variable: "--font-chakra", subsets: ["latin"], weight: ["500", "600", "700"] });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: `${EVENT.name} — ${EVENT.edition}`, template: `%s · ${EVENT.name}` },
  description: `${EVENT.festival} presents ${EVENT.name}: ${EVENT.edition}. ${EVENT.tagline} Teams, groups, schedule, bracket and rules.`,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${chakra.variable} ${jetbrains.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <Suspense fallback={null}>
          <DataNotice />
        </Suspense>
        <Nav />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4">{children}</main>
        <Suspense fallback={null}>
          <Footer />
        </Suspense>
      </body>
    </html>
  );
}
