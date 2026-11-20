/**
 * ============================================================================
 * SYNTAX VALIDATION RUNNER (scripts/checkSyntax.js)
 * Validates JS syntax for all scripts in scripts/ and build.js via `node --check`,
 * and shell script syntax for scripts/*.sh via `bash -n`.
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

function findShellFiles() {
  const files = [];

  // scripts/*.sh
  if (fs.existsSync(SCRIPTS_DIR)) {
    const entries = fs
      .readdirSync(SCRIPTS_DIR, { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.sh')) {
        files.push(path.join(SCRIPTS_DIR, entry.name));
      }
    }
  }

  return files;
}

function runCheck(cmd, args, filePath) {
  const relPath = path.relative(ROOT_DIR, filePath);
  const result = spawnSync(cmd, [...args, filePath], {
    encoding: 'utf8'
  });

  if (result.error || result.status !== 0) {
    console.error(`\n❌ Syntax check failed on: ${relPath}`);
    if (result.error) console.error(result.error.message);
    if (result.stderr) console.error(result.stderr.trim());
    if (result.stdout) console.log(result.stdout.trim());
    return false;
  }

  console.log(`  ✔ Passed: ${relPath}`);
  return true;
}

function checkSyntax() {
  console.log('🔍 Running syntax validation runner (node --check and bash -n)...');
  const jsFiles = findJsFiles();
  const shellFiles = findShellFiles();
  let failureCount = 0;

  for (const filePath of jsFiles) {
    if (!runCheck(process.execPath, ['--check'], filePath)) {
      failureCount++;
    }
  }

  for (const filePath of shellFiles) {
    if (!runCheck('bash', ['-n'], filePath)) {
      failureCount++;
    }
  }

  const totalCount = jsFiles.length + shellFiles.length;
  if (failureCount > 0) {
    console.error(`\n💥 Syntax validation failed: ${failureCount} file(s) have syntax errors.`);
    process.exit(1);
  } else {
    console.log(`\n🎉 All ${totalCount} scripts passed syntax check.`);
  }
}

checkSyntax();
