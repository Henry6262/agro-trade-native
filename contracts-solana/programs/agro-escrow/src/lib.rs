use anchor_lang::prelude::*;

pub mod error;
pub mod instructions;
pub mod state;

declare_id!("AgroEscrw1111111111111111111111111111111111");

#[program]
pub mod agro_escrow {
    use super::*;

    /// Initialize global config with deployer as admin.
    pub fn initialize(ctx: Context<instructions::initialize::Initialize>) -> Result<()> {
        instructions::initialize::handler(ctx)
    }

    /// Nominate a new admin (current admin only).
    pub fn nominate_admin(
        ctx: Context<instructions::nominate_admin::NominateAdmin>,
        new_admin: Pubkey,
    ) -> Result<()> {
        instructions::nominate_admin::handler(ctx, new_admin)
    }

    /// Pending admin accepts the role.
    pub fn accept_admin(ctx: Context<instructions::accept_admin::AcceptAdmin>) -> Result<()> {
        instructions::accept_admin::handler(ctx)
    }

    /// Create escrow — locks USDC from buyer into PDA vault.
    pub fn create_escrow(
        ctx: Context<instructions::create_escrow::CreateEscrow>,
        trade_id: String,
        amount: u64,
    ) -> Result<()> {
        instructions::create_escrow::handler(ctx, trade_id, amount)
    }

    /// Release funds — buyer or admin sends USDC to seller.
    pub fn release_funds(ctx: Context<instructions::release_funds::ReleaseFunds>) -> Result<()> {
        instructions::release_funds::handler(ctx)
    }

    /// Raise dispute — buyer, seller, or admin.
    pub fn raise_dispute(ctx: Context<instructions::raise_dispute::RaiseDispute>) -> Result<()> {
        instructions::raise_dispute::handler(ctx)
    }

    /// Resolve dispute — admin decides winner.
    pub fn resolve_dispute(
        ctx: Context<instructions::resolve_dispute::ResolveDispute>,
        release_to_buyer: bool,
    ) -> Result<()> {
        instructions::resolve_dispute::handler(ctx, release_to_buyer)
    }

    /// Refund buyer — admin only, from disputed state.
    pub fn refund(ctx: Context<instructions::refund::Refund>) -> Result<()> {
        instructions::refund::handler(ctx)
    }
}
