# HAUS — We are the devs.

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

The launch buttons open the native HAUS token form. Live submission remains gated by explicit configuration: NEXT_PUBLIC_DEMO_MODE=false, LAUNCHES_ENABLED=true, mainnet wallet/RPC configuration, Redis, encryption key, metadata storage and origin. The signing/submit/confirmation pipeline is preserved but was not exercised on-chain. No secrets were copied and no transactions were submitted. See .env.example and docs/architecture.md before enabling it.

## Data sources

- https://docs.dexscreener.com/api/reference
- https://api.geckoterminal.com/docs/index.html
- https://solana.com/docs/rpc/http/gettokenlargestaccounts
- https://solana.com/docs/rpc/http/gettokenaccountsbyowner
