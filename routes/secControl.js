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

var appRouter = function(config){

var express = require('express');
var router = express.Router();

var userRestrict = require('./userRestrict');

/* GET securityControls page. */
router.get('/controls', userRestrict.restrict, function (req, res) {
    var sql = "SELECT PK_SECURITY_CONTROL_ID, NAME, FAMILY, TITLE, PRIORITY, BASELINE_IMPACT FROM security_control";
    req.connection.query(sql, function (err, results) {
        if (err) {
            console.log("SQL Error: " + err);
        } else {
            res.render('pages/securityControls', {
                config:config,
                controls: results
            });
        }
    });
});

/* populate security controls modal */
router.get('/getControlInfo', userRestrict.siteAdminRestrictWCode, function (req, res) {
    let controlID = req.query.controlID; //Validate this
    let sql = "SELECT * FROM security_control WHERE PK_SECURITY_CONTROL_ID = ?";
    req.connection.query(sql, [controlID], function (err, results) {
        if (err) {
            console.log("SQL Error: " + err + sql);
            res.status(200).send({
                'message': 'Error'
            });
        } else {
            res.status(200).send({
                'message': 'Success',
                'data': results
            });
        }
    });
});

/* delete a selected security control */
router.post('/deleteControl', userRestrict.siteAdminRestrict, function (req, res) {
    let controlID = parseInt(req.body.controlID);
    if (coreFunctions.isValid(controlID)) { 
        let sql = "DELETE FROM security_control WHERE PK_SECURITY_CONTROL_ID = ?;";
        req.connection.query(sql, [controlID], function (err, result) {
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

/* Update a security control record selected on the controls page */
router.post('/updateControl', userRestrict.siteAdminRestrict, function (req, res) {
    let controlID = parseInt(req.body.controlID);
    let controlName = req.body.controlName;
    let family = req.body.family;
    let title = req.body.title;
    let priority = req.body.priority;
    let baselineImpact = req.body.baselineImpact;
    let description = req.body.description;
    let supplementalGuidance = req.body.supplementalGuidance;
    let related = req.body.related;

    if (coreFunctions.isValid(controlID)) { 
        let sql_2 = "UPDATE security_control SET NAME = ?, FAMILY = ?, TITLE = ?, PRIORITY = ?, BASELINE_IMPACT = ?, DESCRIPTION = ?, SUPPLEMENTAL_GUIDANCE = ?, RELATED_CONTROLS = ? WHERE PK_SECURITY_CONTROL_ID = ?;";
        req.connection.query(sql_2, [controlName, family, title, priority, baselineImpact, description, supplementalGuidance, related, controlID], function (err_2, result_2) {
            if (err_2) {
                console.log('SQL ERR: ' + err_2);
                res.send('SQL Error');  
            } else {
                res.send(result_2.affectedRows + ' record updated.');
            }
        });
    } else {
        res.send('Bad Inputs')
    }
});
return router;
}
module.exports = appRouter;
