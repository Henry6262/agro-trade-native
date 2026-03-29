use anchor_lang::prelude::*;

/// Mirrors Solidity: enum State { AWAITING_PAYMENT, AWAITING_DELIVERY, COMPLETE, DISPUTED, REFUNDED }
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum EscrowState {
    AwaitingPayment,
    AwaitingDelivery,
    Complete,
    Disputed,
    Refunded,
}

/// Global config PDA — stores admin + pending admin (mirrors Solidity admin / pendingAdmin).
/// Seeds: [b"config"]
#[account]
#[derive(InitSpace)]
pub struct Config {
    pub admin: Pubkey,
    pub pending_admin: Pubkey,
    pub bump: u8,
}

/// Per-trade escrow PDA — mirrors Solidity Escrow struct.
/// Seeds: [b"escrow", trade_id.as_bytes()]
#[account]
#[derive(InitSpace)]
pub struct Escrow {
    pub buyer: Pubkey,
    pub seller: Pubkey,
    pub amount: u64,
    pub state: EscrowState,
    #[max_len(64)]
    pub trade_id: String,
    pub mint: Pubkey,
    pub bump: u8,
    pub vault_bump: u8,
}
