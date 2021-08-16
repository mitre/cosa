const Promise = require("bluebird");
const parse = require('csv-parse/lib/sync');
const fs = require('fs');
const mysql2 = require('mysql2/promise');
const deepTrim = require('./deepTrim');
const _ = require('lodash');

// import controls from a file 'fn'
// @returns a promise

module.exports.control_import_mysql2 = function (fn, config, debugFlag) {

    var records = {};
    var connection;

    if (debugFlag) console.log(`Database = ${config.mysql.database}`);

    return mysql2.createConnection({

        host: config.mysql.host,
        user: config.mysql.user,
        password: config.mysql.password,
        database: config.mysql.database

    }).then(conn => {

        // set global connection
        connection = conn;

        // trim records object
        records = deepTrim(read_csv_file(fn));
        
        console.error(`Records: ` + JSON.stringify(records));

        return Promise.each(records, (rec) => {

            if (rec.name != '') {

                try {
         
                    console.error(`Control Record: ` + JSON.stringify(rec));
       
                    var inserts = {
                        "NAME": rec.name,
                        "FAMILY": rec.family,
                        "TITLE": rec.title,
                        "BASELINE_IMPACT": rec.baseline_impact,
                        "DESCRIPTION": rec.description,
                        "SUPPLEMENTAL_GUIDANCE": rec.supplemental_guidance,
                        "PRIORITY": rec.priority,
                        "RELATED_CONTROLS": rec.related_controls
                    };

                    //console.log("Creating insert: " + JSON.stringify(inserts));

                    var sql = createInsert('security_control', inserts);

                    //console.log("Query: " + JSON.stringify(sql));

                    sql = mysql2.format(sql.query, sql.values);

                    //console.log("Query: " + JSON.stringify(sql));

                    return connection.query(sql);

                } catch (ex) {

                    console.error(`Caught exception ${ex}. Skipping Record`);

                }
            } else {

                console.error(`Record has no control name. Skipping Record`);
                
            }

            return true;  // A value is a promise, right?

        }).catch(ex => console.log("Promise: " + ex));

    }).then(() => {

        return connection.end();

    }).catch(err => {

        console.error('Promise Exception Caught in control_import.js:');
        console.error(`err: ${err}`);

        if (typeof err.stack != 'undefined') console.error(`err.stack: ${err.stack}`);

        if (connection != null) connection.end();

    });
};

// Helper Functions
function records_log(recs) {

    recs.forEach((r, i) => {

        console.log(`${i + 1} ${r.control} ${r.name} ${r.description.slice(0, 32)}`);

    });
}

// throws error if not parseable or missing file.
function read_csv_file(fn) {

    const input = fs.readFileSync(fn, 'utf8');
    
    var records = parse(input, {
        columns: true,
        skip_empty_lines: true
    });
    
    return records;

}

// returns query: 'INSERT INTO table ('fields', ..) VALUES (valuesPlaceholder, ..)'
function createInsert(table, object, fields, valuePlaceholder) {

    var query = 'INSERT INTO ' + table + ' (';

    // handle calls like siq('table', {...}, '$')
    if (typeof fields === 'string') {

        var _valuePlaceholder = fields;

        valuePlaceholder = function () { return _valuePlaceholder; };

        fields = undefined;

    }

    // handle calls like siq('table', {...}, function () { ... })
    if (typeof fields === 'function') {
        valuePlaceholder = fields;
        fields = undefined;
    }

    valuePlaceholder = valuePlaceholder || defaultPlaceholder;
    fields = fields || Object.keys(object);

    var values = [];

    // gather the values and concat the field names for them
    for (var i = 0; i < fields.length; i++) {

        var field = fields[i];
        var value = object[field];

        if (value !== undefined) {

            if (values.length > 0) {

                query += ',';

            }

            query += field;
            values.push(value);

        }
    }

    // console.log(`# fields: ${fields.length} || # values ${values.length}`);

    if (values.length === 0) {

        throw new Error('missing values. the object might have no properties of field restriction does not include any of the existing properties');

    }

    // create the values placeholder part of the query
    query += ') VALUES(';

    for (var i = 0; i < values.length; i++) {

        if (i > 0) {
            query += ',';
        }

        query += valuePlaceholder(i, fields[i]);

    }

    query += ')';


    return {

        query: query,
        values: values

    };
}
function defaultPlaceholder() {

    return '?';

}
