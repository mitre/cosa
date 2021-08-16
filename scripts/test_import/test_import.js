const Promise = require("bluebird");
const parse = require('csv-parse/lib/sync');
const mysql2 = require('mysql2/promise');
const deepTrim = require('./deepTrim');
const _ = require('lodash');

// import tests for a system 'sys' from a fileStream
// forceFlag is a boolean.  when true, it will create associated system and check methods as needed.
// note: may throw exceptions.
// @returns a promise

module.exports.test_import_mysql2 = function (sys, fileStream, config, forceFlag, debugFlag) {

    var records = {};
    var connection;

    // value caches for making insert cleaner...    
    var systemID = {};
    var procedureTypeID = {};
    var roleID = {};
    var sourceID = {};
    var testMethodID = {};
    var controlID = {};
    var componentID = {};
    var scopeID = {};
    var catalogID = {};
    var stageID = {};
    var componentTypeID = {};
    var componentTypeName = {};
    var componentProductID = {};
    var componentProductName = {};

    var component_subtypes = [];
    var new_comp_types = [];
    var csv_type_product = [];
    var diff_systems = [];
    var diff_scopes = [];
    var diff_checks = [];
    var diff_component_types = [];
    var diff_component_products = [];
    var csv_wildcard_records = [];
    var all_comp_types = [];
    var all_comp_prods = [];
    var non_subtype = [];

    console.log(`Filestream: ` + fileStream);
    if (debugFlag) console.log(`Database = ${config.mysql.database}\n`);

    return mysql2.createConnection({

        host: config.mysql.host,
        user: config.mysql.user,
        password: config.mysql.password,
        database: config.mysql.database

    }).then(conn => {

        // set global connection
        connection = conn;

        // trim records object
        records = deepTrim(read_csv_file(fileStream));


        // ###########################
        //  SELECTs - reference data
        // ###########################

        var sql = "SELECT PK_SYSTEM_ID, NAME FROM system";
        return connection.query(sql);
    }).then(([results, buf]) => {
        results.forEach(r => {
            systemID[r.NAME] = r.PK_SYSTEM_ID;
        });

        var sql = "SELECT PK_SECURITY_CONTROL_ID, NAME FROM security_control";
        return connection.query(sql);
    }).then(([results, buf]) => {
        results.forEach(r => {
            controlID[r.NAME] = r.PK_SECURITY_CONTROL_ID;
        });

        var sql = "SELECT PK_ROLE_ID, NAME FROM system_roles_default";
        return connection.query(sql);
    }).then(([results, buf]) => {
        results.forEach(r => {
            roleID[r.NAME] = r.PK_ROLE_ID;
        });

        var sql = "SELECT PK_TEST_SOURCE_ID, NAME FROM test_source_default";
        return connection.query(sql);
    }).then(([results, buf]) => {
        results.forEach(r => {
            sourceID[r.NAME] = r.PK_TEST_SOURCE_ID;
        });

        var sql = "SELECT PK_TEST_METHOD_ID, NAME FROM test_method_default";
        return connection.query(sql);
    }).then(([results, buf]) => {
        results.forEach(r => {
            testMethodID[r.NAME] = r.PK_TEST_METHOD_ID;
        });

        var sql = "SELECT PK_SYSTEM_CONTROL_TEST_PROCEDURE_TYPE_ID, NAME FROM system_control_test_procedure_types_default";
        return connection.query(sql);
    }).then(([results, buf]) => {
        results.forEach(r => {
            procedureTypeID[r.NAME] = r.PK_SYSTEM_CONTROL_TEST_PROCEDURE_TYPE_ID;
        });

        var sql = 'SELECT PK_TEST_SCOPE_DEFAULT_ID, NAME FROM test_scope_default';
        return connection.query(sql);
    }).then(([results, buf]) => {
        results.forEach(r => {
            scopeID[r.NAME] = r.PK_TEST_SCOPE_DEFAULT_ID;
        });

        var sql = 'SELECT PK_CATALOG_DEFAULT_ID, NAME FROM catalog_default';
        return connection.query(sql);
    }).then(([results, buf]) => {
        results.forEach(r => {
            catalogID[r.NAME] = r.PK_CATALOG_DEFAULT_ID;
        });

        var sql = 'SELECT PK_STAGE_DEFAULT_ID, NAME FROM stage_default';
        return connection.query(sql);
    }).then(([results, buf]) => {
        results.forEach(r => {
            stageID[r.NAME] = r.PK_STAGE_DEFAULT_ID;
        });

        var sql = 'SELECT PK_COMPONENT_TYPE_DEFAULT_ID, NAME FROM component_type_default';
        return connection.query(sql);
    }).then(([results, buf]) => {
        results.forEach(r => {
            componentTypeID[r.NAME] = r.PK_COMPONENT_TYPE_DEFAULT_ID;
            componentTypeName[r.PK_COMPONENT_TYPE_DEFAULT_ID] = r.NAME;

            if (r.NAME.split('/')[1] != undefined && r.NAME.split('/')[1] != '*') {
                component_subtypes.push(r.NAME);
            }
        });

        if (_.isEmpty(componentTypeID)) all_comp_types.push('default');

        var sql = 'SELECT PK_COMPONENT_PRODUCT_DEFAULT_ID, NAME FROM component_product_default';
        return connection.query(sql);
    }).then(([results, buf]) => {
        results.forEach(r => {
            componentProductID[r.NAME] = r.PK_COMPONENT_PRODUCT_DEFAULT_ID;
            componentProductName[r.PK_COMPONENT_PRODUCT_DEFAULT_ID] = r.NAME;
        });

        if (_.isEmpty(componentProductID)) all_comp_prods.push('GENERIC');

        var sql = 'SELECT PK_COMPONENT_ID, FK_TYPE_ID, FK_PRODUCT_ID FROM components';
        return connection.query(sql);
    }).then(([results, buf]) => {
        results.forEach(r => {
            if ((componentTypeName[r.FK_TYPE_ID] != undefined) && (componentProductName[r.FK_PRODUCT_ID] != undefined)) {
                componentID[componentTypeName[r.FK_TYPE_ID] + ':' + componentProductName[r.FK_PRODUCT_ID]] = r.PK_COMPONENT_ID;
            } else {
                console.log(`Couldn't find ID!! \n Type id: ${r.FK_TYPE_ID} \n Product id: ${r.FK_PRODUCT_ID}`);
            }
        });

        // #########
        //  Filters
        // #########

        // Sort and filter spreadsheet data
        var csv_checks = _.sortedUniq(records.map(rec => rec.check_method).sort()).filter(x => x != '');
        var csv_systems = _.sortedUniq(records.map(rec => rec.depends_on).sort()).filter(x => x != '');

        // Keep only records for which we have a control
        var bad_recs = records.filter(x => !controlID[x.control]);
        if (bad_recs.length > 0) {
            console.warn('Warning: following records will be ignored due to non-existing control names');
            records_log(bad_recs);
        }
        records = records.filter(x => controlID[x.control]);

        // filter out wildcard records
        records = records.map(rec => {

            // normalization
            // rec.component_type = rec.component_type.toLowerCase();
            // Set record default values and wildcard handling
            if (rec.component_type == '') rec.component_type = 'default';
            if (rec.component_product == '') rec.component_product = 'GENERIC';
            diff_scopes.push(rec.scope);

            var rec_copy = {};
            rec_copy = Object.assign(rec_copy, rec);

            // populate wildcard list
            if (rec.component_type == '*' || rec.component_type[rec.component_type.length - 1] == '*') {
                csv_wildcard_records.push(rec);
            }
            if (rec.component_type.split('/')[1] != undefined) {
                all_comp_types.push(rec.component_type.split('/')[0]);
                if (rec.component_type.split('/')[1][0] != '*') {
                    component_subtypes.push(rec.component_type);
                } else if (rec.component_type.split('/')[1][0] == '*') {
                    rec_copy.component_type = rec_copy.component_type.split('/')[0];
                    non_subtype.push(rec_copy);
                }
            }

            return rec;
        }).filter(rec => rec.component_type != '*' && rec.component_type[rec.component_type.length - 1] != '*');

        var csv_component_types = _.sortedUniq(records.map(rec => rec.component_type).sort()).filter(x => x != '');
        var csv_component_products = _.sortedUniq(records.map(rec => rec.component_product).sort()).filter(x => x != '');

        // remove duplicate values
        component_subtypes = _.uniq(component_subtypes);
        diff_scopes = _.uniq(diff_scopes);

        // Compare query data to spreadsheet data and store diffs
        diff_scopes = diff_scopes.filter(x => x != "" && typeof scopeID[x] === 'undefined');
        diff_systems = csv_systems.filter(x => typeof systemID[x] === 'undefined');
        diff_checks = csv_checks.filter(x => typeof procedureTypeID[x] === 'undefined');
        diff_component_products = csv_component_products.filter(x => typeof componentProductID[x] === 'undefined');
        diff_component_types = csv_component_types.filter(x => typeof componentTypeID[x] === 'undefined');

        if (debugFlag) {
            console.log(`Incoming Systems: ${JSON.stringify(diff_systems)}`);
            console.log(`Incoming Scopes: ${JSON.stringify(diff_scopes)}`);
            console.log(`Incoming Component Types: ${JSON.stringify(diff_component_types)}`);
            console.log(`Incoming Component Products: ${JSON.stringify(diff_component_products)}\n`);
        }

        // if forceFlag is true, we need to insert missing reference data, update reference arrays, and continue.
        // else if forceFlag is false, just keep going...

        if (!forceFlag) {
            let fail = false;
            if (diff_systems.length > 0) {
                console.error("ERROR: too many systems listed in CSV file.  The following are not in the database:");
                diff_systems.forEach(x => { console.error(x); });
                fail = true;
            }
            if (diff_checks.length > 0) {
                console.error("ERROR: too many check_methods listed in CSV file.  The following are not in the database:");
                diff_checks.forEach((x, i) => { console.error(`${i}:${x}`); });
                fail = true;
            }
            if (diff_component_types.length > 0) {
                console.error("ERROR: too many component types listed in CSV file.  The following are not in the database:");
                diff_component_types.forEach((x, i) => { console.error(`${i}:${x}`); });
                fail = true;
            }
            if (diff_component_products.length > 0) {
                console.error("ERROR: too many component products listed in CSV file.  The following are not in the database:");
                diff_component_products.forEach((x, i) => { console.error(`${i}:${x}`); });
                fail = true;
            }
            if (fail) {
                throw "ERROR: failed on systems and/or check_methods unable to continue";
            }
        }


        // #########
        //  INSERTs
        // #########

        return Promise.mapSeries(diff_systems, (rec, i) => {
            if (debugFlag) console.log(`inserting new system: '${rec}'`);

            var sql = "INSERT INTO system (NAME, ACRONYM, FK_CATEGORIZATION_ID, DESCRIPTION, HIGH_VALUE_ASSET, ACTIVE, IS_REMOTE) VALUES (?,?,?,?,?,?,?);";
            sql = mysql2.format(sql, [rec, rec.slice(0, 7), 2, '', 0, 0, 1]);
            return connection.query(sql);
        });
    }).then(results => {

        // add missing systems to the systemID map along with insertId
        if (results.length > 0) {
            results.forEach((x, i) => {
                if (x[0] != null) { systemID[diff_systems[i]] = x[0].insertId; }
            });
        }

        // now add all roles for each system defaulting as the admin user (1).
        return Promise.mapSeries(diff_systems, (rec, i) => {
            if (debugFlag) console.log(`inserting default roles for system: '${rec}'`);

            const id = systemID[rec];
            var sql = `INSERT INTO system_role (FK_SYSTEM_ID, FK_USER_ID, FK_ROLE_ID)
                       SELECT ${id}, 1, PK_ROLE_ID from system_roles_default`;
            return connection.query(sql);
        });
    }).then(([results, buf]) => {

        return Promise.mapSeries(diff_checks, (rec, i) => {
            if (debugFlag) console.log(`inserting new check: '${rec}'`);

            var sql = "INSERT INTO system_control_test_procedure_types_default (NAME, COMMAND_TO_EXECUTE) VALUES (?,?)";
            sql = mysql2.format(sql, [rec, null]);
            return connection.query(sql);
        });
    }).then(results => {

        // add missing checks to the procedureTypeID map along with insertId
        if (results.length > 0) {
            results.forEach((x, i) => {
                if (x != null) {
                    procedureTypeID[diff_checks[i]] = x[0].insertId;
                }
            });
        }

        // adding partial wildcard records to records structure
        for (let i = 0; i < csv_wildcard_records.length; i++) {
            for (let j = 0; j < component_subtypes.length; j++) {
                var wc_rec = {};
                wc_rec = Object.assign(wc_rec, csv_wildcard_records[i]);
                var prime_type = wc_rec.component_type.split('/')[0];
                var sub_type = component_subtypes[j].split('/')[1];

                if (wc_rec.component_type.split('/')[1] != undefined && wc_rec.component_type != '*') {
                    if (prime_type == component_subtypes[j].split('/')[0]) {
                        var comp_type = prime_type + '/' + sub_type;
                        wc_rec.component_type = comp_type;
                        records.push(wc_rec);
                        all_comp_types.push(comp_type);
                    }
                }
            }
        }

        // combine all component types
        all_comp_types = _.uniq(Object.keys(componentTypeID).concat(diff_component_types).concat(all_comp_types));

        // add wildcard records to record list
        csv_wildcard_records.forEach(rec => {
            if (rec.component_type == '*') {
                all_comp_types.forEach(comp_type => {
                    if (comp_type != 'default') { // exclude default from '*'
                        var wc_rec = {};
                        wc_rec = Object.assign(wc_rec, rec);
                        wc_rec.component_type = comp_type;
                        records.push(wc_rec);
                    }
                });
            }
        });

        // add wild card records without a component_type subtype (ex. network, service; not network/firewall)
        non_subtype.forEach(rec => records.push(rec));

        // remove component types that are already in DB
        new_comp_types = all_comp_types.filter(comp_type => !Object.keys(componentTypeID).includes(comp_type));

        return Promise.mapSeries(new_comp_types, (type, i) => {
            var sql = `INSERT INTO component_type_default (NAME) VALUES(?)`;
            if (debugFlag) console.log(`inserting component type: '${type}'`);
            sql = mysql2.format(sql, type);
            return connection.query(sql);
        });
    }).then(results => {

        if (results.length > 0) {
            results.forEach((comp_type_insert, i) => {
                if (comp_type_insert[0] != null) {
                    componentTypeID[new_comp_types[i]] = comp_type_insert[0].insertId;
                }
            });
        }

        return Promise.mapSeries(diff_component_products, (rec, i) => {
            var sql = `INSERT INTO component_product_default (NAME) VALUES(?)`;
            if (debugFlag) console.log(`inserting component product: '${rec}'`);
            sql = mysql2.format(sql, rec);
            return connection.query(sql);
        });
    }).then(results => {

        if (results.length > 0) {
            results.forEach((comp_prod_insert, i) => {
                if (comp_prod_insert[0] != null) {
                    componentProductID[diff_component_products[i]] = comp_prod_insert[0].insertId;
                }
            });
        }

        // populate csv_comp_type_product with values from spreadsheet
        var csv_comp_type_product = {};
        records.map(rec => `${rec.component_type}:${rec.component_product}`)
            .filter(val => val != ':' && val.indexOf('*') == -1 && val.split(':')[0].length > 0 && val.split(':')[1].length > 0)
            .forEach(val => csv_comp_type_product[val] = 1);

        csv_type_product = Object.keys(csv_comp_type_product).filter(val => typeof componentID[val] == 'undefined');

        return Promise.mapSeries(csv_type_product, (rec, i) => {
            var parts = rec.split(':');
            var prod = parts[1];
            var type = parts[0];

            if (componentTypeID[type] == null) {
                console.log('Error!!!');
                console.log(rec);
            }

            var sql = `INSERT INTO components (FK_PRODUCT_ID, FK_TYPE_ID) VALUES(?, ?)`;
            sql = mysql2.format(sql, [componentProductID[prod], componentTypeID[type]]);
            return connection.query(sql);
        });
    }).then(results => {

        if (results.length > 0) {
            results.forEach((comp_insert, i) => {
                if (comp_insert[0] != null) {
                    componentID[csv_type_product[i]] = comp_insert[0].insertId;
                }
            });
        }

        return Promise.mapSeries(diff_scopes, rec => {

            var sql = 'INSERT INTO test_scope_default (NAME) VALUES(?)';
            if (debugFlag) console.log(`inserting scope: '${rec}'`);
            sql = mysql2.format(sql, rec);
            return connection.query(sql);
        });
    }).then(results => {

        results.forEach((r, i) => {
            if (r[0] != null) {
                scopeID[diff_scopes[i]] = r[0].insertId;
            }
        });

        if (debugFlag) console.log("Delete existing system_control_test for system: " + systemID[sys]);

        // delete existing system_control_test in prep for new ones being inserted from reading CSV file
        var sql = "DELETE FROM system_control_test WHERE FK_SYSTEM_ID = ?";
        var query = [systemID[sys]];
        sql = mysql2.format(sql, query);
        return connection.query(sql);

    }).then(() => {

        return Promise.each(records, (rec, rec_no) => {

            if (rec.title == '') rec.title = rec.name + ' test';
            //if (rec.component_product == '') rec.applicable = 0;
            if (rec.is_inheritable == '') rec.is_inheritable = 0;
            if (rec.risk_accepted == '') rec.risk_accepted = 0;
            if (rec.depends_on != null && rec.depends_on != '') rec.is_inheritable = 1;
            if (rec.stage == '') rec.stage = 'default';
            if (rec.scope == '') rec.scope = 'component';

            var pval = procedureTypeID[rec.check_method === '' ? 'manual' : rec.check_method];
            if (pval === undefined) { throw `No such procedure ${rec.check_method}`; }

            if (rec.check_method == '' || rec.check_method == 'manual') {

                rec.is_manual = 'Y';

            } else {

                rec.is_manual = 'N';

            }

            var dval = rec.depends_on === '' ? null : look_up(systemID, rec.depends_on, 'system', rec_no);
            if (dval === undefined) { throw `No such system ${rec.depends_on}`; }

            if (sys === rec.depends_on) {
                console.warn(`Warning: in record ${rec_no}, depends_on field is same as imported system. Setting to empty`);
                dval = null;
            }
            if (!rec.name.startsWith(rec.control)) {
                console.error(`Error: in record ${rec_no} Control id ${rec.control} should be the prefix to ${rec.name} so we are skipping.`);
                return;
            }

            try {
                const today = new Date();
                var inserts = {
                    "FK_SYSTEM_ID": look_up(systemID, sys, 'system', rec_no),
                    "FK_SECURITY_CONTROL_ID": look_up(controlID, rec.control, 'controlID', rec_no),
                    "FK_PROCEDURE_TYPE_ID": pval,
                    "FK_ROLE_ID": look_up(roleID, 'Evidence Provider', 'roleID', rec_no),
                    "CONTROL_ITEM": rec.name,
                    "TITLE": rec.title,
                    "DESCRIPTION": rec.description,
                    "FREQUENCY": rec.frequency.toUpperCase(),
                    "AUTO_EVIDENCE": rec.auto_evidence,
                    "GATHERED_EVIDENCE": rec.gathered_evidence,
                    "RUNTIME_CHECK": yn(rec.runtime_check),
                    "APPLICABLE": yn(rec.applicable),
                    "IS_MANUAL": yn(rec.is_manual),
                    "DEPENDS_ON_SYSTEM_ID": dval,
                    "CCI": null,
                    "HYBRID": yn(rec.hybrid),
                    "SOURCE_ENV": null,
                    "FK_SOURCE_ID": 14,
                    "FK_TEST_METHOD_ID": 3,
                    "TEST_OBJECTIVE": rec.test_objective,
                    "RECOMMENDED_CORRECTIVE_ACTION": null,
                    "FK_COMPONENT_ID": look_up(componentID, `${rec.component_type}:${rec.component_product}`, 'componentID', rec_no),
                    "FK_SCOPE_ID": look_up(scopeID, rec.scope, 'scopeID', rec_no),
                    "INHERITABLE": rec.is_inheritable,
                    "RISK_ACCEPTED": rec.risk_accepted,
                    "BASELINE_DATE": today.toISOString().slice(0, -1), // no zulu
                    "FK_CATALOG_ID": 2,
                    "BASELINE_TEST_ID": 0,
                    "FK_CATEGORIZATION_ID": hml(rec.baseline),
                    "FK_STAGE_ID": look_up(stageID, rec.stage, 'stageID', rec_no),
                    "PII_ONLY": yn(rec.pii_specific),
                    "RATIONALE": rec.rationale
                };

                var sql = createInsert('system_control_test', inserts);
                sql = mysql2.format(sql.query, sql.values);
                return connection.query(sql);

            } catch (ex) {
                console.error(`Caught exception ${ex}. Skipping Record`);
            }

            return true;  // A value is a promise, right?

        }).catch(ex => console.log("Promise: " + ex));

    }).then(() => {

        if (debugFlag) console.log("Done adding tests...");
        return connection.end();
    }).catch(err => {
        console.error('Promise Exception Caught in test_import.js:');
        console.error(`err: ${err}`);
        if (typeof err.stack != 'undefined') console.error(`err.stack: ${err.stack}`);
        if (connection != null) connection.end();
    });
};

// Helper Functions

function look_up(obj, val, name, rec_no) {

    if (obj) {
        if (typeof obj[val] != 'undefined') {
            return (obj[val]);
        } else {
            console.log(`On record ${rec_no + 1} value '${val}' not found in object ${name}`);
            throw (`Value ${val} not found in object ${name}`);
        }
    } else { console.log(`no object in lookup ${name}`); }

}
function yn(s) {
    return (s === 'y' || s === 'Y' ? 1 : 0);
}
function hml(status) {
    status = status.toLowerCase();
    if (status === 'h') { return 3; }
    else if (status === 'm') { return 2; }
    else return 1;
}
function records_log(recs) {
    recs.forEach((r, i) => {
        console.log(`${i + 1} ${r.control} ${r.name} ${r.description.slice(0, 32)}`);
    });
}
// throws error if not parseable or missing file.
function read_csv_file(fileStream) {
    //const input = fs.readFileSync(fileStream, 'utf8');
    var records = parse(fileStream, {
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

    for (var j = 0; j < values.length; j++) {
        if (j > 0) {
            query += ',';
        }

        query += valuePlaceholder(j, fields[j]);
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
