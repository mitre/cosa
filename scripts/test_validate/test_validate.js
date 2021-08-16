//
// Validate the tests for all systems (CLI version)
//
const Promise = require("bluebird");
const test_validate_promise = require('./test_validate_promise.js.js');
var config = require('../../config');

var n = 2;

const debugFlag = (sys === '--debug');
if (debugFlag) {
    sys = process.argv[n++];
}
const forceFlag =  (sys === '--force');
if (forceFlag) {
    sys = process.argv[n++];
}

if (debugFlag) console.log(`database=${config.mysql.database}`);
test_validate(config).then(results => { console.log('Successful!'); });


// validate tests for a system 'sys'
// @returns a promise

function test_validate(config)
{
    return test_validate_promise(config).spread( (connection, results) => {
        connection.end();
        log_records(results);
    }).catch(err => {
        console.error('Promise Exception Caught:');
        console.error(`err: ${err}`);
        if (typeof err.stack != 'undefined') console.error(`err.stack: ${err.stack}`);
        if (connection != null) connection.end()
    });
}


function usage (message){
    console.log(`Usage: test_validate system_name`);
    console.log(message)
    process.exit(1)
}
function yn(s){
    return(s==='y'|| s==='Y'? 1:0)
}
function log_records(results)
{
    console.log("Systems for which a corresponding control does not exist in the target");
    console.log("NAME    CONTROL_ITEM    DEPENDS_ON");
    console.log("----    ------------    ----------");
    results.forEach(x => {
                        console.log(`${x.NAME} ${x.CONTROL_ITEM} ${x.DEPENDS_ON}`);
                    });
}
