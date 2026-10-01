# Requested token preview

The five supplied mint addresses replace the invented market fixtures. `lib/token-snapshot.json` records capture time and per-token public source URLs. This is a static snapshot, not a live feed. Run `node scripts/refresh-token-snapshot.cjs` to refresh explicitly with public network access, then rebuild.

Card fields match Perks: name, ticker, USD market capitalization, curve percentage, contract address, and age. Graduation is explicit. Market-cap abbreviations use Perks' one-decimal K/M/B/T format. Missing values render as unavailable, never a fabricated zero. Age uses the token creation timestamp at snapshot capture, not the later exchange-pool creation timestamp.

DEX Screener supplies market capitalization from the highest-liquidity pair with the exact requested base mint. Quote-side matches are excluded. Pump.fun's public coin page supplies creation time, metadata, completion flag and real token reserves. The curve calculation matches Perks: `100 * (1 - realTokenReserves / 793100000000000)`, bounded to 0–100 for these standard Pump curves. Completed curves show 100%. It does not infer graduation from market cap or a fixed USD threshold. Future nonstandard curves must use their own initial reserve parameters.

Artwork uses the returned DEX Screener URL where available, otherwise Pump.fun's public image proxy or metadata URL. External artwork can become unavailable; the UI falls back to the token ticker. The monogram is traced from the user's second logo reference and contains no detached upper-right block.

Community chat, proposals and votes remain explicitly local demos; real coins shown here do not imply that their holders have joined HAUS. A separate local-storage namespace keeps the previous fictional community demo recoverable without applying its proposals to these tokens.
