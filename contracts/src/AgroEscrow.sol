// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/**
 * @title AgroEscrow
 * @notice Trustless escrow for agricultural trade payments using cUSD stablecoin
 * @dev Deployed on Celo Sepolia testnet (chainId 11142220). Uses cUSD ERC-20 for escrow.
 *      Platform uses a custodial model — the admin wallet holds cUSD and calls all contract
 *      functions on behalf of users. Admin must approve this contract to spend cUSD before
 *      calling createEscrow.
 *      cUSD Celo Sepolia: 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1
 *      cUSD Celo Mainnet: 0x765DE816845861e75A25fCA122bb6898B8B1282a
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
        address buyer;
        address seller;
        uint256 amount;
        State state;
        string tradeId; // Off-chain AgroAI trade operation ID
    }

    mapping(bytes32 => Escrow) public escrows;
    address public admin;
    address public pendingAdmin;
    address public cusdToken;

    event EscrowCreated(bytes32 indexed key, string tradeId, uint256 amount);
    event PaymentReleased(bytes32 indexed key);
    event DisputeRaised(bytes32 indexed key);
    event DisputeResolved(bytes32 indexed key, address recipient, uint256 amount);
    event Refunded(bytes32 indexed key);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    constructor(address _cusdToken) {
        admin = msg.sender;
        cusdToken = _cusdToken;
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
     * @notice Create escrow for a trade. Caller's cUSD is pulled via transferFrom and held until delivery.
     * @dev Caller must approve this contract to spend at least `amount` cUSD before calling.
     * @param key keccak256 hash of the trade operation ID
     * @param seller Seller's wallet address
     * @param tradeId Off-chain AgroAI trade operation ID for reference
     * @param amount Amount of cUSD (18 decimals) to lock in escrow
     */
    function createEscrow(
        bytes32 key,
        address seller,
        string calldata tradeId,
        uint256 amount
    ) external {
        require(amount > 0, "Amount must be > 0");
        require(escrows[key].buyer == address(0), "Escrow already exists");
        require(seller != address(0), "Invalid seller address");

        bool ok = IERC20(cusdToken).transferFrom(msg.sender, address(this), amount);
        require(ok, "Transfer failed");

        escrows[key] = Escrow({
            buyer: msg.sender,
            seller: seller,
            amount: amount,
            state: State.AWAITING_DELIVERY,
            tradeId: tradeId
        });

        emit EscrowCreated(key, tradeId, amount);
    }

    /**
     * @notice Buyer confirms delivery and releases payment to seller
     */
    function releaseFunds(bytes32 key) external {
        Escrow storage e = escrows[key];
        require(msg.sender == e.buyer || msg.sender == admin, "Not authorized");
        require(e.state == State.AWAITING_DELIVERY, "Invalid state");

        address recipient = e.seller;
        uint256 amount = e.amount;
        e.state = State.COMPLETE;
        e.amount = 0;

        bool ok = IERC20(cusdToken).transfer(recipient, amount);
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
     * @notice Admin resolves a dispute by sending cUSD to the winner
     */
    function resolveDispute(bytes32 key, bool releaseToBuyer) external onlyAdmin {
        Escrow storage e = escrows[key];
        require(e.state == State.DISPUTED, "Not disputed");

        address recipient = releaseToBuyer ? e.buyer : e.seller;
        uint256 amount = e.amount;
        e.state = State.COMPLETE;
        e.amount = 0;

        bool ok = IERC20(cusdToken).transfer(recipient, amount);
        require(ok, "Transfer failed");

        emit DisputeResolved(key, recipient, amount);
    }

    /**
     * @notice Admin refunds buyer — shortcut for resolveDispute(key, true)
     */
    function refund(bytes32 key) external onlyAdmin {
        Escrow storage e = escrows[key];
        require(e.state == State.DISPUTED, "Not disputed");

        address buyer = e.buyer;
        uint256 amount = e.amount;
        e.state = State.REFUNDED;
        e.amount = 0;

        bool ok = IERC20(cusdToken).transfer(buyer, amount);
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
