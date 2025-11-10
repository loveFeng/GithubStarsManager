#!/usr/bin/env node

// Build the web app if needed and run an Electron-based smoke test

const { spawnSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

function log(msg) { console.log(msg); }
function fail(msg, code = 1) { console.error(msg); process.exit(code); }

(async function main() {
  log('🧪 Starting desktop mode test...');

  const repoRoot = path.resolve(__dirname, '..');
  const distIndex = path.join(repoRoot, 'dist', 'index.html');

  if (!fs.existsSync(distIndex)) {
    log('📦 dist not found, running build...');
    const res = spawnSync('npm', ['run', 'build'], { stdio: 'inherit', cwd: repoRoot, shell: process.platform === 'win32' });
    if (res.status !== 0) {
      return fail('❌ Build failed', res.status || 1);
    }
  } else {
    log('✅ Found dist build');
  }

  const electronBin = process.platform === 'win32'
    ? path.join(repoRoot, 'node_modules', '.bin', 'electron.cmd')
    : path.join(repoRoot, 'node_modules', '.bin', 'electron');

  if (!fs.existsSync(electronBin)) {
    return fail('❌ Electron is not installed. Install dev deps (e.g., npm i -D electron) and retry.');
  }

  const mainPath = path.join(repoRoot, 'scripts', 'electron-test-main.cjs');
  if (!fs.existsSync(mainPath)) {
    return fail('❌ Missing scripts/electron-test-main.cjs');
  }

  log('⚡ Launching Electron to validate desktop bundle...');
  const child = spawn(electronBin, [mainPath], {
    cwd: repoRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
      ELECTRON_DISABLE_SECURITY_WARNINGS: 'true',
      TEST_DIST_PATH: distIndex,
      TEST_TIMEOUT_MS: process.env.TEST_TIMEOUT_MS || '20000',
    },
  });

  child.on('exit', (code) => {
    if (code === 0) {
      log('🎉 Desktop test passed');
    } else {
      console.error(`❌ Desktop test failed with code ${code}`);
    }
    process.exit(code ?? 1);
  });
})();

