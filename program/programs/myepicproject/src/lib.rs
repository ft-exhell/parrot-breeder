use anchor_lang::prelude::*;

declare_id!("G985kVvnvWrhbqJY1CwRu4WroHHNFyjqs9D3BG1SRAn2");

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

    pub fn add_gif(ctx: Context<AddGif>, gif_link: String) -> ProgramResult {
        let base_account = &mut ctx.accounts.base_account;
        let user = &mut ctx.accounts.user;

        let item = ItemStruct {
            gif_link: gif_link.to_string(),
            user: *user.to_account_info().key,
            votes: 0
        };

        base_account.gif_list.push(item);
        base_account.total_gifs += 1;
        Ok(())
    }

    pub fn update_gif(ctx: Context<UpdateGif>, gif_link: String) -> ProgramResult {
        let base_account = &mut ctx.accounts.base_account;

        for i in 0..base_account.gif_list.len() {
            if base_account.gif_list[i].gif_link == gif_link.to_string() {
                base_account.gif_list[i].votes += 1;
            }
        }
        Ok(())
    }

    pub fn send_tip(ctx: Context<SendTip>, amount: u64) -> ProgramResult {
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.from.to_account_info().key,
            &ctx.accounts.to.to_account_info().key,
            amount
        );

        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.from.to_account_info(),
                ctx.accounts.to.to_account_info()
            ]
        );
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
    pub base_account: Account<'info, BaseAccount>,
    #[account(mut)]
    pub user: Signer<'info>
}

#[derive(Accounts)]
pub struct UpdateGif<'info> {
    #[account(mut)]
    pub base_account: Account<'info, BaseAccount>
}

#[derive(Accounts)]
pub struct SendTip<'info> {
    #[account(mut)]
    pub from: Signer<'info>,
    #[account(mut)]
    pub to: AccountInfo<'info>,
    system_program: Program<'info, System>
}

#[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct ItemStruct {
    pub gif_link: String,
    pub user: Pubkey,
    pub votes: u64
}

#[account]
pub struct BaseAccount {
    pub total_gifs: u64,
    pub gif_list: Vec<ItemStruct>
}