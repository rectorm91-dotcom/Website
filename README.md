# RT Personal Profile Card

A compact, production-ready single-page profile for RT. The page presents a Discord-style identity card, exact About Me biography, current Roblox development projects, server-rendered Infinite Flight statistics, and exactly three personal profile links.

The project is standalone and designed for the deployment path GitHub → Railway → Cloudflare → `rtcarter1.com`.

## Requirements

- Node.js 22.13 or newer
- npm

## Install

```bash
npm install
```

## Development

```bash
npm run dev
```

Open the localhost URL printed by the development server, normally `http://localhost:3000`.

## Production build

```bash
npm run build
```

## Production start

```bash
npm start
```

The production server reads `process.env.PORT` and binds to `0.0.0.0`, so Railway can assign its runtime port. Do not hardcode a production port.

## Editable profile and project configuration

All public profile data is stored in `app/config.ts`, including:

- Discord user ID
- Infinite Flight username
- Display name, subtitle, location, and biography
- Roblox group IDs and public community URLs
- Project Discord invitations
- The three bottom social links

The main interface is in `app/page.tsx`, and the visual system and responsive rules are in `app/globals.css`.

## Environment variables

Copy `.env.example` to `.env.local` for local server-side flight statistics:

```text
INFINITE_FLIGHT_API_KEY=your_key_here
```

`INFINITE_FLIGHT_API_KEY` is optional. When it is absent or the upstream service fails, the site shows “Stats temporarily unavailable.” instead of fabricated values. Never expose this value through a public browser environment variable.

## Discord presence implementation

The browser requests `/api/discord-presence`. The server requests Lanyard for the one configured Discord user, validates the response, and returns only the avatar hash, username, public badge flags, and availability. Activities, games, Spotify, rich presence, custom status, and timestamps are stripped before the response reaches the browser. Public flags use original Discord badge icons with accessible names and tooltips. Only confirmed flags are displayed. The icon mapping is in `app/discord-icons.ts`, and original asset URLs are recorded in `public/icons/discord/SOURCES.md`.

The Discord account must join the [official Lanyard server](https://discord.gg/UrXF2cfJ7F) to opt into its public presence service, as described in [Lanyard’s documentation](https://github.com/Phineas/lanyard). Lanyard exposes presence publicly; this website displays only the allowed profile fields. No bot token or account password is required. Discord Invisible is reported as Offline by the presence service.

The page refreshes availability every 60 seconds while visible and immediately on return to the tab. Requests are coalesced with a 15-second per-process cache and an 8-second upstream timeout. The avatar carries the original Discord Online, Idle, DND, or Offline symbol; the separate dot-and-status-text line has been removed. Loading or unavailable data does not invent a status icon and is described by an accessible label/tooltip. A failed avatar uses a neutral Discord-logo placeholder, never presented as the account’s actual avatar.

## Roblox group thumbnails

`app/api/roblox-thumbnails/route.ts` requests current group icons from Roblox’s public group-thumbnail endpoint using numeric group IDs:

- `14355088` — Union Interactive
- `33065528` — Florida State Roleplay

The page calls this same-origin endpoint because Roblox’s thumbnail JSON endpoint does not permit direct cross-origin browser requests. Only completed HTTPS images hosted on `rbxcdn.com` or its subdomains are accepted. Incoming query parameters cannot change the allowed groups or upstream destination. Current group artwork comes exclusively from Roblox, not generated or hand-drawn logos.

Completed results are cached for one hour per server process, with five-minute browser caching. Pending results use a five-second server cache; the browser retries with exponential backoff from five seconds to five minutes. Blocked images use a neutral placeholder. Successful results refresh hourly while the page remains open. Broken image loads fall back gracefully, and the project links remain usable.

## Design assets and checks

The active background is an interactive canvas constellation, not an image. `app/components/ConstellationBackground.tsx` owns the lifecycle and `app/lib/constellation.ts` implements drifting particles, distance-based line fading, and eased cursor repulsion. The former `public/blue-filaments.webp` is retained as an unused asset and is no longer requested or displayed. Brand marks remain recognizable local SVGs, and interface icons use Lucide with its license included under `public/icons/interface/LICENSE`. The existing social-preview image is preserved.

Run `npm test` for presence filtering, status/failure states, Roblox URL validation, pending responses, cache behavior, constellation physics/fading, and icon-file coverage. Run `npm run lint` and `npx tsc --noEmit` for static checks. Both dropdowns start closed on a fresh load. The responsive layout preserves the five requested sections and uses three stat columns on small screens. Collapsed sections are inert so hidden links cannot receive keyboard focus.

### Constellation configuration

Edit `SITE_CONFIG.constellation` in `app/config.ts`:

- `connectionRadius`: maximum distance between connected particles, in CSS pixels (default 150).
- `cursorRadius`, `cursorPush`, `easingSeconds`: local repulsion reach, strength, and velocity easing.
- `driftSpeed`, `maxSpeed`: slow independent motion and a cap that prevents abrupt movement.
- `lineOpacity`, `particleOpacity`: subtle visual intensity. Line opacity follows smoothstep falloff and is exactly zero at/beyond the connection radius.
- `areaPerParticle`, `maxParticles`, `mobileMaxParticles`: density and desktop/phone caps.
- `framesPerSecond`: drawing limit (default 30). Particle updates are elapsed-time based.

The fixed, pointer-transparent canvas stays behind the cards and does not affect layout or block links. The browser's reduced-motion setting renders a static constellation with no cursor repulsion, and the animation pauses completely while the document is hidden. Touch input never influences particles. Canvas resolution is capped at 4 million pixels and device scale at 2; resize observers and animation/listener cleanup prevent duplicated loops during navigation or development refreshes. No new runtime dependency or external service is needed.

<details>
<summary>Archived prompt for the former, unused image background</summary>

```text
Use case: stylized-concept
Asset type: original background bitmap for a premium personal aviation and developer profile website, background only, not a website screenshot
Primary request: tall portrait abstract midnight background, approximately 1024x1536. Near-black midnight navy base with thin flowing electric-blue luminous filaments and sparse tiny blue particles.
Composition/framing: delicate organic fiber-optic energy threads sweep diagonally along the outer left and right edges, with a few star-like blue connection glints. Reserve an extremely dark, quiet, largely empty central column for stacked readable cards that will be overlaid later; do not depict those cards. Fine wisps, elegantly irregular, no geometric structure.
Lighting/mood: premium, refined, restrained contrast; predominantly black, subtle controlled electric-blue edge light.
Color palette: almost black midnight navy and pure electric blue only.
Constraints: generate one original background image; no UI, cards, typography, lettering, logos, planes, objects, purple, violet, white haze, watermark, geometric grid, concentric rings, or large bright areas. Background only.
```

</details>

### Earlier verification — August 29, 2026 (before the constellation update)

- Install, build, lint, TypeScript checks, and all 12 data-handling tests passed.
- Local homepage returned HTTP 200. Production started on the test-only `PORT=4381`, bound to `0.0.0.0`, and served the homepage and both new API routes successfully. No port was added to production configuration.
- Browser checks at 375, 390, 430, 768, 1024, 1440, and 2560px found no horizontal overflow or broken images. Both real Roblox icons and the Discord avatar loaded. Lanyard reported the real account as Offline at verification time.
- Mouse/touch-style clicks expanded and collapsed both cards. Collapsed regions measured zero height and had the `inert` attribute. Keyboard automation in the available preview did not deliver key actions, so physical keyboard activation was not independently verified; the controls are native buttons with standard keyboard behavior. Reduced-motion behavior is implemented in the stylesheet and parallax guard, but device-setting emulation was unavailable.
- All 15 local graphics returned HTTP 200. No private activity fields were present in the public Discord response. Missing Infinite Flight credentials return the intended unavailable state, never sample stats.
- Production dependency audit found zero vulnerabilities. The existing development/build toolchain still reports 11 audit findings; no forced dependency upgrades were made as part of this visual repair.
- Deployment remains the requested GitHub → Railway → Cloudflare workflow. No unrelated hosting service was used or published to.

### Constellation/icon update verification — August 29, 2026

- All 20 automated tests, lint, TypeScript checks, and the production build passed. No dependencies were added.
- Local preview and production homepage returned HTTP 200. Production used a test-only `PORT=4382` and bound to `0.0.0.0`; production defaults remain unchanged.
- A fresh browser reload and production HTML both showed two closed dropdowns. The separate status-text row was absent, while the avatar status and original HypeSquad Balance image loaded successfully.
- Both dropdowns opened by click on mobile. Widths 375, 390, 430, 768, 1024, 1440, and 2560px showed no horizontal overflow or broken images. Profile-card coordinates stayed identical before and after cursor movement.
- All 13 local Discord badge/status image assets returned HTTP 200. The Discord and Roblox data endpoints remained functional.
- Physics tests cover smooth distance falloff, cutoff at the connection radius, local eased repulsion, recovery to drifting motion, frame-rate consistency, speed limits, and mobile/desktop density caps. Reduced-motion and visibility handling are implemented; browser device-setting emulation was unavailable, so those lifecycle states were checked in code rather than claimed as device-tested.

## Flight statistics and daily caching

`app/api/flight-stats/route.ts` requests current data from the official Infinite Flight Public API with the server-only API key. It renders normal JSON-backed HTML values; it never embeds the Waypoint PNG and does not use OCR.

Successful upstream responses use a 24-hour server/shared cache with stale-while-revalidate behavior. Failed responses use a short cache and return only a visitor-safe unavailable message. The endpoint is fixed to the configured Infinite Flight username and is not an arbitrary URL proxy.

## Railway deployment

For ZIP upload and custom-domain setup, start with [START-HERE.md](START-HERE.md). Extract the ZIP and upload the project contents, including dotfiles, to the repository root; do not upload only the ZIP itself.

1. Push the project to GitHub. A private repository is supported when Railway has access to it.
2. Create a Railway project from the GitHub repository.
3. The included `railway.json` uses Railpack and `npm ci --include=dev && npm run build` as the build command.
4. The same configuration uses `npm start` as the start command and `/` as the health check. Keep dependency pruning disabled: the current server runtime uses tooling listed in `devDependencies`. A static-file server cannot serve the backend routes.
5. Add `INFINITE_FLIGHT_API_KEY` under Railway service variables if live flight statistics are desired.
6. Do not create a fixed `PORT` variable; Railway supplies it automatically.
7. Deploy and verify the Railway public domain.

One service runs both the frontend and the backend. Keep `.openai/hosting.json` in the repository because `vite.config.ts` imports this non-secret build configuration. No Sites or Bolt hosting account is needed to start this project on Railway.

## Cloudflare and rtcarter1.com

Add `rtcarter1.com` as a Railway custom domain, then create the DNS record Railway provides in Cloudflare. Cloudflare supports CNAME flattening for the root domain. Use **Full (strict)** SSL/TLS mode after Railway provisions its certificate. Add and redirect `www.rtcarter1.com` separately if needed.

## Security notes

- No Discord bot token is used.
- No private Roblox credentials are used.
- The Infinite Flight key remains server-side.
- No arbitrary URL proxy exists.
- External links open in new tabs with `noopener noreferrer`.
- No visitor data is collected or transmitted by the site itself.
