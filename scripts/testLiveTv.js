const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { before, after, test } = require('node:test');
const { chromium } = require('playwright');

const theme = fs.readFileSync(process.env.OBSIDIAN_STYLESHEET || path.join(__dirname, '..', 'obsidian.css'), 'utf8');
const logo = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="240" height="100"><rect width="240" height="100" fill="white"/><text x="120" y="65" text-anchor="middle" font-size="40">CHANNEL</text></svg>')}`;
const fixture = `<!doctype html><html dir="ltr"><head><style>
  body { margin: 0; font-size: 16px; }
  .tvguide { display: flex; flex-direction: column; height: 420px; }
  .tvGuideHeader { flex-shrink: 0; width: 100%; }
  .guide-headerTimeslots { display: flex; }
  .guide-channelTimeslotHeader, .channelsContainer { width: 24vw; flex-shrink: 0; }
  .guide-channelTimeslotHeader { margin: 0 1px 0 0; }
  .timeslotHeaders { overflow-x: auto; overflow-y: hidden; }
  .timeslotHeadersInner, .channelPrograms { width: 1800vw; position: relative; }
  .timeslotHeadersInner { display: flex; }
  .timeslotHeader { flex-shrink: 0; width: 2.0833333333%; height: 2.8em; }
  .emby-scroller { padding-left: max(3.3%, env(safe-area-inset-left)); padding-right: max(3.3%, env(safe-area-inset-right)); }
  .guideVerticalScroller { display: flex; align-items: flex-start; overflow-y: auto; padding-bottom: 15em; }
  .programGrid { flex-grow: 1; min-width: 0; overflow-x: auto; overflow-y: hidden; }
  .guide-channelHeaderCell, .channelPrograms { height: 4.42em; box-sizing: border-box; border: 1px solid #333; }
  .guide-channelHeaderCell { display: flex; width: 100%; padding: 0; font: inherit; }
  .programCell { position: absolute; top: 0; bottom: 0; left: 0; width: 8.3333333333%; border: 1px solid #333; padding: 0; overflow: hidden; }
  .programCell-active { background: #1e1e1e !important; }
  .programCell:focus, .guide-channelHeaderCell:focus { outline: none !important; }
  .channel-fixture { display: flex; flex-wrap: wrap; }
  .card { width: 25%; }
  .cardBox { margin: 0.5em; }
  .cardScalable { position: relative; }
  .cardPadder-square { padding-bottom: 100%; }
  .cardContent, .cardImageContainer { position: absolute; inset: 0; }
  .cardContent { background: linear-gradient(red, yellow, blue); }
  .cardImageContainer { background-color: #202020; background-position: center; background-repeat: no-repeat; background-size: contain; }
  .cardImageContainer img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; }
  .cardOverlayContainer { position: absolute; inset: 0; }
  .cardOverlayFab-primary { position: absolute; top: 50%; left: 50%; width: 3.9em; height: 3.9em; margin: -1.95em 0 0 -1.95em; }
  .cardOverlayButton-br { display: flex; position: absolute; bottom: 0; right: 0; }
  .cardText { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; line-height: 1.35; }
  .cardText-first { margin-top: 0.4em; }
  .cardText-secondary { font-size: 85%; }
  .cardText:empty { display: none; }
  @media (min-width: 500px) { .guide-channelTimeslotHeader, .channelsContainer { width: 16vw; } }
  @media (min-width: 800px) { .guide-channelTimeslotHeader, .channelsContainer { width: 14vw; } }
  @media (min-width: 1280px) { .guide-channelTimeslotHeader, .channelsContainer { width: 12vw; } }
  @media (max-width: 600px) { .card { width: 50%; } }
</style><style>${theme}</style></head><body>
  <div class="tvguide">
    <div class="tvGuideHeader"><div class="guide-headerTimeslots">
      <div class="guide-channelTimeslotHeader"><button>Settings</button></div>
      <div class="timeslotHeaders scrollX guideScroller"><div class="timeslotHeadersInner">${Array.from({ length: 48 }, (_, index) => `<div class="timeslotHeader">${index}:00</div>`).join('')}</div></div>
    </div></div>
    <div class="guideVerticalScroller emby-scroller scrollY">
      <div class="channelsContainer"><button class="guide-channelHeaderCell">Channel one</button><button class="guide-channelHeaderCell">Channel two</button></div>
      <div class="programGrid scrollX"><div class="channelPrograms"><button class="programCell programCell-active">Current program</button></div><div class="channelPrograms"><button class="programCell programCell-sports">Next program</button></div></div>
    </div>
  </div>
  <div class="channel-fixture">
    ${[
      ['A long channel name with enough words to wrap', '<div class="cardText cardText-secondary">Current program</div><div class="cardText cardText-secondary">10:00 PM - 11:00 PM</div>'],
      ['No guide data', ''],
      ['Only a program title', '<div class="cardText cardText-secondary">Current program</div>']
    ].map(([name, metadata], index) => `<div class="card squareCard" data-type="TvChannel"><div class="cardBox"><div class="cardScalable"><div class="cardPadder cardPadder-square"></div><div class="cardContent"><div class="cardImageContainer coveredImage coveredImage-contain"${index === 2 ? ` style="background-image:url('${logo}')"` : ''}>${index === 2 ? '' : `<img src="${logo}">`}</div></div><div class="cardOverlayContainer"><button class="cardOverlayButton cardOverlayFab-primary">Play</button><div class="cardOverlayButton-br"><button class="cardOverlayButton">Fav</button><button class="cardOverlayButton">More</button></div></div></div><div class="cardText cardText-first"><a class="textActionButton" href="#channel">${name}</a></div><div class="cardText cardText-secondary"></div>${metadata}</div></div>`).join('')}
    <div class="card squareCard" data-type="Movie"><div class="cardBox"><div class="cardScalable"><div class="cardPadder cardPadder-square"></div></div><div class="cardText">Unrelated movie artwork</div></div></div>
  </div>
</body></html>`;

let browser;

before(async () => {
  browser = await chromium.launch({ executablePath: process.env.OBSIDIAN_CHROMIUM_PATH || undefined, args: ['--no-sandbox'] });
});

after(async () => {
  if (browser) await browser.close();
});

for (const viewport of [
  { width: 320, height: 480 },
  { width: 390, height: 844 },
  { width: 844, height: 390 },
  { width: 1656, height: 1269 },
  { width: 1920, height: 1080 },
  { width: 3840, height: 2160 }
]) {
  test(`Live TV layout at ${viewport.width}x${viewport.height}`, async () => {
    const page = await browser.newPage({ viewport, hasTouch: viewport.width < 600 });
    try {
      await page.setContent(fixture);
      const metrics = await page.evaluate(() => {
        const rect = selector => document.querySelector(selector).getBoundingClientRect();
        const header = rect('.timeslotHeaders');
        const grid = rect('.programGrid');
        const channel = rect('.guide-channelHeaderCell');
        const row = rect('.channelPrograms');
        const boxes = [...document.querySelectorAll('[data-type="TvChannel"] .cardBox')].map(element => element.getBoundingClientRect().height);
        const image = document.querySelector('[data-type="TvChannel"] img');
        const imageStyle = getComputedStyle(image);
        const titleStyle = getComputedStyle(document.querySelector('[data-type="TvChannel"] .textActionButton'));
        return {
          headerOffset: Math.abs(header.x - grid.x),
          headerWidthDifference: Math.abs(header.width - grid.width),
          rowOffset: Math.abs(channel.y - row.y),
          rowHeightDifference: Math.abs(channel.height - row.height),
          scheduleWidthDifference: Math.abs(rect('.programCell').width - rect('.timeslotHeader').width * 4),
          schedulePosition: getComputedStyle(document.querySelector('.programCell')).position,
          cardHeightDifference: Math.max(...boxes) - Math.min(...boxes),
          imageFit: imageStyle.objectFit,
          imagePadding: parseFloat(imageStyle.paddingLeft),
          logoBackground: getComputedStyle(document.querySelector('[data-type="TvChannel"] .coveredImage')).backgroundColor,
          titleClamp: titleStyle.webkitLineClamp,
          titleWhitespace: titleStyle.whiteSpace,
          movieAspect: rect('[data-type="Movie"] .cardScalable').height / rect('[data-type="Movie"] .cardScalable').width,
          guideOverflow: getComputedStyle(document.querySelector('.guideVerticalScroller')).overflowY,
          documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
        };
      });
      assert.ok(metrics.headerOffset < 1, `Time header offset: ${metrics.headerOffset}px`);
      assert.ok(metrics.headerWidthDifference < 1, `Time header width mismatch: ${metrics.headerWidthDifference}px`);
      assert.ok(metrics.rowOffset < 1 && metrics.rowHeightDifference < 1, `Channel row offset: ${metrics.rowOffset}px; height mismatch: ${metrics.rowHeightDifference}px`);
      assert.ok(metrics.scheduleWidthDifference < 1, 'Program duration must retain its native time-slot width');
      assert.equal(metrics.schedulePosition, 'absolute');
      assert.ok(metrics.cardHeightDifference < 1, `Missing EPG data changes card height by ${metrics.cardHeightDifference}px`);
      assert.equal(metrics.imageFit, 'contain');
      assert.ok(metrics.imagePadding >= 12, 'Channel logos need breathing room');
      assert.equal(metrics.logoBackground, 'rgb(30, 41, 59)', 'Logo backing must mask the native blurhash placeholder');
      assert.equal(metrics.titleClamp, '2');
      assert.equal(metrics.titleWhitespace, 'normal');
      assert.ok(Math.abs(metrics.movieAspect - 1) < 0.01, 'Non-channel artwork must retain its native aspect ratio');
      assert.equal(metrics.guideOverflow, 'auto');
      assert.equal(metrics.documentOverflow, 0);

      const controls = await page.locator('[data-type="TvChannel"]').first().locator('.cardOverlayButton').evaluateAll(elements => elements.map(element => {
        const rect = element.getBoundingClientRect();
        return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height };
      }));
      assert.ok(controls.every(control => control.width >= 44 && control.height >= 44));
      for (let firstIndex = 0; firstIndex < controls.length; firstIndex++) {
        for (let secondIndex = firstIndex + 1; secondIndex < controls.length; secondIndex++) {
          const first = controls[firstIndex];
          const second = controls[secondIndex];
          assert.ok(first.right <= second.left || second.right <= first.left || first.bottom <= second.top || second.bottom <= first.top, 'Channel playback, favorite, and menu controls must not overlap');
        }
      }

      const positions = await page.evaluate(() => {
        document.querySelector('.timeslotHeaders').scrollLeft = 180;
        document.querySelector('.programGrid').scrollLeft = 180;
        return {
          header: document.querySelector('.timeslotHeadersInner').getBoundingClientRect().x,
          programs: document.querySelector('.channelPrograms').getBoundingClientRect().x
        };
      });
      assert.ok(Math.abs(positions.header - positions.programs) < 1, 'Timeline must remain aligned after horizontal scrolling');
      await page.locator('.programCell').first().focus();
      const focusShadow = await page.locator('.programCell').first().evaluate(element => getComputedStyle(element).boxShadow);
      assert.ok(focusShadow.includes('inset'), 'Keyboard and remote focus must stay visible');
    } finally {
      await page.close();
    }
  });
}

test('Live TV remains operable in forced colors and reduced motion', async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, forcedColors: 'active', reducedMotion: 'reduce' });
  try {
    await page.setContent(fixture);
    await page.locator('.programCell').first().focus();
    const focus = await page.locator('.programCell').first().evaluate(element => {
      const style = getComputedStyle(element);
      return { outline: style.outlineStyle, width: parseFloat(style.outlineWidth), animation: style.animationName };
    });
    assert.equal(focus.outline, 'solid');
    assert.ok(focus.width >= 2);
    assert.equal(focus.animation, 'none');
  } finally {
    await page.close();
  }
});
