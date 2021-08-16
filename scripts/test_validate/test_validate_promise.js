// Library module version 
// 
const Promise = require("bluebird");
const fs = require('fs');
const mysql = require('promise-mysql');
const _ = require('lodash');


// returns a promise containing an array of objects like {NAME, CONTROL_ITEM, DEPENDS_ON}
// currently caller's responsibility to close the database connection.
module.exports = function test_validate_promise(config)
{
    return mysql.createConnection({
        host: config.mysql.host,
        user: config.mysql.user,
        password: config.mysql.password,
        database: config.mysql.database
    }).then(connection => {
        // Find all tests who don't have a corresponding test in their inherited parent test.
var sql = `

SELECT sys2.NAME,CONTROL_ITEM,sys.NAME as DEPENDS_ON FROM system_control_test r , system sys,system sys2
where
r.DEPENDS_ON_SYSTEM_ID = sys.pk_system_id
and
r.FK_SYSTEM_ID = sys2.pk_system_id
and
r.depends_on_system_id is not null
and
not exists
(
SELECT 1 FROM system_control_test u where  u.fk_system_id = r.depends_on_system_id 
    /* and u.depends_on_system_id is null */
    and r.control_item = u.control_item
)
order by DEPENDS_ON,CONTROL_ITEM

`;
        return [connection, connection.query(sql)]; // remember to use .spread, not .then
    });
}
