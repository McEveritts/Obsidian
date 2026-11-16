const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { before, after, test } = require('node:test');
const { chromium } = require('playwright');

const {
  runAudit,
  checkUpstreamExistence
} = require('./precise_audit');

const theme = fs.readFileSync(
  process.env.OBSIDIAN_STYLESHEET || path.join(__dirname, '..', 'obsidian.css'),
  'utf8'
);

// Stock upstream Jellyfin styles (emby-button.scss, loading.scss, emby-progressring.scss,
// emby-toggle.scss, emby-select.scss, dashboard.scss)
const upstreamBaseStyles = `
  body { margin: 0; font-size: 16px; background: #101010; color: #fff; }
  .hide { display: none !important; }
  .emby-button {
    position: relative; display: inline-flex; align-items: center; box-sizing: border-box;
    margin: 0.3em; text-align: center; font-size: inherit; font-family: inherit; color: inherit;
    outline: none !important; cursor: pointer; padding: 0.9em 1em; border: 0; border-radius: 0.2em;
    font-weight: 600; line-height: 1.35; transform-origin: center; transition: 0.2s;
  }
  .emby-button.show-focus:focus { transform: scale(1.2); z-index: 1; }
  .emby-button.block { display: block; width: 100%; margin: 0.25em 0; }
  .fab { display: inline-flex; border-radius: 50%; padding: 0.6em; box-sizing: border-box; align-items: center; justify-content: center; }
  .paper-icon-button-light {
    position: relative; display: inline-flex; align-items: center; justify-content: center;
    box-sizing: border-box; padding: 0.556em; border: 0; outline: none !important; border-radius: 50%;
    background: transparent; color: inherit; transition: 0.2s;
  }
  .paper-icon-button-light.show-focus:focus { transform: scale(1.3); z-index: 1; }
  a[data-role=button] {
    background: #292929; cursor: pointer !important; font-weight: 500 !important;
    margin: 0 0.25em !important; display: inline-block; padding: 0.8em 1em; text-decoration: none !important;
  }
  div[data-role=controlgroup] a.ui-btn-active { background: #00a4dc !important; color: #292929 !important; }
  .mdl-spinner { position: relative; width: 1.95em; height: 1.95em; display: none; }
  .mdlSpinnerActive { display: inline-block; }
  .mdl-spinner__layer-1, .mdl-spinner__layer-2, .mdl-spinner__layer-3, .mdl-spinner__layer-4 { border-color: #00a4dc; }
  .progressring { position: relative; width: 2.6em; height: 2.6em; box-sizing: border-box; }
  .progressring-bg { width: 100%; height: 100%; border-radius: 50%; border: 0.25em solid rgba(0,0,0,1); background: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center; }
  .progressring-text { text-align: center; color: #ddd; font-size: 90%; }
  .progressring-spiner { width: 200%; height: 200%; border-radius: 50%; border-width: 0.25em; border-style: solid; }
  .mdl-switch { position: relative; display: inline-flex; align-items: center; width: 100%; flex-direction: row-reverse; justify-content: flex-end; }
  .mdl-switch__input { width: 0; height: 0; opacity: 0; appearance: none; border: none; }
  .mdl-switch__trackContainer { position: relative; width: 2.9em; }
  .mdl-switch__track { background: rgba(128, 128, 128, 0.5); height: 1em; border-radius: 1em; }
  .mdl-switch__input:checked + .mdl-switch__label + .mdl-switch__trackContainer > .mdl-switch__track { background: rgba(0, 164, 220, 0.5); }
  .mdl-switch__thumb { background: #999; position: absolute; top: -0.25em; left: 0; height: 1.44em; width: 1.44em; border-radius: 50%; }
  .mdl-switch__input:checked + .mdl-switch__label + .mdl-switch__trackContainer > .mdl-switch__thumb { background: #00a4dc; left: 1.466em; }
  .mdl-switch__focus-helper { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 0.6em; height: 0.6em; border-radius: 50%; }
  .mdl-switch__input:checked:focus + .mdl-switch__label + .mdl-switch__trackContainer .mdl-switch__focus-helper { box-shadow: 0 0 0 1.39em rgba(0, 164, 220, 0.26); background-color: rgba(0, 164, 220, 0.26); }
  .mdl-switch__label { margin-left: 0.7em; }
  progress { appearance: none; margin: 0; background: #ccc !important; border-radius: 0.2em; border: none; width: 180px; height: 10px; }
  progress::-webkit-progress-bar { background: #ccc; }
  progress::-moz-progress-bar { background-color: #00a4dc; }
  progress::-webkit-progress-value { background-color: #00a4dc; }
  .playbackProgress > div { height: 6px; background-color: #00a4dc; }
  .emby-select { display: block; width: 100%; box-sizing: border-box; outline: none !important; padding: 0.5em 1.9em 0.5em 0.5em; }
  .emby-select-withcolor { appearance: none; border-radius: 0.2em; }
  .emby-select-focusscale:focus { transform: scale(1.04); z-index: 1; }
`;

// Late-loaded Jellyfin _theme.scss rules (loaded AFTER obsidian.css in Jellyfin Web)
const lateLoadedThemeStyles = `
  :root {
    --jf-palette-primary-main: #00a4dc;
    --jf-palette-primary-contrastText: rgba(0, 0, 0, 0.87);
    --jf-palette-secondary-main: #00a4dc;
    --jf-palette-secondary-contrastText: rgba(0, 0, 0, 0.87);
    --jf-palette-error-main: #c62828;
    --jf-palette-error-light: #d15353;
    --jf-palette-error-contrastText: #fff;
    --jf-palette-Button-inheritContainedBg: #424242;
    --jf-palette-Button-inheritContainedHoverBg: #616161;
    --jf-card-borderRadius: 0.2em;
  }
  a[data-role="button"], .fab, .raised {
    background: var(--jf-palette-Button-inheritContainedBg, #424242);
    color: var(--jf-palette-text-secondary, rgba(255, 255, 255, 0.7));
  }
  a[data-role="button"]:hover, .fab:hover, .raised:hover {
    background: var(--jf-palette-Button-inheritContainedHoverBg, #616161);
  }
  a[data-role="button"]:focus, .fab:focus, .raised:focus {
    background: var(--jf-palette-secondary-main, #00a4dc);
  }
  .button-submit {
    background: var(--jf-palette-primary-main, #00a4dc);
    color: var(--jf-palette-primary-contrastText, rgba(0, 0, 0, 0.87));
  }
  .button-submit:focus {
    background: var(--jf-palette-secondary-main, #00a4dc);
    color: var(--jf-palette-secondary-contrastText, rgba(0, 0, 0, 0.87));
  }
  .button-delete {
    background: var(--jf-palette-error-main, #c62828);
    color: var(--jf-palette-error-contrastText, #fff);
  }
  .emby-button.show-focus:focus {
    background: var(--jf-palette-primary-main, #00a4dc);
    color: var(--jf-palette-primary-contrastText, rgba(0, 0, 0, 0.87));
  }
  .emby-select-withcolor {
    background: var(--jf-palette-background-paper, #202020);
    border: 0.16em solid rgba(255, 255, 255, 0.09);
    color: inherit;
    border-radius: 0.2em;
  }
  .emby-select-withcolor:focus {
    border-color: var(--jf-palette-secondary-main, #00a4dc) !important;
  }
  .emby-select-tv-withcolor:focus {
    background-color: var(--jf-palette-secondary-main, #00a4dc) !important;
    color: var(--jf-palette-secondary-contrastText, rgba(0, 0, 0, 0.87)) !important;
  }
  .progressring-spiner {
    border-color: var(--jf-palette-primary-main, #00a4dc);
  }
`;

const fixtureHtml = `<!doctype html>
<html dir="ltr">
<head>
  <meta charset="utf-8">
  <style>${upstreamBaseStyles}</style>
  <style>${theme}</style>
  <style>${lateLoadedThemeStyles}</style>
</head>
<body>
  <main style="padding: 24px; max-width: 680px;">
    <button id="btn-raised" is="emby-button" type="button" class="raised emby-button">Detect My Devices</button>
    <a id="btn-role" data-role="button" href="#scan">Scan All Libraries</a>
    <div data-role="controlgroup">
      <a id="btn-cg-active" data-role="button" class="ui-btn-active" href="#active">Active Tab</a>
      <a id="btn-cg-idle" data-role="button" href="#idle">Idle Tab</a>
    </div>
    <button id="btn-fab" is="emby-button" type="button" class="fab emby-button" title="Add">+</button>
    <button id="btn-submit" is="emby-button" type="submit" class="raised button-submit emby-button">Save</button>
    <button id="btn-delete" is="emby-button" type="button" class="raised button-delete emby-button">Delete Media</button>
    <button id="btn-hidden-submit" is="emby-button" type="submit" class="raised button-submit block hide emby-button">Hidden Save</button>

    <div class="dialog formDialog" style="position: relative; padding: 16px; margin-top: 16px;">
      <button id="dlg-submit" is="emby-button" type="submit" class="raised button-submit emby-button">Confirm</button>
      <button id="dlg-delete" is="emby-button" type="button" class="raised button-delete emby-button">Remove</button>
    </div>

    <button id="btn-tv-focus" is="emby-button" type="button" class="emby-button show-focus">TV Action</button>
    <button id="btn-tv-icon" is="emby-button" type="button" class="paper-icon-button-light show-focus">★</button>

    <div id="spinner" class="mdl-spinner mdlSpinnerActive">
      <div class="mdl-spinner__layer mdl-spinner__layer-1"></div>
      <div class="mdl-spinner__layer mdl-spinner__layer-2"></div>
      <div class="mdl-spinner__layer mdl-spinner__layer-3"></div>
      <div class="mdl-spinner__layer mdl-spinner__layer-4"></div>
    </div>

    <div id="progressring" class="progressring">
      <div class="progressring-bg"><div class="progressring-text">74%</div></div>
      <div class="progressring-spiner"></div>
    </div>

    <label id="switch-off-wrap" class="mdl-switch">
      <input id="switch-off" is="emby-toggle" type="checkbox" class="mdl-switch__input">
      <span class="toggleButtonLabel mdl-switch__label">Enable Cinema Mode</span>
      <div class="mdl-switch__trackContainer">
        <div class="mdl-switch__track"></div>
        <div class="mdl-switch__thumb"><span class="mdl-switch__focus-helper"></span></div>
      </div>
    </label>

    <label id="switch-on-wrap" class="mdl-switch">
      <input id="switch-on" is="emby-toggle" type="checkbox" class="mdl-switch__input" checked>
      <span class="toggleButtonLabel mdl-switch__label">Hardware Acceleration</span>
      <div class="mdl-switch__trackContainer">
        <div class="mdl-switch__track"></div>
        <div class="mdl-switch__thumb"><span class="mdl-switch__focus-helper"></span></div>
      </div>
    </label>

    <progress id="native-progress" value="65" max="100"></progress>
    <div class="playbackProgress"><div id="session-progress" style="width: 50%"></div></div>

    <div style="margin-top: 16px; width: 260px;">
      <select id="select-color" is="emby-select" class="emby-select emby-select-withcolor">
        <option value="4k">4K HDR (60 Mbps)</option>
        <option value="1080p">1080p (20 Mbps)</option>
      </select>
      <select id="select-tv" is="emby-select" class="emby-select emby-select-withcolor emby-select-tv-withcolor emby-select-focusscale">
        <option value="eng">English (PGS)</option>
      </select>
    </div>
  </main>
</body>
</html>`;

let browser;

before(async () => {
  browser = await chromium.launch({
    executablePath: process.env.OBSIDIAN_CHROMIUM_PATH || undefined,
    args: ['--no-sandbox']
  });
});

after(async () => {
  if (browser) await browser.close();
});

test('precise_audit passes all Obsidian modules and detects MUI named imports while rejecting bogus selectors', () => {
  const prevEnv = process.env.OBSIDIAN_UPSTREAM_DIR;
  try {
    if (!process.env.OBSIDIAN_UPSTREAM_DIR && fs.existsSync('/tmp/jellyfin-web/src')) {
      process.env.OBSIDIAN_UPSTREAM_DIR = '/tmp/jellyfin-web/src';
    }

    if (process.env.OBSIDIAN_UPSTREAM_DIR) {
      assert.equal(runAudit(), true, 'Selector contract audit must pass with 0 dead selectors');
      assert.notEqual(checkUpstreamExistence('MuiRadio-root', false).status, 'DEAD');
      assert.equal(checkUpstreamExistence('MuiFake-root', false).status, 'DEAD');
      assert.equal(checkUpstreamExistence('nonExistentJellyfinClassXYZ', false).status, 'DEAD');
      assert.equal(checkUpstreamExistence('nonExistentJellyfinIdXYZ', true).status, 'DEAD');
    }

    // Synthetic named-import fixture verification for @mui/material barrel imports
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'obs-mui-audit-'));
    try {
      fs.writeFileSync(
        path.join(tmpDir, 'RadioSortMenu.tsx'),
        "import {\n  RadioGroup,\n  Radio,\n} from '@mui/material';\nexport const X = () => <Radio />;\n",
        'utf8'
      );
      process.env.OBSIDIAN_UPSTREAM_DIR = tmpDir;
      assert.equal(
        checkUpstreamExistence('MuiRadio-root', false).status,
        'exists_mui_component',
        'Named @mui/material Radio import must resolve MuiRadio-root'
      );
      assert.equal(
        checkUpstreamExistence('MuiFake-root', false).status,
        'DEAD',
        'Unmapped fake MuiFake-root must still fail as DEAD'
      );
      assert.equal(
        checkUpstreamExistence('MuiAccordion-root', false).status,
        'DEAD',
        'Unimported MUI component must fail as DEAD when absent from upstream'
      );
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  } finally {
    if (prevEnv === undefined) {
      delete process.env.OBSIDIAN_UPSTREAM_DIR;
    } else {
      process.env.OBSIDIAN_UPSTREAM_DIR = prevEnv;
    }
  }
});

test(':root --jf-palette-* and --mui-palette-* contrast tokens override late-loaded stock theme variables', async () => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  try {
    await page.setContent(fixtureHtml);
    const vars = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      const read = name => root.getPropertyValue(name).trim();
      return {
        jfPrimaryContrast: read('--jf-palette-primary-contrastText'),
        jfSecondaryContrast: read('--jf-palette-secondary-contrastText'),
        muiPrimaryContrast: read('--mui-palette-primary-contrastText'),
        muiSecondaryContrast: read('--mui-palette-secondary-contrastText'),
        jfErrorMain: read('--jf-palette-error-main'),
        jfErrorLight: read('--jf-palette-error-light'),
        jfErrorContrast: read('--jf-palette-error-contrastText'),
        jfTextPrimary: read('--jf-palette-text-primary'),
        jfTextSecondary: read('--jf-palette-text-secondary'),
        jfBtnBg: read('--jf-palette-Button-inheritContainedBg'),
        jfBtnHoverBg: read('--jf-palette-Button-inheritContainedHoverBg'),
        jfSnackbarBg: read('--jf-palette-SnackbarContent-bg'),
        jfSnackbarColor: read('--jf-palette-SnackbarContent-color'),
        jfAlertBg: read('--jf-palette-Alert-infoFilledBg'),
        jfAlertColor: read('--jf-palette-Alert-infoFilledColor'),
        jfCardRadius: read('--jf-card-borderRadius')
      };
    });

    assert.equal(vars.jfPrimaryContrast, '#ffffff');
    assert.equal(vars.jfSecondaryContrast, '#ffffff');
    assert.equal(vars.muiPrimaryContrast, '#ffffff');
    assert.equal(vars.muiSecondaryContrast, '#ffffff');
    assert.equal(vars.jfErrorMain, '#f43f5e');
    assert.equal(vars.jfErrorLight, '#fb7185');
    assert.equal(vars.jfErrorContrast, '#ffffff');
    assert.equal(vars.jfTextPrimary, '#ffffff');
    assert.equal(vars.jfTextSecondary, '#cbd5e1');
    assert.equal(vars.jfBtnBg, 'rgba(15, 23, 42, 0.78)');
    assert.equal(vars.jfBtnHoverBg, 'rgba(99, 102, 241, 0.22)');
    assert.equal(vars.jfSnackbarBg, 'rgba(12, 16, 28, 0.92)');
    assert.equal(vars.jfSnackbarColor, '#f8fafc');
    assert.equal(vars.jfAlertBg, 'rgba(15, 23, 42, 0.88)');
    assert.equal(vars.jfAlertColor, '#e2e8f0');
    assert.equal(vars.jfCardRadius, '1rem');
  } finally {
    await page.close();
  }
});

test('Unscoped .raised, a[data-role="button"], .fab, .button-submit, .button-delete, and TV .emby-button.show-focus:focus', async () => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  try {
    await page.setContent(fixtureHtml);

    const baseMetrics = await page.evaluate(() => {
      const inspect = id => {
        const el = document.getElementById(id);
        const s = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return {
          display: s.display,
          bgColor: s.backgroundColor,
          bgImage: s.backgroundImage,
          color: s.color,
          borderRadius: s.borderRadius,
          width: r.width,
          height: r.height
        };
      };
      return {
        raised: inspect('btn-raised'),
        roleBtn: inspect('btn-role'),
        cgActive: inspect('btn-cg-active'),
        fab: inspect('btn-fab'),
        submit: inspect('btn-submit'),
        del: inspect('btn-delete'),
        hiddenSubmit: inspect('btn-hidden-submit')
      };
    });

    assert.equal(baseMetrics.raised.bgColor, 'rgba(15, 23, 42, 0.75)');
    assert.equal(baseMetrics.raised.color, 'rgb(226, 232, 240)');
    assert.equal(baseMetrics.raised.borderRadius, '12px');
    assert.ok(baseMetrics.raised.height >= 44);

    assert.equal(baseMetrics.roleBtn.bgColor, 'rgba(15, 23, 42, 0.75)');
    assert.equal(baseMetrics.roleBtn.borderRadius, '12px');
    assert.ok(baseMetrics.roleBtn.height >= 44);

    assert.ok(baseMetrics.cgActive.bgImage.includes('linear-gradient'), 'Controlgroup active tab must replace #00a4dc with Obsidian gradient');
    assert.equal(baseMetrics.cgActive.color, 'rgb(255, 255, 255)');

    assert.ok(baseMetrics.fab.width >= 44 && baseMetrics.fab.height >= 44);
    assert.ok(parseFloat(baseMetrics.fab.borderRadius) >= 22);

    assert.ok(baseMetrics.submit.bgImage.includes('linear-gradient'));
    assert.ok(baseMetrics.submit.bgImage.includes('99, 102, 241') && baseMetrics.submit.bgImage.includes('217, 70, 239'));
    assert.equal(baseMetrics.submit.color, 'rgb(255, 255, 255)');
    assert.equal(baseMetrics.submit.borderRadius, '12px');
    assert.ok(baseMetrics.submit.height >= 44);

    assert.ok(baseMetrics.del.bgImage.includes('linear-gradient'));
    assert.ok(baseMetrics.del.bgImage.includes('244, 63, 94') && baseMetrics.del.bgImage.includes('225, 29, 72'));
    assert.equal(baseMetrics.del.color, 'rgb(255, 255, 255)');
    assert.equal(baseMetrics.del.borderRadius, '12px');
    assert.ok(baseMetrics.del.height >= 44);

    assert.equal(baseMetrics.hiddenSubmit.display, 'none', '.hide on .button-submit must stay hidden');

    // Pointer hover glow on .raised
    await page.locator('#btn-raised').hover();
    const hoverRaised = await page.locator('#btn-raised').evaluate(el => {
      const s = getComputedStyle(el);
      return { bgColor: s.backgroundColor, color: s.color, boxShadow: s.boxShadow };
    });
    assert.equal(hoverRaised.color, 'rgb(255, 255, 255)');
    assert.ok(hoverRaised.boxShadow.includes('99, 102, 241'));

    // Focus states on .button-delete (both standalone and inside .formDialog) keep rose-crimson CTA
    for (const id of ['btn-delete', 'dlg-delete']) {
      await page.locator(`#${id}`).focus();
      const delFocus = await page.locator(`#${id}`).evaluate(el => {
        const s = getComputedStyle(el);
        return { bgImage: s.backgroundImage, color: s.color, outlineColor: s.outlineColor, transform: s.transform };
      });
      assert.ok(delFocus.bgImage.includes('244, 63, 94'), `${id} focus must preserve rose-crimson gradient`);
      assert.equal(delFocus.color, 'rgb(255, 255, 255)');
      assert.equal(delFocus.outlineColor, 'rgb(251, 113, 133)');
      assert.equal(delFocus.transform, 'none');
    }

    // TV/Xbox .emby-button.show-focus:focus and .paper-icon-button-light.show-focus:focus neutralization
    for (const id of ['btn-tv-focus', 'btn-tv-icon']) {
      await page.locator(`#${id}`).focus();
      const tvFocus = await page.locator(`#${id}`).evaluate(el => {
        const s = getComputedStyle(el);
        return {
          color: s.color,
          transform: s.transform,
          outlineStyle: s.outlineStyle,
          outlineWidth: parseFloat(s.outlineWidth),
          outlineColor: s.outlineColor
        };
      });
      assert.equal(tvFocus.color, 'rgb(255, 255, 255)', `${id} must neutralize dark contrastText`);
      assert.equal(tvFocus.transform, 'none', `${id} must neutralize scale(1.2)/scale(1.3) jump`);
      assert.equal(tvFocus.outlineStyle, 'solid');
      assert.ok(tvFocus.outlineWidth >= 2);
      assert.equal(tvFocus.outlineColor, 'rgb(165, 180, 252)');
    }
  } finally {
    await page.close();
  }
});

test('Spinners, progress rings, legacy .mdl-switch toggles, native <progress>, and .emby-select-withcolor eliminate #00a4dc', async () => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  try {
    await page.setContent(fixtureHtml);

    const states = await page.evaluate(() => {
      const layerColors = [1, 2, 3, 4].map(n =>
        getComputedStyle(document.querySelector(`.mdl-spinner__layer-${n}`)).borderTopColor
      );
      const ringBg = getComputedStyle(document.querySelector('.progressring-bg')).backgroundColor;
      const ringArc = getComputedStyle(document.querySelector('.progressring-spiner')).borderTopColor;
      const ringNumeric = getComputedStyle(document.querySelector('.progressring-text')).fontVariantNumeric;

      const offTrack = getComputedStyle(document.querySelector('#switch-off-wrap .mdl-switch__track')).backgroundColor;
      const offThumb = getComputedStyle(document.querySelector('#switch-off-wrap .mdl-switch__thumb')).backgroundColor;
      const onTrack = getComputedStyle(document.querySelector('#switch-on-wrap .mdl-switch__track')).backgroundImage;
      const onThumb = getComputedStyle(document.querySelector('#switch-on-wrap .mdl-switch__thumb')).backgroundColor;

      const prog = getComputedStyle(document.getElementById('native-progress'));
      const sessionProg = getComputedStyle(document.getElementById('session-progress')).backgroundImage;
      const progressPseudoRules = {};
      for (const sheet of document.styleSheets) {
        for (const rule of sheet.cssRules) {
          if (rule.selectorText === 'progress::-webkit-progress-bar') {
            progressPseudoRules.webkitBar = rule.style.background || rule.style.backgroundColor;
          } else if (rule.selectorText === 'progress::-webkit-progress-value') {
            progressPseudoRules.webkitValue = rule.style.background || rule.style.backgroundImage;
          }
        }
      }

      const sel = document.getElementById('select-color');
      const selStyle = getComputedStyle(sel);
      const selRect = sel.getBoundingClientRect();

      return {
        layerColors,
        ringBg,
        ringArc,
        ringNumeric,
        offTrack,
        offThumb,
        onTrack,
        onThumb,
        progAppearance: prog.appearance,
        progBg: prog.backgroundColor,
        progressPseudoRules,
        sessionProg,
        selBg: selStyle.backgroundColor,
        selRadius: selStyle.borderRadius,
        selHeight: selRect.height
      };
    });

    const cyan = 'rgb(0, 164, 220)';
    assert.ok(states.layerColors.every(c => c !== cyan), 'No spinner layer may leak #00a4dc');
    assert.deepEqual(states.layerColors, [
      'rgb(129, 140, 248)',
      'rgb(232, 121, 249)',
      'rgb(56, 189, 248)',
      'rgb(165, 180, 252)'
    ]);

    assert.equal(states.ringBg, 'rgba(12, 16, 28, 0.88)');
    assert.equal(states.ringArc, 'rgb(129, 140, 248)');
    assert.equal(states.ringNumeric, 'tabular-nums');

    assert.equal(states.offTrack, 'rgba(30, 41, 59, 0.88)');
    assert.equal(states.offThumb, 'rgb(203, 213, 225)');
    assert.ok(states.onTrack.includes('linear-gradient') && states.onTrack.includes('99, 102, 241'));
    assert.equal(states.onThumb, 'rgb(255, 255, 255)');

    await page.locator('#switch-on').focus();
    const switchFocus = await page.locator('#switch-on-wrap .mdl-switch__thumb').evaluate(el => {
      const s = getComputedStyle(el);
      return { outlineStyle: s.outlineStyle, outlineWidth: parseFloat(s.outlineWidth), boxShadow: s.boxShadow };
    });
    assert.equal(switchFocus.outlineStyle, 'solid');
    assert.ok(switchFocus.outlineWidth >= 2);
    assert.ok(switchFocus.boxShadow.includes('99, 102, 241'));

    assert.equal(states.progAppearance, 'none');
    assert.equal(states.progBg, 'rgba(15, 23, 42, 0.78)');
    assert.ok(states.progressPseudoRules.webkitBar.includes('15, 23, 42'), '::-webkit-progress-bar must use dark slate glass');
    assert.ok(states.progressPseudoRules.webkitValue.includes('linear-gradient'), '::-webkit-progress-value must use Obsidian gradient');
    const activeCss = theme.replace(/\/\*[\s\S]*?\*\//g, '');
    assert.ok(!activeCss.toLowerCase().includes('#00a4dc'), 'Compiled obsidian.css must contain zero active #00a4dc declarations');
    assert.ok(theme.includes('progress::-moz-progress-bar'), 'Compiled obsidian.css must include Firefox progress fill selector');
    assert.ok(states.sessionProg.includes('linear-gradient'));

    assert.equal(states.selBg, 'rgba(0, 0, 0, 0.45)');
    assert.equal(states.selRadius, '12px');
    assert.ok(states.selHeight >= 44);

    // Focus both .emby-select-withcolor and .emby-select-tv-withcolor (must beat late-loaded _theme.scss !important)
    for (const id of ['select-color', 'select-tv']) {
      await page.locator(`#${id}`).focus();
      const selFocus = await page.locator(`#${id}`).evaluate(el => {
        const s = getComputedStyle(el);
        return {
          bgColor: s.backgroundColor,
          color: s.color,
          borderColor: s.borderTopColor,
          outlineStyle: s.outlineStyle,
          outlineWidth: parseFloat(s.outlineWidth),
          transform: s.transform
        };
      });
      assert.equal(selFocus.bgColor, 'rgba(0, 0, 0, 0.65)', `${id} focus must keep dark glass well`);
      assert.equal(selFocus.color, 'rgb(255, 255, 255)', `${id} focus must keep crisp white text`);
      assert.equal(selFocus.borderColor, 'rgb(129, 140, 248)');
      assert.equal(selFocus.outlineStyle, 'solid');
      assert.ok(selFocus.outlineWidth >= 2);
      assert.equal(selFocus.transform, 'none');
    }
  } finally {
    await page.close();
  }
});

test('Global controls remain high-contrast and operable under forced-colors: active and prefers-reduced-motion: reduce', async () => {
  const page = await browser.newPage({
    viewport: { width: 800, height: 900 },
    forcedColors: 'active',
    reducedMotion: 'reduce'
  });
  try {
    await page.setContent(fixtureHtml);

    const surfaces = await page.evaluate(() => {
      const read = sel => {
        const s = getComputedStyle(document.querySelector(sel));
        return {
          bgColor: s.backgroundColor,
          bgImage: s.backgroundImage,
          color: s.color,
          boxShadow: s.boxShadow,
          transitionDuration: s.transitionDuration
        };
      };
      return {
        raised: read('#btn-raised'),
        submit: read('#btn-submit'),
        del: read('#btn-delete'),
        select: read('#select-color'),
        switchTrackOn: read('#switch-on-wrap .mdl-switch__track'),
        switchTrackOff: read('#switch-off-wrap .mdl-switch__track'),
        progress: read('#native-progress')
      };
    });

    for (const [name, s] of Object.entries(surfaces)) {
      assert.equal(s.bgImage, 'none', `${name} must strip gradient in forced-colors`);
      assert.equal(s.boxShadow, 'none', `${name} must strip box-shadow glow in forced-colors`);
    }
    assert.notEqual(surfaces.submit.bgColor, surfaces.raised.bgColor, 'Primary submit must stay distinct from neutral raised button');
    assert.notEqual(surfaces.switchTrackOn.bgColor, surfaces.switchTrackOff.bgColor, 'Checked switch track must stay distinct from unchecked track');
    assert.equal(surfaces.raised.transitionDuration, '0s');
    assert.equal(surfaces.submit.transitionDuration, '0s');

    for (const selector of ['#btn-raised', '#btn-submit', '#btn-delete', '#btn-tv-focus', '#select-tv']) {
      await page.locator(selector).focus();
      const focus = await page.locator(selector).evaluate(el => {
        const s = getComputedStyle(el);
        return { outlineStyle: s.outlineStyle, outlineWidth: parseFloat(s.outlineWidth), boxShadow: s.boxShadow };
      });
      assert.equal(focus.outlineStyle, 'solid', `${selector} must keep solid forced-colors focus outline`);
      assert.ok(focus.outlineWidth >= 2);
      assert.equal(focus.boxShadow, 'none');
    }

    await page.locator('#switch-on').focus();
    const switchThumbFocus = await page.locator('#switch-on-wrap .mdl-switch__thumb').evaluate(el => {
      const s = getComputedStyle(el);
      return { outlineStyle: s.outlineStyle, outlineWidth: parseFloat(s.outlineWidth), boxShadow: s.boxShadow };
    });
    assert.equal(switchThumbFocus.outlineStyle, 'solid');
    assert.ok(switchThumbFocus.outlineWidth >= 2);
    assert.equal(switchThumbFocus.boxShadow, 'none');
  } finally {
    await page.close();
  }
});
