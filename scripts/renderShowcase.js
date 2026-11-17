/** Render documentation previews from the current theme, never from old captures. */
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const ROOT = path.resolve(__dirname, '..');
const theme = fs.readFileSync(path.join(ROOT, 'obsidian.css'), 'utf8');
const VIEWS = {
  controls: { width: 1440, height: 640, clip: { x: 160, y: 280, width: 1120, height: 360 }, file: 'playback-controls-preview.png' },
  overlays: { width: 1024, height: 400, file: 'playback-overlays-preview.png' }
};

const paths = {
  back: '<path d="m14 6-6 6 6 6"/>',
  previous: '<path d="M5 5v14M19 5 8 12l11 7Z"/>',
  rewind: '<path d="m11 5-8 7 8 7Zm10 0-8 7 8 7Z"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  forward: '<path d="m3 5 8 7-8 7Zm10 0 8 7-8 7Z"/>',
  next: '<path d="M19 5v14M5 5l11 7-11 7Z"/>',
  subtitles: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M6 11h4m4 0h4M6 15h6m3 0h3"/>',
  audio: '<path d="M9 18V5l11-2v13M9 8l11-2"/><ellipse cx="6" cy="18" rx="3" ry="2"/><ellipse cx="17" cy="16" rx="3" ry="2"/>',
  volume: '<path d="M4 9h4l5-4v14l-5-4H4ZM17 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  settings: '<path d="m10 3-1 3-3 1-3 3 2 2-2 2 3 3 3 1 1 3h4l1-3 3-1 3-3-2-2 2-2-3-3-3-1-1-3Z"/><circle cx="12" cy="12" r="3"/>',
  fullscreen: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>'
};

function icon(name) {
  return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
}

function button(name, label, extra = '') {
  return `<button type="button" class="paper-icon-button-light ${extra}" aria-label="${label}">${icon(name)}</button>`;
}

function slider(value, label) {
  return `<div class="mdl-slider-container">
    <input class="mdl-slider" is="emby-slider" type="range" min="0" max="100" value="${value}" aria-label="${label}">
    <div class="mdl-slider-background-flex-container"><div class="mdl-slider-background-flex"><div class="mdl-slider-background-flex-inner"><div class="mdl-slider-background-lower" style="width:${value}%"></div></div></div></div>
  </div>`;
}

// Only baseline control geometry and the demo canvas live here. All Obsidian
// colors, surfaces, borders, focus, dock geometry and gradients come from theme.
const baseline = `
  html, body { margin:0; padding:0; font-size:16px; }
  .hide { display:none !important; }
  .flex { display:flex; } .align-items-center { align-items:center; }
  .flex-grow { flex-grow:1; } .flex-direction-column { flex-direction:column; }
  .flex-direction-row { flex-direction:row; }
  .paper-icon-button-light { display:inline-flex; align-items:center; justify-content:center; border:0; background:transparent; color:inherit; cursor:pointer; font:inherit; }
  .emby-button { display:inline-flex; align-items:center; justify-content:center; border:0; color:inherit; font:inherit; cursor:pointer; }
  .mdl-slider-container { position:relative; display:flex; height:1.25em; width:100%; }
  .mdl-slider { appearance:none; -webkit-appearance:none; width:100%; margin:0; background:transparent; position:relative; z-index:1; }
  .mdl-slider::-webkit-slider-thumb { -webkit-appearance:none; appearance:none; }
  .mdl-slider-background-flex-container { position:absolute; box-sizing:border-box; top:50%; left:0; padding:0 .54em; width:100%; }
  .mdl-slider-background-flex { height:.2em; margin-top:-.1em; background:rgba(255,255,255,.3); }
  .mdl-slider-background-flex-inner { position:relative; width:100%; height:100%; }
  .mdl-slider-background-lower { position:absolute; top:0; bottom:0; left:0; }
  .iconOsd { position:fixed; right:3%; top:7%; z-index:1000; }
  .mediaInfoItem { margin-right:1em; }
  .scene-caption { position:absolute; left:56px; top:42px; }
  .scene-caption p { margin:0 0 12px; color:#a5b4fc; font:600 11px/1.5 system-ui,sans-serif; letter-spacing:.16em; text-transform:uppercase; }
  .scene-caption h1 { margin:0 0 10px; font:650 32px/1.2 system-ui,sans-serif; letter-spacing:-.035em; color:#f1f5ff; }
  .scene-caption small { color:#94a3b8; font:14px/1.6 system-ui,sans-serif; }
  .demo-title { font-size:13px; } .demo-title span { margin-left:10px; color:#94a3b8; font-size:12px; }
  .demo-endtime { margin-left:auto; color:#94a3b8; font:11px ui-monospace,monospace; }
  body[data-view="overlays"] .scene-caption { top:80px; }
  body[data-view="controls"] .scene-caption { top:300px; left:200px; }
`;

function buildPreview(view) {
  if (!VIEWS[view]) throw new Error('Unknown preview view: ' + view);
  const controls = `<header class="scene-caption"><p>Obsidian · Component preview · Current CSS</p><h1>Floating playback controls</h1><small>Sample controls rendered with the shipped stylesheet. No live media session.</small></header>
  <div class="videoOsdBottom videoOsdBottom-maincontrols"><div class="osdControls">
    <div class="osdMainTextContainer flex align-items-center"><div class="osdTitle demo-title">Obsidian Demo <span>Chapter 04</span></div><div class="demo-endtime">SAMPLE MEDIA</div></div>
    <div class="flex align-items-center"><span class="startTimeText">00:42:18</span><div class="sliderContainer flex-grow">${slider(61, 'Playback position')}</div><span class="endTimeText">01:08:52</span></div>
    <div class="buttons"><div dir="ltr">${button('previous', 'Previous chapter')}${button('rewind', 'Rewind')}${button('pause', 'Pause', 'btnPause')}${button('forward', 'Fast forward')}${button('next', 'Next chapter')}</div>
      <div class="osdTimeText">Playback controls</div>${button('subtitles', 'Subtitles')}${button('audio', 'Audio track')}
      <div class="volumeButtons">${button('volume', 'Volume')}<div class="sliderContainer osdVolumeSliderContainer">${slider(72, 'Volume')}</div></div>
      ${button('settings', 'Settings')}${button('fullscreen', 'Full screen')}
    </div>
  </div></div>`;
  const overlays = `<header class="scene-caption"><p>Obsidian · Component preview · Current CSS</p><h1>Volume &amp; Up Next</h1><small>Two player overlays, using sample episode information.</small></header>
  <div class="iconOsd volumeOsd"><span class="iconOsdIcon">${icon('volume')}</span><div class="iconOsdProgressOuter"><div class="iconOsdProgressInner" style="width:72%"></div></div></div>
  <div class="upNextContainer upNextDialog"><div class="flex flex-direction-column flex-grow">
    <h2 class="upNextDialog-nextVideoText">Next episode playing in <span class="upNextDialog-countdownText">18 Seconds</span></h2>
    <h3 class="upNextDialog-title">Obsidian Demo — Episode 02</h3>
    <div class="flex flex-direction-row upNextDialog-mediainfo"><div class="mediaInfoItem">42m</div><div class="mediaInfoItem">Sample episode</div></div>
    <div class="flex flex-direction-row upNextDialog-buttons"><button class="raised raised-mini btnStartNow upNextDialog-button emby-button">Start Now</button><button class="raised raised-mini btnHide upNextDialog-button emby-button">Hide</button></div>
  </div></div>`;
  return `<!doctype html><html lang="en" dir="ltr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Obsidian ${view} component preview</title><style>${baseline}</style><style>${theme}</style><style>body { min-height:${VIEWS[view].height}px; }</style></head><body data-view="${view}">${view === 'controls' ? controls : overlays}</body></html>`;
}

async function render() {
  const { chromium } = require('playwright');
  const browser = await chromium.launch({
    executablePath: process.env.OBSIDIAN_CHROMIUM_PATH || undefined,
    chromiumSandbox: true
  });
  const out = path.join(ROOT, 'docs', 'screenshots');
  try {
    for (const [view, spec] of Object.entries(VIEWS)) {
      const page = await browser.newPage({ viewport: { width: spec.width, height: spec.height }, deviceScaleFactor: 1 });
      await page.setContent(buildPreview(view));
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: path.join(out, spec.file), clip: spec.clip });
      await page.close();
      console.log('Rendered ' + spec.file);
    }
    const coversOut = path.join(ROOT, 'docs', 'images', 'covers');
    fs.mkdirSync(coversOut, { recursive: true });
    const images = ['movies', 'tv', 'live-tv', 'collections', 'music', 'playlists'].map(name => ({
      source: path.join(ROOT, 'assets', 'covers', name + '.png'),
      destination: path.join(coversOut, name + '.png'), width: 480, height: 270
    }));
    images.push({ source: path.join(out, '03-desktop-library-grid.png'), destination: path.join(ROOT, 'docs', 'images', 'library-preview.png'), width: 1280, height: 720 });
    for (const image of images) {
      const page = await browser.newPage({ viewport: { width: image.width, height: image.height }, deviceScaleFactor: 1 });
      await page.goto(pathToFileURL(image.source).href);
      await page.evaluate(({ width, height }) => {
        document.documentElement.style.cssText = 'margin:0;padding:0;background:#000';
        document.body.style.cssText = 'margin:0;padding:0';
        document.querySelector('img').style.cssText = `display:block;width:${width}px;height:${height}px`;
      }, image);
      await page.screenshot({ path: image.destination });
      await page.close();
      console.log('Rendered thumbnail: ' + path.relative(ROOT, image.destination));
    }
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  if (process.argv[2] === '--html') {
    const view = process.argv[3];
    const destination = process.argv[4];
    if (!destination) throw new Error('Usage: node scripts/renderShowcase.js --html controls|overlays /absolute/output.html');
    fs.writeFileSync(destination, buildPreview(view));
  } else {
    render().catch(error => { console.error(error.message); process.exitCode = 1; });
  }
}

module.exports = { buildPreview, VIEWS };
