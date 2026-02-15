// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

struct AgentDNA {
    uint8 riskTolerance;
    uint8 creativity;
    uint8 socialSavvy;
    uint8 analyticalDepth;
}

struct Agent {
    uint256 id;
    address owner;
    AgentDNA dna;
    uint8 agentType; // 0=SCOUT, 1=ANALYST, 2=LAUNCHER
    uint256 successCount;
    uint256 failCount;
    uint256 generation;
    bool alive;
    uint256 bornAt;
}

contract GenmonRegistry {
    uint256 public nextAgentId = 1;
    uint256 public constant MIN_STAKE = 0.1 ether; // 0.1 MON to create agent
    address public owner;

    mapping(uint256 => Agent) public agents;
    mapping(address => uint256[]) public ownerAgents;
    mapping(uint256 => uint256) public agentStake;
    mapping(address => bool) public authorizedCallers; // trusted contracts

    event AgentBorn(uint256 indexed id, address indexed owner, uint8 agentType, AgentDNA dna);
    event AgentDied(uint256 indexed id);
    event AgentEvolved(uint256 indexed id, AgentDNA newDna);
    event PerformanceRecorded(uint256 indexed id, bool success);
    event CallerAuthorized(address indexed caller, bool authorized);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    function setAuthorizedCaller(address caller, bool authorized) external onlyOwner {
        authorizedCallers[caller] = authorized;
        emit CallerAuthorized(caller, authorized);
    }

    function createAgent(
        uint8 agentType,
        uint8 riskTolerance,
        uint8 creativity,
        uint8 socialSavvy,
        uint8 analyticalDepth
    ) external payable returns (uint256) {
        require(agentType <= 2, "Invalid agent type");
        require(riskTolerance <= 100 && creativity <= 100, "DNA out of range");
        require(socialSavvy <= 100 && analyticalDepth <= 100, "DNA out of range");
        require(msg.value >= MIN_STAKE, "Insufficient MON stake");

        return _createAgent(msg.sender, agentType, riskTolerance, creativity, socialSavvy, analyticalDepth, msg.value, 0);
    }

    /// @notice Internal create for trusted contracts (EvolutionEngine)
    function createAgentInternal(
        address agentOwner,
        uint8 agentType,
        uint8 riskTolerance,
        uint8 creativity,
        uint8 socialSavvy,
        uint8 analyticalDepth,
        uint256 generation
    ) external returns (uint256) {
        require(authorizedCallers[msg.sender], "Not authorized");
        return _createAgent(agentOwner, agentType, riskTolerance, creativity, socialSavvy, analyticalDepth, 0, generation);
    }

    function _createAgent(
        address agentOwner,
        uint8 agentType,
        uint8 riskTolerance,
        uint8 creativity,
        uint8 socialSavvy,
        uint8 analyticalDepth,
        uint256 stakeAmount,
        uint256 generation
    ) internal returns (uint256) {
        AgentDNA memory dna = AgentDNA(riskTolerance, creativity, socialSavvy, analyticalDepth);
        uint256 agentId = nextAgentId++;
        agents[agentId] = Agent({
            id: agentId,
            owner: agentOwner,
            dna: dna,
            agentType: agentType,
            successCount: 0,
            failCount: 0,
            generation: generation,
            alive: true,
            bornAt: block.timestamp
        });

        ownerAgents[agentOwner].push(agentId);
        if (stakeAmount > 0) agentStake[agentId] = stakeAmount;
        emit AgentBorn(agentId, agentOwner, agentType, dna);
        return agentId;
    }

    function recordPerformance(uint256 agentId, bool success) external {
        Agent storage agent = agents[agentId];
        require(agent.alive, "Agent is dead");
        require(agent.owner == msg.sender || authorizedCallers[msg.sender], "Not authorized");

        if (success) {
            agent.successCount++;
        } else {
            agent.failCount++;
            if (agent.failCount >= 3 && agent.successCount == 0) {
                agent.alive = false;
                emit AgentDied(agentId);
            }
        }
        emit PerformanceRecorded(agentId, success);
    }

    function getAgent(uint256 agentId) external view returns (Agent memory) {
        return agents[agentId];
    }

    function getOwnerAgents(address agentOwner) external view returns (uint256[] memory) {
        return ownerAgents[agentOwner];
    }

    function getFitnessScore(uint256 agentId) public view returns (uint256) {
        Agent memory agent = agents[agentId];
        uint256 total = agent.successCount + agent.failCount;
        if (total == 0) return 50;
        return (agent.successCount * 100) / total;
    }

    function isEligibleForBreeding(uint256 agentId) external view returns (bool) {
        Agent memory agent = agents[agentId];
        return agent.alive && agent.successCount >= 2 && getFitnessScore(agentId) >= 60;
    }

    /// @notice Withdraw staked MON when agent dies — uses call instead of transfer
    function withdrawStake(uint256 agentId) external {
        Agent memory agent = agents[agentId];
        require(agent.owner == msg.sender, "Not owner");
        require(!agent.alive, "Agent still alive");
        uint256 amount = agentStake[agentId];
        require(amount > 0, "No stake");
        agentStake[agentId] = 0;
        (bool sent, ) = payable(msg.sender).call{value: amount}("");
        require(sent, "Transfer failed");
    }
}
