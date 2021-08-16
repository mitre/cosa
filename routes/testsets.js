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

    var userRestrict = require('./userRestrict');
    var encoder = require('encoder.js');
    var coreFunctions = require('./coreFunctions.js'); // call all the functions in coreFunctions.js from this file.

    router.get('/systemselect', userRestrict.siteAdminRestrict, function (req, res) {
        var sql = `SELECT system.PK_SYSTEM_ID, system.NAME, system.ACRONYM, system.FK_CATEGORIZATION_ID,
        categorization_default.NAME as CATEGORIZATION FROM system
        INNER JOIN categorization_default ON categorization_default.PK_CATEGORIZATION_ID = system.FK_CATEGORIZATION_ID
        WHERE system.ACTIVE != 0 AND system.IS_REMOTE = 0`;

        req.connection.query(sql, function (err, results) {
            if (err) {
                console.log("SQL Error: " + err);
            } else {
                res.render('pages/systemselect', {
                    config: config,
                    systems: results
                });
            }
        });
    });

    router.get('/procedures', userRestrict.siteAdminRestrict, function (req, res) {
        var sql = "SELECT * FROM system_control_test_procedure_types_default; ";

        req.connection.query(sql, function (err, results) {
            if (err) {
                console.log("SQL Error: " + err);
            } else {
                res.render('pages/procedures', {
                    config: config,
                    procedures: results
                });
            }
        });
    });

    router.post('/updateProcedure', userRestrict.siteAdminRestrictWCode, function (req, res) {

        var procedureId = req.body.procedureId;
        var procedureName = req.body.procedureName;
        var commandToExecute = req.body.commandToExecute;

        // console.log("Id: " + procedureId);
        // console.log("Name: " + procedureName);
        // console.log("Command: " + commandToExecute);

        let sql = `UPDATE system_control_test_procedure_types_default SET NAME = ?, COMMAND_TO_EXECUTE = ?
        WHERE PK_SYSTEM_CONTROL_TEST_PROCEDURE_TYPE_ID = ?`;

        req.connection.query(sql, [procedureName, commandToExecute, procedureId], function (err, result) {

            if (err) {

                console.log('SQL ERR: ' + err);
                res.send('err');

            } else {

                res.send(result.affectedRows + ' record updated.');

            }
        });
    });

    router.get('/testsetselect/:systemId', userRestrict.siteAdminRestrict, function (req, res) {
        let systemId = req.params.systemId; //Validate this
        coreFunctions.getSystemNameById(req.connection, systemId, function (results) { // Get System name to display on GUI.
            coreFunctions.getSecurityControls(req.connection, function (results2) { // Grab all the security control names for the drop down.
                coreFunctions.getSystemRoles(req.connection, function (results3) { // Grab all the role names for the drop down.
                    coreFunctions.getProcedureTypes(req.connection, function (results4) { // Grab all the procedure names for the drop down.
                        coreFunctions.getSystems(req.connection, function (results5) { // Grab all the systems for the drop down.
                            coreFunctions.getSecurityControlsForSystemId(req.connection, systemId, function (results6) { // Get Security Control Info for a SystemID to display on GUI.
                                coreFunctions.getTestSources(req.connection, function (results7) { // Grab all the test names for the drop down.
                                    coreFunctions.getTestMethods(req.connection, function (results8) { // Grab all the test method names for the drop down.
                                        coreFunctions.getCategorizations(req.connection, function (results9) { // Grab all the test categorization names for the drop down.
                                            res.render('pages/testsetselect', {
                                                config: config,
                                                system: results,
                                                allcontrols: results2,
                                                roles: results3,
                                                methods: results4,
                                                systems: results4,
                                                systemcontrols: results6,
                                                sources: results7,
                                                testMethods: results8,
                                                categorizations: results9,
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });

    /*
     * method to display all tests in a DataTable with inline editing
     */
    router.get('/manageAllSystemTests/:systemId', userRestrict.siteAdminRestrict, function (req, res) {

        let systemId = req.params.systemId;

        //console.log("System: " + JSON.stringify(req.query));
        console.log("System: " + systemId);

        req.connection.query('SELECT * FROM system WHERE PK_SYSTEM_ID = ?;', [systemId], function (err, system) {
            req.connection.query('SELECT * FROM system_control_test_procedure_types_default;', function (err, procedures) {
                req.connection.query('SELECT * FROM catalog_default;', function (err, catalogs) {
                    req.connection.query('SELECT PK_SYSTEM_ID, NAME FROM system;', function (err, allSystems) {
                        req.connection.query('SELECT * FROM test_method_default;', function (err, testMethods) {
                            req.connection.query('SELECT * FROM categorization_default;', function (err, categorizations) {
                                req.connection.query('SELECT * FROM component_type_default;', function (err, components) {
                                    req.connection.query('SELECT PK_SECURITY_CONTROL_ID, NAME, TITLE FROM security_control;', function (err, controls) {
                                        req.connection.query('SELECT * FROM test_source_default;', function (err, testSources) {
                                            req.connection.query('SELECT * FROM test_scope_default;', function (err, testScopes) {
                                                req.connection.query('SELECT * FROM stage_default;', function (err, stages) {
                                                    res.render('pages/testManagement', {
                                                        config: config,
                                                        options_categorizations: categorizations,
                                                        options_testMethods: testMethods,
                                                        options_testSources: testSources,
                                                        options_testScopes: testScopes,
                                                        options_components: components,
                                                        options_controls: controls,
                                                        options_allSystems: allSystems,
                                                        options_stages: stages,
                                                        options_procedures: procedures,
                                                        options_catalogs: catalogs,
                                                        systemId: system[0].PK_SYSTEM_ID,
                                                        systemName: system[0].NAME
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });

    router.get('/API/getAllSystemTests/:systemId', userRestrict.siteAdminRestrict, function (req, res) {

        let systemId = req.params.systemId; //Validate this
        // displayColumns below ABSOLUTELY must be in correct order for sorting to work -JC
        const displayColumns = [
            "PK_SYSTEM_CONTROL_TEST_ID",    //  0
            "PROCEDURE_NAME",               //  1
            "CONTROL_ITEM",                 //  2
            "SECURITY_CONTROL_NAME",        //  3
            "TEST_TITLE",                   //  4
            "FREQUENCY",                    //  5
            "AUTO_EVIDENCE",                //  6
            "GATHERED_EVIDENCE",            //  7
            "INHERITED_FROM",               //  8
            "CCI",                          //  9
            "SOURCE_NAME",                  // 10
            "METHOD_NAME",                  // 11
            "COMPONENT_TYPE_NAME",          // 12
            "SCOPE_NAME",                   // 13
            "CATALOG_NAME",                 // 14
            "STAGE_NAME",                   // 15
            "TEST_CATEGORIZATION_NAME",     // 16
            "RUNTIME_CHECK",                // 17
            "APPLICABLE",                   // 18
            "HYBRID",                       // 19
            "INHERITABLE",                  // 20
            "IS_MANUAL",                    // 21
            "RISK_ACCEPTED",                // 22
            "PII_ONLY",                     // 23
            "ITEM_DESC",                    // 24
            "TEST_OBJECTIVE",               // 25
            "RECOMMENDED_CORRECTIVE_ACTION",// 26
            "RATIONALE"                     // 27
        ];
        //console.log(displayColumns);
        let draw = req.query.draw;
        let offset = req.query.start;
        let limit = req.query.length;
        let orderBy, orderDir;
        orderBy = 0;
        let search = '';
        if (req.query.order) {
            orderBy = req.query.order[0].column;
            orderDir = req.query.order[0].dir;
        }
        if (req.query.search) {
            if (req.query.search['value'])
                search = req.query.search['value']
        }
        //console.log(orderBy, orderDir, search);
        search = '%' + search + '%';
        let direction = (orderDir == 'desc') ? 'DESC' : 'ASC';

        offset = (offset) ? parseInt(offset) : 0;
        limit = (limit) ? parseInt(limit) : 10;


        var sqlCount = `SELECT count(*) AS total FROM all_items WHERE FK_SYSTEM_ID = ?;`;
        // sqlDatatable below ABSOLUTELY must be in the same order as displayColumns above for sorting to work -JC
        var sqlDatatable = `SELECT *
        FROM all_items WHERE FK_SYSTEM_ID = ? AND CONCAT_WS(' ', PK_SYSTEM_CONTROL_TEST_ID, PROCEDURE_NAME,
        CONTROL_ITEM, SECURITY_CONTROL_NAME, TEST_TITLE, FREQUENCY, AUTO_EVIDENCE, GATHERED_EVIDENCE,
        INHERITED_FROM, CCI, SOURCE_NAME, METHOD_NAME, COMPONENT_TYPE_NAME, SCOPE_NAME,
        CATALOG_NAME, STAGE_NAME, TEST_CATEGORIZATION_NAME, RUNTIME_CHECK, APPLICABLE, HYBRID, INHERITABLE,
        IS_MANUAL, RISK_ACCEPTED, PII_ONLY, ITEM_DESC, TEST_OBJECTIVE, RECOMMENDED_CORRECTIVE_ACTION,
        RATIONALE) LIKE ? ORDER BY ?? `+ direction + `;`;
        var params = [systemId, search, displayColumns[orderBy]];
        console.log(params, direction)

        req.connection.query(sqlCount, [systemId], function (err, total) {
            req.connection.query(sqlDatatable, params, function (err, results) {
                if (err) {
                    console.log("SQL Error: " + err)
                    res.status(500).send("Error");
                } else {
                    let tableData = {
                        "draw": draw,
                        "recordsTotal": total[0].total,
                        "recordsFiltered": results.length,
                        "data": results.slice(offset, offset + limit)
                    }
                    res.status(200).send(tableData);
                }
            });
        });
    });

    /* POST Remove a component from the System */
    router.post('/API/updateTest', function (req, res) {
        //let systemID = req.body.systemID;
        // Keep this order correct for the update statement's case -JC
        let testName = req.body.testName;
        let control = req.body.control;
        let procedure = req.body.procedure;
        let title = req.body.title;
        let itemDesc = req.body.itemDesc;
        let frequency = req.body.frequency;
        let autoEvidence = req.body.autoEvidence;
        let gatheredEvidence = req.body.gatheredEvidence;
        let runTime = '0';
        if (req.body.runTime == 'true') {
            runTime = '1';
        }
        let applicable = '0';
        if (req.body.applicable == 'true') {
            applicable = '1';
        }
        let manual = '0';
        if (req.body.manual == 'true') {
            manual = '1';
        }
        let dependsOn = req.body.dependsOn;
        let cci = req.body.cci;
        let hybrid = '0';
        if (req.body.hybrid == 'true') {
            hybrid = '1';
        }
        let sourceID = req.body.sourceID;
        let methodID = req.body.methodID;
        let testObjective = req.body.testObjective;
        let recommendedCorrectiveAction = req.body.recommendedCorrectiveAction;
        let componentID = req.body.componentID;
        let scopeID = req.body.scopeID;
        let inheritable = '0';
        if (req.body.inheritable == 'true') {
            inheritable = '1';
        }
        let riskAccepted = '0';
        if (req.body.riskAccepted == 'true') {
            riskAccepted = '1';
        }
        let catalogID = req.body.catalogID;
        let stageID = req.body.stageID;
        let piiOnly = '0';
        if (req.body.piiOnly == 'true') {
            piiOnly = '1';
        }
        let rationale = req.body.rationale;
        let categorization = req.body.categorization;
        let testID = req.body.testID;

        let params = [
            testName,
            control,
            procedure,
            title,
            itemDesc,
            frequency,
            autoEvidence,
            gatheredEvidence,
            runTime,
            applicable,
            manual,
            dependsOn,
            cci,
            hybrid,
            sourceID,
            methodID,
            testObjective,
            recommendedCorrectiveAction,
            componentID,
            scopeID,
            inheritable,
            riskAccepted,
            catalogID,
            stageID,
            piiOnly,
            rationale,
            categorization,
            testID
        ];

        // console.log(params) // Good for trouble shooting in-line updates -JC

        var sql = `UPDATE system_control_test
                    SET
                    CONTROL_ITEM = ?,
                    FK_SECURITY_CONTROL_ID = ?,
                    FK_PROCEDURE_TYPE_ID = ?,
                    TITLE = ?,
                    DESCRIPTION = ?,
                    FREQUENCY = ?,
                    AUTO_EVIDENCE = ?,
                    GATHERED_EVIDENCE = ?,
                    RUNTIME_CHECK = ?,
                    APPLICABLE = ?,
                    IS_MANUAL = ?,
                    DEPENDS_ON_SYSTEM_ID = ?,
                    CCI = ?,
                    HYBRID = ?,
                    FK_SOURCE_ID = ?,
                    FK_TEST_METHOD_ID = ?,
                    TEST_OBJECTIVE = ?,
                    RECOMMENDED_CORRECTIVE_ACTION = ?,
                    FK_COMPONENT_ID = ?,
                    FK_SCOPE_ID = ?,
                    INHERITABLE = ?,
                    RISK_ACCEPTED = ?,
                    FK_CATALOG_ID = ?,
                    FK_STAGE_ID = ?,
                    PII_ONLY = ?,
                    RATIONALE = ?,
                    FK_CATEGORIZATION_ID = ?
                    WHERE PK_SYSTEM_CONTROL_TEST_ID = ?`;

        req.connection.query(sql, params, function (err, results) {
            if (err) {
                console.log('SQL ERR: ' + err);
                res.status(500).send("Error");
            } else {
                res.status(200).send("Success");
            }
        });
    });

    router.get('/testsetadd/:systemId', userRestrict.siteAdminRestrict, function (req, res) {

        let systemId = req.params.systemId; //Validate this

        console.log("Adding tests.");
        console.log("SystemId: " + systemId);

        coreFunctions.getSystemNameById(req.connection, systemId, function (results) { // Get System name to display on GUI.
            coreFunctions.getSecurityControlsForSystemId(req.connection, systemId, function (results2) { // Grab all the security controls for this system.)
                coreFunctions.getSystemRoles(req.connection, function (results3) { // Grab all the role names for the drop down.
                    coreFunctions.getSystems(req.connection, function (results4) { // Grab all the systems for the drop down.
                        coreFunctions.getCatalogs(req.connection, 'SYSTEM', systemId, null, function (results5) { // Grab all the procedure names for the drop down.
                            coreFunctions.getProcedureTypes(req.connection, function (results6) { // Grab all the procedure names for the drop down.
                                coreFunctions.getTestSources(req.connection, function (results7) { // Grab all the test names for the drop down.
                                    coreFunctions.getTestMethods(req.connection, function (results8) { // Grab all the test method names for the drop down.
                                        coreFunctions.getStages(req.connection, function (results9) { // Grab all the stages for the drop down.
                                            coreFunctions.getScopes(req.connection, function (results10) { // Grab all the scopes for the drop down.
                                                coreFunctions.getComponents(req.connection, function (results11) { // Grab all the components for the drop down.
                                                    coreFunctions.getCategorizations(req.connection, function (results12) { // Grab all the categorizations for the drop down.

                                                        res.render('pages/testsetadd', {
                                                            config: config,
                                                            system: results,
                                                            controls: results2,
                                                            roles: results3,
                                                            systems: results4,
                                                            catalogs: results5,
                                                            methods: results6,
                                                            sources: results7,
                                                            testMethods: results8,
                                                            stages: results9,
                                                            scopes: results10,
                                                            components: results11,
                                                            categorizations: results12
                                                        });
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
    
    router.get('/testsetselect/:systemId/getTestInfo', userRestrict.siteAdminRestrictWCode, function (req, res) {

        //console.log("getTestInfo");

        let systemId = req.params.systemId; //Validate this
        let controlId = req.query.controlId;

        let sql = "SELECT * FROM system_control_test WHERE FK_SYSTEM_ID = ? AND FK_SECURITY_CONTROL_ID = ?";

        req.connection.query(sql, [systemId, controlId], function (err, results) {

            if (err) {

                console.log("SQL Error: " + err + sql);
                res.status(200).send({
                    'message': 'Error'
                });

            } else {

                res.status(200).send({
                    'message': 'Success',
                    'tests': results

                });
            }
        });
    });

    /* Save a NEW tests page */
    router.post('/testsetadd/:systemId/addTests', userRestrict.siteAdminRestrictWCode, function (req, res) {

        var systemId = req.params.systemId;
        var controlId = req.body.controlId;
        var tests = JSON.parse(req.body.tests);

        //console.log('Adding tests...');
        //console.log('systemId :' + systemId);
        //console.log('controlId :' + controlId);
        //console.log('tests :' + tests);

        var sql_1 = "SELECT COUNT(*) AS testCount FROM system_control_test WHERE FK_SYSTEM_ID = ? AND FK_SECURITY_CONTROL_ID = ?";

        req.connection.query(sql_1, [systemId, controlId], function (err_1, result_1) {

            var testCount = result_1[0].testCount;

            if (err_1) {

                console.log("SQL Error1: " + err_1);
                res.send(err_1);

            } else {


                if (tests != null) {

                    for (var i = 0; i < tests.length; i++) {

                        var test = tests[i];

                        var testControlItem = test[0];
                        var testTitle = test[1];
                        var testDescription = test[2];
                        var testApplicable = test[3];
                        var testMethod = test[4];
                        var testFrequency = test[5];
                        var testAutoEvidence = test[6];
                        var testGatheredEvidence = test[7];
                        var testRole = test[8];
                        var testRuntime = test[9];
                        var testDepends = test[10];
                        var testCCI = test[11];
                        var testHybrid = test[12];
                        var testSourceEnv = test[13];
                        var testSourceType = test[14];
                        var testTestMethod = test[15];
                        var testObjectives = test[16];
                        var testActions = test[17];
                        var testComponent = test[18];
                        var testIsManual = test[19];
                        var testScope = test[20];
                        var testInheritable = test[21];
                        var testRiskAccepted = test[22];
                        var testCatalog = test[23];
                        var testBaseline = test[24];
                        var testStage = test[25];
                        var testPII = test[26];
                        var testRationale = test[27];
                        var testCategorization = test[28];


                        var sql_3 = "INSERT INTO system_control_test (FK_SYSTEM_ID, FK_SECURITY_CONTROL_ID, FK_PROCEDURE_TYPE_ID, FK_ROLE_ID, CONTROL_ITEM, TITLE, DESCRIPTION, FREQUENCY, " +
                            "AUTO_EVIDENCE, GATHERED_EVIDENCE, RUNTIME_CHECK, APPLICABLE, IS_MANUAL, DEPENDS_ON_SYSTEM_ID, " +
                            "CCI, HYBRID, SOURCE_ENV, FK_SOURCE_ID, FK_TEST_METHOD_ID, TEST_OBJECTIVE, RECOMMENDED_CORRECTIVE_ACTION, " +
                            "FK_COMPONENT_ID, FK_SCOPE_ID, INHERITABLE, RISK_ACCEPTED, FK_CATALOG_ID," +
                            "BASELINE_TEST_ID, FK_STAGE_ID, PII_ONLY, RATIONALE, FK_CATEGORIZATION_ID) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";

                        req.connection.query(sql_3, [systemId, controlId, testMethod, testRole, testControlItem, testTitle, testDescription,
                            testFrequency, testAutoEvidence, testGatheredEvidence, testRuntime,
                            testApplicable, testIsManual, testDepends, testCCI, testHybrid, testSourceEnv, testSourceType,
                            testTestMethod, testObjectives, testActions, testComponent, testScope, testInheritable, testRiskAccepted,
                            testCatalog, testBaseline, testStage, testPII, testRationale, testCategorization], function (err_3, result_3) {

                            if (err_3) {

                                console.log("SQL Error3 (Cannot add tests): " + err_3);

                            }
                        }); // end req.connection
                    } // end for loop
                }

                res.send("Success");

            }
        });
    });

    /* delete a selected test set */
    router.post('/testsetselect/:systemId/deleteTests', userRestrict.siteAdminRestrictWCode, function (req, res) {

        //console.log('In delete tests');

        let systemId = parseInt(req.params.systemId);
        let controlId = parseInt(req.body.controlId);

        if (coreFunctions.isValid(systemId) && coreFunctions.isValid(controlId)) {

            let sql = "DELETE FROM system_control_test WHERE FK_SYSTEM_ID = ? AND FK_SECURITY_CONTROL_ID = ? ;";

            req.connection.query(sql, [systemId, controlId], function (err, result) {

                if (err) {

                    console.log('SQL ERR: ' + err);
                    res.send('err');

                } else {


                    res.send(result.affectedRows + ' record updated.');

                }
            });

        } else {

            res.send('Bad Inputs')

        }
    });

    /* Update test records selected */
    router.post('/testsetselect/:systemId/updateTests', userRestrict.siteAdminRestrictWCode, function (req, res) {

        //console.log('In update tests');

        var systemId = parseInt(req.params.systemId);
        var controlId = parseInt(req.body.controlId);
        var tests = JSON.parse(req.body.tests);

        //console.log('systemId: ' + systemId);
        //console.log('controlId: ' + controlId);
        //console.log('Tests: ' + tests);

        if (coreFunctions.isValid(systemId) && coreFunctions.isValid(controlId)) {

            // Delete these tests.

            let sql2 = "DELETE FROM system_control_test WHERE FK_SYSTEM_ID = ? AND FK_SECURITY_CONTROL_ID = ? ;";

            req.connection.query(sql2, [systemId, controlId], function (err2, result2) {

                if (err2) {

                    console.log('SQL ERR: ' + err2);
                    res.send('err');

                } else {

                    console.log('Deleted tests');
                    // Now insert the updated tests.

                    let sql = "INSERT INTO system_control_test (FK_SYSTEM_ID, FK_SECURITY_CONTROL_ID, FK_PROCEDURE_TYPE_ID, FK_ROLE_ID, CONTROL_ITEM, DESCRIPTION, FREQUENCY, AUTO_EVIDENCE, " +
                        "GATHERED_EVIDENCE, RUNTIME_CHECK, APPLICABLE, IS_MANUAL, DEPENDS_ON_SYSTEM_ID, " +
                        "CCI, HYBRID, SOURCE_ENV, FK_SOURCE_ID, FK_TEST_METHOD_ID, TEST_OBJECTIVE, RECOMMENDED_CORRECTIVE_ACTION, " +
                        "FK_COMPONENT_ID, FK_SCOPE_ID, INHERITABLE, RISK_ACCEPTED, FK_CATALOG_ID," +
                        "BASELINE_TEST_ID, FK_STAGE_ID, PII_ONLY, RATIONALE, FK_CATEGORIZATION_ID) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";

                    console.log('Tests length: ' + tests.length);

                    for (var i = 0; i < tests.length; i++) {

                        var test = tests[i];

                        var testControlItem = test[0];
                        var testDescription = test[1];
                        var testApplicable = test[2];
                        var testMethod = test[3];
                        var testFrequency = test[4];
                        var testAutoEvidence = test[5];
                        var testGatheredEvidence = test[6];
                        var testRole = test[7];
                        var testRuntime = test[8];
                        var testDepends = test[9];
                        var testCCI = test[10];
                        var testHybrid = test[11];
                        var testSourceEnv = test[12];
                        var testSourceType = test[13];
                        var testMethod = test[14];
                        var testObjectives = test[15];
                        var testActions = test[16];
                        var testComponent = test[17];
                        var testIsManual = test[18];
                        var testScope = test[19];
                        var testInheritable = test[20];
                        var testRiskAccepted = test[21];
                        var testCatalog = test[22];
                        var testBaseline = test[23];
                        var testStage = test[24];
                        var testPII = test[25];
                        var testRationale = test[26];
                        var testCategorization = test[27];


                        req.connection.query(sql, [systemId, controlId, testMethod, testRole, testControlItem, testDescription,
                            testFrequency, testAutoEvidence, testGatheredEvidence, testRuntime, testApplicable, testIsManual, testDepends,
                            testCCI, testHybrid, testSourceEnv, testSourceType,
                            testMethod, testObjectives, testActions, testComponent, testScope, testInheritable, testRiskAccepted,
                            testCatalog, testBaseline, testStage, testPII, testRationale, testCategorization
                        ], function (err, result) {
                            if (err) {
                                console.log('SQL ERR: ' + err);
                                res.send('err');
                            }
                            console.log('Updated rows: ' + result.affectedRows);
                        });
                    }

                    console.log('Updated rows: ' + result2.affectedRows);
                    res.send('success');

                }
            });

        } else {
            res.send('Bad Inputs')
        }
    });
    return router;
}
module.exports = appRouter;
