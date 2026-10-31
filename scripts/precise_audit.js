/**
 * ============================================================================
 * PRECISE SELECTOR AUDIT TOOL (scripts/precise_audit.js)
 * Obsidian Theme for Jellyfin 12.2+
 *
 * Extracts CSS class and ID selectors across all src/*.css modules
 * and validates whole-token existence against upstream jellyfin-web 12.2.
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT_DIR, 'src');

function resolveUpstreamDir() {
  const envDir = process.env.OBSIDIAN_UPSTREAM_DIR;
  if (envDir) {
    if (fs.existsSync(envDir)) return envDir;
    throw new Error(`OBSIDIAN_UPSTREAM_DIR was specified but directory does not exist: ${envDir}`);
  }

  const candidates = [
    path.join(ROOT_DIR, 'upstream', 'jellyfin-web-12.2', 'src'),
    path.join(ROOT_DIR, 'upstream', 'jellyfin-web', 'src')
  ];

  for (const cand of candidates) {
    if (fs.existsSync(cand)) return cand;
  }

  return null;
}

const MODULE_ORDER = [
  '01-variables.css',
  '02-atmosphere.css',
  '03-typography.css',
  '04-header-nav.css',
  '05-cards.css',
  '06-item-detail.css',
  '07-player-osd.css',
  '08-dialogs-inputs.css',
  '09-login.css',
  '10-presets.css'
];

// Explicit allowlist for dynamically constructed layout classes or Material UI runtime state classes
const ALLOWLIST = new Set([
  'layout-mobile',
  'layout-desktop',
  'layout-tv',
  'Mui-selected',
  'Mui-checked',
  'Mui-focused',
  'Mui-disabled',
  'Mui-expanded'
]);

// Material UI runtime class prefix -> @mui/material component mapping in Jellyfin 12.2
const MUI_COMPONENT_MAP = {
  MuiAppBar: 'AppBar',
  MuiToolbar: 'Toolbar',
  MuiDrawer: 'Drawer',
  MuiDialog: 'Dialog',
  MuiPopover: 'Popover',
  MuiMenu: 'Menu',
  MuiMenuItem: 'MenuItem',
  MuiPaper: 'Paper',
  MuiAccordion: 'Accordion',
  MuiCard: 'Card',
  MuiAlert: 'Alert',
  MuiButtonBase: 'Button',
  MuiButton: 'Button',
  MuiIconButton: 'IconButton',
  MuiListItemButton: 'ListItemButton',
  MuiFilledInput: 'TextField',
  MuiOutlinedInput: 'TextField',
  MuiInputBase: 'InputBase',
  MuiTypography: 'Typography',
  MuiCheckbox: 'Checkbox',
  MuiSwitch: 'Switch'
};

function extractSelectorsFromCSS(cssText) {
  const noComments = cssText.replace(/\/\*[\s\S]*?\*\//g, '');

  const selectors = [];
  let buffer = '';
  let braceDepth = 0;

  for (let i = 0; i < noComments.length; i++) {
    const ch = noComments[i];
    if (ch === '{') {
      const trimmed = buffer.trim();
      if (trimmed && !trimmed.startsWith('@media') && !trimmed.startsWith('@keyframes') && !trimmed.startsWith('@supports')) {
        selectors.push(trimmed);
      }
      buffer = '';
      braceDepth++;
    } else if (ch === '}') {
      buffer = '';
      braceDepth--;
    } else if (ch === ';') {
      buffer = '';
    } else {
      buffer += ch;
    }
  }

  const classes = new Set();
  const ids = new Set();

  for (const selGroup of selectors) {
    const parts = selGroup.split(',');
    for (let part of parts) {
      part = part.trim();
      part = part.replace(/\[[^\]]*\]/g, ' ');
      part = part.replace(/:not\([^)]*\)/g, ' ');
      part = part.replace(/:has\([^)]*\)/g, ' ');
      part = part.replace(/::?[a-zA-Z0-9_-]+/g, ' ');

      const classTokens = part.match(/\.([a-zA-Z_][a-zA-Z0-9_-]*)/g) || [];
      for (const ct of classTokens) {
        classes.add(ct.slice(1));
      }

      const idTokens = part.match(/#([a-zA-Z_][a-zA-Z0-9_-]*)/g) || [];
      for (const it of idTokens) {
        ids.add(it.slice(1));
      }
    }
  }

  return { classes: [...classes], ids: [...ids] };
}

function checkUpstreamExistence(token, isId = false) {
  if (ALLOWLIST.has(token)) {
    return { status: 'allowlisted', loc: 'dynamically constructed / allowlist' };
  }

  const upstreamDir = resolveUpstreamDir();
  if (!upstreamDir) {
    return { status: 'skipped_no_upstream', loc: 'upstream tree not present' };
  }

  const pattern = `(?<![-_a-zA-Z0-9])${token}(?![-_a-zA-Z0-9])`;
  const result = spawnSync('rg', ['-P', '-n', pattern, upstreamDir], { encoding: 'utf8' });

  if (result.status === 0 && result.stdout) {
    const lines = result.stdout.trim().split('\n').filter(Boolean);
    if (lines.length > 0) {
      const loc = lines[0].replace(upstreamDir, 'src');
      return { status: 'exists', loc: loc, count: lines.length };
    }
  }

  // Check Material UI runtime component class mapping in Jellyfin 12.2
  if (!isId && token.startsWith('Mui')) {
    const prefix = token.split('-')[0];
    const muiComp = MUI_COMPONENT_MAP[prefix];
    if (muiComp) {
      const muiPattern = `@mui/material/${muiComp}|${prefix}`;
      const muiRes = spawnSync('rg', ['-P', '-n', muiPattern, upstreamDir], { encoding: 'utf8' });
      if (muiRes.status === 0 && muiRes.stdout) {
        const lines = muiRes.stdout.trim().split('\n').filter(Boolean);
        if (lines.length > 0) {
          const loc = lines[0].replace(upstreamDir, 'src');
          return { status: 'exists_mui_component', loc: loc, count: lines.length };
        }
      }
    }
  }

  return { status: 'DEAD' };
}

function runAudit() {
  const upstreamDir = resolveUpstreamDir();
  if (!upstreamDir) {
    console.log('ℹ Upstream jellyfin-web tree not found in ./upstream; skipping ripgrep selector existence check (set OBSIDIAN_UPSTREAM_DIR to enable).');
    return true;
  }

  console.log(`🔍 Running Precise Selector Contract Audit against: ${upstreamDir}`);
  const auditReport = {};
  let totalDead = 0;

  for (const mod of MODULE_ORDER) {
    const filePath = path.join(SRC_DIR, mod);
    if (!fs.existsSync(filePath)) continue;

    const content = fs.readFileSync(filePath, 'utf8');
    const { classes, ids } = extractSelectorsFromCSS(content);

    auditReport[mod] = { deadClasses: [], deadIds: [], verifiedCount: 0 };

    for (const c of classes) {
      if (c.startsWith('obs-')) continue;
      const res = checkUpstreamExistence(c, false);
      if (res.status === 'DEAD') {
        auditReport[mod].deadClasses.push(c);
        totalDead++;
      } else {
        auditReport[mod].verifiedCount++;
      }
    }

    for (const id of ids) {
      if (id.startsWith('obs-')) continue;
      const res = checkUpstreamExistence(id, true);
      if (res.status === 'DEAD') {
        auditReport[mod].deadIds.push(id);
        totalDead++;
      } else {
        auditReport[mod].verifiedCount++;
      }
    }

    const deadTotalMod = auditReport[mod].deadClasses.length + auditReport[mod].deadIds.length;
    if (deadTotalMod > 0) {
      console.log(`  ❌ ${mod}: ${deadTotalMod} dead selector(s) found`);
      if (auditReport[mod].deadClasses.length) console.log(`     Classes: ${auditReport[mod].deadClasses.join(', ')}`);
      if (auditReport[mod].deadIds.length) console.log(`     IDs: ${auditReport[mod].deadIds.join(', ')}`);
    } else {
      console.log(`  ✔ ${mod}: All selectors verified upstream (${auditReport[mod].verifiedCount} valid tokens)`);
    }
  }

  if (totalDead > 0) {
    console.error(`\n💥 Selector Contract Audit: ${totalDead} dead selector(s) detected.`);
    return false;
  } else {
    console.log(`\n🎉 Selector Contract Audit PASSED: 0 dead selectors across all modules.`);
    return true;
  }
}

if (require.main === module) {
  const passed = runAudit();
  if (!passed) process.exit(1);
}

module.exports = { runAudit, extractSelectorsFromCSS, checkUpstreamExistence, resolveUpstreamDir, ALLOWLIST };
