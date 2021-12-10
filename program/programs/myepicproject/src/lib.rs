use anchor_lang::prelude::*;

declare_id!("4f584tPXszcKGzJQcupSFWCJrrpj3eVDfDaQP17e6EXV");

#[program]

pub mod myepicproject {
    use super::*;

    pub fn start_stuff_off(ctx: Context<StartStuffOff>) -> ProgramResult {
        // Get a reference to the account
        let base_account = &mut ctx.accounts.base_account;
        // Initialize total gifs
        base_account.total_gifs = 0;
        Ok(())
    }

    pub fn add_gif(ctx: Context<AddGif>) -> ProgramResult {
        // Get a reference to another account and increment total gifs
        let base_account = &mut ctx.accounts.base_account;
        base_account.total_gifs+=1;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct StartStuffOff<'info> {
    #[account(init, payer = user, space = 9000)]
    pub base_account: Account<'info, BaseAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>
}

#[derive(Accounts)]
pub struct AddGif<'info> {
    #[account(mut)]
    pub base_account: Account<'info, BaseAccount>
}

#[account]
pub struct BaseAccount {
    pub total_gifs: u64
}