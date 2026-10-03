# Loading UI

Use `components/ui/skeleton.tsx` and `app/skeleton.css` for every new loading surface. All skeletons share the `haus-skeleton` effect and the same reduced-motion behavior. Do not introduce a separate spinner or animation for initial data reads. Transaction/signature progress is an action state and may retain its existing indicator.

- Keep the real shell mounted. Server-render known token identity and list membership; load quotes separately.
- Use `SkeletonValue` inside the final typography for numeric values. Reserve widths for changing ticker text.
- Keep image dimensions identical before decoding, across gateway retries, and after load.
- Put unknown-length lists in the same bounded, scrollable region for loading, empty, failed, and populated states. Do not estimate a list's eventual height from a guessed item count.
- Charts and embedded previews keep their final viewport. Skeleton overlays are opaque and cover the pending frame, not adjacent controls.
- Retain existing data during background refresh. Do not briefly show a missing-token, empty-chart, missing-draft, or retry state while its prerequisite request is pending.
- Do not mark a fallback identity as a real token or enable its actions. Replace its default website design when actual identity arrives.
- Decorative bars are hidden from accessibility APIs. The containing region exposes its loading status. Never put interactive controls in a skeleton.

## Verification

Run `node scripts/check-loading-layout.cjs` against a local production server. `LOADING_TEST_URL` defaults to `http://localhost:3111`. Set `PLAYWRIGHT_MODULE` if Playwright is supplied outside this repository; `PLAYWRIGHT_CHANNEL` defaults to installed Chrome. The test uses the existing Test token as server-rendered registry metadata and intercepts client reads; it does not connect wallets or submit transactions.

The check delays API/image responses, supplies populated and failed responses, compares frame bounding boxes, records browser layout-shift events, checks horizontal overflow, and checks docs hash hydration and reduced motion. It covers desktop and mobile home, Explore, community, market, pending identity, studio, drafts, pitches, assets, vault, failed requests, and My Hauses. Screenshots are written to ignored `test-results/loading/`.

Bounds assertions allow one pixel for browser rounding; layout-shift assertions require a score below 0.00001. These are regression checks for the tested viewports and fixtures, not a guarantee for arbitrary future content. Add cases when adding a new async region or breakpoint.
