const fs = require('fs');
const m = require('electron');
const log = [];
log.push('process.versions.electron: ' + process.versions.electron);
log.push('process.type: ' + process.type);
log.push('app type: ' + typeof m.app);
log.push('app.whenReady type: ' + typeof (m.app && m.app.whenReady));
log.push('BrowserWindow type: ' + typeof m.BrowserWindow);
log.push('ipcMain type: ' + typeof m.ipcMain);
fs.writeFileSync('debug-log.txt', log.join('\n'), 'utf8');
if (m.app && m.app.whenReady) {
  m.app.whenReady().then(() => {
    fs.appendFileSync('debug-log.txt', '\nAPP READY!', 'utf8');
    m.app.quit();
  });
} else {
  fs.appendFileSync('debug-log.txt', '\nFAIL: app not available', 'utf8');
  process.exit(1);
}
