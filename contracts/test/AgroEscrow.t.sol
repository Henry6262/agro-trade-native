// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/AgroEscrow.sol";

contract MockCUSD {
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

contract AgroEscrowTest is Test {
    AgroEscrow public escrow;
    MockCUSD public cusd;

    address public adminAddr;
    address payable public buyer;
    address payable public seller;
    address payable public stranger;

    bytes32 public constant KEY = keccak256("trade-001");
    bytes32 public constant KEY2 = keccak256("trade-002");
    string public constant TRADE_ID = "trade-001";
    uint256 public constant AMOUNT = 1 ether; // 1e18 — same magnitude as before

    function setUp() public {
        // The test contract itself is the deployer → becomes admin
        cusd = new MockCUSD();
        escrow = new AgroEscrow(address(cusd));
        adminAddr = address(this);

        buyer = payable(makeAddr("buyer"));
        seller = payable(makeAddr("seller"));
        stranger = payable(makeAddr("stranger"));

        // Mint cUSD to participants
        cusd.mint(buyer, 1000 ether);
        cusd.mint(address(this), 1000 ether); // admin needs cUSD too

        // Pre-approve escrow contract to spend cUSD on behalf of buyer and admin
        vm.prank(buyer);
        cusd.approve(address(escrow), type(uint256).max);

        cusd.approve(address(escrow), type(uint256).max);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    function _createEscrow(bytes32 key, uint256 amount) internal {
        vm.prank(buyer);
        escrow.createEscrow(key, seller, TRADE_ID, amount);
    }

    function _raiseDispute(bytes32 key) internal {
        vm.prank(buyer);
        escrow.raiseDispute(key);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // createEscrow
    // ─────────────────────────────────────────────────────────────────────────

    function test_createEscrow_locksValueAndSetsState() public {
        uint256 contractBalanceBefore = cusd.balanceOf(address(escrow));

        _createEscrow(KEY, AMOUNT);

        assertEq(cusd.balanceOf(address(escrow)), contractBalanceBefore + AMOUNT);

        (
            address eBuyer,
            address eSeller,
            uint256 eAmount,
            AgroEscrow.State eState,
            string memory eTradeId
        ) = escrow.getEscrow(KEY);

        assertEq(eBuyer, buyer);
        assertEq(eSeller, seller);
        assertEq(eAmount, AMOUNT);
        assertEq(uint256(eState), uint256(AgroEscrow.State.AWAITING_DELIVERY));
        assertEq(eTradeId, TRADE_ID);
    }

    function test_createEscrow_revertsIfZeroValue() public {
        vm.prank(buyer);
        vm.expectRevert("Amount must be > 0");
        escrow.createEscrow(KEY, seller, TRADE_ID, 0);
    }

    function test_createEscrow_revertsIfDuplicateKey() public {
        _createEscrow(KEY, AMOUNT);

        vm.prank(buyer);
        vm.expectRevert("Escrow already exists");
        escrow.createEscrow(KEY, seller, TRADE_ID, AMOUNT);
    }

    function test_createEscrow_revertsIfSellerIsZeroAddress() public {
        vm.prank(buyer);
        vm.expectRevert("Invalid seller address");
        escrow.createEscrow(KEY, address(0), TRADE_ID, AMOUNT);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // releaseFunds
    // ─────────────────────────────────────────────────────────────────────────

    function test_releaseFunds_buyerCanRelease() public {
        _createEscrow(KEY, AMOUNT);

        uint256 sellerBalanceBefore = cusd.balanceOf(seller);

        vm.prank(buyer);
        escrow.releaseFunds(KEY);

        assertEq(cusd.balanceOf(seller), sellerBalanceBefore + AMOUNT);

        (, , uint256 eAmount, AgroEscrow.State eState, ) = escrow.getEscrow(KEY);
        assertEq(uint256(eState), uint256(AgroEscrow.State.COMPLETE));
        assertEq(eAmount, 0);
    }

    function test_releaseFunds_adminCanRelease() public {
        _createEscrow(KEY, AMOUNT);

        uint256 sellerBalanceBefore = cusd.balanceOf(seller);

        // adminAddr == address(this), no prank needed
        escrow.releaseFunds(KEY);

        assertEq(cusd.balanceOf(seller), sellerBalanceBefore + AMOUNT);

        (, , , AgroEscrow.State eState, ) = escrow.getEscrow(KEY);
        assertEq(uint256(eState), uint256(AgroEscrow.State.COMPLETE));
    }

    function test_releaseFunds_strangerCannotRelease() public {
        _createEscrow(KEY, AMOUNT);

        vm.prank(stranger);
        vm.expectRevert("Not authorized");
        escrow.releaseFunds(KEY);
    }

    function test_releaseFunds_sellerCannotRelease() public {
        _createEscrow(KEY, AMOUNT);

        vm.prank(seller);
        vm.expectRevert("Not authorized");
        escrow.releaseFunds(KEY);
    }

    function test_releaseFunds_revertsIfNotAwaitingDelivery_disputed() public {
        _createEscrow(KEY, AMOUNT);
        _raiseDispute(KEY);

        vm.prank(buyer);
        vm.expectRevert("Invalid state");
        escrow.releaseFunds(KEY);
    }

    function test_releaseFunds_revertsIfNotAwaitingDelivery_complete() public {
        _createEscrow(KEY, AMOUNT);

        vm.prank(buyer);
        escrow.releaseFunds(KEY);

        vm.prank(buyer);
        vm.expectRevert("Invalid state");
        escrow.releaseFunds(KEY);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // raiseDispute
    // ─────────────────────────────────────────────────────────────────────────

    function test_raiseDispute_buyerCanRaise() public {
        _createEscrow(KEY, AMOUNT);

        vm.prank(buyer);
        escrow.raiseDispute(KEY);

        (, , , AgroEscrow.State eState, ) = escrow.getEscrow(KEY);
        assertEq(uint256(eState), uint256(AgroEscrow.State.DISPUTED));
    }

    function test_raiseDispute_sellerCanRaise() public {
        _createEscrow(KEY, AMOUNT);

        vm.prank(seller);
        escrow.raiseDispute(KEY);

        (, , , AgroEscrow.State eState, ) = escrow.getEscrow(KEY);
        assertEq(uint256(eState), uint256(AgroEscrow.State.DISPUTED));
    }

    function test_raiseDispute_adminCanRaise() public {
        _createEscrow(KEY, AMOUNT);

        // adminAddr == address(this), no prank needed
        escrow.raiseDispute(KEY);

        (, , , AgroEscrow.State eState, ) = escrow.getEscrow(KEY);
        assertEq(uint256(eState), uint256(AgroEscrow.State.DISPUTED));
    }

    function test_raiseDispute_strangerCannotRaise() public {
        _createEscrow(KEY, AMOUNT);

        vm.prank(stranger);
        vm.expectRevert("Not authorized");
        escrow.raiseDispute(KEY);
    }

    function test_raiseDispute_revertsIfNotAwaitingDelivery() public {
        _createEscrow(KEY, AMOUNT);
        _raiseDispute(KEY);

        vm.prank(buyer);
        vm.expectRevert("Invalid state");
        escrow.raiseDispute(KEY);
    }

    function test_raiseDispute_revertsIfComplete() public {
        _createEscrow(KEY, AMOUNT);

        vm.prank(buyer);
        escrow.releaseFunds(KEY);

        vm.prank(buyer);
        vm.expectRevert("Invalid state");
        escrow.raiseDispute(KEY);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // resolveDispute
    // ─────────────────────────────────────────────────────────────────────────

    function test_resolveDispute_adminReleasesToSeller() public {
        _createEscrow(KEY, AMOUNT);
        _raiseDispute(KEY);

        uint256 sellerBalanceBefore = cusd.balanceOf(seller);

        // admin calls (address(this))
        escrow.resolveDispute(KEY, false);

        assertEq(cusd.balanceOf(seller), sellerBalanceBefore + AMOUNT);

        (, , uint256 eAmount, AgroEscrow.State eState, ) = escrow.getEscrow(KEY);
        assertEq(uint256(eState), uint256(AgroEscrow.State.COMPLETE));
        assertEq(eAmount, 0);
    }

    function test_resolveDispute_adminRefundsToBuyer() public {
        _createEscrow(KEY, AMOUNT);
        _raiseDispute(KEY);

        uint256 buyerBalanceBefore = cusd.balanceOf(buyer);

        // admin calls (address(this))
        escrow.resolveDispute(KEY, true);

        assertEq(cusd.balanceOf(buyer), buyerBalanceBefore + AMOUNT);

        (, , uint256 eAmount, AgroEscrow.State eState, ) = escrow.getEscrow(KEY);
        assertEq(uint256(eState), uint256(AgroEscrow.State.COMPLETE));
        assertEq(eAmount, 0);
    }

    function test_resolveDispute_revertsIfNotDisputed() public {
        _createEscrow(KEY, AMOUNT);

        vm.expectRevert("Not disputed");
        escrow.resolveDispute(KEY, false);
    }

    function test_resolveDispute_nonAdminCannotResolve() public {
        _createEscrow(KEY, AMOUNT);
        _raiseDispute(KEY);

        vm.prank(stranger);
        vm.expectRevert("Not admin");
        escrow.resolveDispute(KEY, false);
    }

    function test_resolveDispute_buyerCannotResolve() public {
        _createEscrow(KEY, AMOUNT);
        _raiseDispute(KEY);

        vm.prank(buyer);
        vm.expectRevert("Not admin");
        escrow.resolveDispute(KEY, false);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // refund (admin shortcut)
    // ─────────────────────────────────────────────────────────────────────────

    function test_refund_adminCanRefundFromDisputedState() public {
        _createEscrow(KEY, AMOUNT);
        _raiseDispute(KEY);

        uint256 buyerBalanceBefore = cusd.balanceOf(buyer);

        // admin calls (address(this))
        escrow.refund(KEY);

        assertEq(cusd.balanceOf(buyer), buyerBalanceBefore + AMOUNT);

        (, , uint256 eAmount, AgroEscrow.State eState, ) = escrow.getEscrow(KEY);
        assertEq(uint256(eState), uint256(AgroEscrow.State.REFUNDED));
        assertEq(eAmount, 0);
    }

    function test_refund_revertsIfNotDisputed() public {
        _createEscrow(KEY, AMOUNT);

        vm.expectRevert("Not disputed");
        escrow.refund(KEY);
    }

    function test_refund_revertsIfAwaitingDelivery() public {
        _createEscrow(KEY, AMOUNT);

        vm.expectRevert("Not disputed");
        escrow.refund(KEY);
    }

    function test_refund_nonAdminCannotRefund() public {
        _createEscrow(KEY, AMOUNT);
        _raiseDispute(KEY);

        vm.prank(stranger);
        vm.expectRevert("Not admin");
        escrow.refund(KEY);
    }

    function test_refund_buyerCannotRefund() public {
        _createEscrow(KEY, AMOUNT);
        _raiseDispute(KEY);

        vm.prank(buyer);
        vm.expectRevert("Not admin");
        escrow.refund(KEY);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // nominateAdmin / acceptAdmin
    // ─────────────────────────────────────────────────────────────────────────

    function test_nominateAdmin_adminCanNominate() public {
        escrow.nominateAdmin(stranger);
        assertEq(escrow.pendingAdmin(), stranger);
    }

    function test_nominateAdmin_nonAdminCannotNominate() public {
        vm.prank(stranger);
        vm.expectRevert("Not admin");
        escrow.nominateAdmin(stranger);
    }

    function test_nominateAdmin_revertsForZeroAddress() public {
        vm.expectRevert("Zero address");
        escrow.nominateAdmin(address(0));
    }

    function test_acceptAdmin_pendingAdminCanAccept() public {
        escrow.nominateAdmin(stranger);

        vm.prank(stranger);
        escrow.acceptAdmin();

        assertEq(escrow.admin(), stranger);
        assertEq(escrow.pendingAdmin(), address(0));
    }

    function test_acceptAdmin_nonPendingCannotAccept() public {
        escrow.nominateAdmin(stranger);

        vm.prank(buyer);
        vm.expectRevert("Not pending admin");
        escrow.acceptAdmin();
    }

    function test_acceptAdmin_oldAdminCannotAccept() public {
        escrow.nominateAdmin(stranger);

        // adminAddr == address(this) — not the pending admin after nominating stranger
        vm.expectRevert("Not pending admin");
        escrow.acceptAdmin();
    }

    function test_adminTransfer_newAdminCanPerformAdminActions() public {
        escrow.nominateAdmin(stranger);

        vm.prank(stranger);
        escrow.acceptAdmin();

        // Create an escrow as buyer, raise dispute, then have new admin resolve it
        _createEscrow(KEY, AMOUNT);
        _raiseDispute(KEY);

        uint256 sellerBalanceBefore = cusd.balanceOf(seller);

        vm.prank(stranger);
        escrow.resolveDispute(KEY, false);

        assertEq(cusd.balanceOf(seller), sellerBalanceBefore + AMOUNT);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // getEscrow
    // ─────────────────────────────────────────────────────────────────────────

    function test_getEscrow_returnsCorrectValuesAfterCreation() public {
        _createEscrow(KEY, AMOUNT);

        (
            address eBuyer,
            address eSeller,
            uint256 eAmount,
            AgroEscrow.State eState,
            string memory eTradeId
        ) = escrow.getEscrow(KEY);

        assertEq(eBuyer, buyer);
        assertEq(eSeller, seller);
        assertEq(eAmount, AMOUNT);
        assertEq(uint256(eState), uint256(AgroEscrow.State.AWAITING_DELIVERY));
        assertEq(eTradeId, TRADE_ID);
    }

    function test_getEscrow_returnsZeroValuesForNonExistentKey() public view {
        (
            address eBuyer,
            address eSeller,
            uint256 eAmount,
            AgroEscrow.State eState,
            string memory eTradeId
        ) = escrow.getEscrow(KEY);

        assertEq(eBuyer, address(0));
        assertEq(eSeller, address(0));
        assertEq(eAmount, 0);
        assertEq(uint256(eState), uint256(AgroEscrow.State.AWAITING_PAYMENT));
        assertEq(eTradeId, "");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Multiple independent escrows
    // ─────────────────────────────────────────────────────────────────────────

    function test_multipleEscrows_independentKeys() public {
        _createEscrow(KEY, AMOUNT);
        _createEscrow(KEY2, 0.5 ether);

        (, , uint256 amount1, AgroEscrow.State state1, ) = escrow.getEscrow(KEY);
        (, , uint256 amount2, AgroEscrow.State state2, ) = escrow.getEscrow(KEY2);

        assertEq(amount1, AMOUNT);
        assertEq(amount2, 0.5 ether);
        assertEq(uint256(state1), uint256(AgroEscrow.State.AWAITING_DELIVERY));
        assertEq(uint256(state2), uint256(AgroEscrow.State.AWAITING_DELIVERY));

        // Release one, dispute the other independently
        vm.prank(buyer);
        escrow.releaseFunds(KEY);

        vm.prank(buyer);
        escrow.raiseDispute(KEY2);

        (, , , AgroEscrow.State finalState1, ) = escrow.getEscrow(KEY);
        (, , , AgroEscrow.State finalState2, ) = escrow.getEscrow(KEY2);

        assertEq(uint256(finalState1), uint256(AgroEscrow.State.COMPLETE));
        assertEq(uint256(finalState2), uint256(AgroEscrow.State.DISPUTED));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // cUSD balance tracking — contract holds tokens during escrow
    // ─────────────────────────────────────────────────────────────────────────

    function test_contractHoldsCusdDuringEscrow() public {
        _createEscrow(KEY, AMOUNT);
        assertEq(cusd.balanceOf(address(escrow)), AMOUNT);

        _createEscrow(KEY2, 2 ether);
        assertEq(cusd.balanceOf(address(escrow)), AMOUNT + 2 ether);

        vm.prank(buyer);
        escrow.releaseFunds(KEY);

        assertEq(cusd.balanceOf(address(escrow)), 2 ether);
    }
}
