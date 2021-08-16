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

    router.get('/home', userRestrict.restrict, function (req, res) {
        // show the user a list of valid reporting options
        coreFunctions.getSystems(req.connection, function (results) {
            res.render('pages/reportsHome', {
                systems: results
            });
        });
    });
    
    router.get('/systemsAndTests', userRestrict.restrict, function (req, res) {
        // show the user a list of valid reporting options
        coreFunctions.getSystems(req.connection, function (results) {
            res.render('pages/systemTestsRpt', {
                systems: results
            });
        });
    });

    router.get('/getSystemAndTestInfo', userRestrict.restrict, function (req, res) {
        let systemId = req.query.systemID;
        coreFunctions.getSystemConfigurationWithNames(req.connection, systemId, encoder, function (results) {
            coreFunctions.getTestsBySystem(req.connection, systemId, function (results2) {
                res.status(200).send({
                    'message': 'Success',
                    'info': results,
                    'tests': results2
                });
            });
        });
    });
    
    router.get('/cosaResults', userRestrict.restrict, function (req, res) {
        // show the user a list of valid reporting options
        coreFunctions.getLocalSystems(req.connection, function (results) {
            res.render('pages/cosaResultsRpt', {
                systems: results
            });
        });
    });

    router.get('/getCOSAResults', userRestrict.restrict, function (req, res) {
        let systemId = req.query.systemID;
        coreFunctions.getSystemConfigurationWithNames(req.connection, systemId, encoder, function (results) {
            coreFunctions.getCOSAResultsBySystem(req.connection, systemId, function (results2) {
                res.status(200).send({
                    'message': 'Success',
                    'info': results,
                    'results': results2
                });
            });
        });
    });

    router.get('/cosaSubCapabilityResults', userRestrict.restrict, function (req, res) {
        // show the user a list of local Systems for the COSA Sub-Capability Results Report
        coreFunctions.getLocalSystems(req.connection, function (results) {
            res.render('pages/cosaSubCapabilityResultsRpt', {
                systems: results
            });
        });
    });

    router.get('/getCOSASubCapabilityResults', userRestrict.restrict, function (req, res) {
        let systemId = req.query.systemID;
        coreFunctions.getSystemConfigurationWithNames(req.connection, systemId, encoder, function (results) {
            coreFunctions.getCOSASubCapabilityResultsBySystem(req.connection, systemId, function (results2) {
                res.status(200).send({
                    'message': 'Success',
                    'info': results,
                    'results': results2
                });
            });
        });
    });

    router.get('/cosaControlResults', userRestrict.restrict, function (req, res) {
        // show the user a list of local Systems for the COSA Control Results Report
        coreFunctions.getLocalSystems(req.connection, function (results) {
            res.render('pages/cosaControlResultsRpt', {
                systems: results
            });
        });
    });

    router.get('/getCOSAControlResults', userRestrict.restrict, function (req, res) {
        let systemId = req.query.systemID;
        coreFunctions.getSystemConfigurationWithNames(req.connection, systemId, encoder, function (results) {
            coreFunctions.getCOSAControlResultsBySystem(req.connection, systemId, function (results2) {
                res.status(200).send({
                    'message': 'Success',
                    'info': results,
                    'results': results2
                });
            });
        });
    });

    router.get('/getEvidenceFiles', userRestrict.restrict, function (req, res) {

        var fs = require('fs');
        var stream = require('stream');
        var mime = require('mime-types');

        var evidenceFile = req.query.evidenceFile;
        //console.log('evidenceFile= '+evidenceFile);
        var workitemId = req.query.workitemId;
        //console.log('workitemId= '+workitemId);

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
    
    /* GET TrendingRpt page.  ONLY displaying the Systems the user has roles within */
    router.get('/trending', userRestrict.restrict, function (req, res) {
        var username = req.session.passport.user.username;
        var sql = `SELECT SYSTEM_NAME AS NAME, system.PK_SYSTEM_ID,
        count(WORK_ITEM_RESULT_ID) as WI_TOTAL
        FROM weekly_status
        INNER JOIN system ON system.NAME = weekly_status.SYSTEM_NAME
        WHERE SYSTEM_NAME in (SELECT DISTINCT system.NAME
        FROM system
            INNER JOIN system_role on system_role.FK_SYSTEM_ID = system.PK_SYSTEM_ID
            INNER JOIN user ON user.PK_USER_ID = system_role.FK_USER_ID
            WHERE user.USER_NAME = ? and system.ACTIVE != 0)
            GROUP BY SYSTEM_NAME,system.PK_SYSTEM_ID`;
        req.connection.query(sql, username, function (err, results) {
            //console.log(JSON.stringify(results));
            if (err) {
                console.log("SQL Error: " + err);
            } else {
                res.render('pages/trendingRpt', {
                    config: config,
                    systems: results,
                    username: username
                });
            }
        });
    });

    /* GET TrendingRpt page. ONLY displaying the Systems the user has roles within */
    router.get('/getTrendChartData', userRestrict.restrictWCode, function (req, res) {
        var username = req.session.passport.user.username;
        // separate query to make it easier on ejs page to filter unique sysNames from large result set
        var uniqueSystemsForUserRole = `SELECT DISTINCT system.NAME
        FROM system
        INNER JOIN system_role on system_role.FK_SYSTEM_ID = system.PK_SYSTEM_ID
        INNER JOIN user ON user.PK_USER_ID = system_role.FK_USER_ID
        WHERE user.USER_NAME = ? and system.ACTIVE != 0`;

        var sql = `SELECT SYSTEM_NAME as SYSTEM, STATUS , WEEK_OF_YEAR AS WEEK, COUNT(WEEK_OF_YEAR) as STATUS_COUNT
        FROM weekly_status
        WHERE SYSTEM_NAME in (SELECT DISTINCT system.NAME
        FROM system
        INNER JOIN system_role on system_role.FK_SYSTEM_ID = system.PK_SYSTEM_ID
        INNER JOIN user ON user.PK_USER_ID = system_role.FK_USER_ID
        WHERE user.USER_NAME = ? and system.ACTIVE != 0)  and  MODIFIED_DATE >= NOW() - INTERVAL 1 YEAR
        GROUP BY weekly_status.WEEK_OF_YEAR, weekly_status.STATUS, weekly_status.SYSTEM_NAME`;

        req.connection.query(uniqueSystemsForUserRole, username, function (err, results) {
            //console.log("length of results :"+results.length);
            if (err) {
                console.log("SQL Error: " + err);
            } else {
                req.connection.query(sql, username, function (err2, results2) {
                    if (err2) {
                        console.log("SQL Error: " + err2);
                    } else {
                        res.status(200).send({
                            'message': 'Success',
                            'mySystems': results,
                            'data': results2
                        });
                    }
                });
            }
        });
    });

    /* Get compliance details to populate the details table */
    router.get('/getComplianceDetails', userRestrict.restrict, function (req, res) {

        let systemID = req.query.systemID;
        let stats = req.query.stats;

        coreFunctions.getFindingsForSystemId(req.connection, systemID, stats, function (results) {

            if (results == null) {

                console.error("SQL Error: " + err);

                res.status(400).send({
                    'message': 'SQL Error' + err
                });

            } else {

                results.forEach(function (result) {
                    if ((result.DEPENDS_ON_SYSTEM_ID != null) && (result.IS_MANUAL == 1)) {
                        result.PROCEDURE_TYPE = 'inherited';
                    }
                });
                //console.log(JSON.stringify(results));
                res.status(200).send({
                    'message': 'Success',
                    'data': results
                });
            }
        });
    });

    router.get('/inheritance_by_system', userRestrict.restrict, function (req, res) {
        var system = req.query.system + '';
        system = system.trim();  // SECURITY: should only be alnum characters and space
        
        //console.log(`inheritance for system ${system}`);
        var sql = `SELECT SYSTEM_NAME,  INHERITED_FROM, count(CONTROL_ITEM) AS CONTROL_COUNT ,
        CONCAT(FORMAT(100*count(CONTROL_ITEM) / (SELECT count(*) FROM all_items WHERE
            SYSTEM_NAME = a.SYSTEM_NAME AND INHERITED_FROM <> '' AND  APPLICABLE = 1),4),' %')  AS PERCENTAGE
    FROM all_items a 
    WHERE SYSTEM_NAME = ? AND INHERITED_FROM <> ''
    AND APPLICABLE = 1
    GROUP BY INHERITED_FROM;`;
        
       // console.log(`sql = ${sql}`);
        req.connection.query(sql, system, function (err, results) {

            var stat = 200;
            if (err) {
                console.log("SQL Error: " + err);
                stat = 404;
                results = [];
            }
            res.status(stat).send({ results });
        });
    });

    router.get('/systems_for_display', userRestrict.restrict, function (req, res) {
        coreFunctions.getSystems(req.connection, function (results) {
            //console.log("length of results :"+results.length);
            var stat = 200;
            if (results === null) {
                stat = 404;
                results = [];
            }
            res.status(stat).send({ results });
        });
    });

    router.get('/inheritance', userRestrict.restrict, function (req, res) {
        coreFunctions.getLocalSystems(req.connection, function (results) {
            //console.log("length of results :"+results.length);
            if (results === null) {
                results = [];
            }
            res.render('pages/inheritance', {config, systems: results});
        });
    });

    return router;

}

module.exports = appRouter;
