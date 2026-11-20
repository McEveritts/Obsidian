# Testing & verification

Obsidian ships with a build check (`npm test`) and headless Chromium Playwright fixtures covering Jellyfin Web 12.4 components. All suites run in GitHub Actions on push and pull requests.

## Build & syntax checks

```bash
npm test
```

Runs `scripts/checkSyntax.js` (`node --check` on JS files and `bash -n` on shell helpers) and `build.js`, which:

- Concatenates the 12 modules in `src/` into `obsidian.css`.
- Verifies balanced braces, parentheses, and comments.
- Verifies there are no active `@import` rules or external `http(s)://` URLs.

If you have a local `jellyfin-web` checkout, you can also check selectors against upstream source:

```bash
OBSIDIAN_UPSTREAM_DIR=/path/to/jellyfin-web/src npm run audit:selectors
```

## Browser regression suites

Install dev dependencies and Chromium once:

```bash
npm ci
npx playwright install chromium
```

| Command | Checks | What it covers |
| :--- | :---: | :--- |
| `npm run test:live-tv` | 27 | Guide header/row alignment, equal-height channel cards, contained logos, home shortcuts (LTR/RTL), hover clearance |
| `npm run test:player-osd` | 44 | Volume pill, brightness/icon OSD, Up Next, skip button, player stats, subtitle sync, chapters, `transitionend` cleanup, 200% text scaling |
| `npm run test:global-controls` | 5 | Root contrast tokens, unscoped `.raised`/submit/delete buttons, TV focus rings, spinners, switches, progress bars, selects |
| `npm run test:shell-overlays` | 29 | Toasts, multi-select bars, info banners, Quick Connect errors, SyncPlay sheets, Cast Remote D-pad |
| `npm run test:music-readers` | 22 | Synced lyrics, expanded audio bar & queue, photo slideshow, book reader & TOC, comics player, screensaver |
| `npm run test:cards-tables` | 18 | Multi-version/sync/recording badges, person cards & biographies, detail tables, search bar, 1920×1080 cover PNG headers |
| `npm run test:xbox-nav` | 7 | Optional `obsidian-xbox-nav.js` popover focus, Back/B dismissal, and `ensure-obsidian-jellyfin-web.sh` APT helper |

Set `OBSIDIAN_CHROMIUM_PATH` to use an existing Chromium binary, or `OBSIDIAN_STYLESHEET` to test against an alternate stylesheet.

## Responsive breakpoints

Tests exercise `ltr` and `rtl` layouts, `prefers-reduced-motion`, and `forced-colors` across these viewport sizes:

| Viewport | Size | Key adjustments |
| :--- | :--- | :--- |
| Compact phone | `<= 360px` (`320×480`) | Tighter padding, wrapped detail actions, zero horizontal page overflow |
| Mobile portrait | `<= 600px` (`390×844`) | 2-column poster grid, full-width glass login card, touch horizontal scrollers |
| Mobile short-landscape | `max-height: 500px` (`844×390`) | Compact playback dock keeping >= 44px button targets |
| Tablet | `744×1133`, `1180×820` | Responsive card sizing and frosted slide-out drawer |
| Desktop / ultrawide | `1920×1080` – `3440×1440` | Centered item detail hero (`max-width: 1600px`), pointer-only hover lift |
| 4K TV (`.layout-tv`) | `3840×2160` | High-visibility 3px `:focus-visible` outlines for remote/D-pad navigation |

Note: Browser tests use emulated Chromium viewports and component fixtures rather than physical TV or mobile hardware.
