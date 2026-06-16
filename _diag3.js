var fs = require('fs');
var r = 'p1';
try { var x = process.binding('app'); r += ' OK'; } catch(e) { r += ' FAIL'; }
fs.writeFileSync('d:/jizhang/d42.log', r);
process.exit(0);
