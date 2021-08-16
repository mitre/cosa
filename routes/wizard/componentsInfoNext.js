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
    /////////   COMPONENTS INFO. NEXT  ////////////
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////    

    router.post('/componentsInfoNext', userRestrict.restrict, function (req, res) {

        var systemId = req.session.wizard_systemId;

        // Format of passed value:
        // Components: [{"PK_COMPONENT_TYPE_DEFAULT_ID":1,"ACTIVE":true}]

        var componentTypes = JSON.parse(req.body.components);

        console.log("Components: " + JSON.stringify(componentTypes));

        // Get all of the generic (generic when productId = 0) components and their typeIds in thise system's tests.
        coreFunctions.getComponentsForSystemIdAndTypeId(req.connection, systemId, null, 1, function (resultsAC) {

            let componentsToAdd = [];
            let componentsToRemove = [];

            componentsToAdd.push("-1");
            componentsToRemove.push("-1");

            console.log("Applicable components: " + JSON.stringify(resultsAC));

            for (var i = 0; i < componentTypes.length; i++) {

                if (componentTypes[i].ACTIVE == true) {

                    // Is the component type currently not applicable to the system?
                    if (!coreFunctions.jsonContains(resultsAC, "PK_COMPONENT_TYPE_DEFAULT_ID", componentTypes[i].PK_COMPONENT_TYPE_DEFAULT_ID)) {

                        // Add the componentTypeId to the add list.
                        componentsToAdd.push(componentTypes[i].PK_COMPONENT_TYPE_DEFAULT_ID);

                    }

                } else {

                    // Is the component type applicable to the system?
                    if (coreFunctions.jsonContains(resultsAC, "PK_COMPONENT_TYPE_DEFAULT_ID", componentTypes[i].PK_COMPONENT_TYPE_DEFAULT_ID)) {

                        // If it is add the componentTypeId to the remove list.
                        componentsToRemove.push(componentTypes[i].PK_COMPONENT_TYPE_DEFAULT_ID);

                    }
                }
            }

            console.log("Add: " + JSON.stringify(componentsToAdd));
            console.log("Remove: " + JSON.stringify(componentsToRemove));

            // Mark all of the system's tests with components that match the componentId as not applicable.
            let sql = `UPDATE system_control_test 
                       INNER JOIN components ON components.PK_COMPONENT_ID = system_control_test.FK_COMPONENT_ID
                       SET APPLICABLE = 0 
                       WHERE system_control_test.FK_SYSTEM_ID = ? AND components.FK_TYPE_ID IN (?)`;

            req.connection.query(sql, [systemId, componentsToRemove], function (err, result) {

                if (err) {

                    console.log('Error updating components (setting not applicable): ' + systemId + ":" + err);
                    res.status(500).send('Error updating components (setting not applicable): ' + systemId + ":" + err);

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

                            // Mark all of the system's tests (where the categorization is correct) with components that match the componentId as applicable.
                            var sql2 = `UPDATE system_control_test 
                                INNER JOIN components ON components.PK_COMPONENT_ID = system_control_test.FK_COMPONENT_ID
                                SET APPLICABLE = 1 
                                WHERE system_control_test.FK_SYSTEM_ID = ? AND components.FK_PRODUCT_ID = 0 
                                AND system_control_test.FK_CATEGORIZATION_ID <= ? AND components.FK_TYPE_ID IN (?) `;

                            req.connection.query(sql2, [systemId, categorizationId, componentsToAdd], function (err2, result2) {

                                if (err2) {

                                    console.log('Error updating components (setting applicable): ' + systemId + ":" + err2);
                                    res.status(500).send('Error updating components (setting applicable): ' + systemId + ":" + err2);

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
