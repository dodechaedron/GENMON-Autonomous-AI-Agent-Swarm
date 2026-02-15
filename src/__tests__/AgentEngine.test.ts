import { describe, it, expect, vi } from "vitest";
import { AgentEngine } from "@/engine/AgentEngine";
import { GenmonAgent, AgentDNA } from "@/store/useGenmonStore";

// Mock SupabaseService (imported by store)
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

function makeAgent(overrides: Partial<GenmonAgent> = {}): GenmonAgent {
  return {
    id: `agent-${Math.random()}`,
    name: "TestAgent",
    type: "SCOUT",
    dna: { riskTolerance: 50, creativity: 50, socialSavvy: 50, analyticalDepth: 50 },
    generation: 0,
    alive: true,
    successCount: 0,
    failCount: 0,
    status: "idle",
    thoughts: [],
    position: [0, 0, 0],
    color: "#00FFFF",
    totalPnL: 0,
    launchCount: 0,
    bestLaunchPnL: 0,
    birthTime: Date.now(),
    ...overrides,
  };
}

describe("AgentEngine", () => {
  describe("generateRandomDNA", () => {
    it("should generate DNA with all values between 0-100", () => {
      for (let i = 0; i < 50; i++) {
        const dna = AgentEngine.generateRandomDNA();
        expect(dna.riskTolerance).toBeGreaterThanOrEqual(0);
        expect(dna.riskTolerance).toBeLessThanOrEqual(100);
        expect(dna.creativity).toBeGreaterThanOrEqual(0);
        expect(dna.creativity).toBeLessThanOrEqual(100);
        expect(dna.socialSavvy).toBeGreaterThanOrEqual(0);
        expect(dna.socialSavvy).toBeLessThanOrEqual(100);
        expect(dna.analyticalDepth).toBeGreaterThanOrEqual(0);
        expect(dna.analyticalDepth).toBeLessThanOrEqual(100);
      }
    });

    it("should generate varied DNA (not always the same)", () => {
      const results = Array.from({ length: 20 }, () => AgentEngine.generateRandomDNA());
      const uniqueRisk = new Set(results.map((d) => d.riskTolerance));
      expect(uniqueRisk.size).toBeGreaterThan(1);
    });
  });

  describe("scoutOpportunity", () => {
    it("should return a topic and sentiment", () => {
      const scout = makeAgent({ type: "SCOUT" });
      const result = AgentEngine.scoutOpportunity(scout);
      expect(result.topic).toBeTruthy();
      expect(typeof result.topic).toBe("string");
      expect(result.sentiment).toBeGreaterThanOrEqual(0);
      expect(result.sentiment).toBeLessThanOrEqual(100);
    });

    it("should return sentiment influenced by socialSavvy", () => {
      const highSocial = makeAgent({ dna: { riskTolerance: 50, creativity: 50, socialSavvy: 100, analyticalDepth: 50 } });
      const lowSocial = makeAgent({ dna: { riskTolerance: 50, creativity: 50, socialSavvy: 0, analyticalDepth: 50 } });

      // Run multiple times and average
      let highAvg = 0, lowAvg = 0;
      const runs = 100;
      for (let i = 0; i < runs; i++) {
        highAvg += AgentEngine.scoutOpportunity(highSocial).sentiment;
        lowAvg += AgentEngine.scoutOpportunity(lowSocial).sentiment;
      }
      highAvg /= runs;
      lowAvg /= runs;

      expect(highAvg).toBeGreaterThan(lowAvg);
    });
  });

  describe("analyzeOpportunity", () => {
    it("should return confidence, risk, and recommendation", () => {
      const analyst = makeAgent({ type: "ANALYST" });
      const result = AgentEngine.analyzeOpportunity(analyst, "AI Memes", 80);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(100);
      expect(["LOW", "MEDIUM", "HIGH"]).toContain(result.risk);
      expect(result.recommendation).toBeTruthy();
    });

    it("should recommend launch when confidence >= 75", () => {
      const analyst = makeAgent({
        type: "ANALYST",
        dna: { riskTolerance: 50, creativity: 50, socialSavvy: 50, analyticalDepth: 100 },
      });
      const result = AgentEngine.analyzeOpportunity(analyst, "Hot Topic", 95);
      expect(result.confidence).toBeGreaterThanOrEqual(75);
      expect(result.recommendation).toContain("Recommend launch");
    });
  });

  describe("generateTokenConcept", () => {
    it("should return name, symbol, and concept", () => {
      const launcher = makeAgent({ type: "LAUNCHER" });
      const result = AgentEngine.generateTokenConcept(launcher, "AI Memes");
      expect(result.name).toBeTruthy();
      expect(result.symbol).toBeTruthy();
      expect(result.concept).toContain("AI Memes");
    });
  });

  describe("breedDNA", () => {
    it("should produce child DNA within 0-100 range", () => {
      for (let i = 0; i < 100; i++) {
        const parentA = AgentEngine.generateRandomDNA();
        const parentB = AgentEngine.generateRandomDNA();
        const child = AgentEngine.breedDNA(parentA, parentB);
        expect(child.riskTolerance).toBeGreaterThanOrEqual(0);
        expect(child.riskTolerance).toBeLessThanOrEqual(100);
        expect(child.creativity).toBeGreaterThanOrEqual(0);
        expect(child.creativity).toBeLessThanOrEqual(100);
        expect(child.socialSavvy).toBeGreaterThanOrEqual(0);
        expect(child.socialSavvy).toBeLessThanOrEqual(100);
        expect(child.analyticalDepth).toBeGreaterThanOrEqual(0);
        expect(child.analyticalDepth).toBeLessThanOrEqual(100);
      }
    });

    it("should produce child DNA roughly between parents (with mutation)", () => {
      const parentA: AgentDNA = { riskTolerance: 90, creativity: 90, socialSavvy: 90, analyticalDepth: 90 };
      const parentB: AgentDNA = { riskTolerance: 80, creativity: 80, socialSavvy: 80, analyticalDepth: 80 };
      let totalRisk = 0;
      const runs = 200;
      for (let i = 0; i < runs; i++) {
        totalRisk += AgentEngine.breedDNA(parentA, parentB).riskTolerance;
      }
      const avgRisk = totalRisk / runs;
      // Average should be roughly between parents (70-100 accounting for mutation)
      expect(avgRisk).toBeGreaterThan(70);
      expect(avgRisk).toBeLessThan(100);
    });
  });

  describe("determineType", () => {
    it("should return SCOUT for high social+creativity", () => {
      expect(AgentEngine.determineType({ riskTolerance: 10, creativity: 90, socialSavvy: 90, analyticalDepth: 10 })).toBe("SCOUT");
    });

    it("should return ANALYST for high analytical", () => {
      expect(AgentEngine.determineType({ riskTolerance: 10, creativity: 10, socialSavvy: 10, analyticalDepth: 90 })).toBe("ANALYST");
    });

    it("should return LAUNCHER for high risk", () => {
      expect(AgentEngine.determineType({ riskTolerance: 90, creativity: 10, socialSavvy: 10, analyticalDepth: 10 })).toBe("LAUNCHER");
    });
  });

  describe("runSwarmCycle", () => {
    it("should return null proposal when missing agent types", () => {
      const agents = [makeAgent({ type: "SCOUT" }), makeAgent({ type: "SCOUT" })];
      const result = AgentEngine.runSwarmCycle(agents);
      expect(result.proposal).toBeNull();
    });

    it("should run full cycle with all 3 agent types", () => {
      const agents = [
        makeAgent({ type: "SCOUT", dna: { riskTolerance: 50, creativity: 80, socialSavvy: 90, analyticalDepth: 50 } }),
        makeAgent({ type: "ANALYST", dna: { riskTolerance: 50, creativity: 50, socialSavvy: 50, analyticalDepth: 95 } }),
        makeAgent({ type: "LAUNCHER", dna: { riskTolerance: 80, creativity: 50, socialSavvy: 50, analyticalDepth: 50 } }),
      ];
      const result = AgentEngine.runSwarmCycle(agents);

      // Should always produce thoughts
      expect(result.thoughts.size).toBeGreaterThan(0);

      // Should have at least scout->analyst message
      expect(result.messages.length).toBeGreaterThanOrEqual(1);
    });

    it("should sometimes produce proposals (probabilistic)", () => {
      const agents = [
        makeAgent({ type: "SCOUT", dna: { riskTolerance: 80, creativity: 80, socialSavvy: 95, analyticalDepth: 80 } }),
        makeAgent({ type: "ANALYST", dna: { riskTolerance: 80, creativity: 80, socialSavvy: 80, analyticalDepth: 99 } }),
        makeAgent({ type: "LAUNCHER", dna: { riskTolerance: 95, creativity: 80, socialSavvy: 80, analyticalDepth: 80 } }),
      ];

      let proposalCount = 0;
      for (let i = 0; i < 50; i++) {
        const result = AgentEngine.runSwarmCycle(agents);
        if (result.proposal) {
          proposalCount++;
          expect(result.proposal.confidence).toBeGreaterThanOrEqual(75);
          expect(result.proposal.tokenName).toBeTruthy();
          expect(result.proposal.tokenSymbol).toBeTruthy();
        }
      }
      // With high DNA stats, should produce proposals at least sometimes
      expect(proposalCount).toBeGreaterThan(0);
    });

    it("should skip dead agents", () => {
      const agents = [
        makeAgent({ type: "SCOUT", alive: false }),
        makeAgent({ type: "ANALYST" }),
        makeAgent({ type: "LAUNCHER" }),
      ];
      const result = AgentEngine.runSwarmCycle(agents);
      expect(result.proposal).toBeNull();
    });

    it("proposal should have valid vote structure", () => {
      const agents = [
        makeAgent({ type: "SCOUT", dna: { riskTolerance: 90, creativity: 90, socialSavvy: 99, analyticalDepth: 90 } }),
        makeAgent({ type: "ANALYST", dna: { riskTolerance: 90, creativity: 90, socialSavvy: 90, analyticalDepth: 99 } }),
        makeAgent({ type: "LAUNCHER", dna: { riskTolerance: 99, creativity: 90, socialSavvy: 90, analyticalDepth: 90 } }),
      ];

      for (let i = 0; i < 30; i++) {
        const result = AgentEngine.runSwarmCycle(agents);
        if (result.proposal) {
          const v = result.proposal.votes;
          expect(typeof v.scout).toBe("boolean");
          expect(typeof v.analyst).toBe("boolean");
          expect(typeof v.launcher).toBe("boolean");
          // Must have 2/3 consensus to produce proposal
          const yesVotes = [v.scout, v.analyst, v.launcher].filter(Boolean).length;
          expect(yesVotes).toBeGreaterThanOrEqual(2);
          break;
        }
      }
    });

    it("proposal should track contributing agent IDs", () => {
      const scout = makeAgent({ id: "s1", type: "SCOUT", dna: { riskTolerance: 90, creativity: 90, socialSavvy: 99, analyticalDepth: 90 } });
      const analyst = makeAgent({ id: "a1", type: "ANALYST", dna: { riskTolerance: 90, creativity: 90, socialSavvy: 90, analyticalDepth: 99 } });
      const launcher = makeAgent({ id: "l1", type: "LAUNCHER", dna: { riskTolerance: 99, creativity: 90, socialSavvy: 90, analyticalDepth: 90 } });

      for (let i = 0; i < 30; i++) {
        const result = AgentEngine.runSwarmCycle([scout, analyst, launcher]);
        if (result.proposal) {
          expect(result.proposal.scoutId).toBe("s1");
          expect(result.proposal.analystId).toBe("a1");
          expect(result.proposal.launcherId).toBe("l1");
          break;
        }
      }
    });
  });

  describe("breed", () => {
    it("should create a child agent from two parents", () => {
      const parentA = makeAgent({ id: "pA", name: "Alpha", generation: 1, launchCount: 3, successCount: 2 });
      const parentB = makeAgent({ id: "pB", name: "Beta", generation: 2, launchCount: 5, successCount: 3 });
      const child = AgentEngine.breed(parentA, parentB);

      expect(child.generation).toBe(3); // max(1,2) + 1
      expect(child.alive).toBe(true);
      expect(child.parentIds).toEqual(["pA", "pB"]);
      expect(child.successCount).toBe(0);
      expect(child.launchCount).toBe(0);
      expect(child.totalPnL).toBe(0);
      expect(child.name).toBeTruthy();
      expect(child.id).toContain("agent-");
    });

    it("child DNA should be within valid range", () => {
      for (let i = 0; i < 50; i++) {
        const pA = makeAgent({ dna: AgentEngine.generateRandomDNA() });
        const pB = makeAgent({ dna: AgentEngine.generateRandomDNA() });
        const child = AgentEngine.breed(pA, pB);
        expect(child.dna.riskTolerance).toBeGreaterThanOrEqual(0);
        expect(child.dna.riskTolerance).toBeLessThanOrEqual(100);
        expect(child.dna.creativity).toBeGreaterThanOrEqual(0);
        expect(child.dna.creativity).toBeLessThanOrEqual(100);
      }
    });
  });

  describe("learnFromPerformance", () => {
    it("should reinforce traits on positive PnL", () => {
      const agent = makeAgent({ dna: { riskTolerance: 50, creativity: 50, socialSavvy: 50, analyticalDepth: 50 } });
      const updates = AgentEngine.learnFromPerformance(agent, 20);
      // Should have some updates (reinforcement)
      if (updates.riskTolerance !== undefined) {
        expect(updates.riskTolerance).toBeGreaterThanOrEqual(50);
      }
    });

    it("should reduce risk on large negative PnL", () => {
      const agent = makeAgent({ dna: { riskTolerance: 80, creativity: 50, socialSavvy: 50, analyticalDepth: 30 } });
      const updates = AgentEngine.learnFromPerformance(agent, -30);
      if (updates.riskTolerance !== undefined) {
        expect(updates.riskTolerance).toBeLessThan(80);
      }
      if (updates.analyticalDepth !== undefined) {
        expect(updates.analyticalDepth).toBeGreaterThan(30);
      }
    });
  });

  describe("shouldDie", () => {
    it("should not kill new agents", () => {
      const agent = makeAgent({ launchCount: 1, successCount: 0, failCount: 1, totalPnL: -50 });
      expect(AgentEngine.shouldDie(agent)).toBe(false);
    });

    it("should kill agents with very low win rate", () => {
      const agent = makeAgent({ launchCount: 6, successCount: 0, failCount: 6, totalPnL: -100 });
      expect(AgentEngine.shouldDie(agent)).toBe(true);
    });

    it("should kill agents with massive losses", () => {
      const agent = makeAgent({ launchCount: 3, successCount: 1, failCount: 2, totalPnL: -250 });
      expect(AgentEngine.shouldDie(agent)).toBe(true);
    });
  });

  describe("selectBreedingPair", () => {
    it("should return null with fewer than 2 eligible agents", () => {
      const agents = [makeAgent({ launchCount: 1 })];
      expect(AgentEngine.selectBreedingPair(agents)).toBeNull();
    });

    it("should select top performers", () => {
      const agents = [
        makeAgent({ id: "best", launchCount: 10, successCount: 8, totalPnL: 100, bestLaunchPnL: 50 }),
        makeAgent({ id: "good", launchCount: 8, successCount: 5, totalPnL: 40, bestLaunchPnL: 30 }),
        makeAgent({ id: "bad", launchCount: 5, successCount: 1, totalPnL: -50, bestLaunchPnL: 5 }),
      ];
      const pair = AgentEngine.selectBreedingPair(agents);
      expect(pair).not.toBeNull();
      expect(pair![0].id).toBe("best");
    });

    it("should skip dead agents", () => {
      const agents = [
        makeAgent({ id: "dead", alive: false, launchCount: 10, successCount: 9, totalPnL: 200 }),
        makeAgent({ id: "a", launchCount: 3, successCount: 2, totalPnL: 20 }),
        makeAgent({ id: "b", launchCount: 3, successCount: 1, totalPnL: 10 }),
      ];
      const pair = AgentEngine.selectBreedingPair(agents);
      expect(pair).not.toBeNull();
      expect(pair!.every((a) => a.alive)).toBe(true);
    });
  });
});
