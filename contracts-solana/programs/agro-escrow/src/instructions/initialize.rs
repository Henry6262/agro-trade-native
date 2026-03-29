use anchor_lang::prelude::*;
use crate::state::Config;

/// Initialize the global config PDA with the deployer as admin.
/// Mirrors Solidity constructor: admin = msg.sender.
pub fn handler(ctx: Context<Initialize>) -> Result<()> {
    let config = &mut ctx.accounts.config;
    config.admin = ctx.accounts.authority.key();
    config.pending_admin = Pubkey::default();
    config.bump = ctx.bumps.config;
    Ok(())
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Config::INIT_SPACE,
        seeds = [b"config"],
        bump,
    )]
    pub config: Account<'info, Config>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}
