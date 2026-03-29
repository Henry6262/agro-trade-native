use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::{Config, Escrow, EscrowState};
use crate::error::EscrowError;

/// Mirrors Solidity: releaseFunds(key) — buyer or admin releases USDC to seller.
pub fn handler(ctx: Context<ReleaseFunds>) -> Result<()> {
    let escrow = &ctx.accounts.escrow;
    let signer_key = ctx.accounts.authority.key();

    require!(
        signer_key == escrow.buyer || signer_key == ctx.accounts.config.admin,
        EscrowError::Unauthorized
    );
    require!(
        escrow.state == EscrowState::AwaitingDelivery,
        EscrowError::InvalidState
    );

    let amount = escrow.amount;
    let escrow_key = escrow.key();
    let seeds: &[&[u8]] = &[b"vault", escrow_key.as_ref(), &[escrow.vault_bump]];

    // Transfer from vault to seller using PDA signer seeds
    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.seller_token_account.to_account_info(),
                authority: ctx.accounts.escrow.to_account_info(),
            },
            &[&[b"escrow", escrow.trade_id.as_bytes(), &[escrow.bump]]],
        ),
        amount,
    )?;

    // Update state
    let escrow = &mut ctx.accounts.escrow;
    escrow.state = EscrowState::Complete;
    escrow.amount = 0;

    emit!(PaymentReleased {
        trade_id: escrow.trade_id.clone(),
    });

    Ok(())
}

#[derive(Accounts)]
pub struct ReleaseFunds<'info> {
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

    /// Seller's token account to receive USDC.
    #[account(
        mut,
        token::mint = escrow.mint,
    )]
    pub seller_token_account: Account<'info, TokenAccount>,

    #[account(
        seeds = [b"config"],
        bump = config.bump,
    )]
    pub config: Account<'info, Config>,

    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

#[event]
pub struct PaymentReleased {
    pub trade_id: String,
}
