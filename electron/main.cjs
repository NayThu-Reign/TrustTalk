const { app, BrowserWindow, ipcMain, nativeImage, Menu, shell } = require('electron');
const path = require('path');
const { setupIpcHandlers } = require('./ipc-handlers.cjs');

let mainWindow;

// ✅ Set app name BEFORE app.whenReady()
app.setName('TrustTalk');
app.setAppUserModelId('TrustTalk');


// ✅ Add IPC handler for asset paths
ipcMain.handle('get-asset-path', (event, filename) => {
  // Determine the correct asset path based on environment
  const isDev = !app.isPackaged;
  
  let assetPath;
  if (isDev) {
    // Development: assets are in src/assets
    assetPath = path.join(__dirname, '..', 'src', 'assets', filename);
  } else {
    // Production: assets should be in resources folder
    assetPath = path.join(process.resourcesPath, 'assets', filename);
  }
  
  console.log('🖼️ Asset path requested:', filename);
  console.log('📁 Resolved path:', assetPath);
  console.log('🏗️ Is packaged:', app.isPackaged);
  
  return assetPath;
});

function createWindow() {
  // ✅ Create a proper icon (convert to PNG for better support)
  const iconPath = path.join(__dirname, "..", "src", "assets", "splash_logo_tl2.png");
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: iconPath,
    title: 'TrustTalk', // ✅ Set window title
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  // Menu.setApplicationMenu(null);

  // mainWindow.loadFile(
  //   path.join(__dirname, "..", "dist", "index.html")
  // );

  mainWindow.loadURL("http://localhost:5178");

  // Open external links (e.g. from Linkify) in the system browser instead of in-app
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:'))) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    const isExternal =
      url.startsWith("http://") ||
      url.startsWith("https://") ||
      url.startsWith("mailto:");
  
    const isLocal =
      url.startsWith("file://") ||
      url.includes("dist/index.html");
  
    if (isExternal && !isLocal) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });
}


app.whenReady().then(() => {
  // ✅ Setup IPC handlers after app is ready
  setupIpcHandlers();
  
  createWindow();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
