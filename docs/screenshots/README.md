# Screenshots & previews

| File | Description | Size |
| :--- | :--- | :--- |
| [03-desktop-library-grid.png](./03-desktop-library-grid.png) | Movie library grid screenshot | 1920 × 1080 |
| [desktop-login.png](./desktop-login.png) | Desktop sign-in on Jellyfin Web 12.4.0 | 1920 × 1080 |
| [mobile-login.png](./mobile-login.png) | Mobile sign-in on Jellyfin Web 12.4.0 | 390 × 844 |
| [playback-controls-preview.png](./playback-controls-preview.png) | Component preview of the floating playback dock | 1120 × 360 |
| [playback-overlays-preview.png](./playback-overlays-preview.png) | Component preview of the volume pill and Up Next card | 1024 × 400 |

## Regenerating previews and thumbnails

[`scripts/renderShowcase.js`](../../scripts/renderShowcase.js) renders the two playback component previews directly from `obsidian.css` and generates the downscaled README thumbnails under `docs/images/`.

```bash
node scripts/renderShowcase.js
```

Set `OBSIDIAN_CHROMIUM_PATH` to use an existing Chromium binary instead of Playwright's bundled one.
