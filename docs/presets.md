# ⚡ Atmospheric & Performance Presets

By default, **Obsidian** runs in **Static 120Hz Hardware-Cached Mode** (`--obs-aurora-animation: none`), delivering full spatial glassmorphism and 3-orb radial aurora lighting with zero continuous GPU animation overhead.

You can customize the atmosphere, tune performance for low-power devices, or re-theme the chromatic accent palette by appending any of the snippets below to the **very end** of your Jellyfin **Custom CSS** box (**Dashboard > General > Branding** or **User Settings > Display**).

---

## 1. Animated Aurora Preset (25s Cosmic Oscillation)
Enables continuous 3D hardware-accelerated oscillation (`obs-aurora-shift`) on the three radial aurora orbs and boosts atmospheric glow intensity.

```css
/* --- OBSIDIAN PRESET: ANIMATED AURORA --- */
:root {
  --obs-aurora-opacity: 0.65 !important;
  --obs-aurora-animation: obs-aurora-shift 25s ease-in-out infinite alternate !important;
}
```

---

## 2. Balanced Preset (Laptops on Battery & Mobile Browsers)
Reduces `backdrop-filter` blur radii, lowers aurora opacity, and disables the SVG fractal micro-grain overlay while preserving frosted glass headers and directional specular card bevels.

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

---

## 3. Lite Preset (Smart TVs, Streaming Sticks & Low-Power Hardware)
Completely disables all `backdrop-filter` calculations, removes `body::before` and `body::after` atmospheric pseudo-elements, and switches containers to high-contrast opaque obsidian surfaces for maximum frame rate on embedded TV GPUs.

```css
/* --- OBSIDIAN PRESET: LITE (MAXIMUM FPS) --- */
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
.actionSheetContent,
.skinHeader,
.MuiAppBar-root,
.mainDrawer,
.MuiDrawer-paper,
.detailPagePrimaryContainer,
.videoOsdBottom .osdControls,
.nowPlayingBar,
.sliderBubble {
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}
```

---

## 4. Custom Chromatic Accent Presets

Because all interactive highlights, focus rings, progress bars, and primary CTAs reference `:root` variables, you can re-tint Obsidian's accent palette with a few lines:

### Emerald Cyber-Glass
```css
/* --- OBSIDIAN ACCENT: EMERALD CYBER-GLASS --- */
:root {
  --obs-accent-primary: #10b981 !important;
  --obs-accent-secondary: #06b6d4 !important;
  --obs-accent-tertiary: #059669 !important;
  --obs-glass-border-hover: rgba(52, 211, 153, 0.55) !important;
  --obs-focus-ring: 0 0 0 3px rgba(16, 185, 129, 0.45) !important;
}
```

### Crimson Eclipse
```css
/* --- OBSIDIAN ACCENT: CRIMSON ECLIPSE --- */
:root {
  --obs-accent-primary: #f43f5e !important;
  --obs-accent-secondary: #fb923c !important;
  --obs-accent-tertiary: #e11d48 !important;
  --obs-glass-border-hover: rgba(251, 113, 133, 0.55) !important;
  --obs-focus-ring: 0 0 0 3px rgba(244, 63, 94, 0.45) !important;
}
```
