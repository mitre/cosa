/*
   Copyright 2021 The MITRE Corporation

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

  var appRouter = function (config) {

    var express = require('express');
    var router = express.Router();

    const bluebird = require("bluebird");
    const Promise = bluebird;
    const parse = require('csv-parse/lib/sync');
    const fs = require('fs');
    const deepTrim = require('../scripts/test_import/deepTrim');
    const _ = require('lodash');
    const mysql2 = require('mysql2/promise');

    var catBuilder = require('../scripts/cosa_builder/cosa_build');
    const test_importer = require('../scripts/test_import/test_import.js');

    var userRestrict = require('./userRestrict');

    var coreFunctions = require('./coreFunctions.js'); // call all the functions in coreFunctions.js from this file.

    /* GET existing Systems to display on the demo.ejs page */
    router.get('/demo', userRestrict.siteAdminRestrict, function (req, res) {
        coreFunctions.getSystems(req.connection, function (results) {
            res.render('pages/demo', {
                config:config,
                systems: results,                
                systemName: config.rserver.systemName
            });
        });
    });

    /* GET addNewSystem  page. */
    router.get('/system', userRestrict.siteAdminRestrict, function (req, res, next) {
        coreFunctions.getUsers(req.connection, function (results) {
            coreFunctions.getCategorizations(req.connection, function (results2) {
                res.status(200).send({
                    'message': 'Success',
                    'users': results,
                    'categories': results2
                });
            });
        });
    });

    /* Save a New System to the database */
    router.post('/CreateSystem', userRestrict.siteAdminRestrictWCode, function (req, res) {
        var systemID = req.body.systemID;
        var name = req.body.name;
        var acronym = req.body.acronym;
        var categorization = req.body.categorization;
        var description = req.body.description;
        var active = req.body.active;
        var adminIDs = req.body.admins;
        var adminRoleID; // from system_roles_default table
        var evidenceApproverIDs = req.body.evidenceApprovers;
        var evidenceApproverRoleID; // from system_roles_default table
        var evidenceProviderIDs = req.body.evidenceProviders;
        var evidenceProviderRoleID; // from system_roles_default table
        var userIDs = req.body.users;
        var userRoleID; // from system_roles_default table

        if (description == null) description = "";

        var sql_1 = "SELECT COUNT(*) AS systemCount FROM system WHERE NAME = ?";
        req.connection.query(sql_1, [name], function (err, result_1) {
            if (err) {
                console.log('SQL ERR: ' + JSON.stringify(err));
                res.send('Error: '+JSON.stringify(err));
            } else if (result_1[0].systemCount == 0) {
                var sql_2 = "INSERT INTO system (NAME, ACRONYM, FK_CATEGORIZATION_ID, DESCRIPTION, ACTIVE) VALUES (?,?,?,?,?)";
                req.connection.query(sql_2, [name, acronym, categorization, description, active], function (err, result_2) {
                    //console.log(JSON.stringify(result_2));
                    if (err) {
                        console.log('SQL ERR: ' + JSON.stringify(err));
                        res.send('Error: '+JSON.stringify(err));
                    } else {
                        var newSystemID = result_2.insertId; // returned from Database INSERT result_2

                        // ADD THE ROLE to System_Role table for this New System and the selected UserId
                        // Get the Role IDs for the default roles in System_Roles_Default table
                        coreFunctions.getSystemRoles(req.connection, function (result_3) {
                            var sql4 = "INSERT INTO system_role (FK_SYSTEM_ID, FK_USER_ID, FK_ROLE_ID) VALUES (?,?,?)";
                            result_3.forEach(function (role) {
                                if (role.NAME.indexOf('Admin') != '-1') {
                                    // add each admin from the admins selected on the GUI
                                    if (adminIDs != null) {
                                        adminRoleID = role.PK_ROLE_ID;
                                        for (var i = 0, a; a = adminIDs[i]; i++) {
                                            // insert into System_Role table
                                            req.connection.query(sql4, [newSystemID, a, adminRoleID], function (err_4, result_4) {
                                                if (err_4) {
                                                    console.log('SQL ERR: ' + JSON.stringify(err_4));
                                                    res.send('Error: '+JSON.stringify(err_4));
                                                }
                                            });
                                        } // end for loop
                                    } //end if != null
                                }
                                if (role.NAME.indexOf('Evidence Approver') != '-1') {
                                    // add each evidenceApprover from the evidenceApprovers selected on the GUI
                                    if (evidenceApproverIDs != null) {
                                        evidenceApproverRoleID = role.PK_ROLE_ID;
                                        for (var i = 0, ea; ea = evidenceApproverIDs[i]; i++) {
                                            // insert into System_Role table
                                            req.connection.query(sql4, [newSystemID, ea, evidenceApproverRoleID], function (err_4, result_4) {
                                                if (err_4) {
                                                    console.log('SQL ERR: ' + JSON.stringify(err_4));
                                                    res.send('Error: '+JSON.stringify(err_4));
                                                }
                                            });
                                        } // end for loop
                                    } //end if != null
                                }
                                if (role.NAME.indexOf('Evidence Provider') != '-1') {
                                    // add each evidenceProvider from the evidenceProviders selected on the GUI
                                    if (evidenceProviderIDs != null) {
                                        evidenceProviderRoleID = role.PK_ROLE_ID;
                                        for (var i = 0, ep; ep = evidenceProviderIDs[i]; i++) {
                                            // insert into System_Role table
                                            req.connection.query(sql4, [newSystemID, ep, evidenceProviderRoleID], function (err_4, result_4) {
                                                if (err_4) {
                                                    console.log('SQL ERR: ' + JSON.stringify(err_4));
                                                    res.send('Error: '+JSON.stringify(err_4));
                                                }
                                            });
                                        } // end for loop
                                    } //end if != null
                                }
                                if (role.NAME.indexOf('Process Auditor') != '-1') {
                                    // add each processAuditor from the processAuditors selected on the GUI
                                    if (processAuditorIDs != null) {
                                        processAuditorRoleID = role.PK_ROLE_ID;
                                        for (var i = 0, pa; pa = processAuditorIDs[i]; i++) {
                                            // insert into System_Role table
                                            req.connection.query(sql4, [newSystemID, pa, processAuditorRoleID], function (err_4, result_4) {
                                                if (err_4) {
                                                    console.log('SQL ERR: ' + JSON.stringify(err_4));
                                                    res.send('Error: '+JSON.stringify(err_4));
                                                }
                                            });
                                        } // end for loop
                                    } //end if != null
                                }
                                if (role.NAME.indexOf('Test Automator') != '-1') {
                                    // add each testAutomator from the testAutomators selected on the GUI
                                    if (testAutomatorIDs != null) {
                                        testAutomatorRoleID = role.PK_ROLE_ID;
                                        for (var i = 0, ra; ra = testAutomatorIDs[i]; i++) {
                                            // insert into System_Role table
                                            req.connection.query(sql4, [newSystemID, ra, testAutomatorRoleID], function (err_4, result_4) {
                                                if (err_4) {
                                                    console.log('SQL ERR: ' + JSON.stringify(err_4));
                                                    res.send('Error: '+JSON.stringify(err_4));
                                                }
                                            });
                                        } // end for loop
                                    } //end if != null
                                }
                                if (role.NAME.indexOf('Test Author') != '-1') {
                                    // add each testAuthor from the testAuthors selected on the GUI
                                    if (testAuthorIDs != null) {
                                        testAuthorRoleID = role.PK_ROLE_ID;
                                        for (var i = 0, rAuth; rAuth = testAuthorIDs[i]; i++) {
                                            // insert into System_Role table
                                            req.connection.query(sql4, [newSystemID, rAuth, testAuthorRoleID], function (err_4, result_4) {
                                                if (err_4) {
                                                    console.log('SQL ERR: ' + JSON.stringify(err_4));
                                                    res.send('Error: '+JSON.stringify(err_4));
                                                }
                                            });
                                        } // end for loop
                                    } //end if != null
                                }
                                if (role.NAME.indexOf('Security Auditor') != '-1') {
                                    // add each securityAuditor from the securityAuditors selected on the GUI
                                    if (securityAuditorIDs != null) {
                                        securityAuditorRoleID = role.PK_ROLE_ID;
                                        for (var i = 0, sAud; sAud = securityAuditorIDs[i]; i++) {
                                            // insert into System_Role table
                                            req.connection.query(sql4, [newSystemID, sAud, securityAuditorRoleID], function (err_4, result_4) {
                                                if (err_4) {
                                                    console.log('SQL ERR: ' + JSON.stringify(err_4));
                                                    res.send('Error: '+JSON.stringify(err_4));
                                                }
                                            });
                                        } // end for loop
                                    } //end if != null
                                }
                                if (role.NAME.indexOf('User') != '-1') {
                                    // add each user from the users selected on the GUI
                                    if (userIDs != null) {
                                        userRoleID = role.PK_ROLE_ID;
                                        for (var i = 0, uId; uId = userIDs[i]; i++) {
                                            // insert into System_Role table
                                            req.connection.query(sql4, [newSystemID, uId, userRoleID], function (err_4, result_4) {
                                                if (err_4) {
                                                    console.log('SQL ERR: ' + JSON.stringify(err_4));
                                                    res.send('Error: '+JSON.stringify(err_4));
                                                }
                                            });
                                        } // end for loop
                                    } //end if != null
                                }
                            }); //end for each roles
                            console.log("System created: " + name);
                            res.status(200).send(result_3.affectedRows + "System record created");
                        }); // end result3
                    }
                });
            } else {
                console.log("System already exists for : " + name);
                res.status(400).send("System already exists for :" + name);
            }
        });
    });

    /* Update a System record selected on the manageSystems.ejs page */
    router.post('/updateSystem', userRestrict.siteAdminRestrictWCode, function (req, res) {
        var systemID = parseInt(req.body.systemID);
        var name = req.body.name;
        var acronym = req.body.acronym;
        var categorization = req.body.categorization;
        var description = req.body.description;
        var active = req.body.active;
        var adminIDs = req.body.admins;
        var adminRoleID; // from system_roles_default table
        var evidenceApproverIDs = req.body.evidenceApprovers;
        var evidenceApproverRoleID; // from system_roles_default table
        var evidenceProviderIDs = req.body.evidenceProviders;
        var evidenceProviderRoleID; // from system_roles_default table
        var userIDs = req.body.users;
        var userRoleID; // from system_roles_default table

        if (coreFunctions.isValid(systemID)) {
            let sql_2 = "UPDATE system SET NAME = ?, ACRONYM = ?, FK_CATEGORIZATION_ID = ?, DESCRIPTION = ?, ACTIVE = ? WHERE PK_SYSTEM_ID = ?;";
            req.connection.query(sql_2, [name, acronym, categorization, description, active, systemID], function (err_2, result_2) {
                if (err_2) {
                    console.log('SQL ERR: ' + err_2);
                    res.send('SQL Error');
                } else {
                    // UPDATE System_Role for this SystemID
                    // Get the Role IDs for the default roles in System_Roles_Default table
                    coreFunctions.getSystemRoles(req.connection, function (result_3) {
                        var sql4 = "INSERT INTO system_role (FK_SYSTEM_ID, FK_USER_ID, FK_ROLE_ID) VALUES (?,?,?)";
                        // drop and recreate roles, otherwise all user_x and system_x get the new role. Users can have multiple roles in a system.
                        var dropSQL = "DELETE FROM system_role where FK_SYSTEM_ID = ?";
                        req.connection.query(dropSQL, [systemID], function (err_drop, result_drop) {
                            if (err_drop) {
                                console.log('SQL ERR: ' + JSON.stringify(err_drop));
                                res.send('SQL Error');
                            }
                        });
                        // Now do inserts of roles for this system
                        result_3.forEach(function (role) {
                            //console.log("systemID: "+ systemID);
                            if (role.NAME.indexOf('Admin') != '-1') {
                                // add each admin from the admins selected on the GUI
                                if (adminIDs != null) {
                                    adminRoleID = role.PK_ROLE_ID;
                                    for (var i = 0, aId; aId = adminIDs[i]; i++) {
                                        // insert into System_Role table
                                        req.connection.query(sql4, [systemID, aId, adminRoleID], function (err_4, result_4) {
                                            if (err_4) {
                                                console.log('SQL ERR: ' + JSON.stringify(err_4));
                                                res.send('SQL Error');
                                            }
                                        });
                                    } // end for loop
                                } // end if != null
                            }
                            if (role.NAME.indexOf('Evidence Approver') != '-1') {
                                // add each evidenceApprover from the evidenceApprovers selected on the GUI
                                if (evidenceApproverIDs != null) {
                                    evidenceApproverRoleID = role.PK_ROLE_ID;
                                    for (var i = 0, ea; ea = evidenceApproverIDs[i]; i++) {
                                        // insert into System_Role table
                                        req.connection.query(sql4, [systemID, ea, evidenceApproverRoleID], function (err_4, result_4) {
                                            if (err_4) {
                                                console.log('SQL ERR: ' + JSON.stringify(err_4));
                                                res.send('SQL Error');
                                            }
                                        });
                                    } // end for loop
                                } // end if != null
                            }
                            if (role.NAME.indexOf('Evidence Provider') != '-1') {
                                // add each evidenceProvider from the evidenceProviders selected on the GUI
                                if (evidenceProviderIDs != null) {
                                    evidenceProviderRoleID = role.PK_ROLE_ID;
                                    for (var i = 0, ep; ep = evidenceProviderIDs[i]; i++) {
                                        // insert into System_Role table
                                        req.connection.query(sql4, [systemID, ep, evidenceProviderRoleID], function (err_4, result_4) {
                                            if (err_4) {
                                                console.log('SQL ERR: ' + JSON.stringify(err_4));
                                                res.send('SQL Error');
                                            }
                                        });
                                    } // end for loop
                                } // end if != null
                            }
                           
                            if (role.NAME.indexOf('User') != '-1') {
                                // add each user from the users selected on the GUI
                                if (userIDs != null) {
                                    userRoleID = role.PK_ROLE_ID;
                                    for (var i = 0, uId; uId = userIDs[i]; i++) {
                                        // insert into System_Role table
                                        req.connection.query(sql4, [systemID, uId, userRoleID], function (err_4, result_4) {
                                            if (err_4) {
                                                console.log('SQL ERR: ' + JSON.stringify(err_4));
                                                res.send('SQL Error');
                                            }
                                        });
                                    } // end for loop
                                } // end if != null
                            }
                        }); //end for each
                    }); //end query result_3
                    res.send(result_2.affectedRows + ' record updated.');
                } // end else
            }); //end query result_2
        } // end if
    });

    /* GET existing Systems to display on the manageSystems.ejs page */
    router.get('/manageSystems', userRestrict.siteAdminRestrict, function (req, res) {

        var sql = `SELECT system.PK_SYSTEM_ID, system.NAME, system.ACRONYM, system.FK_CATEGORIZATION_ID, system.DESCRIPTION, system.ACTIVE, categorization_default.NAME as CATEGORIZATION
                   FROM system
                   INNER JOIN categorization_default ON categorization_default.PK_CATEGORIZATION_ID = system.FK_CATEGORIZATION_ID`;
        req.connection.query(sql, function (err, results) {
            if (err) {
                console.log('SQL ERR: ' + JSON.stringify(err));
                res.send('Error: '+JSON.stringify(err));
            } else {
                coreFunctions.getUsers(req.connection, function (results2) {
                    coreFunctions.getCategorizations(req.connection, function (results3) {
                        res.render('pages/manageSystems', {
                            config:config,
                            systems: results,
                            'users': results2,
                            categories: results3
                        });
                    });
                });
            }
        });
    });

    /* populate system info modal on manageSystems.ejs page */
    router.get('/getSystemInfo', userRestrict.siteAdminRestrictWCode, function (req, res) {
        let systemID = req.query.systemID; //Validate this
        let sql = `SELECT system.PK_SYSTEM_ID, system.NAME, system.ACRONYM, system.DESCRIPTION,
        system.ACTIVE, system.FK_CATEGORIZATION_ID,
        system_role.FK_USER_ID, user.USER_NAME, system_roles_default.NAME as ROLE_NAME
        FROM system_role INNER JOIN system ON system.PK_SYSTEM_ID = system_role.FK_SYSTEM_ID
        INNER JOIN user ON user.PK_USER_ID = system_role.FK_USER_ID
        INNER JOIN system_roles_default ON system_roles_default.PK_ROLE_ID = system_role.FK_ROLE_ID
        WHERE system.PK_SYSTEM_ID = ?`;
        req.connection.query(sql, [systemID], function (err, results) {
            //console.log(JSON.stringify(results));
            if (err) {
                console.log("SQL Error: " + JSON.stringify(err) + sql);
                res.status(401).send({
                    'message': 'Error: ' + JSON.stringify(err)
                });
            } else {
                res.status(200).send({
                    'message': 'Success',
                    'data': results
                });
            }
        });
    });

    /* delete a selected System from manageSystems.ejs page */
    router.post('/deleteSystem', userRestrict.siteAdminRestrictWCode, function (req, res) {
        let systemID = parseInt(req.body.systemID);
        if (coreFunctions.isValid(systemID)) { 
            let sql = "DELETE FROM system WHERE PK_SYSTEM_ID = ?;";
            req.connection.query(sql, [systemID], function (err, result) {
                if (err) {
                    console.log('SQL ERR: ' + JSON.stringify(err));
                    res.send('Error: '+JSON.stringify(err));
                } else {
                    console.log("System deleted");
                    res.send(result.affectedRows + ' record updated.');
                }
            });
        } else {
            res.send('Bad Inputs')
        }
    });

    /* BUILD COSA file */
    router.get('/getCOSAFile', function (req, res) {
        var fs = require('fs');
        var systemName = req.query.systemName;
        var include_satisfied = false;
        if (typeof req.query.include_satisfied != 'undefined') {
            include_satisfied = !! parseInt(req.query.include_satisfied);
        }

        catBuilder(systemName, include_satisfied, function (data) {
            if (data != null) {
                console.log(">>>>>>>>> " + data)
                res.download(__dirname + "/../" + data);
            } else {
                res.status(200).send({
                    'message': 'No data available to build a COSA file for System for ' + systemName,
                });
            }
        })

    });

    router.get('/checkIfCOSAReportExists', userRestrict.siteAdminRestrictWCode, function (req, res) {
        var systemId = req.query.systemID;
        let sql = `SELECT scr.FK_SYSTEM_ID, s.NAME FROM system_control_test scr
                   JOIN system s ON scr.FK_SYSTEM_ID=s.PK_SYSTEM_ID
                   WHERE scr.FK_SYSTEM_ID = ?
                   Limit 1;`;
        req.connection.query(sql, [systemId], function (err, result) {
            if (err) {
                console.log('SQL ERR: ' + err);
                res.send('err');
            } else {
                let sId = ''
                let sName = ''
                if (result.length == 1) {
                    sId = result[0].FK_SYSTEM_ID
                    sName = result[0].NAME
                }
                res.status(200).send({
                    'id': sId,
                    'name': sName
                });
            }
        });
    });

    /* truncate the work_item_result table */
    router.post('/deleteAllTestsAndFindings', userRestrict.siteAdminRestrictWCode, function (req, res) {
        var dbName = req.connection.config.database;
        var systemName = req.query.systemName;
        var sql = "TRUNCATE `" + dbName + "`.`work_item_result`;";
        req.connection.query(sql, function (err, result) {
            if (err) {
                console.log('SQL ERR: ' + err);
                res.send('err');
            } else {
                console.log("All system_control_tests deleted");
                console.log("All work_item_results deleted");
                // now remove all the Tests
                // cannot truncate due to FK, so must get FK_SYSTEM_ID to DELETE by ID
                var sql = "SELECT DISTINCT FK_SYSTEM_ID FROM system_control_test";
                req.connection.query(sql, function (err, result1) {
                    if (err) {
                        console.log('SQL ERR: ' + JSON.stringify(err));
                        res.send('Error: '+JSON.stringify(err));
                    } else {
                        result1.forEach(function (sys) {
                            var sqlDel = "DELETE FROM system_control_test WHERE FK_SYSTEM_ID = ?";
                            req.connection.query(sqlDel, [sys], function (err, result1) { });
                        }); //end for each
                        res.send(result.affectedRows + ' records deleted.');
                    }
                });
            }
        });
    });


    /* Insert tests into system_control_test table, and (Trigger in DB) INSERT of default Findings into the work_item_result table */
    router.post('/insertTestsAndFindings', userRestrict.siteAdminRestrictWCode, function (req, res) {
        const useNewTestsEngine = true;

        var systemName = req.body.systemName;

        console.log('Loading for Sys Name: ' + systemName);

        try {
            if (useNewTestsEngine) {
                // note: uses config.
                loadTestsNew(systemName, './scripts/test_import/' + systemName + '.csv', req.config, function (status) {
                    console.log('status: ' + status);
                    res.status(200).send({
                        'status': status,
                        'message': 'DB Load completed for ' + systemName,
                    });
                    console.log(`in callback`);
                    coreFunctions.inheritAllFindings(req.connection, ()=> { console.log("Processed inheritance"); })
                })
            } else {
                console.log(`using original version`);
                loadTestsOrig(systemName, './scripts/test_import/' + systemName + '.csv', req, function (status) {
                    console.log('status: ' + status);
                    res.status(200).send({
                        'status': status,
                        'message': 'DB Load completed for ' + systemName,
                    });
                })
            }
        } catch (ex) {
            console.log(`caught exception ${ex}`);
        }
    });


    // function will remove existing tests and load in new ones from csv file specified
    function loadTestsOrig(systemName, fileName, req, callback) {
        var sys = systemName;
        var fn = fileName;
        const mysql = require('promise-mysql')
        if (!systemName) {
            usage("Missing System")
        }
        if (!fileName) {
            usage("Missing File Name")
        }
        try {
            const input = fs.readFileSync(fn, 'utf8')

            const records = parse(input, {
                columns: true,
                skip_empty_lines: true
            })

            function look_up(arr, val, name) {
                if (arr[val])
                    return (arr[val])
                else {
                    console.log(`On record ${rec_no + 1} value '${val}' not found in array ${name}`)
                    throw (`Value ${val} not found in array ${name}`)
                }
            }

            function yn(s) {
                return (s === 'y' || s === 'Y' ? 1 : 0)
            }
            var rec_no = -1
            var system = []
            var roleID = []
            var sourceID = []
            var testMethodID = []
            var controlID = []
            var procedureTypeID = []
            // value system array
            coreFunctions.getSystems(req.connection, function (results) {
                results.forEach(r => {
                    system[r.NAME] = r.PK_SYSTEM_ID
                });
                // value controlID array
                coreFunctions.getSecurityControls(req.connection, function (results) {
                    results.forEach(r => {
                        controlID[r.NAME] = r.PK_SECURITY_CONTROL_ID
                    });
                    // value roleID array
                    coreFunctions.getSystemRoles(req.connection, function (results) {
                        results.forEach(r => {
                            roleID[r.NAME] = r.PK_ROLE_ID
                        });
                        // value sourceID array
                        coreFunctions.getTestSources(req.connection, function (results) {
                            results.forEach(r => {
                                sourceID[r.NAME] = r.PK_TEST_SOURCE_ID
                            });
                            // value testMethodID array
                            coreFunctions.getTestMethods(req.connection, function (results) {
                                results.forEach(r => {
                                    testMethodID[r.NAME] = r.PK_TEST_METHOD_ID
                                });
                                // value procedureTypeID array
                                coreFunctions.getProcedureTypes(req.connection, function (results) {
                                    results.forEach(r => {
                                        procedureTypeID[r.NAME] = r.PK_SYSTEM_CONTROL_TEST_PROCEDURE_TYPE_ID
                                    });
                                    // delete existing system_control_test in prep for new ones being inserted from reading CSV file
                                    var sql = "DELETE FROM system_control_test WHERE FK_SYSTEM_ID = ?";
                                    var inserts = [system[sys]];
                                    sql = mysql.format(sql, inserts);
                                    req.connection.query(sql, function (err, results) {
                                        if (err) {
                                            console.log('SQL ERR: ' + err);
                                            return callback("error in loading tests");
                                        } else {

                                            Promise.each(records, (rec, i) => {
                                                rec_no = i
                                                // insert new system_control_test from CSV file
                                                var sql = `INSERT INTO system_control_test (FK_SYSTEM_ID,
                                                                            FK_SECURITY_CONTROL_ID,
                                                                            FK_PROCEDURE_TYPE_ID,
                                                                            FK_ROLE_ID,
                                                                            CONTROL_ITEM,
                                                                            TITLE,
                                                                            DESCRIPTION,
                                                                            FREQUENCY,
                                                                            AUTO_EVIDENCE,
                                                                            GATHERED_EVIDENCE,
                                                                            RUNTIME_CHECK,
                                                                            APPLICABLE,
                                                                            IS_MANUAL,
                                                                            DEPENDS_ON_SYSTEM_ID,
                                                                            CCI,
                                                                            HYBRID,
                                                                            SOURCE_ENV,
                                                                            FK_SOURCE_ID,
                                                                            FK_TEST_METHOD_ID,
                                                                            TEST_OBJECTIVE,
                                                                            RECOMMENDED_CORRECTIVE_ACTION)
                                                                            VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

                                                // Insert into DB, these values
                                                try {
                                                    var inserts = [look_up(system, sys, 'system'),
                                                    look_up(controlID, rec.control, 'controlID'),
                                                    procedureTypeID[rec.check_method],
                                                    look_up(roleID, 'Evidence Provider', 'roleID'),
                                                    rec.NAME,
                                                    rec.TITLE,
                                                    rec.DESCRIPTION,
                                                    rec.FREQUENCY,
                                                    rec.AUTO_EVIDENCE,
                                                    rec.GATHERED_EVIDENCE,
                                                    yn(rec.RUNTIME_CHECK),
                                                    yn(rec.APPLICABLE),
                                                    yn(rec.IS_MANUAL),
                                                    rec.DEPENDS_ON === '' ? null : look_up(system, rec.DEPENDS_ON, 'system'),
                                                        null,
                                                        0,
                                                        null,
                                                        14,
                                                        3,
                                                        null,
                                                        null
                                                    ];

                                                    sql = mysql.format(sql, inserts);
                                                } catch (ex) {
                                                    return;
                                                }

                                                // insert into DB here
                                                req.connection.query(sql);

                                            }).then(function () {
                                                return callback("success");
                                            });
                                        }
                                    });
                                });
                            });
                        });
                    });
                });
            });
        } catch (error) {
            console.log(error)
            return callback("fail");
        }
    }
    // displayRoutes();

    /* load procedures from predefined file */
    router.post('/loadProcedures', userRestrict.siteAdminRestrictWCode, function (req, res) {
        const config = req.config;
        const sql = `INSERT INTO system_control_test_procedure_types_default
        (NAME, COMMAND_TO_EXECUTE)
        values (?,?)
        ON DUPLICATE KEY UPDATE COMMAND_TO_EXECUTE = ?`;
        const filename = './data/procedures.csv';
        try {
            fs.readFile(filename, 'utf8', (err, text) => {
                if (err) {
                    console.error('Unable to open bad input file.');
                    res.status(404).send({ msg: 'Bad input file' });
                    return
                }
                var records = parse(text, {
                    columns: true,
                    skip_empty_lines: true
                });
                records = deepTrim(records);
                records = records.filter(x => x.NAME != ''); // make sure name not empty

                Promise.each(records, rec => {
                    // connection automatically released...
                    return req.mysql2_pool.query(sql, [rec.NAME, rec.COMMAND_TO_EXECUTE, rec.COMMAND_TO_EXECUTE]);
                }).catch(ex => {
                    res.status(404).send({ msg: 'Unsuccessful import.' });
                }).then(() => {
                    console.log(`Loaded a file with ${records.length} records.`);
                    res.status(200).send({ msg: 'Successfully imported.' });
                });
            });
        } catch (ex) {
            console.log(`unexpected exception ${ex}`);
        }
    });

    router.get('/logview', userRestrict.siteAdminRestrict, (req, res) => {
        const logfile = 'logs/system.log';
        fs.readFile(logfile, 'utf8', (err, data) => {
            if (err) {
                console.error(`Error: ${err}`);
                data = "Error: Unable to open log file.";
            }
            var items = data.split('\n');
            res.render('pages/logview', { config:config, items: items.slice(0, 500) });
        });
    });


    // new version based on common library code for command line p_import.js
    // sadly, uses a different version of mysql to connect.
    function loadTestsNew(systemName, fileName, config, callback) {
        try {
            test_importer.test_import_mysql2(systemName, fileName, config, true, true).then(() => {
                if (callback) return callback("success");
            }).catch(exc => {
                console.log(`Promise Exception: ${exc}`);
            });
        } catch (ex) {
            console.log(`error:`);
            console.error(`Exception:`);
            console.error(ex);
            req.end();
        }
    }
    function displayRoutes() 
    {
        // Function to display the route table for ExpressJS
        router.stack.forEach(layer => {
            console.log(`Regex: ${layer.regexp}`);
            console.log(`  path: ${layer.route.path}`)
            console.dir(layer.route);
        });
    }
    
    return router;

}


module.exports = appRouter;
