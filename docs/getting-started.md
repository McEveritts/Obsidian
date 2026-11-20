# Getting started

[Overview](../README.md) · [Presets](./presets.md) · [Gallery](./gallery.md)

## Install the theme

### Server-wide Custom CSS

1. Sign in to Jellyfin as an administrator.
2. Open **Dashboard → Branding → Custom CSS** (under **General** in some versions).
3. Back up anything currently in the field. Remove other theme imports first so rules don't clash.
4. Add Obsidian using either method:

   **CDN import** (paste above any other CSS rules):

   ```css
   @import url("https://cdn.jsdelivr.net/gh/McEveritts/Obsidian@main/obsidian.css");
   ```

   **Local copy:** open [`obsidian.css`](../obsidian.css), click **Raw**, and paste the whole file directly. No external font or image requests are needed.

5. Save and reload (**Ctrl + F5** or **Cmd + Shift + R** if the old styling stays cached).

Custom CSS applies to Jellyfin Web and clients that load it (including Jellyfin Media Player). Standalone native mobile and TV apps aren't affected.

### Single user / client

If your client exposes **Settings → Display → Custom CSS**, you can apply Obsidian there instead. Don't import it in both places.

### Pinning updates

- **Track `main`:** the `@main` jsDelivr URL picks up updates automatically (subject to CDN caching).
- **Pin a commit:** replace `main` in the URL with a full commit SHA from the [commit log](https://github.com/McEveritts/Obsidian/commits/main/).
- **Manual updates:** paste [`obsidian.css`](../obsidian.css) directly and replace it when you want to update.

## Tuning & presets

Append any override from [Presets](./presets.md) **after** the `@import` (or pasted stylesheet) to switch to Balanced/Lite mode on slower hardware, enable the animated background, or swap accent colors.

## Add the matching covers

Six optional 1920 × 1080 covers are included for Movies, Shows, Live TV, Collections, Music, and Playlists: [browse the cover pack](../assets/covers/README.md).

1. Open a cover and download the raw PNG.
2. In Jellyfin, open the library's **… → Edit images** menu (or **Dashboard → Libraries**).
3. Upload it as the **Primary** image, save, and refresh Home.

## Optional controller and keyboard companion

If you administer Jellyfin Web directly and use a keyboard, TV remote, or Xbox controller, [`scripts/obsidian-xbox-nav.js`](../scripts/obsidian-xbox-nav.js) fixes a few MUI popover navigation quirks:

- Moves focus into supported filter/view popovers when opened via keyboard/TV nav.
- Makes MUI view-menu items focusable and handles Enter, Space, and `GamepadA`.
- Pressing Back/B closes an open MUI popover instead of backing out of the library.
- Supports Up/Down focus movement inside desktop filter/view popovers.

### Manual install

1. Back up Jellyfin Web's `index.html`.
2. Copy [`scripts/obsidian-xbox-nav.js`](../scripts/obsidian-xbox-nav.js) next to `index.html`.
3. Add this before `</body>`:

   ```html
   <script defer="defer" src="obsidian-xbox-nav.js"></script>
   ```

4. Reload Jellyfin Web.

<details>
<summary><b>Persist across Debian/Ubuntu apt upgrades</b></summary>

On Debian/Ubuntu package installs (`/usr/share/jellyfin/web`), upgrading `jellyfin-web` overwrites `index.html`. You can re-inject the script tag automatically with a `DPkg::Post-Invoke` hook using [`scripts/ensure-obsidian-jellyfin-web.sh`](../scripts/ensure-obsidian-jellyfin-web.sh):

1. Install the companion script and helper into root-owned paths and run once:

   ```bash
   sudo install -m 0644 -o root -g root scripts/obsidian-xbox-nav.js /etc/jellyfin/obsidian-xbox-nav.js
   sudo install -m 0755 -o root -g root scripts/ensure-obsidian-jellyfin-web.sh /usr/local/sbin/ensure-obsidian-jellyfin-web
   sudo /usr/local/sbin/ensure-obsidian-jellyfin-web
   ```

2. Add the APT hook:

   ```bash
   sudo tee /etc/apt/apt.conf.d/99-obsidian-jellyfin-web >/dev/null <<'EOF'
   DPkg::Post-Invoke { "if [ -x /usr/local/sbin/ensure-obsidian-jellyfin-web ]; then /usr/local/sbin/ensure-obsidian-jellyfin-web || true; fi"; };
   EOF
   sudo chmod 0644 /etc/apt/apt.conf.d/99-obsidian-jellyfin-web
   ```

3. To update later:

   ```bash
   sudo install -m 0644 -o root -g root scripts/obsidian-xbox-nav.js /etc/jellyfin/obsidian-xbox-nav.js
   sudo /usr/local/sbin/ensure-obsidian-jellyfin-web
   ```

4. To remove completely:

   ```bash
   sudo /usr/local/sbin/ensure-obsidian-jellyfin-web --remove
   sudo rm -f /etc/apt/apt.conf.d/99-obsidian-jellyfin-web \
     /usr/local/sbin/ensure-obsidian-jellyfin-web \
     /etc/jellyfin/obsidian-xbox-nav.js
   ```

</details>

To uninstall a manual setup, remove the `<script>` tag and delete `obsidian-xbox-nav.js`.

## Troubleshooting

| Symptom | What to check |
| :--- | :--- |
| Nothing changes | Make sure the `@import` is at the very top of Custom CSS (before any other rules) and hard refresh. If jsDelivr is blocked, paste `obsidian.css` directly. |
| Screens clash | Remove other theme imports from Custom CSS and test Obsidian on its own. |
| Scrolling feels sluggish | Append the **Balanced** or **Lite** snippet from [Presets](./presets.md). |
| Native mobile/TV app looks unchanged | Only web-based clients load Custom CSS. |
| Controller nav didn't change | Confirm `obsidian-xbox-nav.js` loaded in DevTools and survived any Jellyfin upgrade. |

If something breaks on your setup, [open an issue](https://github.com/McEveritts/Obsidian/issues) with your Jellyfin Web version, client/browser, screen size, and preset.

## Uninstall

Remove the Obsidian `@import` (or pasted CSS) and any preset snippets from Custom CSS, save, and refresh. Uploaded library covers stay until you change them in Jellyfin's image editor.
