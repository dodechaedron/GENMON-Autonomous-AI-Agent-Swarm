"use client";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import AgentPanel from "@/components/AgentPanel";
import LaunchFeed from "@/components/LaunchFeed";
import SwarmControls from "@/components/SwarmControls";
import MarketDashboard from "@/components/MarketDashboard";
import CreateAgentModal from "@/components/CreateAgentModal";
import WalletButton from "@/components/WalletButton";
import { useGenmonStore } from "@/store/useGenmonStore";
import { useSupabaseInit } from "@/hooks/useSupabaseInit";

const SwarmVisualization = dynamic(() => import("@/components/SwarmVisualization"), { ssr: false });

type MobileTab = "swarm" | "agents" | "launches" | "market";

export default function Home() {
  const [showCreate, setShowCreate] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>("swarm");
  const agents = useGenmonStore((s) => s.agents);
  const proposals = useGenmonStore((s) => s.proposals);
  const { supabaseReady, loading } = useSupabaseInit();

  return (
    <main className="h-[100dvh] flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-3 sm:px-6 py-2.5 border-b border-white/5 bg-space/90 backdrop-blur-xl z-20 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden shrink-0 ring-1 ring-cyan/30 shadow-lg shadow-cyan/20">
            <Image
              src="/logo.png"
              alt="GENMON Logo"
              width={36}
              height={36}
              className="w-full h-full object-cover"
              priority
            />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-wider leading-tight">
              <span className="text-cyan glow-cyan">GEN</span>
              <span className="text-purple glow-purple">MON</span>
            </h1>
            <p className="text-[8px] sm:text-[10px] text-gray-500 tracking-widest uppercase hidden sm:block">
              Living Agents · Evolving Tokens · Autonomous Creation
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/docs"
            className="px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 text-xs hover:text-white hover:border-white/20 transition-all hidden sm:inline-block"
          >
            Docs
          </Link>
          <Link
            href="/admin"
            className="px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 text-xs hover:text-white hover:border-white/20 transition-all hidden sm:inline-block"
          >
            Admin
          </Link>
          {supabaseReady && (
            <span className="px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[9px] hidden sm:inline-block" title="Supabase connected">
              ● DB
            </span>
          )}
          <button
            onClick={() => setShowCreate(true)}
            className="px-3 sm:px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan/10 to-purple/10 border border-cyan/30 text-cyan text-xs sm:text-sm hover:from-cyan/20 hover:to-purple/20 transition-all active:scale-95"
          >
            <span className="sm:hidden">+ New</span>
            <span className="hidden sm:inline">+ Create Agent</span>
          </button>
          <WalletButton />
        </div>
      </header>

      {/* Desktop Layout */}
      <div className="flex-1 hidden lg:flex overflow-hidden">
        <aside className="w-72 xl:w-80 p-3 space-y-3 overflow-y-auto border-r border-white/5 bg-space/50">
          <AgentPanel />
          <SwarmControls />
          <MarketDashboard />
        </aside>
        <section className="flex-1 relative">
          <SwarmVisualization />
          <BottomLegend />
        </section>
        <aside className="w-72 xl:w-80 p-3 overflow-y-auto border-l border-white/5 bg-space/50">
          <LaunchFeed />
        </aside>
      </div>

      {/* Mobile/Tablet Layout */}
      <div className="flex-1 flex flex-col lg:hidden overflow-hidden">
        {/* Content area */}
        <div className="flex-1 relative overflow-hidden">
          {mobileTab === "swarm" && (
            <div className="absolute inset-0">
              <SwarmVisualization />
              {/* Floating controls on swarm view */}
              <div className="absolute top-3 left-3 right-3 animate-fade-in">
                <SwarmControls compact />
              </div>
            </div>
          )}
          {mobileTab === "agents" && (
            <div className="absolute inset-0 overflow-y-auto p-3 space-y-3 animate-fade-in">
              <AgentPanel />
            </div>
          )}
          {mobileTab === "launches" && (
            <div className="absolute inset-0 overflow-y-auto p-3 animate-fade-in">
              <LaunchFeed />
            </div>
          )}
          {mobileTab === "market" && (
            <div className="absolute inset-0 overflow-y-auto p-3 animate-fade-in">
              <MarketDashboard />
            </div>
          )}
        </div>

        {/* Mobile Tab Bar */}
        <nav className="shrink-0 flex border-t border-white/10 bg-space/95 backdrop-blur-xl safe-bottom">
          <TabButton
            active={mobileTab === "swarm"}
            onClick={() => setMobileTab("swarm")}
            icon="◎"
            label="Swarm"
            color="text-cyan"
          />
          <TabButton
            active={mobileTab === "agents"}
            onClick={() => setMobileTab("agents")}
            icon="◈"
            label="Agents"
            color="text-purple"
            badge={agents.length || undefined}
          />
          <TabButton
            active={mobileTab === "launches"}
            onClick={() => setMobileTab("launches")}
            icon="◆"
            label="Launches"
            color="text-pink"
            badge={proposals.length || undefined}
          />
          <TabButton
            active={mobileTab === "market"}
            onClick={() => setMobileTab("market")}
            icon="◇"
            label="Market"
            color="text-green-400"
          />
        </nav>
      </div>

      <CreateAgentModal open={showCreate} onClose={() => setShowCreate(false)} />

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-space/80 backdrop-blur-sm">
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-cyan/30 border-t-cyan rounded-full animate-spin mx-auto mb-3" />
            <p className="text-cyan text-sm">Loading from Supabase...</p>
          </div>
        </div>
      )}
    </main>
  );
}

function TabButton({ active, onClick, icon, label, color, badge }: {
  active: boolean; onClick: () => void; icon: string; label: string; color: string; badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center py-2 transition-all relative ${
        active ? color : "text-gray-600"
      }`}
    >
      <span className="text-lg">{icon}</span>
      <span className="text-[10px] mt-0.5">{label}</span>
      {active && <div className={`absolute top-0 left-1/4 right-1/4 h-0.5 rounded-full ${color.replace("text-", "bg-")}`} />}
      {badge !== undefined && badge > 0 && (
        <span className="absolute top-1 right-1/4 w-4 h-4 rounded-full bg-pink/80 text-[9px] flex items-center justify-center">
          {badge}
        </span>
      )}
    </button>
  );
}

function BottomLegend() {
  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10">
      <div className="bg-space/80 backdrop-blur-md border border-white/10 rounded-full px-4 py-1.5 flex gap-4 text-xs text-gray-500">
        <span>🔍 <span className="text-cyan">Scout</span></span>
        <span>📊 <span className="text-purple">Analyst</span></span>
        <span>🚀 <span className="text-pink">Launcher</span></span>
        <span className="text-gray-700 hidden md:inline">|</span>
        <span className="hidden md:inline">Click agent to inspect · Scroll to zoom</span>
      </div>
    </div>
  );
}
