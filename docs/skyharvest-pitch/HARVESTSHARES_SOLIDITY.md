# HarvestShares Smart Contract — Full Specification

> **Extends:** AgroEscrow.sol (existing Celo escrow)  
> **Standard:** ERC-1155 semi-fungible tokens  
> **Network:** Celo (Sepolia → Mainnet)  
> **Language:** Solidity 0.8.20

---

## Design Philosophy

> **Farmers get capital in winter. Buyers get guaranteed allocation. The platform enforces both.**

We use **ERC-1155** because:
- Shares of the same batch are identical (fungible within batch)
- Different batches are different token IDs (non-fungible across batches)
- Gas-efficient for bulk transfers and airdrops

---

## Contract: HarvestShares.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

interface IERC20Stable {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function decimals() external view returns (uint8);
}

interface IAgroEscrow {
    function createEscrow(string memory tradeId, address buyer, address seller, uint256 amount) external;
    function getEscrow(bytes32 key) external view returns (
        address buyer,
        address seller,
        uint256 amount,
        uint8 state,
        bool exists
    );
}

/**
 * @title HarvestShares
 * @notice Fractional crop ownership with time-locked escrow and pro-rata distributions
 * @dev Each batch = 100 shares (1% each). All monetary values in cUSD wei.
 */
contract HarvestShares is ERC1155, AccessControl, ReentrancyGuard, Pausable {
    using Strings for uint256;

    // ============ ROLES ============
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant FARMER_ROLE = keccak256("FARMER_ROLE");
    bytes32 public constant INSPECTOR_ROLE = keccak256("INSPECTOR_ROLE");

    // ============ STATE ============
    IERC20Stable public immutable cUSD;
    IAgroEscrow public immutable escrow;
    
    uint256 public constant SHARES_PER_BATCH = 100;
    uint256 public constant ADMIN_FEE_BPS = 300;        // 3.00%
    uint256 public constant MIN_INSPECTION_SCORE = 60;   // 0-100 scale
    uint256 public constant BPS_DENOMINATOR = 10000;

    // ============ BATCH STATE ============
    enum BatchStatus {
        DRAFT,           // Farmer creating, not visible
        LISTED,          // Open for purchase
        FUNDED,          // All 100 shares sold
        PLANTED,         // Farmer confirms seeds in ground
        INSPECTED_PASS,  // SkyInspect >= 60
        INSPECTED_FAIL,  // SkyInspect < 60 → refund path
        HARVESTED,       // Crop collected
        DELIVERED,       // To buyers / processing
        SETTLED,         // All distributions complete
        CANCELLED        // Admin emergency stop
    }

    struct Batch {
        string batchId;              // Human-readable: "BG-2026-W-2847"
        address farmer;
        uint256 pricePerShare;       // cUSD wei per 1 share
        uint256 totalDeposited;      // Sum of all buyer payments
        uint256 plantingDate;
        uint256 expectedHarvestDate;
        uint256 actualHarvestDate;
        bytes32 escrowKey;           // Links to AgroEscrow for final settlement
        BatchStatus status;
        string metadataURI;          // IPFS hash with batch details
        string gpsCoordinates;       // "42.1354,24.7453"
        string cropType;
        uint256 inspectionScore;
        string inspectionReportURI;  // IPFS hash
        bool refundAvailable;        // For failed inspections
    }

    // ============ STORAGE ============
    mapping(string => Batch) public batches;
    mapping(string => bool) public batchExists;
    mapping(string => mapping(address => uint256)) public shareBalance;
    mapping(string => address[]) public shareholders;
    mapping(string => mapping(address => bool)) private isShareholder;
    
    // Pull pattern for dividends
    mapping(string => uint256) public totalDividendPerShare;
    mapping(string => mapping(address => uint256)) public dividendClaimedPerShare;
    
    // Pull pattern for refunds
    mapping(string => uint256) public refundAmountPerShare;
    mapping(string => mapping(address => bool)) public refundClaimed;

    // ============ EVENTS ============
    event BatchCreated(
        string indexed batchId,
        address indexed farmer,
        uint256 pricePerShare,
        uint256 expectedHarvestDate
    );
    
    event BatchListed(string indexed batchId);
    
    event SharesPurchased(
        string indexed batchId,
        address indexed buyer,
        uint256 shares,
        uint256 totalCost
    );
    
    event BatchStatusChanged(
        string indexed batchId,
        BatchStatus oldStatus,
        BatchStatus newStatus
    );
    
    event InspectionRecorded(
        string indexed batchId,
        uint256 score,
        bool passed,
        string reportURI
    );
    
    event DividendDistributed(
        string indexed batchId,
        uint256 totalRevenue,
        uint256 adminFee,
        uint256 distributable
    );
    
    event DividendClaimed(
        string indexed batchId,
        address indexed shareholder,
        uint256 amount
    );
    
    event RefundTriggered(
        string indexed batchId,
        uint256 amountPerShare,
        string reason
    );
    
    event RefundClaimed(
        string indexed batchId,
        address indexed shareholder,
        uint256 amount
    );

    // ============ ERRORS ============
    error BatchAlreadyExists();
    error BatchNotFound();
    error InvalidShareAmount();
    error BatchNotListed();
    error InsufficientSharesAvailable();
    error TransferFailed();
    error InvalidStatusTransition();
    error InspectionFailed();
    error NothingToClaim();
    error AlreadyClaimed();
    error InvalidPrice();
    error InvalidDate();

    // ============ CONSTRUCTOR ============
    constructor(
        address _cUSD,
        address _escrow,
        string memory _baseURI
    ) ERC1155(_baseURI) {
        require(_cUSD != address(0), "Invalid cUSD");
        require(_escrow != address(0), "Invalid escrow");
        
        cUSD = IERC20Stable(_cUSD);
        escrow = IAgroEscrow(_escrow);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    // ============ MODIFIERS ============
    modifier batchMustExist(string memory _batchId) {
        if (!batchExists[_batchId]) revert BatchNotFound();
        _;
    }

    // ============ BATCH LIFECYCLE ============

    /**
     * @notice Farmer creates a new batch (DRAFT status)
     * @param _batchId Unique identifier
     * @param _pricePerShare cUSD wei per 1% share
     * @param _expectedHarvestDate Unix timestamp
     * @param _gpsCoordinates "lat,lng"
     * @param _cropType "WHEAT", "CORN", etc.
     * @param _metadataURI IPFS hash with full batch description
     */
    function createBatch(
        string memory _batchId,
        uint256 _pricePerShare,
        uint256 _expectedHarvestDate,
        string memory _gpsCoordinates,
        string memory _cropType,
        string memory _metadataURI
    ) external onlyRole(FARMER_ROLE) whenNotPaused {
        if (batchExists[_batchId]) revert BatchAlreadyExists();
        if (_pricePerShare == 0) revert InvalidPrice();
        if (_expectedHarvestDate <= block.timestamp) revert InvalidDate();

        batches[_batchId] = Batch({
            batchId: _batchId,
            farmer: msg.sender,
            pricePerShare: _pricePerShare,
            totalDeposited: 0,
            plantingDate: 0,
            expectedHarvestDate: _expectedHarvestDate,
            actualHarvestDate: 0,
            escrowKey: 0,
            status: BatchStatus.DRAFT,
            metadataURI: _metadataURI,
            gpsCoordinates: _gpsCoordinates,
            cropType: _cropType,
            inspectionScore: 0,
            inspectionReportURI: "",
            refundAvailable: false
        });

        batchExists[_batchId] = true;

        emit BatchCreated(_batchId, msg.sender, _pricePerShare, _expectedHarvestDate);
    }

    /**
     * @notice Admin approves and lists batch for public purchase
     */
    function listBatch(string memory _batchId) 
        external 
        onlyRole(ADMIN_ROLE) 
        batchMustExist(_batchId) 
        whenNotPaused 
    {
        Batch storage b = batches[_batchId];
        if (b.status != BatchStatus.DRAFT) revert InvalidStatusTransition();
        
        b.status = BatchStatus.LISTED;
        emit BatchStatusChanged(_batchId, BatchStatus.DRAFT, BatchStatus.LISTED);
        emit BatchListed(_batchId);
    }

    /**
     * @notice Buyer purchases shares of a listed batch
     * @param _batchId Batch identifier
     * @param _shares Number of 1% shares to buy (1-100)
     */
    function purchaseShares(string memory _batchId, uint256 _shares) 
        external 
        nonReentrant 
        batchMustExist(_batchId) 
        whenNotPaused 
    {
        if (_shares == 0 || _shares > SHARES_PER_BATCH) revert InvalidShareAmount();
        
        Batch storage b = batches[_batchId];
        if (b.status != BatchStatus.LISTED) revert BatchNotListed();
        
        uint256 alreadySold = totalSharesSold(_batchId);
        if (alreadySold + _shares > SHARES_PER_BATCH) revert InsufficientSharesAvailable();

        uint256 totalCost = _shares * b.pricePerShare;
        
        // Pull cUSD from buyer
        bool success = cUSD.transferFrom(msg.sender, address(this), totalCost);
        if (!success) revert TransferFailed();

        // Mint ERC-1155 tokens
        uint256 tokenId = uint256(keccak256(bytes(_batchId)));
        _mint(msg.sender, tokenId, _shares, "");
        
        // Track shareholder
        if (!isShareholder[_batchId][msg.sender]) {
            shareholders[_batchId].push(msg.sender);
            isShareholder[_batchId][msg.sender] = true;
        }
        
        shareBalance[_batchId][msg.sender] += _shares;
        b.totalDeposited += totalCost;

        emit SharesPurchased(_batchId, msg.sender, _shares, totalCost);

        // Auto-transition to FUNDED if sold out
        if (alreadySold + _shares == SHARES_PER_BATCH) {
            b.status = BatchStatus.FUNDED;
            emit BatchStatusChanged(_batchId, BatchStatus.LISTED, BatchStatus.FUNDED);
        }
    }

    /**
     * @notice Admin confirms farmer has planted the crop
     */
    function confirmPlanting(string memory _batchId) 
        external 
        onlyRole(ADMIN_ROLE) 
        batchMustExist(_batchId) 
    {
        Batch storage b = batches[_batchId];
        if (b.status != BatchStatus.FUNDED) revert InvalidStatusTransition();
        
        b.plantingDate = block.timestamp;
        b.status = BatchStatus.PLANTED;
        
        emit BatchStatusChanged(_batchId, BatchStatus.FUNDED, BatchStatus.PLANTED);
    }

    /**
     * @notice Admin records SkyInspect result
     * @param _score 0-100 quality score
     * @param _passed true if score >= MIN_INSPECTION_SCORE
     * @param _reportURI IPFS hash of full inspection report
     */
    function recordInspection(
        string memory _batchId,
        uint256 _score,
        bool _passed,
        string memory _reportURI
    ) external onlyRole(ADMIN_ROLE) batchMustExist(_batchId) {
        Batch storage b = batches[_batchId];
        if (b.status != BatchStatus.PLANTED) revert InvalidStatusTransition();
        
        b.inspectionScore = _score;
        b.inspectionReportURI = _reportURI;

        if (_passed && _score >= MIN_INSPECTION_SCORE) {
            b.status = BatchStatus.INSPECTED_PASS;
            emit BatchStatusChanged(_batchId, BatchStatus.PLANTED, BatchStatus.INSPECTED_PASS);
        } else {
            b.status = BatchStatus.INSPECTED_FAIL;
            b.refundAvailable = true;
            
            // Calculate refund amount per share
            uint256 refundPerShare = b.totalDeposited / SHARES_PER_BATCH;
            refundAmountPerShare[_batchId] = refundPerShare;
            
            emit BatchStatusChanged(_batchId, BatchStatus.PLANTED, BatchStatus.INSPECTED_FAIL);
            emit RefundTriggered(_batchId, refundPerShare, "Inspection failed");
        }

        emit InspectionRecorded(_batchId, _score, _passed, _reportURI);
    }

    /**
     * @notice Admin confirms harvest completion
     */
    function confirmHarvest(string memory _batchId) 
        external 
        onlyRole(ADMIN_ROLE) 
        batchMustExist(_batchId) 
    {
        Batch storage b = batches[_batchId];
        if (b.status != BatchStatus.INSPECTED_PASS) revert InvalidStatusTransition();
        
        b.actualHarvestDate = block.timestamp;
        b.status = BatchStatus.HARVESTED;
        
        emit BatchStatusChanged(_batchId, BatchStatus.INSPECTED_PASS, BatchStatus.HARVESTED);
    }

    /**
     * @notice Admin confirms delivery to buyers/processing
     */
    function confirmDelivery(string memory _batchId) 
        external 
        onlyRole(ADMIN_ROLE) 
        batchMustExist(_batchId) 
    {
        Batch storage b = batches[_batchId];
        if (b.status != BatchStatus.HARVESTED) revert InvalidStatusTransition();
        
        b.status = BatchStatus.DELIVERED;
        
        emit BatchStatusChanged(_batchId, BatchStatus.HARVESTED, BatchStatus.DELIVERED);
    }

    // ============ DIVIDEND DISTRIBUTION ============

    /**
     * @notice Admin distributes harvest revenue pro-rata to shareholders
     * @param _batchId Batch to distribute for
     * @param _totalRevenue Total cUSD revenue from crop sale
     */
    function distributeDividends(string memory _batchId, uint256 _totalRevenue) 
        external 
        onlyRole(ADMIN_ROLE) 
        batchMustExist(_batchId) 
        nonReentrant 
    {
        Batch storage b = batches[_batchId];
        if (b.status != BatchStatus.DELIVERED) revert InvalidStatusTransition();
        if (_totalRevenue == 0) revert InvalidPrice();

        // Calculate fees and distributable amount
        uint256 adminFee = (_totalRevenue * ADMIN_FEE_BPS) / BPS_DENOMINATOR;
        uint256 distributable = _totalRevenue - adminFee;
        
        // Transfer admin fee
        if (adminFee > 0) {
            bool feeSuccess = cUSD.transfer(msg.sender, adminFee);
            if (!feeSuccess) revert TransferFailed();
        }

        // Record dividend per share (pull pattern)
        uint256 dividendPerShare = distributable / SHARES_PER_BATCH;
        totalDividendPerShare[_batchId] += dividendPerShare;

        // Transfer distributable to contract for pull claims
        bool distSuccess = cUSD.transferFrom(msg.sender, address(this), distributable);
        if (!distSuccess) revert TransferFailed();

        b.status = BatchStatus.SETTLED;
        
        emit DividendDistributed(_batchId, _totalRevenue, adminFee, distributable);
        emit BatchStatusChanged(_batchId, BatchStatus.DELIVERED, BatchStatus.SETTLED);
    }

    /**
     * @notice Shareholder claims their accumulated dividends
     */
    function claimDividends(string memory _batchId) 
        external 
        batchMustExist(_batchId) 
        nonReentrant 
    {
        uint256 shares = shareBalance[_batchId][msg.sender];
        if (shares == 0) revert NothingToClaim();

        uint256 totalPerShare = totalDividendPerShare[_batchId];
        uint256 alreadyClaimed = dividendClaimedPerShare[_batchId][msg.sender];
        uint256 claimablePerShare = totalPerShare - alreadyClaimed;
        
        if (claimablePerShare == 0) revert NothingToClaim();

        uint256 totalClaimable = shares * claimablePerShare;
        dividendClaimedPerShare[_batchId][msg.sender] = totalPerShare;

        bool success = cUSD.transfer(msg.sender, totalClaimable);
        if (!success) revert TransferFailed();

        emit DividendClaimed(_batchId, msg.sender, totalClaimable);
    }

    // ============ REFUND PATH ============

    /**
     * @notice Shareholder claims refund for failed inspection
     */
    function claimRefund(string memory _batchId) 
        external 
        batchMustExist(_batchId) 
        nonReentrant 
    {
        Batch storage b = batches[_batchId];
        if (!b.refundAvailable) revert NothingToClaim();
        if (refundClaimed[_batchId][msg.sender]) revert AlreadyClaimed();
        
        uint256 shares = shareBalance[_batchId][msg.sender];
        if (shares == 0) revert NothingToClaim();

        uint256 refundPerShare = refundAmountPerShare[_batchId];
        uint256 totalRefund = shares * refundPerShare;
        
        refundClaimed[_batchId][msg.sender] = true;

        bool success = cUSD.transfer(msg.sender, totalRefund);
        if (!success) revert TransferFailed();

        // Burn their shares
        uint256 tokenId = uint256(keccak256(bytes(_batchId)));
        _burn(msg.sender, tokenId, shares);
        shareBalance[_batchId][msg.sender] = 0;

        emit RefundClaimed(_batchId, msg.sender, totalRefund);
    }

    // ============ VIEW FUNCTIONS ============

    function totalSharesSold(string memory _batchId) public view returns (uint256) {
        address[] memory holders = shareholders[_batchId];
        uint256 total = 0;
        for (uint i = 0; i < holders.length; i++) {
            total += shareBalance[_batchId][holders[i]];
        }
        return total;
    }

    function getBatch(string memory _batchId) external view returns (Batch memory) {
        return batches[_batchId];
    }

    function getShareholders(string memory _batchId) external view returns (address[] memory) {
        return shareholders[_batchId];
    }

    function claimableDividends(string memory _batchId, address _shareholder) 
        external 
        view 
        returns (uint256) 
    {
        uint256 shares = shareBalance[_batchId][_shareholder];
        if (shares == 0) return 0;
        
        uint256 totalPerShare = totalDividendPerShare[_batchId];
        uint256 alreadyClaimed = dividendClaimedPerShare[_batchId][_shareholder];
        return shares * (totalPerShare - alreadyClaimed);
    }

    function uri(uint256 tokenId) public view override returns (string memory) {
        // Convert tokenId back to batchId for metadata lookup
        // In production, maintain a tokenId => batchId mapping
        return super.uri(tokenId);
    }

    // ============ ADMIN FUNCTIONS ============

    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    function emergencyCancelBatch(string memory _batchId, string memory _reason) 
        external 
        onlyRole(ADMIN_ROLE) 
        batchMustExist(_batchId) 
    {
        Batch storage b = batches[_batchId];
        require(
            b.status != BatchStatus.SETTLED && 
            b.status != BatchStatus.CANCELLED,
            "Cannot cancel"
        );
        
        b.status = BatchStatus.CANCELLED;
        b.refundAvailable = true;
        
        uint256 refundPerShare = b.totalDeposited > 0 
            ? b.totalDeposited / SHARES_PER_BATCH 
            : 0;
        refundAmountPerShare[_batchId] = refundPerShare;
        
        emit RefundTriggered(_batchId, refundPerShare, _reason);
        emit BatchStatusChanged(_batchId, b.status, BatchStatus.CANCELLED);
    }

    function setBaseURI(string memory _newURI) external onlyRole(ADMIN_ROLE) {
        _setURI(_newURI);
    }

    // ============ REQUIRED OVERRIDES ============

    function supportsInterface(bytes4 interfaceId) 
        public 
        view 
        override(ERC1155, AccessControl) 
        returns (bool) 
    {
        return super.supportsInterface(interfaceId);
    }
}
```

---

## Test Coverage Plan

| Test Category | Count | Scenarios |
|--------------|-------|-----------|
| **Batch Creation** | 5 | Valid, duplicate ID, zero price, past date, unauthorized |
| **Purchase** | 8 | Full buy, partial, overbuy, unlisted, zero shares, transfer failure, sold-out auto-transition, pause |
| **Status Transitions** | 10 | Every valid path + invalid jumps |
| **Inspection** | 6 | Pass, fail, boundary score (59, 60, 61), unauthorized, wrong status |
| **Dividend Distribution** | 7 | Happy path, zero revenue, fee calculation, partial claim, double claim, no shares, wrong status |
| **Refund Path** | 6 | Failed inspection refund, emergency cancel, double claim, no shares, after settlement, burn verification |
| **Access Control** | 8 | Admin, farmer, inspector, stranger permissions on all functions |
| **Edge Cases** | 5 | Reentrancy, pause/unpause, URI updates, large share counts, empty shareholder array |
| **Integration** | 4 | cUSD transfer, AgroEscrow linkage, ERC-1155 standard compliance |

**Total: ~59 tests**

---

## Deployment Parameters (Celo Sepolia)

```bash
# Celo Sepolia cUSD
CUSD_ADDRESS=0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1

# Existing AgroEscrow (deploy first)
ESCROW_ADDRESS=<deployed_agro_escrow>

# Base URI for ERC-1155 metadata (IPFS gateway or own server)
BASE_URI=https://api.agrotrade.eu/metadata/harvestshares/{id}.json

# Deploy
PRIVATE_KEY=<admin_key> \
forge script script/DeployHarvestShares.s.sol:DeployHarvestShares \
  --rpc-url https://forno.celo-sepolia.celo-testnet.org \
  --broadcast
```

---

*Contract spec v1.0 — 2026-05-12*  
*Ready for implementation + Foundry test suite*
