// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract PlantationRound is ERC721, ReentrancyGuard {
    enum RoundStatus { OPEN, FUNDED, ACTIVE, DISTRIBUTING, CLOSED }

    struct Round {
        address farmer;
        string cropType;
        uint256 targetCUSD;
        uint256 pricePerShareCUSD;
        uint256 totalShares;
        uint256 sharesSold;
        uint256 harvestDeadline;
        string metadataURI;
        RoundStatus status;
        uint256 totalDistributionCUSD;
        uint256 claimsMade;
    }

    struct TokenInfo {
        uint256 roundId;
        uint256 shareIndex;
        uint256 claimedCUSD;
    }

    IERC20 public immutable cusd;
    address public admin;

    uint256 public nextRoundId;
    uint256 public nextTokenId;
    uint256 public constant PROTOCOL_FEE_BPS = 200; // 2%

    mapping(uint256 => Round) public rounds;
    mapping(uint256 => TokenInfo) public tokenInfo;
    // roundId => yieldPool (from 2% protocol fee)
    mapping(uint256 => uint256) public yieldPool;

    event RoundCreated(uint256 indexed roundId, address indexed farmer, string cropType, uint256 targetCUSD);
    event SharesPurchased(uint256 indexed roundId, address indexed investor, uint256[] tokenIds);
    event CapitalUnlocked(uint256 indexed roundId, address indexed farmer, uint256 amount);
    event HarvestDistributed(uint256 indexed roundId, uint256 totalCUSD);
    event RoundClosed(uint256 indexed roundId);
    event FeesWithdrawn(uint256 indexed roundId, address indexed recipient, uint256 amount);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    constructor(address _cusd) ERC721("AgroVest Share", "AGVS") {
        cusd = IERC20(_cusd);
        admin = msg.sender;
    }

    function setAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Zero address");
        admin = newAdmin;
    }

    function createRound(
        string calldata cropType,
        uint256 targetCUSD,
        uint256 pricePerShareCUSD,
        uint256 harvestDeadline,
        string calldata metadataURI
    ) external returns (uint256 roundId) {
        require(targetCUSD > 0, "Target must be > 0");
        require(pricePerShareCUSD > 0, "Price must be > 0");
        require(targetCUSD % pricePerShareCUSD == 0, "Target must be divisible by share price");
        require(harvestDeadline > block.timestamp, "Deadline must be future");

        roundId = nextRoundId++;
        uint256 totalShares = targetCUSD / pricePerShareCUSD;

        rounds[roundId] = Round({
            farmer: msg.sender,
            cropType: cropType,
            targetCUSD: targetCUSD,
            pricePerShareCUSD: pricePerShareCUSD,
            totalShares: totalShares,
            sharesSold: 0,
            harvestDeadline: harvestDeadline,
            metadataURI: metadataURI,
            status: RoundStatus.OPEN,
            totalDistributionCUSD: 0,
            claimsMade: 0
        });

        emit RoundCreated(roundId, msg.sender, cropType, targetCUSD);
    }

    function invest(uint256 roundId, uint256 shareCount) external nonReentrant {
        Round storage round = rounds[roundId];
        require(round.status == RoundStatus.OPEN, "Round not open");
        require(shareCount > 0, "Share count must be > 0");
        require(round.sharesSold + shareCount <= round.totalShares, "Exceeds available shares");

        uint256 grossAmount = round.pricePerShareCUSD * shareCount;
        uint256 fee = (grossAmount * PROTOCOL_FEE_BPS) / 10000;

        // Pull gross cUSD from investor
        require(cusd.transferFrom(msg.sender, address(this), grossAmount), "Transfer failed");

        // Accrue fee to round's yield pool
        yieldPool[roundId] += fee;

        round.sharesSold += shareCount;

        // Mint NFTs
        uint256[] memory tokenIds = new uint256[](shareCount);
        for (uint256 i = 0; i < shareCount; i++) {
            uint256 tokenId = nextTokenId++;
            tokenIds[i] = tokenId;
            tokenInfo[tokenId] = TokenInfo({
                roundId: roundId,
                shareIndex: round.sharesSold - shareCount + i,
                claimedCUSD: 0
            });
            _safeMint(msg.sender, tokenId);
        }

        if (round.sharesSold == round.totalShares) {
            round.status = RoundStatus.FUNDED;
        }

        emit SharesPurchased(roundId, msg.sender, tokenIds);
    }

    function unlockCapital(uint256 roundId) external onlyAdmin {
        Round storage round = rounds[roundId];
        require(round.status == RoundStatus.FUNDED, "Round not funded");

        round.status = RoundStatus.ACTIVE;
        uint256 amount = round.pricePerShareCUSD * round.totalShares;
        // Transfer net of protocol fee to farmer
        uint256 fee = (amount * PROTOCOL_FEE_BPS) / 10000;
        uint256 toFarmer = amount - fee;
        require(cusd.transfer(round.farmer, toFarmer), "Transfer failed");

        emit CapitalUnlocked(roundId, round.farmer, toFarmer);
    }

    function distributeHarvest(uint256 roundId, uint256 totalSaleCUSD) external nonReentrant {
        Round storage round = rounds[roundId];
        require(msg.sender == round.farmer, "Not the farmer");
        require(round.status == RoundStatus.ACTIVE, "Round not active");
        require(totalSaleCUSD > 0, "Sale amount must be > 0");

        round.status = RoundStatus.DISTRIBUTING;
        round.totalDistributionCUSD = totalSaleCUSD;

        // Pull sale proceeds from farmer
        require(cusd.transferFrom(msg.sender, address(this), totalSaleCUSD), "Transfer failed");

        emit HarvestDistributed(roundId, totalSaleCUSD);
    }

    function claimDistribution(uint256 tokenId) external nonReentrant {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        TokenInfo storage info = tokenInfo[tokenId];
        Round storage round = rounds[info.roundId];
        require(round.status == RoundStatus.DISTRIBUTING || round.status == RoundStatus.CLOSED, "Not distributing");

        uint256 baseShare = round.totalDistributionCUSD / round.totalShares;
        round.claimsMade += 1;
        bool isLastClaimer = round.claimsMade == round.totalShares;
        uint256 owed;
        if (isLastClaimer) {
            // Last claimer gets baseShare + all remainder dust
            uint256 alreadyPaid = baseShare * (round.totalShares - 1);
            owed = round.totalDistributionCUSD - alreadyPaid - info.claimedCUSD;
        } else {
            owed = baseShare - info.claimedCUSD;
        }
        require(owed > 0, "Nothing to claim");

        info.claimedCUSD += owed;
        require(cusd.transfer(msg.sender, owed), "Transfer failed");
    }

    function closeRound(uint256 roundId) external onlyAdmin {
        Round storage round = rounds[roundId];
        require(round.status == RoundStatus.DISTRIBUTING, "Round not distributing");
        round.status = RoundStatus.CLOSED;
        emit RoundClosed(roundId);
    }

    function withdrawFees(uint256 roundId, address recipient) external onlyAdmin {
        uint256 amount = yieldPool[roundId];
        require(amount > 0, "No fees to withdraw");
        yieldPool[roundId] = 0;
        require(cusd.transfer(recipient, amount), "Transfer failed");
        emit FeesWithdrawn(roundId, recipient, amount);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return rounds[tokenInfo[tokenId].roundId].metadataURI;
    }

    function getRound(uint256 roundId) external view returns (Round memory) {
        return rounds[roundId];
    }

    function getTokenInfo(uint256 tokenId) external view returns (TokenInfo memory) {
        return tokenInfo[tokenId];
    }
}
