#!/usr/bin/env node

// Minimal Electron main process to validate desktop mode loads the built app
// Exits with code 0 on success, non-zero on failure/timeouts.

const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

// Helpful flags for CI/headless environments
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('no-sandbox');

const DIST_INDEX = process.env.TEST_DIST_PATH || path.resolve(__dirname, '..', 'dist', 'index.html');
const TIMEOUT_MS = parseInt(process.env.TEST_TIMEOUT_MS || '20000', 10);

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1000,
    height: 700,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
    },
  });

  // Open external links in default browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  const timeout = setTimeout(() => {
    console.error(`❌ Desktop test timed out after ${TIMEOUT_MS}ms`);
    try { win && win.close(); } catch {}
    app.exit(2);
  }, TIMEOUT_MS);

  // Helpful diagnostics
  win.webContents.on('console-message', (_e, level, message) => {
    if (level >= 2) {
      console.error(`Renderer console[${level}]: ${message}`);
    }
  });
  win.webContents.on('did-fail-load', (_e, errorCode, errorDesc, _validatedURL, isMainFrame) => {
    if (isMainFrame) {
      console.error(`❌ Failed to load main frame: ${errorCode} ${errorDesc}`);
    }
  });
  win.webContents.on('render-process-gone', (_e, details) => {
    console.error('❌ Render process gone:', details);
  });

  win.webContents.once('did-finish-load', async () => {
    try {
      const title = await win.webContents.executeJavaScript('document.title');
      const hasRoot = await win.webContents.executeJavaScript('Boolean(document.querySelector("#root"))');

      if (!title || !String(title).toLowerCase().includes('github stars manager')) {
        throw new Error(`Unexpected title: ${title}`);
      }
      if (!hasRoot) {
        throw new Error('Missing #root element');
      }

      clearTimeout(timeout);
      console.log('✅ Desktop mode loaded successfully');
      app.exit(0);
    } catch (err) {
      clearTimeout(timeout);
      console.error('❌ Desktop test failed:', err && err.message ? err.message : err);
      app.exit(1);
    }
  });

  // Load built app
  win.loadFile(DIST_INDEX).catch(err => {
    console.error('❌ loadFile error:', err && err.message ? err.message : err);
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  // Ensure process exits on Linux/Windows
  if (process.platform !== 'darwin') app.quit();
});

