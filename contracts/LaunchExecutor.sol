// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./GenmonRegistry.sol";

struct LaunchProposal {
    uint256 id;
    string tokenName;
    string tokenSymbol;
    string concept;
    uint256 confidenceScore;
    uint256 scoutAgentId;
    uint256 analystAgentId;
    uint256 launcherAgentId;
    bool scoutApproved;
    bool analystApproved;
    bool launcherApproved;
    bool executed;
    bool successful;
    address tokenAddress; // Nad.fun token address after launch
    uint256 createdAt;
}

contract LaunchExecutor {
    GenmonRegistry public registry;
    uint256 public nextProposalId = 1;
    uint256 public constant MIN_CONFIDENCE = 75;

    mapping(uint256 => LaunchProposal) public proposals;
    mapping(address => uint256[]) public ownerProposals;

    event ProposalCreated(uint256 indexed id, string tokenName, uint256 confidence);
    event AgentVoted(uint256 indexed proposalId, uint256 indexed agentId, bool approved);
    event LaunchExecuted(uint256 indexed proposalId, string tokenName, address tokenAddress);
    event LaunchResult(uint256 indexed proposalId, bool successful);

    constructor(address _registry) {
        registry = GenmonRegistry(_registry);
    }

    function createProposal(
        string calldata tokenName,
        string calldata tokenSymbol,
        string calldata concept,
        uint256 confidenceScore,
        uint256 scoutId,
        uint256 analystId,
        uint256 launcherId
    ) external returns (uint256) {
        require(bytes(tokenName).length > 0 && bytes(tokenName).length <= 32, "Invalid token name length");
        require(bytes(tokenSymbol).length > 0 && bytes(tokenSymbol).length <= 10, "Invalid token symbol length");
        require(bytes(concept).length <= 500, "Concept too long");
        require(confidenceScore >= MIN_CONFIDENCE, "Confidence too low");
        Agent memory scout = registry.getAgent(scoutId);
        Agent memory analyst = registry.getAgent(analystId);
        Agent memory launcher = registry.getAgent(launcherId);
        require(scout.agentType == 0 && analyst.agentType == 1 && launcher.agentType == 2, "Wrong types");
        require(scout.owner == msg.sender, "Not owner");

        proposals[nextProposalId] = LaunchProposal({
            id: nextProposalId,
            tokenName: tokenName,
            tokenSymbol: tokenSymbol,
            concept: concept,
            confidenceScore: confidenceScore,
            scoutAgentId: scoutId,
            analystAgentId: analystId,
            launcherAgentId: launcherId,
            scoutApproved: false,
            analystApproved: false,
            launcherApproved: false,
            executed: false,
            successful: false,
            tokenAddress: address(0),
            createdAt: block.timestamp
        });

        ownerProposals[msg.sender].push(nextProposalId);
        emit ProposalCreated(nextProposalId, tokenName, confidenceScore);
        return nextProposalId++;
    }

    function vote(uint256 proposalId, uint256 agentId, bool approved) external {
        LaunchProposal storage p = proposals[proposalId];
        require(!p.executed, "Already executed");
        Agent memory agent = registry.getAgent(agentId);
        require(agent.owner == msg.sender, "Not owner");

        if (agentId == p.scoutAgentId) p.scoutApproved = approved;
        else if (agentId == p.analystAgentId) p.analystApproved = approved;
        else if (agentId == p.launcherAgentId) p.launcherApproved = approved;
        else revert("Agent not in proposal");

        emit AgentVoted(proposalId, agentId, approved);
    }

    function hasConsensus(uint256 proposalId) public view returns (bool) {
        LaunchProposal memory p = proposals[proposalId];
        uint8 votes = 0;
        if (p.scoutApproved) votes++;
        if (p.analystApproved) votes++;
        if (p.launcherApproved) votes++;
        return votes >= 2;
    }

    /// @notice Mark proposal as executed after Nad.fun launch (called by frontend)
    function markExecuted(uint256 proposalId, address tokenAddr) external {
        LaunchProposal storage p = proposals[proposalId];
        require(!p.executed, "Already executed");
        require(hasConsensus(proposalId), "No consensus");
        Agent memory scout = registry.getAgent(p.scoutAgentId);
        require(scout.owner == msg.sender, "Not owner");

        p.executed = true;
        p.tokenAddress = tokenAddr;
        emit LaunchExecuted(proposalId, p.tokenName, tokenAddr);
    }

    function reportResult(uint256 proposalId, bool successful) external {
        LaunchProposal storage p = proposals[proposalId];
        require(p.executed, "Not executed");
        p.successful = successful;

        registry.recordPerformance(p.scoutAgentId, successful);
        registry.recordPerformance(p.analystAgentId, successful);
        registry.recordPerformance(p.launcherAgentId, successful);

        emit LaunchResult(proposalId, successful);
    }

    function getProposal(uint256 proposalId) external view returns (LaunchProposal memory) {
        return proposals[proposalId];
    }
}
