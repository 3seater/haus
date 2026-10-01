use anchor_lang::prelude::*;
use anchor_lang::solana_program::hash::hashv;
use anchor_spl::token_interface::Mint;
use anchor_spl::token::{self, CloseAccount, Token, TokenAccount};

// Development identity only. Generate a deployment keypair and run `anchor keys sync`.
declare_id!("FBVrAjsfxzA6ENq2vaf7Szwzj213uLsHMidYh6SRTu75");

const HOLD: u8 = 0;
const HOLDERS: u8 = 1;
const DEVELOPER: u8 = 2;
// Buy-and-burn is deliberately unavailable until its bounded swap adapter is tested.
const MAX_CHOICE: u8 = DEVELOPER;

#[program]
pub mod haus_vault {
    use super::*;

    pub fn initialize_config(ctx: Context<InitializeConfig>, snapshot_authority: Pubkey, policy: Policy) -> Result<()> {
        policy.validate()?;
        require!(snapshot_authority != Pubkey::default(), VaultError::Authority);
        let config = &mut ctx.accounts.config;
        config.authority = ctx.accounts.authority.key();
        config.pending_authority = Pubkey::default();
        config.snapshot_authority = snapshot_authority;
        config.paused = false;
        config.policy = policy;
        config.bump = ctx.bumps.config;
        Ok(())
    }

    pub fn set_policy(ctx: Context<Admin>, policy: Policy) -> Result<()> {
        policy.validate()?;
        // Every existing round has its own frozen policy.
        ctx.accounts.config.policy = policy;
        Ok(())
    }

    pub fn set_paused(ctx: Context<Admin>, paused: bool) -> Result<()> {
        ctx.accounts.config.paused = paused;
        Ok(())
    }

    pub fn set_snapshot_authority(ctx: Context<Admin>, authority: Pubkey) -> Result<()> {
        require!(authority != Pubkey::default(), VaultError::Authority);
        ctx.accounts.config.snapshot_authority = authority;
        Ok(())
    }

    pub fn propose_authority(ctx: Context<Admin>, authority: Pubkey) -> Result<()> {
        require!(authority != Pubkey::default(), VaultError::Authority);
        ctx.accounts.config.pending_authority = authority;
        Ok(())
    }

    pub fn accept_authority(ctx: Context<AcceptAuthority>) -> Result<()> {
        ctx.accounts.config.authority = ctx.accounts.authority.key();
        ctx.accounts.config.pending_authority = Pubkey::default();
        Ok(())
    }

    pub fn initialize_vault(ctx: Context<InitializeVault>) -> Result<()> {
        require!(!ctx.accounts.config.paused, VaultError::Paused);
        let vault = &mut ctx.accounts.vault;
        vault.mint = ctx.accounts.mint.key();
        vault.developer = ctx.accounts.developer.key();
        vault.created_at = Clock::get()?.unix_timestamp;
        vault.last_opened_at = 0;
        vault.next_round = 0;
        vault.bump = ctx.bumps.vault;
        Ok(())
    }

    // Permissionless conversion of PumpSwap WSOL creator fees into the same SOL vault.
    // The destination is fixed and no caller receives the funds or account rent.
    pub fn unwrap_fees(ctx: Context<UnwrapFees>) -> Result<()> {
        let mint = ctx.accounts.vault.mint;
        let bump = [ctx.accounts.vault.bump];
        let seeds: &[&[u8]] = &[b"vault", mint.as_ref(), &bump];
        token::close_account(CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(), CloseAccount {
            account: ctx.accounts.wrapped_sol.to_account_info(),
            destination: ctx.accounts.vault.to_account_info(),
            authority: ctx.accounts.vault.to_account_info(),
        }, &[seeds]))
    }

    pub fn open_round(ctx: Context<OpenRound>, round_id: u64, root: [u8; 32], eligible_supply: u64, snapshot_slot: u64, manifest_hash: [u8; 32]) -> Result<()> {
        let config = &ctx.accounts.config;
        require!(!config.paused, VaultError::Paused);
        let clock = Clock::get()?;
        let vault = &mut ctx.accounts.vault;
        let due = if round_id == 0 { vault.created_at.checked_add(config.policy.first_delay) }
            else { vault.last_opened_at.checked_add(config.policy.period) }.ok_or(VaultError::Arithmetic)?;
        require!(clock.unix_timestamp >= due, VaultError::TooEarly);
        require!(round_id == vault.next_round, VaultError::Round);
        require!(root != [0;32] && manifest_hash != [0;32] && eligible_supply > 0 && snapshot_slot <= clock.slot, VaultError::Snapshot);
        let info = vault.to_account_info();
        let budget = info.lamports().checked_sub(Rent::get()?.minimum_balance(info.data_len())).ok_or(VaultError::Arithmetic)?;
        require!(budget >= config.policy.minimum_budget, VaultError::Budget);
        let round = &mut ctx.accounts.round;
        round.vault = vault.key();
        round.id = round_id;
        round.root = root;
        round.manifest_hash = manifest_hash;
        round.eligible_supply = eligible_supply;
        round.snapshot_slot = snapshot_slot;
        round.opened_at = clock.unix_timestamp;
        round.closes_at = clock.unix_timestamp.checked_add(config.policy.voting_window).ok_or(VaultError::Arithmetic)?;
        round.execute_after = round.closes_at.checked_add(config.policy.execution_delay).ok_or(VaultError::Arithmetic)?;
        round.policy = config.policy;
        round.budget = budget;
        round.remaining = budget;
        round.votes = [0;3];
        round.finalized = false;
        round.outcome = HOLD;
        round.bump = ctx.bumps.round;
        move_lamports(&info, &round.to_account_info(), budget)?;
        vault.next_round = vault.next_round.checked_add(1).ok_or(VaultError::Arithmetic)?;
        vault.last_opened_at = clock.unix_timestamp;
        emit!(RoundOpened { vault: vault.key(), round: round.key(), budget, root, snapshot_slot });
        Ok(())
    }

    pub fn vote(ctx: Context<Vote>, choice: u8, weight: u64, proof: Vec<[u8;32]>) -> Result<()> {
        require!(!ctx.accounts.config.paused, VaultError::Paused);
        let round = &mut ctx.accounts.round;
        require!(!round.finalized && Clock::get()?.unix_timestamp < round.closes_at, VaultError::Closed);
        require!(choice <= MAX_CHOICE, VaultError::Choice);
        verify_member(round.key(), ctx.accounts.voter.key(), weight, &proof, round.root)?;
        let ballot = &mut ctx.accounts.ballot;
        if ballot.weight > 0 {
            require!(ballot.weight == weight, VaultError::Snapshot);
            round.votes[ballot.choice as usize] = round.votes[ballot.choice as usize].checked_sub(weight).ok_or(VaultError::Arithmetic)?;
        }
        round.votes[choice as usize] = round.votes[choice as usize].checked_add(weight).ok_or(VaultError::Arithmetic)?;
        require!(sum_votes(&round.votes)? <= round.eligible_supply, VaultError::Snapshot);
        ballot.weight = weight;
        ballot.choice = choice;
        Ok(())
    }

    pub fn finalize_round(ctx: Context<FinalizeRound>) -> Result<()> {
        let round = &mut ctx.accounts.round;
        require!(!round.finalized && Clock::get()?.unix_timestamp >= round.closes_at, VaultError::Closed);
        let participation = sum_votes(&round.votes)?;
        let quorum = (participation as u128) * 10_000 >= (round.eligible_supply as u128) * (round.policy.quorum_bps as u128);
        let mut outcome = HOLD;
        if quorum && participation > 0 {
            for choice in 0..=MAX_CHOICE {
                if (round.votes[choice as usize] as u128) * 2 > participation as u128 { outcome = choice; }
            }
        }
        round.finalized = true;
        round.outcome = outcome;
        if outcome == HOLD {
            move_lamports(&round.to_account_info(), &ctx.accounts.vault.to_account_info(), round.remaining)?;
            round.remaining = 0;
        }
        emit!(RoundFinalized { round: round.key(), outcome, participation });
        Ok(())
    }

    pub fn claim_holder(ctx: Context<ClaimHolder>, weight: u64, proof: Vec<[u8;32]>) -> Result<()> {
        require!(!ctx.accounts.config.paused, VaultError::Paused);
        let round = &mut ctx.accounts.round;
        require!(round.finalized && round.outcome == HOLDERS && Clock::get()?.unix_timestamp >= round.execute_after, VaultError::NotClaimable);
        verify_member(round.key(), ctx.accounts.holder.key(), weight, &proof, round.root)?;
        require!(weight <= round.eligible_supply, VaultError::Snapshot);
        // Every eligible holder earns their pro-rata share, whether or not they voted.
        let amount = ((round.budget as u128) * (weight as u128) / (round.eligible_supply as u128)) as u64;
        require!(amount > 0 && amount <= round.remaining, VaultError::Budget);
        round.remaining = round.remaining.checked_sub(amount).ok_or(VaultError::Arithmetic)?;
        ctx.accounts.receipt.amount = amount;
        move_lamports(&round.to_account_info(), &ctx.accounts.holder.to_account_info(), amount)?;
        emit!(RewardClaimed { round: round.key(), holder: ctx.accounts.holder.key(), amount });
        Ok(())
    }

    pub fn claim_developer(ctx: Context<ClaimDeveloper>) -> Result<()> {
        require!(!ctx.accounts.config.paused, VaultError::Paused);
        let round = &mut ctx.accounts.round;
        require!(round.finalized && round.outcome == DEVELOPER && Clock::get()?.unix_timestamp >= round.execute_after, VaultError::NotClaimable);
        let amount = round.remaining;
        require!(amount > 0, VaultError::Budget);
        round.remaining = 0;
        move_lamports(&round.to_account_info(), &ctx.accounts.developer.to_account_info(), amount)?;
        emit!(RewardClaimed { round: round.key(), holder: ctx.accounts.developer.key(), amount });
        Ok(())
    }
}

fn sum_votes(votes: &[u64;3]) -> Result<u64> {
    votes.iter().try_fold(0u64, |sum, value| sum.checked_add(*value).ok_or_else(|| error!(VaultError::Arithmetic)))
}
fn verify_member(round: Pubkey, owner: Pubkey, weight: u64, proof: &[[u8;32]], root: [u8;32]) -> Result<()> {
    require!(weight > 0 && proof.len() <= 32, VaultError::Snapshot);
    let mut hash = hashv(&[b"haus-holder-v1", round.as_ref(), owner.as_ref(), &weight.to_le_bytes()]).to_bytes();
    for sibling in proof {
        hash = if hash <= *sibling { hashv(&[b"haus-node-v1", &hash, sibling]).to_bytes() }
            else { hashv(&[b"haus-node-v1", sibling, &hash]).to_bytes() };
    }
    require!(hash == root, VaultError::Snapshot);
    Ok(())
}
fn move_lamports(from: &AccountInfo, to: &AccountInfo, amount: u64) -> Result<()> {
    let remaining = from.lamports().checked_sub(amount).ok_or(VaultError::Arithmetic)?;
    require!(remaining >= Rent::get()?.minimum_balance(from.data_len()), VaultError::Budget);
    let received = to.lamports().checked_add(amount).ok_or(VaultError::Arithmetic)?;
    **from.try_borrow_mut_lamports()? = remaining;
    **to.try_borrow_mut_lamports()? = received;
    Ok(())
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, InitSpace)]
pub struct Policy {
    pub first_delay: i64,
    pub voting_window: i64,
    pub period: i64,
    pub execution_delay: i64,
    pub quorum_bps: u16,
    pub minimum_budget: u64,
}
impl Policy {
    fn validate(&self) -> Result<()> {
        require!(self.first_delay >= 0 && self.first_delay <= 604800 && self.voting_window >= 60 && self.voting_window <= 604800
            && self.execution_delay >= 0 && self.execution_delay <= 86400
            && self.period >= self.voting_window + self.execution_delay && self.period <= 2592000
            && self.quorum_bps > 0 && self.quorum_bps <= 10000 && self.minimum_budget > 0, VaultError::Policy);
        Ok(())
    }
}
#[account]
#[derive(InitSpace)]
pub struct Config {
    pub authority: Pubkey,
    pub pending_authority: Pubkey,
    pub snapshot_authority: Pubkey,
    pub paused: bool,
    pub policy: Policy,
    pub bump: u8,
}
#[account]
#[derive(InitSpace)]
pub struct Vault {
    pub mint: Pubkey,
    pub developer: Pubkey,
    pub created_at: i64,
    pub last_opened_at: i64,
    pub next_round: u64,
    pub bump: u8,
}
#[account]
#[derive(InitSpace)]
pub struct Round {
    pub vault: Pubkey,
    pub id: u64,
    pub root: [u8;32],
    pub manifest_hash: [u8;32],
    pub eligible_supply: u64,
    pub snapshot_slot: u64,
    pub opened_at: i64,
    pub closes_at: i64,
    pub execute_after: i64,
    pub policy: Policy,
    pub budget: u64,
    pub remaining: u64,
    pub votes: [u64;3],
    pub finalized: bool,
    pub outcome: u8,
    pub bump: u8,
}
#[account]
#[derive(InitSpace)]
pub struct Ballot { pub weight: u64, pub choice: u8 }
#[account]
#[derive(InitSpace)]
pub struct Receipt { pub amount: u64 }

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(mut)] pub authority: Signer<'info>,
    #[account(constraint = program.programdata_address()? == Some(program_data.key()) @ VaultError::Authority)]
    pub program: Program<'info, crate::program::HausVault>,
    #[account(constraint = program_data.upgrade_authority_address == Some(authority.key()) @ VaultError::Authority)]
    pub program_data: Account<'info, ProgramData>,
    #[account(init, payer = authority, space = 8 + Config::INIT_SPACE, seeds = [b"config"], bump)]
    pub config: Account<'info, Config>,
    pub system_program: Program<'info, System>,
}
#[derive(Accounts)]
pub struct Admin<'info> {
    pub authority: Signer<'info>,
    #[account(mut, seeds = [b"config"], bump = config.bump, has_one = authority)] pub config: Account<'info, Config>,
}
#[derive(Accounts)]
pub struct AcceptAuthority<'info> {
    pub authority: Signer<'info>,
    #[account(mut, seeds = [b"config"], bump = config.bump, constraint = config.pending_authority == authority.key() @ VaultError::Authority)]
    pub config: Account<'info, Config>,
}
#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(mut)] pub developer: Signer<'info>,
    // New mint signature prevents anyone front-running a developer's vault initialization.
    #[account(signer)] pub mint: InterfaceAccount<'info, Mint>,
    #[account(seeds = [b"config"], bump = config.bump)] pub config: Account<'info, Config>,
    #[account(init, payer = developer, space = 8 + Vault::INIT_SPACE, seeds = [b"vault", mint.key().as_ref()], bump)]
    pub vault: Account<'info, Vault>,
    pub system_program: Program<'info, System>,
}
#[derive(Accounts)]
pub struct UnwrapFees<'info> {
    #[account(mut, seeds = [b"vault", vault.mint.as_ref()], bump = vault.bump)] pub vault: Account<'info, Vault>,
    #[account(mut, constraint = wrapped_sol.owner == vault.key() @ VaultError::Authority,
        constraint = wrapped_sol.mint == anchor_spl::token::spl_token::native_mint::ID @ VaultError::Snapshot,
        constraint = wrapped_sol.is_native.is_some() @ VaultError::Snapshot)]
    pub wrapped_sol: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}
#[derive(Accounts)]
#[instruction(round_id: u64)]
pub struct OpenRound<'info> {
    #[account(mut)] pub snapshot_authority: Signer<'info>,
    #[account(seeds = [b"config"], bump = config.bump, has_one = snapshot_authority)] pub config: Account<'info, Config>,
    #[account(mut, seeds = [b"vault", vault.mint.as_ref()], bump = vault.bump)] pub vault: Account<'info, Vault>,
    #[account(init, payer = snapshot_authority, space = 8 + Round::INIT_SPACE, seeds = [b"round", vault.key().as_ref(), &round_id.to_le_bytes()], bump)]
    pub round: Account<'info, Round>,
    pub system_program: Program<'info, System>,
}
#[derive(Accounts)]
pub struct Vote<'info> {
    #[account(mut)] pub voter: Signer<'info>,
    #[account(seeds = [b"config"], bump = config.bump)] pub config: Account<'info, Config>,
    #[account(mut, seeds = [b"round", round.vault.as_ref(), &round.id.to_le_bytes()], bump = round.bump)] pub round: Account<'info, Round>,
    #[account(init_if_needed, payer = voter, space = 8 + Ballot::INIT_SPACE, seeds = [b"ballot", round.key().as_ref(), voter.key().as_ref()], bump)] pub ballot: Account<'info, Ballot>,
    pub system_program: Program<'info, System>,
}
#[derive(Accounts)]
pub struct FinalizeRound<'info> {
    #[account(mut, seeds = [b"vault", vault.mint.as_ref()], bump = vault.bump)] pub vault: Account<'info, Vault>,
    #[account(mut, has_one = vault, seeds = [b"round", vault.key().as_ref(), &round.id.to_le_bytes()], bump = round.bump)] pub round: Account<'info, Round>,
}
#[derive(Accounts)]
pub struct ClaimHolder<'info> {
    #[account(mut)] pub holder: Signer<'info>,
    #[account(seeds = [b"config"], bump = config.bump)] pub config: Account<'info, Config>,
    #[account(mut, seeds = [b"round", round.vault.as_ref(), &round.id.to_le_bytes()], bump = round.bump)] pub round: Account<'info, Round>,
    // Receipt is never closed, so a claimed round cannot be claimed again.
    #[account(init, payer = holder, space = 8 + Receipt::INIT_SPACE, seeds = [b"claim", round.key().as_ref(), holder.key().as_ref()], bump)] pub receipt: Account<'info, Receipt>,
    pub system_program: Program<'info, System>,
}
#[derive(Accounts)]
pub struct ClaimDeveloper<'info> {
    #[account(mut)] pub developer: Signer<'info>,
    #[account(seeds = [b"config"], bump = config.bump)] pub config: Account<'info, Config>,
    #[account(seeds = [b"vault", vault.mint.as_ref()], bump = vault.bump, has_one = developer)] pub vault: Account<'info, Vault>,
    #[account(mut, has_one = vault, seeds = [b"round", vault.key().as_ref(), &round.id.to_le_bytes()], bump = round.bump)] pub round: Account<'info, Round>,
}
#[event]
pub struct RoundOpened { pub vault: Pubkey, pub round: Pubkey, pub budget: u64, pub root: [u8;32], pub snapshot_slot: u64 }
#[event]
pub struct RoundFinalized { pub round: Pubkey, pub outcome: u8, pub participation: u64 }
#[event]
pub struct RewardClaimed { pub round: Pubkey, pub holder: Pubkey, pub amount: u64 }
#[error_code]
pub enum VaultError {
    #[msg("System paused")] Paused,
    #[msg("Invalid authority")] Authority,
    #[msg("Invalid policy")] Policy,
    #[msg("Round is not due")] TooEarly,
    #[msg("Unexpected round")] Round,
    #[msg("Invalid snapshot or proof")] Snapshot,
    #[msg("Insufficient budget")] Budget,
    #[msg("Arithmetic overflow")] Arithmetic,
    #[msg("Voting window closed or not finished")] Closed,
    #[msg("Unsupported choice")] Choice,
    #[msg("Allocation is not claimable")] NotClaimable,
}
