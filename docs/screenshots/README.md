# Screenshot provenance

The public gallery contains only the fresh captures and the retained image listed below. Superseded screenshots and the slideshow derived from them have been removed.

| File | Source | Viewport | Verification |
| :--- | :--- | :--- | :--- |
| [desktop-login.png](./desktop-login.png) | Live Jellyfin Web 12.4.0, captured 2026-11-17 | 1920 × 1080 | Production CSS matches the repository stylesheet byte-for-byte. |
| [mobile-login.png](./mobile-login.png) | Live Jellyfin Web 12.4.0, captured 2026-11-17 | 390 × 844, emulated touch | Same production stylesheet; responsive viewport, not physical phone testing. |
| [03-desktop-library-grid.png](./03-desktop-library-grid.png) | Retained movie library-grid capture | 1920 × 1080 | Owner explicitly confirmed this is the current image to keep on 2026-11-17. It is not a new capture. |

The live `/Branding/Css` response and committed `obsidian.css` both have SHA-256:

```text
c2edbaffea26a449a9e5cb24dfddeae981a6fd74beaf291343517f2fb8a27b8c
```

Captures use Chromium with a device scale factor of 1. The sign-in form is empty, and browser chrome, server addresses, and credentials are not included. The example server's custom branded login background is separate from Obsidian's CSS and is not installed by the theme.
