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
    var encoder = require('encoder.js');
    var userRestrict = require('./userRestrict');
    var coreFunctions = require('./coreFunctions.js');

    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    /////////            ALL           ////////////
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////

    router.get('/*', function (req, res, next) {
        req.session.wizard_completed = (req.session.wizard_completed) ? req.session.wizard_completed : [];
        res.locals.wizard_completed = req.session.wizard_completed;
        next();
    });

    router.post('/*', function (req, res, next) {
        next();
    });

    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    /////////        MANAGE SYSTEMS        ////////
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////

    // The user has chosen to manage a system through the WIZARD interface.
    // Present the user with a list of ACTIVE and INACTIVE systems to choose one.

    router.get('/manageSystem', userRestrict.restrict, function (req, res) {

        req.session.wizard_completed.push('manageSystem');
        req.session.wizard_completed.push('all');

        coreFunctions.getLocalSystems(req.connection, function (results) {
            res.render('pages/wizard/manageSystems', {
                systems: results
            });
        });
    });

    router.post('/goManageSystem', userRestrict.restrict, function (req, res) {
        // incoming form data: selectedSystemId
        var selectedSystemID = req.body.selectedSystemID;

        // set req.session.wizard_systemId to this system id
        req.session.wizard_systemId = selectedSystemID;

        //console.log('selectedSystemID = ' + selectedSystemID);

        res.send('Success');
    });

    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    /////////        ADD SYSTEM        ////////////
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////

    // The user has chosen to add a new system, so no system information is available (configuration, etc.) unless
    // we have arrived here again, after the system has been created by the wizard.
    router.get('/addSystem', userRestrict.restrict, function (req, res) {

        req.session.wizard_completed.push('addSystem');

        // Params: systemId
        //console.log()
        let systemId = req.session.wizard_systemId;
        //console.log("Session System ID: "+systemId);

        coreFunctions.getTemplates(req.connection, function (results) {

            coreFunctions.getCategorizations(req.connection, function (results2) {

                coreFunctions.getLocalSystems(req.connection, function (results4) {

                    // If the systemId exists, then this system has already completed this step and the user
                    // has returned to potentially perform an update.
                    // For example: template_list = [{"PK_TEMPLATE_DEFAULT_ID":1,"NAME":"OC"},{"PK_TEMPLATE_DEFAULT_ID":2,"NAME":"IRS"}];
                    //              config = [{"PK_SYSTEM_ID":1,"NAME":"Hello World","ACRONYM":"HW","CATEGORIZATION_NAME":"MODERATE",
                    //                         "DESCRIPTION":"Web application for testing MITRE cosa application","HIGH_VALUE_ASSET":0}]
                    if (systemId != null) {

                        coreFunctions.getSystemConfiguration(req.connection, systemId, encoder, function (results3) {

                            console.log("systemCfg: " + JSON.stringify(results3));
                            res.render('pages/wizard/addSystem', {

                                template_list: results,
                                categorizations: results2,
                                systemConfig: results3,
                                system_list: results4
                            });
                        });
                    } else {

                        res.render('pages/wizard/addSystem', {

                            template_list: results,
                            categorizations: results2,
                            systemConfig: null,
                            system_list: results4
                        });
                    }
                });
            });
        });
    });

    router.post('/updateSystemResults', function (req, res) {

        coreFunctions.updateResults(req.connection, req.session.wizard_systemId, function (results) {

            if (results != "Success") {

                res.status(500).send(results);

            } else {

                // Reset system and template ids in the session.
                req.session.wizard_systemId = null;
                req.session.wizard_templateId = null;

                res.status(200).send(results);

            }
        });
    });

    router.post('/deploySystem', function (req, res) {

        coreFunctions.getSystemConfiguration(req.connection, req.session.wizard_systemId, encoder, function (results) {

            if (results[0].ACTIVE == 0) {

                coreFunctions.deploySystem(req.connection, req.session.wizard_systemId, function (deployResult) {

                    if (deployResult != "Success") {

                        res.status(500).send(deployResult);

                    } else {

                        // Reset system and template ids in the session.
                        req.session.wizard_systemId = null;
                        req.session.wizard_templateId = null;

                        res.status(200).send(deployResult);

                    }
                });

            } else {

                // System is already deployed.
                res.status(200).send("Already Deployed");

            }
        });
    });

    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    //////             CATALOG               //////
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////

    router.get('/catalog', userRestrict.restrict, function (req, res) {

        req.session.wizard_completed.push('catalog');

        var systemId = req.session.wizard_systemId;
        var systemAcronym = ''; // default
        var templateId = req.session.wizard_templateId;
        console.log(systemId);
        console.log(templateId);

        coreFunctions.getSystemConfiguration(req.connection, systemId, null, function (resultsSysCnfg) {
            systemAcronym = resultsSysCnfg[0].ACRONYM;

            // Get the catalogs
            coreFunctions.getCatalogs(req.connection, 'SYSTEM', systemId, null, function (resultsOC) {

                coreFunctions.getCatalogs(req.connection, 'SYSTEM', systemId, 1, function (resultsSOC) {

                    let catalogResults = [];

                    for (var i = 0; i < resultsOC.length; i++) {

                        let catalogEntry = resultsOC[i];

                        // Is the catalog in the set of system catalogs?
                        // If it is then mark ACTIVE true, if not mark ACTIVE false
                        if (coreFunctions.jsonContains(resultsSOC, "PK_CATALOG_DEFAULT_ID", catalogEntry.PK_CATALOG_DEFAULT_ID)) {

                            catalogEntry.ACTIVE = true;

                        } else {

                            catalogEntry.ACTIVE = false;

                        }

                        catalogResults.push(catalogEntry);

                    }

                    res.render('pages/wizard/catalog', {

                        // Format of passed values:
                        // Catalogs: [{"PK_CATALOG_DEFAULT_ID":0,"NAME":"SYSTEM","ABV":"SYS","ORGANIZATION":0,"DESCRIPTION":null,"ACTIVE":false},
                        //            {"PK_CATALOG_DEFAULT_ID":1,"NAME":"National Institute of Standards and Technology 800-53","ABV":"NIST 800-53","ORGANIZATION":0,"DESCRIPTION":null,"ACTIVE":false},
                        //            {"PK_CATALOG_DEFAULT_ID":2,"NAME":"Acceptable Risk Safeguards","ABV":"COSA","ORGANIZATION":0,"DESCRIPTION":null,"ACTIVE":true}]
                        catalogs: catalogResults,
                        systemAcronym: systemAcronym

                    });
                });
            });
        });
    });

    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    //////           INHERITANCE             //////
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////

    router.get('/inheritance', userRestrict.restrict, function (req, res) {
        req.session.wizard_completed.push('inheritance');

        let systemId = req.session.wizard_systemId;
        var systemAcronym = ''; //default

        coreFunctions.getSystemConfiguration(req.connection, systemId, null, function (resultsSysCnfg) {
          systemAcronym = resultsSysCnfg[0].ACRONYM;

            // Gather the inhertiance information for the inheritance wizard step.
            coreFunctions.getInheritances(req.connection, systemId, null, function (resultsI) {

                coreFunctions.getInheritances(req.connection, systemId, 1, function (resultsAI) {
                    console.log("Possible inheritance: " + JSON.stringify(resultsI));
                    console.log("Applicable inheritance: " + JSON.stringify(resultsAI));
                    let inheritanceResults = [];

                    for (var i = 0; i < resultsI.length; i++) {

                        let inheritanceEntry = resultsI[i];

                        // Is the inheritance in the set of system inheritances.
                        // If it is then mark ACTIVE true, if not mark ACTIVE false
                        if (coreFunctions.jsonContains(resultsAI, "PK_SYSTEM_ID", inheritanceEntry.PK_SYSTEM_ID)) {

                            inheritanceEntry.ACTIVE = true;

                        } else {

                            inheritanceEntry.ACTIVE = false;
                        }

                        inheritanceResults.push(inheritanceEntry);

                    }
                    console.log("inheritanceResults : ... " + JSON.stringify(inheritanceResults));

                    res.render('pages/wizard/inheritance', {

                        // Format of passed values:
                        // Inheritances: [{"PK_SYSTEM_ID":36,"NAME":"OCISO","ACTIVE":true}]
                        inheritances: inheritanceResults,
                        systemAcronym: systemAcronym

                    });
                });
            });
        });
    });

    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    /////////////   COMPONENT BASIC  //////////////
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////

    router.get('/componentsBasic', userRestrict.restrict, function (req, res) {

        req.session.wizard_completed.push('componentsBasic');

        let systemId = req.session.wizard_systemId;

        console.log('Components system Id:' + systemId);

        var systemAcronym = ''; //default

        coreFunctions.getSystemConfiguration(req.connection, systemId, null, function (resultsSysCnfg) {
          systemAcronym = resultsSysCnfg[0].ACRONYM;

        // Gather the component information for the components wizard step.
        coreFunctions.getComponentTypes(req.connection, systemId, null, function (resultsC) {

            console.log("Possible system components: " + JSON.stringify(resultsC));

            coreFunctions.getComponentTypes(req.connection, systemId, 1, function (resultsAC) {

                console.log("Applicable system components: " + JSON.stringify(resultsAC));

                let componentResults = [];

                for (var i = 0; i < resultsC.length; i++) {

                    let componentEntry = resultsC[i];

                    // Is the component in the set of system components.
                    // If it is then mark ACTIVE true, if not mark ACTIVE false
                    if (coreFunctions.jsonContains(resultsAC, "PK_COMPONENT_TYPE_DEFAULT_ID", componentEntry.PK_COMPONENT_TYPE_DEFAULT_ID)) {

                        componentEntry.ACTIVE = true;

                    } else {

                        componentEntry.ACTIVE = false;
                    }

                    componentResults.push(componentEntry);

                }

                console.log("Component results: " + JSON.stringify(componentResults));

                res.render('pages/wizard/componentsBasic', {

                    // Format of components:
                    // Components: [{"PK_COMPONENT_TYPE_DEFAULT_ID":1,"NAME":"Server","DESCRIPTION":"XYZ...","ACTIVE":true}]
                    components: componentResults,
                    systemAcronym: systemAcronym
                });
            });
        });
      });
    });

    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    //////////////   SYSTEM ROLES  ////////////////
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////

    router.get('/systemRoles', userRestrict.restrict, function (req, res) {
        req.session.wizard_completed.push('systemRoles');
        var username = req.session.passport.user.username;
        let systemId = req.session.wizard_systemId;
        var systemAcronym = ''; //default

        coreFunctions.getSystemConfiguration(req.connection, systemId, null, function (resultsSysCnfg) {
            systemAcronym = resultsSysCnfg[0].ACRONYM;
            coreFunctions.getSystemRolesDescForName(req.connection, 'User', function (userDesc) {
                coreFunctions.getSystemRolesDescForName(req.connection, 'Admin', function (adminDesc) {
                    coreFunctions.getSystemRolesDescForName(req.connection, 'Evidence Approver', function (eaDesc) {
                        coreFunctions.getSystemRolesDescForName(req.connection, 'Evidence Provider', function (epDesc) {
                            coreFunctions.getUserIdForName(req.connection, username, function (userId) {
                                //console.log(JSON.stringify(userId));
                                coreFunctions.getUsers(req.connection, function (results) {
                                    res.render('pages/wizard/systemRoles', {
                                        'users': results,
                                        'user': userId,
                                        'userDesc': userDesc,
                                        'adminDesc': adminDesc,
                                        'epDesc': epDesc,
                                        'eaDesc': eaDesc,
                                        systemAcronym: systemAcronym
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });

    router.get('/getSystemRoleInfo', userRestrict.restrict, function (req, res) {
        let systemID = req.session.wizard_systemId;
        coreFunctions.getSystemRolesForSystemId(req.connection, systemID, function (results) {
            //console.log(JSON.stringify(results));
            if (results == null) {
                console.log("No systemRoles exist.");
                res.status(401).send({
                    'message': 'No systemRoles exist'
                });
            } else {
                res.status(200).send({
                    'message': 'Success',
                    'data': results
                });
            }
        });
    });

    router.post('/systemRoles', userRestrict.restrict, function (req, res) {
        // incoming form data: 4 PK_USER_IDs
        var evidenceProviderIDs = req.body.evidenceProviders;//req.body['evidenceProviders[]'];
        var evidenceProviderRoleID; // from system_roles_default table
        var evidenceApproverIDs = req.body.evidenceApprovers; //req.body['evidenceApprovers[]'];
        var evidenceApproverRoleID; // from system_roles_default table
        var userIDs = req.body.users; //req.body['users[]'];
        var userRoleID; // from system_roles_default table
        var adminIDs = req.body.admins;//req.body['admins[]'];
        var adminRoleID; // from system_roles_default table
        console.log(req.body);

        var newSystemID = req.session.wizard_systemId;

        // drop and recreate roles, otherwise risk a crash due to duplicate entries.
        var dropSQL = "DELETE FROM system_role where FK_SYSTEM_ID = ?";
        req.connection.query(dropSQL, [newSystemID], function (err_drop, result_drop) {
            if (err_drop) {
                console.log('SQL ERR: ' + JSON.stringify(err_drop));
                res.send('SQL Error');
            }
        });
        // Now do inserts of roles for this system

        // ADD THE ROLE to System_Role table for this New System and the selected UserId
        // Get the Role IDs for the default roles in System_Roles_Default table
        coreFunctions.getSystemRoles(req.connection, function (result_1) {
            var sql_2 = "INSERT INTO system_role (FK_SYSTEM_ID, FK_USER_ID, FK_ROLE_ID) VALUES (?,?,?)";
            result_1.forEach(function (role) {

                if (role.NAME.indexOf('Evidence Provider') != '-1') {
                    // add each evidenceProvider from the evidenceProviders selected on the GUI
                    if (evidenceProviderIDs != null) {
                        evidenceProviderRoleID = role.PK_ROLE_ID;
                        for (var i = 0, ep; ep = evidenceProviderIDs[i]; i++) {
                            // insert into System_Role table
                            req.connection.query(sql_2, [newSystemID, ep, evidenceProviderRoleID], function (err_2, result_2) {
                                if (err_2) {
                                    console.log('Cannot insert a duplicate entry' + JSON.stringify(err_2));
                                    res.status(401).send('Cannot insert a duplicate entry' + err_2);
                                }
                            });
                        } // end for loop
                    } //end if != null
                }

                if (role.NAME.indexOf('Evidence Approver') != '-1') {
                    // add each evidenceApprover from the evidenceApprovers selected on the GUI
                    if (evidenceApproverIDs != null) {
                        evidenceApproverRoleID = role.PK_ROLE_ID;
                        for (var i = 0, ep; ep = evidenceApproverIDs[i]; i++) {
                            // insert into System_Role table
                            req.connection.query(sql_2, [newSystemID, ep, evidenceApproverRoleID], function (err_2, result_2) {
                                if (err_2) {
                                    console.log('Cannot insert a duplicate entry' + JSON.stringify(err_2));
                                    res.status(401).send('Cannot insert a duplicate entry' + err_2);
                                }
                            });
                        } // end for loop
                    } //end if != null
                }

                if (role.NAME.indexOf('Admin') != '-1') {
                    // add each admin from the admins selected on the GUI
                    if (adminIDs != null) {
                        adminRoleID = role.PK_ROLE_ID;
                        for (var i = 0, a; a = adminIDs[i]; i++) {
                            // insert into System_Role table
                            req.connection.query(sql_2, [newSystemID, a, adminRoleID], function (err_2, result_2) {
                                if (err_2) {
                                    console.log('Cannot insert a duplicate entry' + JSON.stringify(err_2));
                                    res.status(401).send('Cannot insert a duplicate entry' + err_2);
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
                            req.connection.query(sql_2, [newSystemID, uId, userRoleID], function (err_2, result_2) {
                                if (err_2) {
                                    console.log('Cannot insert a duplicate entry' + JSON.stringify(err_2));
                                    res.status(401).send('Cannot insert a duplicate entry' + err_2);
                                }
                            });
                        } // end for loop
                    } //end if != null
                }

            }); //end for each roles

            res.status(200).send("System Roles, saved properly!");
        }); // end result_1

    });

    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    /////////      SYSTEM REVIEW       ////////////
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////

    /* GET System Review ejs page */
    router.get('/systemReview', userRestrict.restrict, function (req, res) {

        req.session.wizard_completed.push('systemReview');
        var systemID = req.session.wizard_systemId;
        var systemAcronym = ''; //default

        coreFunctions.getSystemConfiguration(req.connection, systemID, null, function (resultsSysCnfg) {
            systemAcronym = resultsSysCnfg[0].ACRONYM;

            coreFunctions.getSystemConfigurationWithNames(req.connection, systemID, encoder, function (results) {
                res.render('pages/wizard/systemReview', {
                    system: results[0],
                    systemAcronym: systemAcronym
                });
            });
        });
    });

    /* GET System Roles info for review page*/
    router.get('/getSystemRolesForReviewPage', function (req, res) {
        let systemID = req.session.wizard_systemId;
        coreFunctions.getSystemRolesForSystemId(req.connection, systemID, function (results) {
            res.status(200).send({
                'message': 'Success',
                'data': results
            });
        });
    });

    // GET System Inheritance info for review page
    router.get('/getInheritanceForReviewPage', function (req, res) {
        let systemID = req.session.wizard_systemId;
        coreFunctions.getInheritances(req.connection, systemID, 1, function (results) {
            res.status(200).send({
                'message': 'Success',
                'data': results
            });
        });
    });

    // GET System Inheritance info for review page
    router.get('/getUntestedSecurityControlsForReviewPage', function (req, res) {
        let systemID = req.session.wizard_systemId;
        coreFunctions.getTotalSecurityControlsCount(req.connection, function (total) {
            coreFunctions.getUntestedSecurityControlsCount(req.connection, systemID, function (untested) {
                coreFunctions.getUntestedControls(req.connection, systemID, function (results) {
                    res.status(200).send({
                        'message': 'Success',
                        'total': total,
                        'untested': untested,
                        'data': results
                    });
                });
            });
        });
    });
    
    /* GET System Catalogs info for review page*/
    router.get('/getCatalogsForReviewPage', function (req, res) {
        let systemID = req.session.wizard_systemId;
        coreFunctions.getCatalogs(req.connection, 'SYSTEM', systemID, 1, function (results) {
            console.log("CATALOGS ARE: " + JSON.stringify(results));
            res.status(200).send({
                'message': 'Success',
                'data': results
            });
        });
    });

    /* GET System Components info for review page*/
    router.get('/getComponentsForReviewPage', function (req, res) {
        let systemID = req.session.wizard_systemId;

        coreFunctions.getComponentsForSystemId(req.connection, systemID, 1, function (results) {

            console.log("COMPONENTS ARE: " + JSON.stringify(results));
            res.status(200).send({
                'message': 'Success',
                'data': results
            });
        });
    });

    router.post('/systemReview', userRestrict.restrict, function (req, res) {
        // incoming form data: Catalog + Inheritance
        // console.log(req.body);
        res.send('success');
    });


    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    ///////// COMPONENTS CONFIGURATION ////////////
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////

    /* GET components ejs page */
    router.get('/componentConfig', function (req, res) {

        req.session.wizard_completed.push('componentConfig');
        let systemId = req.session.wizard_systemId;
        // This call gets the active components for the matching system id.
        coreFunctions.getComponentTypes(req.connection, systemId, null, function (results) {
            // results must contain: PK_COMPONENT_TYPE_DEFAULT_ID & COMPONENT_TYPE
            res.render('pages/wizard/components', {
                'components': results
            });
        });
    });

    /* GET active components table data*/
    router.get('/API/componentActiveSystemComponents', function (req, res) {
        let systemId = req.session.wizard_systemId;
        coreFunctions.getComponentsForSystemIdAndTypeId(req.connection, systemId, null, 1, function (results) {
            // results must contain: PK_COMPONENT_PRODUCT_DEFAULT_ID, COMPONENT_TYPE, COMPONENT_PRODUCT, & DESCRIPTION
            res.send(results);
        });
    });

    /* GET non-active components table data*/
    router.get('/API/componentNonActiveSystemComponents', function (req, res) {
        let systemId = req.session.wizard_systemId;
        coreFunctions.getComponentsForSystemIdAndTypeId(req.connection, systemId, null, 0, function (results) {
            // results must contain: PK_COMPONENT_PRODUCT_DEFAULT_ID, COMPONENT_TYPE, COMPONENT_PRODUCT, & DESCRIPTION
            res.send(results);
        });
    });

        /* GET list component products for a type of component */
        router.get('/API/componentTypesAvailable', function (req, res) {
            let systemId = req.session.wizard_systemId;
            // results must contain: PK_COMPONENT_TYPE_DEFAULT_ID & NAME
            coreFunctions.getComponentsForSystemId(req.connection, systemId, 0, function (results) {
                res.send(results);
            });
        });

    /* GET list component products for a type of component */
    router.get('/API/componentTypeProducts', function (req, res) {
        let componentTypeId = req.query.componentTypeId;
        let systemId = req.session.wizard_systemId;
        // results must contain: PK_COMPONENT_PRODUCT_DEFAULT_ID & NAME
        coreFunctions.getComponentsForSystemIdAndTypeId(req.connection, systemId, componentTypeId, 0, function (results) {
            res.send(results);
        });
    });

    /* POST Add a new system component to the System*/
    /* This really just marks the matching test as applicable. */
    router.post('/API/componentAdd', function (req, res) {

        let systemId = req.session.wizard_systemId;
        let componentTypeId = req.body.componentTypeId;
        let componentProductId = req.body.componentProductId;

        // Get the componentId for this component type and product ids.
        let sql = `SELECT *
        FROM components
        WHERE FK_TYPE_ID = ? and FK_PRODUCT_ID = ?`;

        req.connection.query(sql, [componentTypeId, componentProductId], function (err, results) {

            if (err) {

                console.log('SQL ERR: ' + err);
                res.status(500).send(err);

            } else {

                // Get the componentId for this component type and product ids.
                let sql1 = `SELECT FK_CATEGORIZATION_ID 
                            FROM system
                            WHERE PK_SYSTEM_ID = ?`;

                req.connection.query(sql1, [systemId], function (err1, results1) {

                    if (err1) {

                        console.log('SQL ERR: ' + err1);
                        res.status(500).send(err1);

                    } else {

                        // We now have the systemId, componentId, and categorizationId to match the test.
                        let componentId = results[0].PK_COMPONENT_ID;
                        let categorizationId = results1[0].FK_CATEGORIZATION_ID;

                        // Using the systemId, the componentId, and the categorizationId, set the matching test in the
                        // system_control_test table as applicable.
                        var sql2 = `UPDATE system_control_test 
                                    SET APPLICABLE = 1
                                    WHERE FK_SYSTEM_ID = ? AND FK_COMPONENT_ID = ? AND FK_CATEGORIZATION_ID <= ?`;

                        req.connection.query(sql2, [systemId, componentId, categorizationId], function (err2, results2) {
                            if (err2) {
                                console.log('SQL ERR: ' + err2);
                                res.status(500).send(err2);
                            } else {
                                console.log('Completed: ' + systemId, " : " + componentId);
                                res.status(200).send('Success');
                            }
                        });
                    }
                });
            }
        });
    });

    /* POST Remove a component from the System */
    router.post('/API/componentRemove', function (req, res) {
        let systemId = req.session.wizard_systemId;
        let componentId = req.body.componentId;

        // Remove the component from the components table.
        var sql = `UPDATE system_control_test
        SET APPLICABLE = 0
        WHERE FK_SYSTEM_ID = ? AND FK_COMPONENT_ID = ?`;

        req.connection.query(sql, [systemId, componentId], function (err, results) {
            if (err) {

                console.log('SQL ERR: ' + err);
                res.status(500).send(err);

            } else {

                console.log('Component Removed: ' + componentId);
                res.status(200).send("Success");

            }
        });
    });

    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    /////////     TEST ASSOCIATION     ////////////
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////

    /* GET test applicability ejs page */
    router.get('/testApplicability', function (req, res) {

        req.session.wizard_completed.push('testApplicability');
        res.render('pages/wizard/testApplicability');
    });

    router.get('/API/systemControlTests', function (req, res) {

        coreFunctions.getTestsBySystem(req.connection, req.session.wizard_systemId, function (results) {

            res.send(results);
        });

    });

    router.post('/API/systemControlTestsSetStatus', function (req, res) {

        let testControlId = req.body.testControlId;
        let status = (req.body.status == 'true') ? 1 : 0;

        // Don't need to worry about categorization here because the user is forcing this test to be applicable or not.
        let sql = `UPDATE system_control_test SET APPLICABLE = ? WHERE PK_SYSTEM_CONTROL_TEST_ID = ? AND FK_SYSTEM_ID = ?;`;
        req.connection.query(sql, [status, testControlId, req.session.wizard_systemId], function (err, results) {
            if (err) {
                console.log('SQL ERR: ' + err);
                res.status(500).send("Error");
            } else {
                res.status(200).send("Success");
            }
        });
    });

    return router;

};

module.exports = appRouter;
