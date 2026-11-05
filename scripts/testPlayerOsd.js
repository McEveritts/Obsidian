const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { before, after, test } = require('node:test');
const { chromium } = require('playwright');

const theme = fs.readFileSync(process.env.OBSIDIAN_STYLESHEET || path.join(__dirname, '..', 'obsidian.css'), 'utf8');
const nativeStyles = `
  .hide { display: none !important; }
  .iconOsd { backdrop-filter: blur(5px); background: rgba(0, 0, 0, 0.8); border-radius: 0.25em; color: #fff; padding: 1em; position: fixed; right: 3%; top: 7%; transition: opacity 0.2s ease-out; z-index: 100000; }
  .iconOsd-hidden { opacity: 0; }
  .iconOsdIcon { display: block; font-size: 320%; margin: 0.25em 0.7em; }
  .iconOsdProgressOuter { background: #222; border-radius: 0.25em; height: 0.35em; margin: 1.5em 0.25em 1em; }
  .iconOsdProgressInner { background: #00a4dc; border-radius: 0.25em; height: 100%; }
`;
const fixture = `<!doctype html><html dir="ltr"><head><style>${nativeStyles}</style><style>${theme}</style></head><body>
  <div class="iconOsd volumeOsd" data-testid="volume">
    <span class="material-icons iconOsdIcon volume_up" aria-hidden="true"></span>
    <div class="iconOsdProgressOuter"><div class="iconOsdProgressInner" style="width: 50%"></div></div>
  </div>
  <div class="iconOsd" data-testid="unrelated"><span class="iconOsdIcon"></span></div>
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
  for (const direction of ['ltr', 'rtl']) {
    test(`Volume popup at ${viewport.width}x${viewport.height} (${direction})`, async () => {
      const page = await browser.newPage({ viewport });
      try {
        await page.setContent(fixture);
        await page.evaluate(value => { document.documentElement.dir = value; }, direction);
        const popup = await page.getByTestId('volume').evaluate(element => {
          const style = getComputedStyle(element);
          const bounds = element.getBoundingClientRect();
          const icon = element.querySelector('.iconOsdIcon').getBoundingClientRect();
          const track = element.querySelector('.iconOsdProgressOuter').getBoundingClientRect();
          return {
            rootFontSize: parseFloat(getComputedStyle(document.documentElement).fontSize),
            width: bounds.width, height: bounds.height, top: bounds.top, right: bounds.right,
            radius: parseFloat(style.borderRadius), pointerEvents: style.pointerEvents,
            blur: style.backdropFilter, background: style.backgroundColor,
            gradient: getComputedStyle(element.querySelector('.iconOsdProgressInner')).backgroundImage,
            aligned: Math.abs(icon.top + icon.height / 2 - track.top - track.height / 2) < 1,
            separated: icon.right <= track.left || track.right <= icon.left,
            trackWidth: track.width
          };
        });
        assert.ok(popup.height <= popup.rootFontSize * 3.5, 'Volume feedback must be a compact single row, not the native square');
        assert.ok(popup.width >= popup.rootFontSize * 14 && popup.width <= popup.rootFontSize * 16, 'The volume pill must follow the theme\'s text scaling');
        assert.ok(popup.radius >= popup.height / 2, 'The volume popup needs pill corners');
        assert.ok(popup.top >= 16 && popup.right <= viewport.width - 16, 'The popup must respect viewport gutters');
        assert.ok(popup.aligned && popup.separated && popup.trackWidth > 100, 'The icon and meter must share a row without overlap');
        assert.equal(popup.pointerEvents, 'none', 'Volume feedback must not intercept playback clicks');
        assert.equal(popup.background, 'rgba(12, 16, 28, 0.86)');
        assert.ok(popup.blur.includes('blur(16px)'));
        assert.ok(popup.gradient.includes('linear-gradient'));
        assert.equal(await page.getByTestId('unrelated').evaluate(element => parseFloat(getComputedStyle(element).borderRadius)), popup.rootFontSize * 0.25, 'Other icon OSDs must remain untouched');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), 0);
      } finally {
        await page.close();
      }
    });
  }
}

test('Native volume updates and mute state remain intact', async () => {
  const page = await browser.newPage();
  try {
    await page.setContent(fixture);
    for (const volume of [0, 1, 50, 100]) {
      const ratio = await page.getByTestId('volume').evaluate((element, value) => {
        const meter = element.querySelector('.iconOsdProgressInner');
        meter.style.width = `${value}%`;
        return meter.getBoundingClientRect().width / meter.parentElement.getBoundingClientRect().width;
      }, volume);
      assert.ok(Math.abs(ratio - volume / 100) < 0.01, `The native ${volume}% volume must remain accurate`);
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
  test(`Native popup lifecycle with ${reducedMotion} motion`, async () => {
    const page = await browser.newPage({ reducedMotion });
    try {
      await page.setContent(fixture);
      const popup = page.getByTestId('volume');
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
      assert.deepEqual(dismissed, { display: 'none', opacity: '0' }, 'The native opacity transition must still finish and hide the popup');
      assert.equal(await popup.evaluate(element => element.getBoundingClientRect().width), 0);
      await popup.evaluate(element => { element.classList.remove('hide', 'iconOsd-hidden'); });
      await page.waitForFunction(() => getComputedStyle(document.querySelector('.volumeOsd')).opacity === '1');
      assert.equal(await popup.evaluate(element => getComputedStyle(element).display), 'flex');
      if (reducedMotion === 'reduce') {
        assert.equal(await popup.evaluate(element => getComputedStyle(element).transitionDuration), '0.001s');
      }
    } finally {
      await page.close();
    }
  });
}

test('The volume popup remains legible in forced colors', async () => {
  const page = await browser.newPage({ forcedColors: 'active', reducedMotion: 'reduce' });
  try {
    await page.setContent(fixture);
    const styles = await page.getByTestId('volume').evaluate(element => {
      const style = getComputedStyle(element);
      const meter = getComputedStyle(element.querySelector('.iconOsdProgressInner'));
      const track = getComputedStyle(element.querySelector('.iconOsdProgressOuter'));
      return {
        background: style.backgroundColor, border: style.borderTopColor, color: style.color,
        shadow: style.boxShadow, blur: style.backdropFilter,
        gradient: meter.backgroundImage, meter: meter.backgroundColor, track: track.backgroundColor
      };
    });
    assert.notEqual(styles.background, styles.color);
    assert.equal(styles.border, styles.color);
    assert.equal(styles.shadow, 'none');
    assert.equal(styles.blur, 'none');
    assert.equal(styles.gradient, 'none');
    assert.notEqual(styles.meter, styles.track, 'Forced colors must distinguish volume from the empty track');
  } finally {
    await page.close();
  }
});

test('The volume popup fits enlarged text and late-loading native CSS', async () => {
  const page = await browser.newPage({ viewport: { width: 320, height: 480 } });
  try {
    await page.setContent(fixture);
    await page.addStyleTag({ content: `${nativeStyles} html { font-size: 200% !important; }` });
    const bounds = await page.getByTestId('volume').boundingBox();
    assert.ok(bounds.x >= 32 && bounds.x + bounds.width <= 288, 'Enlarged volume feedback must remain in the viewport');
    assert.ok(bounds.height <= 108, 'Enlarged feedback must retain a single-row layout');
    assert.equal(await page.getByTestId('volume').evaluate(element => getComputedStyle(element).display), 'flex');
    assert.equal(await page.locator('.volumeOsd .iconOsdIcon').evaluate(element => getComputedStyle(element).fontSize), '48px');
  } finally {
    await page.close();
  }
});
