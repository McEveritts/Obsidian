# 🧪 Verification, Responsive Matrix & Accessibility Audit

**Obsidian v2.0** has a deterministic build gate (`npm test`), browser regression fixtures for Jellyfin Web components, and the recorded Jellyfin Web 12.2/12.4 live checks below. Fixture results and emulated viewports do not establish physical-device compatibility, a guaranteed 120fps frame rate, or blanket WCAG conformance. The [README gallery](../README.md#screenshots) now contains fresh 12.4.0 sign-in captures plus the movie library-grid image confirmed current by the owner. Outdated home, detail, player, login, and mobile captures and the derived slideshow have been removed. [Capture notes](./screenshots/README.md) record the live stylesheet hash; the older runtime results below remain historical evidence.

---

## 1. Automated Build & Selector Contract Gates

Running `npm test` (`node scripts/checkSyntax.js && node build.js`) checks tooling syntax, validates and builds all twelve CSS modules, and checks the stylesheet's external dependencies:

1. **JavaScript Tooling Syntax Gate (`scripts/checkSyntax.js`):** Validates all build and audit scripts via `node --check`.
2. **CSS Brace, Parenthesis & Comment Balance (`build.js`):** Checks all 12 `src/*.css` modules for unclosed blocks, unbalanced parentheses, or unterminated comments. This is a structural check, not a complete CSS parser.
3. **Zero External HTTP Dependency Gate (`build.js`):** Strips CSS comments and scans for active `@import` statements or external HTTP URLs. Confirms the stylesheet has no required external network dependencies; server and media availability are separate from this CSS check.
4. **Optional upstream selector audit (`scripts/precise_audit.js`):** Extracts class and ID tokens across all 12 modules. With an upstream tree present, it checks whole-token existence and MUI component mappings; without one, it reports that the live existence check was skipped. Run `npm run audit:selectors` with `OBSIDIAN_UPSTREAM_DIR` pointing to the upstream `src` directory to enable it. A successful local build alone does not prove every selector exists upstream.

---

### Live TV Regression Gate (Jellyfin 12.4.0)

Run the deterministic build followed by the Chromium fixture suite:

```bash
npm ci
npm test
npx playwright install chromium
npm run test:live-tv
```

The twenty-seven browser checks cover `320x480`, `390x844`, `844x390`, `1656x1269`, `1920x1080`, and `3840x2160`, plus forced colors with reduced motion. Six Guide/channel checks assert aligned headers and rows before and after scrolling, native schedule geometry, consistent card heights with missing or partial EPG data, two-line channel names, contained logos on an opaque backing, non-overlapping 44px actions, unchanged non-channel artwork, visible focus, and zero document overflow.

Twelve home-screen shortcut checks exercise both left-to-right and right-to-left layouts using the legacy raised `emby-linkbutton` markup and native `scrollX` scroller. They verify all six routes remain unchanged, glass pill surfaces and 44px targets apply, hidden links remain hidden, unrelated buttons and section headings are untouched, and focusing the final shortcut scrolls it into view. The accessibility check covers shortcut focus, forced-color surfaces, and disabled transitions under reduced motion. The pre-shortcut-fix stylesheet fails the new shortcut regression.

Eight hover checks cover native-scroll and desktop-transform tracks in both text directions at 320px and 844px widths. They assert that the first and last shortcuts have clearance for the full hover halo, existing overflow modes remain intact, and unrelated carousel gutters and spacing are unchanged. The pre-glow-fix stylesheet fails these checks. The fixture uses native 1em track padding rather than artificial vertical padding on the outer scroller.

The candidate stylesheet was also checked against real Jellyfin 12.4.0 Guide and Channels views at `1656x1269` and `320x480`: the timeline and grid have identical x origins, native horizontal scroll synchronization remains intact, and all 86 channel cards have equal heights. These are emulated Chromium viewports, not physical mobile or TV hardware. The change uses only CSS and does not replace playback links, API requests, or program scheduling logic.

`OBSIDIAN_CHROMIUM_PATH` can select an existing Chromium executable; `OBSIDIAN_STYLESHEET` can select an alternate stylesheet for a regression negative control. Browser dependencies are development-only and are not needed to load the compiled theme.

---

### Player Volume Popup Regression Gate (Jellyfin 12.4.0)

Run `npm test` followed by `npm run test:player-osd` after installing Chromium as described above. The seventeen checks use the installed Jellyfin volume component's `.volumeOsd`, `.iconOsdIcon`, and progress-meter markup and native CSS in a headless Chromium fixture, not a live playback session.

The popup is a compact horizontal glass pill, with a small speaker icon and an indigo-to-fuchsia volume meter. Checks cover six desktop/mobile/TV viewport sizes in both text directions, accurate native percentage updates and mute classes, click-through behavior, unchanged unrelated icon overlays, enlarged text, late-loading native CSS, and forced-color visibility. Native `.hide` and `.iconOsd-hidden` states remain authoritative. Reduced motion retains a 1ms opacity transition because Jellyfin waits for `transitionend` before adding `.hide`; disabling the transition entirely would prevent that cleanup. The default native dismissal lifecycle is also exercised.

The pre-fix compiled theme fails the compact-popup regression. `OBSIDIAN_CHROMIUM_PATH` and `OBSIDIAN_STYLESHEET` work as in the Live TV suite.

### Player Overlays, Global Controls, Shell, Music/Readers & Cards Gates (Jellyfin 12.4.0)

In addition to `npm run test:live-tv` (`27` checks), CI and local development run five headless Chromium suites covering all 12 CSS modules:

- **`npm run test:player-osd` (`44` checks):** Exercises `.volumeOsd`, `.brightnessOsdProgressInner` / `.iconOsd`, `.upNextContainer.upNextDialog`, `.skip-button`, `.playerStats`, `.subtitleSyncContainer`, `.chapterThumbContainer`, and `.subtitleappearance-fullpreview` across six desktop/mobile/TV viewports in `ltr` and `rtl`, `transitionend` dismissal lifecycles, forced colors, and `200%` text scaling.
- **`npm run test:global-controls` (`5` checks):** Verifies live upstream selector auditing (`0` dead selectors across all 12 modules), `:root` `--jf-palette-*` / `--mui-palette-*` contrast tokens, unscoped `.raised` / `.button-submit` / `.button-delete` / TV `.emby-button.show-focus:focus`, chromatic `.mdl-spinner`, `.progressring`, `.mdl-switch`, `<progress>`, and `.emby-select-withcolor`.
- **`npm run test:shell-overlays` (`29` checks):** Verifies `.toast`, `.selectionCommandsPanel` / `.itemSelectionPanel`, `.infoBanner`, `.quickConnectError`, SyncPlay group sheets, and Cast Remote D-pad controls (`>= 48px`) across six viewports (`ltr` & `rtl`), reduced motion, and forced colors.
- **`npm run test:music-readers` (`22` checks):** Verifies synced `.lyricPage` states, `.nowPlayingBar` sub-controls & queue pills, `.slideshowDialog` / `.slideshowBottomBar`, `#bookPlayer` / `#dialogToc` dark glass overrides, `#comicsPlayer .swiper-pagination`, and `.logoScreenSaver`.
- **`npm run test:cards-tables` (`18` checks) & `npm run test:xbox-nav` (`6` checks):** Verifies `.mediaSourceIndicator`, `.fullSyncIndicator`, `.itemProgressBarForeground-recording`, `.personCard`, `.detailTable`, `.searchFieldsInner`, `1920x1080` library cover PNG headers, and Xbox/TV popover controller navigation.

---

## 2. Live Runtime Verification Summary (Jellyfin 12.2.0)

Live DOM and computed-style telemetry was executed against a running **Jellyfin 12.2.0** server using **Headless Firefox Gecko 147.0 (Playwright `firefox-1543`)** with emulated desktop and mobile touch viewports.

> [!NOTE]
> **Engine Transparency Disclosure:** Automated browser assertions and gallery captures were executed under **Headless Firefox Gecko (Playwright)** with emulated viewport geometries, device scale factors, and mobile touch/user-agent profiles. Emulated mobile viewports validate CSS media-query breakpoints, flexbox wrapping, and touch scroll containment (`overflow-x: auto`), and are explicitly distinguished from native iOS WebKit hardware.

| Verification Check | Target / Expected Invariant | Observed Telemetry | Outcome |
| :--- | :--- | :--- | :---: |
| **Root Token Injection** | `--obs-accent-primary: #6366f1`, `--obs-bg-base: #000000`, `--mui-palette-background-default: #000000` | `#6366f1`, `#000000`, `#000000` | **PASSED** |
| **Atmospheric Pseudo-Elements** | `body::before` static radial aurora (`opacity: 0.55`) + `body::after` vignette & inline SVG grain | `auroraGradient: true`, `vignetteAndGrain: true` | **PASSED** |
| **Desktop Home (`1920x1080`)** | `.MuiAppBar-root` & `.skinHeader` `blur(16px)`, `.cardBox` `backdrop-filter: none` (120Hz budget), `0.28` top specular border, `docScrollW <= docClientW` | `blur(16px)`, `cardBoxBackdrop: none`, `rgba(255, 255, 255, 0.28)`, `1920 / 1920` | **PASSED** |
| **Section Title Alignment** | Home `"My Media"` renamed to `"Media Libraries"`; left edge aligned with `.cardBox` (`3.3%` = `63.35px` at `1920x1080`) | `content: "Media Libraries"`, `63.35px` aligned across sections | **PASSED** |
| **Item Detail Hero (`1920x1080`)** | `.detailPagePrimaryContainer` `blur(24px)` + `0.28` top border; `.btnPlay` hit target `>= 44.0px` | `blur(24px)`, `rgba(255, 255, 255, 0.28)`, `.btnPlay: 68.00x48.00px`, `1920 / 1920` | **PASSED** |
| **Compact Mobile (`320x480`)** | Zero horizontal document overflow (`docScrollW === docClientW`) on Home & Library views | `Home: 320 / 320`, `Library: 320 / 320` | **PASSED** |
| **Bidirectional Touch Scrollers** | `.emby-scroller.scrollX` maintains `overflow-x: auto` on touch devices and scrolls bidirectionally | `overflowX: auto`, `scrollLeft: 0 -> 180 -> 0` verified across Home & Library rows | **PASSED** |

---

## 3. Responsive Viewport & Breakpoint Architecture

Obsidian avoids blanket `html, body { overflow-x: hidden }` shortcuts, constraining horizontal carousels at the component boundary (`.emby-scroller`) and scoping compact layout adjustments to explicit `@media` breakpoints:

| Viewport Tier | Breakpoint / Geometry | Key Layout Adaptations |
| :--- | :--- | :--- |
| **Compact Phone** | `<= 360px` (`320x480`) | Scoped container padding (`0.75rem`), `flex-wrap: wrap` on detail action rows, zero horizontal overflow (`320 === 320`) |
| **Mobile Portrait** | `<= 600px` (`390x844`, `430x932`) | 2-column poster grid, full-width glass login card, native touch horizontal scrolling (`overflow-x: auto`) |
| **Mobile Short-Landscape** | `max-height: 500px` (`844x390`) | Compressed Floating Dynamic Dock OSD (`padding: 0.45rem 0.85rem`) preserving `>= 44px` WCAG 2.2 AAA button hit targets |
| **Tablet Portrait / Landscape** | `744x1133`, `1180x820` | Responsive poster card scaling without title overlap; frosted slide-out `.MuiDrawer-paper` / `.mainDrawer` |
| **Desktop & Ultrawide** | `1920x1080` – `3440x1440` | Centered glass hero on Item Detail (`max-width: 1600px`), pointer-gated card hover lift (`translateY(-4px)`) |
| **4K Smart TV / Ten-Foot UI** | `3840x2160` (`.layout-tv`) | High-visibility `:focus-visible` Indigo glow rings (`3px`) for D-pad / remote navigation |
