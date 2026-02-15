"use client";
import { useMemo, useCallback, useState, useEffect } from "react";
import { ethers } from "ethers";
import { useWallet, useEthersSigner } from "./useWallet";
import { CONTRACT_ADDRESSES, CONTRACTS_DEPLOYED } from "@/contracts/addresses";
import {
  GENMON_REGISTRY_ABI,
  EVOLUTION_ENGINE_ABI,
  LAUNCH_EXECUTOR_ABI,
  TREASURY_MANAGER_ABI,
} from "@/contracts/abis";

export function useContracts() {
  const { address, isCorrectChain } = useWallet();
  const { getSigner } = useEthersSigner();
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const s = await getSigner();
      if (!cancelled) setSigner(s);
    })();
    return () => { cancelled = true; };
  }, [getSigner]);

  const contracts = useMemo(() => {
    if (!signer || !isCorrectChain || !CONTRACTS_DEPLOYED) return null;

    return {
      registry: new ethers.Contract(CONTRACT_ADDRESSES.GENMON_REGISTRY, GENMON_REGISTRY_ABI, signer),
      evolution: new ethers.Contract(CONTRACT_ADDRESSES.EVOLUTION_ENGINE, EVOLUTION_ENGINE_ABI, signer),
      launcher: new ethers.Contract(CONTRACT_ADDRESSES.LAUNCH_EXECUTOR, LAUNCH_EXECUTOR_ABI, signer),
      treasury: new ethers.Contract(CONTRACT_ADDRESSES.TREASURY_MANAGER, TREASURY_MANAGER_ABI, signer),
    };
  }, [signer, isCorrectChain]);

  // === Registry (MON native staking) ===
  const createAgentOnChain = useCallback(async (
    agentType: number,
    riskTolerance: number,
    creativity: number,
    socialSavvy: number,
    analyticalDepth: number
  ) => {
    if (!contracts) throw new Error("Contracts not ready");
    const minStake = await contracts.registry.MIN_STAKE();
    const tx = await contracts.registry.createAgent(
      agentType, riskTolerance, creativity, socialSavvy, analyticalDepth,
      { value: minStake }
    );
    const receipt = await tx.wait();
    const event = receipt.logs.find((log: ethers.Log) => {
      try {
        return contracts.registry.interface.parseLog({ topics: [...log.topics], data: log.data })?.name === "AgentBorn";
      } catch { return false; }
    });
    if (event) {
      const parsed = contracts.registry.interface.parseLog({ topics: [...event.topics], data: event.data });
      return parsed?.args[0];
    }
    return null;
  }, [contracts]);

  const getAgentOnChain = useCallback(async (agentId: number) => {
    if (!contracts) throw new Error("Contracts not ready");
    return contracts.registry.getAgent(agentId);
  }, [contracts]);

  const getMyAgents = useCallback(async () => {
    if (!contracts || !address) return [];
    return contracts.registry.getOwnerAgents(address);
  }, [contracts, address]);

  // === Evolution ===
  const breedOnChain = useCallback(async (parentAId: number, parentBId: number) => {
    if (!contracts) throw new Error("Contracts not ready");
    const tx = await contracts.evolution.breed(parentAId, parentBId);
    const receipt = await tx.wait();
    const event = receipt.logs.find((log: ethers.Log) => {
      try {
        return contracts.evolution.interface.parseLog({ topics: [...log.topics], data: log.data })?.name === "Bred";
      } catch { return false; }
    });
    if (event) {
      const parsed = contracts.evolution.interface.parseLog({ topics: [...event.topics], data: event.data });
      return parsed?.args[2];
    }
    return null;
  }, [contracts]);

  // === Launch ===
  const createProposalOnChain = useCallback(async (
    tokenName: string, tokenSymbol: string, concept: string,
    confidence: number, scoutId: number, analystId: number, launcherId: number
  ) => {
    if (!contracts) throw new Error("Contracts not ready");
    const tx = await contracts.launcher.createProposal(
      tokenName, tokenSymbol, concept, confidence, scoutId, analystId, launcherId
    );
    return tx.wait();
  }, [contracts]);

  const voteOnChain = useCallback(async (proposalId: number, agentId: number, approved: boolean) => {
    if (!contracts) throw new Error("Contracts not ready");
    const tx = await contracts.launcher.vote(proposalId, agentId, approved);
    return tx.wait();
  }, [contracts]);

  const executeLaunchOnChain = useCallback(async (proposalId: number) => {
    if (!contracts) throw new Error("Contracts not ready");
    const tx = await contracts.launcher.executeLaunch(proposalId);
    return tx.wait();
  }, [contracts]);

  // === Treasury (MON native staking) ===
  const stakeMON = useCallback(async (amount: string) => {
    if (!contracts) throw new Error("Contracts not ready");
    const tx = await contracts.treasury.stake({ value: ethers.parseEther(amount) });
    return tx.wait();
  }, [contracts]);

  const unstakeMON = useCallback(async (amount: string) => {
    if (!contracts) throw new Error("Contracts not ready");
    const tx = await contracts.treasury.unstake(ethers.parseEther(amount));
    return tx.wait();
  }, [contracts]);

  const claimRewards = useCallback(async () => {
    if (!contracts) throw new Error("Contracts not ready");
    const tx = await contracts.treasury.claimRewards();
    return tx.wait();
  }, [contracts]);

  const getStakeInfo = useCallback(async () => {
    if (!contracts || !address) return { staked: "0", pending: "0", total: "0" };
    const [staked, pending, total] = await Promise.all([
      contracts.treasury.stakedAmount(address),
      contracts.treasury.pendingRewards(address),
      contracts.treasury.totalStaked(),
    ]);
    return {
      staked: ethers.formatEther(staked),
      pending: ethers.formatEther(pending),
      total: ethers.formatEther(total),
    };
  }, [contracts, address]);

  return {
    isReady: !!contracts,
    isDeployed: CONTRACTS_DEPLOYED,
    // Registry
    createAgentOnChain,
    getAgentOnChain,
    getMyAgents,
    // Evolution
    breedOnChain,
    // Launch
    createProposalOnChain,
    voteOnChain,
    executeLaunchOnChain,
    // Treasury (MON native)
    stakeMON,
    unstakeMON,
    claimRewards,
    getStakeInfo,
  };
}
