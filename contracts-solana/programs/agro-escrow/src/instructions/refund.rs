use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::{Config, Escrow, EscrowState};
use crate::error::EscrowError;

/// Mirrors Solidity: refund(key) — admin only, from disputed state, sets REFUNDED.
pub fn handler(ctx: Context<Refund>) -> Result<()> {
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

    // Transfer from vault back to buyer
    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.buyer_token_account.to_account_info(),
                authority: ctx.accounts.escrow.to_account_info(),
            },
            &[&[b"escrow", escrow.trade_id.as_bytes(), &[escrow.bump]]],
        ),
        amount,
    )?;

    let escrow = &mut ctx.accounts.escrow;
    escrow.state = EscrowState::Refunded;
    escrow.amount = 0;

    emit!(EscrowRefunded {
        trade_id: escrow.trade_id.clone(),
        amount,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct Refund<'info> {
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

    /// Buyer's token account to receive the refund.
    #[account(
        mut,
        token::mint = escrow.mint,
    )]
    pub buyer_token_account: Account<'info, TokenAccount>,

    #[account(
        seeds = [b"config"],
        bump = config.bump,
    )]
    pub config: Account<'info, Config>,

    pub admin: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

#[event]
pub struct EscrowRefunded {
    pub trade_id: String,
    pub amount: u64,
}
