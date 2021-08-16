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
    var coreFunctions = require('./coreFunctions.js');
    const test_importer = require('../scripts/test_import/test_import.js');

    // The user has chosen setup COSA.
    function clearSystems(req, callback) {

        console.log("Clear system table for all systems...");

        // Delete all existing REMOTE systems. We can keep the non-remote ones for now.
        var sql2 = "DELETE FROM system WHERE PK_SYSTEM_ID > 0";

        req.connection.query(sql2, function (err2, result2) {

            if (err2) {

                console.log('SQL ERR: ' + JSON.stringify(err2));
                callback("Error");

            } else {

                console.log("Cleared systems");
                callback("Success");

            }
        });
    }

    function buildRemoteSystemTests(systemId, req, callback) {

        console.log("Building remote system tests for: " + systemId + "...");

        // If the Depends On value equals the System Name a new Baseline Test is being created for, make Inheritable field = true and Depends On = null
        var sql = `INSERT INTO system_control_test (FK_SYSTEM_ID, FK_SECURITY_CONTROL_ID, FK_PROCEDURE_TYPE_ID,   
                               FK_ROLE_ID, CONTROL_ITEM, TITLE, DESCRIPTION, FREQUENCY, 
                               AUTO_EVIDENCE, GATHERED_EVIDENCE, RUNTIME_CHECK,
                               APPLICABLE, IS_MANUAL, DEPENDS_ON_SYSTEM_ID, CCI, HYBRID,         
                               SOURCE_ENV, FK_SOURCE_ID, FK_TEST_METHOD_ID,         
                               TEST_OBJECTIVE, RECOMMENDED_CORRECTIVE_ACTION,  
                               FK_COMPONENT_ID, FK_SCOPE_ID, INHERITABLE,      
                               RISK_ACCEPTED, FK_CATALOG_ID, BASELINE_TEST_ID,   
                               BASELINE_DATE, FK_STAGE_ID, PII_ONLY, RATIONALE, FK_CATEGORIZATION_ID)                       
                        SELECT ? AS FK_SYSTEM_ID, FK_SECURITY_CONTROL_ID, FK_PROCEDURE_TYPE_ID,     
                                        FK_ROLE_ID, CONTROL_ITEM, TITLE, DESCRIPTION, FREQUENCY,            
                                        AUTO_EVIDENCE, GATHERED_EVIDENCE, RUNTIME_CHECK,          
                                        APPLICABLE, IS_MANUAL, null AS DEPENDS_ON_SYSTEM_ID, CCI,            
                                        HYBRID, SOURCE_ENV, FK_SOURCE_ID, FK_TEST_METHOD_ID,     
                                        TEST_OBJECTIVE, RECOMMENDED_CORRECTIVE_ACTION,       
                                        FK_COMPONENT_ID, FK_SCOPE_ID, 1 AS INHERITABLE,       
                                        RISK_ACCEPTED, FK_CATALOG_ID, BASELINE_TEST_ID,       
                                        CURRENT_TIMESTAMP() AS BASELINE_DATE, FK_STAGE_ID, 
                                        PII_ONLY, RATIONALE, FK_CATEGORIZATION_ID                                    
                        FROM system_control_test                                    
                        WHERE FK_SYSTEM_ID = 0 AND DEPENDS_ON_SYSTEM_ID = ?`;

        req.connection.query(sql, [systemId, systemId], function (err, results) {

            if (err) {

                console.log('SQL ERR: ' + err);
                callback("Error");

            } else {

                console.log("Deploying remote system: " + systemId + "...");

                coreFunctions.deploySystem(req.connection, systemId, function (deployResult) {

                    if (deployResult != 'Success') {

                        console.log("Error deploying remote system: " + systemId);
                        callback('Error');

                    } else {

                        console.log("Remote sytem deployed: " + systemId);
                        callback("Success");

                    }
                });
            }
        });
    };

    function setupAndDeployRemoteSystems(req, callback) {

        console.log('Getting the remote systems to build tests for...');

        // Get the remote systems
        var sql = `SELECT * FROM system WHERE system.IS_REMOTE = 1 AND system.ACTIVE = 0`;

        req.connection.query(sql, function (err, results) {

            if (err) {

                console.log('SQL ERR: ' + JSON.stringify(err));
                return callback('Error');

            } else {

                // For each remote system
                for (var i = 0, result; result = results[i]; i++) {

                    var systemId = result.PK_SYSTEM_ID;

                    // Add all new Baseline tests 
                    buildRemoteSystemTests(systemId, req, function (buildResult) {

                        console.log("Build result: " + buildResult);

                    });
                }

                return callback("Success");

            }
        });
    }

    // new version based on common library code for command line p_import.js
    // sadly, uses a different version of mysql to connect.
    function loadTests(systemName, filedata, req, callback) {

        console.log(`Loading: ` + systemName);
        console.log(`Filedata: ` + JSON.stringify(filedata));

        try {

            test_importer.test_import_mysql2(systemName, filedata, req.config, true, true).then(() => {

                console.log("Completed for: " + systemName);

                if (callback) {

                    console.log("Callback!");

                    return callback("Success");


                }
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

    function loadTestFile(name, path, contents, req, callback) {

        const clamd = require('clamdjs')

        if (config.clamAV.active == true) {

            console.log("ClamAV: " + config.clamAV.host);
            console.log("ClamAV Port: " + config.clamAV.port);

            // Scan the file.
            const scanner = clamd.createScanner(config.clamAV.host, config.clamAV.port);

            scanner.scanBuffer(contents, 3000, 1024 * 1024)
                .then(function (reply) {

                    console.log("Scan result: " + reply)

                    // 'stream: OK', if not infected    
                    if (reply.includes("stream: OK")) {

                        console.log("Storing file: " + name);

                        loadTests('CATALOG', contents, req, function (loadTestsResult) {

                            console.log("Callback: " + loadTestsResult);

                            if (loadTestsResult != "Success") {

                                console.log("Error loading the baseline ts from: " + path);

                                return callback("Error: " + loadTestsResult);

                            } else {

                                console.log("Successfully loaded the baseline tests from: " + name);

                                return callback("Success");

                            }
                        });

                    } else {

                        console.log("File fails virus scan: " + name);
                        // `stream: ${virus} FOUND`, if infected
                        return callback("ERROR: File fails virus scan: " + name + " Msg: " + reply);

                    }
                })
                .catch(function (error) {

                    console.error(error);

                });

        } else {

            loadTests('CATALOG', contents, req, function (loadTestsResult) {

                console.log("Callback: " + loadTestsResult);

                if (loadTestsResult != "Success") {

                    console.log("Error loading the baseline ts from: " + path);

                    return callback("Error: " + loadTestsResult);

                } else {

                    console.log("Successfully loaded the baseline tests from: " + name);

                    return callback("Success");

                }
            });
        };
    };

    router.post('/loadTests', userRestrict.restrict, function (req, res) {


        var fileName = req.body.fileName;
        var filePath = req.body.filePath;
        var fileContent = req.body.fileContent;

        // Load the tests from baselineFiles
        // test_import.js loads any new remote system names from files and assigns the “admin” user to the 3-default System Roles [user, admin, evidence provider]
        // test_import.js adds any new Component Type and Component/Product combination from the files


        console.log("Filename: " + fileName);
        console.log("Filepath: " + filePath);
        //console.log("Content: " + fileContent);

        // Now we can run the test_import.js script
        loadTestFile(fileName, filePath, fileContent, req, function (loadResult) {

            console.log('status: ' + loadResult);

            if (loadResult != "Success") {

                console.log("Error loading the baseline tests");

                res.status(500).send(loadResult);

            } else {

                console.log("Successfully loaded the baseline tests...");

                // ***At this point: COSA now has all the tests available to assign to a NEW System created within the Wizard***
                setupAndDeployRemoteSystems(req, function (remoteSystemSetupResult) {

                    if (remoteSystemSetupResult != 'Success') {

                        console.log("Error setting up and deploying remote systems");
                        res.status(500).send(loadResult);

                    } else {

                        console.log("Remote systems successfully set up and deployed...");

                    }
                });
            }
        });
    });

    router.post('/updateInheritedFindings', userRestrict.restrict, function (req, res) {

        /* update all inherited Findings to Pass in the work_item_result table */

        console.log("Updating inherited rules to PASS...");

        var sqlFindings = `SELECT work_item_result.PK_WORK_ITEM_RESULT_ID
                    FROM work_item_result
                    INNER JOIN  system_control_test ON work_item_result.FK_SYSTEM_CONTROL_TEST_ID = system_control_test.PK_SYSTEM_CONTROL_TEST_ID
                    INNER JOIN  system ON system.PK_SYSTEM_ID = system_control_test.FK_SYSTEM_ID
                    WHERE system_control_test.FK_SYSTEM_ID IN (SELECT system_control_test.DEPENDS_ON_SYSTEM_ID FROM system_control_test WHERE system_control_test.DEPENDS_ON_SYSTEM_ID IS NOT NULL)`;

        req.connection.query(sqlFindings, function (err, result) {

            if (err) {

                console.log('SQL ERR: ' + JSON.stringify(err));
                res.send('Error: ' + JSON.stringify(err));

            } else {

                var findingArray = new Array();

                result.forEach(function (finding) {
                    findingArray.push(finding.PK_WORK_ITEM_RESULT_ID);
                });

                console.log(JSON.stringify(findingArray));
                var sql = `UPDATE work_item_result
                        SET FK_WORK_ITEM_STATUS_ID = 1,
                        EXPIRATION_DATE = DATE_ADD(CURRENT_DATE, INTERVAL 1 YEAR)
                        WHERE PK_WORK_ITEM_RESULT_ID = ?`;

                if (findingArray.length > 0) {
                    for (var i = 0; i < findingArray.length; i++) {
                        var findingID = findingArray[i];
                        //console.log("FindingID: "+ findingID);
                        req.connection.query(sql, [findingID], function (err2, result) {
                            if (err2) {
                                console.log('SQL ERR: ' + err2);
                                res.send('err2');
                            }
                        });
                    }

                    console.log(findingArray.length + ' records updated to PASS.');

                    coreFunctions.inheritAllFindings(req.connection, () => {

                        console.log("processed inheritance");
                        res.send(findingArray.length + ' records updated to PASS.');

                    });
                }
            }
        });
    });

    router.post('/loadCatalogs', userRestrict.restrict, function (req, res) {

        var formidable = require('formidable');
        var fs = require('fs');

        var form = new formidable.IncomingForm();

        form.uploadDir = __dirname + '/../attachments/';
        form.keepExtensions = true;
        form.maxFieldsSize = 10 * 1024 * 1024;
        form.maxFields = 1000;
        form.multiples = true;

        form.on('end', function () {
            //res.end('success');
        });

        var dir = form.uploadDir + "temp";

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }

        console.log("Reading in controls...");

        form.parse(req, function (err, fields, files) {

            //console.log('Files: ' + JSON.stringify(files));

            if (err) {

                console.log("Error parsing control file form");

                res.status(500).send('An error occurred');

            } else {

                if (files['files[]']) {

                    var controlFiles = [];

                    if (files['files[]'].length) {

                        console.log("Reading in controls...");

                        for (var i = 0, f; f = files['files[]'][i]; i++) {

                            fs.rename(f.path, dir + "\\" + f.name, function (err) {
                                if (err) { console.log('Error :' + err); }
                            });

                            controlFiles.push(dir + "//" + f.name);

                            //console.log("Reading in: " + f.path + "//" + f.name);
                        }

                    } else {

                        fs.rename(files['files[]'].path, dir + "\\" + files['files[]'].name, function (err) {
                            if (err) { console.log('Error :' + err); }
                        });

                        controlFiles.push(dir + "//" + files['files[]'].name);

                    }

                    loadControlFiles(controlFiles, 0, req, function (loadResult) {

                        console.log('status: ' + loadResult);

                        if (loadResult != "Success") {

                            console.log("Error loading the controls");

                            res.status(500).send(loadResult);

                        } else {

                            console.log("Successfully loaded the controls...");

                            res.status(200).send(loadResult);

                        }
                    });

                } else {

                    console.log("Error loading the controls");

                }
            }
        });
    });

    return router;

};

module.exports = appRouter;
