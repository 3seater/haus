# Initial verification — 2026-09-30

- Production `next build` passed (Next 15.5.25 from the existing Perks dependency installation).
- Strict TypeScript check passed.
- 11 Node tests passed: launch intent binding, signature preservation, changed-instruction rejection, fee/assertion limits, request-origin protections, vote toggling, per-token winners, tie/no-turnout behavior, and replacement of a prior published version.
- Production app served successfully on localhost:3100.
- Browser verified: coin search, Sites live filter (three matching illustrative communities), editable site content, pitching a frozen version, vote increment, round finalization, and winning design served at `/sites/mellow`.
- Browser verified: local chat submission, explicit unconnected top-20 gate, a simulated 25 USDC contribution, and separate asset totals.
- Mobile appearance reviewed at 390 × 844; viewport reset after review.
- No browser error/warning logs during the final production checks.
- Original Perks tracked files remained clean.

No live wallet signing, mainnet token creation, AI provider request, DNS/public deployment, DEX purchase, or real deposit was performed. The build emits an optional bigint native-binding fallback warning; JavaScript fallback is active.

Saved screenshots: [desktop](screenshots/haus-desktop.png), [mobile](screenshots/haus-mobile.png), [studio](screenshots/haus-studio.png), [community](screenshots/haus-community.png).

Local dependency note: the current node_modules is a read-only-use junction to the existing Perks installation. An offline lockfile refresh attempted by the bundled pnpm launcher still requested registry policy metadata and could not complete under network restrictions. Removed direct dependencies were pruned from the lockfile importer while preserving the original pinned package resolutions. A clean standalone install has not been verified; use a normal independent installation before changing dependencies or deploying.

## Pink identity redesign — September 30, 2026

- Replaced app chrome, navigation, discovery, community, proposal, studio, onboarding, and modal styling.
- TypeScript check and production build passed. All 11 existing tests passed.
- Browser reviewed at 1440px desktop and 390px mobile; no horizontal page overflow at either size.
- Verified navigation into studio, proposals, community room, and the mobile launch form. Preserved browser-local preview data.
- Screenshots: haus-pink-desktop.png, haus-pink-mobile.png, haus-pink-studio.png in docs/screenshots.
- Production preview running at http://localhost:3100. Existing demo/live integration boundaries are unchanged.

## Logo and requested tokens — September 30, 2026

- Traced the supplied h silhouette across React logo, standalone SVG, and favicon; removed detached block.
- Fixed artwork letterboxing at rest with cover sizing and SVG slice behavior.
- Replaced eight fictional market fixtures with the five requested Pump token addresses. Public-data snapshot captured at 21:58 UTC; per-token sources retained in lib/token-snapshot.json.
- Matched Perks card fields: token name, ticker, market cap, bonding bar/percentage, contract address, launch age. Migrated curves show 100% in green.
- All five remote images loaded in browser checks. Desktop and 390px phone grids have no horizontal overflow. Token selection opens the matching community.
- TypeScript and all 14 tests pass, including market-cap formatting and unavailable/progress boundaries.

## Native market page and cleanup — September 30, 2026

- Replaced demo community actions and snapshot prices with live market reads, local saved coins, editable drafts, and HTML export. Shared room services remain explicitly unavailable.
- Coin clicks open a native HAUS candlestick chart with token identity, prominent price, market metrics, 1m/5m/1h/1d controls, volume, crosshair and zoom. Removed the DEX Screener iframe.
- Trades, Holders and About tabs are directly beneath the chart. Verified real candle and trade payloads in production; browser displayed live buy/sell rows with explorer links. Public Solana getTokenLargestAccounts returned 429; holder UI uses an honest retry state. A documented alternative RPC required a personal token, so no fallback was silently enabled.
- Market API updates every 30 seconds. History/trades are cached and polled every 60 seconds with provider 429 backoff. No generated financial data is used as fallback.
- Rebuilt footer into brand + Explore / Build / Resources / Information columns with a pink gradient and bottom copyright/network strip.
- Browser checked desktop 1440px and phone 390px: no horizontal page overflow. Verified interval switching, About tab, Community navigation, and site studio. HTML serialization/escaping covered by tests; browser download-event verification timed out.
- TypeScript, production build and all 22 tests passed. Final production page console had no errors. Production server left at http://localhost:3100.
- Screenshots: docs/screenshots/haus-native-market.png and haus-structured-footer.png.

## Illustrated how-it-works walkthrough — September 30, 2026

- Added How it works beside the header wallet/launch actions and connected the footer link to the same modal.
- Four original HAUS vector/CSS illustrations: logo welcome, market/community card, website composition, and connected community roles. Pink, cream, charcoal and gray treatments; short captions.
- Next/back, clickable progress dots, arrow-key navigation, Escape/close, restart at slide one, and final Explore HAUS action verified in the browser.
- Desktop and 390px mobile reviewed. Mobile dialog is 362px wide and 528px high with no horizontal overflow. Reduced-motion preference disables slide animation.
- Production build passed. Final browser console had no errors. Screenshot: docs/screenshots/haus-how-it-works.png.


## Persistent Haus workspace — 2026-09-30

- Coin page now enters a unified Haus: overview, website editor, DEX tools, site pitches, assets, and native chart/tables. Chat stays mounted across tool switches. Desktop uses a sticky side panel; mobile uses a persistent expandable/minimizable dock with reserved page space.
- Guests can browse public tools and messages. Editing/export/saving/pitch actions prompt for verification. Server-side writes require a valid mint-scoped session and a fresh token holding check. Wallet disconnect/switch invalidates the UI session.
- Signed challenges bind wallet, mint, origin, network, nonce and expiry. Tests cover replay, wrong wallet/mint, altered signatures, challenge/session expiry, missing holdings, holdings loss and RPC failure. Parser tests reject invalid token programs/owners/mints, zero balances and frozen accounts.
- 26 tests passed; production build passed. HTTP smoke checks returned 200 for public reads, 401 for unsigned writes, and 400 for unknown mints. No wallet was connected or signed on behalf of the user; successful real-wallet verification remains to be exercised with a holder wallet.
- Browser checks: coin-to-Haus navigation, tool switching, guest editor lock, pitch-to-verification dialog, desktop chat, mobile chart with expanded chat, no mobile horizontal page overflow.
- Room data is local to one server process/filesystem; no example messages or pitches were seeded. Funding, binding votes, hosted deployments, asset uploads and AI generation remain unavailable.
