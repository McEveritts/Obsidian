# Presets

Obsidian uses a static aurora by default (`--obs-aurora-animation: none`) to avoid constant background repaints. Append any snippet below to the **end** of your Jellyfin **Custom CSS** (**Dashboard → Branding → Custom CSS** or **Settings → Display → Custom CSS**).

## Animated aurora

Enables a slow background animation across the three radial aurora layers.

```css
/* --- OBSIDIAN PRESET: ANIMATED AURORA --- */
:root {
  --obs-aurora-opacity: 0.65 !important;
  --obs-aurora-animation: obs-aurora-shift 25s ease-in-out infinite alternate !important;
}
```

## Balanced (laptops on battery & mobile)

Lowers `backdrop-filter` blur radii and aurora opacity, and turns off the SVG grain overlay.

```css
/* --- OBSIDIAN PRESET: BALANCED --- */
:root {
  --obs-glass-blur: 10px !important;
  --obs-glass-blur-heavy: 16px !important;
  --obs-aurora-opacity: 0.25 !important;
  --obs-aurora-animation: none !important;
  --obs-grain-display: none !important;
  --obs-card-lift: -2px !important;
}
```

## Lite (TVs, streaming sticks & low-power devices)

Disables `backdrop-filter` and the background pseudo-elements, switching surfaces to mostly opaque dark panels.

```css
/* --- OBSIDIAN PRESET: LITE --- */
:root {
  --obs-glass-blur: 0px !important;
  --obs-glass-blur-heavy: 0px !important;
  --obs-aurora-opacity: 0 !important;
  --obs-aurora-animation: none !important;
  --obs-grain-display: none !important;
  --obs-card-lift: 0px !important;
  --obs-card-bg: rgba(12, 16, 28, 0.94) !important;
  --obs-panel-bg: rgba(2, 6, 23, 0.96) !important;
  --obs-hero-bg: rgba(12, 16, 28, 0.96) !important;
}

body::before,
body::after {
  display: none !important;
}

.cardBox,
.MuiCard-root,
.dialog,
.formDialog,
.MuiDialog-paper,
.MuiPopover-paper,
.MuiMenu-paper,
.actionSheetContent,
.skinHeader,
.MuiAppBar-root,
.mainDrawer,
.MuiDrawer-paper,
.detailPagePrimaryContainer,
.detailTable,
.videoOsdBottom .osdControls,
.volumeOsd,
.iconOsd,
.upNextContainer,
.playerStats,
.subtitleSyncContainer,
.toast,
.selectionCommandsPanel,
.slideshowBottomBar,
.bookOsdRow,
#dialogToc,
.nowPlayingBar,
.sliderBubble {
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}
```

## Accent colors

Override the `:root` palette variables to change highlights, focus rings, progress bars, and primary buttons.

### Emerald

```css
/* --- OBSIDIAN ACCENT: EMERALD --- */
:root {
  --obs-accent-primary: #10b981 !important;
  --obs-accent-secondary: #06b6d4 !important;
  --obs-accent-tertiary: #059669 !important;
  --obs-indigo-500: #10b981 !important;
  --obs-indigo-400: #34d399 !important;
  --obs-indigo-300: #6ee7b7 !important;
  --obs-fuchsia-500: #06b6d4 !important;
  --obs-fuchsia-400: #22d3ee !important;
  --mui-palette-primary-main: #10b981 !important;
  --jf-palette-primary-main: #10b981 !important;
  --obs-glass-border-hover: rgba(52, 211, 153, 0.55) !important;
  --obs-focus-ring: 0 0 0 3px rgba(16, 185, 129, 0.45) !important;
}
```

### Crimson

```css
/* --- OBSIDIAN ACCENT: CRIMSON --- */
:root {
  --obs-accent-primary: #f43f5e !important;
  --obs-accent-secondary: #fb923c !important;
  --obs-accent-tertiary: #e11d48 !important;
  --obs-indigo-500: #f43f5e !important;
  --obs-indigo-400: #fb7185 !important;
  --obs-indigo-300: #fda4af !important;
  --obs-fuchsia-500: #fb923c !important;
  --obs-fuchsia-400: #fdba74 !important;
  --mui-palette-primary-main: #f43f5e !important;
  --jf-palette-primary-main: #f43f5e !important;
  --obs-glass-border-hover: rgba(251, 113, 133, 0.55) !important;
  --obs-focus-ring: 0 0 0 3px rgba(244, 63, 94, 0.45) !important;
}
```
