/**
 * ============================================================================
 * OBSIDIAN DESIGN SYSTEM - DETERMINISTIC BUILD SCRIPT
 * File: build.js
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'src');
const OUTPUT_FILE = path.join(__dirname, 'obsidian.css');
const LEGACY_OUTPUT_FILE = path.join(__dirname, 'aetherflow.css');

// Strict concatenation order of modules
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

const BANNER = `/**
 * ============================================================================
 * JELLYFIN OBSIDIAN THEME (Looplet Obsidian Design System)
 * Version: 2.0.0
 * Architecture: Pure #000000 Obsidian Glassmorphism & 120Hz Hardware-Cached Aurora
 * Compatibility: Jellyfin Web 12.2.x+ (Modern MUI & Legacy Views), 10.11.x; JMP
 *
 * Grounded in the Looplet Obsidian CSS Specification
 * ============================================================================
 *
 * OPTIONAL ENHANCEMENT:
 * To load Inter directly from Google Fonts, uncomment the following line.
 * (Note: Deployed theme defaults to offline system fonts without external calls)
 *
 * @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
 *
 * ============================================================================
 */

`;

function validateCSS(cssContent) {
  let openBraces = 0;
  let openParens = 0;
  let inComment = false;
  const lines = cssContent.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      const nextCh = line[j + 1];

      if (!inComment && ch === '/' && nextCh === '*') {
        inComment = true;
        j++;
        continue;
      }
      if (inComment && ch === '*' && nextCh === '/') {
        inComment = false;
        j++;
        continue;
      }
      if (inComment) continue;

      if (ch === '{') openBraces++;
      if (ch === '}') {
        openBraces--;
        if (openBraces < 0) {
          throw new Error(`Syntax Error: Unmatched closing brace '}' at line ${i + 1}`);
        }
      }
      if (ch === '(') openParens++;
      if (ch === ')') {
        openParens--;
        if (openParens < 0) {
          throw new Error(`Syntax Error: Unmatched closing paren ')' at line ${i + 1}`);
        }
      }
    }
  }

  if (openBraces !== 0) {
    throw new Error(`Syntax Error: Unbalanced braces! (${openBraces} unclosed '{')`);
  }
  if (openParens !== 0) {
    throw new Error(`Syntax Error: Unbalanced parentheses! (${openParens} unclosed '(')`);
  }
  if (inComment) {
    throw new Error(`Syntax Error: Unclosed comment '/*' detected!`);
  }
  return true;
}

function build() {
  console.log('⚡ Building Obsidian standalone theme for Jellyfin 12.2...');

  let combinedCSS = BANNER.replace(/\r\n/g, '\n');

  for (const file of MODULE_ORDER) {
    const filePath = path.join(SRC_DIR, file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Critical Error: Required module file missing: ${file}`);
    }

    const content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');
    combinedCSS += `\n/* >>> MODULE: ${file} <<< */\n` + content + '\n';
    console.log(`  ✔ Included ${file} (${content.split('\n').length} lines)`);
  }

  // Syntax validation
  console.log('🔍 Validating CSS syntax & bracket/brace balance...');
  validateCSS(combinedCSS);
  console.log('  ✔ Confirmed: CSS syntax is well-formed with balanced braces and parentheses.');

  // Verification checks for external dependencies
  console.log('🔍 Verifying zero required external dependencies...');
  const cssWithoutComments = combinedCSS.replace(/\/\*[\s\S]*?\*\//g, '');
  const linesWithoutComments = cssWithoutComments.split('\n');

  let activeImports = 0;
  let activeExternalUrls = 0;

  for (const line of linesWithoutComments) {
    const trimmed = line.trim();
    if (trimmed.startsWith('@import')) {
      activeImports++;
      console.warn(`  ⚠ Warning: Found active @import: ${trimmed}`);
    }
    const urlMatches = trimmed.match(/url\(\s*['"]?(https?:\/\/[^'")]+)['"]?\s*\)/gi);
    if (urlMatches) {
      for (const m of urlMatches) {
        activeExternalUrls++;
        console.warn(`  ⚠ Warning: Found active external url: ${m}`);
      }
    }
  }

  if (activeImports === 0 && activeExternalUrls === 0) {
    console.log('  ✔ Confirmed: Zero active external HTTP @imports or external URLs. Fully self-contained offline runtime.');
  } else {
    throw new Error(`Validation Error: Found ${activeImports} active imports and ${activeExternalUrls} external URLs.`);
  }

  // Selector existence contract validation against vendored upstream tree
  console.log('🔍 Validating Selector Contract against upstream jellyfin-web 12.2...');
  const { extractSelectorsFromCSS, checkUpstreamExistence, resolveUpstreamDir } = require('./scripts/precise_audit');
  const upstreamDir = resolveUpstreamDir();
  if (upstreamDir) {
    const { classes, ids } = extractSelectorsFromCSS(combinedCSS);
    const deadClasses = [];
    const deadIds = [];

    for (const c of classes) {
      if (c.startsWith('obs-')) continue;
      const res = checkUpstreamExistence(c, false);
      if (res.status === 'DEAD') deadClasses.push(c);
    }

    for (const id of ids) {
      if (id.startsWith('obs-')) continue;
      const res = checkUpstreamExistence(id, true);
      if (res.status === 'DEAD') deadIds.push(id);
    }

    if (deadClasses.length > 0 || deadIds.length > 0) {
      throw new Error(`Selector Contract Failure: Detected dead selectors matching nothing upstream!\n  Classes: ${deadClasses.join(', ')}\n  IDs: ${deadIds.join(', ')}`);
    }
    console.log(`  ✔ Confirmed: Selector existence gate PASSED. All selectors verified in upstream source tree.`);
  } else {
    const { classes, ids } = extractSelectorsFromCSS(combinedCSS);
    console.log(`  ✔ Extracted ${classes.length} CSS classes and ${ids.length} IDs (upstream tree not mounted locally; set OBSIDIAN_UPSTREAM_DIR for live ripgrep check).`);
  }

  fs.writeFileSync(OUTPUT_FILE, combinedCSS, 'utf8');
  if (fs.existsSync(LEGACY_OUTPUT_FILE)) {
    fs.unlinkSync(LEGACY_OUTPUT_FILE);
  }

  const stats = fs.statSync(OUTPUT_FILE);
  console.log(`\n🎉 Successfully generated ${OUTPUT_FILE}`);
  console.log(`   Total Size: ${(stats.size / 1024).toFixed(2)} KB`);
  console.log(`   Total Lines: ${combinedCSS.split('\n').length}`);
}

build();
