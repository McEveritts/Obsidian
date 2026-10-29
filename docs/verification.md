# 🧪 Verification, Responsive Matrix & Accessibility Audit

**Obsidian v2.0** is validated through a deterministic build gate (`npm test`) and automated live browser verification against **Jellyfin Web 12.2**.

---

## 1. Automated Build & Selector Contract Gates

Running `npm test` (`node scripts/checkSyntax.js && node build.js`) enforces four compile-time invariants before `obsidian.css` is emitted:

1. **JavaScript Tooling Syntax Gate (`scripts/checkSyntax.js`):** Validates all build and audit scripts via `node --check`.
2. **CSS Brace, Parenthesis & Comment Balance (`build.js`):** Parses every line across all 10 `src/*.css` modules to guarantee zero unclosed blocks, unbalanced `calc()`/`rgba()` parentheses, or unterminated comments.
3. **Zero External HTTP Dependency Gate (`build.js`):** Strips CSS comments and scans every rule for active `@import` statements or external `url(http://...)` / `url(https://...)` calls. Guarantees 100% offline LAN operation with zero external network dependencies.
4. **Upstream Jellyfin 12.2 Selector Existence Contract (`scripts/precise_audit.js`):** Extracts every CSS class and ID token from `src/01-*.css` through `src/10-*.css` and verifies whole-token existence (`rg -P`) against the upstream `jellyfin-web 12.2` source tree and `@mui/material` component mappings (**0 dead selectors**).

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
