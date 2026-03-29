use anchor_lang::prelude::*;
use crate::state::{Config, Escrow, EscrowState};
use crate::error::EscrowError;

/// Mirrors Solidity: raiseDispute(key) — buyer, seller, or admin can raise.
pub fn handler(ctx: Context<RaiseDispute>) -> Result<()> {
    let escrow = &ctx.accounts.escrow;
    let signer_key = ctx.accounts.authority.key();

    require!(
        signer_key == escrow.buyer
            || signer_key == escrow.seller
            || signer_key == ctx.accounts.config.admin,
        EscrowError::Unauthorized
    );
    require!(
        escrow.state == EscrowState::AwaitingDelivery,
        EscrowError::InvalidState
    );

    let escrow = &mut ctx.accounts.escrow;
    escrow.state = EscrowState::Disputed;

    emit!(DisputeRaised {
        trade_id: escrow.trade_id.clone(),
    });

    Ok(())
}

#[derive(Accounts)]
pub struct RaiseDispute<'info> {
    #[account(
        mut,
        seeds = [b"escrow", escrow.trade_id.as_bytes()],
        bump = escrow.bump,
    )]
    pub escrow: Account<'info, Escrow>,

    #[account(
        seeds = [b"config"],
        bump = config.bump,
    )]
    pub config: Account<'info, Config>,

    pub authority: Signer<'info>,
}

#[event]
pub struct DisputeRaised {
    pub trade_id: String,
}
