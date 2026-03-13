// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AgroEscrow
 * @notice Trustless escrow for agricultural trade payments
 * @dev Deployed on Polygon Amoy testnet for EU grant demonstration
 */
contract AgroEscrow {
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
     * @notice Create escrow for a trade. Buyer sends ETH/MATIC which is held until delivery.
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

        e.state = State.COMPLETE;
        e.seller.transfer(e.amount);

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

        e.state = State.COMPLETE;
        address payable recipient = releaseToBuyer ? e.buyer : e.seller;
        recipient.transfer(e.amount);

        emit DisputeResolved(key, recipient, e.amount);
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
