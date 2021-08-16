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

    const express = require('express');
    const router = express.Router();

    var userRestrict = require('./userRestrict');

    var coreFunctions = require('./coreFunctions.js'); // call all the functions in coreFunctions.js from this file.

    router.get('/workitems', userRestrict.siteAdminRestrict, function (req, res) {

        var user = req.session.passport.user.username;

        // We are only interested in to outstanding items. No expiration date.
        var sql = `SELECT * FROM all_findings WHERE FK_ROLE_ID = FORWARD_TO_ROLE_ID AND EXPIRATION_DATE IS NULL AND ACTIVE != 0`;

        req.connection.query(sql, function (err, results) {
            if (err) {
                console.log("SQL Error: " + err);
            } else {
                coreFunctions.getWorkItemStatus(req.connection, function (results1) { // Grab all the status choices for the drop down.
                    coreFunctions.getSecurityControls(req.connection, function (results2) { // Grab all the security control names for the drop down.
                        coreFunctions.getSystems(req.connection, function (results3) { // Grab all the systems for the drop down.
                            coreFunctions.getControlWeaknessTypes(req.connection, function (results4) { // Grab all the weakness types for the drop down.
                                coreFunctions.getCategorizations(req.connection, function (results5) { // Grab all the categorizations for the drop down.
                                    res.render('pages/workitems', {
                                        config: config,
                                        workitems: results,
                                        statuses: results1,
                                        allcontrols: results2,
                                        systems: results3,
                                        weaknesses: results4,
                                        categories: results5
                                    });
                                });
                            });
                        });
                    });
                });
            }
        });
    });

    router.get('/myworkitems', userRestrict.restrict, function (req, res) {

        var user = req.session.passport.user.username;

        // We are only interested in outstanding applicable and manual items - no expiration date.
        var where = "WHERE user.USER_NAME = '" + user + "' and system.ACTIVE != 0 and system.IS_REMOTE != 1 AND system_role.FK_ROLE_ID = work_item_result.FORWARD_TO_ROLE_ID " +
            "AND system_control_test.IS_MANUAL = 1 AND system_control_test.FK_PROCEDURE_TYPE_ID = 22 " +
            "AND work_item_result.EXPIRATION_DATE IS NULL AND system_control_test.APPLICABLE = 1;";

        var sql = `SELECT user.USER_NAME,
                    system.PK_SYSTEM_ID,
                    system.NAME as SYSTEM,
                    system.FK_CATEGORIZATION_ID,
                    categorization_default.NAME as CATEGORIZATION,
                    security_control.PK_SECURITY_CONTROL_ID,
                    security_control.NAME as CONTROL,
                    security_control.TITLE,
                    system_control_test.PK_SYSTEM_CONTROL_TEST_ID,
                    system_control_test.CONTROL_ITEM,
                    system_control_test.FK_ROLE_ID,
                    system_roles_default.NAME as ROLE_NAME,
                    work_item_result.PK_WORK_ITEM_RESULT_ID,
                    work_item_status_default.NAME as STATUS
                FROM work_item_result
                INNER JOIN system_control_test ON system_control_test.PK_SYSTEM_CONTROL_TEST_ID = work_item_result.FK_SYSTEM_CONTROL_TEST_ID 
                INNER JOIN work_item_status_default ON work_item_status_default.PK_WORK_ITEM_STATUS_ID = work_item_result.FK_WORK_ITEM_STATUS_ID 
                INNER JOIN security_control ON security_control.PK_SECURITY_CONTROL_ID = system_control_test.FK_SECURITY_CONTROL_ID
                INNER JOIN system ON system.PK_SYSTEM_ID = system_control_test.FK_SYSTEM_ID
                INNER JOIN categorization_default ON categorization_default.PK_CATEGORIZATION_ID = system.FK_CATEGORIZATION_ID
                INNER JOIN system_roles_default ON system_roles_default.PK_ROLE_ID = work_item_result.FORWARD_TO_ROLE_ID
                INNER JOIN system_role on system_role.FK_SYSTEM_ID = system.PK_SYSTEM_ID
                INNER JOIN user ON user.PK_USER_ID = system_role.FK_USER_ID ` + where;

        req.connection.query(sql, function (err, results) {

            if (err) {

                console.log("SQL Error: " + err);

            } else {

                coreFunctions.getWorkItemStatus(req.connection, function (results1) { // Grab all the status choices for the drop down.
                    coreFunctions.getControlWeaknessTypes(req.connection, function (results2) { // Grab all the weakness types for the drop down.
                        coreFunctions.getCategorizations(req.connection, function (results3) { // Grab all the categorizations for the drop down.
                            res.render('pages/myworkitems', {
                                config: config,
                                workitems: results,
                                statuses: results1,
                                weaknesses: results2,
                                categories: results3

                            });
                        });
                    });
                });
            }
        });
    });

    router.get('/getWorkItemResult', userRestrict.restrictWCode, function (req, res) {

        var workitemId = req.query.workitemId;

        var sql = `SELECT * FROM all_findings WHERE PK_WORK_ITEM_RESULT_ID = ?`;

        req.connection.query(sql, [workitemId], function (err, results) {

            if (err) {
                console.log("SQL Error: " + err);
                res.send({
                    'message': 'Failed: ' + err,
                });

            } else {

                res.send({
                    'message': 'Success',
                    'workitems': results
                });
            }
        });
    });

    router.post('/forwardWorkItemResult', userRestrict.restrictWCode, function (req, res) {

        var workitemId = req.body.workitemId;
        var resultDescription = req.body.resultDescription;
        var forwardTo = req.body.forwardTo;
        var repeatFinding = req.body.repeatFinding;
        var repeatFindingCOSA = req.body.repeatFindingCOSA;
        var findingTitle = req.body.findingTitle;
        var findingDescription = req.body.findingDescription;
        var weaknessDescription = req.body.weaknessDescription;
        var weaknessType = req.body.weaknessType;
        var actionsDescription = req.body.actionsDescription;
        var businessEffect = req.body.businessEffect;
        var likelihood = req.body.likelihood;
        var impact = req.body.impact;
        var newStatus = req.body.newStatus;
        var updatedBy = req.session.passport.user.username;

        let sql = "SELECT * from work_item_result WHERE PK_WORK_ITEM_RESULT_ID = ?;";

        req.connection.query(sql, [workitemId], function (err, result) {

            if (err) {

                console.log('SQL ERR: ' + err);
                res.send('err');

            } else {

                let sql2 = `UPDATE work_item_result 
                            SET FK_SYSTEM_CONTROL_TEST_ID = ?, FK_WORK_ITEM_STATUS_ID = ?, 
                                RESULT_DESC = ?, MODIFIED_DATE = ?, EXPIRATION_DATE = ?, FORWARD_TO_ROLE_ID = ?, 
                                UPDATED_BY = ?, REPEAT_FINDING = ?, REPEAT_FINDING_COSA_WEAKNESS_ID = ?, 
                                FINDING_TITLE = ?, FINDING_DESCRIPTION = ?, WEAKNESS_DESCRIPTION = ?, FK_CONTROL_WEAKNESS_TYPE_ID = ?, 
                                RECOMMENDED_CORRECTIVE_ACTIONS = ?, EFFECT_ON_BUSINESS = ?, FK_LIKELIHOOD_ID = ?, 
                                FK_IMPACT_ID = ?, REMEDIATION_DATE = ? 
                            WHERE work_item_result.PK_WORK_ITEM_RESULT_ID = ? `;

                req.connection.query(sql2,
                    [result[0].FK_SYSTEM_CONTROL_TEST_ID, newStatus, resultDescription, result[0].MODIFIED_DATE,
                    result[0].EXPIRATION_DATE, forwardTo, updatedBy, repeatFinding, repeatFindingCOSA,
                    findingTitle, findingDescription, weaknessDescription, weaknessType, actionsDescription, businessEffect,
                        likelihood, impact, result[0].REMEDIATION_DATE, workitemId], function (err2, result2) {
                            if (err2) {
                                console.log('SQL ERR: ' + err2);
                                res.send('err');
                            } else {
                                res.send(result2.affectedRows + ' record updated.');
                            }
                        });
            }
        });
    });

    const date_parse = /(\d\d)y(\d\d)m(\d\d)d(\d\d)h(\d\d)m/i;

    function relative_add(str) {

        var now = new Date();

        now.setTime(Date.now());

        var parts = date_parse.exec(str);

        var n = 1;
        var yy = parseInt(parts[n++], 10);
        var mm = parseInt(parts[n++], 10);
        var dd = parseInt(parts[n++], 10);
        var hh = parseInt(parts[n++], 10);
        var min = parseInt(parts[n++], 10);

        // order matters below 
        now.setMinutes(now.getMinutes() + min);
        now.setHours(now.getHours() + hh);
        now.setDate(now.getDate() + dd); // day of month
        now.setMonth(now.getMonth() + mm);
        now.setFullYear(now.getFullYear() + yy);

        return now;

    }

    router.post('/updateWorkItemResult', userRestrict.restrictWCode, function (req, res) {

        var workitemId = req.body.workitemId;
        var resultDescription = req.body.resultDescription;
        var repeatFinding = req.body.repeatFinding;
        var repeatFindingCOSA = req.body.repeatFindingCOSA;
        var findingTitle = req.body.findingTitle;
        var findingDescription = req.body.findingDescription;
        var weaknessDescription = req.body.weaknessDescription;
        var weaknessType = req.body.weaknessType;
        var actionsDescription = req.body.actionsDescription;
        var businessEffect = req.body.businessEffect;
        var likelihood = req.body.likelihood;
        var impact = req.body.impact;
        var newStatus = req.body.newStatus;
        var updatedBy = req.session.passport.user.username;

        let sql = "SELECT * from work_item_result WHERE PK_WORK_ITEM_RESULT_ID = ?;";

        req.connection.query(sql, [workitemId], function (err, result) {

            if (err) {
                console.log('SQL ERR: ' + err);
                res.send('err');
            } else {

                // If the status is PASS, FAIL, or RISK ACCEPTED, then query test for expiration and calculate new expiration date.
                if (newStatus != 3) { // WORK__ITEM_STATUS_ID: 1 = Pass, 2 = Fail, 3 = Incomplete, 4 = Risk Accepted.

                    let sql1 = "SELECT FREQUENCY from system_control_test where PK_SYSTEM_CONTROL_TEST_ID = ? ;";

                    req.connection.query(sql1, [result[0].FK_SYSTEM_CONTROL_TEST_ID], function (err1, result1) {

                        if (err1) {
                            console.log('SQL ERR: ' + err1);
                            res.send('err');
                        } else {

                            // Calculate the expiration date.
                            var expires = result[0].EXPIRATION_DATE;

                            console.log('Expires: ' + result1[0].FREQUENCY);
                            expires = relative_add(result1[0].FREQUENCY);

                            console.log('Expiration date: ' + expires);

                            let sql2 = `UPDATE work_item_result 
                                        SET FK_SYSTEM_CONTROL_TEST_ID = ?, FK_WORK_ITEM_STATUS_ID = ?, 
                                            RESULT_DESC = ?, MODIFIED_DATE = ?, EXPIRATION_DATE = ?, FORWARD_TO_ROLE_ID = ?, 
                                            UPDATED_BY = ?, REPEAT_FINDING = ?, REPEAT_FINDING_COSA_WEAKNESS_ID = ?, 
                                            FINDING_TITLE = ?, FINDING_DESCRIPTION = ?, WEAKNESS_DESCRIPTION = ?, FK_CONTROL_WEAKNESS_TYPE_ID = ?, 
                                            RECOMMENDED_CORRECTIVE_ACTIONS = ?, EFFECT_ON_BUSINESS = ?, FK_LIKELIHOOD_ID = ?, 
                                            FK_IMPACT_ID = ?, REMEDIATION_DATE = ? 
                                        WHERE work_item_result.PK_WORK_ITEM_RESULT_ID = ? `;

                            req.connection.query(sql2,
                                [result[0].FK_SYSTEM_CONTROL_TEST_ID, newStatus, resultDescription, result[0].MODIFIED_DATE,
                                    expires, result[0].FORWARD_TO_ROLE_ID, updatedBy, repeatFinding, repeatFindingCOSA,
                                    findingTitle, findingDescription, weaknessDescription, weaknessType, actionsDescription, businessEffect,
                                    likelihood, impact, result[0].REMEDIATION_DATE, workitemId], function (err2, result2) {
                                        if (err2) {
                                            console.log('SQL ERR: ' + err2);
                                            res.send('err');
                                        } else {
                                            coreFunctions.inheritAllFindings(req.connection, (err) => {
                                                res.send('Success');
                                            });
                                        }
                                    });
                        }
                    });
                } else {

                    let sql2 = `UPDATE work_item_result 
                                SET FK_SYSTEM_CONTROL_TEST_ID = ?, FK_WORK_ITEM_STATUS_ID = ?, 
                                    RESULT_DESC = ?, MODIFIED_DATE = ?, EXPIRATION_DATE = ?, FORWARD_TO_ROLE_ID = ?, 
                                    UPDATED_BY = ?, REPEAT_FINDING = ?, REPEAT_FINDING_COSA_WEAKNESS_ID = ?, 
                                    FINDING_TITLE = ?, FINDING_DESCRIPTION = ?, WEAKNESS_DESCRIPTION = ?, FK_CONTROL_WEAKNESS_TYPE_ID = ?, 
                                    RECOMMENDED_CORRECTIVE_ACTIONS = ?, EFFECT_ON_BUSINESS = ?, FK_LIKELIHOOD_ID = ?, 
                                    FK_IMPACT_ID = ?, REMEDIATION_DATE = ? 
                                WHERE work_item_result.PK_WORK_ITEM_RESULT_ID = ? `;

                    req.connection.query(sql2,
                        [result[0].FK_SYSTEM_CONTROL_TEST_ID, newStatus, resultDescription, result[0].MODIFIED_DATE,
                        result[0].EXPIRATION_DATE, result[0].FORWARD_TO_ROLE_ID, updatedBy, repeatFinding, repeatFindingCOSA,
                          findingTitle, findingDescription, weaknessDescription, weaknessType, actionsDescription, businessEffect,
                            likelihood, impact, result[0].REMEDIATION_DATE, workitemId], function (err2, result2) {
                                if (err2) {
                                    console.log('SQL ERR: ' + err2);
                                    res.send('err');
                                } else {
                                    coreFunctions.inheritAllFindings(req.connection, () => {
                                        res.send('Success');
                                    });
                                }
                            });
                }
            }
        });
    });

    /* populate testing results upload modal */
    router.get('/getEvidenceUploadFilenames', userRestrict.restrictWCode, function (req, res) {

        var fs = require('fs');

        var systemName = req.query.systemName;
        var workitemId = req.query.workitemId;
        var results = Array();

        let sql = 'SELECT NAME FROM evidence_file WHERE FK_WORKITEM_RESULT_ID = ?;';

        req.connection.query(sql, [workitemId], function (err, result) {

            if (err) {

                console.log('Error getting file names from DB: ' + err);

                res.status(200).send({
                    'message': err,
                    'filenames': results
                });

            } else {

                console.log('Successfully retrieved file names.' + JSON.stringify(result));

                result.forEach(function (file) {

                    var filename = { "FILE": file.NAME };

                    results.push(filename);

                });

                res.status(200).send({
                    'message': 'Success',
                    'filenames': results
                });
            }
        });
    });

    router.get('/getEvidenceFiles', userRestrict.restrict, function (req, res) {

        var fs = require('fs');
        var stream = require('stream');
        var mime = require('mime-types');

        var evidenceFile = req.query.evidenceFile;
        //var systemName = req.query.systemName;
        var workitemId = req.query.workitemId;

        let sql = 'SELECT DATA FROM evidence_file WHERE FK_WORKITEM_RESULT_ID = ? AND NAME = ?;';

        req.connection.query(sql, [workitemId, evidenceFile], function (err, result) {
            
            if (err) {

                console.log('Error getting file from DB (' + evidenceFile + "): " + err);

            } else {

                console.log('Successfully retrieved file: ' + evidenceFile + " type:" + mime.lookup(evidenceFile));
                
                fileData = Buffer.from(result[0].DATA);

                var readStream = new stream.PassThrough();
                readStream.end(fileData);

                res.set('Content-disposition', 'attachment; filename=' + evidenceFile);
                res.set('Content-Type', mime.lookup(evidenceFile));

                readStream.pipe(res);

            }
        });
    });

    function scanAndStoreFile(req, workitemId, f) {

        var fs = require('fs');
        const clamd = require('clamdjs')

        fs.readFile(f.path, function (err, data) {

            if (config.clamAV.active == true) {
            console.log("ClamAV: " + config.clamAV.host);
            console.log("ClamAV Port: " + config.clamAV.port);

            // Scan the file.
            const scanner = clamd.createScanner(config.clamAV.host, config.clamAV.port)

            scanner.scanBuffer(data, 3000, 1024 * 1024)
                .then(function (reply) {

                    console.log("Scan result: " + reply)

                    // 'stream: OK', if not infected    
                    // Store the file in the DB.
                    if (reply.includes("stream: OK")) {

                        console.log("Storing file: " + f.name);

                        return storeFile(req, workitemId, f.name, data);

                    } else {

                        console.log("File fails virus scan: " + f.name);
                        // `stream: ${virus} FOUND`, if infected
                        return "ERROR";

                    }
                })
                .catch(function (error) {

                    console.error(error);

                });
            } else {

                console.log("Storing file: " + f.name);

                return storeFile(req, workitemId, f.name, data);

            }
        });
    }



    function storeFile(req, workitemId, fileName, fileData) {

        let sql = 'INSERT INTO evidence_file (FK_WORKITEM_RESULT_ID, NAME, DATA) VALUES (?,?,?);';

        req.connection.query(sql, [workitemId, fileName, fileData], function (err, result) {

            if (err) {

                console.log('Error storing file (' + fileName + "): " + err);

                return err;

            } else {

                console.log('Successfully stored file: ' + fileName);

                return "success";

            }
        });
    }

    router.post('/uploadEvidenceFiles', userRestrict.restrictWCode, function (req, res) {

        var formidable = require('formidable');

        var form = new formidable.IncomingForm();

        form.keepExtensions = true;
        form.maxFieldsSize = 10 * 1024 * 1024;
        form.maxFields = 1000;
        form.multiples = true;

        form.on('end', function () {
            res.end('success');
        });

        form.parse(req, function (err, fields, files) {

            if (err) {

                res.writeHead(200, {
                    'content-type': 'text/plain'
                });

                res.write('An error occurred trying to store the evidence files.');

            } else {

                var systemName = fields.systemName;
                var workitemId = fields.workitemId;

                if (files['files[]']) {
                    if (files['files[]'].length) {

                        for (var i = 0, f; f = files['files[]'][i]; i++) {

                            scanAndStoreFile(req, workitemId, f);

                        }

                    } else {

                        // Scan the file data.
                        scanAndStoreFile(req, workitemId, files['files[]']);

                    }
                }
            }
        });
    });

    router.post('/deleteEvidenceFile', userRestrict.restrict, function (req, res) {

        var fs = require('fs');

        var workitemId = req.body.workitemId;
        var systemName = req.body.systemName;
        var evidenceFile = req.body.evidenceFile;

        let sql = 'DELETE FROM evidence_file WHERE FK_WORKITEM_RESULT_ID = ? AND NAME = ?;';

        req.connection.query(sql, [workitemId, evidenceFile], function (err, result) {

            if (err) {

                console.log('Error deleting file (' + evidenceFile + "): " + err);

                res.send('Error deleting: ' + evidenceFile);

            } else {

                console.log('Successfully deleted file: ' + evidenceFile);

                res.send('Success');

            }
        });
    });

    return router;

}
module.exports = appRouter;
