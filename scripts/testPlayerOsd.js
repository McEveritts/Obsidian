const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { before, after, test } = require('node:test');

let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  ({ chromium } = require(path.join(os.homedir(), 'Obsidian', 'node_modules', 'playwright')));
}

const theme = fs.readFileSync(process.env.OBSIDIAN_STYLESHEET || path.join(__dirname, '..', 'obsidian.css'), 'utf8');
const thumbSvg = encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180"><rect width="320" height="180" fill="#1e293b"/><circle cx="160" cy="90" r="36" fill="#6366f1"/></svg>');

const nativeStyles = `
  html, body { margin: 0; padding: 0; }
  .hide { display: none !important; }
  .flex { display: flex; }
  .flex-direction-column { flex-direction: column; }
  .flex-direction-row { flex-direction: row; }
  .flex-grow { flex-grow: 1; }
  .iconOsd { backdrop-filter: blur(5px); background: rgba(0, 0, 0, 0.8); border-radius: 0.25em; color: #fff; padding: 1em; position: fixed; right: 3%; top: 7%; transition: opacity 0.2s ease-out; z-index: 100000; }
  .iconOsd-hidden { opacity: 0; }
  .iconOsdIcon { display: block; font-size: 320%; margin: 0.25em 0.7em; }
  .iconOsdProgressOuter { background: #222; border-radius: 0.25em; height: 0.35em; margin: 1.5em 0.25em 1em; }
  .iconOsdProgressInner { background: #00a4dc; border-radius: 0.25em; height: 100%; }
  .brightnessOsdProgressInner { background: #ff9800; }
  .emby-button { align-items: center; border: 0; border-radius: 0.2em; box-sizing: border-box; color: inherit; cursor: pointer; display: inline-flex; font-family: inherit; font-size: inherit; font-weight: 600; line-height: 1.35; margin: 0.3em; outline: none !important; padding: 0.9em 1em; position: relative; text-align: center; text-decoration: none; transform-origin: center; transition: 0.2s; user-select: none; vertical-align: middle; z-index: 0; }
  .emby-button.show-focus:focus { transform: scale(1.2); z-index: 1; }
  .paper-icon-button-light { align-items: center; background: transparent; border: 0; border-radius: 50%; box-sizing: border-box; color: inherit; cursor: pointer; display: inline-flex; font-family: inherit; font-size: inherit; justify-content: center; margin: 0 0.29em; outline: none !important; overflow: hidden; padding: 0.556em; position: relative; text-align: center; transform-origin: center; transition: 0.2s; user-select: none; vertical-align: middle; z-index: 0; }
  .paper-icon-button-light.show-focus:focus { transform: scale(1.3); z-index: 1; }
  .mdl-slider { align-self: center; appearance: none; background: transparent; color: #00a4dc; cursor: pointer; display: block; font-size: inherit; height: 150%; margin: 0; outline: 0; user-select: none; width: 100%; z-index: 1; }
  .mdl-slider-container { background: none; display: flex; flex-direction: row; height: 1.25em; position: relative; }
  .mdl-slider-background-flex-container { box-sizing: border-box; left: 0; padding: 0 0.54em; position: absolute; top: 50%; width: 100%; }
  .mdl-slider-background-flex { background: rgba(255, 255, 255, 0.3); border: 0; display: flex; height: 0.2em; margin-top: -0.1em; overflow: hidden; padding: 0; top: 50%; width: 100%; }
  .mdl-slider-background-flex-inner { position: relative; width: 100%; }
  .mdl-slider-background-lower { background-color: #00a4dc; bottom: 0; left: 0; position: absolute; top: 0; width: 0; }
  [dir="rtl"] .mdl-slider-background-lower { left: auto; right: 0; }
  .sliderBubbleTrack { left: 0; margin: 0 0.54em; position: absolute; right: 0; }
  .sliderBubble { align-items: center; background: #282828; color: #fff; display: flex; justify-content: center; left: 0; position: absolute; top: 0; transform: translate3d(-50%, -120%, 0); z-index: 1; }
  .sliderBubbleText { margin: 0; padding: 0.5em 0.75em; }
  .mediaInfoItem { padding: 0; }
  [dir="ltr"] .mediaInfoItem { margin: 0 1em 0 0; }
  [dir="rtl"] .mediaInfoItem { margin: 0 0 0 1em; }
  [dir="ltr"] .mediaInfoItem:last-child { margin-right: 0; }
  [dir="rtl"] .mediaInfoItem:last-child { margin-left: 0; }
  .starRatingContainer { align-items: center; display: flex; justify-content: center; vertical-align: middle; }
  .starIcon { color: #f2b01e; font-size: 1.4em; height: auto !important; margin-right: 0.125em; width: auto !important; }
  .upNextContainer { background-color: rgba(0, 0, 0, 0.7); bottom: 0; color: #fff; display: flex; flex-direction: column; padding: 1em; position: fixed; right: 0; transition: opacity 0.3s ease-out; user-select: none; width: 30em; will-change: transform, opacity; }
  [dir="ltr"] .upNextContainer { margin: 0 2em 2em 0; }
  [dir="rtl"] .upNextContainer { margin: 0 0 2em 2em; }
  .upNextDialog-hidden { opacity: 0; }
  .upNextDialog-countdownText { font-weight: 500; white-space: nowrap; }
  .upNextDialog-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: 25.5em; }
  .upNextDialog-buttons { align-content: flex-end; justify-content: end; width: 29.75em; }
  .upNextDialog-button { background: #404040; color: #fff; }
  @media (orientation: landscape) { .upNextDialog { flex-direction: row; } }
  .skip-button-container { bottom: 8rem; left: 0; pointer-events: none; position: fixed; right: 0; z-index: 10000; }
  .skip-button { align-items: center; background-color: #303030; border: none; border-radius: 0.2em; color: rgba(255, 255, 255, 0.87); cursor: pointer; display: flex; font-size: 1.2em; font-weight: bold; gap: 3px; margin-left: auto; margin-right: 6rem; padding: 12px 20px; pointer-events: auto; transition: opacity 200ms ease-out; z-index: 10000; }
  .no-transition { transition: none; }
  .skip-button-hidden { opacity: 0; }
  .playerStats { background: rgba(28, 28, 28, 0.8); border-radius: 0.3em; color: #fff; position: absolute; top: 5em; }
  [dir="ltr"] .playerStats { left: 1.5em; }
  [dir="rtl"] .playerStats { right: 1.5em; }
  .playerStats-tv { top: 4em; }
  .playerStats-content { font-size: 84%; position: relative; }
  .playerStats-content-tv { font-size: 60%; }
  .playerStats-closeButton { color: #ccc; position: absolute; right: 0.25em; top: 0.25em; z-index: 1; }
  .playerStats-stats { display: flex; flex-direction: column; max-width: 50em; overflow: hidden; }
  [dir="ltr"] .playerStats-stats { padding: 0 3em 1em 1em; }
  [dir="rtl"] .playerStats-stats { padding: 0 1em 1em 3em; }
  .playerStats-stat { display: flex; }
  [dir="ltr"] .playerStats-stat { margin-left: 1em; }
  [dir="rtl"] .playerStats-stat { margin-right: 1em; }
  .playerStats-stat-label { font-weight: 500; }
  [dir="ltr"] .playerStats-stat-label { margin: 0 0.5em 0 0; }
  [dir="rtl"] .playerStats-stat-label { margin: 0 0 0 0.5em; }
  [dir="ltr"] .playerStats-stat-header { margin: 1em 1em 0 0; }
  [dir="rtl"] .playerStats-stat-header { margin: 1em 0 0 1em; }
  .playerStats-stat-value { color: #ddd; }
  .subtitleSync { position: absolute; top: 10%; width: 100%; }
  .subtitleSyncContainer { background: rgba(28, 28, 28, 0.8); border-radius: 0.3em; color: #fff; height: 4.2em; margin-left: auto; margin-right: auto; min-width: 18em; position: relative; width: 40%; }
  .subtitleSync-closeButton { color: #ccc; position: absolute; right: 0; top: 0; z-index: 2; }
  .subtitleSyncTextField { color: white; font-size: 20px; left: 0; margin-left: 30%; margin-right: 30%; position: absolute; text-align: center; top: 0.1em; width: 40%; z-index: 2; }
  .subtitleSyncSliderContainer { border-radius: 0.3em; flex-grow: 1; height: 1.4em; margin-left: 1%; margin-right: 1%; top: 2.5em; width: 98%; z-index: 1; }
  .chapterThumbContainer { box-shadow: 0 0 1.9vh #000; flex-grow: 1; }
  .chapterBubblePosition { position: relative !important; }
  .chapterThumb { background-position: center center; background-repeat: no-repeat; background-size: contain; border: 0; height: 20vh; min-width: 20vh; }
  @media all and (orientation: portrait) { .chapterThumb { height: 30vw; min-width: 30vw; } }
  @media all and (max-height: 50em) and (orientation: landscape) { .chapterThumb { height: 30vh; min-width: 30vh; } }
  .chapterThumbTextContainer { background: none; bottom: 0; left: 0; min-width: fit-content; padding: 0.25em 0.5em; position: absolute; right: 0; user-select: none; }
  .chapterThumbText { color: #fff; margin: 0; min-width: fit-content; opacity: 1; padding: 0.25em 0; text-shadow: 0 0 25px #000, 0 0 6px #000; white-space: nowrap; }
  .chapterThumbText-dim { opacity: 0.9; }
  .subtitleappearance-fullpreview { height: 100%; left: 0; pointer-events: none; position: fixed; top: 0; transition: 0.2s; width: 100%; z-index: 1000; }
  .subtitleappearance-fullpreview-hide { opacity: 0; }
  .subtitleappearance-fullpreview-window { font-size: 170%; position: absolute; text-align: center; width: 100%; }
  .subtitleappearance-fullpreview-text { display: inline-block; max-width: 70%; }
`;

const nativeDarkThemeStyles = `
  .emby-scrollbuttons, .fab, .raised, a[data-role="button"] { color: var(--jf-palette-text-secondary, hsla(0, 0%, 100%, 0.7)); }
  .fab, .raised, a[data-role="button"] { background: var(--jf-palette-Button-inheritContainedBg, #424242); }
  .fab:hover, .raised:hover, a[data-role="button"]:hover { background: var(--jf-palette-Button-inheritContainedHoverBg, #616161); }
  .fab:focus, .raised:focus, a[data-role="button"]:focus { background: var(--jf-palette-secondary-main, #00a4dc); }
  .upNextDialog-countdownText { color: var(--jf-palette-primary-main, #00a4dc); }
  .emby-button.show-focus:focus, .navMenuOption-selected { color: var(--jf-palette-primary-contrastText, rgba(0, 0, 0, 0.87)); }
  .emby-button.show-focus:focus { background: var(--jf-palette-primary-main, #00a4dc); }
`;

const fixture = `<!doctype html><html dir="ltr"><head><style>${nativeStyles}</style><style>${theme}</style><style>${nativeDarkThemeStyles}</style></head><body>
  <div class="iconOsd volumeOsd" data-testid="volume">
    <span class="material-icons iconOsdIcon volume_up" aria-hidden="true"></span>
    <div class="iconOsdProgressOuter"><div class="iconOsdProgressInner" style="width: 50%"></div></div>
  </div>
  <div class="iconOsd brightnessOsd" data-testid="brightness">
    <span class="material-icons iconOsdIcon brightness_high" aria-hidden="true">☀</span>
    <div class="iconOsdProgressOuter"><div class="iconOsdProgressInner brightnessOsdProgressInner" style="width: 75%"></div></div>
  </div>
  <div class="iconOsd" data-testid="icon-only-osd"><span class="iconOsdIcon">★</span></div>
  <div class="skip-button-container" data-testid="skip-container">
    <button type="button" is="emby-button" class="skip-button emby-button" data-testid="skip">Skip Intro<span class="material-icons skip_next" aria-hidden="true">⏭</span></button>
  </div>
  <div class="playerStats" data-testid="playerstats">
    <div class="playerStats-content">
      <button type="button" is="paper-icon-button-light" class="playerStats-closeButton paper-icon-button-light"><span class="material-icons close" aria-hidden="true">✕</span></button>
      <div class="playerStats-stats">
        <div class="playerStats-stat playerStats-stat-header">
          <div class="playerStats-stat-label">Playback Info</div>
          <div class="playerStats-stat-value"></div>
        </div>
        <div class="playerStats-stat">
          <div class="playerStats-stat-label">Player</div>
          <div class="playerStats-stat-value">Html Video Player (Direct playing)</div>
        </div>
        <div class="playerStats-stat playerStats-stat-header">
          <div class="playerStats-stat-label">Original Media Info</div>
          <div class="playerStats-stat-value"></div>
        </div>
        <div class="playerStats-stat">
          <div class="playerStats-stat-label">Video attributes</div>
          <div class="playerStats-stat-value">Main 10, Lv 150, 24.8 Mbps, 23.98 fps</div>
        </div>
      </div>
    </div>
  </div>
  <div class="subtitleSync" data-testid="subtitlesync-wrapper">
    <div class="subtitleSyncContainer" data-testid="subtitlesync">
      <button type="button" is="paper-icon-button-light" class="subtitleSync-closeButton paper-icon-button-light"><span class="material-icons close" aria-hidden="true">✕</span></button>
      <div class="subtitleSyncTextField" contenteditable="true" spellcheck="false">+1.5s</div>
      <div class="sliderContainer subtitleSyncSliderContainer">
        <div class="mdl-slider-container">
          <input is="emby-slider" type="range" step="0.1" min="-30" max="30" value="1.5" class="subtitleSyncSlider mdl-slider" />
          <div class="mdl-slider-background-flex-container">
            <div class="mdl-slider-background-flex">
              <div class="mdl-slider-background-flex-inner">
                <div class="mdl-slider-background-lower" style="width: 52.5%"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="videoOsdBottom videoOsdBottom-maincontrols">
    <div class="osdControls">
      <div class="flex align-items-center">
        <div class="sliderContainer flex-grow">
          <div class="mdl-slider-container">
            <div class="sliderBubbleTrack">
              <div class="sliderBubble" style="left: 50%" data-testid="chapter-bubble">
                <div class="chapterThumbContainer chapterBubblePosition" data-testid="chapter-thumb">
                  <img class="chapterThumb" src="data:image/svg+xml,${thumbSvg}" alt="" />
                  <div class="chapterThumbTextContainer">
                    <div class="chapterThumbText chapterThumbText-dim">Chapter 1: Opening Sequence</div>
                    <h2 class="chapterThumbText">0:04:12</h2>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="subtitleappearance-fullpreview" data-testid="subtitle-fullpreview">
    <div class="subtitleappearance-fullpreview-window">
      <div class="subtitleappearance-fullpreview-text">Subtitle Appearance<br>These settings affect subtitles on this device.</div>
    </div>
  </div>
  <div class="upNextContainer upNextDialog" data-testid="upnext">
    <div class="flex flex-direction-column flex-grow">
      <h2 class="upNextDialog-nextVideoText" style="margin:.25em 0;">Next Episode Playing in <span class="upNextDialog-countdownText">16 Seconds</span></h2>
      <h3 class="upNextDialog-title" style="margin:.25em 0 .5em;">Reba - S3:E15 - The Shirt Off My Back</h3>
      <div class="flex flex-direction-row upNextDialog-mediainfo">
        <div class="mediaInfoItem">21m</div>
        <div class="mediaInfoItem starRatingContainer"><span class="material-icons starIcon star" aria-hidden="true">★</span>7.0</div>
        <div class="mediaInfoItem endsAt">Ends at 2:38 AM</div>
      </div>
      <div class="flex flex-direction-row upNextDialog-buttons" style="margin-top:1em;">
        <button type="button" is="emby-button" class="raised raised-mini btnStartNow upNextDialog-button emby-button">Start Now</button>
        <button type="button" is="emby-button" class="raised raised-mini btnHide upNextDialog-button emby-button">Hide</button>
      </div>
    </div>
  </div>
</body></html>`;

const VIEWPORTS = [
  { width: 320, height: 480 },
  { width: 390, height: 844 },
  { width: 844, height: 390 },
  { width: 1656, height: 1269 },
  { width: 1920, height: 1080 },
  { width: 3840, height: 2160 }
];

let browser;
let sharedPage;

before(async () => {
  browser = await chromium.launch({
    executablePath: process.env.OBSIDIAN_CHROMIUM_PATH || undefined,
    args: ['--no-sandbox']
  });
  sharedPage = await browser.newPage({ viewport: VIEWPORTS[0] });
  await sharedPage.setContent(fixture);
});

after(async () => {
  if (sharedPage) await sharedPage.close();
  if (browser) await browser.close();
});

for (const viewport of VIEWPORTS) {
  for (const direction of ['ltr', 'rtl']) {
    test(`Volume & Brightness OSDs at ${viewport.width}x${viewport.height} (${direction})`, async () => {
      await sharedPage.setViewportSize(viewport);
      await sharedPage.evaluate(value => { document.documentElement.dir = value; }, direction);

      const metrics = await sharedPage.evaluate(() => {
        const inspectOsd = testId => {
          const element = document.querySelector(`[data-testid="${testId}"]`);
          const style = getComputedStyle(element);
          const bounds = element.getBoundingClientRect();
          const icon = element.querySelector('.iconOsdIcon').getBoundingClientRect();
          const trackEl = element.querySelector('.iconOsdProgressOuter');
          const track = trackEl ? trackEl.getBoundingClientRect() : null;
          const innerEl = element.querySelector('.iconOsdProgressInner');
          return {
            width: bounds.width,
            height: bounds.height,
            top: bounds.top,
            left: bounds.left,
            right: bounds.right,
            radius: parseFloat(style.borderRadius),
            pointerEvents: style.pointerEvents,
            blur: style.backdropFilter,
            background: style.backgroundColor,
            borderTop: style.borderTopColor,
            iconColor: getComputedStyle(element.querySelector('.iconOsdIcon')).color,
            gradient: innerEl ? getComputedStyle(innerEl).backgroundImage : 'none',
            aligned: track ? Math.abs(icon.top + icon.height / 2 - track.top - track.height / 2) < 1 : true,
            separated: track ? (icon.right <= track.left || track.right <= icon.left) : true,
            trackWidth: track ? track.width : 0
          };
        };
        return {
          rootFontSize: parseFloat(getComputedStyle(document.documentElement).fontSize),
          docOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          volume: inspectOsd('volume'),
          brightness: inspectOsd('brightness'),
          iconOnly: inspectOsd('icon-only-osd')
        };
      });

      assert.equal(metrics.docOverflow, 0, 'Overlays must never cause horizontal document overflow');
      for (const [label, popup] of [['Volume', metrics.volume], ['Brightness', metrics.brightness]]) {
        assert.ok(popup.height <= metrics.rootFontSize * 3.5, `${label} feedback must be a compact single row`);
        assert.ok(popup.width >= metrics.rootFontSize * 14 && popup.width <= metrics.rootFontSize * 16, `${label} pill must follow theme text scaling`);
        assert.ok(popup.radius >= popup.height / 2 - 1, `${label} popup needs pill corners`);
        assert.ok(popup.top >= 15 && popup.left >= 15 && popup.right <= viewport.width - 15, `${label} popup must respect viewport gutters`);
        assert.ok(popup.aligned && popup.separated && popup.trackWidth > 100, `${label} icon and meter must share a row without overlap`);
        assert.equal(popup.pointerEvents, 'none', `${label} feedback must not intercept playback clicks`);
        assert.equal(popup.background, 'rgba(12, 16, 28, 0.86)');
        assert.equal(popup.borderTop, 'rgba(255, 255, 255, 0.28)');
        assert.ok(popup.blur.includes('blur(16px)'));
        assert.ok(popup.gradient.includes('linear-gradient'));
      }
      assert.notEqual(metrics.brightness.gradient, metrics.volume.gradient, 'Brightness meter must use warm amber gradient distinct from volume');
      assert.equal(metrics.brightness.iconColor, 'rgb(251, 191, 36)', 'Brightness icon must use warm amber accent');
      assert.equal(metrics.iconOnly.pointerEvents, 'none');
      assert.ok(metrics.iconOnly.radius >= metrics.iconOnly.height / 2 - 1);
      assert.ok(metrics.iconOnly.width < metrics.brightness.width, 'Icon-only OSD must hug its icon');
    });
  }
}

test('Native volume & brightness updates and lifecycles remain intact', async () => {
  const page = await browser.newPage();
  try {
    await page.setContent(fixture);
    for (const testId of ['volume', 'brightness']) {
      for (const pct of [0, 1, 50, 100]) {
        const ratio = await page.getByTestId(testId).evaluate((element, value) => {
          const meter = element.querySelector('.iconOsdProgressInner');
          meter.style.width = `${value}%`;
          return meter.getBoundingClientRect().width / meter.parentElement.getBoundingClientRect().width;
        }, pct);
        assert.ok(Math.abs(ratio - pct / 100) < 0.01, `The native ${pct}% ${testId} width must remain accurate`);
      }
    }
    const icon = page.locator('.volumeOsd .iconOsdIcon');
    await icon.evaluate(element => { element.classList.replace('volume_up', 'volume_off'); });
    assert.equal(await icon.getAttribute('class'), 'material-icons iconOsdIcon volume_off');
    assert.equal(await icon.evaluate(element => getComputedStyle(element).fontSize), '24px');
  } finally {
    await page.close();
  }
});

for (const reducedMotion of ['no-preference', 'reduce']) {
  test(`Native volume & brightness OSD lifecycle with ${reducedMotion} motion`, async () => {
    const page = await browser.newPage({ reducedMotion });
    try {
      await page.setContent(fixture);
      for (const testId of ['volume', 'brightness']) {
        const popup = page.getByTestId(testId);
        const dismissed = await popup.evaluate(async element => {
          await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
          return new Promise(resolve => {
            element.addEventListener('transitionend', () => {
              element.classList.add('hide');
              resolve({ display: getComputedStyle(element).display, opacity: getComputedStyle(element).opacity });
            }, { once: true });
            element.classList.add('iconOsd-hidden');
          });
        });
        assert.deepEqual(dismissed, { display: 'none', opacity: '0' }, `${testId} opacity transition must finish and hide popup`);
        assert.equal(await popup.evaluate(element => element.getBoundingClientRect().width), 0);
        await popup.evaluate(element => { element.classList.remove('hide', 'iconOsd-hidden'); });
        await page.waitForFunction(id => getComputedStyle(document.querySelector(`[data-testid="${id}"]`)).opacity === '1', testId);
        assert.equal(await popup.evaluate(element => getComputedStyle(element).display), 'flex');
        if (reducedMotion === 'reduce') {
          assert.equal(await popup.evaluate(element => getComputedStyle(element).transitionDuration), '0.001s');
        }
      }
    } finally {
      await page.close();
    }
  });
}

for (const viewport of VIEWPORTS) {
  for (const direction of ['ltr', 'rtl']) {
    test(`Up Next dialog at ${viewport.width}x${viewport.height} (${direction})`, async () => {
      await sharedPage.setViewportSize(viewport);
      await sharedPage.evaluate(value => { document.documentElement.dir = value; }, direction);

      const metrics = await sharedPage.getByTestId('upnext').evaluate(element => {
        const textBox = node => {
          const range = document.createRange();
          range.selectNodeContents(node);
          return range.getBoundingClientRect();
        };
        const style = getComputedStyle(element);
        const bounds = element.getBoundingClientRect();
        const headerStyle = getComputedStyle(element.querySelector('.upNextDialog-nextVideoText'));
        const countdown = element.querySelector('.upNextDialog-countdownText');
        const countdownStyle = getComputedStyle(countdown);
        const title = element.querySelector('.upNextDialog-title');
        const titleStyle = getComputedStyle(title);
        const pills = [...element.querySelectorAll('.upNextDialog-mediainfo .mediaInfoItem')].map(p => p.getBoundingClientRect());
        const startBtn = element.querySelector('.btnStartNow');
        const hideBtn = element.querySelector('.btnHide');
        const startRect = startBtn.getBoundingClientRect();
        const hideRect = hideBtn.getBoundingClientRect();
        const startText = textBox(startBtn);
        const hideText = textBox(hideBtn);
        const startStyle = getComputedStyle(startBtn);
        const hideStyle = getComputedStyle(hideBtn);
        return {
          rootFontSize: parseFloat(getComputedStyle(document.documentElement).fontSize),
          docOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          left: bounds.left,
          right: bounds.right,
          bottom: bounds.bottom,
          background: style.backgroundColor,
          blur: style.backdropFilter,
          radius: parseFloat(style.borderRadius),
          borderTop: style.borderTopColor,
          rimContent: getComputedStyle(element, '::after').content,
          headerSize: parseFloat(headerStyle.fontSize),
          titleSize: parseFloat(titleStyle.fontSize),
          titleRight: title.getBoundingClientRect().right,
          titleLeft: title.getBoundingClientRect().left,
          countdownTabular: countdownStyle.fontVariantNumeric,
          countdownRadius: parseFloat(countdownStyle.borderRadius),
          countdownGradient: countdownStyle.backgroundImage,
          pillHeights: pills.map(p => p.height),
          pillsInside: pills.every(p => p.left >= bounds.left && p.right <= bounds.right),
          startHeight: startRect.height,
          hideHeight: hideRect.height,
          startRadius: parseFloat(startStyle.borderRadius),
          hideRadius: parseFloat(hideStyle.borderRadius),
          startGradient: startStyle.backgroundImage,
          startColor: startStyle.color,
          hideBg: hideStyle.backgroundColor,
          startCenteredY: Math.abs((startText.top + startText.height / 2) - (startRect.top + startRect.height / 2)),
          hideCenteredY: Math.abs((hideText.top + hideText.height / 2) - (hideRect.top + hideRect.height / 2)),
          startCenteredX: Math.abs((startText.left + startText.width / 2) - (startRect.left + startRect.width / 2)),
          hideCenteredX: Math.abs((hideText.left + hideText.width / 2) - (hideRect.left + hideRect.width / 2)),
          buttonsSeparated: startRect.right <= hideRect.left + 0.5 || hideRect.right <= startRect.left + 0.5 || startRect.bottom <= hideRect.top + 0.5 || hideRect.bottom <= startRect.top + 0.5,
          buttonsInside: startRect.left >= bounds.left && startRect.right <= bounds.right && hideRect.left >= bounds.left && hideRect.right <= bounds.right,
          startLeft: startRect.left,
          hideLeft: hideRect.left
        };
      });

      assert.equal(metrics.docOverflow, 0, 'Up Next dialog must not cause horizontal document overflow');
      assert.ok(metrics.left >= 15 && metrics.right <= viewport.width - 15 && metrics.bottom <= viewport.height - 11, 'Up Next dialog must respect viewport gutters');
      if (viewport.width >= 900) {
        if (direction === 'ltr') {
          assert.ok(metrics.left > viewport.width - metrics.right, 'LTR Up Next dialog must anchor to the right');
        } else {
          assert.ok(metrics.left < viewport.width - metrics.right, 'RTL Up Next dialog must anchor to the left');
        }
      }
      assert.equal(metrics.background, 'rgba(12, 16, 28, 0.88)');
      assert.ok(metrics.blur.includes('blur(24px)'));
      assert.ok(metrics.radius >= 14);
      assert.equal(metrics.borderTop, 'rgba(255, 255, 255, 0.28)');
      assert.notEqual(metrics.rimContent, 'none');
      assert.ok(metrics.titleSize > metrics.headerSize);
      assert.ok(metrics.titleLeft >= metrics.left && metrics.titleRight <= metrics.right);
      assert.ok(metrics.countdownTabular.includes('tabular-nums'));
      assert.ok(metrics.countdownRadius >= 999);
      assert.ok(metrics.countdownGradient.includes('linear-gradient'));
      assert.ok(metrics.pillsInside);
      assert.ok(Math.max(...metrics.pillHeights) - Math.min(...metrics.pillHeights) <= 2);
      assert.ok(metrics.startHeight >= 44 && metrics.hideHeight >= 44);
      assert.ok(metrics.startHeight <= metrics.rootFontSize * 3.1);
      assert.ok(metrics.startRadius >= metrics.startHeight / 2 - 1 && metrics.hideRadius >= metrics.hideHeight / 2 - 1);
      assert.ok(metrics.startGradient.includes('linear-gradient'));
      assert.equal(metrics.startColor, 'rgb(255, 255, 255)');
      assert.equal(metrics.hideBg, 'rgba(255, 255, 255, 0.08)');
      assert.ok(metrics.startCenteredY <= 2 && metrics.hideCenteredY <= 2 && metrics.startCenteredX <= 2 && metrics.hideCenteredX <= 2);
      assert.ok(metrics.buttonsSeparated && metrics.buttonsInside);
      if (direction === 'ltr' && viewport.width >= 480) {
        assert.ok(metrics.startLeft < metrics.hideLeft);
      } else if (direction === 'rtl' && viewport.width >= 480) {
        assert.ok(metrics.startLeft > metrics.hideLeft);
      }
    });
  }
}

for (const viewport of VIEWPORTS) {
  for (const direction of ['ltr', 'rtl']) {
    test(`Skip button, Player Stats, Subtitle Sync & Chapter Preview at ${viewport.width}x${viewport.height} (${direction})`, async () => {
      await sharedPage.setViewportSize(viewport);
      await sharedPage.evaluate(value => { document.documentElement.dir = value; }, direction);

      const m = await sharedPage.evaluate(() => {
        const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
        const docOverflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;

        // 1. Skip button
        const skipContainer = document.querySelector('[data-testid="skip-container"]');
        const skipBtn = document.querySelector('[data-testid="skip"]');
        const skipStyle = getComputedStyle(skipBtn);
        const skipRect = skipBtn.getBoundingClientRect();

        // 2. Player Stats
        const stats = document.querySelector('[data-testid="playerstats"]');
        const statsStyle = getComputedStyle(stats);
        const statsRect = stats.getBoundingClientRect();
        const statsClose = stats.querySelector('.playerStats-closeButton');
        const statsCloseRect = statsClose.getBoundingClientRect();
        const headerLabel = stats.querySelector('.playerStats-stat-header .playerStats-stat-label');
        const headerLabelStyle = getComputedStyle(headerLabel);
        const regularLabel = stats.querySelector('.playerStats-stat:not(.playerStats-stat-header) .playerStats-stat-label');
        const regularLabelStyle = getComputedStyle(regularLabel);
        const statValue = stats.querySelector('.playerStats-stat:not(.playerStats-stat-header) .playerStats-stat-value');
        const statValueStyle = getComputedStyle(statValue);
        const statRows = [...stats.querySelectorAll('.playerStats-stat')].map(r => r.getBoundingClientRect());
        const statsCloseOverlap = statRows.some(r =>
          !(statsCloseRect.right <= r.left + 0.5 || statsCloseRect.left >= r.right - 0.5 || statsCloseRect.bottom <= r.top + 0.5 || statsCloseRect.top >= r.bottom - 0.5)
        );

        // 3. Subtitle Sync
        const syncWrapper = document.querySelector('[data-testid="subtitlesync-wrapper"]');
        const syncCard = document.querySelector('[data-testid="subtitlesync"]');
        const syncStyle = getComputedStyle(syncCard);
        const syncRect = syncCard.getBoundingClientRect();
        const syncClose = syncCard.querySelector('.subtitleSync-closeButton');
        const syncCloseRect = syncClose.getBoundingClientRect();
        const syncText = syncCard.querySelector('.subtitleSyncTextField');
        const syncTextStyle = getComputedStyle(syncText);
        const syncTextRect = syncText.getBoundingClientRect();
        const syncSlider = syncCard.querySelector('.subtitleSyncSliderContainer');
        const syncSliderRect = syncSlider.getBoundingClientRect();
        const syncTrackGradient = getComputedStyle(syncCard.querySelector('.mdl-slider-background-lower')).backgroundImage;

        // 4. Chapter thumb & Subtitle fullpreview
        const chapter = document.querySelector('[data-testid="chapter-thumb"]');
        const chapterStyle = getComputedStyle(chapter);
        const chapterRect = chapter.getBoundingClientRect();
        const chapterScrim = getComputedStyle(chapter.querySelector('.chapterThumbTextContainer')).backgroundImage;
        const chapterTimeStyle = getComputedStyle(chapter.querySelector('h2.chapterThumbText'));
        const chapterDimStyle = getComputedStyle(chapter.querySelector('.chapterThumbText-dim'));

        const subPreview = document.querySelector('[data-testid="subtitle-fullpreview"]');
        const subText = subPreview.querySelector('.subtitleappearance-fullpreview-text');
        const subTextRect = subText.getBoundingClientRect();

        return {
          rootFontSize,
          docOverflow,
          skip: {
            containerPe: getComputedStyle(skipContainer).pointerEvents,
            pe: skipStyle.pointerEvents,
            left: skipRect.left,
            right: skipRect.right,
            top: skipRect.top,
            bottom: skipRect.bottom,
            height: skipRect.height,
            radius: parseFloat(skipStyle.borderRadius),
            bg: skipStyle.backgroundColor,
            gradient: skipStyle.backgroundImage,
            blur: skipStyle.backdropFilter,
            color: skipStyle.color
          },
          stats: {
            left: statsRect.left,
            right: statsRect.right,
            top: statsRect.top,
            bottom: statsRect.bottom,
            bg: statsStyle.backgroundColor,
            blur: statsStyle.backdropFilter,
            borderTop: statsStyle.borderTopColor,
            radius: parseFloat(statsStyle.borderRadius),
            overflowY: statsStyle.overflowY,
            maxHeight: parseFloat(statsStyle.maxHeight),
            closeW: statsCloseRect.width,
            closeH: statsCloseRect.height,
            closeLeft: statsCloseRect.left,
            closeRight: statsCloseRect.right,
            closeOverlap: statsCloseOverlap,
            headerTransform: headerLabelStyle.textTransform,
            headerColor: headerLabelStyle.color,
            labelColor: regularLabelStyle.color,
            valueFont: statValueStyle.fontFamily,
            valueTabular: statValueStyle.fontVariantNumeric
          },
          sync: {
            wrapperPe: getComputedStyle(syncWrapper).pointerEvents,
            pe: syncStyle.pointerEvents,
            left: syncRect.left,
            right: syncRect.right,
            width: syncRect.width,
            bg: syncStyle.backgroundColor,
            blur: syncStyle.backdropFilter,
            borderTop: syncStyle.borderTopColor,
            radius: parseFloat(syncStyle.borderRadius),
            closeW: syncCloseRect.width,
            closeH: syncCloseRect.height,
            closeLeft: syncCloseRect.left,
            closeRight: syncCloseRect.right,
            textLeft: syncTextRect.left,
            textRight: syncTextRect.right,
            textBottom: syncTextRect.bottom,
            textCenterOffset: Math.abs((syncTextRect.left + syncTextRect.width / 2) - (syncRect.left + syncRect.width / 2)),
            textFont: syncTextStyle.fontFamily,
            textTabular: syncTextStyle.fontVariantNumeric,
            sliderTop: syncSliderRect.top,
            sliderHeight: syncSliderRect.height,
            sliderInside: syncSliderRect.left >= syncRect.left && syncSliderRect.right <= syncRect.right,
            closeBottom: syncCloseRect.bottom,
            trackGradient: syncTrackGradient
          },
          chapter: {
            width: chapterRect.width,
            radius: parseFloat(chapterStyle.borderRadius),
            overflow: chapterStyle.overflow,
            borderTop: chapterStyle.borderTopColor,
            scrim: chapterScrim,
            timeTabular: chapterTimeStyle.fontVariantNumeric,
            timeColor: chapterTimeStyle.color,
            dimColor: chapterDimStyle.color
          },
          subPreview: {
            pe: getComputedStyle(subPreview).pointerEvents,
            left: subTextRect.left,
            right: subTextRect.right
          }
        };
      });

      assert.equal(m.docOverflow, 0, 'Playback overlays must never cause horizontal document overflow');

      // Skip Button assertions
      assert.equal(m.skip.containerPe, 'none');
      assert.equal(m.skip.pe, 'auto');
      assert.ok(m.skip.left >= 15 && m.skip.right <= viewport.width - 15 && m.skip.top >= 15 && m.skip.bottom <= viewport.height - 15, 'Skip button must stay inside safe-area gutters');
      assert.ok(m.skip.height >= 44, 'Skip button must meet 44px touch target');
      assert.ok(m.skip.radius >= m.skip.height / 2 - 1, 'Skip button must be a pill');
      assert.equal(m.skip.bg, 'rgba(12, 16, 28, 0.88)');
      assert.ok(m.skip.gradient.includes('linear-gradient'));
      assert.ok(m.skip.blur.includes('blur(16px)'));
      assert.equal(m.skip.color, 'rgb(255, 255, 255)');
      if (viewport.width >= 640) {
        if (direction === 'ltr') {
          assert.ok(m.skip.left > viewport.width - m.skip.right, 'Skip button must anchor right in LTR');
        } else {
          assert.ok(m.skip.left < viewport.width - m.skip.right, 'Skip button must anchor left in RTL');
        }
      }

      // Player Stats assertions
      assert.ok(m.stats.left >= 15 && m.stats.right <= viewport.width - 15 && m.stats.top >= 11 && m.stats.bottom <= viewport.height - 11, 'Player Stats must stay inside viewport gutters');
      assert.equal(m.stats.bg, 'rgba(12, 16, 28, 0.88)');
      assert.ok(m.stats.blur.includes('blur(24px)'));
      assert.equal(m.stats.borderTop, 'rgba(255, 255, 255, 0.28)');
      assert.ok(m.stats.radius >= 14);
      assert.equal(m.stats.overflowY, 'auto');
      assert.ok(m.stats.maxHeight <= viewport.height * 0.75 + 1);
      assert.ok(m.stats.closeW >= 44 && m.stats.closeH >= 44, 'Player Stats close button must be 44x44');
      assert.equal(m.stats.closeOverlap, false, 'Player Stats close button must never collide with stat rows');
      if (direction === 'ltr') {
        assert.ok(m.stats.closeLeft > (m.stats.left + m.stats.right) / 2, 'LTR close button must sit on the right');
      } else {
        assert.ok(m.stats.closeRight < (m.stats.left + m.stats.right) / 2, 'RTL close button must sit on the left');
      }
      assert.equal(m.stats.headerTransform, 'uppercase');
      assert.equal(m.stats.headerColor, 'rgb(165, 180, 252)');
      assert.equal(m.stats.labelColor, 'rgb(148, 163, 184)');
      assert.ok(m.stats.valueFont.includes('monospace'));
      assert.ok(m.stats.valueTabular.includes('tabular-nums'));

      // Subtitle Sync assertions
      assert.equal(m.sync.wrapperPe, 'none');
      assert.equal(m.sync.pe, 'auto');
      assert.ok(m.sync.left >= 15 && m.sync.right <= viewport.width - 15, 'Subtitle Sync card must stay inside viewport gutters');
      assert.ok(m.sync.width <= m.rootFontSize * 28 + 1);
      assert.equal(m.sync.bg, 'rgba(12, 16, 28, 0.88)');
      assert.ok(m.sync.blur.includes('blur(24px)'));
      assert.equal(m.sync.borderTop, 'rgba(255, 255, 255, 0.28)');
      assert.ok(m.sync.radius >= 14);
      assert.ok(m.sync.closeW >= 44 && m.sync.closeH >= 44);
      assert.ok(m.sync.textCenterOffset <= 2, 'Subtitle Sync readout must stay centered in both LTR and RTL');
      assert.ok(m.sync.textFont.includes('monospace') && m.sync.textTabular.includes('tabular-nums'));
      if (direction === 'ltr') {
        assert.ok(m.sync.textRight <= m.sync.closeLeft - 4, 'LTR readout must never collide with close button');
      } else {
        assert.ok(m.sync.closeRight <= m.sync.textLeft - 4, 'RTL readout must never collide with close button');
      }
      assert.ok(m.sync.sliderTop >= Math.max(m.sync.textBottom, m.sync.closeBottom) - 0.5, 'Slider row must sit cleanly below header row');
      assert.ok(m.sync.sliderHeight >= 44 && m.sync.sliderInside);
      assert.ok(m.sync.trackGradient.includes('linear-gradient'));

      // Chapter Preview & Subtitle Fullscreen Preview assertions
      assert.ok(m.chapter.width <= viewport.width - 20);
      assert.ok(m.chapter.radius >= 10);
      assert.equal(m.chapter.overflow, 'hidden');
      assert.equal(m.chapter.borderTop, 'rgba(255, 255, 255, 0.28)');
      assert.ok(m.chapter.scrim.includes('linear-gradient'));
      assert.ok(m.chapter.timeTabular.includes('tabular-nums'));
      assert.equal(m.chapter.timeColor, 'rgb(255, 255, 255)');
      assert.equal(m.chapter.dimColor, 'rgb(203, 213, 225)');

      assert.equal(m.subPreview.pe, 'none');
      assert.ok(m.subPreview.left >= 15 && m.subPreview.right <= viewport.width - 15);
    });
  }
}

test('Focus, hover, TV stats & inline subtitle appearance customization work cleanly', async () => {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  try {
    await page.setContent(fixture);

    await page.getByTestId('skip').hover();
    const skipHoverTransform = await page.getByTestId('skip').evaluate(el => getComputedStyle(el).transform);
    assert.notEqual(skipHoverTransform, 'none', 'Pointer hover must lift .skip-button');
    await page.mouse.move(0, 0);

    const states = await page.evaluate(() => {
      // Up Next TV focus
      const upnext = document.querySelector('[data-testid="upnext"]');
      const startBtn = upnext.querySelector('.btnStartNow');
      const hideBtn = upnext.querySelector('.btnHide');
      startBtn.classList.add('show-focus');
      hideBtn.classList.add('show-focus');
      startBtn.focus();
      const startStyle = getComputedStyle(startBtn);
      const startSnapshot = {
        startColor: startStyle.color,
        startTransform: startStyle.transform,
        startOutline: parseFloat(startStyle.outlineWidth),
        noCollision: startBtn.getBoundingClientRect().right < hideBtn.getBoundingClientRect().left
      };
      hideBtn.focus();
      const hideStyle = getComputedStyle(hideBtn);
      const hideSnapshot = {
        hideColor: hideStyle.color,
        hideTransform: hideStyle.transform,
        hideOutline: parseFloat(hideStyle.outlineWidth)
      };

      // Skip button TV focus
      const skipBtn = document.querySelector('[data-testid="skip"]');
      skipBtn.classList.add('show-focus');
      skipBtn.focus();
      const skipStyle = getComputedStyle(skipBtn);
      const skipSnapshot = {
        color: skipStyle.color,
        transform: skipStyle.transform,
        outline: parseFloat(skipStyle.outlineWidth)
      };

      // Player Stats close focus & TV variant
      const stats = document.querySelector('[data-testid="playerstats"]');
      const statsClose = stats.querySelector('.playerStats-closeButton');
      statsClose.classList.add('show-focus');
      statsClose.focus();
      const statsCloseFocus = {
        color: getComputedStyle(statsClose).color,
        transform: getComputedStyle(statsClose).transform,
        outline: parseFloat(getComputedStyle(statsClose).outlineWidth)
      };
      stats.classList.add('playerStats-tv');
      stats.querySelector('.playerStats-content').classList.add('playerStats-content-tv');
      const tvFontSize = parseFloat(getComputedStyle(stats.querySelector('.playerStats-content')).fontSize);

      // Subtitle Sync focus states
      const sync = document.querySelector('[data-testid="subtitlesync"]');
      const syncClose = sync.querySelector('.subtitleSync-closeButton');
      syncClose.classList.add('show-focus');
      syncClose.focus();
      const syncCloseFocus = {
        transform: getComputedStyle(syncClose).transform,
        outline: parseFloat(getComputedStyle(syncClose).outlineWidth)
      };
      const syncText = sync.querySelector('.subtitleSyncTextField');
      syncText.focus();
      const syncTextOutline = parseFloat(getComputedStyle(syncText).outlineWidth);
      const syncSlider = sync.querySelector('.subtitleSyncSlider');
      syncSlider.classList.add('show-focus');
      syncSlider.focus();
      const syncSliderOutline = parseFloat(getComputedStyle(syncSlider).outlineWidth);

      // Subtitle Fullscreen Preview inline overrides (from subtitleAppearanceHelper)
      const subWin = document.querySelector('.subtitleappearance-fullpreview-window');
      const subTxt = document.querySelector('.subtitleappearance-fullpreview-text');
      subWin.style.top = '0px';
      subWin.style.bottom = '';
      subTxt.style.color = 'rgb(255, 255, 0)';
      subTxt.style.backgroundColor = 'transparent';

      return {
        upnext: {
          ...startSnapshot,
          ...hideSnapshot
        },
        skip: skipSnapshot,
        statsCloseFocus,
        tvFontSize,
        syncCloseFocus,
        syncTextOutline,
        syncSliderOutline,
        subCustomColor: getComputedStyle(subTxt).color,
        subCustomBg: getComputedStyle(subTxt).backgroundColor,
        subWinTop: getComputedStyle(subWin).top
      };
    });

    assert.equal(states.upnext.startColor, 'rgb(255, 255, 255)');
    assert.equal(states.upnext.startTransform, 'none');
    assert.ok(states.upnext.startOutline >= 2 && states.upnext.noCollision);
    assert.equal(states.upnext.hideColor, 'rgb(255, 255, 255)');
    assert.equal(states.upnext.hideTransform, 'none');
    assert.ok(states.upnext.hideOutline >= 2);

    assert.equal(states.skip.color, 'rgb(255, 255, 255)');
    assert.equal(states.skip.transform, 'none');
    assert.ok(states.skip.outline >= 2);

    assert.equal(states.statsCloseFocus.color, 'rgb(255, 255, 255)');
    assert.equal(states.statsCloseFocus.transform, 'none');
    assert.ok(states.statsCloseFocus.outline >= 2);
    assert.ok(states.tvFontSize > 10 && states.tvFontSize < 14);

    assert.equal(states.syncCloseFocus.transform, 'none');
    assert.ok(states.syncCloseFocus.outline >= 2 && states.syncTextOutline >= 2 && states.syncSliderOutline >= 2);

    assert.equal(states.subCustomColor, 'rgb(255, 255, 0)', 'User inline subtitle color must not be clobbered by !important');
    assert.equal(states.subCustomBg, 'rgba(0, 0, 0, 0)');
    assert.equal(states.subWinTop, '0px');
  } finally {
    await page.close();
  }
});

for (const reducedMotion of ['no-preference', 'reduce']) {
  test(`Up Next & Skip Button transitionend lifecycles with ${reducedMotion} motion`, async () => {
    const page = await browser.newPage({ reducedMotion });
    try {
      await page.setContent(fixture);

      // Up Next lifecycle
      const dialog = page.getByTestId('upnext');
      const upnextLifecycle = await dialog.evaluate(async element => {
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        const startBtn = element.querySelector('.btnStartNow');
        startBtn.focus();
        return new Promise(resolve => {
          element.addEventListener('transitionend', event => {
            event.target.classList.add('hide');
            resolve({
              targetIsContainer: event.target === element,
              containerHidden: element.classList.contains('hide'),
              buttonNotHidden: !startBtn.classList.contains('hide'),
              display: getComputedStyle(element).display,
              opacity: getComputedStyle(element).opacity
            });
          }, { once: true });
          void element.offsetWidth;
          startBtn.blur();
          element.classList.add('upNextDialog-hidden');
        });
      });
      assert.equal(upnextLifecycle.targetIsContainer, true);
      assert.equal(upnextLifecycle.containerHidden, true);
      assert.equal(upnextLifecycle.buttonNotHidden, true);
      assert.equal(upnextLifecycle.display, 'none');
      assert.equal(upnextLifecycle.opacity, '0');

      // Skip Button lifecycle (.no-transition + focused transitionend dismissal)
      const skip = page.getByTestId('skip');
      const skipLifecycle = await skip.evaluate(async element => {
        element.classList.add('no-transition');
        const noTransDuration = getComputedStyle(element).transitionDuration;
        element.classList.remove('no-transition');
        element.classList.add('show-focus');
        element.focus();
        void element.offsetWidth;
        const activeDuration = getComputedStyle(element).transitionDuration;

        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        return new Promise(resolve => {
          element.addEventListener('transitionend', event => {
            element.classList.add('hide');
            resolve({
              noTransDuration,
              activeDuration,
              targetIsSkip: event.target === element,
              opacity: getComputedStyle(element).opacity,
              pe: getComputedStyle(element).pointerEvents,
              display: getComputedStyle(element).display
            });
          }, { once: true });
          element.classList.add('skip-button-hidden');
        });
      });
      assert.ok(skipLifecycle.noTransDuration.split(',').every(d => d.trim() === '0s'), '.no-transition must disable transitions');
      if (reducedMotion === 'reduce') {
        assert.equal(skipLifecycle.activeDuration, '0.001s', 'Reduced motion must keep 1ms opacity transition even when focused');
      }
      assert.equal(skipLifecycle.targetIsSkip, true);
      assert.equal(skipLifecycle.opacity, '0');
      assert.equal(skipLifecycle.pe, 'none');
      assert.equal(skipLifecycle.display, 'none');
    } finally {
      await page.close();
    }
  });
}

test('All playback overlays remain legible in forced colors High Contrast mode', async () => {
  const page = await browser.newPage({ forcedColors: 'active', reducedMotion: 'reduce' });
  try {
    await page.setContent(fixture);
    const styles = await page.evaluate(() => {
      const checkSurface = selector => {
        const el = document.querySelector(selector);
        const st = getComputedStyle(el);
        return {
          bg: st.backgroundColor,
          color: st.color,
          shadow: st.boxShadow,
          blur: st.backdropFilter,
          gradient: st.backgroundImage
        };
      };
      return {
        volume: checkSurface('[data-testid="volume"]'),
        volumeMeter: getComputedStyle(document.querySelector('[data-testid="volume"] .iconOsdProgressInner')).backgroundColor,
        volumeTrack: getComputedStyle(document.querySelector('[data-testid="volume"] .iconOsdProgressOuter')).backgroundColor,
        brightness: checkSurface('[data-testid="brightness"]'),
        brightnessMeter: getComputedStyle(document.querySelector('.brightnessOsdProgressInner')).backgroundColor,
        brightnessTrack: getComputedStyle(document.querySelector('[data-testid="brightness"] .iconOsdProgressOuter')).backgroundColor,
        upnext: checkSurface('[data-testid="upnext"]'),
        upnextRim: getComputedStyle(document.querySelector('[data-testid="upnext"]'), '::after').display,
        startBtn: checkSurface('.btnStartNow'),
        hideBtn: checkSurface('.btnHide'),
        skip: checkSurface('[data-testid="skip"]'),
        stats: checkSurface('[data-testid="playerstats"]'),
        statsHeaderColor: getComputedStyle(document.querySelector('.playerStats-stat-header .playerStats-stat-label')).color,
        sync: checkSurface('[data-testid="subtitlesync"]'),
        syncField: checkSurface('.subtitleSyncTextField'),
        chapter: checkSurface('[data-testid="chapter-thumb"]'),
        subPreview: checkSurface('.subtitleappearance-fullpreview-text')
      };
    });

    for (const [name, surface] of Object.entries({
      volume: styles.volume,
      brightness: styles.brightness,
      upnext: styles.upnext,
      startBtn: styles.startBtn,
      hideBtn: styles.hideBtn,
      skip: styles.skip,
      stats: styles.stats,
      sync: styles.sync,
      syncField: styles.syncField,
      chapter: styles.chapter,
      subPreview: styles.subPreview
    })) {
      assert.notEqual(surface.bg, surface.color, `${name} must maintain distinct foreground/background in forced colors`);
      assert.equal(surface.shadow, 'none', `${name} must strip decorative shadows in forced colors`);
      assert.equal(surface.blur, 'none', `${name} must strip backdrop blur in forced colors`);
      assert.equal(surface.gradient, 'none', `${name} must strip gradients in forced colors`);
    }
    assert.notEqual(styles.volumeMeter, styles.volumeTrack);
    assert.notEqual(styles.brightnessMeter, styles.brightnessTrack);
    assert.equal(styles.upnextRim, 'none');
    assert.notEqual(styles.startBtn.bg, styles.hideBtn.bg);
    assert.notEqual(styles.statsHeaderColor, styles.stats.bg);
  } finally {
    await page.close();
  }
});

test('All playback overlays survive 200% enlarged text and late-loading chunk/theme CSS on 320x480', async () => {
  const page = await browser.newPage({ viewport: { width: 320, height: 480 } });
  try {
    await page.setContent(fixture);
    await page.addStyleTag({ content: `${nativeStyles}\n${nativeDarkThemeStyles}\nhtml { font-size: 200% !important; }` });

    for (const direction of ['ltr', 'rtl']) {
      await page.evaluate(dir => { document.documentElement.dir = dir; }, direction);
      const check = await page.evaluate(() => {
        const vol = document.querySelector('[data-testid="volume"]').getBoundingClientRect();
        const bright = document.querySelector('[data-testid="brightness"]').getBoundingClientRect();
        const upnextEl = document.querySelector('[data-testid="upnext"]');
        const upnext = upnextEl.getBoundingClientRect();
        const start = upnextEl.querySelector('.btnStartNow').getBoundingClientRect();
        const hide = upnextEl.querySelector('.btnHide').getBoundingClientRect();
        const skipEl = document.querySelector('[data-testid="skip"]');
        const skip = skipEl.getBoundingClientRect();
        const statsEl = document.querySelector('[data-testid="playerstats"]');
        const stats = statsEl.getBoundingClientRect();
        const syncEl = document.querySelector('[data-testid="subtitlesync"]');
        const sync = syncEl.getBoundingClientRect();
        const syncClose = syncEl.querySelector('.subtitleSync-closeButton').getBoundingClientRect();
        const syncText = syncEl.querySelector('.subtitleSyncTextField').getBoundingClientRect();
        const syncSlider = syncEl.querySelector('.subtitleSyncSliderContainer').getBoundingClientRect();

        return {
          docOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          volOk: vol.left >= 31 && vol.right <= 289 && vol.height <= 108,
          brightOk: bright.left >= 31 && bright.right <= 289 && bright.height <= 108,
          brightGradient: getComputedStyle(document.querySelector('.brightnessOsdProgressInner')).backgroundImage,
          upnextOk: upnext.left >= 31 && upnext.right <= 289 && start.left >= upnext.left && start.right <= upnext.right && hide.left >= upnext.left && hide.right <= upnext.right,
          upnextBg: getComputedStyle(upnextEl).backgroundColor,
          skipOk: skip.left >= 31 && skip.right <= 289 && skip.height >= 44,
          skipGradient: getComputedStyle(skipEl).backgroundImage,
          statsOk: stats.left >= 31 && stats.right <= 289 && stats.bottom <= 480,
          syncOk: sync.left >= 31 && sync.right <= 289,
          syncNoOverlap: (syncText.right <= syncClose.left + 0.5 || syncClose.right <= syncText.left + 0.5) && syncSlider.top >= Math.max(syncText.bottom, syncClose.bottom) - 0.5
        };
      });

      assert.equal(check.docOverflow, 0, `200% zoom (${direction}) must produce zero document overflow`);
      assert.ok(check.volOk && check.brightOk, `200% zoom (${direction}) volume & brightness pills must fit viewport`);
      assert.ok(check.brightGradient.includes('linear-gradient'));
      assert.ok(check.upnextOk && check.upnextBg === 'rgba(12, 16, 28, 0.88)');
      assert.ok(check.skipOk && check.skipGradient.includes('linear-gradient'), `200% zoom (${direction}) skip button must beat late-loaded skipbutton.scss`);
      assert.ok(check.statsOk, `200% zoom (${direction}) player stats must remain inside 320x480 viewport`);
      assert.ok(check.syncOk && check.syncNoOverlap, `200% zoom (${direction}) subtitle sync must never collide`);
    }
  } finally {
    await page.close();
  }
});
