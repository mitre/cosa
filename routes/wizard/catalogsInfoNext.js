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
    /////////    CATALOG INFO. NEXT    ////////////
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////

    router.post('/catalogsInfoNext', userRestrict.restrict, function (req, res) {

        // Format of passed value:
        // Catalogs: [{"PK_CATALOG_DEFAULT_ID":0,"ACTIVE":false},
        //            {"PK_CATALOG_DEFAULT_ID":1,"ACTIVE":false},
        //            {"PK_CATALOG_DEFAULT_ID":2,"ACTIVE":true}]

        var systemId = req.session.wizard_systemId;
        var catalogs = JSON.parse(req.body.catalogs);

        var atleastOneSelected = false
        for (var c in catalogs) {
            console.log(c)
            if (catalogs[c].ACTIVE == true) {
                atleastOneSelected = true;
                break;
            }

        }
        if(atleastOneSelected){
        coreFunctions.getCatalogs(req.connection, 'SYSTEM', systemId, 1, function (resultsSOC) {

            console.log("Applicable catalogs: " + JSON.stringify(resultsSOC));

            let catalogIdsToAdd = [];
            let catalogIdsToRemove = [];

            catalogIdsToAdd.push("-1");
            catalogIdsToRemove.push("-1");

            for (var i = 0; i < catalogs.length; i++) {

                if (catalogs[i].ACTIVE == true) {

                    // Is the catalog in the set of system catalogs.
                    if (!coreFunctions.jsonContains(resultsSOC, "PK_CATALOG_DEFAULT_ID", catalogs[i].PK_CATALOG_DEFAULT_ID)) {

                        // If it is not then add the catalogId the add list.
                        catalogIdsToAdd.push(catalogs[i].PK_CATALOG_DEFAULT_ID);

                    }

                } else {

                    // Is the catalog in the set of current system catalogs.
                    if (coreFunctions.jsonContains(resultsSOC, "PK_CATALOG_DEFAULT_ID", catalogs[i].PK_CATALOG_DEFAULT_ID)) {

                        // If it is add the catalog id to the remove list.
                        catalogIdsToRemove.push(catalogs[i].PK_CATALOG_DEFAULT_ID);

                    }
                }
            }

            console.log("Cats to add: " + JSON.stringify(catalogIdsToAdd));
            console.log("Cats to remove: " + JSON.stringify(catalogIdsToRemove));

            // Remove the catalogs in the remove list from the system's tests.
            let sql = `UPDATE system_control_test 
                       SET APPLICABLE = 0
                       WHERE FK_SYSTEM_ID = ? AND FK_CATALOG_ID IN (?) `;

            req.connection.query(sql, [systemId, catalogIdsToRemove], function (err, result) {

                if (err) {

                    console.log('Error updating catalogs (setting not applicable): ' + systemId + ":" + err);
                    res.status(500).send('Error updating catalogs (setting not applicable): ' + systemId + ":" + err);

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

                            // Add the catalogs in the add list to the system's tests if the categorization matches.
                            var sql2 = `UPDATE system_control_test 
                                SET APPLICABLE = 1
                                WHERE FK_SYSTEM_ID = ? AND FK_CATEGORIZATION_ID <= ? AND FK_CATALOG_ID IN (?)`;

                            req.connection.query(sql2, [systemId, categorizationId, catalogIdsToAdd], function (err2, result2) {

                                if (err2) {

                                    console.log('Error updating catalogs (setting applicable): ' + systemId + ":" + err2);
                                    res.status(500).send('Error updating catalogs (setting applicable): ' + systemId + ":" + err2);

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
    } else {
        res.status(500).send('Must select atleast one catalog');
    }
    });

    return router;

};

module.exports = appRouter;
