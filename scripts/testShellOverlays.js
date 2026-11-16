const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { before, after, test } = require('node:test');
const { chromium } = require('playwright');

const theme = fs.readFileSync(
  process.env.OBSIDIAN_STYLESHEET || path.join(__dirname, '..', 'obsidian.css'),
  'utf8'
);

function resolveChromiumExecutable() {
  if ((process.env.TMPDIR || '').length > 60 && fs.existsSync('/tmp')) {
    process.env.TMPDIR = '/tmp';
  }
  if (process.env.OBSIDIAN_CHROMIUM_PATH) return process.env.OBSIDIAN_CHROMIUM_PATH;
  const defaultPath = chromium.executablePath();
  if (defaultPath && fs.existsSync(defaultPath)) return undefined;

  const cacheDir = path.join(process.env.HOME || '', '.cache', 'ms-playwright');
  if (cacheDir && fs.existsSync(cacheDir)) {
    const entries = fs.readdirSync(cacheDir).sort().reverse();
    for (const entry of entries) {
      if (entry.startsWith('chromium_headless_shell-')) {
        const candidate = path.join(cacheDir, entry, 'chrome-headless-shell-linux64', 'chrome-headless-shell');
        if (fs.existsSync(candidate)) return candidate;
      }
      if (entry.startsWith('chromium-')) {
        const candidate = path.join(cacheDir, entry, 'chrome-linux64', 'chrome');
        if (fs.existsSync(candidate)) return candidate;
      }
    }
  }
  return undefined;
}

const VIEWPORTS = [
  { width: 320, height: 480 },
  { width: 390, height: 844 },
  { width: 844, height: 390 },
  { width: 1656, height: 1269 },
  { width: 1920, height: 1080 },
  { width: 3840, height: 2160 }
];

/* Upstream jellyfin-web component SCSS rules (toast, multiSelect, quickConnect, remotecontrol, actionSheet, groupSelectionMenu) */
const nativeComponentStyles = `
  html, body { margin: 0; padding: 0; font-size: 16px; }
  .hide { display: none !important; }
  .flex { display: flex; }
  .align-items-center { align-items: center; }
  .justify-content-center { justify-content: center; }
  .justify-content-space-between { justify-content: space-between; }
  .padded-left { padding-left: max(3.3%, env(safe-area-inset-left)); }
  .padded-right { padding-right: max(3.3%, env(safe-area-inset-right)); }

  .emby-button {
    position: relative;
    display: inline-flex;
    align-items: center;
    box-sizing: border-box;
    margin: 0.3em;
    padding: 0.9em 1em;
    border: 0;
    border-radius: 0.2em;
    font-weight: 600;
    outline: none !important;
    transition: 0.2s;
  }
  .paper-icon-button-light {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    margin: 0 0.29em;
    background: transparent;
    color: inherit;
    padding: 0.556em;
    border: 0;
    outline: none !important;
    border-radius: 50%;
    transition: 0.2s;
  }
  .paper-icon-button-light.show-focus:focus { transform: scale(1.3); z-index: 1; }
  .paper-icon-button-light > .material-icons { font-size: 1.67em; line-height: 1; }
  .material-icons { display: inline-block; width: 1em; height: 1em; font-style: normal; }

  /* toast.scss */
  .toastContainer {
    position: fixed;
    bottom: 0;
    pointer-events: none;
    z-index: 9999999;
    padding-right: 1em;
    padding-top: 1em;
    padding-left: max(1em, env(safe-area-inset-left));
    padding-bottom: max(1em, env(safe-area-inset-bottom));
    display: flex;
    flex-direction: column;
  }
  [dir="ltr"] .toastContainer { left: 0; }
  [dir="rtl"] .toastContainer { right: 0; }
  .toast {
    min-width: 20em;
    box-sizing: border-box;
    box-shadow: 0 0.0725em 0.29em 0 rgba(0, 0, 0, 0.37);
    border-radius: 0.15em;
    transition: transform 0.3s ease-out;
    padding: 1em 1.5em;
    font-size: 110%;
    margin: 0.25em 0;
    margin-right: auto;
    pointer-events: initial;
  }
  .toast:first-child { margin-top: 0; }
  .toast:last-child { margin-bottom: 0; transform: translateY(16em); }
  .toast.toastVisible { transform: none; }
  .toast.toastHide { opacity: 0; transition: opacity 0.3s ease-out; }

  /* multiSelect.scss & emby-checkbox.scss */
  .itemSelectionPanel {
    position: absolute;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.3);
    z-index: 99998;
  }
  .selectionCommandsPanel {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    padding: 1em 0.5em;
    display: flex;
    align-items: center;
    z-index: 99999;
  }
  .itemSelectionCount { vertical-align: middle; margin: 0; }
  .multiSelectCheckboxOutline { top: 0 !important; border-radius: 0 !important; }
  .withMultiSelect { position: relative; }
  .btnSelectionPanelOptions { margin-left: auto; }
  .emby-checkbox-label {
    position: relative;
    display: inline-flex;
    box-sizing: border-box;
    width: 100%;
    margin: 0;
    padding: 0 0 0 2.4em;
    align-items: center;
    height: 2.35em;
  }
  .checkboxContainer { margin-bottom: 1.8em; display: flex; }
  .emby-checkbox { position: absolute; width: 1px; height: 1px; margin: 0; padding: 0; opacity: 0; }
  .checkboxOutline {
    position: absolute;
    top: 3px;
    left: 0;
    box-sizing: border-box;
    width: 1.83em;
    height: 1.83em;
    border: 0.14em solid currentColor;
    border-radius: 0.14em;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .card { width: 160px; }
  .cardBox { position: relative; height: 220px; margin: 0.5em; }
  .cardScalable { position: relative; height: 160px; }

  /* quickConnect.scss */
  .quickConnectError {
    border-radius: 0.2em;
    background-color: #160b0b;
    color: #f4c7c3;
    padding: 0.7em 0.5em;
    margin-bottom: 1em;
  }

  /* remotecontrol.scss */
  .nowPlayingPage { padding: 5em 0 0 0 !important; }
  .nowPlayingInfoContainer { display: flex; flex-direction: row; flex-shrink: 0; }
  .navigationSection { text-align: center; }
  .btnArrowUp { border-radius: 40% 40% 10% 10%; }
  .btnArrowLeft { border-radius: 40% 10% 10% 40%; }
  .btnArrowRight { border-radius: 10% 40% 40% 10%; }
  .btnArrowDown { border-radius: 10% 10% 40% 40%; }
  .btnOk { border-radius: 10%; }
  .nowPlayingButtonsContainer { display: flex; }
  [dir="rtl"] .nowPlayingButtonsContainer { flex-direction: row-reverse; }
  .nowPlayingPositionSliderContainer { margin: 0.2em 1em; width: 100%; }
  .nowPlayingInfoButtons { display: flex; align-items: center; flex-shrink: 0; }
  .nowPlayingInfoControls { flex-grow: 1; display: flex; flex-direction: column; justify-content: center; }
  .nowPlayingPageImageContainer { width: 16%; position: relative; flex-shrink: 0; }
  .nowPlayingPageImage { display: block; width: 100%; border-radius: 0.2em; }
  .nowPlayingSecondaryButtons { display: flex; align-items: center; flex-wrap: wrap; justify-content: flex-end; }
  @media all and (orientation: portrait) and (max-width: 43em) {
    .remoteControlContent { padding-left: 7.3% !important; padding-right: 7.3% !important; }
    .nowPlayingInfoContainer { flex-direction: column !important; align-items: center; width: 100%; }
    .nowPlayingInfoButtons { justify-content: center; font-size: 1.5em; margin-left: -0.5em; margin-right: -0.5em; }
    .nowPlayingPageImageContainer { width: 100%; margin: 0 auto 0.5em; }
    .nowPlayingInfoControls { width: 100%; }
    .paper-icon-button-light { background-color: transparent !important; }
    .nowPlayingButtonsContainer { flex-direction: column !important; }
  }
  @media all and (max-width: 63em) {
    .nowPlayingInfoButtons .btnStop { display: none !important; }
    .navigationSection .collapseContent .material-icons { font-size: 4em; }
  }

  /* actionSheet.scss & groupSelectionMenu.scss */
  .actionSheet { display: flex; justify-content: center; padding: 0; border: none; max-height: 84%; }
  .actionsheet-not-fullscreen { max-width: 90%; max-height: 90%; }
  .actionSheetContent { margin: 0 !important; padding: 0.4em 0 !important; flex-direction: column; display: flex; flex-grow: 1; overflow: hidden; position: relative; }
  .actionSheetTitle { margin: 0.6em 0 0.7em !important; padding: 0 0.75rem; }
  .actionSheetText { margin-top: 0; padding: 0 0.75rem; }
  .syncPlayGroupMenu .actionSheetText { margin-left: 0.6em; margin-top: 0; }
`;

/* Upstream _theme.scss rules that can load after custom theme styles */
const nativeDarkThemeStyles = `
  .toast {
    background: var(--jf-palette-SnackbarContent-bg, #303030);
    color: var(--jf-palette-SnackbarContent-color, rgba(255, 255, 255, 0.87));
  }
  .itemSelectionPanel {
    border: 1px solid var(--jf-palette-primary-main, #00a4dc);
  }
  .selectionCommandsPanel {
    background: var(--jf-palette-primary-main, #00a4dc);
    color: var(--jf-palette-primary-contrastText, rgba(0, 0, 0, 0.87)) !important;
  }
  .selectionCommandsPanel .paper-icon-button-light:not(:disabled) {
    color: var(--jf-palette-primary-contrastText, rgba(0, 0, 0, 0.87));
  }
  .infoBanner {
    background: var(--jf-palette-Alert-infoFilledBg, #0288d1);
    color: var(--jf-palette-Alert-infoFilledColor, #fff);
    padding: 1em;
    border-radius: 0.25em;
  }
  .button-submit {
    background: var(--jf-palette-primary-main, #00a4dc);
    color: var(--jf-palette-primary-contrastText, rgba(0, 0, 0, 0.87));
  }
`;

function buildDocument(bodyHtml, dir = 'ltr') {
  return `<!doctype html><html dir="${dir}"><head><meta charset="utf-8"><style>${nativeComponentStyles}</style><style>${theme}</style><style>${nativeDarkThemeStyles}</style></head><body>${bodyHtml}</body></html>`;
}

const toastFixtureBody = `
  <div class="toastContainer">
    <div class="toast toastVisible" data-testid="toast-short">Item added to Favorites</div>
    <div class="toast toastVisible" data-testid="toast-long">PlaybackTranscodeStreamSession_UltraLongIdentifier_4K_HDR10_HEVC_TrueHD_Atmos_2026.mkv queued</div>
    <div class="toast toastVisible toastHide" data-testid="toast-hiding">Dismissing notification</div>
    <div class="toast" data-testid="toast-entering">Entering notification</div>
  </div>
`;

const multiSelectAndBannersBody = `
  <div class="selectionCommandsPanel" data-testid="selection-bar">
    <button is="paper-icon-button-light" class="paper-icon-button-light btnCloseSelectionPanel autoSize" data-testid="btn-close-select">
      <span class="material-icons close" aria-hidden="true">✕</span>
    </button>
    <h1 class="itemSelectionCount" data-testid="selection-count">12</h1>
    <button is="paper-icon-button-light" class="paper-icon-button-light btnSelectionPanelOptions autoSize" data-testid="btn-options-select">
      <span class="material-icons more_vert" aria-hidden="true">⋮</span>
    </button>
  </div>

  <div style="padding: 5rem 1rem 1rem; display: flex; flex-wrap: wrap; gap: 0.5rem;">
    <div class="card" data-id="item-checked">
      <div class="cardBox withMultiSelect" data-testid="cardbox-checked">
        <div class="cardScalable"></div>
        <div class="cardText cardText-first">Blade Runner 2049</div>
        <div class="itemSelectionPanel" data-testid="panel-checked">
          <label class="checkboxContainer emby-checkbox-label">
            <input type="checkbox" is="emby-checkbox" data-outlineclass="multiSelectCheckboxOutline" class="chkItemSelect emby-checkbox" checked />
            <span class="checkboxLabel"></span>
            <span class="checkboxOutline multiSelectCheckboxOutline" data-testid="outline-checked">
              <span class="material-icons checkboxIcon checkboxIcon-checked check" aria-hidden="true">✓</span>
            </span>
          </label>
        </div>
      </div>
    </div>

    <div class="card" data-id="item-unchecked">
      <div class="cardBox withMultiSelect" data-testid="cardbox-unchecked">
        <div class="cardScalable"></div>
        <div class="cardText cardText-first">Dune: Part Two</div>
        <div class="itemSelectionPanel" data-testid="panel-unchecked">
          <label class="checkboxContainer emby-checkbox-label">
            <input type="checkbox" is="emby-checkbox" data-outlineclass="multiSelectCheckboxOutline" class="chkItemSelect emby-checkbox" />
            <span class="checkboxLabel"></span>
            <span class="checkboxOutline multiSelectCheckboxOutline" data-testid="outline-unchecked"></span>
          </label>
        </div>
      </div>
    </div>
  </div>

  <div style="padding: 1rem;">
    <div class="infoBanner" data-testid="info-banner">
      Metadata image settings will apply to newly scanned media in /mnt/media/uhd-remux-library/collections/2026-hdr-dolby-vision.
    </div>
    <div id="quickConnectPreferencesPage" class="page libraryPage userPreferencesPage">
      <div class="quickConnectError" data-testid="qc-error">
        Quick Connect authorization failed for code 482910. Verify the 6-digit code on your TV device and try again.
      </div>
    </div>
  </div>
`;

const posterSvg = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="300" height="300" fill="#1e293b"/><text x="150" y="160" fill="#fff" text-anchor="middle" font-size="28">POSTER</text></svg>')}`;

const remoteAndSyncPlayBody = `
  <div id="nowPlayingPage" data-role="page" class="page libraryPage nowPlayingPage noSecondaryNavPage selfBackdropPage">
    <div class="remoteControlContent padded-left padded-right">
      <div class="nowPlayingInfoContainer" data-testid="now-playing-info">
        <div class="nowPlayingPageImageContainer">
          <img class="nowPlayingPageImage nowPlayingPageImagePoster" src="${posterSvg}" alt="" />
        </div>
        <div class="nowPlayingInfoControls">
          <div class="infoContainer flex">
            <div class="nowPlayingInfoContainerMedia">
              <h2 class="nowPlayingPageTitle">Interstellar: IMAX Enhanced Remux Edition (2014)</h2>
              <div style="font-weight: bold;" class="nowPlayingSongName nowPlayingEpisode">S01E01 — Cornfield Chase Extended Suite</div>
              <div class="nowPlayingAlbum nowPlayingSeason"><a>Interstellar (Original Motion Picture Soundtrack Deluxe)</a></div>
              <div class="nowPlayingArtist nowPlayingSerie"><a>Hans Zimmer, London Contemporary Orchestra</a></div>
            </div>
            <div class="nowPlayingPageUserDataButtonsTitle"></div>
          </div>

          <div class="sliderContainer flex" dir="ltr">
            <div class="positionTime">01:14:08</div>
            <div class="nowPlayingPositionSliderContainer">
              <input type="range" min="0" max="100" value="44" class="nowPlayingPositionSlider" />
            </div>
            <div class="runtime">02:49:00</div>
          </div>

          <div class="nowPlayingButtonsContainer focuscontainer-x justify-content-space-between">
            <div class="nowPlayingInfoButtons" dir="ltr">
              <button is="paper-icon-button-light" class="paper-icon-button-light btnCommand btnRepeat repeatToggleButton autoSize"><span class="material-icons repeat">↻</span></button>
              <button is="paper-icon-button-light" class="paper-icon-button-light btnRewind btnNowPlayingRewind btnPlayStateCommand autoSize"><span class="material-icons replay_10">↺</span></button>
              <button is="paper-icon-button-light" class="paper-icon-button-light btnPreviousTrack btnPlayStateCommand autoSize"><span class="material-icons skip_previous">⏮</span></button>
              <button is="paper-icon-button-light" class="paper-icon-button-light btnPlayPause btnPlayStateCommand autoSize"><span class="material-icons pause_circle_filled">⏸</span></button>
              <button is="paper-icon-button-light" class="paper-icon-button-light btnPlayStateCommand btnStop autoSize"><span class="material-icons stop">⏹</span></button>
              <button is="paper-icon-button-light" class="paper-icon-button-light btnPlayStateCommand btnNextTrack autoSize"><span class="material-icons skip_next">⏭</span></button>
              <button is="paper-icon-button-light" class="paper-icon-button-light btnPlayStateCommand btnFastForward btnNowPlayingFastForward autoSize"><span class="material-icons forward_30">↻</span></button>
              <button is="paper-icon-button-light" class="paper-icon-button-light btnShuffleQueue autoSize"><span class="material-icons shuffle">🔀</span></button>
            </div>
            <div class="nowPlayingSecondaryButtons">
              <button is="paper-icon-button-light" class="paper-icon-button-light btnAudioTracks videoButton btnPlayStateCommand autoSize"><span class="material-icons audiotrack">♪</span></button>
              <button is="paper-icon-button-light" class="paper-icon-button-light btnSubtitles videoButton btnPlayStateCommand autoSize"><span class="material-icons closed_caption">CC</span></button>
              <button is="paper-icon-button-light" class="paper-icon-button-light btnToggleFullscreen videoButton btnPlayStateCommand autoSize"><span class="material-icons fullscreen">⛶</span></button>
            </div>
          </div>
        </div>
      </div>

      <div class="remoteControlSection">
        <div class="navigationSection" data-testid="dpad-section">
          <div is="emby-collapse" class="emby-collapse" title="Navigation">
            <div class="collapseContent">
              <div>
                <button is="paper-icon-button-light" class="paper-icon-button-light btnArrowUp btnCommand autoSize button-submit" title="Up" data-command="MoveUp">
                  <span class="material-icons keyboard_arrow_up" aria-hidden="true">▲</span>
                </button>
              </div>
              <br />
              <div>
                <button is="paper-icon-button-light" class="paper-icon-button-light btnArrowLeft btnCommand autoSize button-submit" title="Left" data-command="MoveLeft">
                  <span class="material-icons keyboard_arrow_left" aria-hidden="true">◀</span>
                </button>
                <button is="paper-icon-button-light" class="paper-icon-button-light btnOk btnCommand autoSize button-submit" title="Ok" data-command="Select">
                  <span class="material-icons keyboard_return" aria-hidden="true">⏎</span>
                </button>
                <button is="paper-icon-button-light" class="paper-icon-button-light btnArrowRight btnCommand autoSize button-submit" title="Right" data-command="MoveRight">
                  <span class="material-icons keyboard_arrow_right" aria-hidden="true">▶</span>
                </button>
              </div>
              <br />
              <div>
                <button is="paper-icon-button-light" class="paper-icon-button-light btnBack btnCommand autoSize" title="Back" data-command="Back">
                  <span class="material-icons arrow_back" aria-hidden="true">←</span>
                </button>
                <button is="paper-icon-button-light" class="paper-icon-button-light btnArrowDown btnCommand autoSize button-submit" title="Down" data-command="MoveDown">
                  <span class="material-icons keyboard_arrow_down" aria-hidden="true">▼</span>
                </button>
                <button is="paper-icon-button-light" class="paper-icon-button-light btnContextMenu btnCommand autoSize" title="Menu" data-command="ToggleContextMenu">
                  <span class="material-icons menu" aria-hidden="true">☰</span>
                </button>
              </div>
              <br />
              <div>
                <button is="paper-icon-button-light" class="paper-icon-button-light btnGoHome btnCommand autoSize" title="Home" data-command="GoHome">
                  <span class="material-icons home" aria-hidden="true">⌂</span>
                </button>
                <button is="paper-icon-button-light" class="paper-icon-button-light btnShowSearch btnCommand autoSize" title="Search" data-command="GoToSearch">
                  <span class="material-icons search" aria-hidden="true">⌕</span>
                </button>
                <button is="paper-icon-button-light" class="paper-icon-button-light bthShowSettings btnCommand autoSize" title="Settings" data-command="GoToSettings">
                  <span class="material-icons settings" aria-hidden="true">⚙</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style="margin-top: 1.5rem; display: flex; justify-content: center;">
        <div class="dialog actionsheet-not-fullscreen actionSheet syncPlayGroupMenu" data-testid="syncplay-menu">
          <div class="actionSheetContent">
            <h1 class="actionSheetTitle">Cinema Lounge SyncPlay</h1>
            <p class="actionSheetText">Donovan, Elena, Marcus, LivingRoomShieldTV, TheaterProjector4K</p>
            <div class="actionSheetScroller scrollY">
              <button is="emby-button" type="button" class="emby-button listItem listItem-button actionSheetMenuItem listItem-border" data-id="halt-playback">
                <div class="listItemBody actionsheetListItemBody">
                  <div class="listItemBodyText actionSheetItemText">Halt Group Playback</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
`;

let browser;

before(async () => {
  browser = await chromium.launch({
    executablePath: resolveChromiumExecutable(),
    args: ['--no-sandbox']
  });
});

after(async () => {
  if (browser) await browser.close();
});

for (const viewport of VIEWPORTS) {
  for (const direction of ['ltr', 'rtl']) {
    test(`Toast notifications fit and style cleanly at ${viewport.width}x${viewport.height} (${direction})`, async () => {
      const page = await browser.newPage({ viewport, hasTouch: viewport.width < 600 });
      try {
        await page.setContent(buildDocument(toastFixtureBody, direction));
        const metrics = await page.evaluate(() => {
          const shortEl = document.querySelector('[data-testid="toast-short"]');
          const longEl = document.querySelector('[data-testid="toast-long"]');
          const hidingEl = document.querySelector('[data-testid="toast-hiding"]');
          const enteringEl = document.querySelector('[data-testid="toast-entering"]');
          const containerEl = document.querySelector('.toastContainer');

          const shortStyle = getComputedStyle(shortEl);
          const hidingStyle = getComputedStyle(hidingEl);
          const enteringStyle = getComputedStyle(enteringEl);
          const containerStyle = getComputedStyle(containerEl);

          const shortRect = shortEl.getBoundingClientRect();
          const longRect = longEl.getBoundingClientRect();

          return {
            docOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            shortRect: { left: shortRect.left, right: shortRect.right, width: shortRect.width },
            longRect: { left: longRect.left, right: longRect.right, width: longRect.width },
            bg: shortStyle.backgroundColor,
            backdrop: shortStyle.backdropFilter || shortStyle.webkitBackdropFilter,
            radius: parseFloat(shortStyle.borderRadius),
            color: shortStyle.color,
            borderTop: shortStyle.borderTopColor,
            borderLeft: shortStyle.borderLeftColor,
            borderRight: shortStyle.borderRightColor,
            visibleTransform: shortStyle.transform,
            hidingOpacity: parseFloat(hidingStyle.opacity),
            enteringTransform: enteringStyle.transform,
            containerLeft: containerStyle.left,
            containerRight: containerStyle.right
          };
        });

        assert.equal(metrics.docOverflow, 0, 'Toast overlay must cause zero horizontal document overflow');
        assert.ok(
          metrics.shortRect.left >= 0 && metrics.shortRect.right <= viewport.width + 0.5,
          `Short toast outside viewport: ${JSON.stringify(metrics.shortRect)}`
        );
        assert.ok(
          metrics.longRect.left >= 0 && metrics.longRect.right <= viewport.width + 0.5,
          `Long toast outside viewport: ${JSON.stringify(metrics.longRect)}`
        );
        assert.equal(metrics.bg, 'rgba(12, 16, 28, 0.9)');
        assert.ok(metrics.backdrop.includes('blur('), 'Toast requires frosted glass backdrop-filter');
        assert.ok(metrics.radius >= 12, `Expected rounded pill/card radius >= 12px, got ${metrics.radius}`);
        assert.equal(metrics.color, 'rgb(255, 255, 255)');
        assert.notEqual(metrics.borderTop, metrics.borderLeft, 'Toast needs directional top specular edge');
        assert.equal(metrics.visibleTransform, 'none', '.toastVisible must reset transform to none');
        assert.equal(metrics.hidingOpacity, 0, '.toastHide must fade opacity to 0');
        assert.notEqual(metrics.enteringTransform, 'none', 'Unrevealed :last-child toast must retain slide-in offset');

        if (direction === 'ltr') {
          assert.equal(metrics.containerLeft, '0px');
          assert.ok(Math.abs(metrics.shortRect.left - metrics.longRect.left) < 1, 'LTR stacked toasts must align left');
        } else {
          assert.equal(metrics.containerRight, '0px');
          assert.ok(Math.abs(metrics.shortRect.right - metrics.longRect.right) < 1, 'RTL stacked toasts must align right');
        }
      } finally {
        await page.close();
      }
    });
  }
}

for (const viewport of [{ width: 320, height: 480 }, { width: 1920, height: 1080 }]) {
  for (const direction of ['ltr', 'rtl']) {
    test(`Multi-select toolbar, selection panels, infoBanner, and quickConnectError at ${viewport.width}x${viewport.height} (${direction})`, async () => {
      const page = await browser.newPage({ viewport });
      try {
        await page.setContent(buildDocument(multiSelectAndBannersBody, direction));
        const metrics = await page.evaluate(() => {
          const bar = document.querySelector('[data-testid="selection-bar"]');
          const count = document.querySelector('[data-testid="selection-count"]');
          const closeBtn = document.querySelector('[data-testid="btn-close-select"]');
          const optsBtn = document.querySelector('[data-testid="btn-options-select"]');
          const cardChecked = document.querySelector('[data-testid="cardbox-checked"]');
          const panelChecked = document.querySelector('[data-testid="panel-checked"]');
          const panelUnchecked = document.querySelector('[data-testid="panel-unchecked"]');
          const outlineChecked = document.querySelector('[data-testid="outline-checked"]');
          const outlineUnchecked = document.querySelector('[data-testid="outline-unchecked"]');
          const infoBanner = document.querySelector('[data-testid="info-banner"]');
          const qcError = document.querySelector('[data-testid="qc-error"]');

          const barStyle = getComputedStyle(bar);
          const countStyle = getComputedStyle(count);
          const closeStyle = getComputedStyle(closeBtn);
          const closeRect = closeBtn.getBoundingClientRect();
          const optsRect = optsBtn.getBoundingClientRect();
          const cardRect = cardChecked.getBoundingClientRect();
          const outlineRect = outlineChecked.getBoundingClientRect();
          const infoStyle = getComputedStyle(infoBanner);
          const qcStyle = getComputedStyle(qcError);

          return {
            docOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            barBg: barStyle.backgroundColor,
            barBackdrop: barStyle.backdropFilter || barStyle.webkitBackdropFilter,
            barBorderBottom: barStyle.borderBottomWidth,
            barShadow: barStyle.boxShadow,
            barColor: barStyle.color,
            countColor: countStyle.color,
            countRadius: parseFloat(countStyle.borderRadius),
            countBg: countStyle.backgroundImage,
            closeSize: { width: closeRect.width, height: closeRect.height },
            optsSize: { width: optsRect.width, height: optsRect.height },
            closeColor: closeStyle.color,
            closeX: closeRect.left,
            optsX: optsRect.left,
            cardRadius: parseFloat(getComputedStyle(cardChecked).borderRadius),
            panelRadius: parseFloat(getComputedStyle(panelChecked).borderRadius),
            panelCheckedBg: getComputedStyle(panelChecked).backgroundColor,
            panelUncheckedBg: getComputedStyle(panelUnchecked).backgroundColor,
            outlineRadius: parseFloat(getComputedStyle(outlineUnchecked).borderRadius),
            outlineCheckedBg: getComputedStyle(outlineChecked).backgroundImage,
            outlineInsideCard:
              outlineRect.left >= cardRect.left &&
              outlineRect.right <= cardRect.right &&
              outlineRect.top >= cardRect.top,
            infoBg: infoStyle.backgroundColor,
            infoBorderLeftWidth: infoStyle.borderLeftWidth,
            infoBorderLeftColor: infoStyle.borderLeftColor,
            infoBorderTopColor: infoStyle.borderTopColor,
            infoRadius: parseFloat(infoStyle.borderRadius),
            infoColor: infoStyle.color,
            qcBg: qcStyle.backgroundColor,
            qcBorderColor: qcStyle.borderTopColor,
            qcRadius: parseFloat(qcStyle.borderRadius),
            qcColor: qcStyle.color
          };
        });

        assert.equal(metrics.docOverflow, 0, 'Multi-select & callout surfaces must not overflow horizontally');
        assert.equal(metrics.barBg, 'rgba(12, 16, 28, 0.92)');
        assert.ok(metrics.barBackdrop.includes('blur('), 'Selection toolbar requires heavy glass blur');
        assert.equal(metrics.barBorderBottom, '1px');
        assert.notEqual(metrics.barShadow, 'none');
        assert.equal(metrics.barColor, 'rgb(255, 255, 255)');
        assert.equal(metrics.countColor, 'rgb(255, 255, 255)');
        assert.ok(metrics.countRadius >= 999, 'Selection count badge must be a full pill');
        assert.ok(metrics.countBg.includes('linear-gradient'));
        assert.ok(metrics.closeSize.width >= 44 && metrics.closeSize.height >= 44, 'Close button >= 44px');
        assert.ok(metrics.optsSize.width >= 44 && metrics.optsSize.height >= 44, 'Options button >= 44px');
        assert.equal(metrics.closeColor, 'rgb(255, 255, 255)');

        if (direction === 'ltr') {
          assert.ok(metrics.optsX > metrics.closeX, 'Options button trails on the right in LTR');
        } else {
          assert.ok(metrics.optsX < metrics.closeX, 'Options button trails on the left in RTL');
        }

        assert.equal(metrics.panelRadius, metrics.cardRadius, '.itemSelectionPanel must inherit card border-radius');
        assert.notEqual(metrics.panelCheckedBg, metrics.panelUncheckedBg, 'Selected card panel needs active Indigo tint');
        assert.ok(metrics.outlineRadius >= 4, '.multiSelectCheckboxOutline needs rounded --obs-radius-sm corners');
        assert.ok(metrics.outlineCheckedBg.includes('linear-gradient'), 'Checked multi-select outline needs Indigo-Fuchsia gradient');
        assert.ok(metrics.outlineInsideCard, 'Multi-select checkbox must sit cleanly inside card bounds');

        /* Info Banner */
        assert.equal(metrics.infoBg, 'rgba(15, 23, 42, 0.82)');
        assert.equal(metrics.infoBorderLeftWidth, '3px');
        assert.equal(metrics.infoBorderLeftColor, 'rgb(56, 189, 248)');
        assert.equal(metrics.infoBorderTopColor, 'rgba(56, 189, 248, 0.44)');
        assert.ok(metrics.infoRadius >= 12);
        assert.equal(metrics.infoColor, 'rgb(226, 232, 240)');

        /* Quick Connect Error */
        assert.equal(metrics.qcBg, 'rgba(244, 63, 94, 0.14)');
        assert.equal(metrics.qcBorderColor, 'rgba(244, 63, 94, 0.45)');
        assert.ok(metrics.qcRadius >= 12);
        assert.equal(metrics.qcColor, 'rgb(254, 205, 211)');

        /* Focus halo check on toolbar action button */
        await page.getByTestId('btn-options-select').focus();
        const focusShadow = await page.getByTestId('btn-options-select').evaluate(el => {
          el.getAnimations().forEach(a => a.finish());
          return getComputedStyle(el).boxShadow;
        });
        assert.ok(focusShadow.includes('99, 102, 241'), 'Focused selection toolbar button needs Indigo halo');
      } finally {
        await page.close();
      }
    });
  }
}

for (const viewport of VIEWPORTS) {
  for (const direction of ['ltr', 'rtl']) {
    test(`Cast Remote D-pad & SyncPlay menu at ${viewport.width}x${viewport.height} (${direction})`, async () => {
      const page = await browser.newPage({ viewport, hasTouch: viewport.width < 600 });
      try {
        await page.setContent(buildDocument(remoteAndSyncPlayBody, direction));
        const metrics = await page.evaluate(() => {
          const dpadSelectors = ['.btnArrowUp', '.btnArrowDown', '.btnArrowLeft', '.btnArrowRight', '.btnOk'];
          const dpad = Object.fromEntries(
            dpadSelectors.map(sel => {
              const el = document.querySelector(sel);
              const style = getComputedStyle(el);
              const rect = el.getBoundingClientRect();
              return [
                sel,
                {
                  left: rect.left,
                  right: rect.right,
                  top: rect.top,
                  bottom: rect.bottom,
                  width: rect.width,
                  height: rect.height,
                  bgImage: style.backgroundImage,
                  tlRadius: parseFloat(style.borderTopLeftRadius),
                  trRadius: parseFloat(style.borderTopRightRadius),
                  blRadius: parseFloat(style.borderBottomLeftRadius),
                  brRadius: parseFloat(style.borderBottomRightRadius)
                }
              ];
            })
          );

          const infoRect = document.querySelector('[data-testid="now-playing-info"]').getBoundingClientRect();
          const syncMenu = document.querySelector('[data-testid="syncplay-menu"]');
          const titleRect = syncMenu.querySelector('.actionSheetTitle').getBoundingClientRect();
          const textEl = syncMenu.querySelector('.actionSheetText');
          const textRect = textEl.getBoundingClientRect();
          const textStyle = getComputedStyle(textEl);

          return {
            docOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            infoFits: infoRect.left >= 0 && infoRect.right <= window.innerWidth + 0.5,
            dpad,
            syncFits: textRect.left >= 0 && textRect.right <= window.innerWidth + 0.5,
            syncInlineAligned:
              document.documentElement.dir === 'rtl'
                ? Math.abs(titleRect.right - textRect.right) < 1
                : Math.abs(titleRect.left - textRect.left) < 1,
            syncTextColor: textStyle.color,
            syncBorderBottom: textStyle.borderBottomWidth
          };
        });

        assert.equal(metrics.docOverflow, 0, 'Remote control & SyncPlay view must have zero horizontal overflow');
        assert.ok(metrics.infoFits, '.nowPlayingInfoContainer must wrap within viewport');
        assert.ok(metrics.syncFits, '.syncPlayGroupMenu must fit within viewport');
        assert.ok(metrics.syncInlineAligned, '.syncPlayGroupMenu .actionSheetText must align with .actionSheetTitle');
        assert.equal(metrics.syncTextColor, 'rgb(148, 163, 184)');
        assert.equal(metrics.syncBorderBottom, '1px');

        for (const [sel, box] of Object.entries(metrics.dpad)) {
          assert.ok(box.width >= 48 && box.height >= 48, `${sel} must be >= 48px (got ${box.width}x${box.height})`);
          assert.ok(box.left >= 0 && box.right <= viewport.width + 0.5, `${sel} must stay within viewport`);
          assert.ok(box.bgImage.includes('linear-gradient'), `${sel} requires tactile gradient surface`);
        }

        /* Directional bevel shapes & spatial D-pad arrangement */
        assert.ok(metrics.dpad['.btnArrowUp'].tlRadius > metrics.dpad['.btnArrowUp'].blRadius);
        assert.ok(metrics.dpad['.btnArrowDown'].blRadius > metrics.dpad['.btnArrowDown'].tlRadius);
        assert.ok(metrics.dpad['.btnArrowLeft'].tlRadius > metrics.dpad['.btnArrowLeft'].trRadius);
        assert.ok(metrics.dpad['.btnArrowRight'].trRadius > metrics.dpad['.btnArrowRight'].tlRadius);
        assert.ok(metrics.dpad['.btnOk'].bgImage.includes('217, 70, 239'), '.btnOk needs Indigo-to-Fuchsia primary gradient');

        assert.ok(metrics.dpad['.btnArrowUp'].bottom <= metrics.dpad['.btnOk'].top + 1);
        assert.ok(metrics.dpad['.btnArrowDown'].top >= metrics.dpad['.btnOk'].bottom - 1);
        assert.ok(metrics.dpad['.btnArrowLeft'].right <= metrics.dpad['.btnOk'].left + 1);
        assert.ok(metrics.dpad['.btnArrowRight'].left >= metrics.dpad['.btnOk'].right - 1);

        /* Keyboard / remote focus states on D-pad & OK button */
        for (const sel of ['.btnArrowUp', '.btnOk']) {
          const loc = page.locator(sel);
          await loc.focus();
          const focusState = await loc.evaluate(el => {
            el.getAnimations().forEach(a => a.finish());
            const s = getComputedStyle(el);
            return { outline: s.outlineStyle, width: parseFloat(s.outlineWidth), shadow: s.boxShadow, transform: s.transform };
          });
          assert.equal(focusState.outline, 'solid', `${sel} needs solid focus outline`);
          assert.ok(focusState.width >= 2, `${sel} needs >= 2px focus outline`);
          assert.notEqual(focusState.shadow, 'none', `${sel} needs glowing focus halo`);
          assert.equal(focusState.transform, 'none', `${sel} must not jump on focus`);
        }
      } finally {
        await page.close();
      }
    });
  }
}

test('Shell overlays honor prefers-reduced-motion (1ms toast transitionend + static buttons) and forced-colors', async () => {
  const reducedPage = await browser.newPage({
    viewport: { width: 390, height: 844 },
    reducedMotion: 'reduce'
  });
  try {
    await reducedPage.setContent(buildDocument(toastFixtureBody + multiSelectAndBannersBody + remoteAndSyncPlayBody));
    const motionMetrics = await reducedPage.evaluate(async () => {
      const toastEl = document.querySelector('[data-testid="toast-short"]');
      const toastDuration = getComputedStyle(toastEl).transitionDuration;

      let transitionEnded = false;
      await new Promise(resolve => {
        const timer = setTimeout(resolve, 250);
        toastEl.addEventListener(
          'transitionend',
          () => {
            transitionEnded = true;
            clearTimeout(timer);
            resolve();
          },
          { once: true }
        );
        void toastEl.offsetHeight;
        toastEl.classList.add('toastHide');
      });

      const dpadDuration = getComputedStyle(document.querySelector('.btnArrowUp')).transitionDuration;
      const okDuration = getComputedStyle(document.querySelector('.btnOk')).transitionDuration;
      const barBtnDuration = getComputedStyle(document.querySelector('[data-testid="btn-options-select"]')).transitionDuration;

      return { toastDuration, transitionEnded, dpadDuration, okDuration, barBtnDuration };
    });

    assert.equal(motionMetrics.toastDuration, '0.001s', 'Toast must use 1ms transition under prefers-reduced-motion');
    assert.ok(motionMetrics.transitionEnded, '1ms toast transition must still fire transitionend');
    assert.equal(motionMetrics.dpadDuration, '0s');
    assert.equal(motionMetrics.okDuration, '0s');
    assert.equal(motionMetrics.barBtnDuration, '0s');
  } finally {
    await reducedPage.close();
  }

  const forcedPage = await browser.newPage({
    viewport: { width: 390, height: 844 },
    forcedColors: 'active',
    reducedMotion: 'reduce'
  });
  try {
    await forcedPage.setContent(buildDocument(toastFixtureBody + multiSelectAndBannersBody + remoteAndSyncPlayBody));
    await forcedPage.locator('.btnArrowRight').focus();

    const forcedMetrics = await forcedPage.evaluate(() => {
      const inspect = sel => {
        const s = getComputedStyle(document.querySelector(sel));
        return {
          bgImage: s.backgroundImage,
          shadow: s.boxShadow,
          backdrop: s.backdropFilter || s.webkitBackdropFilter,
          borderStyle: s.borderTopStyle,
          borderWidth: parseFloat(s.borderTopWidth),
          borderLeftWidth: parseFloat(s.borderLeftWidth),
          outlineStyle: s.outlineStyle,
          outlineWidth: parseFloat(s.outlineWidth)
        };
      };

      return {
        toast: inspect('[data-testid="toast-short"]'),
        bar: inspect('[data-testid="selection-bar"]'),
        checkedOutline: inspect('[data-testid="outline-checked"]'),
        infoBanner: inspect('[data-testid="info-banner"]'),
        qcError: inspect('[data-testid="qc-error"]'),
        btnOk: inspect('.btnOk'),
        focusedArrow: inspect('.btnArrowRight')
      };
    });

    for (const [name, surface] of Object.entries(forcedMetrics)) {
      assert.equal(surface.bgImage, 'none', `${name} must drop gradients in forced-colors`);
      assert.equal(surface.shadow, 'none', `${name} must drop shadows in forced-colors`);
      assert.ok(!surface.backdrop || surface.backdrop === 'none', `${name} must drop backdrop-filter in forced-colors`);
    }

    assert.equal(forcedMetrics.toast.borderStyle, 'solid');
    assert.ok(forcedMetrics.toast.borderWidth >= 1.5);
    assert.ok(forcedMetrics.infoBanner.borderLeftWidth >= 3);
    assert.equal(forcedMetrics.qcError.borderStyle, 'solid');
    assert.ok(forcedMetrics.qcError.borderWidth >= 1.5);
    assert.equal(forcedMetrics.btnOk.borderStyle, 'solid');
    assert.equal(forcedMetrics.focusedArrow.outlineStyle, 'solid');
    assert.ok(forcedMetrics.focusedArrow.outlineWidth >= 2);
  } finally {
    await forcedPage.close();
  }
});
