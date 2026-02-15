// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./GenmonRegistry.sol";

contract EvolutionEngine {
    GenmonRegistry public registry;
    uint256 public constant MUTATION_RANGE = 10;
    uint256 public constant BREED_COST = 500 ether;

    event Bred(uint256 indexed parentA, uint256 indexed parentB, uint256 indexed childId);
    event Mutated(uint256 indexed agentId, AgentDNA newDna);

    constructor(address _registry) {
        registry = GenmonRegistry(_registry);
    }

    function breed(uint256 parentAId, uint256 parentBId) external returns (uint256) {
        require(registry.isEligibleForBreeding(parentAId), "Parent A not eligible");
        require(registry.isEligibleForBreeding(parentBId), "Parent B not eligible");

        Agent memory parentA = registry.getAgent(parentAId);
        Agent memory parentB = registry.getAgent(parentBId);
        require(parentA.owner == msg.sender && parentB.owner == msg.sender, "Not owner");

        // Crossover: average parents' DNA with pseudo-random bias
        uint256 seed = uint256(keccak256(abi.encodePacked(
            block.timestamp, block.prevrandao, parentAId, parentBId
        )));

        uint8 risk = _crossover(parentA.dna.riskTolerance, parentB.dna.riskTolerance, seed);
        uint8 creativity = _crossover(parentA.dna.creativity, parentB.dna.creativity, seed >> 64);
        uint8 social = _crossover(parentA.dna.socialSavvy, parentB.dna.socialSavvy, seed >> 128);
        uint8 analytical = _crossover(parentA.dna.analyticalDepth, parentB.dna.analyticalDepth, seed >> 192);

        // Apply mutation
        risk = _mutate(risk, seed);
        creativity = _mutate(creativity, seed >> 32);
        social = _mutate(social, seed >> 96);
        analytical = _mutate(analytical, seed >> 160);

        // Determine child type based on strongest trait
        uint8 childType = _determineType(risk, creativity, social, analytical);

        // Calculate child generation = max(parentA, parentB) + 1
        uint256 childGen = parentA.generation > parentB.generation
            ? parentA.generation + 1
            : parentB.generation + 1;

        // Use createAgentInternal — no MON stake required for bred agents
        uint256 childId = registry.createAgentInternal(
            msg.sender, childType, risk, creativity, social, analytical, childGen
        );
        emit Bred(parentAId, parentBId, childId);
        return childId;
    }

    function _crossover(uint8 a, uint8 b, uint256 seed) internal pure returns (uint8) {
        uint256 weight = seed % 100;
        uint256 result = (uint256(a) * weight + uint256(b) * (100 - weight)) / 100;
        return uint8(result > 100 ? 100 : result);
    }

    function _mutate(uint8 value, uint256 seed) internal pure returns (uint8) {
        if (seed % 5 == 0) { // 20% mutation chance
            int8 delta = int8(int256(seed % (MUTATION_RANGE * 2)) - int256(MUTATION_RANGE));
            int16 result = int16(int8(value)) + int16(delta);
            if (result < 0) return 0;
            if (result > 100) return 100;
            return uint8(uint16(result));
        }
        return value;
    }

    function _determineType(uint8 risk, uint8 creativity, uint8 social, uint8 analytical)
        internal pure returns (uint8)
    {
        // SCOUT=0 (social+creativity), ANALYST=1 (analytical), LAUNCHER=2 (risk)
        uint16 scoutScore = uint16(social) + uint16(creativity);
        uint16 analystScore = uint16(analytical) * 2;
        uint16 launcherScore = uint16(risk) * 2;

        if (scoutScore >= analystScore && scoutScore >= launcherScore) return 0;
        if (analystScore >= launcherScore) return 1;
        return 2;
    }
}
