// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title TreasuryManager — MON native staking for GENMON
/// @notice Users stake MON to participate in swarm governance and earn rewards
contract TreasuryManager {
    address public owner;
    uint256 public constant MAX_STAKERS = 500;

    mapping(address => uint256) public stakedAmount;
    mapping(address => uint256) public stakingTimestamp;
    mapping(address => uint256) public pendingRewards;
    address[] public stakers;
    uint256 public totalStaked;

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardsDistributed(uint256 totalAmount, uint256 stakerCount);
    event RewardClaimed(address indexed user, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    function stake() external payable {
        require(msg.value > 0, "Cannot stake 0");
        if (stakedAmount[msg.sender] == 0) {
            require(stakers.length < MAX_STAKERS, "Max stakers reached");
            stakers.push(msg.sender);
        }
        stakedAmount[msg.sender] += msg.value;
        stakingTimestamp[msg.sender] = block.timestamp;
        totalStaked += msg.value;
        emit Staked(msg.sender, msg.value);
    }

    function unstake(uint256 amount) external {
        require(stakedAmount[msg.sender] >= amount, "Insufficient stake");
        stakedAmount[msg.sender] -= amount;
        totalStaked -= amount;
        (bool sent, ) = payable(msg.sender).call{value: amount}("");
        require(sent, "Transfer failed");
        emit Unstaked(msg.sender, amount);
    }

    /// @notice Distribute MON rewards to stakers (called by owner or swarm)
    function distributeRewards() external payable {
        require(msg.value > 0, "No rewards to distribute");
        require(totalStaked > 0, "No stakers");
        for (uint256 i = 0; i < stakers.length; i++) {
            address staker = stakers[i];
            if (stakedAmount[staker] > 0) {
                uint256 share = (msg.value * stakedAmount[staker]) / totalStaked;
                pendingRewards[staker] += share;
            }
        }
        emit RewardsDistributed(msg.value, stakers.length);
    }

    function claimRewards() external {
        uint256 reward = pendingRewards[msg.sender];
        require(reward > 0, "No rewards");
        pendingRewards[msg.sender] = 0;
        (bool sent, ) = payable(msg.sender).call{value: reward}("");
        require(sent, "Transfer failed");
        emit RewardClaimed(msg.sender, reward);
    }

    receive() external payable {}
}
