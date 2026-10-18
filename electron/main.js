const { app, BrowserWindow, Menu, shell, session } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');

let mainWindow = null;

const isDev = !app.isPackaged;
const DEV_URL = 'http://localhost:5173';
const DIST_URL = pathToFileURL(path.join(__dirname, '..', 'dist') + path.sep).href;

// Solo se abren fuera de la app links https (ej. el boton de donacion).
function openExternalSafe(url) {
  try {
    if (new URL(url).protocol === 'https:') shell.openExternal(url);
  } catch (e) { /* url invalida: se ignora */ }
}

function createWindow() {
  // Sin barra de menu (Archivo / Ver / DevTools) en la version final.
  if (!isDev) Menu.setApplicationMenu(null);

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    resizable: true,
    autoHideMenuBar: true,
    backgroundColor: '#000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      devTools: isDev, // en el instalador final no hay DevTools
    },
  });

  // window.open / target=_blank -> navegador del sistema, nunca otra ventana de la app.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    openExternalSafe(url);
    return { action: 'deny' };
  });

  // La ventana no puede navegar fuera del juego.
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const allowed = isDev ? url.startsWith(DEV_URL) : url.startsWith(DIST_URL);
    if (!allowed) {
      event.preventDefault();
      openExternalSafe(url);
    }
  });

  // El juego no necesita permisos especiales (camara, microfono, ubicacion...).
  session.defaultSession.setPermissionRequestHandler((_wc, _permission, callback) => callback(false));

  if (isDev) {
    mainWindow.loadURL(DEV_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
