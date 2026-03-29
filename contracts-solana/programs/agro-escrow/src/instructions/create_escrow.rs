use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use crate::state::{Escrow, EscrowState};
use crate::error::EscrowError;

/// Mirrors Solidity: createEscrow(key, seller, tradeId, amount)
/// Transfers USDC from buyer's token account into a PDA-owned vault.
pub fn handler(ctx: Context<CreateEscrow>, trade_id: String, amount: u64) -> Result<()> {
    require!(amount > 0, EscrowError::ZeroAmount);
    require!(trade_id.len() <= 64, EscrowError::TradeIdTooLong);

    // Transfer USDC from buyer to vault
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.buyer_token_account.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
                authority: ctx.accounts.buyer.to_account_info(),
            },
        ),
        amount,
    )?;

    // Initialize escrow state
    let escrow = &mut ctx.accounts.escrow;
    escrow.buyer = ctx.accounts.buyer.key();
    escrow.seller = ctx.accounts.seller.key();
    escrow.amount = amount;
    escrow.state = EscrowState::AwaitingDelivery;
    escrow.trade_id = trade_id;
    escrow.mint = ctx.accounts.mint.key();
    escrow.bump = ctx.bumps.escrow;
    escrow.vault_bump = ctx.bumps.vault;

    emit!(EscrowCreated {
        trade_id: escrow.trade_id.clone(),
        amount,
        buyer: escrow.buyer,
        seller: escrow.seller,
    });

    Ok(())
}

#[derive(Accounts)]
#[instruction(trade_id: String)]
pub struct CreateEscrow<'info> {
    #[account(
        init,
        payer = buyer,
        space = 8 + Escrow::INIT_SPACE,
        seeds = [b"escrow", trade_id.as_bytes()],
        bump,
    )]
    pub escrow: Account<'info, Escrow>,

    /// Vault token account owned by the escrow PDA — holds USDC during trade.
    #[account(
        init,
        payer = buyer,
        seeds = [b"vault", escrow.key().as_ref()],
        bump,
        token::mint = mint,
        token::authority = escrow,
    )]
    pub vault: Account<'info, TokenAccount>,

    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        token::mint = mint,
        token::authority = buyer,
    )]
    pub buyer_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub buyer: Signer<'info>,

    /// CHECK: Seller pubkey stored in escrow — validated off-chain by the platform.
    pub seller: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[event]
pub struct EscrowCreated {
    pub trade_id: String,
    pub amount: u64,
    pub buyer: Pubkey,
    pub seller: Pubkey,
}
