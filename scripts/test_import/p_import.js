const Promise = require("bluebird");
const test_import_mysql2 = require('./test_import.js').test_import_mysql2;

function usage (message){
    console.log(`Usage: p_import [--debug] [--force] system_name file_name.csv`)
    console.log(message)
    process.exit(1)
}

var config = require('../../config');

var n = 2;
var sys = process.argv[n++]

const helpFlag = (sys === '--help' || sys === '-h');
if (helpFlag) {
    usage("Help:");
}
const debugFlag = (sys === '--debug');
if (debugFlag) {
    sys = process.argv[n++];
}
const forceFlag =  (sys === '--force');
if (forceFlag) {
    sys = process.argv[n++];
}

var fn = process.argv[n++]

if(!sys){
    usage("Missing System")
}
if(!fn){
    usage("Missing File Name")
}
test_import_mysql2(sys, fn, config, forceFlag, debugFlag).then(results => { console.log('Successful!'); });


