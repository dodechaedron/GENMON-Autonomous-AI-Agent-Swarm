// ABI fragments for contract interaction
// Matches Solidity contracts in /contracts/
// No GENToken — all tokens launched via Nad.fun

export const GENMON_REGISTRY_ABI = [
  "function createAgent(uint8,uint8,uint8,uint8,uint8) payable returns (uint256)",
  "function createAgentInternal(address,uint8,uint8,uint8,uint8,uint8,uint256) returns (uint256)",
  "function setAuthorizedCaller(address,bool)",
  "function authorizedCallers(address) view returns (bool)",
  "function recordPerformance(uint256,bool)",
  "function getAgent(uint256) view returns (tuple(uint256 id, address owner, tuple(uint8 riskTolerance, uint8 creativity, uint8 socialSavvy, uint8 analyticalDepth) dna, uint8 agentType, uint256 successCount, uint256 failCount, uint256 generation, bool alive, uint256 bornAt))",
  "function getOwnerAgents(address) view returns (uint256[])",
  "function getFitnessScore(uint256) view returns (uint256)",
  "function isEligibleForBreeding(uint256) view returns (bool)",
  "function withdrawStake(uint256)",
  "function owner() view returns (address)",
  "function MIN_STAKE() view returns (uint256)",
  "function nextAgentId() view returns (uint256)",
  "function agentStake(uint256) view returns (uint256)",
  "event AgentBorn(uint256 indexed id, address indexed owner, uint8 agentType, tuple(uint8,uint8,uint8,uint8) dna)",
  "event AgentDied(uint256 indexed id)",
  "event PerformanceRecorded(uint256 indexed id, bool success)",
  "event CallerAuthorized(address indexed caller, bool authorized)",
];

export const EVOLUTION_ENGINE_ABI = [
  "function breed(uint256,uint256) returns (uint256)",
  "event Bred(uint256 indexed parentA, uint256 indexed parentB, uint256 indexed childId)",
];

export const LAUNCH_EXECUTOR_ABI = [
  "function createProposal(string,string,string,uint256,uint256,uint256,uint256) returns (uint256)",
  "function vote(uint256,uint256,bool)",
  "function hasConsensus(uint256) view returns (bool)",
  "function markExecuted(uint256,address)",
  "function reportResult(uint256,bool)",
  "function getProposal(uint256) view returns (tuple(uint256 id, string tokenName, string tokenSymbol, string concept, uint256 confidenceScore, uint256 scoutAgentId, uint256 analystAgentId, uint256 launcherAgentId, bool scoutApproved, bool analystApproved, bool launcherApproved, bool executed, bool successful, address tokenAddress, uint256 createdAt))",
  "event ProposalCreated(uint256 indexed id, string tokenName, uint256 confidence)",
  "event LaunchExecuted(uint256 indexed proposalId, string tokenName, address tokenAddress)",
  "event LaunchResult(uint256 indexed proposalId, bool successful)",
];

export const TREASURY_MANAGER_ABI = [
  "function stake() payable",
  "function unstake(uint256)",
  "function claimRewards()",
  "function distributeRewards() payable",
  "function stakedAmount(address) view returns (uint256)",
  "function pendingRewards(address) view returns (uint256)",
  "function totalStaked() view returns (uint256)",
  "function MAX_STAKERS() view returns (uint256)",
  "event Staked(address indexed user, uint256 amount)",
  "event Unstaked(address indexed user, uint256 amount)",
  "event RewardClaimed(address indexed user, uint256 amount)",
];
