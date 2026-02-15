"use client";
import { useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { useGenmonStore } from "@/store/useGenmonStore";

/**
 * Hook to initialize Supabase data on app load.
 * Syncs wallet address and reloads data when wallet changes.
 */
export function useSupabaseInit() {
  const { address } = useAccount();
  const loadFromSupabase = useGenmonStore((s) => s.loadFromSupabase);
  const syncToSupabase = useGenmonStore((s) => s.syncToSupabase);
  const setWallet = useGenmonStore((s) => s.setWallet);
  const supabaseReady = useGenmonStore((s) => s.supabaseReady);
  const loading = useGenmonStore((s) => s.loading);
  const initialized = useRef(false);

  // Sync wallet address to store
  useEffect(() => {
    setWallet(address ?? null);
  }, [address, setWallet]);

  // Initial load (once)
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    loadFromSupabase(address);
  }, [loadFromSupabase, address]);

  // Periodic sync every 60s
  useEffect(() => {
    if (!supabaseReady) return;
    const interval = setInterval(() => {
      syncToSupabase();
    }, 60_000);
    return () => clearInterval(interval);
  }, [supabaseReady, syncToSupabase]);

  return { supabaseReady, loading };
}
