var fs = require('fs');
try {
  var e = require('electron');
  fs.writeFileSync('d:/jizhang/t.log', 'type=' + typeof e + ' app=' + !!e.app + ' appType=' + (e.app ? typeof e.app : 'N/A'));
  if (e.app && e.app.whenReady) {
    e.app.whenReady().then(function() { e.app.quit(); });
  } else {
    process.exit(0);
  }
} catch(x) {
  fs.writeFileSync('d:/jizhang/t.log', 'FAIL: ' + x.message);
  process.exit(0);
}
