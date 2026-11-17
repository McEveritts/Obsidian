# Screenshot provenance

The [gallery](../gallery.md) separates live captures, the retained library reference, and freshly rendered component previews. Superseded live screenshots and the old slideshow remain removed.

| File | Source | Viewport | Verification |
| :--- | :--- | :--- | :--- |
| [desktop-login.png](./desktop-login.png) | Live Jellyfin Web 12.4.0, captured 2026-11-17 | 1920 × 1080 | Production CSS matches the repository stylesheet byte-for-byte. |
| [mobile-login.png](./mobile-login.png) | Live Jellyfin Web 12.4.0, captured 2026-11-17 | 390 × 844, emulated touch | Same production stylesheet; responsive viewport, not physical phone testing. |
| [03-desktop-library-grid.png](./03-desktop-library-grid.png) | Retained movie library-grid capture | 1920 × 1080 | Owner explicitly confirmed this is the current image to keep on 2026-11-17. It is not a new capture. |
| [playback-controls-preview.png](./playback-controls-preview.png) | Current stylesheet applied to sample player markup | 1440 × 640 viewport, cropped to 1120 × 360 | Component preview, not a live playback screenshot. |
| [playback-overlays-preview.png](./playback-overlays-preview.png) | Current stylesheet applied to sample volume and Up Next markup | 1024 × 400 | Component preview with sample episode information. |

The live `/Branding/Css` response and committed `obsidian.css` both have SHA-256:

```text
c2edbaffea26a449a9e5cb24dfddeae981a6fd74beaf291343517f2fb8a27b8c
```

Captures use Chromium with a device scale factor of 1. The sign-in form is empty, and browser chrome, server addresses, and credentials are not included. The example server's custom branded login background is separate from Obsidian's CSS and is not installed by the theme.

## Component previews and lightweight thumbnails

[`scripts/renderShowcase.js`](../../scripts/renderShowcase.js) loads the current compiled stylesheet and renders the component previews above. The preview supplies baseline control layout, SVG icons, and sample text. Obsidian's surfaces, colors, gradients, borders, dock sizing, and responsive rules come from `obsidian.css`. Both images carry a visible **Component preview · Current CSS** label. They must not be presented as authenticated live captures.

The same script downsamples the six original [cover PNGs](../../assets/covers/README.md) to 480 × 270 thumbnails in `docs/images/covers/`, and the retained library reference to a 1280 × 720 thumbnail in `docs/images/`. The README displays these smaller images and links to the full-resolution originals. Thumbnails are derivatives, not new captures or redesigned artwork.

With development dependencies and Chromium installed:

```bash
node scripts/renderShowcase.js
```

`OBSIDIAN_CHROMIUM_PATH` can select an existing executable. No Jellyfin connection, API key, or account is needed for these offline previews. Fresh live home, detail, and player screenshots require a signed-in session; component previews do not establish playback correctness or replace live-client testing.
