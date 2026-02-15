import { describe, it, expect, beforeEach, vi } from "vitest";
import { useGenmonStore } from "@/store/useGenmonStore";

// Mock SupabaseService so store actions don't hit real Supabase
vi.mock("@/services/SupabaseService", () => ({
  SupabaseService: {
    isConfigured: () => false,
    upsertAgent: vi.fn().mockResolvedValue(undefined),
    updateAgentPartial: vi.fn().mockResolvedValue(undefined),
    upsertProposal: vi.fn().mockResolvedValue(undefined),
    updateProposalPartial: vi.fn().mockResolvedValue(undefined),
    addBreedingLog: vi.fn().mockResolvedValue(undefined),
    fetchAgents: vi.fn().mockResolvedValue([]),
    fetchProposals: vi.fn().mockResolvedValue([]),
    fetchBreedingLog: vi.fn().mockResolvedValue([]),
    syncAll: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("useGenmonStore", () => {
  beforeEach(() => {
    useGenmonStore.setState({
      agents: [],
      proposals: [],
      selectedAgent: null,
      swarmMessages: [],
      breedingLog: [],
    });
  });

  it("should start with empty state", () => {
    const state = useGenmonStore.getState();
    expect(state.agents).toHaveLength(0);
    expect(state.proposals).toHaveLength(0);
    expect(state.selectedAgent).toBeNull();
    expect(state.swarmMessages).toHaveLength(0);
  });

  describe("addAgent", () => {
    it("should add an agent with correct color", () => {
      const { addAgent } = useGenmonStore.getState();
      addAgent({
        id: "test-1",
        name: "Scout1",
        type: "SCOUT",
        dna: { riskTolerance: 50, creativity: 50, socialSavvy: 50, analyticalDepth: 50 },
        generation: 0,
        alive: true,
        successCount: 0,
        failCount: 0,
        status: "idle",
        thoughts: [],
        position: [0, 0, 0],
        color: "#000",
        totalPnL: 0, launchCount: 0, bestLaunchPnL: 0, birthTime: Date.now(),
      });

      const agents = useGenmonStore.getState().agents;
      expect(agents).toHaveLength(1);
      expect(agents[0].name).toBe("Scout1");
      expect(agents[0].color).toBe("#00FFFF"); // SCOUT color override
    });

    it("should assign correct colors per type", () => {
      const { addAgent } = useGenmonStore.getState();
      const base = {
        dna: { riskTolerance: 50, creativity: 50, socialSavvy: 50, analyticalDepth: 50 },
        generation: 0, alive: true, successCount: 0, failCount: 0,
        status: "idle" as const, thoughts: [], position: [0, 0, 0] as [number, number, number], color: "#000",
        totalPnL: 0, launchCount: 0, bestLaunchPnL: 0, birthTime: Date.now(),
      };

      addAgent({ ...base, id: "s1", name: "S", type: "SCOUT" });
      addAgent({ ...base, id: "a1", name: "A", type: "ANALYST" });
      addAgent({ ...base, id: "l1", name: "L", type: "LAUNCHER" });

      const agents = useGenmonStore.getState().agents;
      expect(agents[0].color).toBe("#00FFFF");
      expect(agents[1].color).toBe("#BF00FF");
      expect(agents[2].color).toBe("#FF00AA");
    });
  });

  describe("removeAgent", () => {
    it("should remove agent by id", () => {
      const { addAgent, removeAgent } = useGenmonStore.getState();
      addAgent({
        id: "rm-1", name: "ToRemove", type: "SCOUT",
        dna: { riskTolerance: 50, creativity: 50, socialSavvy: 50, analyticalDepth: 50 },
        generation: 0, alive: true, successCount: 0, failCount: 0,
        status: "idle", thoughts: [], position: [0, 0, 0], color: "#000",
        totalPnL: 0, launchCount: 0, bestLaunchPnL: 0, birthTime: Date.now(),
      });
      expect(useGenmonStore.getState().agents).toHaveLength(1);

      removeAgent("rm-1");
      expect(useGenmonStore.getState().agents).toHaveLength(0);
    });
  });

  describe("selectAgent", () => {
    it("should set and clear selected agent", () => {
      const { selectAgent } = useGenmonStore.getState();
      selectAgent("agent-1");
      expect(useGenmonStore.getState().selectedAgent).toBe("agent-1");

      selectAgent(null);
      expect(useGenmonStore.getState().selectedAgent).toBeNull();
    });
  });

  describe("updateAgentStatus", () => {
    it("should update agent status", () => {
      const { addAgent, updateAgentStatus } = useGenmonStore.getState();
      addAgent({
        id: "status-1", name: "StatusTest", type: "ANALYST",
        dna: { riskTolerance: 50, creativity: 50, socialSavvy: 50, analyticalDepth: 50 },
        generation: 0, alive: true, successCount: 0, failCount: 0,
        status: "idle", thoughts: [], position: [0, 0, 0], color: "#000",
        totalPnL: 0, launchCount: 0, bestLaunchPnL: 0, birthTime: Date.now(),
      });

      updateAgentStatus("status-1", "analyzing");
      expect(useGenmonStore.getState().agents[0].status).toBe("analyzing");
    });
  });

  describe("addThought", () => {
    it("should add thought and cap at 10", () => {
      const { addAgent, addThought } = useGenmonStore.getState();
      addAgent({
        id: "think-1", name: "Thinker", type: "SCOUT",
        dna: { riskTolerance: 50, creativity: 50, socialSavvy: 50, analyticalDepth: 50 },
        generation: 0, alive: true, successCount: 0, failCount: 0,
        status: "idle", thoughts: [], position: [0, 0, 0], color: "#000",
        totalPnL: 0, launchCount: 0, bestLaunchPnL: 0, birthTime: Date.now(),
      });

      for (let i = 0; i < 15; i++) {
        addThought("think-1", `Thought ${i}`);
      }

      const thoughts = useGenmonStore.getState().agents[0].thoughts;
      expect(thoughts.length).toBeLessThanOrEqual(10);
      expect(thoughts[thoughts.length - 1]).toBe("Thought 14");
    });
  });

  describe("addProposal", () => {
    it("should add proposal to list", () => {
      const { addProposal } = useGenmonStore.getState();
      addProposal({
        id: "prop-1", tokenName: "TestToken", tokenSymbol: "$TEST",
        concept: "A test token", confidence: 85,
        votes: { scout: true, analyst: true, launcher: false },
        executed: false, successful: null, timestamp: Date.now(),
      });

      const proposals = useGenmonStore.getState().proposals;
      expect(proposals).toHaveLength(1);
      expect(proposals[0].tokenName).toBe("TestToken");
      expect(proposals[0].confidence).toBe(85);
    });
  });

  describe("addSwarmMessage", () => {
    it("should add message and cap at 50", () => {
      const { addSwarmMessage } = useGenmonStore.getState();
      for (let i = 0; i < 60; i++) {
        addSwarmMessage("from", "to", `Message ${i}`);
      }

      const messages = useGenmonStore.getState().swarmMessages;
      expect(messages.length).toBeLessThanOrEqual(50);
    });
  });

  describe("updateAgent", () => {
    it("should update agent fields", () => {
      const { addAgent, updateAgent } = useGenmonStore.getState();
      addAgent({
        id: "upd-1", name: "Updatable", type: "SCOUT",
        dna: { riskTolerance: 50, creativity: 50, socialSavvy: 50, analyticalDepth: 50 },
        generation: 0, alive: true, successCount: 0, failCount: 0,
        status: "idle", thoughts: [], position: [0, 0, 0], color: "#000",
        totalPnL: 0, launchCount: 0, bestLaunchPnL: 0, birthTime: Date.now(),
      });

      updateAgent("upd-1", { totalPnL: 42, successCount: 3, launchCount: 5 });
      const agent = useGenmonStore.getState().agents[0];
      expect(agent.totalPnL).toBe(42);
      expect(agent.successCount).toBe(3);
      expect(agent.launchCount).toBe(5);
    });
  });

  describe("killAgent", () => {
    it("should mark agent as dead", () => {
      const { addAgent, killAgent } = useGenmonStore.getState();
      addAgent({
        id: "kill-1", name: "Doomed", type: "LAUNCHER",
        dna: { riskTolerance: 50, creativity: 50, socialSavvy: 50, analyticalDepth: 50 },
        generation: 0, alive: true, successCount: 0, failCount: 0,
        status: "launching", thoughts: [], position: [0, 0, 0], color: "#000",
        totalPnL: 0, launchCount: 0, bestLaunchPnL: 0, birthTime: Date.now(),
      });

      killAgent("kill-1");
      const agent = useGenmonStore.getState().agents[0];
      expect(agent.alive).toBe(false);
      expect(agent.status).toBe("idle");
    });
  });

  describe("updateProposal", () => {
    it("should update proposal fields", () => {
      const { addProposal, updateProposal } = useGenmonStore.getState();
      addProposal({
        id: "prop-upd", tokenName: "Test", tokenSymbol: "$T",
        concept: "test", confidence: 80,
        votes: { scout: true, analyst: true, launcher: true },
        executed: false, successful: null, timestamp: Date.now(),
      });

      updateProposal("prop-upd", { executed: true, priceChange: 15.5, tokenAddress: "0xABC" });
      const p = useGenmonStore.getState().proposals[0];
      expect(p.executed).toBe(true);
      expect(p.priceChange).toBe(15.5);
      expect(p.tokenAddress).toBe("0xABC");
    });
  });

  describe("addBreedingLog", () => {
    it("should add breeding log entry", () => {
      const { addBreedingLog } = useGenmonStore.getState();
      addBreedingLog("parentA", "parentB", "child1");
      const log = useGenmonStore.getState().breedingLog;
      expect(log).toHaveLength(1);
      expect(log[0].parentA).toBe("parentA");
      expect(log[0].childId).toBe("child1");
    });
  });
});
