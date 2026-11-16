const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { before, after, test } = require('node:test');
const { chromium } = require('playwright');

const ROOT_DIR = path.join(__dirname, '..');
const theme = fs.readFileSync(process.env.OBSIDIAN_STYLESHEET || path.join(ROOT_DIR, 'obsidian.css'), 'utf8');

const upstreamStyles = `
  html, body { margin: 0; padding: 0; font-size: 16px; }
  .hide { display: none !important; }
  .flex { display: flex; }
  .align-items-center { align-items: center; }
  .justify-content-center { justify-content: center; }
  .flex-grow { flex-grow: 1; }
  .padded-left { padding-left: 3.3%; }
  .padded-right { padding-right: 3.3%; }

  /* Upstream card.scss & indicators.scss defaults */
  .itemsContainer { display: flex; }
  .card { position: relative; width: 180px; flex-shrink: 0; contain: layout style paint; }
  .cardBox { margin: 0.6em; padding: 0; position: relative; }
  .cardScalable { position: relative; }
  .cardPadder-portrait, .cardPadder-overflowPortrait { padding-bottom: 150%; position: relative; }
  .cardContent, .cardImageContainer { position: absolute; inset: 0; background-size: cover; background-position: center center; }
  .cardOverlayContainer { position: absolute; inset: 0; opacity: 0; }
  .cardIndicators { position: absolute; top: 0.225em; right: 0.225em; display: flex; align-items: center; z-index: 2; }
  [dir="rtl"] .cardIndicators { right: auto; left: 0.225em; }
  .indicator { border-radius: 100em; display: flex; align-items: center; justify-content: center; width: 2em; height: 2em; }
  .indicator + .indicator { margin-left: 0.25em; }
  [dir="rtl"] .indicator + .indicator { margin-left: 0; margin-right: 0.25em; }
  .mediaSourceIndicator { display: flex; position: absolute; align-items: center; justify-content: center; top: 0.3em; left: 0.3em; width: 2em; height: 2em; border-radius: 50%; color: #fff; background: rgb(51, 136, 204); z-index: 2; }
  .innerCardFooter { position: absolute; bottom: 0; left: 0; right: 0; z-index: 2; }
  .itemProgressBar { background: rgba(51, 51, 51, 0.8); position: relative; height: 0.28em; }
  .itemProgressBarForeground { position: absolute; top: 0; bottom: 0; left: 0; background-color: #00a4dc; }
  .itemProgressBarForeground-recording { background-color: #cb272a; }
  .cardText { padding: 0.06em 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .cardTextCentered { text-align: center; }
  .textActionButton { background: transparent; border: 0; color: inherit; text-decoration: none; }

  /* Simulate rounded-person-cards theme conflict to verify clean Obsidian portrait normalization */
  .personCard .cardScalable { border-radius: 50%; }
  .personCard .cardOverlayContainer { clip-path: circle(50% at 50% 50%); }
  .defaultCardBackground1 { background-color: #44bae1; }

  /* Upstream detailtable.scss */
  .detailTableBodyCell, .detailTableHeaderCell { border-spacing: 0; padding: 0.4em; }
  .detailTable { border-collapse: collapse; border-spacing: 0; text-align: left; width: 100%; margin: 0 auto; }
  .detailTableHeaderCell { font-weight: 700; text-align: left; vertical-align: top; }

  /* Upstream searchfields.scss & emby-input.scss */
  .searchFieldsInner { max-width: 60em; margin: 0 auto; }
  .searchfields-icon { margin-bottom: 0.1em; margin-right: 0.25em; font-size: 2em; align-self: flex-end; color: #aaa; }
  .inputContainer { margin-bottom: 1.8em; }
  .inputLabel { display: inline-block; margin-bottom: 0.25em; }
  .emby-input { display: block; margin: 0; width: 100%; box-sizing: border-box; font-size: 110%; padding: 0.4em 0.25em; }

  /* Upstream upnextdialog.scss snippet for preset parity check */
  .upNextContainer { position: fixed; right: 1rem; bottom: 1rem; width: 24rem; transition: opacity 0.3s ease-out; }
`;

const fixture = `<!doctype html>
<html dir="ltr">
<head>
  <meta charset="utf-8"/>
  <style>${upstreamStyles}</style>
  <style>${theme}</style>
</head>
<body>
  <!-- Search Input Bar Fixture (matches SearchFields.tsx + Input.tsx) -->
  <div class="padded-left padded-right searchFields" data-testid="search-wrapper">
    <div class="searchFieldsInner flex align-items-center justify-content-center" data-testid="search-inner">
      <span class="searchfields-icon material-icons search" aria-hidden="true" data-testid="search-icon">⌕</span>
      <div class="inputContainer flex-grow" style="margin-bottom: 0;">
        <label for="searchTextInput" class="inputLabel inputLabelUnfocused"></label>
        <input id="searchTextInput" class="emby-input searchfields-txtSearch" type="text" placeholder="Search" value="Blade Runner" />
      </div>
    </div>
  </div>

  <!-- Media Card Indicators & Recording Progress Fixture -->
  <div class="itemsContainer" style="flex-wrap: wrap; padding: 1rem;">
    <div class="card portraitCard card-hoverable" data-testid="media-card">
      <div class="cardBox">
        <div class="cardScalable">
          <div class="cardPadder cardPadder-portrait"></div>
          <div class="cardImageContainer coveredImage" style="background-color: #111827;"></div>
          <div class="mediaSourceIndicator" data-testid="media-source-badge">3</div>
          <div class="cardIndicators">
            <div class="countIndicator indicator" data-testid="count-badge">4</div>
            <div class="syncIndicator indicator fullSyncIndicator" data-testid="sync-badge">
              <svg width="16" height="16" viewBox="0 0 24 24"><path d="M5 20h14v-2H5v2z"/></svg>
            </div>
          </div>
          <div class="innerCardFooter fullInnerCardFooter">
            <div is="emby-progressbar" class="itemProgressBar">
              <div class="itemProgressBarForeground itemProgressBarForeground-recording" data-testid="recording-bar" style="width: 62%;"></div>
            </div>
          </div>
        </div>
        <div class="cardText cardText-first">Live Championship Broadcast</div>
        <div class="cardText cardText-secondary">Recording in progress</div>
      </div>
    </div>

    <!-- Cast & Crew Person Card Fixture -->
    <div class="card overflowPortraitCard personCard card-hoverable" data-testid="person-card">
      <div class="cardBox cardBox-bottompadded">
        <div class="cardScalable">
          <div class="cardPadder cardPadder-overflowPortrait"></div>
          <a href="#person" class="cardImageContainer coveredImage cardContent defaultCardBackground defaultCardBackground1" data-testid="person-image">
            <span class="material-icons cardImageIcon">person</span>
          </a>
          <div class="cardOverlayContainer" data-testid="person-overlay"></div>
        </div>
        <div class="cardText cardTextCentered cardText-first" data-testid="person-name">
          <bdi><a href="#person" class="itemAction textActionButton">Sir Christopher Frank Carandini Lee</a></bdi>
        </div>
        <div class="cardText cardTextCentered cardText-secondary" data-testid="person-role">
          <bdi><span title="as Saruman the White / Count Dooku of Serenno">as Saruman the White / Count Dooku of Serenno</span></bdi>
        </div>
      </div>
    </div>
  </div>

  <!-- Wide Detail Table Fixture (Album Tracklist / Scheduled Tasks / Recordings) -->
  <div style="padding: 0 0.75rem; box-sizing: border-box; width: 100%;">
    <table class="detailTable" data-testid="detail-table">
      <thead>
        <tr>
          <th class="detailTableHeaderCell">#</th>
          <th class="detailTableHeaderCell">Track / Recording Title</th>
          <th class="detailTableHeaderCell">Artist / Channel</th>
          <th class="detailTableHeaderCell">Format &amp; Audio Stream</th>
          <th class="detailTableHeaderCell">Schedule Status</th>
          <th class="detailTableHeaderCell">Duration</th>
        </tr>
      </thead>
      <tbody>
        <tr class="detailTableBodyRow-shaded" data-testid="table-row-1">
          <td class="detailTableBodyCell">01</td>
          <td class="detailTableBodyCell"><button type="button" class="button-link" data-testid="row-focus-btn">Midnight City (2026 Remastered Spatial Mix)</button></td>
          <td class="detailTableBodyCell">M83 · Hurry Up, We're Dreaming</td>
          <td class="detailTableBodyCell">FLAC 24-bit / 96kHz · Dolby Atmos</td>
          <td class="detailTableBodyCell">Synced · Ready</td>
          <td class="detailTableBodyCell">04:03</td>
        </tr>
        <tr class="detailTableBodyRow-shaded" data-testid="table-row-2">
          <td class="detailTableBodyCell">02</td>
          <td class="detailTableBodyCell"> Sovereign Glass Horizon</td>
          <td class="detailTableBodyCell">Obsidian Ensemble</td>
          <td class="detailTableBodyCell">PCM Stereo Lossless</td>
          <td class="detailTableBodyCell">Scheduled 21:00 UTC</td>
          <td class="detailTableBodyCell">05:48</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="upNextContainer hide" data-testid="upnext-preset"></div>
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

test('Library cover pack includes valid 1920x1080 PNG headers for Music & Playlists and synced docs', () => {
  const expectedCovers = ['movies.png', 'tv.png', 'live-tv.png', 'collections.png', 'music.png', 'playlists.png'];
  const pngMagic = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  for (const file of expectedCovers) {
    const coverPath = path.join(ROOT_DIR, 'assets', 'covers', file);
    assert.ok(fs.existsSync(coverPath), `Expected library cover ${file} to exist`);
    const buf = fs.readFileSync(coverPath);
    assert.ok(buf.length > 500 * 1024, `Expected ${file} to be a high-detail PNG (>500 KB), got ${buf.length} bytes`);
    assert.deepEqual(buf.subarray(0, 8), pngMagic, `${file} must begin with valid PNG signature`);
    assert.equal(buf.subarray(12, 16).toString('ascii'), 'IHDR', `${file} must start with IHDR chunk`);
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    assert.equal(width, 1920, `${file} PNG width must be 1920px`);
    assert.equal(height, 1080, `${file} PNG height must be 1080px`);
  }

  const readme = fs.readFileSync(path.join(ROOT_DIR, 'README.md'), 'utf8');
  const presetsDoc = fs.readFileSync(path.join(ROOT_DIR, 'docs', 'presets.md'), 'utf8');
  assert.ok(readme.includes('assets/covers/music.png'), 'README.md must document assets/covers/music.png');
  assert.ok(readme.includes('assets/covers/playlists.png'), 'README.md must document assets/covers/playlists.png');
  assert.ok(readme.includes('.upNextContainer'), 'README.md Lite Preset must include .upNextContainer');
  assert.ok(presetsDoc.includes('.upNextContainer'), 'docs/presets.md Lite Preset must include .upNextContainer');
});

for (const direction of ['ltr', 'rtl']) {
  test(`Card badges, recording progress bar, and personCard framing/truncation (${direction})`, async () => {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    try {
      await page.setContent(fixture);
      await page.evaluate(dir => { document.documentElement.dir = dir; }, direction);

      const metrics = await page.evaluate(() => {
        const ms = document.querySelector('[data-testid="media-source-badge"]');
        const count = document.querySelector('[data-testid="count-badge"]');
        const sync = document.querySelector('[data-testid="sync-badge"]');
        const rec = document.querySelector('[data-testid="recording-bar"]');
        const cardRect = document.querySelector('[data-testid="media-card"] .cardScalable').getBoundingClientRect();
        const indicatorsRect = document.querySelector('.cardIndicators').getBoundingClientRect();
        const msRect = ms.getBoundingClientRect();

        const msStyle = getComputedStyle(ms);
        const countStyle = getComputedStyle(count);
        const syncStyle = getComputedStyle(sync);
        const recStyle = getComputedStyle(rec);

        const personCard = document.querySelector('[data-testid="person-card"]');
        const personBox = personCard.querySelector('.cardBox');
        const personImage = document.querySelector('[data-testid="person-image"]');
        const personOverlay = document.querySelector('[data-testid="person-overlay"]');
        const personNameBdi = document.querySelector('[data-testid="person-name"] > bdi');
        const personNameLink = document.querySelector('[data-testid="person-name"] .textActionButton');
        const personRole = document.querySelector('[data-testid="person-role"]');

        return {
          msBg: msStyle.backgroundImage,
          msRadius: parseFloat(msStyle.borderRadius),
          msFontSize: msStyle.fontSize,
          countFontSize: countStyle.fontSize,
          msPaddingTop: msStyle.paddingTop,
          countPaddingTop: countStyle.paddingTop,
          msColor: msStyle.color,
          msInsideCard: msRect.left >= cardRect.left && msRect.right <= cardRect.right,
          msSeparatedFromIndicators: msRect.right <= indicatorsRect.left || indicatorsRect.right <= msRect.left,
          syncBg: syncStyle.backgroundImage,
          syncColor: syncStyle.color,
          syncRadius: parseFloat(syncStyle.borderRadius),
          syncSvgFill: getComputedStyle(sync.querySelector('svg')).fill,
          recBg: recStyle.backgroundImage,
          recShadow: recStyle.boxShadow,
          personContain: getComputedStyle(personCard).contain,
          personOverflow: getComputedStyle(personCard).overflow,
          personBoxOverflow: getComputedStyle(personBox).overflow,
          personScalableRadius: getComputedStyle(personCard.querySelector('.cardScalable')).borderTopLeftRadius,
          personScalableBottomRadius: getComputedStyle(personCard.querySelector('.cardScalable')).borderBottomLeftRadius,
          personClipPath: getComputedStyle(personOverlay).clipPath,
          personBgPos: getComputedStyle(personImage).backgroundPosition,
          personDefaultBg: getComputedStyle(personImage).backgroundImage,
          nameLinkOverflow: getComputedStyle(personNameLink).textOverflow,
          nameBdiOverflow: getComputedStyle(personNameBdi).textOverflow,
          roleOverflow: getComputedStyle(personRole).textOverflow,
          nameFitsBox: personNameLink.getBoundingClientRect().width <= personBox.getBoundingClientRect().width,
          roleFitsBox: personRole.getBoundingClientRect().width <= personBox.getBoundingClientRect().width
        };
      });

      assert.ok(metrics.msBg.includes('linear-gradient') && metrics.msBg.includes('56, 189, 248'), '.mediaSourceIndicator must use cyan-to-indigo glass gradient');
      assert.ok(metrics.msRadius >= 999, '.mediaSourceIndicator must have pill geometry');
      assert.equal(metrics.msFontSize, metrics.countFontSize, '.mediaSourceIndicator font-size must match .countIndicator');
      assert.equal(metrics.msPaddingTop, metrics.countPaddingTop, '.mediaSourceIndicator padding must match .countIndicator');
      assert.equal(metrics.msColor, 'rgb(255, 255, 255)');
      assert.ok(metrics.msInsideCard && metrics.msSeparatedFromIndicators, '.mediaSourceIndicator must not collide with .cardIndicators in LTR or RTL');

      assert.ok(metrics.syncBg.includes('linear-gradient') && metrics.syncBg.includes('16, 185, 129'), '.fullSyncIndicator must use emerald glass gradient');
      assert.ok(metrics.syncRadius >= 999, '.fullSyncIndicator must render as a circular/pill glass badge');
      assert.equal(metrics.syncColor, 'rgb(255, 255, 255)');
      assert.equal(metrics.syncSvgFill, 'rgb(255, 255, 255)');

      assert.ok(
        metrics.recBg.includes('linear-gradient') &&
        metrics.recBg.includes('244, 63, 94') &&
        metrics.recBg.includes('251, 113, 133'),
        '.itemProgressBarForeground-recording must apply glowing rose-crimson gradient'
      );
      assert.notEqual(metrics.recShadow, 'none', '.itemProgressBarForeground-recording must include rose halo glow');

      assert.ok(!metrics.personContain.includes('paint'), '.personCard must not contain: paint (prevents clipping hover lift)');
      assert.equal(metrics.personOverflow, 'visible');
      assert.equal(metrics.personBoxOverflow, 'visible');
      assert.equal(metrics.personScalableRadius, '14px', '.personCard portrait top corners must match .cardBox');
      assert.equal(metrics.personScalableBottomRadius, '0px', '.personCard portrait bottom corners must meet footer tray cleanly');
      assert.equal(metrics.personClipPath, 'none', '.personCard overlay must clear circular clip-path');
      assert.equal(metrics.personBgPos, '50% 20%', '.personCard headshots must align to upper-third facial focal point');
      assert.ok(metrics.personDefaultBg.includes('linear-gradient'), '.personCard fallback background must use dark slate glass');
      assert.equal(metrics.nameLinkOverflow, 'ellipsis');
      assert.equal(metrics.nameBdiOverflow, 'ellipsis');
      assert.equal(metrics.roleOverflow, 'ellipsis');
      assert.ok(metrics.nameFitsBox && metrics.roleFitsBox, 'Long actor names and roles must truncate cleanly inside .personCard');

      // Hover lift verification on fine-pointer desktop
      await page.getByTestId('person-card').hover();
      const hoverTransform = await page.locator('[data-testid="person-card"] .cardBox').evaluate(el => getComputedStyle(el).transform);
      assert.notEqual(hoverTransform, 'none', '.personCard must elevate smoothly on pointer hover');
    } finally {
      await page.close();
    }
  });
}

for (const viewport of [
  { width: 320, height: 480 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 844, height: 390 },
  { width: 1656, height: 1269 },
  { width: 1920, height: 1080 },
  { width: 3840, height: 2160 }
]) {
  for (const direction of ['ltr', 'rtl']) {
    test(`Detail table & search input responsive layout at ${viewport.width}x${viewport.height} (${direction})`, async () => {
      const page = await browser.newPage({ viewport });
      try {
        await page.setContent(fixture);
        await page.evaluate(dir => { document.documentElement.dir = dir; }, direction);

        const metrics = await page.evaluate(() => {
          const table = document.querySelector('[data-testid="detail-table"]');
          const th = table.querySelector('.detailTableHeaderCell');
          const tdFirstRow = table.querySelector('[data-testid="table-row-1"] .detailTableBodyCell');
          const tdLastRow = table.querySelector('[data-testid="table-row-2"] .detailTableBodyCell');
          const tableStyle = getComputedStyle(table);
          const thStyle = getComputedStyle(th);
          const tdStyle = getComputedStyle(tdFirstRow);
          const tdLastStyle = getComputedStyle(tdLastRow);

          const searchInner = document.querySelector('[data-testid="search-inner"]');
          const searchIcon = document.querySelector('[data-testid="search-icon"]');
          const searchInput = document.querySelector('#searchTextInput');
          const emptyLabel = searchInner.querySelector('.inputLabel');
          const iconRect = searchIcon.getBoundingClientRect();
          const inputRect = searchInput.getBoundingClientRect();
          const iconStyle = getComputedStyle(searchIcon);

          return {
            docOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            tableRight: table.getBoundingClientRect().right,
            tableLeft: table.getBoundingClientRect().left,
            tableBg: tableStyle.backgroundImage,
            tableBlur: tableStyle.backdropFilter,
            tableRadius: parseFloat(tableStyle.borderRadius),
            tableOverflowX: tableStyle.overflowX,
            thTransform: thStyle.textTransform,
            thTracking: parseFloat(thStyle.letterSpacing),
            thColor: thStyle.color,
            thBorderBottom: parseFloat(thStyle.borderBottomWidth),
            tdBorderBottom: parseFloat(tdStyle.borderBottomWidth),
            tdLastBorderBottom: parseFloat(tdLastStyle.borderBottomWidth),
            emptyLabelDisplay: getComputedStyle(emptyLabel).display,
            iconColor: iconStyle.color,
            iconCenterDeltaY: Math.abs((iconRect.top + iconRect.height / 2) - (inputRect.top + inputRect.height / 2)),
            iconSeparated: iconRect.right <= inputRect.left + 0.5 || inputRect.right <= iconRect.left + 0.5,
            searchInsideViewport: Math.min(iconRect.left, inputRect.left) >= 0 && Math.max(iconRect.right, inputRect.right) <= document.documentElement.clientWidth
          };
        });

        assert.equal(metrics.docOverflow, 0, `Document must have zero horizontal overflow at ${viewport.width}x${viewport.height}`);
        assert.ok(metrics.tableLeft >= 0 && metrics.tableRight <= viewport.width + 0.5, '.detailTable must stay bounded within viewport');
        assert.ok(metrics.tableBg.includes('linear-gradient'), '.detailTable must apply frosted glass panel background');
        assert.ok(metrics.tableBlur.includes('blur('), '.detailTable must apply frosted backdrop-filter');
        assert.ok(metrics.tableRadius >= 12, '.detailTable must have rounded glass corners');
        if (viewport.width <= 900) {
          assert.equal(metrics.tableOverflowX, 'auto', 'Compact/mobile viewports must enable horizontal scroll safety on .detailTable');
        }
        assert.equal(metrics.thTransform, 'uppercase', '.detailTableHeaderCell must be uppercase');
        assert.ok(metrics.thTracking > 0.5, '.detailTableHeaderCell must have wide letter-spacing');
        assert.equal(metrics.thColor, 'rgb(203, 213, 225)', '.detailTableHeaderCell must use --obs-slate-300');
        assert.equal(metrics.thBorderBottom, 1, '.detailTableHeaderCell must have 1px glass bottom border');
        assert.equal(metrics.tdBorderBottom, 1, 'Body rows must have subtle 1px divider');
        assert.equal(metrics.tdLastBorderBottom, 0, 'Final body row must omit bottom divider');

        assert.equal(metrics.emptyLabelDisplay, 'none', 'Empty .inputLabel inside .searchFieldsInner must collapse');
        assert.equal(metrics.iconColor, 'rgb(129, 140, 248)', '.searchfields-icon must use --obs-indigo-400');
        assert.ok(metrics.iconCenterDeltaY <= 1, `.searchfields-icon must vertically center with input (delta=${metrics.iconCenterDeltaY}px)`);
        assert.ok(metrics.iconSeparated, '.searchfields-icon must sit cleanly beside .emby-input without overlap');
        assert.ok(metrics.searchInsideViewport, '.searchFieldsInner must fit cleanly inside viewport down to 320px');

        // Verify hover and focus-within row highlights on .detailTable
        await page.getByTestId('row-focus-btn').focus();
        await page.waitForFunction(() => {
          const bg = getComputedStyle(document.querySelector('[data-testid="table-row-1"] .detailTableBodyCell')).backgroundColor;
          return bg.includes('99, 102, 241');
        });
        const focusedRowBg = await page.locator('[data-testid="table-row-1"] .detailTableBodyCell').first().evaluate(el => getComputedStyle(el).backgroundColor);
        assert.ok(focusedRowBg.includes('99, 102, 241'), 'Focusing an interactive control inside a row must highlight the row');
      } finally {
        await page.close();
      }
    });
  }
}

test('Presets & accessibility: forced-colors: active and prefers-reduced-motion: reduce', async () => {
  const page = await browser.newPage({ forcedColors: 'active', reducedMotion: 'reduce' });
  try {
    await page.setContent(fixture);
    const a11y = await page.evaluate(() => {
      const table = getComputedStyle(document.querySelector('[data-testid="detail-table"]'));
      const th = getComputedStyle(document.querySelector('.detailTableHeaderCell'));
      const td = getComputedStyle(document.querySelector('.detailTableBodyCell'));
      const upNext = getComputedStyle(document.querySelector('[data-testid="upnext-preset"]'));
      const ms = getComputedStyle(document.querySelector('[data-testid="media-source-badge"]'));
      const sync = getComputedStyle(document.querySelector('[data-testid="sync-badge"]'));
      const rec = getComputedStyle(document.querySelector('[data-testid="recording-bar"]'));
      const icon = getComputedStyle(document.querySelector('[data-testid="search-icon"]'));

      return {
        tableBlur: table.backdropFilter,
        tableShadow: table.boxShadow,
        tableBg: table.backgroundColor,
        tableColor: table.color,
        thBg: th.backgroundColor,
        thColor: th.color,
        tdTransition: td.transitionDuration,
        upNextBlur: upNext.backdropFilter,
        upNextShadow: upNext.boxShadow,
        upNextTransition: upNext.transitionDuration,
        msGradient: ms.backgroundImage,
        msBg: ms.backgroundColor,
        msColor: ms.color,
        syncGradient: sync.backgroundImage,
        recGradient: rec.backgroundImage,
        iconFilter: icon.filter,
        iconTransition: icon.transitionDuration
      };
    });

    assert.equal(a11y.tableBlur, 'none');
    assert.equal(a11y.tableShadow, 'none');
    assert.notEqual(a11y.tableBg, a11y.tableColor);
    assert.notEqual(a11y.thBg, a11y.thColor);
    assert.equal(a11y.tdTransition, '0s', 'prefers-reduced-motion must disable table cell transitions');
    assert.equal(a11y.upNextBlur, 'none');
    assert.equal(a11y.upNextShadow, 'none');
    assert.equal(a11y.upNextTransition, '0.001s', 'prefers-reduced-motion must preserve 1ms transitionend hook on .upNextContainer');
    assert.equal(a11y.msGradient, 'none');
    assert.notEqual(a11y.msBg, a11y.msColor);
    assert.equal(a11y.syncGradient, 'none');
    assert.equal(a11y.recGradient, 'none');
    assert.equal(a11y.iconFilter, 'none');
    assert.equal(a11y.iconTransition, '0s');
  } finally {
    await page.close();
  }
});
