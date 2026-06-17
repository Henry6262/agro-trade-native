// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "forge-std/Test.sol";
import "../src/PlantationRound.sol";

contract MockCUSDPR {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external { balanceOf[to] += amount; }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

contract PlantationRoundTest is Test {
    PlantationRound public pr;
    MockCUSDPR public cusd;

    address public adminAddr;
    address public farmer;
    address public investor1;
    address public investor2;

    uint256 public constant PRICE_PER_SHARE = 50 ether;  // 50 cUSD
    uint256 public constant TOTAL_SHARES = 4;
    uint256 public constant TARGET = PRICE_PER_SHARE * TOTAL_SHARES; // 200 cUSD
    uint256 public constant DEADLINE = 1_800_000_000; // far future

    function setUp() public {
        cusd = new MockCUSDPR();
        pr = new PlantationRound(address(cusd));
        adminAddr = address(this);
        farmer = makeAddr("farmer");
        investor1 = makeAddr("investor1");
        investor2 = makeAddr("investor2");

        cusd.mint(investor1, 1000 ether);
        cusd.mint(investor2, 1000 ether);
        cusd.mint(farmer, 1000 ether);

        vm.prank(investor1);
        cusd.approve(address(pr), type(uint256).max);
        vm.prank(investor2);
        cusd.approve(address(pr), type(uint256).max);
        vm.prank(farmer);
        cusd.approve(address(pr), type(uint256).max);
    }

    function _createRound() internal returns (uint256 roundId) {
        vm.prank(farmer);
        roundId = pr.createRound("avocado", TARGET, PRICE_PER_SHARE, DEADLINE, "ipfs://meta");
    }

    function test_createRound_storesRound() public {
        uint256 roundId = _createRound();
        PlantationRound.Round memory r = pr.getRound(roundId);
        assertEq(r.farmer, farmer);
        assertEq(r.cropType, "avocado");
        assertEq(r.targetCUSD, TARGET);
        assertEq(r.totalShares, TOTAL_SHARES);
        assertEq(uint8(r.status), uint8(PlantationRound.RoundStatus.OPEN));
    }

    function test_createRound_revertsIfDeadlineInPast() public {
        vm.prank(farmer);
        vm.expectRevert("Deadline must be future");
        pr.createRound("avocado", TARGET, PRICE_PER_SHARE, block.timestamp - 1, "ipfs://meta");
    }

    function test_invest_mintsNFT() public {
        uint256 roundId = _createRound();
        vm.prank(investor1);
        pr.invest(roundId, 1);
        assertEq(pr.balanceOf(investor1), 1);
        assertEq(pr.ownerOf(0), investor1);
    }

    function test_invest_pullsCUSD() public {
        uint256 roundId = _createRound();
        uint256 before = cusd.balanceOf(investor1);
        vm.prank(investor1);
        pr.invest(roundId, 2);
        assertEq(cusd.balanceOf(investor1), before - PRICE_PER_SHARE * 2);
    }

    function test_invest_statusBecomeFunded_whenAllSharesSold() public {
        uint256 roundId = _createRound();
        vm.prank(investor1);
        pr.invest(roundId, TOTAL_SHARES);
        PlantationRound.Round memory r = pr.getRound(roundId);
        assertEq(uint8(r.status), uint8(PlantationRound.RoundStatus.FUNDED));
    }

    function test_invest_revertsIfRoundNotOpen() public {
        uint256 roundId = _createRound();
        vm.prank(investor1);
        pr.invest(roundId, TOTAL_SHARES); // fills round → FUNDED
        vm.prank(investor2);
        vm.expectRevert("Round not open");
        pr.invest(roundId, 1);
    }

    function test_invest_revertsIfExceedsShares() public {
        uint256 roundId = _createRound();
        vm.prank(investor1);
        vm.expectRevert("Exceeds available shares");
        pr.invest(roundId, TOTAL_SHARES + 1);
    }

    function test_unlockCapital_transfersToBuyer() public {
        uint256 roundId = _createRound();
        vm.prank(investor1);
        pr.invest(roundId, TOTAL_SHARES);

        uint256 farmerBefore = cusd.balanceOf(farmer);
        pr.unlockCapital(roundId); // called as admin (this contract)
        uint256 farmerAfter = cusd.balanceOf(farmer);

        // Farmer gets TARGET minus 2% fee
        uint256 fee = (TARGET * 200) / 10000;
        assertEq(farmerAfter - farmerBefore, TARGET - fee);
        assertEq(uint8(pr.getRound(roundId).status), uint8(PlantationRound.RoundStatus.ACTIVE));
    }

    function test_unlockCapital_revertsIfNotAdmin() public {
        uint256 roundId = _createRound();
        vm.prank(investor1);
        pr.invest(roundId, TOTAL_SHARES);
        vm.prank(farmer);
        vm.expectRevert("Not admin");
        pr.unlockCapital(roundId);
    }

    function test_distributeAndClaim_fullFlow() public {
        uint256 roundId = _createRound();
        // investor1 buys 2 shares, investor2 buys 2 shares
        vm.prank(investor1);
        pr.invest(roundId, 2); // tokenIds 0,1
        vm.prank(investor2);
        pr.invest(roundId, 2); // tokenIds 2,3

        pr.unlockCapital(roundId);

        uint256 saleCUSD = 300 ether; // 300 cUSD total harvest sale
        vm.prank(farmer);
        pr.distributeHarvest(roundId, saleCUSD);

        // investor1 claims token 0 (1/4 share = 75 cUSD)
        uint256 inv1Before = cusd.balanceOf(investor1);
        vm.prank(investor1);
        pr.claimDistribution(0);
        assertEq(cusd.balanceOf(investor1) - inv1Before, saleCUSD / TOTAL_SHARES);
    }

    function test_claimDistribution_revertsIfNotOwner() public {
        uint256 roundId = _createRound();
        vm.prank(investor1);
        pr.invest(roundId, TOTAL_SHARES);
        pr.unlockCapital(roundId);
        vm.prank(farmer);
        pr.distributeHarvest(roundId, 300 ether);

        vm.prank(investor2);
        vm.expectRevert("Not token owner");
        pr.claimDistribution(0); // owned by investor1
    }

    function test_claimDistribution_revertsIfClaimedTwice() public {
        uint256 roundId = _createRound();
        vm.prank(investor1);
        pr.invest(roundId, TOTAL_SHARES);
        pr.unlockCapital(roundId);
        vm.prank(farmer);
        pr.distributeHarvest(roundId, 300 ether);
        vm.prank(investor1);
        pr.claimDistribution(0);
        vm.prank(investor1);
        vm.expectRevert("Nothing to claim");
        pr.claimDistribution(0);
    }
}
