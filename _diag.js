var fs = require('fs');
var r = [];
r.push('electron_version=' + process.versions.electron);
r.push('type=' + typeof process.type + ' val=' + process.type);

// Check what's available on process
var procKeys = Object.getOwnPropertyNames(process).sort();
var interest = procKeys.filter(function(k) {
  return k.indexOf('electron') >= 0 || k.indexOf('binding') >= 0 || k.indexOf('app') >= 0 || k.indexOf('linked') >= 0;
});
r.push('process keys with electron/binding/app: ' + JSON.stringify(interest));

// Check global
var globalInterest = Object.getOwnPropertyNames(global).filter(function(k) {
  return k.indexOf('electron') >= 0 || k.indexOf('app') >= 0 || k.indexOf('Browser') >= 0 || k === 'global';
});
r.push('global: ' + JSON.stringify(globalInterest));

// Check require('electron')
try { var e = require('electron'); r.push('require(electron): ' + typeof e + ' ' + (typeof e === 'string' ? e.slice(-30) : 'keys=' + JSON.stringify(Object.keys(e).slice(0,5)))); } catch(x) { r.push('require(electron) FAIL: ' + x.message); }

// Check require('electron/main')
try { var e2 = require('electron/main'); r.push('require(electron/main): ' + typeof e2 + ' app=' + !!e2.app); } catch(x) { r.push('require(electron/main) FAIL: ' + x.message.slice(0,50)); }

fs.writeFileSync('d:/jizhang/diag42.log', r.join('\n'));
process.exit(0);
