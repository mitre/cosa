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

    /* GET home page. */
    router.get('/', function (req, res, next) {
        res.redirect('/home')
    });

    router.get('/home', function (req, res) {

        // reset add system wizard progression
        req.session.wizard_completed = [];
        req.session.wizard_systemId = null;
        req.session.wizard_templateId = null;

        coreFunctions.getSystems(req.connection, function (results) {

            res.render('pages/home', {
                config: config,
                is_initialized: results.length > 0
            });
        });
    });

    var coreFunctions = require('./coreFunctions.js');

    /* Initialize COSA */
    router.get('/initCOSA', userRestrict.siteAdminRestrict, function (req, res) {

        res.render('pages/initCOSA');

    });

    /* Load tests */
    router.get('/loadTests', userRestrict.siteAdminRestrict, function (req, res) {

        res.render('pages/loadTests');

    });

    /* Load catalogs */
    router.get('/loadCatalogs', userRestrict.siteAdminRestrict, function (req, res) {

        res.render('pages/loadCatalogs');

    });

    // starting page (before a system has been selected.)
    router.get('/dashboard', function (req, res) {

        var results = null;
        var passedTests = '0';
        var incompleteTests = '0';
        var failedTests = '0';
        var riskAcceptedTests = '0';
        var automatedTests = '0';
        var manualTests = '0';
        var inheritedTests = '0';
        var totalTests = '0';
        var passPercent = '0';
        var incompletePercent = '0';
        var acceptedPercent = '0';
        var failPercent = '0';
        var passedControls = '0';
        var failedControls = '0';
        var incompleteControls = '0';
        var totalControls = '0';

        coreFunctions.getSystems(req.connection, function (results) {

            res.render('pages/dashboard', {
                systems: results,
                passedTests: passedTests,
                incompleteTests: incompleteTests,
                failedTests: failedTests,
                riskAcceptedTests: riskAcceptedTests,
                inheritedTests: inheritedTests,
                automatedTests: automatedTests,
                manualTests: manualTests,
                totalTests: totalTests,
                passPercent: passPercent,
                incompletePercent: incompletePercent,
                failPercent: failPercent,
                passedControls: passedControls,
                incompleteControls: incompleteControls,
                failedControls: failedControls,
                totalControls: totalControls,
                config: config

            });
        });
    });

    //get Counts for a specific system from MySystems dashboard
    router.get('/getCountsForSystem', userRestrict.restrictWCode, function (req, res) {

        let systemID = req.query.systemID;

        console.log(`INFO: getCountsForSystem where systemID = ${systemID}`);

        var passedTests = '0';
        var incompleteTests = '0';
        var failedTests = '0';
        var riskAcceptedTests = '0';
        var automatedTests = '0';
        var manualTests = '0';
        var inheritedTests = '0';
        var totalTests = '0';
        var passPercent = '0';
        var incompletePercent = '0';
        var acceptedPercent = '0';
        var failPercent = '0';
        var passedControls = '0';
        var failedControls = '0';
        var incompleteControls = '0';
        var totalControls = '0';

        coreFunctions.getComplianceCounts(req.connection, systemID, function (results) {
            console.log(JSON.stringify(results));
            if (results == null) {
                console.error("SQL Error in getCountsForSystem: " + err);
                res.status(401).send({
                    'message': 'SQL Error' + err
                });
            } else {
                if (results[0].passedTests != null) { passedTests = results[0].passedTests };
                if (results[0].incompleteTests != null) { incompleteTests = results[0].incompleteTests };
                if (results[0].failedTests != null) { failedTests = results[0].failedTests };
                if (results[0].riskAcceptedTests != null) { riskAcceptedTests = results[0].riskAcceptedTests };
                if (results[0].inheritedTests != null) { inheritedTests = results[0].inheritedTests };
                if (results[0].automatedTests != null) { automatedTests = results[0].automatedTests };
                if (results[0].manualTests != null) { manualTests = results[0].manualTests };
                if (results[0].totalTests != null) { totalTests = results[0].totalTests };
                if (results[0].passedControls != null) { passedControls = results[0].passedControls };
                if (results[0].failedControls != null) { failedControls = results[0].failedControls };
                if (results[0].incompleteControls != null) { incompleteControls = results[0].incompleteControls };
                if (results[0].totalControls != null) { totalControls = results[0].totalControls };

                if (results[0].totalTests != null) { 
                    total = results[0].totalTests 
                    passPercent = passedTests / total * 100;
                    incompletePercent = incompleteTests / total * 100;
                    acceptedPercent = riskAcceptedTests / total * 100;
                    failPercent = failedTests / total * 100;
                }
                res.status(200).send({
                    'message': 'Success',
                    'passedTests': passedTests,
                    'incompleteTests': incompleteTests,
                    'failedTests': failedTests,
                    'riskAcceptedTests': riskAcceptedTests,
                    'inheritedTests': inheritedTests,
                    'automatedTests': automatedTests,
                    'manualTests': manualTests,
                    'totalTests': totalTests,
                    'passPercent': passPercent,
                    'incompletePercent': incompletePercent,
                    'failPercent': failPercent,
                    'passedControls': passedControls,
                    'incompleteControls': incompleteControls,
                    'failedControls': failedControls,
                    'totalControls': totalControls
                });
            }
        });
    });


    /* Get Compliance counts for a selected System Name */
    router.get('/getComplianceCounts', userRestrict.restrictWCode, function (req, res) {

        let systemID = parseInt(req.query.systemID.trim(), 10); // allow only integers

        var sql_treemap = `(select sc.FAMILY AS NAME, "Control Families" AS PARENT, COUNT(scr.PK_SYSTEM_CONTROL_TEST_ID) AS TEST_COUNT, 1 AS Color From security_control sc
        JOIN system_control_test scr ON sc.PK_SECURITY_CONTROL_ID=scr.FK_SECURITY_CONTROL_ID
        WHERE scr.FK_SYSTEM_ID = ? AND scr.APPLICABLE = 1
        group by sc.FAMILY)
        UNION
        (select sc.NAME AS NAME, sc.FAMILY AS PARENT, COUNT(scr.PK_SYSTEM_CONTROL_TEST_ID) AS TEST_COUNT, 4 AS Color From security_control sc
        JOIN system_control_test scr ON sc.PK_SECURITY_CONTROL_ID=scr.FK_SECURITY_CONTROL_ID
        WHERE scr.FK_SYSTEM_ID = ? AND scr.APPLICABLE = 1
        group by sc.NAME, sc.FAMILY)
        UNION
        (select CONCAT(scr.PK_SYSTEM_CONTROL_TEST_ID,"_", scr.CONTROL_ITEM,"_",sc.TITLE, "(",scrpt.NAME,")") AS NAME, sc.NAME AS PARENT, COUNT(scr.PK_SYSTEM_CONTROL_TEST_ID) AS TEST_COUNT, wir.FK_WORK_ITEM_STATUS_ID AS COLOR From security_control sc
        JOIN system_control_test scr ON sc.PK_SECURITY_CONTROL_ID=scr.FK_SECURITY_CONTROL_ID
        JOIN work_item_result wir ON wir.FK_SYSTEM_CONTROL_TEST_ID = scr.PK_SYSTEM_CONTROL_TEST_ID
        JOIN system_control_test_procedure_types_default scrpt ON scr.FK_PROCEDURE_TYPE_ID = scrpt.PK_SYSTEM_CONTROL_TEST_PROCEDURE_TYPE_ID
        WHERE scr.FK_SYSTEM_ID = ? AND scr.APPLICABLE = 1
        group by scr.PK_SYSTEM_CONTROL_TEST_ID)`;

        console.log(`INFO: getCountsForSystem where systemID = ${systemID}`);

        var passedTests = '0';
        var incompleteTests = '0';
        var failedTests = '0';
        var inheritedTests = '0';
        var riskAcceptedTests = '0';
        var automatedTests = '0';
        var manualTests = '0';
        var totalTests = '0';
        var passPercent = '0';
        var incompletePercent = '0';
        var acceptedPercent = '0';
        var failPercent = '0';
        var passedControls = '0';
        var failedControls = '0';
        var incompleteControls = '0';
        var totalControls = '0';

        coreFunctions.getComplianceCounts(req.connection, systemID, function (results) {
            console.log(JSON.stringify(results));
            if (results == null) {
                console.error("SQL Error in getCountsForSystem: " + err);
                res.status(401).send({
                    'message': 'SQL Error' + err
                });
            } else {
                if (results[0].passedTests != null) { passedTests = results[0].passedTests };
                if (results[0].incompleteTests != null) { incompleteTests = results[0].incompleteTests };
                if (results[0].failedTests != null) { failedTests = results[0].failedTests };
                if (results[0].riskAcceptedTests != null) { riskAcceptedTests = results[0].riskAcceptedTests };
                if (results[0].inheritedTests != null) { inheritedTests = results[0].inheritedTests };
                if (results[0].automatedTests != null) { automatedTests = results[0].automatedTests };
                if (results[0].manualTests != null) { manualTests = results[0].manualTests };
                if (results[0].totalTests != null) { totalTests = results[0].totalTests };
                if (results[0].passedControls != null) { passedControls = results[0].passedControls };
                if (results[0].failedControls != null) { failedControls = results[0].failedControls };
                if (results[0].incompleteControls != null) { incompleteControls = results[0].incompleteControls };
                if (results[0].totalControls != null) { totalControls = results[0].totalControls };
                if (results[0].totalTests != null) { total = results[0].totalTests }


                req.connection.query(sql_treemap, [systemID, systemID, systemID], function (err_2, results_3) {
                    coreFunctions.getCOSACapabilityTreeMapBySystem(req.connection, systemID, function (results_4) {
                        if (err_2) {
                            console.log("SQL Error: " + err_2);
                            res.status(200).send({
                                'message': 'SQL Error' + err_2
                            });
                        } else {
                            res.status(200).send({
                                'message': 'Success',
                                'passedTests': passedTests,
                                'incompleteTests': incompleteTests,
                                'failedTests': failedTests,
                                'riskAcceptedTests': riskAcceptedTests,
                                'inheritedTests': inheritedTests,
                                'automatedTests': automatedTests,
                                'manualTests': manualTests,
                                'totalTests': totalTests,
                                'passPercent': passPercent,
                                'incompletePercent': incompletePercent,
                                'failPercent': failPercent,
                                'passedControls': passedControls,
                                'incompleteControls': incompleteControls,
                                'failedControls': failedControls,
                                'totalControls': totalControls,
                                'treemap': results_3,
                                'treemapCap': results_4
                            });
                        }
                    });
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

                console.log("SQL Error: " + err);

                res.status(400).send({
                    'message': 'SQL Error' + err
                });

            } else {

                res.status(200).send({
                    'message': 'Success',
                    'data': results
                });
            }
        });
    });

    /* Get All Compliance details to populate the details table on My Systems dashboard -- will merge later -jc*/
    router.get('/getStatusDetForSysName', userRestrict.restrict, function (req, res) {

        let systemName = req.query.systemName.trim(); // trim necessary for this one
        let status = req.query.status;
        var params = new Array();

        var sql = `SELECT * FROM all_findings WHERE SYSTEM = ?`;
        if (status != "all") {
            sql = sql + "AND STATUS = ?";
            params = [systemName, status];
        } else {
            params = [systemName];
        }

        req.connection.query(sql, params, function (err, results) {

            if (err) {
                console.log("SQL Error: " + err);
                res.status(200).send({
                    'message': 'SQL Error' + err
                });
            } else {

                res.status(200).send({
                    'message': 'Success',
                    'data': results
                });
            }
        });
    });

    /* Create a new user account. Admins only capability */
    /* mwoodman temp removed. I don't believe this is being used. passport does log in.
    router.post('/addUser', userRestrict.siteAdminRestrict, function (req, res) {

        console.log('hit');
        var username = req.body.username;
        var password = req.body.password;
        var role = req.body.role;
        var firstName = req.body.firstName;
        var MI = req.body.MI;
        var lastName = req.body.lastName;
        var email = req.body.email;
        var phone = req.body.phone;
        var active = "1"; //default to an active acount (1)
        var sql = "INSERT INTO user (FIRST_NAME, MI, LAST_NAME, EMAIL, PHONE, USER_NAME, PASSWORD, ACTIVE) VALUES (?,?,?,?,?,?,?,?);";
        var sql_exists = "SELECT COUNT(*) AS userCount FROM user WHERE USER_NAME = ?";
        var params = [firstName, MI, lastName, email, phone, username, password, active];
        var newUserID;

        console.log(params);
        // 1st Check if user exists
        req.connection.query(sql_exists, [username], function (err_exists, result_exists) {
            //console.log(result_exists[0].userCount);
            //console.log(JSON.stringify(result_exists));
            if (err_exists) {
                res.send('err_exists');
            } else if (result_exists[0].userCount == 0) {
                req.connection.query(sql, params, function (err, result) {
                    if (err) {
                        console.log('SQL ERR: ' + err);
                        res.send('err');
                    } else {
                        // ADD THE ROLE to cosa_Role table
                        newUserID = result.insertId; // returned from Database INSERT result;
                        if (role != null) {
                            var sql3 = "INSERT INTO cosa_role (FK_USER_ID, ROLE_NAME) VALUES (?,?);";
                            req.connection.query(sql3, [newUserID, role], function (err_3, result_3) {
                                if (err_3) {
                                    console.log('SQL ERR: ' + err_3);
                                    res.send('err_3');
                                }
                            });
                        }
                        console.log("User Created: " + username);
                        res.status(200).send(result.affectedRows + "user record created");
                    }
                });
            } else {
                console.log("Account already exists for user: " + username);
                res.status(400).send("Account already exists for user :" + username);
            }
        });
    });
*/
    // Update an existing User Account
    /* mwoodman temp removed. I don't believe this is being used. passport does log in.
    router.post('/updateUser', userRestrict.siteAdminRestrict, function (req, res) {

        var userID = req.body.userID;
        var username = req.body.username;
        var password = req.body.password;
        var role = req.body.role;
        var firstName = req.body.firstName;
        var MI = req.body.MI;
        var lastName = req.body.lastName;
        var email = req.body.email;
        var phone = req.body.phone;
        //var active = "1"; //default to an active acount (1)
        var sql = "UPDATE user SET FIRST_NAME = ?, MI = ?, LAST_NAME = ?, USER_NAME = ?, EMAIL = ?, PHONE = ?, PASSWORD = ? WHERE PK_USER_ID = ?;";
        req.connection.query(sql, [firstName, MI, lastName, username, email, phone, password, userID], function (err, result) {
            if (err) {
                console.log('SQL ERR: ' + err);
                res.send('err');
            } else {
                // UPDATE the ROLE to cosa_Role table
                if (role != null) {
                    var sql2 = "UPDATE cosa_role SET ROLE_NAME = ? WHERE FK_USER_ID = ?";
                    req.connection.query(sql2, [role, userID], function (err_2, result_2) {
                        if (err_2) {
                            console.log('SQL ERR: ' + err_2);
                            res.send('err_2');
                        }
                    });
                }
                res.send(result.affectedRows + " record updated");
            }
        });
    });
*/
    /* Delete a user account. Admins only capability */
    /* mwoodman temp removed. I don't believe this is being used. passport does log in.
    router.post('/deleteUser', userRestrict.siteAdminRestrict, function (req, res) {
        var userID = req.body.userID;
        //console.log(userID);
        var sql = "DELETE FROM user WHERE PK_USER_ID = ?";
        req.connection.query(sql, [userID], function (err, result) {
            if (err) {
                console.log("SQL Error: " + err);
            } else {
                console.log("User deleated");
                res.send(result.affectedRows + " record deleted");
            }
        });
    });
*/
    /* Login to cosa app. */
/* mwoodman temp removed. I don't believe this is being used. passport does log in.
    router.post('/login', function (req, res) {
        var username = req.body.username;
        var password = req.body.password;
        var timestamp = new Date()
        var sql = "SELECT PK_USER_ID, USER_NAME, FIRST_NAME, MI, LAST_NAME, cosa_role.ROLE_NAME, LAST_LOGIN_DATE FROM user INNER JOIN cosa_role ON user.PK_USER_ID = cosa_role.FK_USER_ID WHERE USER_NAME = ? and PASSWORD = ? limit 0,1;";
        var params = [username, password]
        req.connection.query(sql, params, function (err, user) {
            if (err) {
                console.log("SQL Login Error: " + err);
                console.log("LOGIN FAILURE (" + timestamp + ") - Username: " + username)
                res.status(200).send('failure');
            } else {
                if (user.length == 1) {
                    //console.log(user[0])
                    console.log("LOGIN SUCCESS (" + timestamp + ") - Username: " + username)
                    req.session.user_id = user[0].PK_USER_ID;
                    req.session.user = user[0].USER_NAME;
                    req.session.firstname = user[0].FIRST_NAME;
                    req.session.MI = user[0].MI;
                    req.session.lastname = user[0].LAST_NAME;
                    req.session.role = user[0].ROLE_NAME;
                    req.session.error = '';
                    req.connection.query("UPDATE `user` SET `LAST_LOGIN_DATE` = now() WHERE `PK_USER_ID` = ?", user[0].PK_USER_ID, function (err, result) { });
                    res.status(200).send('success');
                } else {
                    console.log("LOGIN FAILURE (" + timestamp + ") - Username: " + username)
                    res.status(200).send('failure');
                }
            }
        });
    });
*/
    /* Logout from cosa app. */
    router.get('/logout', function (req, res) {
        var timestamp = new Date()
        console.log("LOGOUT SUCCESS (" + timestamp + ") - Username: " + res.locals.username)
        req.session.destroy(function (err) {
            if (err) {
                console.log(err);
            } else {
                res.redirect('./');
            }
        });
    });

    // show the user the systems they have a system role in, and the overall status
    router.get('/mySystems', userRestrict.restrict, function (req, res) {
        var username = req.session.passport.user.username;
        var sql = `SELECT * FROM all_compliance_counts
        WHERE SYSTEM in (SELECT DISTINCT system.NAME
        FROM system
        INNER JOIN system_role on system_role.FK_SYSTEM_ID = system.PK_SYSTEM_ID
        INNER JOIN user ON user.PK_USER_ID = system_role.FK_USER_ID
        WHERE user.USER_NAME = ? and system.ACTIVE != 0 )
        GROUP BY PK_SYSTEM_ID`;
        var overallStats = new Array();
        req.connection.query(sql, username, function (err, results) {
            //console.log(JSON.stringify(results));
            if (err) {
                console.log("SQL Error: " + err);
                res.status(200).send({
                    'message': 'SQL Error' + err
                });
            } else {
                // decide the overall status
                results.forEach(function (result) {
                    if ((result.totalFailed > 0) || (result.totalIncomplete > 0)) {
                        overallStats.push(result.SYSTEM + " || " + result.PK_SYSTEM_ID + " | Fail");
                    //} else if (result.totalAccepted > 0) {
                    //    overallStats.push(result.SYSTEM + " || " + result.PK_SYSTEM_ID + " | Risk Accepted");
                    } else {
                        overallStats.push(result.SYSTEM + " || " + result.PK_SYSTEM_ID + " | Pass");
                    }
                });
                //console.log("Stats " + overallStats);
                res.render('pages/mySystemsView', {
                    config: config,
                    username: username,
                    'stats': overallStats,
                    passedTests: 0,
                    incompleteTests: 0,
                    failedTests: 0,
                    riskAcceptedTests: 0,
                    manualTests: 0,
                    automatedTests: 0,
                    inheritedTests: 0,
                    totalTests: 0,
                    passedControls: 0,
                    incompleteControls: 0,
                    failedControls: 0,
                    acceptedControls: 0,
                    totalControls: 0,
                });
            }
        });
    });

    router.post('/resetWorkitemStatus', function (req, res) {
        
        var workitemID = req.body.workitemID;

        console.log("WorkItemID: " + workitemID);
        
        coreFunctions.resetWorkitemStatus(req.connection, workitemID, function (results) {

            if (results == 'Error') {

                res.status(400).send({
                    'message': 'SQL Error' + err
                });

            } else {

                res.status(200).send({
                    'message': 'Success',
                    'data': results
                });
            }
        });
    });

    // show the user the systems they have a system role in, and the overall status
    router.get('/exports', userRestrict.restrict, function (req, res) {
        var username = req.session.passport.user.username;
        coreFunctions.getLocalSystems(req.connection, systems => {
            res.render('pages/exportfindings', {
                config: config,
                username: username,
                systems: systems
            });
        });
    });

    return router;
}

module.exports = appRouter;
