use anchor_lang::prelude::*;
use crate::state::Config;
use crate::error::EscrowError;

/// Mirrors Solidity: acceptAdmin() — pending admin accepts the role.
pub fn handler(ctx: Context<AcceptAdmin>) -> Result<()> {
    let config = &mut ctx.accounts.config;
    config.admin = config.pending_admin;
    config.pending_admin = Pubkey::default();
    Ok(())
}

#[derive(Accounts)]
pub struct AcceptAdmin<'info> {
    #[account(
        mut,
        seeds = [b"config"],
        bump = config.bump,
        constraint = config.pending_admin == new_admin.key() @ EscrowError::NotPendingAdmin,
    )]
    pub config: Account<'info, Config>,

    pub new_admin: Signer<'info>,
}
