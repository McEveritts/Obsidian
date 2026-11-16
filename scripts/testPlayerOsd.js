const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { before, after, test } = require('node:test');
const { chromium } = require('playwright');

const theme = fs.readFileSync(process.env.OBSIDIAN_STYLESHEET || path.join(__dirname, '..', 'obsidian.css'), 'utf8');
const nativeStyles = `
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
  .emby-button { align-items: center; border: 0; border-radius: 0.2em; box-sizing: border-box; color: inherit; cursor: pointer; display: inline-flex; font-family: inherit; font-size: inherit; font-weight: 600; line-height: 1.35; margin: 0.3em; outline: none !important; padding: 0.9em 1em; position: relative; text-align: center; text-decoration: none; transform-origin: center; transition: 0.2s; user-select: none; vertical-align: middle; z-index: 0; }
  .emby-button.show-focus:focus { transform: scale(1.2); z-index: 1; }
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
  <div class="iconOsd" data-testid="unrelated"><span class="iconOsdIcon"></span></div>
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

for (const viewport of [
  { width: 320, height: 480 },
  { width: 390, height: 844 },
  { width: 844, height: 390 },
  { width: 1656, height: 1269 },
  { width: 1920, height: 1080 },
  { width: 3840, height: 2160 }
]) {
  for (const direction of ['ltr', 'rtl']) {
    test(`Up Next dialog at ${viewport.width}x${viewport.height} (${direction})`, async () => {
      const page = await browser.newPage({ viewport });
      try {
        await page.setContent(fixture);
        await page.evaluate(value => { document.documentElement.dir = value; }, direction);
        const metrics = await page.getByTestId('upnext').evaluate(element => {
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
            left: bounds.left,
            right: bounds.right,
            bottom: bounds.bottom,
            width: bounds.width,
            height: bounds.height,
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

        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), 0, 'Up Next dialog must not cause horizontal document overflow');
        assert.ok(metrics.left >= 15 && metrics.right <= viewport.width - 15 && metrics.bottom <= viewport.height - 11, 'Up Next dialog must respect viewport gutters');
        if (viewport.width >= 900) {
          if (direction === 'ltr') {
            assert.ok(metrics.left > viewport.width - metrics.right, 'LTR Up Next dialog must anchor to the right');
          } else {
            assert.ok(metrics.left < viewport.width - metrics.right, 'RTL Up Next dialog must anchor to the left');
          }
        }
        assert.equal(metrics.background, 'rgba(12, 16, 28, 0.88)', 'Up Next dialog must use smoked Obsidian glass surface');
        assert.ok(metrics.blur.includes('blur(24px)'), 'Up Next dialog must apply heavy frosted glass blur');
        assert.ok(metrics.radius >= 14, 'Up Next dialog must have rounded glass corners instead of sharp native edges');
        assert.equal(metrics.borderTop, 'rgba(255, 255, 255, 0.28)', 'Up Next dialog must display top specular bevel');
        assert.notEqual(metrics.rimContent, 'none', 'Up Next dialog must render prismatic edge pseudo-element');
        assert.ok(metrics.titleSize > metrics.headerSize, 'Episode title must have stronger typographic hierarchy than the countdown label');
        assert.ok(metrics.titleLeft >= metrics.left && metrics.titleRight <= metrics.right, 'Episode title must stay inside the card');
        assert.ok(metrics.countdownTabular.includes('tabular-nums'), 'Countdown badge must lock tabular numerals');
        assert.ok(metrics.countdownRadius >= 999, 'Countdown badge must render as a pill');
        assert.ok(metrics.countdownGradient.includes('linear-gradient'), 'Countdown badge must use luminescent gradient');
        assert.ok(metrics.pillsInside, 'Media info badges must remain inside the card');
        assert.ok(Math.max(...metrics.pillHeights) - Math.min(...metrics.pillHeights) <= 2, 'Media info pills must have uniform row height');
        assert.ok(metrics.startHeight >= 44 && metrics.hideHeight >= 44, 'Up Next action buttons must meet 44px WCAG 2.2 AAA target height');
        assert.ok(metrics.startHeight <= metrics.rootFontSize * 3.1, 'Up Next buttons must not revert to bloated 59px slabs');
        assert.ok(metrics.startRadius >= metrics.startHeight / 2 - 1 && metrics.hideRadius >= metrics.hideHeight / 2 - 1, 'Up Next buttons must have pill corners');
        assert.ok(metrics.startGradient.includes('linear-gradient'), 'Start Now must use primary Indigo-Fuchsia gradient');
        assert.equal(metrics.startColor, 'rgb(255, 255, 255)', 'Start Now text must be crisp white');
        assert.equal(metrics.hideBg, 'rgba(255, 255, 255, 0.08)', 'Hide must use secondary glass surface');
        assert.ok(metrics.startCenteredY <= 2 && metrics.hideCenteredY <= 2 && metrics.startCenteredX <= 2 && metrics.hideCenteredX <= 2, 'Button labels must be optically centered');
        assert.ok(metrics.buttonsSeparated && metrics.buttonsInside, 'Start Now and Hide must stay inside the card without overlapping');
        if (direction === 'ltr' && viewport.width >= 480) {
          assert.ok(metrics.startLeft < metrics.hideLeft, 'Start Now must precede Hide in LTR');
        } else if (direction === 'rtl' && viewport.width >= 480) {
          assert.ok(metrics.startLeft > metrics.hideLeft, 'Start Now must precede Hide inline in RTL');
        }
      } finally {
        await page.close();
      }
    });
  }
}

test('Up Next TV .show-focus and keyboard focus neutralize black text and scale(1.2) collision', async () => {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  try {
    await page.setContent(fixture);
    const focusCheck = await page.getByTestId('upnext').evaluate(element => {
      const startBtn = element.querySelector('.btnStartNow');
      const hideBtn = element.querySelector('.btnHide');
      startBtn.classList.add('show-focus');
      hideBtn.classList.add('show-focus');

      startBtn.focus();
      const startStyle = getComputedStyle(startBtn);
      const startRect = startBtn.getBoundingClientRect();
      const hideRectWhenStartFocused = hideBtn.getBoundingClientRect();

      hideBtn.focus();
      const hideStyle = getComputedStyle(hideBtn);

      return {
        startColor: startStyle.color,
        startTransform: startStyle.transform,
        startOutlineWidth: parseFloat(startStyle.outlineWidth),
        noCollision: startRect.right < hideRectWhenStartFocused.left,
        hideColor: hideStyle.color,
        hideTransform: hideStyle.transform,
        hideOutlineWidth: parseFloat(hideStyle.outlineWidth)
      };
    });

    assert.equal(focusCheck.startColor, 'rgb(255, 255, 255)', 'Focused TV Start Now must keep white text instead of dark theme black');
    assert.equal(focusCheck.startTransform, 'none', 'Focused TV Start Now must suppress scale(1.2)');
    assert.ok(focusCheck.startOutlineWidth >= 2, 'Focused TV Start Now must show high-visibility focus ring');
    assert.ok(focusCheck.noCollision, 'Focused Start Now must not collide with Hide');
    assert.equal(focusCheck.hideColor, 'rgb(255, 255, 255)', 'Focused TV Hide must keep white text');
    assert.equal(focusCheck.hideTransform, 'none', 'Focused TV Hide must suppress scale(1.2)');
    assert.ok(focusCheck.hideOutlineWidth >= 2, 'Focused TV Hide must show high-visibility focus ring');
  } finally {
    await page.close();
  }
});

for (const reducedMotion of ['no-preference', 'reduce']) {
  test(`Up Next native transitionend dismissal lifecycle with ${reducedMotion} motion`, async () => {
    const page = await browser.newPage({ reducedMotion });
    try {
      await page.setContent(fixture);
      const dialog = page.getByTestId('upnext');
      const lifecycle = await dialog.evaluate(async element => {
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

      assert.equal(lifecycle.targetIsContainer, true, 'transitionend must fire on .upNextContainer, never a child button');
      assert.equal(lifecycle.containerHidden, true);
      assert.equal(lifecycle.buttonNotHidden, true, 'Start Now button must never mistakenly receive .hide');
      assert.equal(lifecycle.display, 'none');
      assert.equal(lifecycle.opacity, '0');

      await dialog.evaluate(element => {
        element.querySelector('.upNextDialog-mediainfo').innerHTML = '';
        element.classList.remove('hide', 'upNextDialog-hidden');
      });
      await page.waitForFunction(() => getComputedStyle(document.querySelector('[data-testid="upnext"]')).opacity === '1');
      assert.equal(await dialog.evaluate(element => getComputedStyle(element).display), 'flex');
      assert.equal(await page.locator('.upNextDialog-mediainfo').evaluate(element => getComputedStyle(element).display), 'none', 'Empty mediainfo row must collapse');
    } finally {
      await page.close();
    }
  });
}

test('Up Next dialog remains legible in forced colors', async () => {
  const page = await browser.newPage({ forcedColors: 'active', reducedMotion: 'reduce' });
  try {
    await page.setContent(fixture);
    const styles = await page.getByTestId('upnext').evaluate(element => {
      const card = getComputedStyle(element);
      const rim = getComputedStyle(element, '::after');
      const start = getComputedStyle(element.querySelector('.btnStartNow'));
      const hide = getComputedStyle(element.querySelector('.btnHide'));
      return {
        cardBg: card.backgroundColor,
        cardColor: card.color,
        cardShadow: card.boxShadow,
        cardBlur: card.backdropFilter,
        rimDisplay: rim.display,
        startBg: start.backgroundColor,
        startColor: start.color,
        startGradient: start.backgroundImage,
        hideBg: hide.backgroundColor,
        hideColor: hide.color
      };
    });
    assert.notEqual(styles.cardBg, styles.cardColor);
    assert.equal(styles.cardShadow, 'none');
    assert.equal(styles.cardBlur, 'none');
    assert.equal(styles.rimDisplay, 'none');
    assert.equal(styles.startGradient, 'none');
    assert.notEqual(styles.startBg, styles.startColor);
    assert.notEqual(styles.hideBg, styles.hideColor);
    assert.notEqual(styles.startBg, styles.hideBg, 'Forced colors must distinguish primary Start Now from secondary Hide');
  } finally {
    await page.close();
  }
});

test('Up Next dialog survives 200% enlarged text and late-loading chunk/theme CSS', async () => {
  const page = await browser.newPage({ viewport: { width: 320, height: 480 } });
  try {
    await page.setContent(fixture);
    await page.addStyleTag({ content: `${nativeStyles}\n${nativeDarkThemeStyles}\nhtml { font-size: 200% !important; }` });
    const check = await page.getByTestId('upnext').evaluate(element => {
      const bounds = element.getBoundingClientRect();
      const start = element.querySelector('.btnStartNow').getBoundingClientRect();
      const hide = element.querySelector('.btnHide').getBoundingClientRect();
      return {
        docOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        left: bounds.left,
        right: bounds.right,
        background: getComputedStyle(element).backgroundColor,
        startGradient: getComputedStyle(element.querySelector('.btnStartNow')).backgroundImage,
        buttonsInside: start.left >= bounds.left && start.right <= bounds.right && hide.left >= bounds.left && hide.right <= bounds.right
      };
    });
    assert.equal(check.docOverflow, 0);
    assert.ok(check.left >= 31 && check.right <= 289, 'Enlarged Up Next dialog must remain inside viewport gutters');
    assert.equal(check.background, 'rgba(12, 16, 28, 0.88)', 'Obsidian card surface must beat late-loaded chunk CSS');
    assert.ok(check.startGradient.includes('linear-gradient'), 'Start Now gradient must beat late-loaded theme.css .raised');
    assert.ok(check.buttonsInside, 'Enlarged buttons must wrap cleanly inside the card');
  } finally {
    await page.close();
  }
});
