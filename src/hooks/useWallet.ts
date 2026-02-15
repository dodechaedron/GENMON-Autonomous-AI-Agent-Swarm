"use client";
import { useMemo } from "react";
import { useAccount, useBalance, useChainId } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { ethers } from "ethers";
import { formatUnits } from "viem";
import { TESTNET_CHAIN_ID, MAINNET_CHAIN_ID } from "@/config/wagmi";

export function useWallet() {
  const { address, isConnecting, isConnected, connector } = useAccount();
  const chainId = useChainId();
  const { data: balanceData } = useBalance({ address });
  const { openConnectModal } = useConnectModal();

  const isCorrectChain = chainId === TESTNET_CHAIN_ID || chainId === MAINNET_CHAIN_ID;
  const isTestnet = chainId === TESTNET_CHAIN_ID;
  const isMainnet = chainId === MAINNET_CHAIN_ID;

  // Bridge to ethers.js signer for existing contract code (SwarmOrchestrator, NadFunService, etc.)
  const { provider, signer } = useMemo(() => {
    if (typeof window === "undefined" || !isConnected || !address) {
      return { provider: null, signer: null };
    }
    try {
      if (!window.ethereum) return { provider: null, signer: null };
      const p = new ethers.BrowserProvider(window.ethereum);
      return { provider: p, signer: null };
    } catch {
      return { provider: null, signer: null };
    }
  }, [isConnected, address]);

  const balance = balanceData ? formatUnits(balanceData.value, balanceData.decimals) : null;

  return {
    address: address ?? null,
    chainId,
    balance,
    isConnecting,
    isConnected,
    isCorrectChain,
    isTestnet,
    isMainnet,
    error: null,
    provider,
    signer,
    connect: openConnectModal ?? (() => {}),
    disconnect: () => {},
    switchToMonad: () => {},
    shortAddress: address
      ? `${address.slice(0, 6)}...${address.slice(-4)}`
      : null,
  };
}

/**
 * Hook to get an ethers.js signer from wagmi's connected wallet.
 * Use this in components that need to pass a signer to SwarmOrchestrator or NadFunService.
 */
export function useEthersSigner() {
  const { address, isConnected } = useAccount();

  const getSigner = useMemo(() => {
    if (typeof window === "undefined" || !window.ethereum || !isConnected || !address) {
      return async () => null;
    }
    return async (): Promise<ethers.JsonRpcSigner | null> => {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum!);
        return await provider.getSigner();
      } catch {
        return null;
      }
    };
  }, [isConnected, address]);

  return { getSigner };
}
