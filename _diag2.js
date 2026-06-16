var fs = require('fs');
var r = [];

// Try _linkedBinding
var names = ['electron_common_features', 'electron_browser_app', 'electron_browser_browser_window', 'electron_common_ipc', 'app', 'BrowserWindow'];
for (var i = 0; i < names.length; i++) {
  try {
    var lb = process._linkedBinding(names[i]);
    r.push(names[i] + ': OK type=' + typeof lb + ' keys=' + JSON.stringify(Object.keys(lb||{}).slice(0,8)));
  } catch(e) {
    r.push(names[i] + ': FAIL - ' + e.message.slice(0,60));
  }
}

// Also try process.binding
try {
  var pb = process.binding('app');
  r.push('process.binding(app): ' + typeof pb);
} catch(e) {
  r.push('process.binding(app): FAIL');
}

fs.writeFileSync('d:/jizhang/diag42b.log', r.join('\n'));
process.exit(0);
