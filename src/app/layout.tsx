import "@/lib/polyfills";
import type { Metadata } from "next";
import "./globals.css";
import dynamic from "next/dynamic";

const Web3Provider = dynamic(() => import("@/components/Web3Provider"), { ssr: false });

export const metadata: Metadata = {
  title: "GENMON - Living Agents. Evolving Tokens.",
  description: "Autonomous agent swarm on Monad. AI agents with DNA that scout, launch, and evolve.",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-space antialiased">
        <Web3Provider>{children}</Web3Provider>
      </body>
    </html>
  );
}
