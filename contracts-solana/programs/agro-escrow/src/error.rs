use anchor_lang::prelude::*;

#[error_code]
pub enum EscrowError {
    #[msg("Amount must be greater than 0")]
    ZeroAmount,
    #[msg("Escrow is not in the required state for this operation")]
    InvalidState,
    #[msg("You are not authorized to perform this action")]
    Unauthorized,
    #[msg("Trade ID exceeds maximum length of 64 characters")]
    TradeIdTooLong,
    #[msg("Not the pending admin")]
    NotPendingAdmin,
    #[msg("Invalid admin address")]
    InvalidAdmin,
}
