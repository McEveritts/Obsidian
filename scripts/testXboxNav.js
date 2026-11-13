const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { before, after, test } = require('node:test');
const { chromium } = require('playwright');

const srcDir = path.join(__dirname, '..', 'src');
const cssFiles = fs
  .readdirSync(srcDir)
  .filter(name => name.endsWith('.css'))
  .sort();
const themeCss = cssFiles
  .map(name => fs.readFileSync(path.join(srcDir, name), 'utf8'))
  .join('\n');
const xboxNavScript = fs.readFileSync(path.join(__dirname, 'obsidian-xbox-nav.js'), 'utf8');

const baseMuiStyles = `
  html, body { margin: 0; padding: 0; font-size: 16px; background: #101010; color: #fff; }
  .MuiModal-root, .MuiPopover-root { position: fixed; inset: 0; z-index: 1300; }
  .MuiBackdrop-root { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); z-index: -1; }
  .MuiPopover-paper {
    position: absolute;
    top: 64px;
    left: 64px;
    width: 250px;
    max-height: 50%;
    overflow-y: auto;
    outline: none;
  }
  .MuiAccordionSummary-root {
    display: flex;
    align-items: center;
    width: 100%;
    min-height: 48px;
    padding: 0 16px;
    border: 0;
    background: transparent;
    color: inherit;
    text-align: left;
  }
  .MuiCollapse-root { overflow: hidden; }
  .MuiCollapse-hidden { height: 0; min-height: 0; visibility: hidden; }
  .MuiAccordionDetails-root { padding: 8px 16px; display: flex; flex-direction: column; gap: 6px; }
  .MuiMenuItem-root {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 40px;
    padding: 6px 16px;
    list-style: none;
  }
`;

function buildPageHtml({ layoutClass, bodyHtml }) {
  return `<!doctype html>
<html dir="ltr" class="${layoutClass}">
<head>
  <meta charset="utf-8">
  <style>${baseMuiStyles}</style>
  <style>${themeCss}</style>
</head>
<body class="${layoutClass}">
  ${bodyHtml}
</body>
</html>`;
}

function resolveChromiumExecutable() {
  if (process.env.OBSIDIAN_CHROMIUM_PATH) return process.env.OBSIDIAN_CHROMIUM_PATH;
  const defaultPath = chromium.executablePath();
  if (defaultPath && fs.existsSync(defaultPath)) return defaultPath;

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

test('Node safety: requiring obsidian-xbox-nav.js in Node does not throw', () => {
  assert.doesNotThrow(() => {
    require(path.join(__dirname, 'obsidian-xbox-nav.js'));
  });
});

test('1. #filter-popover in .layout-tv auto-focuses first .MuiAccordionSummary-root on open and after explicit paper.focus()', async () => {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  try {
    await page.setContent(buildPageHtml({
      layoutClass: 'layout-tv',
      bodyHtml: `<button id="filter-trigger" type="button">Filter</button>`
    }));
    await page.addScriptTag({ content: xboxNavScript });

    await page.evaluate(() => {
      document.getElementById('filter-trigger').focus();
      const popover = document.createElement('div');
      popover.id = 'filter-popover';
      popover.className = 'MuiPopover-root MuiModal-root';
      popover.innerHTML = `
        <div class="MuiBackdrop-root"></div>
        <div class="MuiPopover-paper" tabindex="-1">
          <div class="MuiAccordion-root">
            <button id="acc-1" class="MuiButtonBase-root MuiAccordionSummary-root" type="button">Filters</button>
            <div class="MuiCollapse-root MuiCollapse-hidden">
              <div class="MuiAccordionDetails-root">
                <label><input id="chk-hidden" type="checkbox"> Played</label>
              </div>
            </div>
          </div>
          <div class="MuiAccordion-root">
            <button id="acc-2" class="MuiButtonBase-root MuiAccordionSummary-root" type="button">Genres</button>
            <div class="MuiCollapse-root MuiCollapse-hidden">
              <div class="MuiAccordionDetails-root">
                <label><input id="chk-genre-hidden" type="checkbox"> Action</label>
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(popover);
      popover.querySelector('.MuiPopover-paper').focus();
    });

    await page.waitForFunction(() => document.activeElement && document.activeElement.id === 'acc-1');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'acc-1');

    // Explicitly focus .MuiPopover-paper again and check geometry + auto-entry
    const geometryStatus = await page.evaluate(() => {
      const paper = document.querySelector('#filter-popover .MuiPopover-paper');
      const firstAccordion = document.querySelector('#filter-popover .MuiAccordionSummary-root');
      paper.focus();
      const paperRect = paper.getBoundingClientRect();
      const accRect = firstAccordion.getBoundingClientRect();
      return {
        paperBottom: paperRect.bottom,
        accBottom: accRect.bottom,
        unlocked: paperRect.bottom < accRect.bottom
      };
    });

    console.log(
      `[geometry check] paper.bottom=${geometryStatus.paperBottom.toFixed(1)}, ` +
      `firstAccordion.bottom=${geometryStatus.accBottom.toFixed(1)}, ` +
      `cssGeometryUnlocked=${geometryStatus.unlocked}`
    );

    await page.waitForFunction(() => document.activeElement && document.activeElement.id === 'acc-1');
    assert.equal(
      await page.evaluate(() => document.activeElement.id),
      'acc-1',
      'obsidian-xbox-nav.js must redirect focus from .MuiPopover-paper to the first visible control'
    );
  } finally {
    await page.close();
  }
});

test('2. #selectview-popover in .layout-tv upgrades <li class="MuiMenuItem-root"> and handles Enter independently from nested gear <button>', async () => {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  try {
    await page.setContent(buildPageHtml({
      layoutClass: 'layout-tv',
      bodyHtml: `<button id="view-trigger" type="button">View</button>`
    }));
    await page.addScriptTag({ content: xboxNavScript });

    await page.evaluate(() => {
      window.__clicks = { gridLi: 0, gearBtn: 0, listLi: 0, disabledLi: 0 };
      const popover = document.createElement('div');
      popover.id = 'selectview-popover';
      popover.className = 'MuiPopover-root MuiModal-root';
      popover.innerHTML = `
        <div class="MuiBackdrop-root"></div>
        <div class="MuiPopover-paper" tabindex="-1">
          <ul class="MuiList-root">
            <li id="li-grid" class="MuiButtonBase-root MuiMenuItem-root" role="menuitem" tabindex="-1">
              <span>Grid View</span>
              <button id="gear-btn" class="MuiIconButton-root" type="button">Settings</button>
            </li>
            <li id="li-list" class="MuiButtonBase-root MuiMenuItem-root" role="menuitem" tabindex="-1">
              <span>List View</span>
            </li>
            <li id="li-disabled" class="MuiButtonBase-root MuiMenuItem-root Mui-disabled" aria-disabled="true" role="menuitem" tabindex="-1">
              <span>Disabled View</span>
            </li>
          </ul>
        </div>
      `;
      document.body.appendChild(popover);

      document.getElementById('li-grid').addEventListener('click', () => {
        window.__clicks.gridLi += 1;
      });
      document.getElementById('gear-btn').addEventListener('click', e => {
        e.stopPropagation();
        window.__clicks.gearBtn += 1;
      });
      document.getElementById('li-list').addEventListener('click', () => {
        window.__clicks.listLi += 1;
      });
      document.getElementById('li-disabled').addEventListener('click', () => {
        window.__clicks.disabledLi += 1;
      });
    });

    await page.waitForFunction(() => document.activeElement && document.activeElement.id === 'li-grid');

    const attrs = await page.evaluate(() => ({
      gridFocusable: document.getElementById('li-grid').classList.contains('focusable'),
      gridTabIndex: document.getElementById('li-grid').getAttribute('tabindex'),
      listFocusable: document.getElementById('li-list').classList.contains('focusable'),
      listTabIndex: document.getElementById('li-list').getAttribute('tabindex'),
      disabledFocusable: document.getElementById('li-disabled').classList.contains('focusable')
    }));
    assert.deepEqual(attrs, {
      gridFocusable: true,
      gridTabIndex: '0',
      listFocusable: true,
      listTabIndex: '0',
      disabledFocusable: false
    });

    // Press Enter on focused <li id="li-grid">
    await page.keyboard.press('Enter');
    assert.deepEqual(await page.evaluate(() => window.__clicks), {
      gridLi: 1,
      gearBtn: 0,
      listLi: 0,
      disabledLi: 0
    });

    // Press Space on <li id="li-list">
    await page.evaluate(() => document.getElementById('li-list').focus());
    await page.keyboard.press('Space');
    assert.deepEqual(await page.evaluate(() => window.__clicks), {
      gridLi: 1,
      gearBtn: 0,
      listLi: 1,
      disabledLi: 0
    });

    // Press GamepadA (keyCode 195) on <li id="li-grid">
    await page.evaluate(() => document.getElementById('li-grid').focus());
    await page.evaluate(() => {
      document.activeElement.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'GamepadA',
        keyCode: 195,
        which: 195,
        bubbles: true,
        cancelable: true
      }));
    });
    assert.deepEqual(await page.evaluate(() => window.__clicks), {
      gridLi: 2,
      gearBtn: 0,
      listLi: 1,
      disabledLi: 0
    });

    // Focus nested gear <button> and press Enter: only gearBtn increments
    await page.evaluate(() => document.getElementById('gear-btn').focus());
    assert.equal(await page.evaluate(() => document.activeElement.id), 'gear-btn');
    await page.keyboard.press('Enter');
    assert.deepEqual(await page.evaluate(() => window.__clicks), {
      gridLi: 2,
      gearBtn: 1,
      listLi: 1,
      disabledLi: 0
    });
  } finally {
    await page.close();
  }
});

test('3. GamepadB closes open #filter-popover and blocks window keydown back spy, but passes through when closed', async () => {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  try {
    await page.setContent(buildPageHtml({
      layoutClass: 'layout-tv',
      bodyHtml: `<button id="filter-trigger" type="button">Filter</button>`
    }));

    // Register Jellyfin-style window bubble spy BEFORE obsidian-xbox-nav.js loads
    await page.evaluate(() => {
      window.__windowBackSpyHits = [];
      window.addEventListener('keydown', e => {
        if (e.key === 'GamepadB' || e.keyCode === 196 || e.key === 'Escape' || e.keyCode === 27) {
          window.__windowBackSpyHits.push({ key: e.key, keyCode: e.keyCode });
        }
      });
    });

    await page.addScriptTag({ content: xboxNavScript });

    // Open #filter-popover from #filter-trigger
    await page.evaluate(() => {
      document.getElementById('filter-trigger').focus();
      const popover = document.createElement('div');
      popover.id = 'filter-popover';
      popover.className = 'MuiPopover-root MuiModal-root';
      popover.innerHTML = `
        <div class="MuiBackdrop-root"></div>
        <div class="MuiPopover-paper" tabindex="-1">
          <button id="acc-1" class="MuiButtonBase-root MuiAccordionSummary-root" type="button">Filters</button>
        </div>
      `;
      window.__escapeReceivedInModal = 0;
      popover.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
          window.__escapeReceivedInModal += 1;
          e.stopPropagation();
          popover.remove();
        }
      });
      document.body.appendChild(popover);
    });

    await page.waitForFunction(() => document.activeElement && document.activeElement.id === 'acc-1');

    // Dispatch GamepadB (keyCode 196) while #filter-popover is open
    await page.evaluate(() => {
      const target = document.activeElement || document.body;
      target.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'GamepadB',
        keyCode: 196,
        which: 196,
        bubbles: true,
        cancelable: true
      }));
    });

    await page.waitForFunction(() => !document.getElementById('filter-popover'));
    await page.waitForFunction(() => document.activeElement && document.activeElement.id === 'filter-trigger');

    assert.equal(await page.evaluate(() => window.__escapeReceivedInModal), 1);
    assert.deepEqual(
      await page.evaluate(() => window.__windowBackSpyHits),
      [],
      'GamepadB while popover is open must NOT reach Jellyfin window back listener'
    );

    // Also test backdrop fallback when Escape listener is NOT wired on modal
    await page.evaluate(() => {
      const popover = document.createElement('div');
      popover.id = 'filter-popover';
      popover.className = 'MuiPopover-root MuiModal-root';
      popover.innerHTML = `
        <div class="MuiBackdrop-root"></div>
        <div class="MuiPopover-paper" tabindex="-1">
          <button id="acc-fallback" class="MuiButtonBase-root MuiAccordionSummary-root" type="button">Filters</button>
        </div>
      `;
      popover.querySelector('.MuiBackdrop-root').addEventListener('click', () => {
        popover.remove();
      });
      document.body.appendChild(popover);
    });

    await page.waitForFunction(() => document.activeElement && document.activeElement.id === 'acc-fallback');
    await page.evaluate(() => {
      document.activeElement.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'GamepadB',
        keyCode: 196,
        which: 196,
        bubbles: true,
        cancelable: true
      }));
    });
    await page.waitForFunction(() => !document.getElementById('filter-popover'));
    assert.deepEqual(
      await page.evaluate(() => window.__windowBackSpyHits),
      [],
      'Backdrop fallback must close popover without leaking Escape/GamepadB to window spy'
    );

    // Now with NO popover/modal open, GamepadB MUST pass through to window spy
    await page.evaluate(() => {
      document.activeElement.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'GamepadB',
        keyCode: 196,
        which: 196,
        bubbles: true,
        cancelable: true
      }));
    });

    assert.deepEqual(await page.evaluate(() => window.__windowBackSpyHits), [
      { key: 'GamepadB', keyCode: 196 }
    ]);
  } finally {
    await page.close();
  }
});

test('4. ArrowDown / ArrowUp inside #filter-popover and #selectview-popover in .layout-desktop roves focus sequentially', async () => {
  const filterPage = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  try {
    await filterPage.setContent(buildPageHtml({
      layoutClass: 'layout-desktop',
      bodyHtml: `
        <div id="filter-popover" class="MuiPopover-root MuiModal-root">
          <div class="MuiBackdrop-root"></div>
          <div class="MuiPopover-paper" tabindex="-1">
            <div class="MuiAccordion-root">
              <button id="f-acc-1" class="MuiButtonBase-root MuiAccordionSummary-root" type="button">Filters</button>
              <div class="MuiCollapse-root">
                <div class="MuiAccordionDetails-root">
                  <label><input id="f-chk-1" type="checkbox"> Played</label>
                  <label><input id="f-chk-2" type="checkbox"> Unplayed</label>
                </div>
              </div>
            </div>
            <div class="MuiAccordion-root">
              <button id="f-acc-2" class="MuiButtonBase-root MuiAccordionSummary-root" type="button">Genres</button>
              <div class="MuiCollapse-root MuiCollapse-hidden">
                <div class="MuiAccordionDetails-root">
                  <label><input id="f-chk-collapsed" type="checkbox"> Hidden Genre</label>
                </div>
              </div>
            </div>
          </div>
        </div>
      `
    }));
    await filterPage.addScriptTag({ content: xboxNavScript });

    await filterPage.evaluate(() => document.getElementById('f-acc-1').focus());
    const filterForward = [];
    for (let i = 0; i < 4; i++) {
      await filterPage.keyboard.press('ArrowDown');
      filterForward.push(await filterPage.evaluate(() => document.activeElement.id));
    }
    assert.deepEqual(filterForward, ['f-chk-1', 'f-chk-2', 'f-acc-2', 'f-acc-1']);

    await filterPage.keyboard.press('ArrowUp');
    assert.equal(await filterPage.evaluate(() => document.activeElement.id), 'f-acc-2');
  } finally {
    await filterPage.close();
  }

  // Now test #selectview-popover in a fresh .layout-desktop page
  const viewPage = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  try {
    await viewPage.setContent(buildPageHtml({
      layoutClass: 'layout-desktop',
      bodyHtml: `
        <div id="selectview-popover" class="MuiPopover-root MuiModal-root">
          <div class="MuiBackdrop-root"></div>
          <div class="MuiPopover-paper" tabindex="-1">
            <ul class="MuiList-root">
              <li id="sv-grid" class="MuiButtonBase-root MuiMenuItem-root" role="menuitem" tabindex="-1">
                <span>Grid</span>
                <button id="sv-gear" type="button">Gear</button>
              </li>
              <li id="sv-primary" class="MuiButtonBase-root MuiMenuItem-root" role="menuitem" tabindex="-1">
                <span>Primary</span>
              </li>
              <li id="sv-list" class="MuiButtonBase-root MuiMenuItem-root" role="menuitem" tabindex="-1">
                <span>List</span>
              </li>
            </ul>
          </div>
        </div>
      `
    }));
    await viewPage.addScriptTag({ content: xboxNavScript });

    await viewPage.evaluate(() => {
      document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' }));
      document.querySelector('#selectview-popover .MuiPopover-paper').focus();
    });
    const viewForward = [];
    for (let i = 0; i < 4; i++) {
      await viewPage.keyboard.press('ArrowDown');
      viewForward.push(await viewPage.evaluate(() => document.activeElement.id));
    }
    assert.deepEqual(viewForward, ['sv-grid', 'sv-gear', 'sv-primary', 'sv-list']);

    await viewPage.keyboard.press('ArrowUp');
    assert.equal(await viewPage.evaluate(() => document.activeElement.id), 'sv-primary');
  } finally {
    await viewPage.close();
  }
});

test('5. Legacy .dialog.filterDialog.opened in .layout-tv focuses first visible control when activeElement is body', async () => {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  try {
    await page.setContent(buildPageHtml({
      layoutClass: 'layout-tv',
      bodyHtml: `<div id="app"></div>`
    }));
    await page.addScriptTag({ content: xboxNavScript });

    await page.evaluate(() => {
      const dlg = document.createElement('div');
      dlg.className = 'dialog filterDialog opened';
      dlg.innerHTML = `
        <div class="filterDialogContent">
          <button id="legacy-collapsible" class="emby-collapsible-button" type="button">Features</button>
          <input id="legacy-chk" type="checkbox">
        </div>
      `;
      document.body.appendChild(dlg);
    });

    await page.waitForFunction(() => document.activeElement && document.activeElement.id === 'legacy-collapsible');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'legacy-collapsible');
  } finally {
    await page.close();
  }
});
