// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IERC20Transfer {
    function transfer(address to, uint256 amount) external returns (bool);
}

contract GroveStaking is ReentrancyGuard {
    IERC721 public immutable nftContract;
    IERC20Transfer public immutable cusd;
    address public admin;

    // cUSD per block per staked NFT (18 decimals)
    uint256 public yieldRatePerBlock;

    struct Position {
        address owner;
        uint256 stakedAtBlock;
        uint256 claimedCUSD;
    }

    mapping(uint256 => Position) public positions; // tokenId => Position

    event Staked(uint256 indexed tokenId, address indexed owner);
    event Unstaked(uint256 indexed tokenId, address indexed owner);
    event YieldClaimed(uint256 indexed tokenId, address indexed owner, uint256 amount);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    constructor(address _nftContract, address _cusd, uint256 _yieldRatePerBlock) {
        nftContract = IERC721(_nftContract);
        cusd = IERC20Transfer(_cusd);
        admin = msg.sender;
        yieldRatePerBlock = _yieldRatePerBlock;
    }

    function setAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Zero address");
        admin = newAdmin;
    }

    function setYieldRate(uint256 ratePerBlock) external onlyAdmin {
        yieldRatePerBlock = ratePerBlock;
    }

    function stake(uint256 tokenId) external nonReentrant {
        require(positions[tokenId].owner == address(0), "Already staked");
        require(nftContract.ownerOf(tokenId) == msg.sender, "Not token owner");

        nftContract.transferFrom(msg.sender, address(this), tokenId);

        positions[tokenId] = Position({
            owner: msg.sender,
            stakedAtBlock: block.number,
            claimedCUSD: 0
        });

        emit Staked(tokenId, msg.sender);
    }

    function unstake(uint256 tokenId) external nonReentrant {
        Position storage pos = positions[tokenId];
        require(pos.owner == msg.sender, "Not staker");

        // Auto-claim any pending yield before unstaking
        uint256 pending = _pendingYield(pos);
        if (pending > 0) {
            pos.claimedCUSD += pending;
            require(cusd.transfer(msg.sender, pending), "Yield transfer failed");
            emit YieldClaimed(tokenId, msg.sender, pending);
        }

        delete positions[tokenId];
        nftContract.transferFrom(address(this), msg.sender, tokenId);

        emit Unstaked(tokenId, msg.sender);
    }

    function claimYield(uint256 tokenId) external nonReentrant {
        Position storage pos = positions[tokenId];
        require(pos.owner == msg.sender, "Not staker");

        uint256 pending = _pendingYield(pos);
        require(pending > 0, "Nothing to claim");

        pos.claimedCUSD += pending;
        pos.stakedAtBlock = block.number; // reset accrual window

        require(cusd.transfer(msg.sender, pending), "Transfer failed");
        emit YieldClaimed(tokenId, msg.sender, pending);
    }

    function pendingYield(uint256 tokenId) external view returns (uint256) {
        return _pendingYield(positions[tokenId]);
    }

    function _pendingYield(Position storage pos) internal view returns (uint256) {
        if (pos.owner == address(0)) return 0;
        uint256 blocks = block.number - pos.stakedAtBlock;
        return blocks * yieldRatePerBlock;
    }
}
