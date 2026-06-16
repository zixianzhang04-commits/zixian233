const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Database = require('better-sqlite3');
const { initDatabase, closeDatabase } = require('./src/database/init');
const queries = require('./src/database/queries');

const isDev = process.env.npm_lifecycle_event === 'dev';
let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200, height: 800, minWidth: 900, minHeight: 600,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
}

function registerIpcHandlers() {
  ipcMain.handle('records:create', (_e, d) => queries.createRecord(d));
  ipcMain.handle('records:update', (_e, id, d) => queries.updateRecord(id, d));
  ipcMain.handle('records:delete', (_e, id) => queries.deleteRecord(id));
  ipcMain.handle('records:get', (_e, id) => queries.getRecordById(id));
  ipcMain.handle('records:list', (_e, f) => queries.listRecords(f));
  ipcMain.handle('records:copy-last', () => queries.copyLastRecord());
  ipcMain.handle('categories:create', (_e, d) => queries.createCategory(d));
  ipcMain.handle('categories:update', (_e, id, d) => queries.updateCategory(id, d));
  ipcMain.handle('categories:check-delete', (_e, id) => queries.deleteCategory(id));
  ipcMain.handle('categories:force-delete', (_e, id) => queries.forceDeleteCategory(id));
  ipcMain.handle('categories:get', (_e, id) => queries.getCategoryById(id));
  ipcMain.handle('categories:list', (_e, t) => queries.listCategories(t));
  ipcMain.handle('categories:tree', (_e, t) => queries.getCategoryTree(t));
  ipcMain.handle('categories:update-order', (_e, id, o) => queries.updateCategoryOrder(id, o));
  ipcMain.handle('budgets:get', (_e, p) => queries.getBudget(p));
  ipcMain.handle('budgets:set', (_e, d) => queries.setBudget(d));
}

app.whenReady().then(() => {
  initDatabase(Database);
  registerIpcHandlers();
  createWindow();
});

app.on('window-all-closed', () => {
  closeDatabase();
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
