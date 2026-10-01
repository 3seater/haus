# HAUS production architecture — initial decisions

Date: 2026-09-30. This document describes planned services and contracts, not deployed infrastructure. The initial delivery prioritizes branding, interface, and locally reviewable behavior.

Local implementation update: the Haus workspace now keeps chat beside all tools, with a mobile chat dock. `/api/haus` implements single-use signed challenges, 15-minute mint-scoped in-memory bearer sessions, and a fresh mainnet holding check before every message/site pitch. Public reads are ungated. Atomic local files retain room content; this is only suitable for one server process. Eligibility is any positive unfrozen token balance, not top-20 ranking or voting weight. The production recommendations below (database, HttpOnly sessions, distributed rate limits, moderation, historical voting snapshots) remain outstanding. DEX escrow, binding votes, AI generation, asset uploads and hosted subdomains have not been implemented.

## 1. Product boundary

Solana, ordinary Pump.fun launches. No Pons / Robinhood integration. No custom bonding curve, transfer tax, reward mode, gift cards, or automatic community fee diversion in this initial scope. A HAUS platform token has not been specified: do not invent supply, allocations or fee entitlements.

Launches use Pump's existing program. Its public documentation describes `create_v2` and optional configurations. Retain Perks' regular SOL launch mode, creator wallet fee recipient, optional initial buy, signed intent, wallet review, transaction-content verification, simulation, rebroadcast recovery and finalized launch evidence. Reconcile the installed SDK against the current deployed program before mainnet activation. [Pump creation documentation](https://github.com/pump-fun/pump-public-docs/blob/main/docs/instructions/COIN_CREATION.md)

The extracted preparation/relay path uses Redis for provisional launch records in this prototype. Production needs durable Postgres storage, an outbox, receipt reconciliation and an indexer. Redis requires persistence if temporarily used for records; it must not be the sole authoritative financial ledger.

Existing Pump tokens should eventually be importable by mint. First page creation grants no permanent unilateral administrator rights. Explicitly distinguish “community-created HAUS profile” from original creator endorsement. A community takeover cannot recover dumped funds or seize external accounts.

## 2. What needs a Solana program?

| Capability | Custom program needed? | Implementation |
| --- | --- | --- |
| Standard Pump launch | No | Existing Pump program and SDK |
| Wallet login and holder-only chat | No | Signed nonce sessions, indexed balances, server authorization |
| Top-20 team room | No | Ranked owner snapshot with explicit exclusions and refresh policy |
| AI website creation and hosting | No | Generation service, version storage, review and deploy worker |
| Website voting | No for a first release | Signed off-chain ballots and verifiable fixed snapshots; HAUS executes publishing |
| Public pooled funds with enforced refunds | Recommended | Purpose-specific campaign escrow program |
| Fully on-chain treasury governance | Later | Integrate a reviewed governance/multisig system; do not invent it for website votes |

The off-chain approach means users trust HAUS to tally and host faithfully. Publish signed ballot exports, content hashes and audit history. Do not call that fully trustless governance.

## 3. Identity, holders and chat

- Sign an expiring, single-use nonce with domain, wallet and cluster. Issue secure HttpOnly sessions; use same-origin mutation protections and rate limits. Signing a message must not authorize a token transfer.
- Verify holdings server-side, supporting both SPL Token and Token-2022. Aggregate all accounts belonging to the same owner, not individual token accounts. Cached current balances are for chat access; historical voting uses a separate snapshot.
- Exclude verified bonding-curve vaults, pools, program-owned accounts, burns, and known custodial infrastructure from top-holder membership. Top 20 token accounts is not top 20 people.
- Recommended first experience: all qualifying holders can chat; a top-20 room is an additional channel. Publish the minimum balance/dust threshold before release. The team-room policy remains a product decision.
- Refresh membership periodically and on indexed balance changes. Define maximum stale authorization time and disconnect subscription access after loss of eligibility. Access to old messages is separate from the right to send new messages.
- Rotating room membership does not confer treasury withdrawal rights. Moderation permissions are scoped and revocable. Chat needs report/block, spam limits, attachment validation, and an audited moderator workflow.
- Sybil resistance is unresolved: one owner can control multiple wallets. Do not market one-wallet-one-vote as one-person-one-vote.

## 4. Website creation → vote → hosting

1. Import token identity using cluster + mint. Store verified metadata separately from community-editable presentation.
2. Generate a structured design document from a prompt and approved sections. The current template composer demonstrates this boundary. Keep token addresses/trade targets server-owned. Treat token descriptions and imported content as untrusted data, not instructions to the generator.
3. AI credentials remain server-side. Use per-community quotas, moderation, job idempotency, upload limits, budget ceilings, retries and an explicit failure state. Start with allowlisted components and schema validation. Arbitrary generated JS requires a much larger sandboxing project.
4. Upload assets to dedicated object storage and save immutable site versions. Each proposal references a content hash; editing it requires a new version/proposal.
5. Open a fixed voting window with a previously finalized holdings snapshot. Store owner aggregation rules, mint, slot, proposal IDs, deadline and weighting policy. An ordinary current RPC balance does not prove a historical balance; maintain an indexer or use a provider with verified historical support.
6. Suggested baseline is balance-weighted votes, no arbitrary per-wallet cap (caps invite wallet splitting). Large holders retain power; disclose concentration. Determine quorum from active communities before release. Demo counts are illustrative, not final weighting policy.
7. A unique highest tally wins only if quorum and deadline rules pass. Ties extend/reopen; no turnout keeps the current site. A small unpublished community may have a provisional starter site, clearly labeled, without permanent creator control.
8. A background finalizer atomically closes the round and queues deployment of the exact winning hash. Deploy once with idempotency keys; only mark published after health checks succeed. Failed jobs retain the prior site. Keep rollback history and a distinct abuse-removal process.
9. Use wildcard DNS + managed wildcard TLS to map `slug.<owned-domain>` to the published version. No per-community domain purchase is needed. Domain ownership has not been verified or acquired here.

Hosting security: community sites should be isolated from the authenticated application (prefer a separate registrable content domain; otherwise strict host-only auth cookies and origin checks). Never use broad `.haus.fun` auth cookies. No untrusted arbitrary scripts, embedded wallet prompts, or editable swap destinations. Apply CSP, verified asset delivery and versioned deploys. Reserve system subdomains and resolve collisions by mint suffix. Custom domains are a later feature requiring ownership verification.

## 5. Funding DEX profiles

The reviewed public DEX Screener API includes paid-order status reads, profile reads and community-takeover information. It does not document a public checkout/purchase-write endpoint. Access to an actual supported purchase integration must be confirmed with the provider. [Public API reference](https://docs.dexscreener.com/api/reference)

DEX Screener describes automatic listing separately from paid Enhanced Token Info. An enhanced profile is not token listing, identity verification, endorsement or a guarantee of provider acceptance. A purchase includes submitting details and awaiting processing. [Listing documentation](https://docs.dexscreener.com/token-listing), [Enhanced Token Info](https://marketplace.dexscreener.com/product/token-info)

Start with an explicit fulfillment service/approved operator if no partner API is available. Do not scrape private checkout endpoints or imply that a UI vote can force an external publication. Store the selected asset bundle, quote, quote expiry, spending cap, service fee, provider terms and designated operator before accepting money.

### Recommended custody design

Deploy one reviewed Anchor campaign-escrow program with a campaign per mint and purpose. A PDA has no private key and can authorize transfers through its program; that lets program rules govern escrow movement. [Solana PDA documentation](https://solana.com/docs/core/pda)

Suggested accounts:

- `Campaign` PDA: seeds `campaign`, token mint, campaign ID. Stores allowed contribution asset, target/cap, deadline, fulfillment deadline, terms/asset hash, spend authority, allowed destination, reserved/spent totals and lifecycle state.
- A native SOL vault associated with a SOL campaign; retain required account rent separately from spendable deposits.
- A canonical USDC token account whose authority is the campaign PDA for a USDC campaign. Pin the exact mint and token program; a token named USDC is insufficient. A token account holds one mint and an ATA derives from authority + program + mint. [Solana token-account documentation](https://solana.com/docs/tokens/basics/create-token-account)
- Contributor receipts keyed by campaign + depositor, storing actual accepted integer units and refunded amounts. Keep program events plus a finalized indexer ledger for UI and reconciliation.

**Use one settlement asset per initial campaign.** The UI can preview SOL and USDC choices, but do not add their raw balances into one progress number. To accept either for a USDC campaign later, quote a user-authorized SOL→USDC swap with bounded slippage and record only actual USDC received. No exchange-rate oracle is needed for a single-asset target. Avoid cross-asset refund ambiguity. The prototype intentionally displays the two pledge totals separately.

Suggested instructions:

| Instruction | Required behavior |
| --- | --- |
| `create_campaign` | Freeze terms, destination policy, asset, caps, deadlines and authority model. Charge known rent only. |
| `contribute` | Exact supported asset, integer accounting, before deadline, reject or explicitly return over-cap amounts. Issue/update depositor receipt. |
| `reserve_order` | Approved asset hash and quote, sufficient funds, before expiry, one active order. Reservation is not external payment. |
| `execute_payment` | One-time bounded transfer to the frozen vendor/fulfillment destination, authorized by the declared policy. No arbitrary withdrawal. |
| `cancel_unspent` | Automatically unlock refunds on funding/fulfillment timeout before payment; limit any administrative cancellation powers. |
| `refund` | Depositor claims refundable unspent amount at most once, paid in the deposited settlement asset. Checked accounting. |
| `record_fulfillment` | Store receipt hash and attested outcome. An on-chain program cannot independently prove a remote profile was updated. |

States: `DRAFT → FUNDING → FUNDED → RESERVED → PAID → FULFILLED`. Failure before payment becomes `REFUNDABLE`. Failure after external payment becomes `DISPUTED`; do not promise automatic full refunds of funds already spent. Surplus refunds are allocated by a fixed disclosed rule, with integer rounding/dust handling. Direct unsolicited transfers must not inflate contributor rights; reconcile or explicitly classify them separately.

An operator or multisig still executes external service fulfillment. A token vote by itself does not make the vendor payment autonomous. A server-attested outcome is an explicit trust assumption; production multisig thresholds, member selection, emergency powers, and upgrade authority need a written decision. Do not let a transient top-20 chat ranking become withdrawal authority.

Before accepting deposits: local-validator tests for conservation of funds, deposits/refunds/replay, cap boundaries, forged mint/authority/destination, concurrent orders, deadline transitions and rent; adversarial review and independent contract review; clear refund and provider-rejection terms. No campaign program has been implemented or deployed in this delivery.

## 6. Services and durable data

Next.js app/API; dedicated Solana RPC/indexer; Postgres for communities/versions/ballots/messages/campaigns/receipts; Redis for nonce/rate-limit/job coordination; object storage/CDN; generation worker; signed-session realtime chat; vote finalizer; hosting deploy worker; campaign reconciler; supported vendor adapter.

Core records: Community(cluster,mint,slug), IdentitySnapshot(slot,eligibilityPolicy,root), SiteVersion(contentHash,assetManifest), VoteRound(snapshot,deadline,quorum,policy), Ballot(round,wallet,signature,weight,choice), Deployment(version,status,publicUrl), Campaign(terms,settlementAsset,state), Contribution(signature,instructionIndex,depositor,amount), FulfillmentOrder(quote,cap,destination,status,receipt).

Use transactional uniqueness constraints to prevent duplicate ballots, receipts, payouts and deployment jobs. Treat “submitted”, “confirmed”, and “finalized” distinctly. No success UI from merely constructing or sending a transaction.

## 7. Delivery order

1. Current: approve the brand, navigation, discover/community/studio layouts, and local workflow.
2. Persist communities and versions; implement signed sessions, holder indexer, chat and moderation.
3. Add real generation jobs, fixed snapshot voting and automatic hosting on an owned domain.
4. Verify and activate the extracted ordinary Pump launch flow against dedicated infrastructure; retain fee recipient transparency.
5. Confirm DEX fulfillment access and terms; implement/review single-asset campaign escrow; then add wallet deposit and order reconciliation.
6. Consider fee sharing, on-chain governance, additional integrations, and a platform token only as separately scoped decisions.
