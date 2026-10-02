# HAUS — We are the devs.

## Vault implementation in progress

Launches use Pump.fun createV2 with creator rewards assigned to the explicitly approved HAUS operator wallet `8nUax7zWTDE3yRuEcm4GevhmVP2u1NavKwvKSByZT92S`. The launch form and signed preparation message disclose this. No custom vault deployment is needed. Initial buys remain unavailable until a frozen lookup table is configured; users can launch with zero initial buy and buy afterward. Wallet review, exact-message verification, simulation, finalization evidence and recovery are enforced.

Community chat, holder sessions, website rounds and shared assets use HAUS-prefixed Redis. Website voting is one vote per verified wallet, one hour, at least three voters and a strict majority; winners are served publicly at `/sites/<mint>`. Each write rechecks holdings. Assets support PNG/JPEG/WebP/GIF up to 4 MB and public downloads. See [community operating notes](docs/community-release.md).

Vault allocations, buybacks, burns and DEX funding remain deferred. Their existing source and roadmap are retained. Never enable the fee worker or deploy a vault as part of the current release. No real token launch has been broadcast during implementation; a funded wallet must approve the first end-to-end live launch.


Solana / Pump.fun discovery with a native HAUS market page and community website tools. Launch infrastructure was extracted from Perks; Perks itself is unchanged.

## Run locally

Install dependencies with `pnpm install --frozen-lockfile`. Use pnpm dev (http://localhost:3100), pnpm typecheck, pnpm test, and pnpm build.
This workspace reuses Perks' installed dependencies through a node_modules junction. Do not mutate dependencies through that junction. A standalone checkout should install its own dependencies.

## Working flows

- The five requested Solana tokens load current prices, market caps, liquidity and volume from DEX Screener. Solana RPC supplies current bonding progress. No snapshot prices are presented as current values.
- Clicking a coin opens HAUS's own candlestick chart: 1m / 5m / 1h / 1d, volume bars, crosshair, zoom controls, and separate Community access. No embedded DEX Screener UI.
- Trades / Holders / About tables sit directly under the chart. Candles and recent pool trades come from GeckoTerminal. The holder endpoint resolves the 20 largest token accounts and their owners via Solana RPC; this is not a complete or wallet-aggregated holder list and includes pools/vaults.
- Discovery filters, sorting, search, grid/list layouts and a browser-local saved list.
- Coin → Enter Haus opens a shared workspace: Overview, Website, DEX tools, Pitches, Assets and Chart. Desktop chat remains in a sticky right column; mobile chat stays in an expandable bottom dock. Tool changes preserve the chat draft and membership session.
- Guests can read the room and browse every tool. Participation uses an expiring, single-use signed wallet challenge, followed by a mainnet token-account check. Any positive unfrozen holding qualifies in this pilot; this is not a top-20 room. Sessions are mint-scoped, held only in browser/server memory, and expire after 15 minutes. Every chat message and site pitch rechecks holdings on the server. Disconnecting or changing wallets immediately locks the UI again.
- Four editable website themes, device-local drafts, downloadable HTML, and shared holder-authored website pitches. The /sites/[slug] route still displays only a locally saved draft.
- The compact original footer and graphic How it works walkthrough. Existing brand kit is preserved.

## Data and configuration

Public market reads work without keys but require server network access. Markets refresh every 30 seconds; chart/trade history every 60 seconds; holder accounts every 120 seconds. The server caches/deduplicates requests and backs off when GeckoTerminal responds with 429. Provider failures show unavailable/retry states rather than fabricated values. The public Solana endpoint currently rate-limits getTokenLargestAccounts; configure SOLANA_RPC_URL with a mainnet provider supporting that method for reliable holders. Market values and chart closes can differ because each provider updates independently.

Chat and website pitches use `/api/haus`. Messages and immutable pitches are stored in `.haus-data/<mint>.json` with serialized atomic writes (500 recent messages, 50 pitches per coin). This is a single-process local pilot, not a multi-instance database. Rooms are publicly readable; signing authorizes holder participation, not private access. A server restart requires re-verification but retains messages and pitches. Successful writes are polled every six seconds while the page is visible. No example messages, funding balances or vote counts are seeded.

Set APP_ORIGIN to the exact deployed origin (local default: http://localhost:3100). SOLANA_RPC_URL must be a Solana mainnet endpoint supporting getTokenAccountsByOwner; provider failures block verification/writes rather than granting access. Production still needs a durable database, distributed sessions/rate limits, moderation/report/block, pagination, and a dependable RPC provider. The current short-lived bearer session stays in memory; production should move to host-only HttpOnly sessions.

Binding votes, DEX contributions/payment fulfillment, asset uploads, AI generation and hosted subdomains remain unconnected and are labeled accordingly. Website drafts are editable templates, not AI-generated sites. No deposit address or simulated checkout is shown.

The launch buttons open the native HAUS token form. Live submission remains gated by configuration, a verified vault deployment and a frozen launch lookup table. Perks RPC and Redis settings were reused in the ignored local environment with separate HAUS keys and a fresh launch-encryption key. Vault execution passed local-validator checks; real Pump wallet launches and mainnet deployment remain unverified. No real SOL was spent. See `.env.example` and `docs/vault-release.md` before enabling it.

## Data sources

- https://docs.dexscreener.com/api/reference
- https://api.geckoterminal.com/docs/index.html
- https://solana.com/docs/rpc/http/gettokenlargestaccounts
- https://solana.com/docs/rpc/http/gettokenaccountsbyowner

## Homepage and app routing

- Local project homepage: `http://localhost:3100/`; token app: `http://localhost:3100/app`.
- Open app uses `/app` on the current host (for example `https://www.haus.fun/app`). No app subdomain is required. Middleware still supports `app.haus.fun` if it is connected later.
- Set `APP_ORIGIN` to the deployed app origin, for example `https://www.haus.fun`. Adding an optional app subdomain requires DNS and a matching domain assignment in Vercel.
- The cosmetic preview gate accepts `1337` and remembers entry with a `.haus.fun` cookie across production hosts. It requires no secret or environment variable. Local cookies remain host-only. This is a UI gate, not a security boundary; API actions still require wallet authorization.
- Old `/?coin=...` and `/?view=...` links redirect to the app with their query parameters preserved. The app has no promotional hero; its first section is Explore.
- Homepage descriptions distinguish the working discovery/studio tools from planned launches, vault execution and binding votes. Update that copy when the release gates are actually lifted.
