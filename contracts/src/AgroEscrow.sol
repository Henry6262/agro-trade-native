// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AgroEscrow
 * @notice Trustless escrow for agricultural trade payments
 * @dev Deployed on Celo Alfajores testnet (chainId 44787). Uses native CELO for escrow.
 */
contract AgroEscrow {
    // AWAITING_PAYMENT is the zero-value default for uninitialized escrows (no escrow created yet)
    // Once createEscrow() is called, state transitions to AWAITING_DELIVERY
    enum State {
        AWAITING_PAYMENT,
        AWAITING_DELIVERY,
        COMPLETE,
        DISPUTED,
        REFUNDED
    }

    struct Escrow {
        address payable buyer;
        address payable seller;
        uint256 amount;
        State state;
        string tradeId; // Off-chain AgroAI trade operation ID
    }

    mapping(bytes32 => Escrow) public escrows;
    address public admin;
    address public pendingAdmin;

    event EscrowCreated(bytes32 indexed key, string tradeId, uint256 amount);
    event PaymentReleased(bytes32 indexed key);
    event DisputeRaised(bytes32 indexed key);
    event DisputeResolved(bytes32 indexed key, address recipient, uint256 amount);
    event Refunded(bytes32 indexed key);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    /**
     * @notice Nominate a new admin — must be accepted by the nominee to take effect
     */
    function nominateAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Zero address");
        pendingAdmin = newAdmin;
    }

    /**
     * @notice Nominee accepts admin role
     */
    function acceptAdmin() external {
        require(msg.sender == pendingAdmin, "Not pending admin");
        admin = pendingAdmin;
        pendingAdmin = address(0);
    }

    /**
     * @notice Create escrow for a trade. Buyer sends CELO which is held until delivery.
     * @param key keccak256 hash of the trade operation ID
     * @param seller Seller's wallet address
     * @param tradeId Off-chain AgroAI trade operation ID for reference
     */
    function createEscrow(
        bytes32 key,
        address payable seller,
        string calldata tradeId
    ) external payable {
        require(msg.value > 0, "Must send funds");
        require(escrows[key].buyer == address(0), "Escrow already exists");
        require(seller != address(0), "Invalid seller address");

        escrows[key] = Escrow({
            buyer: payable(msg.sender),
            seller: seller,
            amount: msg.value,
            state: State.AWAITING_DELIVERY,
            tradeId: tradeId
        });

        emit EscrowCreated(key, tradeId, msg.value);
    }

    /**
     * @notice Buyer confirms delivery and releases payment to seller
     */
    function releaseFunds(bytes32 key) external {
        Escrow storage e = escrows[key];
        require(msg.sender == e.buyer || msg.sender == admin, "Not authorized");
        require(e.state == State.AWAITING_DELIVERY, "Invalid state");

        address payable recipient = e.seller;
        uint256 amount = e.amount;
        e.state = State.COMPLETE;
        e.amount = 0;

        (bool ok, ) = recipient.call{value: amount}("");
        require(ok, "Transfer failed");

        emit PaymentReleased(key);
    }

    /**
     * @notice Raise a dispute — pauses payment until admin resolves
     */
    function raiseDispute(bytes32 key) external {
        Escrow storage e = escrows[key];
        require(msg.sender == e.buyer || msg.sender == e.seller || msg.sender == admin, "Not authorized");
        require(e.state == State.AWAITING_DELIVERY, "Invalid state");

        e.state = State.DISPUTED;
        emit DisputeRaised(key);
    }

    /**
     * @notice Admin resolves a dispute by sending funds to winner
     */
    function resolveDispute(bytes32 key, bool releaseToBuyer) external onlyAdmin {
        Escrow storage e = escrows[key];
        require(e.state == State.DISPUTED, "Not disputed");

        address payable recipient = releaseToBuyer ? e.buyer : e.seller;
        uint256 amount = e.amount;
        e.state = State.COMPLETE;
        e.amount = 0;

        (bool ok, ) = recipient.call{value: amount}("");
        require(ok, "Transfer failed");

        emit DisputeResolved(key, recipient, amount);
    }

    /**
     * @notice Admin refunds buyer — shortcut for resolveDispute(key, true)
     */
    function refund(bytes32 key) external onlyAdmin {
        Escrow storage e = escrows[key];
        require(e.state == State.DISPUTED, "Not disputed");

        address payable buyer = e.buyer;
        uint256 amount = e.amount;
        e.state = State.REFUNDED;
        e.amount = 0;

        (bool ok, ) = buyer.call{value: amount}("");
        require(ok, "Refund failed");

        emit Refunded(key);
    }

    /**
     * @notice Get escrow state for a trade
     */
    function getEscrow(bytes32 key) external view returns (
        address buyer,
        address seller,
        uint256 amount,
        State state,
        string memory tradeId
    ) {
        Escrow storage e = escrows[key];
        return (e.buyer, e.seller, e.amount, e.state, e.tradeId);
    }
}
