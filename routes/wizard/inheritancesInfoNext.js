var appRouter = function (config) {

    var express = require('express');
    var router = express.Router();
    var userRestrict = require('../userRestrict');
    var coreFunctions = require('../coreFunctions.js');


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
    /////////  INHERITANCE INFO. NEXT  ////////////
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////

    router.post('/inheritancesInfoNext', userRestrict.restrict, function (req, res) {

        // Format of passed value:
        // Inheritances: [{"PK_SYSTEM_ID":36,"NAME":"OCISO","ACTIVE":true}]

        var systemId = req.session.wizard_systemId;
        var inheritances = JSON.parse(req.body.inheritances);

        console.log("Inheritances: " + JSON.stringify(inheritances));

        coreFunctions.getInheritances(req.connection, systemId, 1, function (resultsAI) {

            console.log("Applicable inheritances: " + JSON.stringify(resultsAI));

            let inhertiancesToAdd = [];
            let inheritancesToRemove = [];

            inhertiancesToAdd.push("-1");
            inheritancesToRemove.push("-1");

            for (var i = 0; i < inheritances.length; i++) {

                if (inheritances[i].ACTIVE == true) {

                    // Is the system in the set of systems inherited from.
                    if (!coreFunctions.jsonContains(resultsAI, "PK_SYSTEM_ID", inheritances[i].DEPENDS_ON_SYSTEM_ID)) {

                        // If it is not then add systemId to the inheritance add list.
                        inhertiancesToAdd.push(inheritances[i].DEPENDS_ON_SYSTEM_ID);

                    }

                } else {

                    // Is the system in the set of systems currently inherited from.
                    if (coreFunctions.jsonContains(resultsAI, "PK_SYSTEM_ID", inheritances[i].DEPENDS_ON_SYSTEM_ID)) {

                        // If it is add the system id to the inheritance remove list.
                        inheritancesToRemove.push(inheritances[i].DEPENDS_ON_SYSTEM_ID);

                    }
                }
            }
            console.log("Add: " + JSON.stringify(inhertiancesToAdd));
            console.log("Remove: " + JSON.stringify(inheritancesToRemove));

            // Remove the inhertiances in the remove list from the system's tests.
            // Mark all tests that currently inherit from the system (DEPEND_ON_SYSTEM indicates this) as not applicable.
            let sql = `UPDATE system_control_test 
                       SET APPLICABLE = 0 
                       WHERE FK_SYSTEM_ID = ? AND DEPENDS_ON_SYSTEM_ID IN (?)`;

            req.connection.query(sql, [systemId, inheritancesToRemove], function (err, result) {

                if (err) {

                    console.log('Error updating inheritances (setting not applicable): ' + systemId + ":" + err);
                    res.status(500).send('Error updating inheritances (setting not applicable): ' + systemId + ":" + err);

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

                            // We now have the categorizationId to match the test.
                            let categorizationId = results1[0].FK_CATEGORIZATION_ID;

                            // Add the inheritances in the add list to the system's tests.
                            // Mark all tests (with matching categorization) that can inherit from the system (DEPEND_ON_SYSTEM indicates this) as applicable.

                            var sql2 = `UPDATE system_control_test 
                                SET APPLICABLE = 1 
                                WHERE FK_SYSTEM_ID = ? AND FK_CATEGORIZATION_ID <= ? AND DEPENDS_ON_SYSTEM_ID IN (?)`;

                            req.connection.query(sql2, [systemId, categorizationId, inhertiancesToAdd], function (err2, result2) {

                                if (err2) {

                                    console.log('Error updating inheritances (setting applicable): ' + systemId + ":" + err2);
                                    res.status(500).send('Error updating inheritances (setting applicable): ' + systemId + ":" + err2);

                                } else {

                                    res.status(200).send({
                                        'message': 'Success'
                                    });
                                }
                            });
                        }
                    });
                }
            });
        });
    });

    return router;

};

module.exports = appRouter;
