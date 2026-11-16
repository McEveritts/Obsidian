const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { before, after, test } = require('node:test');
const { chromium } = require('playwright');

const theme = fs.readFileSync(
  process.env.OBSIDIAN_STYLESHEET || path.join(__dirname, '..', 'obsidian.css'),
  'utf8'
);

const VIEWPORTS = [
  { width: 320, height: 480 },
  { width: 390, height: 844 },
  { width: 844, height: 390 },
  { width: 1656, height: 1269 },
  { width: 1920, height: 1080 },
  { width: 3840, height: 2160 }
];

const upstreamLyricsAndAudioStyles = `
  body { margin: 0; font-size: 16px; }
  .hide { display: none !important; }
  .flex { display: flex; }
  .align-items-center { align-items: center; }
  .justify-content-center { justify-content: center; }
  .paper-icon-button-light {
    position: relative; display: inline-flex; align-items: center; justify-content: center;
    box-sizing: border-box; margin: 0 0.29em; background: transparent; border: 0;
    border-radius: 50%; padding: 0.556em; color: inherit; cursor: pointer; outline: none !important;
  }
  .lyricPage {
    padding-top: 4.2em !important;
    padding-left: 0.5em !important;
    padding-right: 0.5em !important;
    display: flex;
    justify-content: center;
  }
  .lyricsContainer { display: flex; flex-direction: column; }
  .lyricsLine {
    display: inline-block; width: fit-content; margin: 0.1em; font-size: 1.875rem;
    color: inherit; min-height: 2em; transition-property: opacity; transition-duration: 150ms;
  }
  .futureLyric { opacity: 0.3; }
  .pastLyric { opacity: 0.7; }
  .dynamicLyric { cursor: pointer; }

  .nowPlayingBarInfoContainer {
    display: flex; align-items: center; height: 100%; width: 40%; overflow: hidden;
  }
  .nowPlayingBar {
    position: fixed; left: 0; right: 0; bottom: 0; z-index: 999;
    text-align: center; transition: transform 200ms ease-out; cursor: pointer;
  }
  .nowPlayingBar-hidden { transform: translate3d(0, 100%, 0); }
  .nowPlayingBarTop {
    display: flex; flex-direction: row; align-items: center; height: 4.2em;
    position: relative; justify-content: center;
  }
  .mediaButton, .nowPlayingBarUserDataButtons .btnUserItemRating {
    vertical-align: middle; margin: 0; text-align: center;
  }
  .mediaButton { font-size: 120%; }
  .nowPlayingBar .nowPlayingImage {
    background-position: center center; background-repeat: no-repeat; background-size: contain;
    height: 70%; width: 4.2em; flex-shrink: 0;
  }
  .nowPlayingBarText {
    overflow: hidden; white-space: nowrap; text-overflow: ellipsis;
    vertical-align: middle; flex-grow: 1; font-size: 92%;
  }
  [dir="ltr"] .nowPlayingBarText { text-align: left; margin-right: 1em; margin-left: 0.5em; }
  [dir="rtl"] .nowPlayingBarText { text-align: right; margin-left: 1em; margin-right: 0.5em; }
  .nowPlayingBarSecondaryText { color: rgba(255, 255, 255, 0.7); }
  .nowPlayingBarCenter {
    z-index: 2; flex-grow: 1; display: flex; align-items: center;
    justify-content: center; position: absolute;
  }
  .nowPlayingBarPositionContainer {
    position: absolute !important; left: 0; top: -0.56em; right: 0; z-index: 1;
  }
  .nowPlayingBarRight {
    position: relative; z-index: 2; display: flex; justify-content: flex-end;
    align-items: center; flex-shrink: 0; margin: 0 0.5em 0 auto;
  }
  [dir="rtl"] .nowPlayingBarRight { margin: 0 auto 0 0.5em; }
  .nowPlayingBarCurrentTime { display: inline-block; padding-left: 1.5em; }
  .nowPlayingBarUserDataButtons { display: inline-block; }
  .mdl-slider-container { height: 1.25em; position: relative; display: flex; flex-direction: row; }
  .mdl-slider-background-flex-container { width: 100%; box-sizing: border-box; top: 50%; position: absolute; padding: 0 0.54em; left: 0; }
  .mdl-slider-background-flex { background: rgba(255, 255, 255, 0.3); height: 0.2em; margin-top: -0.1em; width: 100%; display: flex; overflow: hidden; }
  .mdl-slider-background-flex-inner { position: relative; width: 100%; }
  .mdl-slider-background-lower { position: absolute; width: 45%; top: 0; bottom: 0; left: 0; background-color: #00a4dc; }
  .mdl-slider { width: 100%; appearance: none; background: transparent; margin: 0; z-index: 1; }

  @media all and (max-width: 70em) {
    .nowPlayingBarRight .nowPlayingBarUserDataButtons { display: none; }
  }
  @media all and (max-width: 66em) {
    .toggleRepeatButton { display: none !important; }
    .nowPlayingBar .btnShuffleQueue { display: none !important; }
  }
  @media all and (max-width: 80em) {
    .nowPlayingBarCenter .nowPlayingBarCurrentTime,
    .nowPlayingBarCenter .stopButton { display: none !important; }
    .nowPlayingBarInfoContainer { width: 45%; }
  }
  @media all and (max-width: 60em) {
    .nowPlayingBarRight .nowPlayingBarVolumeSliderContainer { display: none !important; }
    .nowPlayingBarInfoContainer { width: 100%; }
  }
  @media all and (max-width: 56em) {
    .nowPlayingBarCenter { display: none !important; }
  }
  @media all and (max-width: 24em) {
    .nowPlayingBar .muteButton, .nowPlayingBar .unmuteButton { display: none; }
  }
  .layout-mobile .nowPlayingBarRight button:not(.playPauseButton, .nextTrackButton) { display: none; }
  .layout-desktop .nowPlayingBarRight .playPauseButton,
  .layout-desktop .nowPlayingBarRight .nextTrackButton,
  .layout-tv .nowPlayingBarRight .playPauseButton { display: none; }

  .nowPlayingPlaylist { background-color: #101010; }
  .playlistSectionButton { background: #202020; color: rgba(255, 255, 255, 0.7); }
`;

const lyricsAndAudioFixture = `<!doctype html><html dir="ltr"><head>
<style>${upstreamLyricsAndAudioStyles}</style>
<style>${theme}</style>
</head><body class="layout-desktop">
  <div id="lyricPage" data-role="page" class="page lyricPage" data-backbutton="true">
    <div>
      <div class="lyricsContainer padded-bottom-page" dir="auto">
        <div class="lyricsLine dynamicLyric pastLyric" id="lyricPosition0" tabindex="0" data-lyrictime="0">We drifted past the velvet horizon</div>
        <div class="lyricsLine dynamicLyric" id="lyricPosition1" tabindex="0" data-lyrictime="42000">Midnight glass reflects the neon rain across SupercalifragilisticexpialidociousChromatic skies</div>
        <div class="lyricsLine dynamicLyric futureLyric" id="lyricPosition2" tabindex="0" data-lyrictime="84000">Echoes fade into the indigo tide</div>
      </div>
    </div>
  </div>

  <div id="lyricsSection" class="verticalSection-extrabottompadding detailVerticalSection lyricsContainer hide">
    <h2 class="sectionTitle">Lyrics</h2>
  </div>

  <div class="playlistSection" style="max-width: 48rem; margin: 0 auto; padding: 0 1rem;">
    <div class="playlistSectionButton flex align-items-center justify-content-center">
      <button id="togglePlaylist" class="paper-icon-button-light btnTogglePlaylist" title="Queue"><span>≡</span></button>
      <button class="paper-icon-button-light btnSavePlaylist" title="Save"><span>💾</span></button>
      <button id="toggleContextMenu" class="paper-icon-button-light btnToggleContextMenu" title="More"><span>⋮</span></button>
    </div>
    <div id="playlist" class="playlist itemsContainer vertical-list nowPlayingPlaylist">
      <div class="listItem" style="padding: 0.75rem;">1. Midnight City</div>
    </div>
  </div>

  <div class="nowPlayingBar" data-testid="audio-bar">
    <div class="nowPlayingBarTop">
      <div class="nowPlayingBarPositionContainer sliderContainer" dir="ltr">
        <div class="mdl-slider-container">
          <div class="mdl-slider-background-flex-container">
            <div class="mdl-slider-background-flex">
              <div class="mdl-slider-background-flex-inner">
                <div class="mdl-slider-background-lower" style="width: 45%;"></div>
              </div>
            </div>
          </div>
          <input type="range" is="emby-slider" min="0" max="100" value="45" class="mdl-slider slider-medium-thumb nowPlayingBarPositionSlider" />
        </div>
      </div>

      <div class="nowPlayingBarInfoContainer">
        <div class="nowPlayingImage"></div>
        <div class="nowPlayingBarText">
          <div><a href="#track">Midnight Chromatic Resonance</a></div>
          <div class="nowPlayingBarSecondaryText"><a href="#artist">M83 &amp; Carbon Ensemble</a></div>
        </div>
      </div>

      <div class="nowPlayingBarCenter" dir="ltr">
        <button is="paper-icon-button-light" class="paper-icon-button-light previousTrackButton mediaButton" title="Previous"><span>⏮</span></button>
        <button is="paper-icon-button-light" class="paper-icon-button-light playPauseButton mediaButton" title="Pause"><span>⏸</span></button>
        <button is="paper-icon-button-light" class="paper-icon-button-light stopButton mediaButton" title="Stop"><span>⏹</span></button>
        <button is="paper-icon-button-light" class="paper-icon-button-light nextTrackButton mediaButton" title="Next"><span>⏭</span></button>
        <div class="nowPlayingBarCurrentTime">02:14 / 04:58</div>
      </div>

      <div class="nowPlayingBarRight">
        <button is="paper-icon-button-light" class="paper-icon-button-light muteButton mediaButton" title="Mute"><span>🔊</span></button>
        <div class="sliderContainer nowPlayingBarVolumeSliderContainer" style="width:9em;vertical-align:middle;display:inline-flex;">
          <div class="mdl-slider-container" style="width: 100%;">
            <div class="mdl-slider-background-flex-container">
              <div class="mdl-slider-background-flex">
                <div class="mdl-slider-background-flex-inner">
                  <div class="mdl-slider-background-lower" style="width: 70%;"></div>
                </div>
              </div>
            </div>
            <input type="range" is="emby-slider" min="0" max="100" value="70" class="mdl-slider slider-medium-thumb nowPlayingBarVolumeSlider" />
          </div>
        </div>
        <button is="paper-icon-button-light" class="paper-icon-button-light btnAirPlay mediaButton" title="AirPlay"><span>📺</span></button>
        <button is="paper-icon-button-light" class="paper-icon-button-light openLyricsButton mediaButton buttonActive" title="Lyrics"><span>♪</span></button>
        <button is="paper-icon-button-light" class="paper-icon-button-light openLyricsButton mediaButton hide" data-testid="hidden-lyric-btn" title="Hidden"><span>♪</span></button>
        <button is="paper-icon-button-light" class="paper-icon-button-light toggleRepeatButton mediaButton" title="Repeat"><span>🔁</span></button>
        <button is="paper-icon-button-light" class="paper-icon-button-light btnShuffleQueue mediaButton" title="Shuffle"><span>🔀</span></button>
        <div class="nowPlayingBarUserDataButtons">
          <button is="emby-ratingbutton" class="paper-icon-button-light btnUserItemRating" title="Favorite"><span>♥</span></button>
        </div>
        <button is="paper-icon-button-light" class="paper-icon-button-light playPauseButton mediaButton" title="Mobile Pause"><span>⏸</span></button>
        <button is="paper-icon-button-light" class="paper-icon-button-light nextTrackButton mediaButton" title="Mobile Next"><span>⏭</span></button>
        <button is="paper-icon-button-light" class="paper-icon-button-light btnToggleContextMenu mediaButton" title="More"><span>⋮</span></button>
      </div>
    </div>
  </div>
</body></html>`;

const upstreamReadersStyles = `
  body { margin: 0; font-size: 16px; }
  .hide { display: none !important; }
  .dialog { margin: 0; border-radius: 0.2em; border: 0; padding: 0; }
  .dialog-fullscreen { position: fixed !important; inset: 0; margin: 0; }
  .paper-icon-button-light {
    position: relative; display: inline-flex; align-items: center; justify-content: center;
    box-sizing: border-box; margin: 0 0.29em; background: transparent; border: 0;
    border-radius: 50%; padding: 0.556em; color: inherit; cursor: pointer; outline: none !important;
  }

  /* Upstream slideshow/style.scss */
  .slideshowDialog { background: #000; }
  .slideshowSwiperContainer, .swiper-wrapper, .swiper-slide { background: #000; }
  .slideshowSwiperContainer { position: fixed; inset: 0; margin: 0 !important; color: #fff; }
  .slideshowButtonIcon { color: #fff; opacity: 0.7; }
  .btnSlideshowPrevious { left: 0.5vh; top: 45vh; z-index: 1002; position: absolute; }
  .btnSlideshowNext { right: 0.5vh; top: 45vh; z-index: 1002; position: absolute; }
  .topActionButtons { right: 0.5vh; top: 0.5vh; z-index: 1002; position: absolute; }
  .slideshowBottomBar {
    position: fixed; left: 0; bottom: 0; right: 0; background-color: rgba(0, 0, 0, 0.7);
    color: #fff; padding: 0.5%; display: flex; flex-direction: row; align-items: center; justify-content: center;
  }
  .slideshowTopBar {
    position: fixed; left: 0; top: 0; right: 0; background-color: rgba(0, 0, 0, 0.7);
    color: #fff; padding: 0.5%; display: flex; flex-direction: row; align-items: center; justify-content: flex-end;
  }

  /* Upstream BookOsd.scss & bookPlayer/style.scss */
  .bookOsd {
    position: absolute; inset: 0; z-index: 1002; display: flex;
    justify-content: space-between; pointer-events: none; flex-direction: column;
  }
  .bookOsdRow {
    display: flex; justify-content: flex-start; align-items: center; height: 5vh;
    padding: 0 0.8vw; background-color: rgba(2, 6, 23, 0.78); pointer-events: auto;
    transition: all 200ms linear; transform: translateZ(0);
  }
  .bookOsdSpacer { flex: 1; }
  .bookOsdTitle {
    font-size: 1.1rem; margin-left: 0.35rem; font-weight: 600;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  #bookPlayer {
    position: relative; height: 100%; width: 100%; overflow: auto; z-index: 100; background: #fff;
  }
  #bookPlayer .bookplayerButton { margin: 0.5vh; }
  #bookPlayerContainer {
    position: absolute; inset: 0; z-index: 1000; width: 100%; height: 100vh;
  }
  #dialogToc {
    position: fixed; top: 10%; left: 50%; transform: translateX(-50%); z-index: 2000;
    background-color: white; height: fit-content; width: fit-content; max-height: 80%; max-width: 60%;
  }
  #dialogToc .bookplayerButtonIcon { color: black; }
  #dialogToc .toc { margin: 0; padding: 30px; }
  #dialogToc .toc li { margin-bottom: 5px; list-style-type: none; font-size: 1.2rem; font-weight: bold; }
  #dialogToc .toc li ul { padding-left: 1.5rem; }
  #dialogToc .toc li ul li { font-weight: normal; }
  #dialogToc .toc li a:link { color: #000; text-decoration: none; }
  #dialogToc .toc li a:active, #dialogToc .toc li a:hover { color: #00a4dc; text-decoration: none; }

  /* Upstream comicsPlayer/style.scss & logoScreensaver/style.scss */
  #comicsPlayer { background: #fff; }
  #comicsPlayer .slideshowSwiperContainer { position: relative; height: 100vh; }
  #comicsPlayer .swiper-pagination {
    position: absolute; bottom: 8px; width: max-content; background: #fff; color: #000;
    padding: 2px 5px; left: 50%; transform: translate(-50%, 0%); text-shadow: 0 0 20px #fff;
  }
  .logoScreenSaver {
    background: #101010; position: fixed; inset: 0; z-index: 1000; text-align: center;
  }
  .logoScreenSaverImage {
    height: 120px; position: absolute; top: 50%; margin-top: -60px; margin-left: -197px;
  }
`;

const logoSvg = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="394" height="120" viewBox="0 0 394 120"><rect width="394" height="120" rx="24" fill="#6366f1"/><text x="197" y="74" text-anchor="middle" fill="#ffffff" font-size="42" font-family="sans-serif">JELLYFIN</text></svg>'
)}`;

function buildReadersFixture(activeScene = 'slideshow') {
  return `<!doctype html><html dir="ltr"><head>
  <style>${theme}</style>
  <style>${upstreamReadersStyles}</style>
  <style>${theme}</style>
  </head><body>
    ${activeScene === 'slideshow' ? `
    <div class="dialog dialog-fullscreen slideshowDialog opened" data-testid="slideshow-dialog">
      <div class="slideshowSwiperContainer">
        <div class="swiper-wrapper"><div class="swiper-slide"></div></div>
      </div>
      <button is="paper-icon-button-light" class="paper-icon-button-light autoSize btnSlideshowPrevious slideshowButton" data-testid="slideshow-prev">
        <span class="material-icons slideshowButtonIcon keyboard_arrow_left" aria-hidden="true">‹</span>
      </button>
      <button is="paper-icon-button-light" class="paper-icon-button-light autoSize btnSlideshowNext slideshowButton" data-testid="slideshow-next">
        <span class="material-icons slideshowButtonIcon keyboard_arrow_right" aria-hidden="true">›</span>
      </button>
      <div class="topActionButtons">
        <button is="paper-icon-button-light" class="paper-icon-button-light autoSize slideshowButton btnSlideshowExit" data-testid="slideshow-exit">
          <span class="material-icons slideshowButtonIcon close" aria-hidden="true">✕</span>
        </button>
      </div>
      <div class="slideshowBottomBar" data-testid="slideshow-bottom">
        <button is="paper-icon-button-light" class="paper-icon-button-light autoSize btnSlideshowPause slideshowButton"><span class="material-icons slideshowButtonIcon play_arrow">▶</span></button>
        <button is="paper-icon-button-light" class="paper-icon-button-light autoSize btnDownload slideshowButton"><span class="material-icons slideshowButtonIcon file_download">⬇</span></button>
        <button is="paper-icon-button-light" class="paper-icon-button-light autoSize btnFullscreen"><span class="material-icons slideshowButtonIcon fullscreen">⛶</span></button>
      </div>
    </div>` : ''}

    ${activeScene === 'book' ? `
    <div id="bookPlayer" class="dialog dialog-fullscreen opened" data-testid="book-player">
      <div id="bookOsdMount">
        <div class="bookOsd">
          <div class="bookOsdRow" data-testid="book-osd-top" style="padding-top: env(safe-area-inset-top);">
            <button class="paper-icon-button-light" title="Back"><span>←</span></button>
            <span class="bookOsdTitle">Dune: Chronicles of the Imperium — Special Collector's Edition</span>
          </div>
          <div class="bookOsdRow" data-testid="book-osd-bottom" style="padding-bottom: env(safe-area-inset-bottom);">
            <button class="paper-icon-button-light" title="Previous"><span>‹</span></button>
            <button class="paper-icon-button-light" title="Next"><span>›</span></button>
            <div class="bookOsdSpacer"></div>
            <button class="paper-icon-button-light" title="Table of Contents"><span>≡</span></button>
            <button class="paper-icon-button-light" title="Theme"><span>👁</span></button>
            <button class="paper-icon-button-light" title="Smaller"><span>A-</span></button>
            <button class="paper-icon-button-light" title="Larger"><span>A+</span></button>
            <button class="paper-icon-button-light" title="Fullscreen"><span>⛶</span></button>
          </div>
        </div>
      </div>
      <div id="bookPlayerContainer" class="bookPlayerContainer"></div>
    </div>
    <div id="dialogToc" class="dialog dialog-small opened" data-testid="dialog-toc">
      <div class="topRightActionButtons">
        <button is="paper-icon-button-light" class="paper-icon-button-light autoSize bookplayerButton btnBookplayerTocClose">
          <span class="material-icons bookplayerButtonIcon close" aria-hidden="true">✕</span>
        </button>
      </div>
      <ul style="background-color: #fff" class="toc">
        <li>
          <a style="color: #000" href="#ch1">Book I: Dune</a>
          <ul>
            <li><a style="color: #000" href="#ch1-1">Chapter 1 — Caladan Departure</a></li>
          </ul>
        </li>
        <li><a style="color: #000" href="#ch2">Book II: Muad'Dib</a></li>
      </ul>
    </div>` : ''}

    ${activeScene === 'comics' ? `
    <div id="comicsPlayer" class="dialog dialog-fullscreen slideshowDialog opened" data-testid="comics-player">
      <div id="bookOsdMount">
        <div class="bookOsd">
          <div class="bookOsdRow" style="opacity: 0; pointer-events: none;">
            <button class="paper-icon-button-light" title="Back"><span>←</span></button>
            <span class="bookOsdTitle">Saga Vol. 1</span>
          </div>
          <div class="bookOsdRow" data-testid="comics-hidden-osd" style="opacity: 0; pointer-events: none;">
            <button class="paper-icon-button-light" title="Previous"><span>‹</span></button>
            <button class="paper-icon-button-light" title="Next"><span>›</span></button>
          </div>
        </div>
      </div>
      <div dir="ltr" class="slideshowSwiperContainer">
        <div class="swiper-wrapper"><div class="swiper-slide"></div></div>
        <div class="swiper-pagination" data-testid="comics-pagination">12 / 48</div>
      </div>
    </div>` : ''}

    ${activeScene === 'screensaver' ? `
    <div class="logoScreenSaver" data-testid="screensaver">
      <img class="logoScreenSaverImage" src="${logoSvg}" alt="" />
    </div>` : ''}
  </body></html>`;
}

let browser;
let sharedPage;

before(async () => {
  browser = await chromium.launch({
    executablePath: process.env.OBSIDIAN_CHROMIUM_PATH || undefined,
    args: ['--no-sandbox']
  });
  sharedPage = await browser.newPage();
});

after(async () => {
  if (sharedPage) await sharedPage.close();
  if (browser) await browser.close();
});

for (const viewport of VIEWPORTS) {
  for (const direction of ['ltr', 'rtl']) {
    test(`Synced lyrics stage & audio bar at ${viewport.width}x${viewport.height} (${direction})`, async () => {
      const isMobile = viewport.width < 600;
      await sharedPage.setViewportSize(viewport);
      await sharedPage.setContent(lyricsAndAudioFixture);
      await sharedPage.evaluate(({ dir, mobile }) => {
        document.documentElement.dir = dir;
        document.body.className = mobile ? 'layout-mobile' : 'layout-desktop';
      }, { dir: direction, mobile: isMobile });

      const metrics = await sharedPage.evaluate(() => {
        const lyricPage = document.querySelector('.lyricPage');
        const lyricPageStyle = getComputedStyle(lyricPage);
        const container = document.querySelector('.lyricPage .lyricsContainer');
        const containerRect = container.getBoundingClientRect();
        const rootRem = parseFloat(getComputedStyle(document.documentElement).fontSize);

        const past = document.querySelector('#lyricPosition0');
        const active = document.querySelector('#lyricPosition1');
        const future = document.querySelector('#lyricPosition2');
        const pastStyle = getComputedStyle(past);
        const activeStyle = getComputedStyle(active);
        const futureStyle = getComputedStyle(future);

        const hiddenDetailsLyrics = getComputedStyle(document.querySelector('#lyricsSection')).display;

        const secondary = document.querySelector('.nowPlayingBarSecondaryText a');
        const primary = document.querySelector('.nowPlayingBarText a');
        const progressLower = getComputedStyle(document.querySelector('.nowPlayingBarPositionContainer .mdl-slider-background-lower'));
        const visibleAudioButtons = [...document.querySelectorAll('.nowPlayingBar .mediaButton, .nowPlayingBar .paper-icon-button-light')]
          .filter(btn => btn.checkVisibility())
          .map(btn => {
            const r = btn.getBoundingClientRect();
            const s = getComputedStyle(btn);
            return { width: r.width, height: r.height, radius: parseFloat(s.borderRadius) };
          });

        const playlistStyle = getComputedStyle(document.querySelector('.nowPlayingPlaylist'));
        const sectionBtnStyle = getComputedStyle(document.querySelector('.playlistSectionButton'));

        return {
          rootRem,
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          lyricPadLeft: parseFloat(lyricPageStyle.paddingLeft),
          lyricPadRight: parseFloat(lyricPageStyle.paddingRight),
          containerWidth: containerRect.width,
          activeBoundsRight: active.getBoundingClientRect().right,
          activeBoundsLeft: active.getBoundingClientRect().left,
          activeColor: activeStyle.color,
          activeOpacity: parseFloat(activeStyle.opacity),
          activeShadow: activeStyle.textShadow,
          activeWeight: activeStyle.fontWeight,
          activeFontSize: parseFloat(activeStyle.fontSize),
          activeLineHeightRatio: parseFloat(activeStyle.lineHeight) / parseFloat(activeStyle.fontSize),
          activeCursor: activeStyle.cursor,
          pastColor: pastStyle.color,
          pastOpacity: parseFloat(pastStyle.opacity),
          pastShadow: pastStyle.textShadow,
          futureColor: futureStyle.color,
          futureOpacity: parseFloat(futureStyle.opacity),
          futureShadow: futureStyle.textShadow,
          hiddenDetailsLyrics,
          primaryTextColor: getComputedStyle(primary).color,
          secondaryTextColor: getComputedStyle(secondary).color,
          progressBg: progressLower.backgroundImage,
          progressShadow: progressLower.boxShadow,
          hiddenLyricBtnDisplay: getComputedStyle(document.querySelector('[data-testid="hidden-lyric-btn"]')).display,
          visibleAudioButtons,
          playlistBgColor: playlistStyle.backgroundColor,
          playlistBgImage: playlistStyle.backgroundImage,
          sectionBtnBlur: sectionBtnStyle.backdropFilter,
          sectionBtnRadius: parseFloat(sectionBtnStyle.borderTopLeftRadius)
        };
      });

      assert.equal(metrics.overflow, 0, 'Lyrics page and audio dock must produce zero horizontal overflow');
      assert.ok(metrics.lyricPadLeft >= 16 && metrics.lyricPadRight >= 16, 'Safe horizontal gutters must be preserved even at 320px');
      assert.ok(metrics.containerWidth <= metrics.rootRem * 56 + 1, 'Lyrics stage column must cap at 56rem');
      assert.ok(metrics.activeBoundsLeft >= 0 && metrics.activeBoundsRight <= viewport.width, 'Long lyric tokens must wrap cleanly inside viewport');

      assert.equal(metrics.activeColor, 'rgb(255, 255, 255)');
      assert.equal(metrics.activeOpacity, 1);
      assert.notEqual(metrics.activeShadow, 'none', 'Current active lyric needs luminescent glow');
      assert.equal(metrics.activeWeight, '700');
      assert.ok(Math.abs(metrics.activeLineHeightRatio - 1.35) < 0.03);
      assert.equal(metrics.activeCursor, 'pointer');

      assert.equal(metrics.pastColor, 'rgb(148, 163, 184)', 'Past lyric must use --obs-slate-400');
      assert.ok(Math.abs(metrics.pastOpacity - 0.62) < 0.01);
      assert.equal(metrics.pastShadow, 'none');

      assert.equal(metrics.futureColor, 'rgb(100, 116, 139)', 'Future lyric must use --obs-slate-500');
      assert.ok(Math.abs(metrics.futureOpacity - 0.38) < 0.01);
      assert.equal(metrics.futureShadow, 'none');

      assert.equal(metrics.hiddenDetailsLyrics, 'none', 'Item detail hidden #lyricsSection must remain hidden');

      assert.equal(metrics.primaryTextColor, 'rgb(255, 255, 255)');
      assert.equal(metrics.secondaryTextColor, 'rgb(148, 163, 184)', 'Secondary artist/album text must use --obs-slate-400');
      assert.ok(metrics.progressBg.includes('linear-gradient'), 'Audio bar progress must render Indigo-to-Fuchsia gradient');
      assert.notEqual(metrics.progressShadow, 'none');
      assert.equal(metrics.hiddenLyricBtnDisplay, 'none');
      assert.ok(metrics.visibleAudioButtons.length >= 1);
      assert.ok(
        metrics.visibleAudioButtons.every(b => b.width >= 44 && b.height >= 44 && b.radius >= 22),
        `All visible audio dock buttons need 44px circular targets: ${JSON.stringify(metrics.visibleAudioButtons)}`
      );

      if (isMobile) {
        assert.equal(metrics.playlistBgColor, 'rgba(8, 12, 24, 0.88)');
      } else {
        assert.equal(metrics.playlistBgColor, 'rgba(0, 0, 0, 0)', 'Desktop queue view must let aurora shine through');
        assert.ok(metrics.playlistBgImage.includes('radial-gradient'));
      }
      assert.ok(metrics.sectionBtnBlur.includes('blur(16px)'));
      assert.ok(metrics.sectionBtnRadius >= 16);

      // Keyboard focus-visible on dynamicLyric and audio dock button
      await sharedPage.keyboard.press('Tab');
      const focusedLyric = await sharedPage.locator('#lyricPosition0').evaluate(el => {
        el.getAnimations().forEach(a => a.finish());
        const s = getComputedStyle(el);
        return { outlineStyle: s.outlineStyle, outlineWidth: parseFloat(s.outlineWidth) };
      });
      assert.equal(focusedLyric.outlineStyle, 'solid');
      assert.ok(focusedLyric.outlineWidth >= 2);

      const firstVisibleAudioBtn = sharedPage.locator('.nowPlayingBar .mediaButton:visible').first();
      await firstVisibleAudioBtn.focus();
      const focusedBtn = await firstVisibleAudioBtn.evaluate(el => {
        el.getAnimations().forEach(a => a.finish());
        const s = getComputedStyle(el);
        return { outlineStyle: s.outlineStyle, outlineWidth: parseFloat(s.outlineWidth), shadow: s.boxShadow };
      });
      assert.equal(focusedBtn.outlineStyle, 'solid');
      assert.ok(focusedBtn.outlineWidth >= 2);
      assert.notEqual(focusedBtn.shadow, 'none');
    });
  }
}

for (const viewport of [{ width: 320, height: 480 }, { width: 1920, height: 1080 }, { width: 3840, height: 2160 }]) {
  test(`Photo slideshow OLED canvas, frosted bottom bar & nav buttons at ${viewport.width}x${viewport.height}`, async () => {
    await sharedPage.setViewportSize(viewport);
    await sharedPage.setContent(buildReadersFixture('slideshow'));
    const metrics = await sharedPage.evaluate(() => {
      const dlg = document.querySelector('[data-testid="slideshow-dialog"]');
      const dlgStyle = getComputedStyle(dlg);
      const dlgAfter = getComputedStyle(dlg, '::after');
      const swiperStyle = getComputedStyle(document.querySelector('.slideshowSwiperContainer'));
      const bottom = document.querySelector('[data-testid="slideshow-bottom"]');
      const bottomStyle = getComputedStyle(bottom);
      const bottomRect = bottom.getBoundingClientRect();
      const prev = document.querySelector('[data-testid="slideshow-prev"]');
      const next = document.querySelector('[data-testid="slideshow-next"]');
      const prevRect = prev.getBoundingClientRect();
      const nextRect = next.getBoundingClientRect();
      const prevStyle = getComputedStyle(prev);
      const iconStyle = getComputedStyle(prev.querySelector('.slideshowButtonIcon'));

      return {
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        dlgBg: dlgStyle.backgroundColor,
        dlgRadius: parseFloat(dlgStyle.borderRadius),
        dlgBlur: dlgStyle.backdropFilter,
        dlgAfterContent: dlgAfter.content,
        swiperBg: swiperStyle.backgroundColor,
        bottomBg: bottomStyle.backgroundColor,
        bottomBlur: bottomStyle.backdropFilter,
        bottomTopBorder: bottomStyle.borderTopColor,
        bottomTransform: bottomStyle.transform,
        bottomCenterOffset: Math.abs((bottomRect.left + bottomRect.width / 2) - window.innerWidth / 2),
        prevWidth: prevRect.width,
        prevHeight: prevRect.height,
        nextWidth: nextRect.width,
        nextHeight: nextRect.height,
        prevRadius: parseFloat(prevStyle.borderRadius),
        prevBlur: prevStyle.backdropFilter,
        iconColor: iconStyle.color
      };
    });

    assert.equal(metrics.overflow, 0);
    assert.equal(metrics.dlgBg, 'rgb(0, 0, 0)', 'Slideshow dialog must be pure #000000 OLED black');
    assert.equal(metrics.swiperBg, 'rgb(0, 0, 0)');
    assert.equal(metrics.dlgRadius, 0, 'Fullscreen slideshow dialog must not inherit rounded modal corners');
    assert.equal(metrics.dlgBlur, 'none');
    assert.equal(metrics.dlgAfterContent, 'none');

    assert.equal(metrics.bottomBg, 'rgba(12, 16, 28, 0.86)');
    assert.ok(metrics.bottomBlur.includes('blur(16px)'));
    assert.equal(metrics.bottomTopBorder, 'rgba(255, 255, 255, 0.28)', 'Bottom bar must feature specular top border');
    assert.equal(metrics.bottomTransform, 'none', 'Bottom bar must center without transform so Web Animations never jump');
    assert.ok(metrics.bottomCenterOffset < 1.5, 'Bottom bar must sit centered horizontally');

    assert.ok(metrics.prevWidth >= 44 && metrics.prevHeight >= 44);
    assert.ok(metrics.nextWidth >= 44 && metrics.nextHeight >= 44);
    assert.ok(metrics.prevRadius >= 24);
    assert.ok(metrics.prevBlur.includes('blur(16px)'));
    assert.equal(metrics.iconColor, 'rgb(255, 255, 255)');

    await sharedPage.getByTestId('slideshow-prev').focus();
    const focusRing = await sharedPage.getByTestId('slideshow-prev').evaluate(el => {
      el.getAnimations().forEach(a => a.finish());
      const s = getComputedStyle(el);
      return { outlineStyle: s.outlineStyle, outlineWidth: parseFloat(s.outlineWidth) };
    });
    assert.equal(focusRing.outlineStyle, 'solid');
    assert.ok(focusRing.outlineWidth >= 2);

    // Verify .hide still hides OSD elements cleanly
    await sharedPage.getByTestId('slideshow-bottom').evaluate(el => el.classList.add('hide'));
    assert.equal(await sharedPage.getByTestId('slideshow-bottom').evaluate(el => getComputedStyle(el).display), 'none');
  });

  test(`Book reader OSD & #dialogToc dark glass override at ${viewport.width}x${viewport.height}`, async () => {
    await sharedPage.setViewportSize(viewport);
    await sharedPage.setContent(buildReadersFixture('book'));
    const metrics = await sharedPage.evaluate(() => {
      const bookPlayer = document.querySelector('#bookPlayer');
      const bookPlayerStyle = getComputedStyle(bookPlayer);
      const topRow = document.querySelector('[data-testid="book-osd-top"]');
      const bottomRow = document.querySelector('[data-testid="book-osd-bottom"]');
      const bottomRowStyle = getComputedStyle(bottomRow);
      const osdButtons = [...document.querySelectorAll('.bookOsdRow .paper-icon-button-light')].map(btn => {
        const r = btn.getBoundingClientRect();
        return { width: r.width, height: r.height };
      });

      const tocDialog = document.querySelector('#dialogToc');
      const tocDialogStyle = getComputedStyle(tocDialog);
      const tocDialogRect = tocDialog.getBoundingClientRect();
      const tocListStyle = getComputedStyle(tocDialog.querySelector('.toc'));
      const tocLink = tocDialog.querySelector('.toc li a');
      const tocLinkStyle = getComputedStyle(tocLink);
      const closeBtn = tocDialog.querySelector('.bookplayerButton');
      const closeBtnRect = closeBtn.getBoundingClientRect();
      const closeIconColor = getComputedStyle(tocDialog.querySelector('.bookplayerButtonIcon')).color;

      return {
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        bookBg: bookPlayerStyle.backgroundColor,
        bookRadius: parseFloat(bookPlayerStyle.borderRadius),
        topTitleOverflow: getComputedStyle(topRow.querySelector('.bookOsdTitle')).textOverflow,
        osdBarBg: bottomRowStyle.backgroundColor,
        osdBarBlur: bottomRowStyle.backdropFilter,
        osdButtons,
        tocBgImage: tocDialogStyle.backgroundImage,
        tocBgColor: tocDialogStyle.backgroundColor,
        tocBlur: tocDialogStyle.backdropFilter,
        tocLeft: tocDialogRect.left,
        tocRight: tocDialogRect.right,
        tocListBgColor: tocListStyle.backgroundColor,
        tocLinkColor: tocLinkStyle.color,
        closeBtnWidth: closeBtnRect.width,
        closeBtnHeight: closeBtnRect.height,
        closeIconColor
      };
    });

    assert.equal(metrics.overflow, 0, 'Book OSD and TOC must never overflow viewport');
    assert.equal(metrics.bookBg, 'rgb(0, 0, 0)');
    assert.equal(metrics.bookRadius, 0);
    assert.equal(metrics.topTitleOverflow, 'ellipsis');
    assert.equal(metrics.osdBarBg, 'rgba(12, 16, 28, 0.86)');
    assert.ok(metrics.osdBarBlur.includes('blur(16px)'));
    assert.ok(
      metrics.osdButtons.every(b => b.width >= 44 && b.height >= 44),
      `All BookOsd controls must be >= 44px: ${JSON.stringify(metrics.osdButtons)}`
    );

    assert.ok(metrics.tocBgImage.includes('linear-gradient'), '#dialogToc must use var(--obs-panel-bg) dark glass');
    assert.notEqual(metrics.tocBgColor, 'rgb(255, 255, 255)', '#dialogToc must override upstream white background');
    assert.ok(metrics.tocBlur.includes('blur(24px)'), '#dialogToc must apply heavy 24px glass blur');
    assert.ok(metrics.tocLeft >= 0 && metrics.tocRight <= viewport.width);
    assert.equal(metrics.tocListBgColor, 'rgba(0, 0, 0, 0)', 'Inline white style on .toc must be overridden');
    assert.equal(metrics.tocLinkColor, 'rgb(226, 232, 240)', 'TOC links must override black text with --obs-slate-200');
    assert.ok(metrics.closeBtnWidth >= 44 && metrics.closeBtnHeight >= 44);
    assert.equal(metrics.closeIconColor, 'rgb(226, 232, 240)');

    const firstLink = sharedPage.locator('#dialogToc .toc li a').first();
    await firstLink.hover();
    const hoverColor = await firstLink.evaluate(el => {
      el.getAnimations().forEach(a => a.finish());
      return {
        color: getComputedStyle(el).color,
        bg: getComputedStyle(el).backgroundColor
      };
    });
    assert.equal(hoverColor.color, 'rgb(255, 255, 255)', 'TOC link hover must replace upstream #00a4dc with crisp white');
    assert.equal(hoverColor.bg, 'rgba(99, 102, 241, 0.2)');

    await firstLink.focus();
    const focusStyle = await firstLink.evaluate(el => {
      el.getAnimations().forEach(a => a.finish());
      return {
        outlineStyle: getComputedStyle(el).outlineStyle,
        outlineWidth: parseFloat(getComputedStyle(el).outlineWidth)
      };
    });
    assert.equal(focusStyle.outlineStyle, 'solid');
    assert.ok(focusStyle.outlineWidth >= 2);
  });

  test(`Comics player dark glass pagination & OLED logo screensaver at ${viewport.width}x${viewport.height}`, async () => {
    await sharedPage.setViewportSize(viewport);
    await sharedPage.setContent(buildReadersFixture('comics'));
    const comicsMetrics = await sharedPage.evaluate(() => {
      const player = document.querySelector('#comicsPlayer');
      const pagination = document.querySelector('[data-testid="comics-pagination"]');
      const pagStyle = getComputedStyle(pagination);
      const pagRect = pagination.getBoundingClientRect();
      const hiddenOsd = getComputedStyle(document.querySelector('[data-testid="comics-hidden-osd"]'));

      return {
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        playerBg: getComputedStyle(player).backgroundColor,
        pagBg: pagStyle.backgroundColor,
        pagColor: pagStyle.color,
        pagBlur: pagStyle.backdropFilter,
        pagShadow: pagStyle.textShadow,
        pagRadius: parseFloat(pagStyle.borderRadius),
        pagCenterOffset: Math.abs((pagRect.left + pagRect.width / 2) - window.innerWidth / 2),
        hiddenOsdOpacity: hiddenOsd.opacity,
        hiddenOsdPointerEvents: hiddenOsd.pointerEvents
      };
    });

    assert.equal(comicsMetrics.overflow, 0);
    assert.equal(comicsMetrics.playerBg, 'rgb(0, 0, 0)', '#comicsPlayer must replace upstream #fff with #000000');
    assert.equal(comicsMetrics.pagBg, 'rgba(12, 16, 28, 0.86)', 'Pagination must replace upstream #fff with frosted dark glass');
    assert.equal(comicsMetrics.pagColor, 'rgb(255, 255, 255)', 'Pagination must replace upstream #000 text with #ffffff');
    assert.ok(comicsMetrics.pagBlur.includes('blur(16px)'));
    assert.equal(comicsMetrics.pagShadow, 'none');
    assert.ok(comicsMetrics.pagRadius >= 12);
    assert.ok(comicsMetrics.pagCenterOffset < 1.5);
    assert.equal(comicsMetrics.hiddenOsdOpacity, '0', 'React inline auto-hide opacity on BookOsd must remain intact');
    assert.equal(comicsMetrics.hiddenOsdPointerEvents, 'none');

    await sharedPage.setContent(buildReadersFixture('screensaver'));
    const saverMetrics = await sharedPage.evaluate(() => {
      const saver = document.querySelector('[data-testid="screensaver"]');
      const img = saver.querySelector('.logoScreenSaverImage');
      const imgRect = img.getBoundingClientRect();
      const imgStyle = getComputedStyle(img);
      return {
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        bg: getComputedStyle(saver).backgroundColor,
        filter: imgStyle.filter,
        left: imgRect.left,
        right: imgRect.right,
        centerOffsetX: Math.abs((imgRect.left + imgRect.width / 2) - window.innerWidth / 2)
      };
    });

    assert.equal(saverMetrics.overflow, 0);
    assert.equal(saverMetrics.bg, 'rgb(0, 0, 0)', '.logoScreenSaver must be pure #000000 OLED black');
    assert.ok(saverMetrics.filter.includes('drop-shadow'), '.logoScreenSaverImage needs luminescent drop-shadow');
    assert.ok(saverMetrics.left >= 15 && saverMetrics.right <= viewport.width - 15, 'Screensaver logo must fit inside 320px viewport');
    assert.ok(saverMetrics.centerOffsetX < 1.5);
  });
}

test('Music, lyrics, slideshow, and media readers honor prefers-reduced-motion and forced-colors', async () => {
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    forcedColors: 'active',
    reducedMotion: 'reduce'
  });
  try {
    await page.setContent(lyricsAndAudioFixture);
    await page.keyboard.press('Tab');
    const lyricsA11y = await page.evaluate(() => {
      const past = getComputedStyle(document.querySelector('#lyricPosition0'));
      const active = getComputedStyle(document.querySelector('#lyricPosition1'));
      const future = getComputedStyle(document.querySelector('#lyricPosition2'));
      const bar = getComputedStyle(document.querySelector('.nowPlayingBar'));
      const btn = getComputedStyle(document.querySelector('.nowPlayingBar .playPauseButton'));
      const progress = getComputedStyle(document.querySelector('.nowPlayingBarPositionContainer .mdl-slider-background-lower'));
      const track = getComputedStyle(document.querySelector('.nowPlayingBarPositionContainer .mdl-slider-background-flex'));
      return {
        pastOutline: past.outlineStyle,
        pastTransition: past.transitionDuration,
        activeColor: active.color,
        futureColor: future.color,
        activeShadow: active.textShadow,
        barBlur: bar.backdropFilter,
        barTransition: bar.transitionDuration,
        btnTransition: btn.transitionDuration,
        progressImage: progress.backgroundImage,
        progressBg: progress.backgroundColor,
        trackBg: track.backgroundColor
      };
    });

    assert.equal(lyricsA11y.pastOutline, 'solid');
    assert.equal(lyricsA11y.pastTransition, '0s');
    assert.notEqual(lyricsA11y.activeColor, lyricsA11y.futureColor, 'Forced colors must distinguish active lyric from dimmed lyrics');
    assert.equal(lyricsA11y.activeShadow, 'none');
    assert.equal(lyricsA11y.barBlur, 'none');
    assert.equal(lyricsA11y.barTransition, '0.001s', 'Audio bar slide lifecycle keeps 1ms transitionend compatibility');
    assert.equal(lyricsA11y.btnTransition, '0s');
    assert.equal(lyricsA11y.progressImage, 'none');
    assert.notEqual(lyricsA11y.progressBg, lyricsA11y.trackBg);

    await page.setContent(buildReadersFixture('book'));
    const tocLink = page.locator('#dialogToc .toc li a').first();
    await tocLink.focus();
    const bookA11y = await page.evaluate(() => {
      const toc = getComputedStyle(document.querySelector('#dialogToc'));
      const link = getComputedStyle(document.querySelector('#dialogToc .toc li a'));
      const osd = getComputedStyle(document.querySelector('[data-testid="book-osd-bottom"]'));
      return {
        tocBlur: toc.backdropFilter,
        tocShadow: toc.boxShadow,
        linkOutline: link.outlineStyle,
        linkTransition: link.transitionDuration,
        osdBlur: osd.backdropFilter,
        osdTransition: osd.transitionDuration
      };
    });
    assert.equal(bookA11y.tocBlur, 'none');
    assert.equal(bookA11y.tocShadow, 'none');
    assert.equal(bookA11y.linkOutline, 'solid');
    assert.equal(bookA11y.linkTransition, '0s');
    assert.equal(bookA11y.osdBlur, 'none');
    assert.equal(bookA11y.osdTransition, '0s');

    await page.setContent(buildReadersFixture('comics'));
    const comicsPag = await page.getByTestId('comics-pagination').evaluate(el => {
      const s = getComputedStyle(el);
      return { blur: s.backdropFilter, shadow: s.boxShadow, bg: s.backgroundColor, color: s.color };
    });
    assert.equal(comicsPag.blur, 'none');
    assert.equal(comicsPag.shadow, 'none');
    assert.notEqual(comicsPag.bg, comicsPag.color);

    await page.setContent(buildReadersFixture('screensaver'));
    assert.equal(
      await page.locator('.logoScreenSaverImage').evaluate(el => getComputedStyle(el).filter),
      'none'
    );
  } finally {
    await page.close();
  }
});
