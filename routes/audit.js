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
    
    router.get('/auditreport', userRestrict.siteAdminRestrict, function (req, res) {
        res.render('pages/auditreport', {
            config: config
        });
    });

    router.get('/buildAuditReportTable', userRestrict.siteAdminRestrict, function (req, res) {
        var sql = `SELECT * FROM all_history`;
        req.connection.query(sql, function (err, results) {

            if (err) {
                console.log("SQL Error: " + err);
            } else {

                res.status(200).send({
                    'message': 'Success',
                    'data': results
                });
            }
        });
    });

    return router;

};

module.exports = appRouter;
