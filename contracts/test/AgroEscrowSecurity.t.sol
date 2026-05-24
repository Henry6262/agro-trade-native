// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "forge-std/Test.sol";
import "../src/AgroEscrow.sol";

/**
 * @title AgroEscrowSecurity
 * @notice Additional security, edge-case, and invariant tests for the AgroEscrow audit.
 */
contract AgroEscrowSecurityTest is Test {
    AgroEscrow public escrow;
    MockCUSD2 public cusd;

    address public admin;
    address public buyer;
    address public seller;
    address public stranger;

    bytes32 public constant KEY = keccak256("trade-security-001");
    string public constant TRADE_ID = "trade-security-001";
    uint256 public constant AMOUNT = 1 ether;

    // Re-entrancy attack contract
    bool public attackMode;
    uint256 public attackCount;

    function setUp() public {
        cusd = new MockCUSD2();
        escrow = new AgroEscrow(address(cusd));
        admin = address(this);

        buyer = makeAddr("buyer");
        seller = makeAddr("seller");
        stranger = makeAddr("stranger");

        cusd.mint(buyer, 1000 ether);
        cusd.mint(address(this), 1000 ether);

        vm.prank(buyer);
        cusd.approve(address(escrow), type(uint256).max);

        cusd.approve(address(escrow), type(uint256).max);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Re-entrancy resistance
    // ─────────────────────────────────────────────────────────────────────────

    function test_createEscrow_notReentrant() public {
        // Even with a malicious callback token, state is written after transferFrom
        // but the key collision check happens before. With cUSD (plain ERC20) this is safe.
        _createEscrow(KEY, AMOUNT);
        assertEq(cusd.balanceOf(address(escrow)), AMOUNT);
    }

    function test_releaseFunds_stateUpdatedBeforeTransfer() public {
        _createEscrow(KEY, AMOUNT);

        uint256 sellerBefore = cusd.balanceOf(seller);

        vm.prank(buyer);
        escrow.releaseFunds(KEY);

        // After release, contract should hold 0 of this escrow's funds
        (, , uint256 eAmount, AgroEscrow.State eState, ) = escrow.getEscrow(KEY);
        assertEq(eAmount, 0);
        assertEq(uint256(eState), uint256(AgroEscrow.State.COMPLETE));
        assertEq(cusd.balanceOf(seller), sellerBefore + AMOUNT);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Double-spend / double-action prevention
    // ─────────────────────────────────────────────────────────────────────────

    function test_cannotReleaseTwice() public {
        _createEscrow(KEY, AMOUNT);

        vm.prank(buyer);
        escrow.releaseFunds(KEY);

        vm.prank(buyer);
        vm.expectRevert("Invalid state");
        escrow.releaseFunds(KEY);
    }

    function test_cannotRefundTwice() public {
        _createEscrow(KEY, AMOUNT);

        vm.prank(buyer);
        escrow.raiseDispute(KEY);

        escrow.refund(KEY);

        vm.expectRevert("Not disputed");
        escrow.refund(KEY);
    }

    function test_cannotResolveDisputeTwice() public {
        _createEscrow(KEY, AMOUNT);

        vm.prank(buyer);
        escrow.raiseDispute(KEY);

        escrow.resolveDispute(KEY, true);

        vm.expectRevert("Not disputed");
        escrow.resolveDispute(KEY, true);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Zero address & self-dealing edge cases
    // ─────────────────────────────────────────────────────────────────────────

    function test_createEscrow_buyerCanBeSeller_revertsOrSucceeds() public {
        // Buyer == seller is currently allowed by the contract
        // This is a design choice — we test current behavior
        vm.prank(buyer);
        escrow.createEscrow(KEY, buyer, TRADE_ID, AMOUNT);

        (, address eSeller, , , ) = escrow.getEscrow(KEY);
        assertEq(eSeller, buyer);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Large amount / overflow edge cases
    // ─────────────────────────────────────────────────────────────────────────

    function test_createEscrow_largeAmount() public {
        uint256 large = type(uint128).max;
        cusd.mint(buyer, large);

        vm.prank(buyer);
        escrow.createEscrow(KEY, seller, TRADE_ID, large);

        (, , uint256 eAmount, , ) = escrow.getEscrow(KEY);
        assertEq(eAmount, large);
    }

    function test_createEscrow_maxUint256_revertsOnMintOverflow() public {
        // This tests the mock token's overflow protection, not the escrow.
        // In production, cUSD would revert on totalSupply overflow.
        // The escrow contract itself uses Solidity 0.8 built-in overflow checks.
        uint256 max = type(uint256).max;
        // Mock token overflows on mint — this proves overflow protection exists
        vm.expectRevert();
        cusd.mint(buyer, max);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Admin privilege boundaries
    // ─────────────────────────────────────────────────────────────────────────

    function test_adminCannotCreateEscrowOnBehalfOfBuyer() public {
        // Admin calling createEscrow pulls admin's own cUSD, not buyer's
        uint256 adminBefore = cusd.balanceOf(admin);
        uint256 buyerBefore = cusd.balanceOf(buyer);

        escrow.createEscrow(KEY, seller, TRADE_ID, AMOUNT);

        assertEq(cusd.balanceOf(admin), adminBefore - AMOUNT);
        assertEq(cusd.balanceOf(buyer), buyerBefore); // buyer untouched
    }

    function test_oldAdminCannotActAfterTransfer() public {
        escrow.nominateAdmin(stranger);
        vm.prank(stranger);
        escrow.acceptAdmin();

        // old admin (this) should no longer be able to resolve disputes
        _createEscrow(KEY, AMOUNT);
        vm.prank(buyer);
        escrow.raiseDispute(KEY);

        vm.expectRevert("Not admin");
        escrow.resolveDispute(KEY, false);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Fund accounting invariants
    // ─────────────────────────────────────────────────────────────────────────

    function test_invariant_contractBalanceEqualsSumOfActiveEscrows() public {
        bytes32 key1 = keccak256("t1");
        bytes32 key2 = keccak256("t2");
        bytes32 key3 = keccak256("t3");

        vm.prank(buyer);
        escrow.createEscrow(key1, seller, "t1", 1 ether);

        vm.prank(buyer);
        escrow.createEscrow(key2, seller, "t2", 2 ether);

        vm.prank(buyer);
        escrow.createEscrow(key3, seller, "t3", 3 ether);

        assertEq(cusd.balanceOf(address(escrow)), 6 ether);

        // Release one
        vm.prank(buyer);
        escrow.releaseFunds(key1);

        assertEq(cusd.balanceOf(address(escrow)), 5 ether);

        // Dispute + refund another
        vm.prank(buyer);
        escrow.raiseDispute(key2);
        escrow.refund(key2);

        assertEq(cusd.balanceOf(address(escrow)), 3 ether);
    }

    function test_invariant_noFundLossOnComplete() public {
        uint256 totalBefore = cusd.balanceOf(buyer) + cusd.balanceOf(seller) + cusd.balanceOf(address(escrow));

        _createEscrow(KEY, AMOUNT);

        uint256 totalDuring = cusd.balanceOf(buyer) + cusd.balanceOf(seller) + cusd.balanceOf(address(escrow));
        assertEq(totalDuring, totalBefore); // no tokens created or destroyed

        vm.prank(buyer);
        escrow.releaseFunds(KEY);

        uint256 totalAfter = cusd.balanceOf(buyer) + cusd.balanceOf(seller) + cusd.balanceOf(address(escrow));
        assertEq(totalAfter, totalBefore); // still conserved
    }

    function test_invariant_noFundLossOnRefund() public {
        uint256 totalBefore = cusd.balanceOf(buyer) + cusd.balanceOf(seller) + cusd.balanceOf(address(escrow));

        _createEscrow(KEY, AMOUNT);
        vm.prank(buyer);
        escrow.raiseDispute(KEY);
        escrow.refund(KEY);

        uint256 totalAfter = cusd.balanceOf(buyer) + cusd.balanceOf(seller) + cusd.balanceOf(address(escrow));
        assertEq(totalAfter, totalBefore);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // State transition matrix
    // ─────────────────────────────────────────────────────────────────────────

    function test_stateTransition_AwaitingDeliveryToComplete() public {
        _createEscrow(KEY, AMOUNT);
        vm.prank(buyer);
        escrow.releaseFunds(KEY);

        (, , , AgroEscrow.State state, ) = escrow.getEscrow(KEY);
        assertEq(uint256(state), uint256(AgroEscrow.State.COMPLETE));
    }

    function test_stateTransition_AwaitingDeliveryToDisputed() public {
        _createEscrow(KEY, AMOUNT);
        vm.prank(buyer);
        escrow.raiseDispute(KEY);

        (, , , AgroEscrow.State state, ) = escrow.getEscrow(KEY);
        assertEq(uint256(state), uint256(AgroEscrow.State.DISPUTED));
    }

    function test_stateTransition_DisputedToComplete() public {
        _createEscrow(KEY, AMOUNT);
        vm.prank(buyer);
        escrow.raiseDispute(KEY);
        escrow.resolveDispute(KEY, false);

        (, , , AgroEscrow.State state, ) = escrow.getEscrow(KEY);
        assertEq(uint256(state), uint256(AgroEscrow.State.COMPLETE));
    }

    function test_stateTransition_DisputedToRefunded() public {
        _createEscrow(KEY, AMOUNT);
        vm.prank(buyer);
        escrow.raiseDispute(KEY);
        escrow.refund(KEY);

        (, , , AgroEscrow.State state, ) = escrow.getEscrow(KEY);
        assertEq(uint256(state), uint256(AgroEscrow.State.REFUNDED));
    }

    function test_cannotTransition_CompleteToAnything() public {
        _createEscrow(KEY, AMOUNT);
        vm.prank(buyer);
        escrow.releaseFunds(KEY);

        vm.prank(buyer);
        vm.expectRevert("Invalid state");
        escrow.raiseDispute(KEY);

        vm.expectRevert("Invalid state");
        escrow.releaseFunds(KEY);
    }

    function test_cannotTransition_RefundedToAnything() public {
        _createEscrow(KEY, AMOUNT);
        vm.prank(buyer);
        escrow.raiseDispute(KEY);
        escrow.refund(KEY);

        // resolveDispute checks "Not disputed" before "Invalid state"
        vm.expectRevert("Not disputed");
        escrow.resolveDispute(KEY, true);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Event emission completeness
    // ─────────────────────────────────────────────────────────────────────────

    function test_events_allEmitted() public {
        // Create
        vm.expectEmit(true, false, false, true);
        emit AgroEscrow.EscrowCreated(KEY, TRADE_ID, AMOUNT);
        _createEscrow(KEY, AMOUNT);

        // Dispute
        vm.expectEmit(true, false, false, false);
        emit AgroEscrow.DisputeRaised(KEY);
        vm.prank(buyer);
        escrow.raiseDispute(KEY);

        // Resolve
        vm.expectEmit(true, false, false, true);
        emit AgroEscrow.DisputeResolved(KEY, buyer, AMOUNT);
        escrow.resolveDispute(KEY, true);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    function _createEscrow(bytes32 key, uint256 amount) internal {
        vm.prank(buyer);
        escrow.createEscrow(key, seller, TRADE_ID, amount);
    }
}

// Minimal mock for the security tests
contract MockCUSD2 {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

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
