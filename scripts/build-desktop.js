#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 开始构建桌面应用...');

// 1. 构建Web应用
console.log('📦 构建Web应用...');
execSync('npm run build', { stdio: 'inherit' });

// 2. 创建Electron目录和文件
console.log('⚡ 设置Electron环境...');
const projectRoot = path.join(__dirname, '..');
const electronDir = path.join(projectRoot, 'electron');
if (!fs.existsSync(electronDir)) {
  fs.mkdirSync(electronDir, { recursive: true });
}

// 3. 创建主进程文件
const mainJs = `
const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true
    },
    icon: path.join(__dirname, '../assets/icon.png'),
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    show: false
  });

  // 加载应用
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // 设置应用菜单
    if (process.platform === 'darwin') {
      const template = [
        {
          label: 'GitHub Stars Manager',
          submenu: [
            { role: 'about' },
            { type: 'separator' },
            { role: 'services' },
            { type: 'separator' },
            { role: 'hide' },
            { role: 'hideothers' },
            { role: 'unhide' },
            { type: 'separator' },
            { role: 'quit' }
          ]
        },
        {
          label: 'Edit',
          submenu: [
            { role: 'undo' },
            { role: 'redo' },
            { type: 'separator' },
            { role: 'cut' },
            { role: 'copy' },
            { role: 'paste' },
            { role: 'selectall' }
          ]
        },
        {
          label: 'View',
          submenu: [
            { role: 'reload' },
            { role: 'forceReload' },
            { role: 'toggleDevTools' },
            { type: 'separator' },
            { role: 'resetZoom' },
            { role: 'zoomIn' },
            { role: 'zoomOut' },
            { type: 'separator' },
            { role: 'togglefullscreen' }
          ]
        },
        {
          label: 'Window',
          submenu: [
            { role: 'minimize' },
            { role: 'close' }
          ]
        }
      ];
      Menu.setApplicationMenu(Menu.buildFromTemplate(template));
    }
  });

  // 处理外部链接
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// 安全设置
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});
`;

fs.writeFileSync(path.join(electronDir, 'main.js'), mainJs);

// 4. 创建Electron package.json
const electronPackageJson = {
  name: 'github-stars-manager-desktop',
  version: '1.0.0',
  description: 'GitHub Stars Manager Desktop App',
  main: 'main.js',
  author: 'GitHub Stars Manager',
  license: 'MIT'
};

fs.writeFileSync(
  path.join(electronDir, 'package.json'),
  JSON.stringify(electronPackageJson, null, 2)
);

// 5. 安装Electron依赖
console.log('📥 检查Electron依赖...');
const hasElectron = fs.existsSync(path.join(projectRoot, 'node_modules', 'electron'));
const hasBuilder = fs.existsSync(path.join(projectRoot, 'node_modules', 'electron-builder'));
if (!hasElectron || !hasBuilder) {
  console.log('⏬ 未检测到依赖，开始安装 electron 和 electron-builder...');
  try {
    execSync('npm install --save-dev electron electron-builder', { stdio: 'inherit', cwd: projectRoot });
  } catch (error) {
    console.error('安装依赖失败:', error.message);
    process.exit(1);
  }
} else {
  console.log('✅ Electron 相关依赖已安装，跳过安装');
}

// 6. 构建应用
console.log('🔨 构建桌面应用...');

// 依据当前平台尽可能同时打包 Windows 与 Linux
// - 在 Linux 上：尝试同时打包 --linux 与 --win（需要 wine）
// - 在 Windows 上：仅打包 --win，并提示 Linux 需在 Linux 环境执行
// - 在 macOS 上：默认打包 --linux，若安装 wine 则附带 --win
const platform = process.platform; // 'win32' | 'linux' | 'darwin'

const canUseWine = () => {
  try {
    execSync('wine --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};

const args = [];

if (platform === 'linux') {
  args.push('--linux');
  if (canUseWine()) {
    args.push('--win');
  } else {
    console.warn('⚠️ 未检测到 wine，跳过 Windows 安装包构建。安装 wine 后可同时构建 Windows 包。');
  }
} else if (platform === 'win32') {
  args.push('--win');
  console.warn('ℹ️ 在 Windows 上无法直接构建 Linux 包。如需 Linux 包，请在 Linux 环境或容器中执行。');
} else if (platform === 'darwin') {
  // 用户只要求 Windows+Linux，这里不主动打包 mac 目标
  args.push('--linux');
  if (canUseWine()) {
    args.push('--win');
  } else {
    console.warn('⚠️ 未检测到 wine，跳过 Windows 安装包构建。macOS 上构建 Windows 需要 wine（受系统限制可能不可用）。');
  }
} else {
  // 其他平台兜底：尝试默认行为
  console.warn(`⚠️ 未知平台: ${platform}，使用 electron-builder 默认目标。`);
}

try {
  const cmd = ['npx', 'electron-builder', ...args].join(' ');
  console.log(`▶️ 执行：${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: projectRoot });
  console.log('✅ 桌面应用构建完成！');
  console.log('📁 构建文件位于 release/ 目录');
} catch (error) {
  console.error('构建失败:', error.message);
  process.exit(1);
}
