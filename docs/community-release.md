# Community release — 2026-10-01

## Current scope
- Pump.fun launches set creator rewards to launching wallet. This is disclosed in the form, message signature and final transaction review. It is not a per-token community vault. Do not imply a future vault will automatically change existing coins.
- Launches with no initial buy work without a lookup table. Initial buys stay disabled until a finalized, active, frozen `HAUS_LAUNCH_LOOKUP_TABLE` is configured and tested. Users can buy separately after launch.
- New launches require a funded user wallet. Server preparation simulates first; the mint signer is encrypted until exact wallet approval; submission is simulated again and finalized creation evidence is checked before registry activation.
- Holder sessions and challenges live in Redis. Challenges expire in two minutes, sessions in fifteen. Each post, pitch, vote and upload checks fresh confirmed SPL/Token-2022 holdings. RPC failures never grant access. Message signatures move no funds.
- Website voting is application-managed (not on-chain): one changeable vote per verified wallet, a one-hour round beginning with the first pitch, at least three wallets and a strict majority. One pitch per wallet per round, up to twenty. Ties/low turnout keep the current published site. Pitches are immutable snapshots. A holder can vote for their own pitch.
- Holding checks are at action time. Tokens are not locked, ballots are not token-weighted, and multiple wallets can belong to one person. This deliberately simple website rule must not be reused for financial vault decisions.
- Due rounds finalize on the next room or public-site request. Concurrent reads/writes use Redis compare-and-set. Public pages at `/sites/<mint>` do not require the app password or wallet. HTML is escaped and served under a script-blocking sandbox CSP.
- Shared PNG/JPEG/WebP/GIF assets: 4 MB per file, 100 files/64 MB per Haus. Files are served with byte-derived MIME, sanitized names and nosniff. Blob persistence and room registration commit atomically. Uncommitted uploads expire in 24 hours. Anyone can download; only verified holders upload. No asset moderation/approval workflow is claimed.
- Genuine market quotes are cached for up to fifteen minutes during provider errors and marked delayed with the original timestamp. No quotes are fabricated for unindexed tokens. DEX Screener calls batch up to thirty tokens.

## Storage and operation
Keep HAUS Redis keys isolated with `REDIS_KEY_PREFIX=haus:`. Do not flush shared Redis or change Perks configuration. Room keys are `room:v2:<mint>`, asset blobs `room:asset:<mint>:<id>`, authentication `holder:*`. Local legacy room JSON is imported once if the Redis room does not exist. Local files are left intact. Configure durable Redis backups and sufficient capacity; do not use an evicting cache for these records. Asset quotas are per community, so monitor total Redis usage as communities grow. New chat retains 500 messages; round history retains the latest ten rounds plus the current published design, subject to a 20 MB room limit. Local drafts can still be previewed at `/drafts/<slug>`.

Vault workers, buybacks, burns and DEX funding remain off. Existing contract code and roadmap are retained but are not required to launch.

## Validation
Run `npm test` and `npm run typecheck`. Compile tests before running the opt-in integration test. Set `HAUS_INTEGRATION_CHECK=true` for isolated Redis concurrency/replay/persistence checks, `HAUS_LAUNCH_SIMULATION=true` for an unsigned mainnet launch simulation, and `HAUS_METADATA_CHECK=true` for a tiny real Pump metadata upload. The simulation uses a funded public account as an unsigned payer and cannot spend its funds. Integration checks clean only their randomly generated test keys. Metadata checks leave a small unused IPFS artifact.

Live infrastructure checks passed: Redis session/replay/concurrency/blob commit, Pump metadata upload, unsigned mainnet launch simulation. Real transaction signing/broadcast and positive-holder interaction in a user wallet remain manual acceptance steps. No token was launched or SOL spent by these checks. A local browser automation restriction prevented visual verification; server/API and build checks are separate evidence.

## Sources
- [Pump coin creation](https://github.com/pump-fun/pump-public-docs/blob/main/docs/instructions/COIN_CREATION.md)
- [Pump creator fees](https://github.com/pump-fun/pump-public-docs/blob/main/docs/instructions/COLLECT_CREATOR_FEE.md)
- [DEX Screener API](https://docs.dexscreener.com/api/reference)
