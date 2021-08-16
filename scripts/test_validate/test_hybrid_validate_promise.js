// Library module version 
// 
const Promise = require("bluebird");
const fs = require('fs');
const mysql = require('promise-mysql');
const _ = require('lodash');


// returns a promise containing an array of objects like {NAME, CONTROL_ITEM, DEPENDS_ON}
// currently caller's responsibility to close the database connection.
module.exports = function test_hybrid_validate_promise(config)
{
    return mysql.createConnection({
        host: config.mysql.host,
        user: config.mysql.user,
        password: config.mysql.password,
        database: config.mysql.database
    }).then(connection => {
        // Find all tests who don't have a corresponding test in their inherited parent test.
var sql = `

(
SELECT pk_system_control_test_id, sys.name as NAME, control_item as CONTROL_ITEM
FROM system_control_test r, system sys
where
r.fk_system_id = sys.pk_system_id
and
r.depends_on_system_id is not null
and
r.hybrid = 1
and
not exists ( select 1 from system_control_test q 
				where q.fk_system_id = r.depends_on_system_id and
					q.hybrid = 0 and
                    q.control_item = r.control_item )

) UNION (
/* no non-hybrids for same control on same system */
SELECT pk_system_control_test_id, sys.name as NAME, control_item as CONTROL_ITEM
FROM system_control_test r, system sys
WHERE
r.depends_on_system_id is null
and
r.hybrid = 1
and
fk_system_id = sys.pk_system_id
and
not exists ( select 1 from system_control_test q
				where q.fk_system_id = r.fk_system_id
					and q.control_item = r.control_item
					and q.hybrid = 0 )
)

`;
        return [connection, connection.query(sql)]; // remember to use .spread, not .then
    });
}
