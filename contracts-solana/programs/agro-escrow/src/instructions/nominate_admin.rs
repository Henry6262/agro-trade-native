use anchor_lang::prelude::*;
use crate::state::Config;
use crate::error::EscrowError;

/// Mirrors Solidity: nominateAdmin(address newAdmin)
pub fn handler(ctx: Context<NominateAdmin>, new_admin: Pubkey) -> Result<()> {
    require!(new_admin != Pubkey::default(), EscrowError::InvalidAdmin);
    let config = &mut ctx.accounts.config;
    config.pending_admin = new_admin;
    Ok(())
}

#[derive(Accounts)]
pub struct NominateAdmin<'info> {
    #[account(
        mut,
        seeds = [b"config"],
        bump = config.bump,
        constraint = config.admin == admin.key() @ EscrowError::Unauthorized,
    )]
    pub config: Account<'info, Config>,

    pub admin: Signer<'info>,
}
