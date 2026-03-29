use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::{Config, Escrow, EscrowState};
use crate::error::EscrowError;

/// Mirrors Solidity: resolveDispute(key, releaseToBuyer) — admin only.
pub fn handler(ctx: Context<ResolveDispute>, release_to_buyer: bool) -> Result<()> {
    let escrow = &ctx.accounts.escrow;

    require!(
        ctx.accounts.admin.key() == ctx.accounts.config.admin,
        EscrowError::Unauthorized
    );
    require!(
        escrow.state == EscrowState::Disputed,
        EscrowError::InvalidState
    );

    let amount = escrow.amount;

    // Transfer from vault to the winner
    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.recipient_token_account.to_account_info(),
                authority: ctx.accounts.escrow.to_account_info(),
            },
            &[&[b"escrow", escrow.trade_id.as_bytes(), &[escrow.bump]]],
        ),
        amount,
    )?;

    let escrow = &mut ctx.accounts.escrow;
    escrow.state = EscrowState::Complete;
    escrow.amount = 0;

    emit!(DisputeResolved {
        trade_id: escrow.trade_id.clone(),
        release_to_buyer,
        amount,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct ResolveDispute<'info> {
    #[account(
        mut,
        seeds = [b"escrow", escrow.trade_id.as_bytes()],
        bump = escrow.bump,
    )]
    pub escrow: Account<'info, Escrow>,

    #[account(
        mut,
        seeds = [b"vault", escrow.key().as_ref()],
        bump = escrow.vault_bump,
        token::mint = escrow.mint,
        token::authority = escrow,
    )]
    pub vault: Account<'info, TokenAccount>,

    /// Token account of the dispute winner (buyer or seller — determined off-chain by caller).
    #[account(
        mut,
        token::mint = escrow.mint,
    )]
    pub recipient_token_account: Account<'info, TokenAccount>,

    #[account(
        seeds = [b"config"],
        bump = config.bump,
    )]
    pub config: Account<'info, Config>,

    pub admin: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

#[event]
pub struct DisputeResolved {
    pub trade_id: String,
    pub release_to_buyer: bool,
    pub amount: u64,
}
