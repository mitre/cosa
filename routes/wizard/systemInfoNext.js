var appRouter = function (config) {

    var express = require('express');
    var router = express.Router();
    var userRestrict = require('../userRestrict');

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
    /////////     SYSTEM INFO. NEXT    ////////////
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////

    function resetSystem(req, system, callback) {

        console.log("resetSystem");

        // set req.session.wizard_systemId to this system id
        req.session.wizard_systemId = system.id;

        system.id = req.session.wizard_systemId;

        var sql = `DELETE FROM system_control_test WHERE FK_SYSTEM_ID = ?`;

        req.connection.query(sql, [system.id], function (err, results) {

            if (err) {

                console.log('SQL ERR: ' + err);
                return callback(null);

            } else {

                var sql2 = `DELETE FROM template_system_map WHERE FK_SYSTEM_ID = ?`;

                req.connection.query(sql2, [system.id], function (err, results2) {

                    if (err) {

                        console.log('SQL ERR: ' + err);
                        return callback(null);

                    } else {

                        updateSystem(req.connection, system, function (results3) {

                            if (results3.affectedRows == 0) {

                                console.log('Error updating system: ' + system.id);
                                return callback(null);

                            } else {

                                buildSystemTests(req, system, function (results4) {

                                    if (results4 == null) {

                                        console.log('Error building system tests: ' + system.id);
                                        return callback(null);

                                    } else {

                                        return callback(results4);

                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    };

    function createSystem(req, system, callback) {

        console.log("createSystem");

        // This is a new system so insert it in the system table.
        var sql = `INSERT INTO system (NAME, ACRONYM, FK_CATEGORIZATION_ID, DESCRIPTION, HIGH_VALUE_ASSET) VALUES (?,?,?,?,?)`;
        req.connection.query(sql, [system.name, system.acronym, system.cat, system.desc, system.hva], function (err, results) {

            if (err) {

                console.log('SQL ERR: ' + err);
                return callback(null);

            } else {

                // set req.session.wizard_systemId to new system id that is created
                req.session.wizard_systemId = results.insertId;

                system.id = req.session.wizard_systemId;

                buildSystemTests(req, system, function (results2) {

                    if (results2 == null) {

                        console.log('Error building system tests: ' + system.id);
                        return callback(null);

                    } else {
                        return callback(results2);
                    }
                });
            }
        });
    }

    function updateSystem(connection, system, callback) {

        console.log("updateSystem...");

        // This is a new system so insert it in the system table.
        var sql = `UPDATE system SET NAME = ?, ACRONYM = ?, FK_CATEGORIZATION_ID = ?, 
                   DESCRIPTION = ?, HIGH_VALUE_ASSET = ? 
                   WHERE PK_SYSTEM_ID = ? `;

        connection.query(sql, [system.name, system.acronym, system.cat, system.desc, system.hva, system.id], function (err, results) {

            if (err) {
                console.log('SQL ERR: ' + err);
                return callback(null);
            } else {
                return callback(results);
            }
        });
    }

    function checkTestsForCategorization(req, system, callback) {

        // Set tests above this system's categorization level to not applicable.
        var sql = `UPDATE system_control_test SET system_control_test.APPLICABLE = 0
                   WHERE system_control_test.FK_SYSTEM_ID = ? AND system_control_test.FK_CATEGORIZATION_ID > ?;`;

        req.connection.query(sql, [system.id, system.cat], function (err, results) {

            if (err) {

                console.log('SQL ERR: ' + err);
                return callback(null);

            } else {

                return callback(results);

            }
        });
    }

    function buildSystemTests(req, system, callback) {

        console.log("buildSystemTests...");

        // Link the system and template chosen.
        var sql = `INSERT INTO template_system_map (FK_SYSTEM_ID, FK_TEMPLATE_ID) VALUES (?,?)`;
        req.connection.query(sql, [system.id, system.template], function (err, results) {

            if (err) {

                console.log('SQL ERR: ' + err);
                return callback(null);

            } else {

                req.session.wizard_templateId = system.template;

                // Copy all of the tests matched by the template over from the baseline for the system id.                  
                var sql2 = `CALL insertSystemTestsFromBaseline(?,?);`;

                req.connection.query(sql2, [system.id, system.template], function (err, results2) {
                    if (err) {
                        console.log('SQL ERR: ' + err);
                        return callback(null);
                    } else {

                        console.log("checking categorization...");
                        // Mark tests that are above this systems cateforization as not appliable
                        checkTestsForCategorization(req, system.id, function (results3) {

                            if (err) {
                                console.log('SQL ERR: ' + err);
                                return callback(null);
                            } else {
                                return callback(results3);
                            }
                        });
                    }
                });
            }
        });
    }

    router.post('/systemInfoNext', userRestrict.restrict, function (req, res) {

        var system = req.body;

        console.log(system.id);
        console.log(system.name);
        console.log(system.acronym);
        console.log(system.cat); // categorization_id
        console.log(system.template); // template_id
        console.log(system.hva); // high value asset: bool
        console.log(system.desc);

        if (system.id == null) {

            createSystem(req, system, function (results) {

                if (results == null) {

                    console.log('Error creating system: ' + system.id);
                    res.status(500).send('Error creating system: ' + system.id);

                } else {

                    res.status(200).send({
                        'message': 'Success',
                        'affectedRows': results.affectedRows
                    });
                }
            });

        } else {

            // There is a system id, which means this system already exists and this is an update.

            // First check if the template id has changed.
            // Get system template id and compare to system.template
            var sql = `SELECT FK_TEMPLATE_ID from template_system_map WHERE FK_SYSTEM_ID = ?`;
            req.connection.query(sql, [system.id], function (err, results2) {

                if (err) {

                    console.log('SQL ERR: ' + err);
                    res.send('err');

                } else {

                    let oldTemplateId = results2[0].FK_TEMPLATE_ID;

                    if (oldTemplateId == system.template) {

                        // If the template ids match then just upadate the system information.
                        updateSystem(req.connection, system, function (results3) {

                            if (results3 == null) {

                                console.log('Error updating system: ' + system.id);
                                res.status(500).send('Error updating system: ' + system.id);

                            } else {

                                res.status(200).send({
                                    'message': 'Success',
                                    'affectedRows': results3.affectedRows
                                });
                            }
                        });

                    } else {

                        // If the template id has changed, then the system must be reset and tests reloaded.
                        resetSystem(req, system, function (results4) {

                            if (results4 == null) {

                                console.log('Error resetting system: ' + system.id);
                                res.status(500).send('Error resetting system: ' + system.id);

                            } else {

                                res.status(200).send({
                                    'message': 'Success',
                                    'affectedRows': results4.affectedRows
                                });
                            }
                        });
                    }
                }
            });
        }
    });

    return router;

};

module.exports = appRouter;
