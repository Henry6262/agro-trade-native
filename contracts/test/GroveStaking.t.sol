// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "forge-std/Test.sol";
import "../src/PlantationRound.sol";
import "../src/GroveStaking.sol";

contract GroveStakingTest is Test {
    PlantationRound public pr;
    GroveStaking public staking;
    MockCUSDGS public cusd;

    address public farmer;
    address public investor;

    uint256 public constant RATE = 1e15; // 0.001 cUSD per block
    uint256 public constant PRICE = 50 ether;
    uint256 public constant TARGET = PRICE * 2;

    function setUp() public {
        cusd = new MockCUSDGS();
        pr = new PlantationRound(address(cusd));
        staking = new GroveStaking(address(pr), address(cusd), RATE);

        farmer = makeAddr("farmer");
        investor = makeAddr("investor");

        cusd.mint(investor, 1000 ether);
        cusd.mint(address(staking), 1000 ether); // fund yield pool

        vm.prank(investor);
        cusd.approve(address(pr), type(uint256).max);

        // Create and fill a round so investor has NFTs
        vm.prank(farmer);
        cusd.approve(address(pr), type(uint256).max);
        vm.prank(farmer);
        pr.createRound("avocado", TARGET, PRICE, block.timestamp + 1000, "ipfs://x");
        vm.prank(investor);
        pr.invest(0, 2); // tokens 0 and 1

        // Approve staking contract to take NFTs
        vm.prank(investor);
        pr.setApprovalForAll(address(staking), true);
    }

    function test_stake_transfersNFT() public {
        vm.prank(investor);
        staking.stake(0);
        assertEq(pr.ownerOf(0), address(staking));
    }

    function test_stake_revertsIfNotOwner() public {
        address other = makeAddr("other");
        vm.prank(other);
        vm.expectRevert("Not token owner");
        staking.stake(0);
    }

    function test_stake_revertsIfAlreadyStaked() public {
        vm.prank(investor);
        staking.stake(0);
        vm.prank(investor);
        vm.expectRevert("Already staked");
        staking.stake(0);
    }

    function test_pendingYield_accruedCorrectly() public {
        vm.prank(investor);
        staking.stake(0);
        vm.roll(block.number + 100);
        assertEq(staking.pendingYield(0), RATE * 100);
    }

    function test_claimYield_paysCUSD() public {
        vm.prank(investor);
        staking.stake(0);
        vm.roll(block.number + 50);

        uint256 before = cusd.balanceOf(investor);
        vm.prank(investor);
        staking.claimYield(0);
        assertEq(cusd.balanceOf(investor) - before, RATE * 50);
    }

    function test_unstake_returnsNFT_andPaysYield() public {
        vm.prank(investor);
        staking.stake(0);
        vm.roll(block.number + 10);

        uint256 before = cusd.balanceOf(investor);
        vm.prank(investor);
        staking.unstake(0);

        assertEq(pr.ownerOf(0), investor);
        assertEq(cusd.balanceOf(investor) - before, RATE * 10);
    }

    function test_unstake_beforeAnyBlocks_noYield() public {
        vm.prank(investor);
        staking.stake(0);
        // No block advance
        uint256 before = cusd.balanceOf(investor);
        vm.prank(investor);
        staking.unstake(0);
        assertEq(cusd.balanceOf(investor), before); // no yield
    }
}

contract MockCUSDGS {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external { balanceOf[to] += amount; }
    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount; return true;
    }
    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient");
        balanceOf[msg.sender] -= amount; balanceOf[to] += amount; return true;
    }
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount; balanceOf[to] += amount; return true;
    }
}
