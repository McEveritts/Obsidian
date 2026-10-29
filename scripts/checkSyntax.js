/**
 * ============================================================================
 * SYNTAX VALIDATION RUNNER (scripts/checkSyntax.js)
 * Validates JS syntax for all scripts in scripts/ and build.js
 * Evaluates each file individually via `node --check`
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const SCRIPTS_DIR = path.join(ROOT_DIR, 'scripts');

function findJsFiles() {
  const files = [];

  // Root build.js
  const buildJs = path.join(ROOT_DIR, 'build.js');
  if (fs.existsSync(buildJs)) {
    files.push(buildJs);
  }

  // scripts/*.js
  if (fs.existsSync(SCRIPTS_DIR)) {
    const entries = fs.readdirSync(SCRIPTS_DIR, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.js') && entry.name !== 'checkSyntax.js') {
        files.push(path.join(SCRIPTS_DIR, entry.name));
      }
    }
  }

  return files;
}

function checkSyntax() {
  console.log('🔍 Running syntax validation runner (node --check on all scripts)...');
  const files = findJsFiles();
  let failureCount = 0;

  for (const filePath of files) {
    const relPath = path.relative(ROOT_DIR, filePath);
    const result = spawnSync(process.execPath, ['--check', filePath], {
      encoding: 'utf8'
    });

    if (result.status !== 0) {
      failureCount++;
      console.error(`\n❌ Syntax check failed on: ${relPath}`);
      if (result.stderr) console.error(result.stderr.trim());
      if (result.stdout) console.log(result.stdout.trim());
    } else {
      console.log(`  ✔ Passed: ${relPath}`);
    }
  }

  if (failureCount > 0) {
    console.error(`\n💥 Syntax validation failed: ${failureCount} file(s) have syntax errors.`);
    process.exit(1);
  } else {
    console.log(`\n🎉 All ${files.length} scripts passed syntax check.`);
  }
}

checkSyntax();
