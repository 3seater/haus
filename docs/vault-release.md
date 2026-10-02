# HAUS vault release status and operating plan

Status: implementation in progress; contract compiled and tested locally, NOT deployed, NOT ready for public funds.

The user approved regular Pump creator-fee mode with per-token HAUS vaults, claimable SOL holder rewards, and a personally controlled HAUS owner authority. DEX fulfillment is explicitly deferred.

Vault owner authority is unconfigured. Any future vault deployment must explicitly configure HAUS_VAULT_OWNER_AUTHORITY.
This is the platform owner, not every token's developer. No secret or signing capability for this wallet is stored here.

## Implemented source

- Pump creation assigns the mint-specific vault PDA as creator recipient. Vault initialization occurs after mint creation and before an optional initial buy in the same versioned transaction. An unsuccessful transaction rolls back all instructions. A finalized, frozen address lookup table is required. The relay accepts only the exact prepared message and verifies the wallet signature before signing with the mint key. Wallet-added instructions currently require re-preparation; this compatibility restriction needs wallet testing.
- Launch confirmation verifies finalized Pump evidence, recipient, vault owner, token identity, developer and modes. New launches cannot use the earlier personal-wallet recipient path.
- Readiness checks reject missing configuration, invalid encryption keys, wrong RPC cluster, absent program/config and paused vaults. Environment flags do not substitute for release review.
- Finalized launches are indexed in Redis and available in discovery, direct token links, holder reads and community rooms. Discovery lists the latest 90 launches plus the configured examples; direct token links can resolve older launches. The worker processes the full active index.
- Anchor source implements vault custody, configurable rounds, token-weighted ballots with immutable Merkle proofs, strict-majority/quorum finalization, hold/developer/holder outcomes, one-time claims and permissionless unwrapping of PumpSwap WSOL fees.
- The Fees & rewards screen and API read on-chain rounds and prepare wallet-signed ballots and claims. Older rounds are paginated. Unavailable vaults are explicitly shown; balances are never seeded.
- The worker collects curve/PumpSwap fees, captures finalized holder balances, checks their sum against mint supply, persists immutable manifests locally and in hosted Redis, opens eligible rounds and finalizes expired rounds. Manifests can be exported through `/api/vault/snapshot?round=...` after their hash is verified against the finalized round. A renewed Redis lease prevents overlapping worker passes. Running without `--execute` cannot sign or submit transactions.
- The dedicated Docker worker image and supervisor build successfully and passed a disabled-mode smoke test. Its restart policy matches the Perks Docker approach. The PC and Docker must stay running for timely processing. No live worker has been enabled.
- TypeScript tests cover allocation, proofs, thresholds, address isolation, signature tampering, byte limits and real Pump SDK launch-with-buy transaction size using shared lookup addresses. An isolated validator executed 37 assertions covering initialization authority, custody, permission checks, changing votes without double weight, paused voting, actual SPL WSOL unwrapping, budget isolation, failed-vote retention, holder/nonvoter payouts, developer payouts and duplicate claims.

## Not yet implemented or verified

1. Independent contract review and broader adversarial tests remain required. Docker was repaired by preserving and recreating its stale runtime socket folders; no factory reset or Docker data deletion occurred. The contract builds in the pinned official Anchor image with platform-tools v1.52 and the sbfv1 target. `contracts/build-record.json` records the binary/source/lock hashes; `scripts/build-vault.ps1` reproduces the build. Anchor macro cfg/deprecation warnings remain; there were no compile errors.
2. Buy-and-burn adapter. The contract currently rejects that choice. Never expose it as selectable until a tested adapter enforces mint, destination, input budget, independent price/slippage bounds, swap expiry and actual Token-2022 burn. Both curve and graduated markets need support.
3. Approved voting timing, quorum, minimum economical budget and policy-change limits. The user rejected a slow 48-hour schedule but has not approved replacements. No proposed timing has been deployed. This implementation uses hold on a split majority, not a runoff; this difference must be approved before release.
4. Perks RPC and hosted Redis settings were reused in the ignored local environment, with `haus:` key isolation and a fresh HAUS launch-encryption key. Mainnet identity, Redis connectivity, snapshot replication/immutability/recovery and a complete 4,344-wallet sample scan passed. Production origin/hosting, Redis retention/backup guarantees and disaster recovery still need final verification. No Perks data or signing keys were changed.
5. Snapshot service and exclusion policy. The worker uses one finalized `getProgramAccounts` response for all token balances, aggregates owners, excludes frozen/zero balances and off-curve owners, and supports additional reviewed exclusions. A reliable provider must return the entire result. Being on-curve is not evidence of being a person or a non-custodial wallet.
6. Manifests now have two required copies (hosted Redis and local storage) plus a public verified export. Confirm storage backup/retention guarantees before public funds. Loss of both copies prevents convenient proof generation.
7. Worker deployment key, gas funding, operational alerting, transaction reconciliation and bounded fee budgets. Docker supervision and a distributed lease are implemented. The supervisor is smoke-tested only with live execution disabled; it is not an always-online hosted service. Existing on-chain rounds/claims prevent duplicate allocations, but a response loss can still waste a retry fee.
8. Real wallet end-to-end launch, insufficient-balance and expired-blockhash recovery, Pump collection on both sides of graduation, token discovery and mainnet claims. Maximum-length initial-buy packet size is verified offline; local vault claims and WSOL unwrapping are verified against the compiled program. The frozen shared lookup table still needs creating after the actual deployment program ID is selected.
9. Deployment, mainnet program verification and program/upgrade-authority management. `contracts/deployment.json` records the supplied owner and unapproved settings. The Rust program ID is a development placeholder, not a funded/deployed program or recoverable deployment keypair.
10. Website hosting, binding website votes and AI generation remain separate pre-existing gaps. Website pitches are not financial ballots. DEX remains deferred.

## Trust and accounting

The owner can pause execution and change policies for future rounds; each opened round freezes its own policy. The owner can rotate the snapshot publisher. Control of the program upgrade authority is a separate Solana role and can replace program logic, so it is effectively powerful custody control and must be disclosed. The intended initial upgrade owner is the user-supplied wallet; this has not been installed on-chain.

Snapshot roots are attested by the configured snapshot authority. Merkle proofs prove consistency with that root; they do not independently prove the publisher included every real holder or the right balances. Incorrect roots can misallocate funds. Publish manifests and exclusions, review the indexer, and establish a challenge/review policy before public money is accepted.

Each round reserves a fixed SOL budget in its own program account. Newly accrued fees remain in the token vault. Holder entitlement is `floor(round budget * snapshot owner balance / eligible snapshot supply)`, including nonvoters. Later token transfers do not move that entitlement. A permanent receipt prevents repeat claims; dust and unclaimed shares remain reserved, with no expiry or sweep authority implemented. Receipts and ballots cost rent; a minimum economical distribution and treatment of dust still need approval.

The worker pays network fees and WSOL ATA creation rent. Closing that ATA returns its rent into the token vault, so this design sponsors that rent rather than reimbursing the worker. Do not silently deduct worker costs from creator rewards.

No arbitrary withdrawal instruction exists. The original token developer can claim only finalized developer allocations. Finalization is permissionless; new snapshots require the publisher. Emergency pause blocks votes/new rounds/claims but allows fee collection and hold finalization. On-chain program tests must verify these properties, not merely the TypeScript reference calculations.

## Local checks (no SOL)

Use the installed runtime directly if the bundled pnpm launcher attempts to reinstall shared dependencies. `node_modules` is a junction to another project; do not mutate it.

```powershell
node node_modules/typescript/bin/tsc --noEmit
node node_modules/typescript/bin/tsc -p tsconfig.tests.json
$testFiles = @(Get-ChildItem test-results/tests -Filter *.test.js | ForEach-Object FullName)
node --test $testFiles
node node_modules/typescript/bin/tsc -p tsconfig.worker.json
node scripts/deployment-check.cjs
node scripts/infrastructure-check.cjs
node .worker-build/scripts/launch-table-plan.js
```

`docker compose -f docker-compose.workers.yml build fees` builds the independent worker image. Do not enable it until program/config, approved voting/exclusion policies, the separate worker key and gas are ready. `.env.local` keeps `LAUNCHES_ENABLED=false`, `HAUS_VAULT_RELEASE_APPROVED=false` and `HAUS_WORKER_ENABLED=false`.

The current binary requires approximately 2.3 SOL for program-data rent at its exact size, plus program/config/lookup rent, transaction fees and worker funding. The lookup-table plan is about 0.0045 SOL at 22 addresses. This is not a final funding request: the unfinished buy-and-burn adapter will change the binary size and deployment cost. No real SOL has been spent.

The production build can use `HAUS_BUILD_DIR=.next-verify` to avoid disturbing an active `.next` development server. Next may update its generated type references; keep the normal development reference when finished.

## Contract test and deployment sequence

1. Use the repaired Docker Desktop environment: `scripts/build-vault.ps1` compiles with the pinned official toolchain. `scripts/test-vault.ps1` starts a disposable local validator, runs the contract suite and stops that validator. No external Linux server is needed.
2. Generate a deployment keypair in an ignored secure location, sync the Anchor identity and check all program IDs agree. Do not commit or print keypair bytes. Keep the owner key off the server.
3. Compile and test config initialization against the real upgrade authority; reject unauthorized initialization, authority changes, pauses and policy mutations.
4. Exercise atomic launch plus vault initialization against cloned Pump dependencies on a local validator. Test no-buy and initial-buy transactions, rent, maximum serialized size, compute limits and fee routing.
5. Exercise round windows, unknown roots, incorrect weights, late votes, ballot replacement, replay, duplicate claims, wrong developer/vault/round, integer bounds, insufficient funds, dust conservation and pause behavior. Use actual program execution, including concurrent transactions.
6. Exercise both fee sources and WSOL unwrapping with recipient/mint/owner substitution attempts. Verify graduation continuity.
7. Complete the buy-and-burn implementation and its adversarial tests, or explicitly scope it out with the user before launch. Do not set the release approval flag while required features remain incomplete.
8. Approve policy, service identities, authority disclosures, durable manifests and worker operations. Deploy to a test environment first. Calculate mainnet rent from the resulting binary and the actual chosen allocation size using `deployment-check.cjs`; add deployment transaction fees and worker operating balance. Report exact wallet, network, cost estimate and transaction purpose to the user before funding/deployment.
9. Deploy/initialize the reviewed mainnet program using the owner-authorized wallet flow. Verify bytecode and authorities. Configure both server and wallet RPCs for mainnet. Only then set `HAUS_VAULT_RELEASE_APPROVED=true` and enable launches.

Official references: [Pump creation](https://github.com/pump-fun/pump-public-docs/blob/main/docs/instructions/COIN_CREATION.md), [creator fee collection](https://github.com/pump-fun/pump-public-docs/blob/main/docs/instructions/COLLECT_CREATOR_FEE.md), [Solana PDAs](https://solana.com/docs/core/pda), [Anchor installation](https://www.anchor-lang.com/docs/installation).
